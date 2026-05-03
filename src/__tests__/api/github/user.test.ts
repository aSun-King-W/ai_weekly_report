// 集成测试: GET /api/github/user
import { NextRequest } from 'next/server';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

let GET: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../app/api/github/user/route.ts');
  GET = mod.GET;
});

function createMockRequest(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }
  return { headers } as unknown as NextRequest;
}

describe('GET /api/github/user', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns 401 when no Authorization header', async () => {
    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('认证令牌');
  });

  it('returns 401 when header does not start with Bearer', async () => {
    const request = createMockRequest('Token invalid-format');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns formatted user data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        login: 'testuser',
        id: 12345,
        avatar_url: 'https://avatars.example.com/avatar',
        name: 'Test User',
        email: 'test@example.com',
        bio: 'A test user',
        location: 'Shanghai',
        public_repos: 10,
        followers: 100,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }),
    });

    const request = createMockRequest('Bearer valid-token');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.login).toBe('testuser');
    expect(body.data.name).toBe('Test User');
    expect(body.data.public_repos).toBe(10);
  });

  it('handles GitHub API 401 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Bad credentials',
    });

    const request = createMockRequest('Bearer invalid-token');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('认证失败');
  });

  it('handles GitHub API 404 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
    });

    const request = createMockRequest('Bearer valid-token');
    const response = await GET(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('不存在');
  });

  it('includes Cache-Control header on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        login: 'testuser',
        id: 12345,
        avatar_url: '',
        name: 'testuser',
        email: null,
        bio: '',
        location: '',
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }),
    });

    const request = createMockRequest('Bearer valid-token');
    const response = await GET(request);

    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('max-age=');
  });
});
