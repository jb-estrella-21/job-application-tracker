import { beforeEach, describe, expect, it, vi } from 'vitest';

function response(status: number, data: unknown) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('authenticated API recovery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('refreshes once after a 401 and retries the original request once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(response(201, { accessToken: 'fresh-token' }))
      .mockResolvedValueOnce(response(200, { value: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    const session = await import('../features/auth/session');
    const { apiRequest } = await import('./api');
    session.establishSession('expired-token');

    await expect(apiRequest<{ value: string }>('/applications')).resolves.toEqual({ value: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetchMock.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('shares one refresh operation for concurrent 401 responses', async () => {
    let resolveRefresh!: (value: Response) => void;
    const refresh = new Promise<Response>((resolve) => { resolveRefresh = resolve; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, null))
      .mockResolvedValueOnce(response(401, null))
      .mockImplementationOnce(() => refresh)
      .mockResolvedValueOnce(response(200, { first: true }))
      .mockResolvedValueOnce(response(200, { second: true }));
    vi.stubGlobal('fetch', fetchMock);
    const session = await import('../features/auth/session');
    const { apiRequest } = await import('./api');
    session.establishSession('expired-token');
    const first = apiRequest('/one');
    const second = apiRequest('/two');
    resolveRefresh(response(201, { accessToken: 'fresh-token' }));
    await expect(Promise.all([first, second])).resolves.toEqual([{ first: true }, { second: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))).toHaveLength(1);
  });

  it.each([403, 429, 500])('does not refresh for %s responses', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(response(status, null));
    vi.stubGlobal('fetch', fetchMock);
    const session = await import('../features/auth/session');
    const { apiRequest, ApiError } = await import('./api');
    session.establishSession('token');
    await expect(apiRequest('/applications')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails closed when refresh is rejected without retrying indefinitely', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401, null))
      .mockResolvedValueOnce(response(401, null));
    vi.stubGlobal('fetch', fetchMock);
    const session = await import('../features/auth/session');
    const { apiRequest } = await import('./api');
    session.establishSession('expired-token');
    await expect(apiRequest('/applications')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(session.getAccessToken()).toBeNull();
  });

  it('ignores a stale refresh completion after logout', async () => {
    let resolveRefresh!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveRefresh = resolve; })));
    const session = await import('../features/auth/session');
    const pendingRefresh = session.refreshAccessToken();
    session.endSession();
    resolveRefresh(response(201, { accessToken: 'stale-token' }));
    await expect(pendingRefresh).resolves.toBeNull();
    expect(session.getAccessToken()).toBeNull();
  });
});
