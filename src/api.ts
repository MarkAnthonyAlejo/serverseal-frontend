/**
 * Wrapper around fetch that automatically attaches the JWT token
 * from localStorage to every request as an Authorization header.
 */
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('serverseal_token');
  return fetch(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
