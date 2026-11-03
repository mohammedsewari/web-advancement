<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { auth, hasRole, setAuth } from './composables/useAuth'
</script>
<template>
  <header class="mx-auto max-w-5xl border-b border-slate-300 p-5"><h1 class="mb-4 text-2xl font-bold">School lockers</h1><nav class="flex flex-wrap items-center gap-4">
    <RouterLink to="/">Lockers</RouterLink>
    <RouterLink v-if="!auth.user" to="/auth">Log in / Register</RouterLink>
    <RouterLink v-if="hasRole('USER')" to="/reservations">My reservations</RouterLink>
    <RouterLink v-if="hasRole('ADMIN')" to="/admin">Admin</RouterLink>
    <span v-if="auth.user">{{ auth.user.email }} <button @click="setAuth(null)">Log out</button></span>
  </nav></header>
  <main class="mx-auto max-w-5xl p-5"><RouterView /></main>
</template>
