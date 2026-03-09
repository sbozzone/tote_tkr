import { type FirebaseApp, initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { type Database, getDatabase } from 'firebase/database'
import { type FirebaseStorage, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

import { fileToDataUrl } from './files'

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyCU_TjEqkhcTnCJwbalkro5MKEHclj1qsg',
  authDomain: 'totescan-998a3.firebaseapp.com',
  databaseURL: 'https://totescan-998a3-default-rtdb.firebaseio.com',
  projectId: 'totescan-998a3',
  storageBucket: 'totescan-998a3.firebasestorage.app',
  messagingSenderId: '172470239913',
  appId: '1:172470239913:web:3fe312c7b9feccafd8dfb8',
  measurementId: 'G-R0BP2XQNR2',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || defaultFirebaseConfig.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let realtimeDb: Database | null = null
let firebaseStorage: FirebaseStorage | null = null
let anonymousSignInPromise: Promise<void> | null = null
let firebaseApp: FirebaseApp | null = null

function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    return null
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
  }

  return firebaseApp
}

export function getRealtimeDb() {
  if (!realtimeDb) {
    const app = getFirebaseApp()

    if (!app) {
      return null
    }

    realtimeDb = getDatabase(app)
  }

  return realtimeDb
}

export function getFirebaseStorage() {
  if (!firebaseStorage) {
    const app = getFirebaseApp()

    if (!app) {
      return null
    }

    firebaseStorage = getStorage(app)
  }

  return firebaseStorage
}

export async function ensureAnonymousSession() {
  const app = getFirebaseApp()

  if (!app) {
    return
  }

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = signInAnonymously(getAuth(app))
      .then(() => undefined)
      .catch(() => undefined)
  }

  await anonymousSignInPromise
}

export async function uploadItemPhoto(file: File, toteId: string) {
  const storage = getFirebaseStorage()

  if (!storage) {
    return fileToDataUrl(file)
  }

  try {
    await ensureAnonymousSession()

    const safeName = file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()
    const storageRef = ref(storage, `totes/${toteId}/${crypto.randomUUID()}-${safeName}`)

    await uploadBytes(storageRef, file)

    return await getDownloadURL(storageRef)
  } catch {
    return fileToDataUrl(file)
  }
}
