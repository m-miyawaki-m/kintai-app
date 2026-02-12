/**
 * Seed script for Firebase Production using REST API
 * Creates test users without requiring service account
 */

// API key must be set via environment variable (not hardcoded for security)
const API_KEY = process.env.FIREBASE_API_KEY
if (!API_KEY) {
  console.error('❌ FIREBASE_API_KEY environment variable is required')
  console.error('   Set it before running: export FIREBASE_API_KEY=your-api-key')
  process.exit(1)
}

const PROJECT_ID = 'kintai-app-mm'

// Test users to create
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    displayName: '管理者',
    role: 'admin'
  },
  {
    email: 'supervisor@example.com',
    password: 'password',
    displayName: '鈴木 一郎',
    role: 'supervisor'
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
  },
  {
    email: 'user03@example.com',
    password: 'password',
    displayName: '田中 次郎',
    role: 'user'
  },
  {
    email: 'user04@example.com',
    password: 'password',
    displayName: '高橋 美咲',
    role: 'user'
  },
  {
    email: 'user05@example.com',
    password: 'password',
    displayName: '伊藤 健太',
    role: 'user'
  }
]

// Map to store created user UIDs
const userUids = new Map()

async function signUp(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  )

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }
  return data
}

async function signIn(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  )

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }
  return data
}

async function createFirestoreDoc(idToken, uid, userData) {
  const docData = {
    fields: {
      uid: { stringValue: uid },
      email: { stringValue: userData.email },
      displayName: { stringValue: userData.displayName },
      role: { stringValue: userData.role },
      createdAt: { timestampValue: new Date().toISOString() }
    }
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(docData)
    }
  )

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }
  return data
}

async function updateSubordinates(idToken, supervisorUid, subordinateUids) {
  const docData = {
    fields: {
      subordinates: {
        arrayValue: {
          values: subordinateUids.map(uid => ({ stringValue: uid }))
        }
      }
    }
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${supervisorUid}?updateMask.fieldPaths=subordinates`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(docData)
    }
  )

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }
  return data
}

async function createUser(userData) {
  try {
    let authData

    // Try to sign up, if exists try to sign in
    try {
      authData = await signUp(userData.email, userData.password)
      console.log(`  ✅ Created auth user: ${userData.email} (${authData.localId})`)
    } catch (e) {
      if (e.message === 'EMAIL_EXISTS') {
        authData = await signIn(userData.email, userData.password)
        console.log(`  ⏭️  User ${userData.email} already exists (${authData.localId})`)
      } else {
        throw e
      }
    }

    const uid = authData.localId
    const idToken = authData.idToken
    userUids.set(userData.email, { uid, idToken })

    // Create/update Firestore document
    await createFirestoreDoc(idToken, uid, userData)
    console.log(`  ✅ Set Firestore doc with role: ${userData.role}`)

    return uid
  } catch (error) {
    console.error(`  ❌ Error creating user ${userData.email}:`, error.message)
    throw error
  }
}

async function assignSubordinates() {
  const supervisor = userUids.get('supervisor@example.com')
  const subordinateEmails = [
    'user01@example.com',
    'user02@example.com',
    'user03@example.com',
    'user04@example.com',
    'user05@example.com'
  ]
  const subordinateUids = subordinateEmails.map(email => userUids.get(email).uid)

  await updateSubordinates(supervisor.idToken, supervisor.uid, subordinateUids)
  console.log(`  ✅ Assigned ${subordinateUids.length} subordinates to supervisor`)
}

async function seed() {
  console.log('\n🌱 Seeding Firebase Production...\n')

  // Create users
  console.log('Creating users...')
  for (const user of testUsers) {
    await createUser(user)
  }

  // Assign subordinates to supervisor
  console.log('\nAssigning subordinates...')
  await assignSubordinates()

  console.log('\n✨ Seeding complete!\n')
  console.log('Test accounts:')
  console.log('  📧 admin@example.com / admin123 (管理者)')
  console.log('  📧 supervisor@example.com / password (主任)')
  console.log('  📧 user01@example.com / password (一般ユーザー)')
  console.log('  📧 user02@example.com / password (一般ユーザー)')
  console.log('  📧 user03@example.com / password (一般ユーザー)')
  console.log('  📧 user04@example.com / password (一般ユーザー)')
  console.log('  📧 user05@example.com / password (一般ユーザー)')
  console.log('')
  console.log('🌐 Access: https://kintai-app-mm.web.app')
  console.log('')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
