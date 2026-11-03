<script setup>
// This view handles form state; the server makes all booking decisions.
import { ref, onMounted, watch } from 'vue'
import LockerList from '../components/LockerList.vue'
import { getLockers, reserveLockers } from '../services/api'
import { auth, hasRole } from '../composables/useAuth'
import { useAvailabilityEvents } from '../composables/useAvailabilityEvents'
const lockers = ref([]), selected = ref([]), code = ref(''), size = ref(''), floor = ref(''), location = ref('')
const date = ref(''), time = ref(''), duration = ref(60), message = ref(''), busy = ref(false)
function booking() {
  const start = new Date(`${date.value}T${time.value}`)
  if (!date.value || !time.value || !Number.isFinite(+start) || +start <= Date.now()) throw new Error('Choose a future date and time.')
  if (!Number.isInteger(Number(duration.value)) || duration.value < 1 || duration.value > 1440) throw new Error('Duration must be 1-1440 minutes.')
  // The browser converts local time to UTC; the API always receives an explicit timezone.
  return { startAt: start.toISOString(), durationMinutes: Number(duration.value) }
}
async function load(availability = false, clearSelection = true) {
  message.value = ''
  try {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries({ code: code.value, size: size.value, floor: floor.value, location: location.value })) if (value !== '') query.set(key, value)
    if (availability) for (const [key, value] of Object.entries(booking())) query.set(key, value)
    lockers.value = await getLockers(query)
    selected.value = clearSelection ? [] : selected.value.filter(id => lockers.value.some(locker => locker.id === id && locker.available !== false))
  } catch (error) { message.value = error.message }
}
function toggle(id) { selected.value = selected.value.includes(id) ? selected.value.filter(x => x !== id) : [...selected.value, id] }
async function reserve() {
  busy.value = true; message.value = ''
  try {
    if (!selected.value.length) throw new Error('Select at least one locker.')
    const result = await reserveLockers({ ...booking(), lockerIds: selected.value })
    await load(true)
    message.value = `Reservation #${result.id} created for ${result.Lockers.map(l => l.code).join(', ')}.`
  } catch (error) { message.value = error.message }
  finally { busy.value = false }
}
function refreshAvailability() {
  // Keep selection only when the selected lockers still exist and remain available.
  const hasPeriod = Boolean(date.value && time.value)
  return load(hasPeriod, false)
}
const { live } = useAvailabilityEvents(refreshAvailability)
watch([date, time, duration], refreshAvailability)
onMounted(() => load())
</script>
<template>
  <h2>Find a locker</h2>
  <p class="mb-4 text-sm text-slate-600" role="status">{{ live ? 'Live availability connected' : 'Connecting to live updates...' }}</p>
  <form class="flex flex-wrap items-end gap-4" @submit.prevent="load()">
    <label>Code<input v-model="code" placeholder="L-001" pattern="[A-Z0-9-]+" maxlength="30"></label>
    <label>Size<select v-model="size"><option value="">All</option><option>small</option><option>medium</option><option>large</option></select></label>
    <label>Floor<input v-model="floor" type="number" min="0" max="100" step="1"></label>
    <label>Location<input v-model="location" maxlength="50" pattern="[A-Za-z0-9 -]+"></label>
    <button>Filter</button>
  </form>
  <h2>Reserve lockers</h2>
  <p>Limits apply to simultaneous lockers of the same size, floor and location. Times use your device's local timezone.</p>
  <form @submit.prevent="reserve">
    <div class="flex flex-wrap items-end gap-4">
      <label>Date<input v-model="date" type="date" required></label>
      <label>Start time<input v-model="time" type="time" required></label>
      <label>Duration (minutes)<input v-model="duration" type="number" min="1" max="1440" step="1" required></label>
      <button type="button" @click="load(true)">Check availability</button>
    </div>
    <LockerList :lockers="lockers" selectable :selected="selected" @toggle="toggle" />
    <button v-if="hasRole('USER')" :disabled="busy">Reserve selected ({{ selected.length }})</button>
    <p v-else>{{ auth.user ? 'Your account needs the USER role to reserve.' : 'Log in or register to reserve.' }}</p>
  </form>
  <p role="status">{{ message }}</p>
</template>
