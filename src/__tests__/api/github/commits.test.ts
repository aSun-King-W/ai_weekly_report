// 集成测试: GET /api/github/commits
import { NextRequest } from 'next/server';

const mockFetch = jest.fn();
global.fetch = mockFetch;

let GET: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../app/api/github/commits/route.ts');
  GET = mod.GET;
});

function createMockRequest(authHeader: string | undefined, queryString: string): NextRequest {
  const headers = new Headers();
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }
  return {
    headers,
    url: `http://localhost:3000/api/github/commits?${queryString}`,
  } as unknown as NextRequest;
}

describe('GET /api/github/commits', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns 401 when no Authorization header', async () => {
    const request = createMockRequest(undefined, 'owner=facebook&repo=react');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('认证令牌');
  });

  it('returns 400 when owner is missing', async () => {
    const request = createMockRequest('Bearer valid-token', 'repo=react');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('owner');
  });

  it('returns 400 when repo is missing', async () => {
    const request = createMockRequest('Bearer valid-token', 'owner=facebook');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('repo');
  });

  it('returns 400 when both owner and repo are missing', async () => {
    const request = createMockRequest('Bearer valid-token', '');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns formatted commits on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          sha: 'abc123',
          commit: {
            message: 'feat: add new feature',
            author: { name: 'Dev', email: 'dev@test.com', date: '2024-01-15T10:00:00Z' },
          },
          html_url: 'https://github.com/facebook/react/commit/abc123',
        },
      ],
    });

    const request = createMockRequest('Bearer valid-token', 'owner=facebook&repo=react');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].sha).toBe('abc123');
    expect(body.data[0].message).toBe('feat: add new feature');
    expect(body.data[0].repository.name).toBe('react');
    expect(body.data[0].repository.owner).toBe('facebook');
  });

  it('returns empty array for empty repository (409)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: 'Git Repository is empty.' }),
    });

    const request = createMockRequest('Bearer valid-token', 'owner=empty&repo=repo');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('handles GitHub 404 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
    });

    const request = createMockRequest('Bearer valid-token', 'owner=nonexistent&repo=nope');
    const response = await GET(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('不存在');
  });

  it('passes date parameters to GitHub API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const request = createMockRequest(
      'Bearer valid-token',
      'owner=facebook&repo=react&since=2024-01-01T00:00:00Z&until=2024-01-07T23:59:59Z'
    );
    await GET(request);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('since=2024-01-01T00%3A00%3A00Z');
    expect(calledUrl).toContain('until=2024-01-07T23%3A59%3A59Z');
  });

  it('includes Cache-Control header on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const request = createMockRequest('Bearer valid-token', 'owner=facebook&repo=react');
    const response = await GET(request);

    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('max-age=');
  });
});
