import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import type { User, AuthState } from '@/types'

const state = ref<AuthState>({
  user: null,
  loading: true,
  error: null
})

let initialized = false

async function fetchUserData(firebaseUser: FirebaseUser): Promise<User | null> {
  // Determine role based on email (for dev environment)
  const isAdminEmail = firebaseUser.email === 'admin@example.com'
  const role = isAdminEmail ? 'admin' : 'user'
  const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (userDoc.exists()) {
      return userDoc.data() as User
    }

    // Document doesn't exist - create it
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      role,
      createdAt: serverTimestamp() as any
    }

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
      console.log('Created user document:', newUser)
    } catch (e) {
      console.log('Could not create user document, using default:', e)
    }

    return newUser
  } catch (error) {
    console.error('Error fetching user data:', error)
    // Return user info based on email
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      role,
      createdAt: null as any
    }
  }
}

function initAuth() {
  if (initialized) return
  initialized = true

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser)
      state.value.user = userData
    } else {
      state.value.user = null
    }
    state.value.loading = false
  })
}

// Initialize auth listener immediately
initAuth()

export function useAuth() {
  async function login(email: string, password: string): Promise<User | null> {
    state.value.error = null
    state.value.loading = true
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // Fetch user data immediately
      const userData = await fetchUserData(credential.user)
      console.log('login: userData =', userData)
      state.value.user = userData
      state.value.loading = false
      return userData
    } catch (error: any) {
      state.value.error = getErrorMessage(error.code)
      state.value.loading = false
      throw error
    }
  }

  async function register(
    email: string,
    password: string,
    displayName: string
  ): Promise<void> {
    state.value.error = null
    state.value.loading = true
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser: User = {
        uid: credential.user.uid,
        email: credential.user.email || email,
        displayName: displayName,
        role: 'user',
        createdAt: serverTimestamp() as any
      }
      await setDoc(doc(db, 'users', credential.user.uid), newUser)
      state.value.user = newUser
    } catch (error: any) {
      console.error('Register error:', error.code, error.message)
      state.value.error = getErrorMessage(error.code)
      state.value.loading = false
      throw error
    }
  }

  async function logout(): Promise<void> {
    try {
      await signOut(auth)
      state.value.user = null
    } catch (error: any) {
      state.value.error = getErrorMessage(error.code)
      throw error
    }
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'メールアドレスまたはパスワードが正しくありません'
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています'
      case 'auth/weak-password':
        return 'パスワードは6文字以上で入力してください'
      case 'auth/invalid-email':
        return '有効なメールアドレスを入力してください'
      default:
        return 'エラーが発生しました。もう一度お試しください'
    }
  }

  const currentUser = computed(() => state.value.user)
  const isAuthenticated = computed(() => !!state.value.user)
  const isAdmin = computed(() => state.value.user?.role === 'admin')
  const isLoading = computed(() => state.value.loading)
  const error = computed(() => state.value.error)

  return {
    user: state.value,
    currentUser,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    login,
    register,
    logout
  }
}
