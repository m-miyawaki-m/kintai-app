/**
 * Vue Router configuration with role-based navigation guards.
 * Routes are protected by auth state and user role (admin vs regular user).
 */
import { createRouter, createWebHistory } from 'vue-router'
import { auth, db } from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/AttendanceView.vue'),
      meta: { requiresAuth: true, requiresUser: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

/**
 * Wait for Firebase Auth to initialize and resolve the current user.
 * Uses onAuthStateChanged to avoid race conditions on page load.
 * @returns The authenticated Firebase user, or null if not logged in
 */
function getCurrentUser(): Promise<typeof auth.currentUser> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

/**
 * Fetch user role from Firestore 'users' collection.
 * @param uid - Firebase user UID
 * @returns User role ('user' | 'supervisor' | 'admin'), or null if not found
 */
async function getUserRole(uid: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    return userDoc.exists() ? userDoc.data().role : null
  } catch (e) {
    console.error('getUserRole error:', e)
    return null
  }
}

/**
 * Global navigation guard.
 * Enforces authentication and role-based access control:
 * - Guest-only pages redirect authenticated users to their dashboard
 * - Protected pages redirect unauthenticated users to login
 * - Admin pages are restricted to admin role
 * - User pages redirect admins to admin dashboard
 */
router.beforeEach(async (to, _from, next) => {
  const currentUser = await getCurrentUser()

  // Not logged in
  if (to.meta.requiresAuth && !currentUser) {
    next('/login')
    return
  }

  // Already logged in, trying to access login page
  if (to.meta.requiresGuest && currentUser) {
    const role = await getUserRole(currentUser.uid)
    next(role === 'admin' ? '/admin' : '/attendance')
    return
  }

  // Logged in user trying to access admin page
  if (to.meta.requiresAdmin && currentUser) {
    const role = await getUserRole(currentUser.uid)
    if (role !== 'admin') {
      next('/attendance')
      return
    }
  }

  // Admin trying to access user page
  if (to.meta.requiresUser && currentUser) {
    const role = await getUserRole(currentUser.uid)
    if (role === 'admin') {
      next('/admin')
      return
    }
  }

  next()
})

export default router
