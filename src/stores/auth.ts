/**
 * Pinia store for authentication state management.
 * Handles login, registration, logout, and auth state observation via Firebase Auth.
 * User profile data is persisted in the Firestore 'users' collection.
 */
import { defineStore } from 'pinia'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'
import { getAuthErrorMessage } from '@/constants/messages'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: true,
    error: null as string | null,
    initialized: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isSupervisor: (state) => state.user?.role === 'supervisor',
    subordinates: (state) => state.user?.subordinates ?? [],
    isLoading: (state) => state.loading
  },

  actions: {
    /**
     * Fetch or create a user profile in Firestore.
     * If no document exists, a new one is created with a default role.
     * @param firebaseUser - Firebase Auth user object
     * @returns User profile data, or null on failure
     */
    async fetchUserData(firebaseUser: FirebaseUser): Promise<User | null> {
      const isAdminEmail = firebaseUser.email === 'admin@example.com'
      const role = isAdminEmail ? 'admin' : 'user'
      const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          console.log('State: User data fetched', userDoc.data())
          return userDoc.data() as User
        }

        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName,
          role,
          createdAt: serverTimestamp() as any
        }

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
          console.log('API: Created user document', { uid: newUser.uid })
        } catch (e) {
          console.error('API: Failed to create user document', e)
        }

        return newUser
      } catch (error) {
        console.error('API: Error fetching user data', error)
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName,
          role,
          createdAt: null as any
        }
      }
    },

    /** Subscribe to Firebase Auth state changes. Called once on app startup. */
    initAuth() {
      if (this.initialized) return
      this.initialized = true

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userData = await this.fetchUserData(firebaseUser)
          this.user = userData
          console.log('State: Auth state changed - logged in', userData?.email)
        } else {
          this.user = null
          console.log('State: Auth state changed - logged out')
        }
        this.loading = false
      })
    },

    /**
     * Sign in with email and password.
     * @param email - User's email address
     * @param password - User's password
     * @returns Authenticated user profile, or throws on failure
     */
    async login(email: string, password: string): Promise<User | null> {
      this.error = null
      this.loading = true
      try {
        console.log('API: signInWithEmailAndPassword', { email })
        const credential = await signInWithEmailAndPassword(auth, email, password)
        const userData = await this.fetchUserData(credential.user)
        this.user = userData
        this.loading = false
        console.log('State: User logged in', userData?.email)
        return userData
      } catch (error: any) {
        console.error('API: Login failed', error.code)
        this.error = getAuthErrorMessage(error.code)
        this.loading = false
        throw error
      }
    },

    /**
     * Register a new user account and create their Firestore profile.
     * @param email - New user's email address
     * @param password - New user's password (min 6 characters)
     * @param displayName - Display name shown in the UI
     */
    async register(email: string, password: string, displayName: string): Promise<void> {
      this.error = null
      this.loading = true
      try {
        console.log('API: createUserWithEmailAndPassword', { email })
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser: User = {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName,
          role: 'user',
          createdAt: serverTimestamp() as any
        }
        await setDoc(doc(db, 'users', credential.user.uid), newUser)
        this.user = newUser
        console.log('State: User registered', newUser.email)
      } catch (error: any) {
        console.error('API: Register failed', error.code)
        this.error = getAuthErrorMessage(error.code)
        this.loading = false
        throw error
      }
    },

    /** Sign out the current user and clear local state. */
    async logout(): Promise<void> {
      try {
        console.log('API: signOut')
        await signOut(auth)
        this.user = null
        console.log('State: User logged out')
      } catch (error: any) {
        console.error('API: Logout failed', error)
        this.error = getAuthErrorMessage(error.code)
        throw error
      }
    }
  }
})
