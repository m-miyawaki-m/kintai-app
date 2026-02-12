/**
 * AttendanceView page component.
 * Main page for regular users and supervisors.
 * - Regular users: clock in/out with geolocation, view today's record
 * - Supervisors: additionally view subordinates' attendance in real-time
 */
<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import { useGeolocation } from '@/composables/useGeolocation'
import { useAttendance } from '@/composables/useAttendance'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import LocationDisplay from '@/components/LocationDisplay.vue'
import AttendanceRecordCard from '@/components/AttendanceRecordCard.vue'
import type { AttendanceRecord, User } from '@/types'

const authStore = useAuthStore()
authStore.initAuth()

const currentUser = computed(() => authStore.user)
const { state: geoState, getCurrentPosition, reset: resetGeo } = useGeolocation()

const attendance = ref<ReturnType<typeof useAttendance> | null>(null)
/** Tracks which action (clock_in/clock_out) is currently processing, null if idle */
const actionInProgress = ref<'clock_in' | 'clock_out' | null>(null)

// Subordinates data (supervisor-only: real-time attendance of managed users)
const subordinateUsers = ref<User[]>([])
const subordinateRecords = ref<AttendanceRecord[]>([])
let unsubscribeSubordinates: (() => void) | null = null

const today = computed(() => new Date().toISOString().split('T')[0])

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

/** Group subordinate attendance records by user for display in the subordinates section */
const subordinateAttendance = computed(() => {
  return subordinateUsers.value.map(user => {
    const userRecords = subordinateRecords.value.filter(
      r => r.userId === user.uid && r.date === today.value
    )
    return {
      user,
      clockIn: userRecords.find(r => r.type === 'clock_in') ?? null,
      clockOut: userRecords.find(r => r.type === 'clock_out') ?? null
    }
  })
})

watch(() => authStore.user, (user) => {
  if (user && !attendance.value) {
    const att = useAttendance(user.uid, user.displayName)
    attendance.value = att
    att.subscribeToTodayRecords()
  }
}, { immediate: true })

// When a supervisor logs in, fetch subordinate profiles and subscribe to their attendance
watch(() => authStore.user, async (user) => {
  if (!user || user.role !== 'supervisor' || !user.subordinates?.length) {
    subordinateUsers.value = []
    subordinateRecords.value = []
    return
  }

  const subs = user.subordinates
  console.log('State: Loading subordinates data', { count: subs.length })

  // Fetch subordinate user profiles
  const users: User[] = []
  for (const uid of subs) {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      users.push(userDoc.data() as User)
    }
  }
  subordinateUsers.value = users
  console.log('State: Loaded subordinate users', { count: users.length })

  // Subscribe to subordinates' attendance records
  if (unsubscribeSubordinates) unsubscribeSubordinates()

  const q = query(
    collection(db, 'attendances'),
    where('userId', 'in', subs),
    where('date', '==', today.value)
  )

  unsubscribeSubordinates = onSnapshot(q, (snapshot) => {
    subordinateRecords.value = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as AttendanceRecord))
    console.log('State: Subordinates records updated', { count: subordinateRecords.value.length })
  })
}, { immediate: true })

onUnmounted(() => {
  attendance.value?.unsubscribeFromRecords()
  if (unsubscribeSubordinates) unsubscribeSubordinates()
})

/** Handle clock-in: get GPS position, resolve address, then save record */
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

/** Handle clock-out: get GPS position, resolve address, then save record */
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
        :user-name="currentUser?.displayName"
        :clock-in="todayClockIn"
        :clock-out="todayClockOut"
        :show-status="true"
      />
    </div>

    <!-- Subordinates section (for supervisor only) -->
    <div v-if="currentUser?.role === 'supervisor'">
      <h3 class="text-lg font-medium mb-4">配下メンバーの勤怠状況</h3>
      <div v-if="subordinateUsers.length === 0" class="text-gray-500 text-center py-4">
        配下メンバーを読み込み中...
      </div>
      <div v-else class="space-y-2">
        <AttendanceRecordCard
          v-for="item in subordinateAttendance"
          :key="item.user.uid"
          :user-name="item.user.displayName"
          :clock-in="item.clockIn"
          :clock-out="item.clockOut"
          :show-status="true"
        />
      </div>
    </div>
  </div>
</template>
