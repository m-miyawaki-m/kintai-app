<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@/composables/useGeolocation'
import { useAttendance } from '@/composables/useAttendance'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import LocationDisplay from '@/components/LocationDisplay.vue'

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

function formatTime(timestamp: any): string {
  return attendance.value?.formatTime(timestamp) ?? '--:--'
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="card">
      <div class="text-center mb-6">
        <div class="text-gray-500 text-sm">本日</div>
        <div class="text-xl font-medium">{{ todayFormatted }}</div>
      </div>

      <LocationDisplay
        v-if="actionInProgress"
        :loading="geoState.loading"
        :address="geoState.address"
        :error="geoState.error"
        class="mb-6"
      />

      <div class="grid grid-cols-2 gap-4">
        <button
          @click="handleClockIn"
          :disabled="!canClockIn || actionInProgress !== null"
          class="btn btn-success btn-lg flex flex-col items-center justify-center py-8"
          :class="{ 'opacity-50 cursor-not-allowed': !canClockIn }"
        >
          <LoadingSpinner
            v-if="actionInProgress === 'clock_in'"
            size="lg"
            color="text-white"
          />
          <template v-else>
            <span class="text-3xl mb-2">出勤</span>
            <span class="text-sm opacity-80">Clock In</span>
          </template>
        </button>

        <button
          @click="handleClockOut"
          :disabled="!canClockOut || actionInProgress !== null"
          class="btn btn-danger btn-lg flex flex-col items-center justify-center py-8"
          :class="{ 'opacity-50 cursor-not-allowed': !canClockOut }"
        >
          <LoadingSpinner
            v-if="actionInProgress === 'clock_out'"
            size="lg"
            color="text-white"
          />
          <template v-else>
            <span class="text-3xl mb-2">退勤</span>
            <span class="text-sm opacity-80">Clock Out</span>
          </template>
        </button>
      </div>

      <div v-if="attendanceError" class="mt-4 text-red-600 text-center">
        {{ attendanceError }}
      </div>
    </div>

    <div class="card">
      <h3 class="text-lg font-medium mb-4">本日の勤怠記録</h3>

      <div v-if="todayRecords.length === 0" class="text-gray-500 text-center py-4">
        まだ記録がありません
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="record in todayRecords"
          :key="record.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded',
                record.type === 'clock_in'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              ]"
            >
              {{ record.type === 'clock_in' ? '出勤' : '退勤' }}
            </span>
            <span class="font-medium">
              {{ formatTime(record.timestamp) }}
            </span>
          </div>
          <div class="text-sm text-gray-500 max-w-[200px] truncate">
            {{ record.location.address }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
