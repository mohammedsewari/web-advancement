// A composable owns the EventSource lifecycle, so views only supply a refresh function.
import { onMounted, onUnmounted, ref } from 'vue'

export function useAvailabilityEvents(refresh) {
  const live = ref(false)
  let source
  onMounted(() => {
    source = new EventSource('/api/events')
    source.addEventListener('open', () => {
      live.value = true
      // Re-fetch on reconnect too: updates may have happened while disconnected.
      refresh()
    })
    source.addEventListener('availability', refresh)
    source.addEventListener('error', () => { live.value = false })
  })
  onUnmounted(() => source?.close())
  return { live }
}
