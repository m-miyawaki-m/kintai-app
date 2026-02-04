import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Initialize auth listener on first import
let initialized = false

export function useAuth() {
  const store = useAuthStore()

  // Initialize auth listener once
  if (!initialized) {
    initialized = true
    store.initAuth()
  }

  const { user, loading, error } = storeToRefs(store)

  return {
    user,
    currentUser: computed(() => store.currentUser),
    isAuthenticated: computed(() => store.isAuthenticated),
    isAdmin: computed(() => store.isAdmin),
    isLoading: computed(() => store.isLoading),
    error,
    login: store.login.bind(store),
    register: store.register.bind(store),
    logout: store.logout.bind(store)
  }
}
