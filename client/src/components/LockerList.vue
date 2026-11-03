<script setup>
// Both the public list and admin view reuse the locker display.
defineProps({ lockers: Array, selectable: Boolean, selected: { type: Array, default: () => [] } })
const emit = defineEmits(['toggle'])
</script>
<template>
  <p v-if="!lockers.length">No lockers found.</p>
  <ul class="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <li v-for="locker in lockers" :key="locker.id" class="flex flex-col gap-2 rounded border border-slate-300 bg-white p-4">
      <label v-if="selectable" class="flex-row items-center gap-2"><input type="checkbox" :checked="selected.includes(locker.id)" :disabled="locker.available === false" @change="emit('toggle', locker.id)"> Select {{ locker.code }}</label>
      <strong v-else>{{ locker.code }}</strong>
      <span>{{ locker.size }} | Floor {{ locker.floor }} | {{ locker.location }} | Limit {{ locker.maxPerUser }}</span>
      <span v-if="locker.available !== undefined">{{ locker.available ? 'Available' : 'Reserved' }}</span>
      <slot :locker="locker" />
    </li>
  </ul>
</template>
