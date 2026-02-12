/**
 * Seed script for sample attendance data
 * Creates 2/1-2/10 attendance records (weekdays only, 9:00-17:00)
 * Works with both production and emulator
 */

// Configuration - change these for production vs emulator
const USE_EMULATOR = process.argv.includes('--emulator')

// API key must be set via environment variable (not hardcoded for security)
const API_KEY = process.env.FIREBASE_API_KEY
if (!API_KEY) {
  console.error('❌ FIREBASE_API_KEY environment variable is required')
  console.error('   Set it before running: export FIREBASE_API_KEY=your-api-key')
  process.exit(1)
}

const PROJECT_ID = 'kintai-app-mm'
const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'

// Fukuoka locations for random selection
const FUKUOKA_LOCATIONS = [
  { latitude: 33.5902, longitude: 130.4017, address: '福岡市 博多区 博多駅前' },
  { latitude: 33.5897, longitude: 130.3988, address: '福岡市 博多区 祇園町' },
  { latitude: 33.5903, longitude: 130.3992, address: '福岡市 博多区 冷泉町' },
  { latitude: 33.5898, longitude: 130.4010, address: '福岡市 博多区 店屋町' },
  { latitude: 33.5879, longitude: 130.3989, address: '福岡市 博多区 中洲' },
  { latitude: 33.5902, longitude: 130.3816, address: '福岡市 中央区 天神' },
  { latitude: 33.5895, longitude: 130.3854, address: '福岡市 中央区 大名' },
  { latitude: 33.5868, longitude: 130.3893, address: '福岡市 中央区 春吉' },
  { latitude: 33.5921, longitude: 130.3785, address: '福岡市 中央区 赤坂' },
  { latitude: 33.5845, longitude: 130.3956, address: '福岡市 中央区 清川' },
  { latitude: 33.5833, longitude: 130.3911, address: '福岡市 中央区 渡辺通' },
  { latitude: 33.5812, longitude: 130.3858, address: '福岡市 中央区 薬院' },
]

// Users to create attendance for
const USERS = [
  { email: 'supervisor@example.com', password: 'password', displayName: '鈴木 一郎' },
  { email: 'user01@example.com', password: 'password', displayName: '山田 太郎' },
  { email: 'user02@example.com', password: 'password', displayName: '佐藤 花子' },
  { email: 'user03@example.com', password: 'password', displayName: '田中 次郎' },
  { email: 'user04@example.com', password: 'password', displayName: '高橋 美咲' },
  { email: 'user05@example.com', password: 'password', displayName: '伊藤 健太' },
]

// Date range: 2/1 - 2/10, 2025
const START_DATE = new Date('2025-02-01')
const END_DATE = new Date('2025-02-10')

function getRandomLocation() {
  return FUKUOKA_LOCATIONS[Math.floor(Math.random() * FUKUOKA_LOCATIONS.length)]
}

function getRandomTime(baseHour, minuteRange) {
  const minutes = Math.floor(Math.random() * minuteRange)
  return { hour: baseHour, minute: minutes }
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

async function signIn(email, password) {
  const url = USE_EMULATOR
    ? `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`
    : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  })

  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

async function createAttendanceRecord(idToken, userId, userName, type, timestamp, location, date) {
  const baseUrl = USE_EMULATOR
    ? `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

  const docData = {
    fields: {
      userId: { stringValue: userId },
      userName: { stringValue: userName },
      type: { stringValue: type },
      timestamp: { timestampValue: timestamp.toISOString() },
      date: { stringValue: date },
      location: {
        mapValue: {
          fields: {
            latitude: { doubleValue: location.latitude },
            longitude: { doubleValue: location.longitude },
            address: { stringValue: location.address }
          }
        }
      }
    }
  }

  const response = await fetch(`${baseUrl}/attendances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(docData)
  })

  const data = await response.json()
  if (data.error) throw new Error(JSON.stringify(data.error))
  return data
}

async function createAttendanceForUser(user) {
  console.log(`\n  Processing ${user.displayName} (${user.email})...`)

  // Sign in
  const authData = await signIn(user.email, user.password)
  const { localId: userId, idToken } = authData

  let recordCount = 0
  const currentDate = new Date(START_DATE)

  while (currentDate <= END_DATE) {
    // Skip weekends
    if (!isWeekend(currentDate)) {
      const dateStr = formatDate(currentDate)

      // Clock in: 8:50 - 9:10
      const clockInTime = getRandomTime(8, 20)
      const clockInDate = new Date(currentDate)
      clockInDate.setHours(clockInTime.hour, 50 + clockInTime.minute, 0, 0)
      const clockInLocation = getRandomLocation()

      await createAttendanceRecord(
        idToken, userId, user.displayName,
        'clock_in', clockInDate, clockInLocation, dateStr
      )

      // Clock out: 17:00 - 17:30
      const clockOutTime = getRandomTime(17, 30)
      const clockOutDate = new Date(currentDate)
      clockOutDate.setHours(clockOutTime.hour, clockOutTime.minute, 0, 0)
      const clockOutLocation = getRandomLocation()

      await createAttendanceRecord(
        idToken, userId, user.displayName,
        'clock_out', clockOutDate, clockOutLocation, dateStr
      )

      recordCount++
      process.stdout.write(`    ${dateStr} ✓\n`)
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`    Total: ${recordCount} days`)
}

async function seed() {
  console.log('\n🌱 Seeding Attendance Data...')
  console.log(`   Mode: ${USE_EMULATOR ? 'Emulator' : 'Production'}`)
  console.log(`   Date range: ${formatDate(START_DATE)} - ${formatDate(END_DATE)}`)
  console.log(`   Users: ${USERS.length}`)

  for (const user of USERS) {
    try {
      await createAttendanceForUser(user)
    } catch (error) {
      console.error(`  ❌ Error for ${user.email}:`, error.message)
    }
  }

  console.log('\n✨ Attendance data seeding complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Weekdays: 2/1(月), 2/3(月), 2/4(火), 2/5(水), 2/6(木), 2/7(金), 2/10(月)`)
  console.log(`   - Skipped: 2/2(日), 2/8(土), 2/9(日)`)
  console.log(`   - Work hours: 9:00-17:00 (with random variance)`)
  console.log(`   - Locations: Random Fukuoka addresses`)
}

seed().catch(error => {
  console.error('Seed failed:', error)
  process.exit(1)
})
