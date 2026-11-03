// HTTP details stay here; views call the small resource functions below.
import { auth, setAuth } from '../composables/useAuth'
export async function api(path, options = {}) {
  let response
  try {
    response = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(auth.token ? { Authorization: 'Bearer ' + auth.token } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Please try again once it is running.')
  }
  const data = await response.json().catch(() => null)
  if (!data) {
    throw new Error(response.ok
      ? 'The server returned an invalid response.'
      : 'The server is unavailable. Please try again once it is running.')
  }
  if (!response.ok) {
    if (response.status === 401) setAuth(null)
    throw new Error(data.message || 'Request failed.')
  }
  return data
}

export const logIn = (credentials, register) => api('/auth/' + (register ? 'register' : 'login'), { method: 'POST', body: credentials })
export const getLockers = query => api('/lockers?' + new URLSearchParams(query))
export const saveLocker = (id, body) => api('/lockers' + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', body })
export const deleteLocker = id => api('/lockers/' + id, { method: 'DELETE' })
export const reserveLockers = body => api('/reservations', { method: 'POST', body })
export const getMyReservations = () => api('/reservations/my')
export const getReservations = query => api('/reservations?' + new URLSearchParams(query))
export const getReservation = id => api('/reservations/' + id)
export const findUsers = email => api('/users?' + new URLSearchParams({ email }))
