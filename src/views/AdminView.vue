<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { AttendanceRecord, User } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

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
    status: 'working' | 'left' | 'not_started'
    records: AttendanceRecord[]
  }>()

  // Initialize all users as not started
  for (const user of users.value) {
    if (user.role !== 'admin') {
      userStatusMap.set(user.uid, {
        userName: user.displayName,
        status: 'not_started',
        records: []
      })
    }
  }

  // Update status based on today's records
  for (const record of todayRecords) {
    const current = userStatusMap.get(record.userId)
    if (current) {
      const userRecords = todayRecords
        .filter(r => r.userId === record.userId)
        .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0))

      const clockIns = userRecords.filter(r => r.type === 'clock_in').length
      const clockOuts = userRecords.filter(r => r.type === 'clock_out').length

      current.status = clockIns > clockOuts ? 'working' : 'left'
      current.records = userRecords
    }
  }

  return Array.from(userStatusMap.values())
})

const groupedRecords = computed(() => {
  const groups: Record<string, AttendanceRecord[]> = {}
  for (const record of records.value.filter(r => r.date === selectedDate.value)) {
    if (!groups[record.userName]) {
      groups[record.userName] = []
    }
    groups[record.userName].push(record)
  }
  for (const userName in groups) {
    groups[userName].sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0
      const timeB = b.timestamp?.toMillis() || 0
      return timeA - timeB
    })
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

function formatTime(timestamp: Timestamp): string {
  if (!timestamp) return '--:--'
  const date = timestamp.toDate()
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusStyle(status: 'working' | 'left' | 'not_started') {
  switch (status) {
    case 'working':
      return { text: '勤務中', class: 'bg-green-100 text-green-700' }
    case 'left':
      return { text: '退勤済', class: 'bg-blue-100 text-blue-700' }
    default:
      return { text: '未出勤', class: 'bg-gray-100 text-gray-600' }
  }
}

function getRecordStatus(userRecords: AttendanceRecord[]) {
  const clockIns = userRecords.filter(r => r.type === 'clock_in').length
  const clockOuts = userRecords.filter(r => r.type === 'clock_out').length

  if (clockIns === 0) return { text: '未出勤', class: 'bg-gray-100 text-gray-600' }
  if (clockIns > clockOuts) return { text: '勤務中', class: 'bg-green-100 text-green-700' }
  return { text: '退勤済', class: 'bg-blue-100 text-blue-700' }
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
          <div
            v-for="item in currentStatusList"
            :key="item.userName"
            class="border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="font-medium text-lg">{{ item.userName }}</div>
              <span
                :class="[
                  'px-3 py-1 text-sm rounded-full',
                  getStatusStyle(item.status).class
                ]"
              >
                {{ getStatusStyle(item.status).text }}
              </span>
            </div>

            <div v-if="item.records.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="record in item.records"
                :key="record.id"
                class="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded"
              >
                <span
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded',
                    record.type === 'clock_in'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ record.type === 'clock_in' ? '出勤' : '退勤' }}
                </span>
                <span class="font-medium">{{ formatTime(record.timestamp) }}</span>
                <span class="text-gray-500 truncate flex-1">
                  {{ record.location.address }}
                </span>
              </div>
            </div>
          </div>
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
          <div
            v-for="(userRecords, userName) in groupedRecords"
            :key="userName"
            class="border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="font-medium text-lg">{{ userName }}</div>
              <span
                :class="[
                  'px-3 py-1 text-sm rounded-full',
                  getRecordStatus(userRecords).class
                ]"
              >
                {{ getRecordStatus(userRecords).text }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="record in userRecords"
                :key="record.id"
                class="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded"
              >
                <span
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded',
                    record.type === 'clock_in'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ record.type === 'clock_in' ? '出勤' : '退勤' }}
                </span>
                <span class="font-medium">{{ formatTime(record.timestamp) }}</span>
                <span class="text-gray-500 truncate flex-1">
                  {{ record.location.address }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
