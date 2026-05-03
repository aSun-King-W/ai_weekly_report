import {
  handleApiResponse,
  delay,
  retry,
  withAuth,
} from '../../utils/api.ts';

describe('handleApiResponse', () => {
  it('parses successful response', async () => {
    const response = new Response(
      JSON.stringify({ success: true, data: { id: 1, name: 'test' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    const result = await handleApiResponse<{ id: number; name: string }>(response);
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('throws on non-ok response', async () => {
    const response = new Response('Not Found', { status: 404, statusText: 'Not Found' });
    await expect(handleApiResponse(response)).rejects.toThrow('API error: 404 Not Found');
  });

  it('throws when success is false with error message', async () => {
    const response = new Response(
      JSON.stringify({ success: false, error: '认证失败' }),
      { status: 401, statusText: 'Unauthorized', headers: { 'Content-Type': 'application/json' } }
    );
    await expect(handleApiResponse(response)).rejects.toThrow('认证失败');
  });

  it('fallback to message when error is absent', async () => {
    const response = new Response(
      JSON.stringify({ success: false, message: 'something went wrong' }),
      { status: 400, statusText: 'Bad Request', headers: { 'Content-Type': 'application/json' } }
    );
    await expect(handleApiResponse(response)).rejects.toThrow('something went wrong');
  });
});

describe('delay', () => {
  jest.useFakeTimers();

  it('resolves after specified ms', async () => {
    const promise = delay(100);
    jest.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn, 3, 100);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const resultPromise = retry(fn, 3, 10);
    await jest.advanceTimersByTimeAsync(100);
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('persistent error'));
    jest.useRealTimers();
    await expect(retry(fn, 2, 1)).rejects.toThrow('persistent error');
    expect(fn).toHaveBeenCalledTimes(2);
    jest.useFakeTimers();
  });
});

describe('withAuth', () => {
  it('adds Bearer token to headers', () => {
    const result = withAuth('my-token');
    expect(result.headers).toEqual({
      Authorization: 'Bearer my-token',
    });
  });

  it('merges with existing options', () => {
    const result = withAuth('my-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result.method).toBe('POST');
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer my-token',
    });
  });

  it('overwrites existing Authorization header', () => {
    const result = withAuth('new-token', {
      headers: { Authorization: 'Bearer old-token' },
    });
    expect(result.headers).toEqual({
      Authorization: 'Bearer new-token',
    });
  });
});

// createApiUrl is not tested in Node environment as it depends on window.location.origin
