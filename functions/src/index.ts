import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

admin.initializeApp()

const db = admin.firestore()

// Create user document when a new user signs up
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const docRef = db.collection('users').doc(user.uid)

  try {
    // Check if document already exists (e.g., created by seed script)
    const existingDoc = await docRef.get()
    if (existingDoc.exists) {
      functions.logger.info(`User document already exists for ${user.uid}, skipping`)
      return
    }

    const userDoc = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      role: 'user' as const,
      createdAt: FieldValue.serverTimestamp()
    }

    await docRef.set(userDoc)
    functions.logger.info(`User document created for ${user.uid}`)
  } catch (error) {
    functions.logger.error(`Error creating user document for ${user.uid}:`, error)
    throw error
  }
})

// Optional: Delete user document when user is deleted
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    await db.collection('users').doc(user.uid).delete()
    functions.logger.info(`User document deleted for ${user.uid}`)
  } catch (error) {
    functions.logger.error(`Error deleting user document for ${user.uid}:`, error)
    throw error
  }
})

// Optional: Set admin role (callable function for admin setup)
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to set admin role'
    )
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get()
  const callerData = callerDoc.data()

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an admin to set admin role'
    )
  }

  const { userId } = data
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID must be provided'
    )
  }

  try {
    await db.collection('users').doc(userId).update({ role: 'admin' })
    return { success: true, message: `User ${userId} is now an admin` }
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to set admin role')
  }
})
