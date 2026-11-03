// Guards improve navigation; the backend independently enforces every permission.
import { createRouter, createWebHistory } from 'vue-router'
import { hasRole } from '../composables/useAuth'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import AdminView from '../views/AdminView.vue'
const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/', component: HomeView },
  { path: '/auth', component: AuthView },
  { path: '/reservations', component: () => import('../views/MyReservationsView.vue'), beforeEnter: () => hasRole('USER') || '/auth' },
  { path: '/admin', component: AdminView, beforeEnter: () => hasRole('ADMIN') || '/auth' },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
] })
export default router
