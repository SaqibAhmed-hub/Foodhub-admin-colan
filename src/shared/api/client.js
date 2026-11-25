// One small fetch wrapper for the whole app. Every backend error looks like { code, message }.

const BASE = import.meta.env.VITE_API_BASE || ''

let token = null
let onUnauthorized = null

export const setToken = (t) => { token = t }
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

function buildUrl(path, query) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  })
  const qs = params.toString()
  return `${BASE}/api/v1${path}${qs ? `?${qs}` : ''}`
}

/**
 * @param {string} path  e.g. '/admin/menus'
 * @param {{method?: string, body?: any, query?: object, auth?: boolean}} [opts]
 *   auth: false for the public login calls (a 401 there means a wrong code, not an expired session)
 */
export async function api(path, { method = 'GET', body, query, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check that the backend is running.')
  }

  if (res.status === 204) return null

  let data = null
  try { data = await res.json() } catch { /* empty or non-JSON body */ }

  if (res.ok) return data
  throw toError(res, data, auth)
}

/** Turns a failed response into an ApiError (and signs the user out on an expired session). */
function toError(res, data, auth) {
  if (res.status === 401 && auth) {
    onUnauthorized?.()
    return new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.')
  }
  if (res.status === 403) {
    return new ApiError(403, data?.code || 'FORBIDDEN', data?.message || 'You do not have permission to do this.')
  }
  return new ApiError(res.status, data?.code || 'ERROR', data?.message || `Something went wrong (${res.status}).`)
}

/**
 * Downloads a file the backend generates (PDF / Excel). A plain link cannot be used because the token
 * travels in a header, so the file is fetched, then saved through a temporary object URL.
 * @returns {Promise<string>} the file name that was saved
 */
export async function apiDownload(path, { query, fallbackName = 'download' } = {}) {
  let res
  try {
    res = await fetch(buildUrl(path, query), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check that the backend is running.')
  }
  if (!res.ok) {
    let data = null
    try { data = await res.json() } catch { /* not JSON */ }
    throw toError(res, data, true)
  }

  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName

  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return filename
}
