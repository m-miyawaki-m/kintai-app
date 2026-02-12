/**
 * Root application component.
 * Renders AppHeader on all pages except login, and delegates routing to RouterView.
 */
<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()

/** Hide header on the login page */
const isLoginPage = computed(() => route.path === '/login')

/** Map route name to Japanese page title for the header */
const pageName = computed(() => {
  switch (route.name) {
    case 'attendance':
      return '出退勤'
    case 'admin':
      return '管理'
    default:
      return ''
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader v-if="!isLoginPage" :page-name="pageName" />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
