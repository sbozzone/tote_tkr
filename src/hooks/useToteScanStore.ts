import { useEffect, useState } from 'react'
import { equalTo, get, onValue, orderByChild, query, ref, set, update } from 'firebase/database'

import { ensureAnonymousSession, getRealtimeDb, isFirebaseConfigured } from '../lib/firebase'
import { loadState, saveState } from '../lib/storage'
import type { AppState, Item, ItemInput, Tote, ToteInput } from '../types'

function touchDate() {
  return new Date().toISOString()
}

function touchToteDates(state: AppState, toteId: string) {
  return state.totes.map((tote) =>
    tote.id === toteId
      ? {
          ...tote,
          dateUpdated: touchDate(),
        }
      : tote,
  )
}

function valuesFromSnapshot<T>(value: unknown) {
  if (!value || typeof value !== 'object') {
    return [] as T[]
  }

  return Object.values(value as Record<string, T>)
}

export function useToteScanStore() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [syncStatus, setSyncStatus] = useState(
    isFirebaseConfigured ? 'Connecting to Firebase...' : 'Local mode',
  )

  async function requireAnonymousAccess() {
    try {
      await ensureAnonymousSession()
      return true
    } catch {
      setSyncStatus('Enable Anonymous auth in Firebase Console')
      return false
    }
  }

  useEffect(() => {
    if (isFirebaseConfigured) {
      return
    }

    saveState(state)
  }, [state])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      navigator.storage?.persist?.().catch(() => undefined)
      return
    }

    const db = getRealtimeDb()

    if (!db) {
      return
    }

    const unsubscribeTotes = onValue(
      ref(db, 'totes'),
      (snapshot) => {
        const totes = valuesFromSnapshot<Tote>(snapshot.val()).sort(
          (left, right) => new Date(right.dateUpdated).getTime() - new Date(left.dateUpdated).getTime(),
        )

        setState((current) => ({
          ...current,
          totes,
        }))
        setSyncStatus('Firebase Realtime Database')
      },
      () => {
        setSyncStatus('Firebase read blocked by rules or auth')
      },
    )

    const unsubscribeItems = onValue(
      ref(db, 'items'),
      (snapshot) => {
        const items = valuesFromSnapshot<Item>(snapshot.val())

        setState((current) => ({
          ...current,
          items,
        }))
        setSyncStatus('Firebase Realtime Database')
      },
      () => {
        setSyncStatus('Firebase read blocked by rules or auth')
      },
    )

    return () => {
      unsubscribeTotes()
      unsubscribeItems()
    }
  }, [])

  async function createTote(input: ToteInput) {
    const toteId = crypto.randomUUID()
    const nextTote: Tote = {
      id: toteId,
      name: input.name.trim(),
      location: input.location.trim(),
      owner: input.owner.trim(),
      dateUpdated: touchDate(),
    }

    if (isFirebaseConfigured) {
      const db = getRealtimeDb()

      if (!db) {
        return toteId
      }

      if (!(await requireAnonymousAccess())) {
        return toteId
      }

      await set(ref(db, `totes/${toteId}`), nextTote)
      return toteId
    }

    setState((current) => ({
      ...current,
      totes: [nextTote, ...current.totes],
    }))

    return toteId
  }

  async function updateTote(toteId: string, input: ToteInput) {
    const nextTote = {
      name: input.name.trim(),
      location: input.location.trim(),
      owner: input.owner.trim(),
      dateUpdated: touchDate(),
    }

    if (isFirebaseConfigured) {
      const db = getRealtimeDb()

      if (!db) {
        return
      }

      if (!(await requireAnonymousAccess())) {
        return
      }

      await update(ref(db, `totes/${toteId}`), nextTote)
      return
    }

    setState((current) => ({
      ...current,
      totes: current.totes.map((tote) =>
        tote.id === toteId
          ? {
              ...tote,
              ...nextTote,
            }
          : tote,
      ),
    }))
  }

  async function deleteTote(toteId: string) {
    if (isFirebaseConfigured) {
      const db = getRealtimeDb()

      if (!db) {
        return
      }

      if (!(await requireAnonymousAccess())) {
        return
      }

      const itemsSnapshot = await get(query(ref(db, 'items'), orderByChild('toteId'), equalTo(toteId)))
      const updates: Record<string, null> = {
        [`totes/${toteId}`]: null,
      }

      valuesFromSnapshot<Item>(itemsSnapshot.val()).forEach((item) => {
        updates[`items/${item.id}`] = null
      })

      await update(ref(db), updates)
      return
    }

    setState((current) => ({
      totes: current.totes.filter((tote) => tote.id !== toteId),
      items: current.items.filter((item) => item.toteId !== toteId),
    }))
  }

  async function createItem(toteId: string, input: ItemInput) {
    const nextItem: Item = {
      id: crypto.randomUUID(),
      toteId,
      name: input.name.trim(),
      quantity: input.quantity,
      notes: input.notes.trim(),
      photoUrl: input.photoUrl,
    }

    if (isFirebaseConfigured) {
      const db = getRealtimeDb()

      if (!db) {
        return
      }

      if (!(await requireAnonymousAccess())) {
        return
      }

      await update(ref(db), {
        [`items/${nextItem.id}`]: nextItem,
        [`totes/${toteId}/dateUpdated`]: touchDate(),
      })
      return
    }

    setState((current) => ({
      totes: touchToteDates(current, toteId),
      items: [nextItem, ...current.items],
    }))
  }

  async function updateItem(itemId: string, input: ItemInput) {
    const nextItem = {
      name: input.name.trim(),
      quantity: input.quantity,
      notes: input.notes.trim(),
      photoUrl: input.photoUrl,
    }

    if (isFirebaseConfigured) {
      const db = getRealtimeDb()
      const existingItem = state.items.find((entry) => entry.id === itemId)

      if (!db || !existingItem) {
        return
      }

      if (!(await requireAnonymousAccess())) {
        return
      }

      await update(ref(db), {
        [`items/${itemId}/name`]: nextItem.name,
        [`items/${itemId}/quantity`]: nextItem.quantity,
        [`items/${itemId}/notes`]: nextItem.notes,
        [`items/${itemId}/photoUrl`]: nextItem.photoUrl,
        [`totes/${existingItem.toteId}/dateUpdated`]: touchDate(),
      })
      return
    }

    setState((current) => {
      const item = current.items.find((entry) => entry.id === itemId)

      if (!item) {
        return current
      }

      return {
        totes: touchToteDates(current, item.toteId),
        items: current.items.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                ...nextItem,
              }
            : entry,
        ),
      }
    })
  }

  async function deleteItem(itemId: string) {
    if (isFirebaseConfigured) {
      const db = getRealtimeDb()
      const existingItem = state.items.find((entry) => entry.id === itemId)

      if (!db || !existingItem) {
        return
      }

      if (!(await requireAnonymousAccess())) {
        return
      }

      await update(ref(db), {
        [`items/${itemId}`]: null,
        [`totes/${existingItem.toteId}/dateUpdated`]: touchDate(),
      })
      return
    }

    setState((current) => {
      const item = current.items.find((entry) => entry.id === itemId)

      if (!item) {
        return current
      }

      return {
        totes: touchToteDates(current, item.toteId),
        items: current.items.filter((entry) => entry.id !== itemId),
      }
    })
  }

  return {
    totes: state.totes,
    items: state.items,
    createTote,
    updateTote,
    deleteTote,
    createItem,
    updateItem,
    deleteItem,
    storageMode: isFirebaseConfigured ? 'firebase' : 'local',
    syncStatus,
  }
}

export type ToteScanStore = ReturnType<typeof useToteScanStore>
