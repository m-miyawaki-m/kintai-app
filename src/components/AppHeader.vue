/**
 * AppHeader component.
 * Displays the system title, current page name, user display name, and logout button.
 * Shown on all pages except the login page (controlled by App.vue).
 */
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  /** Current page name displayed in the center of the header */
  pageName?: string
}>()

const router = useRouter()
const { currentUser, logout } = useAuth()

const displayName = computed(() => currentUser.value?.displayName || 'ゲスト')

/** Handle logout: sign out and redirect to login page */
async function handleLogout() {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Left: System name -->
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-primary-600">
            勤怠管理
          </h1>
        </div>

        <!-- Center: Page name -->
        <div v-if="pageName" class="text-lg font-medium text-gray-700">
          {{ pageName }}
        </div>

        <!-- Right: User info & Logout -->
        <div v-if="currentUser" class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">
            {{ displayName }}
          </span>
          <button
            @click="handleLogout"
            class="text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-1 border rounded"
          >
            ログアウト
          </button>
        </div>
        <div v-else class="w-24"></div>
      </div>
    </div>
  </header>
</template>
