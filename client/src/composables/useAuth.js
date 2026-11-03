// Shared reactive auth state is small enough to avoid a state-management library.
import { reactive } from 'vue'
let saved
try { saved = JSON.parse(localStorage.getItem('auth') || 'null') } catch { saved = null }
export const auth = reactive({ token: saved?.token || '', user: saved?.user || null })
export const hasRole = role => auth.user?.roles.includes(role)
export function setAuth(value) {
  auth.token = value?.token || ''
  auth.user = value?.user || null
  if (value) localStorage.setItem('auth', JSON.stringify(value))
  else localStorage.removeItem('auth')
}
