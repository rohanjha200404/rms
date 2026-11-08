function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function apiInterceptor(path, options = {}) {
  const session = JSON.parse(localStorage.getItem('gs-session') || 'null');
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('X-Request-ID', requestId());

  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const requestUrl = `/api${path}`;
  const startedAt = performance.now();
  console.info(`[API request] ${options.method || 'GET'} ${requestUrl}`);

  let response;
  try {
    response = await fetch(requestUrl, { ...options, headers });
  } catch {
    throw new Error('Backend is unreachable. Confirm the API server is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response (${response.status}).`);
  }

  console.info(`[API response] ${response.status} ${requestUrl} (${Math.round(performance.now() - startedAt)}ms)`);
  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.requestId = response.headers.get('x-request-id');
    throw error;
  }

  return data;
}
