<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')

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
