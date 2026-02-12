/**
 * Shared TypeScript type definitions for the Kintai application.
 */
import type { Timestamp } from 'firebase/firestore'

/** Authenticated user profile stored in Firestore 'users' collection */
export interface User {
  uid: string
  email: string
  displayName: string
  /** Role determines access: user (attendance), supervisor (+ subordinates view), admin (full management) */
  role: 'user' | 'supervisor' | 'admin'
  /** UIDs of subordinate users (only for supervisor role) */
  subordinates?: string[]
  createdAt: Timestamp
}

/** Geographic coordinates with a resolved street address */
export interface Location {
  latitude: number
  longitude: number
  address: string
}

/** A single clock-in or clock-out entry stored in Firestore 'attendances' collection */
export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  type: 'clock_in' | 'clock_out'
  timestamp: Timestamp
  location: Location
  /** Date string in 'YYYY-MM-DD' format, used for daily queries */
  date: string
}

/** Reactive state for the browser Geolocation API wrapper */
export interface GeolocationState {
  loading: boolean
  error: string | null
  position: {
    latitude: number
    longitude: number
  } | null
  address: string | null
}

/** Reactive state for the authentication store */
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
