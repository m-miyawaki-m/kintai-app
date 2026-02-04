/**
 * Seed script for Firebase Emulator
 * Creates test users and initial data
 */

import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Set emulator hosts
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

// Initialize Firebase Admin
const app = initializeApp({ projectId: 'your-project-id' })
const auth = getAuth(app)
const db = getFirestore(app)

// Test users to create
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    displayName: '管理者',
    role: 'admin'
  },
  {
    email: 'user01@example.com',
    password: 'password',
    displayName: '山田 太郎',
    role: 'user'
  },
  {
    email: 'user02@example.com',
    password: 'password',
    displayName: '佐藤 花子',
    role: 'user'
  }
]

async function createUser(userData) {
  try {
    let uid

    // Check if user already exists
    try {
      const existing = await auth.getUserByEmail(userData.email)
      console.log(`  ⏭️  User ${userData.email} already exists (${existing.uid})`)
      uid = existing.uid
    } catch (e) {
      // User doesn't exist, create it
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      })
      console.log(`  ✅ Created auth user: ${userData.email} (${userRecord.uid})`)
      uid = userRecord.uid

      // Wait for onUserCreate trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update Firestore document with correct role (overwrite trigger's default)
    await db.collection('users').doc(uid).set({
      uid: uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: FieldValue.serverTimestamp()
    })

    console.log(`  ✅ Set Firestore doc with role: ${userData.role}`)

    return uid
  } catch (error) {
    console.error(`  ❌ Error creating user ${userData.email}:`, error.message)
    throw error
  }
}

async function seed() {
  console.log('\n🌱 Seeding Firebase Emulator...\n')

  // Check emulator connectivity
  try {
    await db.collection('_health').doc('check').set({ timestamp: new Date() })
    await db.collection('_health').doc('check').delete()
    console.log('✅ Connected to Firestore Emulator\n')
  } catch (error) {
    console.error('❌ Cannot connect to Firestore Emulator. Is it running?')
    console.error('   Run: npm run emulators')
    process.exit(1)
  }

  // Create users
  console.log('Creating users...')
  for (const user of testUsers) {
    await createUser(user)
  }

  // Generate dev users JSON for login page
  const devUsersJson = testUsers.map(u => ({
    label: `${u.displayName} (${u.role === 'admin' ? '管理者' : '一般'})`,
    email: u.email,
    password: u.password
  }))

  const outputPath = resolve(__dirname, '../public/dev-users.json')
  writeFileSync(outputPath, JSON.stringify(devUsersJson, null, 2))
  console.log(`\n📄 Generated ${outputPath}`)

  console.log('\n✨ Seeding complete!\n')
  console.log('Test accounts:')
  console.log('  📧 admin@example.com / admin123 (管理者)')
  console.log('  📧 user01@example.com / password (一般ユーザー)')
  console.log('  📧 user02@example.com / password (一般ユーザー)')
  console.log('')

  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
