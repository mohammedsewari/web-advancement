<script setup>
import { onMounted, ref, watch } from 'vue'
import { getMyReservations } from '../services/api'
import { auth } from '../composables/useAuth'
import ReservationList from '../components/ReservationList.vue'
const reservations = ref([])
const message = ref('')
async function load() {
  try { reservations.value = await getMyReservations() }
  catch (error) { message.value = error.message }
}
// Remove private data immediately if the user logs out while this page is open.
watch(() => auth.token, () => { reservations.value = [] })
onMounted(load)
</script>
<template>
  <h2>My reservations</h2>
  <p>Times use your device's local timezone.</p>
  <p role="status">{{ message }}</p>
  <ReservationList v-if="auth.user" :reservations="reservations" />
  <RouterLink v-else to="/auth">Log in to view your reservations</RouterLink>
</template>
