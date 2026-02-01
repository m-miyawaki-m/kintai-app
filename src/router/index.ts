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

// Wait for auth state to be ready
function getCurrentUser(): Promise<typeof auth.currentUser> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

async function getUserRole(uid: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    return userDoc.exists() ? userDoc.data().role : null
  } catch (e) {
    console.error('getUserRole error:', e)
    return null
  }
}

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
