<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logIn } from '../services/api'
import { setAuth } from '../composables/useAuth'
const email = ref(''), password = ref(''), register = ref(false), message = ref(''), busy = ref(false)
const router = useRouter()
async function submit() {
  busy.value = true; message.value = ''
  try {
    setAuth(await logIn({ email: email.value, password: password.value }, register.value))
    router.push('/')
  } catch (error) { message.value = error.message }
  finally { busy.value = false }
}
</script>
<template>
  <h2>{{ register ? 'Create account' : 'Log in' }}</h2>
  <form @submit.prevent="submit">
    <label>Email<input v-model="email" type="email" required maxlength="254" autocomplete="email"></label>
    <label>Password (8-128 characters)<input v-model="password" type="password" required minlength="8" maxlength="128" :autocomplete="register ? 'new-password' : 'current-password'"></label>
    <button :disabled="busy">{{ register ? 'Register' : 'Log in' }}</button>
  </form>
  <button @click="register = !register">{{ register ? 'Already registered? Log in' : 'Create an account' }}</button>
  <p role="status">{{ message }}</p>
</template>
