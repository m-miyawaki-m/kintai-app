/**
 * Composable wrapper around the auth Pinia store.
 * Provides reactive auth state and actions for use in Vue components.
 * Automatically initializes the Firebase Auth listener on first call.
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

/** Ensures the auth listener is initialized only once across all component instances */
let initialized = false

/**
 * Composable providing authentication state and actions.
 * @returns Reactive refs for user, auth status, and login/register/logout methods
 */
export function useAuth() {
  const store = useAuthStore()

  // Initialize auth listener once
  if (!initialized) {
    initialized = true
    store.initAuth()
  }

  const { user, error } = storeToRefs(store)

  return {
    user,
    currentUser: computed(() => store.currentUser),
    isAuthenticated: computed(() => store.isAuthenticated),
    isAdmin: computed(() => store.isAdmin),
    isSupervisor: computed(() => store.isSupervisor),
    subordinates: computed(() => store.subordinates),
    isLoading: computed(() => store.isLoading),
    error,
    login: store.login.bind(store),
    register: store.register.bind(store),
    logout: store.logout.bind(store)
  }
}
