import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import type { User } from '@/types'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {},
  db: {}
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 }))
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('should be loading initially', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(true)
    })

    it('should have no error initially', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Getters', () => {
    it('isAuthenticated should return false when user is null', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated should return true when user exists', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'user' } as User
      expect(store.isAuthenticated).toBe(true)
    })

    it('isAdmin should return true for admin role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'admin' } as User
      expect(store.isAdmin).toBe(true)
    })

    it('isAdmin should return false for non-admin role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'user' } as User
      expect(store.isAdmin).toBe(false)
    })

    it('isSupervisor should return true for supervisor role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'supervisor' } as User
      expect(store.isSupervisor).toBe(true)
    })

    it('isSupervisor should return false for non-supervisor role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'user' } as User
      expect(store.isSupervisor).toBe(false)
    })

    it('subordinates should return empty array when user has no subordinates', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'supervisor' } as User
      expect(store.subordinates).toEqual([])
    })

    it('subordinates should return subordinates array when exists', () => {
      const store = useAuthStore()
      store.user = {
        uid: '123',
        role: 'supervisor',
        subordinates: ['user1', 'user2', 'user3']
      } as User
      expect(store.subordinates).toEqual(['user1', 'user2', 'user3'])
    })
  })

  describe('Role Checks', () => {
    it('should correctly identify user role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'user' } as User

      expect(store.isAdmin).toBe(false)
      expect(store.isSupervisor).toBe(false)
      expect(store.currentUser?.role).toBe('user')
    })

    it('should correctly identify supervisor role', () => {
      const store = useAuthStore()
      store.user = {
        uid: '123',
        role: 'supervisor',
        subordinates: ['a', 'b']
      } as User

      expect(store.isAdmin).toBe(false)
      expect(store.isSupervisor).toBe(true)
      expect(store.subordinates.length).toBe(2)
    })

    it('should correctly identify admin role', () => {
      const store = useAuthStore()
      store.user = { uid: '123', role: 'admin' } as User

      expect(store.isAdmin).toBe(true)
      expect(store.isSupervisor).toBe(false)
    })
  })
})
