<script setup>
import { reactive, ref, onMounted } from 'vue'
import LockerList from '../components/LockerList.vue'
import { getLockers, saveLocker, deleteLocker, findUsers, getReservation, getReservations } from '../services/api'
import ReservationList from '../components/ReservationList.vue'
const lockers = ref([]), message = ref(''), email = ref(''), reservationId = ref(''), users = ref(null), reservation = ref(null)
const empty = () => ({ code: '', size: 'small', floor: 1, location: 'A', maxPerUser: 2 })
const form = reactive(empty()), editing = ref(null)
const lockerCode = ref(''), lockerReservations = ref(null)
async function load() { lockers.value = await getLockers({}) }
function edit(locker) { editing.value = locker.id; Object.assign(form, locker) }
function reset() { editing.value = null; Object.assign(form, empty()) }
async function save() {
  try {
    await saveLocker(editing.value, form)
    reset(); await load(); message.value = 'Locker saved.'
  } catch (error) { message.value = error.message }
}
async function remove(locker) {
  try { await deleteLocker(locker.id); await load(); message.value = 'Locker deleted.' }
  catch (error) { message.value = error.message }
}
async function searchUser() {
  users.value = null
  try { users.value = await findUsers(email.value) }
  catch (error) { message.value = error.message }
}
async function searchReservation() {
  reservation.value = null
  try { reservation.value = await getReservation(reservationId.value) }
  catch (error) { message.value = error.message }
}
async function searchByLocker() {
  lockerReservations.value = null
  try { lockerReservations.value = await getReservations({ code: lockerCode.value }) }
  catch (error) { message.value = error.message }
}
onMounted(async () => { try { await load() } catch (error) { message.value = error.message } })
</script>
<template>
  <h2>Manage lockers</h2>
  <p role="status">{{ message }}</p>
  <form class="flex flex-wrap items-end gap-4" @submit.prevent="save">
    <label>Code<input v-model="form.code" required pattern="[A-Z0-9]+(-[A-Z0-9]+)*" maxlength="30"></label>
    <label>Size<select v-model="form.size"><option>small</option><option>medium</option><option>large</option></select></label>
    <label>Floor<input v-model.number="form.floor" type="number" required min="0" max="100" step="1"></label>
    <label>Location<input v-model="form.location" required pattern="[A-Za-z0-9 -]+" maxlength="50"></label>
    <label>Limit per user<input v-model.number="form.maxPerUser" type="number" required min="1" max="100" step="1"></label>
    <button>{{ editing ? 'Save changes' : 'Create locker' }}</button>
    <button v-if="editing" type="button" @click="reset">Cancel edit</button>
  </form>
  <LockerList :lockers="lockers"><template #default="{ locker }"><div><button @click="edit(locker)">Edit</button> <button @click="remove(locker)">Delete</button></div></template></LockerList>
  <h2>Find user</h2>
  <form class="flex flex-wrap items-end gap-4" @submit.prevent="searchUser"><label>Email<input v-model="email" type="email" required maxlength="254"></label><button>Search</button></form>
  <div v-if="users"><p v-if="!users.length">No user found.</p><p v-for="user in users" :key="user.id">#{{ user.id }} | {{ user.email }} | {{ user.roles.join(', ') }}</p></div>
  <h2>Find reservation</h2>
  <form class="flex flex-wrap items-end gap-4" @submit.prevent="searchReservation"><label>Reservation ID<input v-model="reservationId" type="number" required min="1" step="1"></label><button>Search</button></form>
  <ReservationList v-if="reservation" :reservations="[reservation]" show-owner />
  <h2>Reservations per locker</h2>
  <form class="flex flex-wrap items-end gap-4" @submit.prevent="searchByLocker">
    <label>Locker code<input v-model="lockerCode" required pattern="[A-Z0-9]+(-[A-Z0-9]+)*" maxlength="30" placeholder="L-001"></label>
    <button>Find reservations</button>
  </form>
  <ReservationList v-if="lockerReservations" :reservations="lockerReservations" show-owner />
</template>
