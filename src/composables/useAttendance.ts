/**
 * Composable for managing attendance records (clock-in / clock-out).
 * Subscribes to real-time Firestore updates for the current user's daily records
 * and provides methods to record clock-in and clock-out events.
 */
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { AttendanceRecord, Location } from '@/types'

/**
 * Create an attendance manager for a specific user.
 * @param userId - Firestore user UID
 * @param userName - Display name for attendance records
 * @returns Reactive state and methods for attendance management
 */
export function useAttendance(userId: string, userName: string) {
  const todayRecords = ref<AttendanceRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  /** Today's date in 'YYYY-MM-DD' format for Firestore queries */
  const today = computed(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })

  const lastClockIn = computed(() => {
    return todayRecords.value.find(r => r.type === 'clock_in')
  })

  const lastClockOut = computed(() => {
    return todayRecords.value.find(r => r.type === 'clock_out')
  })

  /** User can clock in only if they haven't clocked in today */
  const canClockIn = computed(() => {
    const clockIns = todayRecords.value.filter(r => r.type === 'clock_in').length
    return clockIns === 0
  })

  /** User can clock out only if they clocked in and haven't clocked out yet */
  const canClockOut = computed(() => {
    const clockIns = todayRecords.value.filter(r => r.type === 'clock_in').length
    const clockOuts = todayRecords.value.filter(r => r.type === 'clock_out').length
    return clockIns === 1 && clockOuts === 0
  })

  /** Start a real-time listener for today's attendance records from Firestore */
  function subscribeToTodayRecords() {
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('date', '==', today.value),
      orderBy('timestamp', 'desc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      todayRecords.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord))
    }, (err) => {
      console.error('Error fetching attendance records:', err)
      error.value = '勤怠記録の取得に失敗しました'
    })
  }

  /** Detach the Firestore real-time listener to prevent memory leaks */
  function unsubscribeFromRecords() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  /**
   * Record a clock-in event with the user's current location.
   * @param location - GPS coordinates and resolved address
   */
  async function clockIn(location: Location): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await addDoc(collection(db, 'attendances'), {
        userId,
        userName,
        type: 'clock_in',
        timestamp: serverTimestamp(),
        location,
        date: today.value
      })
    } catch (err: any) {
      error.value = '出勤記録に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Record a clock-out event with the user's current location.
   * @param location - GPS coordinates and resolved address
   */
  async function clockOut(location: Location): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await addDoc(collection(db, 'attendances'), {
        userId,
        userName,
        type: 'clock_out',
        timestamp: serverTimestamp(),
        location,
        date: today.value
      })
    } catch (err: any) {
      error.value = '退勤記録に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Format a Firestore Timestamp to 'HH:mm' string in Japanese locale.
   * @param timestamp - Firestore Timestamp object
   * @returns Formatted time string (e.g. "09:30") or '--:--' if null
   */
  function formatTime(timestamp: Timestamp): string {
    if (!timestamp) return '--:--'
    const date = timestamp.toDate()
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    todayRecords,
    loading,
    error,
    lastClockIn,
    lastClockOut,
    canClockIn,
    canClockOut,
    subscribeToTodayRecords,
    unsubscribeFromRecords,
    clockIn,
    clockOut,
    formatTime
  }
}
