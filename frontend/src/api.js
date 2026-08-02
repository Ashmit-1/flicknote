const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let resp
  try {
    resp = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Network error')
  }

  if (!resp.ok) {
    let detail = resp.statusText
    try {
      const data = await resp.json()
      if (data.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {
      /* keep default */
    }
    throw new ApiError(resp.status, detail)
  }

  if (resp.status === 204) return null
  return resp.json()
}

export const authApi = {
  register: (username, password) =>
    apiFetch('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { username, password } }),
}

export const syncApi = {
  sync: (token, payload) => apiFetch('/sync', { method: 'POST', body: payload, token }),
}

export { apiFetch }
