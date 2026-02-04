<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { AttendanceRecord, User } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AttendanceRecordCard from '@/components/AttendanceRecordCard.vue'

const activeTab = ref<'status' | 'history'>('status')
const records = ref<AttendanceRecord[]>([])
const users = ref<User[]>([])
const loading = ref(true)
const selectedDate = ref(new Date().toISOString().split('T')[0])

let unsubscribeRecords: (() => void) | null = null
let unsubscribeUsers: (() => void) | null = null

const today = computed(() => new Date().toISOString().split('T')[0])

const todayFormatted = computed(() => {
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const currentStatusList = computed(() => {
  const todayRecords = records.value.filter(r => r.date === today.value)
  const userStatusMap = new Map<string, {
    userName: string
    clockIn: AttendanceRecord | null
    clockOut: AttendanceRecord | null
  }>()

  // Initialize all users
  for (const user of users.value) {
    if (user.role !== 'admin') {
      userStatusMap.set(user.uid, {
        userName: user.displayName,
        clockIn: null,
        clockOut: null
      })
    }
  }

  // Update based on today's records
  for (const record of todayRecords) {
    const current = userStatusMap.get(record.userId)
    if (current) {
      if (record.type === 'clock_in' && !current.clockIn) {
        current.clockIn = record
      } else if (record.type === 'clock_out' && !current.clockOut) {
        current.clockOut = record
      }
    }
  }

  return Array.from(userStatusMap.values())
})

const groupedRecords = computed(() => {
  const groups: Record<string, { clockIn: AttendanceRecord | null, clockOut: AttendanceRecord | null }> = {}
  for (const record of records.value.filter(r => r.date === selectedDate.value)) {
    if (!groups[record.userName]) {
      groups[record.userName] = { clockIn: null, clockOut: null }
    }
    if (record.type === 'clock_in' && !groups[record.userName].clockIn) {
      groups[record.userName].clockIn = record
    } else if (record.type === 'clock_out' && !groups[record.userName].clockOut) {
      groups[record.userName].clockOut = record
    }
  }
  return groups
})

function subscribeToRecords() {
  if (unsubscribeRecords) unsubscribeRecords()

  loading.value = true

  const q = query(
    collection(db, 'attendances'),
    orderBy('timestamp', 'asc')
  )

  unsubscribeRecords = onSnapshot(q, (snapshot) => {
    records.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord))
    loading.value = false
  }, (error) => {
    console.error('Error fetching records:', error)
    loading.value = false
  })
}

function subscribeToUsers() {
  if (unsubscribeUsers) unsubscribeUsers()

  const q = query(collection(db, 'users'))

  unsubscribeUsers = onSnapshot(q, (snapshot) => {
    users.value = snapshot.docs.map(doc => ({
      ...doc.data()
    } as User))
  }, (error) => {
    console.error('Error fetching users:', error)
  })
}

onMounted(() => {
  subscribeToRecords()
  subscribeToUsers()
})

onUnmounted(() => {
  if (unsubscribeRecords) unsubscribeRecords()
  if (unsubscribeUsers) unsubscribeUsers()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">勤怠管理</h2>
      </div>

      <!-- Tabs -->
      <div class="flex border-b mb-6">
        <button
          @click="activeTab = 'status'"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors',
            activeTab === 'status'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          現在の状況
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors',
            activeTab === 'history'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          出退勤履歴
        </button>
      </div>

      <!-- Current Status Tab -->
      <div v-if="activeTab === 'status'">
        <div class="text-center text-gray-600 mb-4">
          {{ new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          }) }}
        </div>

        <div v-if="loading" class="py-12">
          <LoadingSpinner size="lg" />
        </div>

        <div v-else-if="currentStatusList.length === 0" class="text-center py-12 text-gray-500">
          登録ユーザーがいません
        </div>

        <div v-else class="space-y-4">
          <AttendanceRecordCard
            v-for="item in currentStatusList"
            :key="item.userName"
            :user-name="item.userName"
            :clock-in="item.clockIn"
            :clock-out="item.clockOut"
            :show-status="true"
          />
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'">
        <div class="flex justify-end mb-4">
          <input
            v-model="selectedDate"
            type="date"
            class="input w-auto"
          />
        </div>

        <div class="text-center text-gray-600 mb-4">
          {{ todayFormatted }}
        </div>

        <div v-if="loading" class="py-12">
          <LoadingSpinner size="lg" />
        </div>

        <div v-else-if="Object.keys(groupedRecords).length === 0" class="text-center py-12 text-gray-500">
          この日の記録はありません
        </div>

        <div v-else class="space-y-4">
          <AttendanceRecordCard
            v-for="(data, userName) in groupedRecords"
            :key="userName"
            :user-name="String(userName)"
            :clock-in="data.clockIn"
            :clock-out="data.clockOut"
            :show-status="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
