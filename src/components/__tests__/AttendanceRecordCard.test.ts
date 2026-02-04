import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AttendanceRecordCard from '../AttendanceRecordCard.vue'
import type { AttendanceRecord } from '@/types'
import type { Timestamp } from 'firebase/firestore'

// Mock Timestamp
const createMockTimestamp = (dateStr: string): Timestamp => ({
  toDate: () => new Date(dateStr),
  seconds: Math.floor(new Date(dateStr).getTime() / 1000),
  nanoseconds: 0,
  toMillis: () => new Date(dateStr).getTime(),
  isEqual: () => false
} as Timestamp)

const createMockRecord = (
  type: 'clock_in' | 'clock_out',
  time: string,
  address: string
): AttendanceRecord => ({
  id: `record-${type}`,
  userId: 'user123',
  userName: 'Test User',
  type,
  timestamp: createMockTimestamp(time),
  location: {
    latitude: 35.6762,
    longitude: 139.6503,
    address
  },
  date: time.split('T')[0]
})

describe('AttendanceRecordCard', () => {
  describe('User Name Display', () => {
    it('should display user name when provided', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          userName: '山田 太郎'
        }
      })
      expect(wrapper.text()).toContain('山田 太郎')
    })

    it('should not display user name section when not provided', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {}
      })
      expect(wrapper.find('.font-medium.min-w-\\[100px\\]').exists()).toBe(false)
    })
  })

  describe('Status Display', () => {
    it('should show "未出勤" when no clock in', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          showStatus: true
        }
      })
      expect(wrapper.text()).toContain('未出勤')
    })

    it('should show "勤務中" when clocked in but not out', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:00:00', '東京都渋谷区')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          clockIn,
          showStatus: true
        }
      })
      expect(wrapper.text()).toContain('勤務中')
    })

    it('should show "退勤済" when both clocked in and out', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:00:00', '東京都渋谷区')
      const clockOut = createMockRecord('clock_out', '2025-02-05T18:00:00', '東京都渋谷区')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          clockIn,
          clockOut,
          showStatus: true
        }
      })
      expect(wrapper.text()).toContain('退勤済')
    })

    it('should hide status when showStatus is false', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          showStatus: false
        }
      })
      expect(wrapper.text()).not.toContain('未出勤')
      expect(wrapper.text()).not.toContain('勤務中')
      expect(wrapper.text()).not.toContain('退勤済')
    })
  })

  describe('Time Display', () => {
    it('should show "--:--" when no clock in time', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {}
      })
      const text = wrapper.text()
      // Should have at least one "--:--" for clock in
      expect(text).toContain('--:--')
    })

    it('should show formatted time when clock in exists', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:30:00', '東京都渋谷区')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          clockIn
        }
      })
      // Time should be formatted as HH:MM
      expect(wrapper.text()).toContain('09:30')
    })

    it('should show both times when fully clocked', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:00:00', '東京都渋谷区')
      const clockOut = createMockRecord('clock_out', '2025-02-05T18:30:00', '東京都新宿区')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          clockIn,
          clockOut
        }
      })
      expect(wrapper.text()).toContain('09:00')
      expect(wrapper.text()).toContain('18:30')
    })
  })

  describe('Address Display', () => {
    it('should show "-" when no address', () => {
      const wrapper = mount(AttendanceRecordCard, {
        props: {}
      })
      expect(wrapper.text()).toContain('-')
    })

    it('should show address when clock in has location', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:00:00', '東京都渋谷区道玄坂1-1-1')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          clockIn
        }
      })
      expect(wrapper.text()).toContain('東京都渋谷区道玄坂1-1-1')
    })
  })

  describe('Supervisor View (TC-SUP-002)', () => {
    it('should display all required info for supervisor view', () => {
      const clockIn = createMockRecord('clock_in', '2025-02-05T09:15:00', '東京都渋谷区')
      const wrapper = mount(AttendanceRecordCard, {
        props: {
          userName: '山田 太郎',
          clockIn,
          clockOut: null,
          showStatus: true
        }
      })

      // Check all elements are present
      expect(wrapper.text()).toContain('山田 太郎')  // Name
      expect(wrapper.text()).toContain('勤務中')     // Status
      expect(wrapper.text()).toContain('出勤')       // Clock in label
      expect(wrapper.text()).toContain('09:15')      // Clock in time
      expect(wrapper.text()).toContain('東京都渋谷区') // Address
      expect(wrapper.text()).toContain('退勤')       // Clock out label
      expect(wrapper.text()).toContain('--:--')      // No clock out time
    })
  })
})
