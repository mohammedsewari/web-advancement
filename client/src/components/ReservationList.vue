<script setup>
// This read-only display is shared by users and administrators.
defineProps({ reservations: { type: Array, required: true }, showOwner: Boolean })
</script>
<template>
  <p v-if="!reservations.length" class="my-4 text-slate-600">No reservations found.</p>
  <ul class="my-4 grid gap-3">
    <li v-for="reservation in reservations" :key="reservation.id" class="rounded border border-slate-300 bg-white p-4">
      <h3 class="font-semibold">Reservation #{{ reservation.id }}</h3>
      <p v-if="showOwner">{{ reservation.User?.email }}</p>
      <p>{{ reservation.Lockers.map(locker => locker.code).join(', ') }}</p>
      <p>{{ new Date(reservation.startAt).toLocaleString() }} to {{ new Date(reservation.endAt).toLocaleString() }}</p>
    </li>
  </ul>
</template>
