<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@/composables/useGeolocation'
import { useAttendance } from '@/composables/useAttendance'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import LocationDisplay from '@/components/LocationDisplay.vue'
import AttendanceRecordCard from '@/components/AttendanceRecordCard.vue'

const { currentUser } = useAuth()
const { state: geoState, getCurrentPosition, reset: resetGeo } = useGeolocation()

const attendance = ref<ReturnType<typeof useAttendance> | null>(null)
const actionInProgress = ref<'clock_in' | 'clock_out' | null>(null)

const todayFormatted = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const canClockIn = computed(() => attendance.value?.canClockIn ?? false)
const canClockOut = computed(() => attendance.value?.canClockOut ?? false)
const attendanceError = computed(() => attendance.value?.error ?? null)
const todayRecords = computed(() => attendance.value?.todayRecords ?? [])

const todayClockIn = computed(() =>
  todayRecords.value.find(r => r.type === 'clock_in') ?? null
)
const todayClockOut = computed(() =>
  todayRecords.value.find(r => r.type === 'clock_out') ?? null
)

watch(currentUser, (user) => {
  if (user && !attendance.value) {
    attendance.value = useAttendance(user.uid, user.displayName)
    attendance.value.subscribeToTodayRecords()
  }
}, { immediate: true, deep: true })

onUnmounted(() => {
  attendance.value?.unsubscribeFromRecords()
})

async function handleClockIn() {
  if (!attendance.value || !currentUser.value) return

  actionInProgress.value = 'clock_in'
  try {
    const geo = await getCurrentPosition()
    if (geo.position && geo.address) {
      await attendance.value.clockIn({
        latitude: geo.position.latitude,
        longitude: geo.position.longitude,
        address: geo.address
      })
    }
  } catch (e) {
    // Error is handled by composables
  } finally {
    actionInProgress.value = null
    resetGeo()
  }
}

async function handleClockOut() {
  if (!attendance.value || !currentUser.value) return

  actionInProgress.value = 'clock_out'
  try {
    const geo = await getCurrentPosition()
    if (geo.position && geo.address) {
      await attendance.value.clockOut({
        latitude: geo.position.latitude,
        longitude: geo.position.longitude,
        address: geo.address
      })
    }
  } catch (e) {
    // Error is handled by composables
  } finally {
    actionInProgress.value = null
    resetGeo()
  }
}
</script>

<template>
  <!-- Full screen loading overlay -->
  <div
    v-if="actionInProgress"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" />
      <p class="text-lg font-medium">
        {{ actionInProgress === 'clock_in' ? '出勤処理中...' : '退勤処理中...' }}
      </p>
      <LocationDisplay
        :loading="geoState.loading"
        :address="geoState.address"
        :error="geoState.error"
      />
    </div>
  </div>

  <div class="max-w-2xl mx-auto space-y-6">
    <div class="card">
      <div class="text-center mb-6">
        <div class="text-gray-500 text-sm">本日</div>
        <div class="text-xl font-medium">{{ todayFormatted }}</div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <button
          @click="handleClockIn"
          :disabled="!canClockIn || actionInProgress !== null"
          class="btn btn-success btn-lg flex flex-col items-center justify-center py-8"
          :class="{ 'opacity-50 cursor-not-allowed': !canClockIn }"
        >
          <span class="text-3xl mb-2">出勤</span>
          <span class="text-sm opacity-80">Clock In</span>
        </button>

        <button
          @click="handleClockOut"
          :disabled="!canClockOut || actionInProgress !== null"
          class="btn btn-danger btn-lg flex flex-col items-center justify-center py-8"
          :class="{ 'opacity-50 cursor-not-allowed': !canClockOut }"
        >
          <span class="text-3xl mb-2">退勤</span>
          <span class="text-sm opacity-80">Clock Out</span>
        </button>
      </div>

      <div v-if="attendanceError" class="mt-4 text-red-600 text-center">
        {{ attendanceError }}
      </div>
    </div>

    <div>
      <h3 class="text-lg font-medium mb-4">本日の勤怠記録</h3>
      <AttendanceRecordCard
        :clock-in="todayClockIn"
        :clock-out="todayClockOut"
        :show-status="true"
      />
    </div>
  </div>
</template>
