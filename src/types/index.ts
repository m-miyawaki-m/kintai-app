import type { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email: string
  displayName: string
  role: 'user' | 'supervisor' | 'admin'
  subordinates?: string[] // UIDs of subordinate users (for supervisor)
  createdAt: Timestamp
}

export interface Location {
  latitude: number
  longitude: number
  address: string
}

export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  type: 'clock_in' | 'clock_out'
  timestamp: Timestamp
  location: Location
  date: string // 'YYYY-MM-DD' format
}

export interface GeolocationState {
  loading: boolean
  error: string | null
  position: {
    latitude: number
    longitude: number
  } | null
  address: string | null
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
