import type { AppState } from '../types'

const STORAGE_KEY = 'totescan.v1'

const emptyState: AppState = {
  totes: [],
  items: [],
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return emptyState
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return emptyState
    }

    const parsed = JSON.parse(raw) as AppState

    if (!Array.isArray(parsed.totes) || !Array.isArray(parsed.items)) {
      return emptyState
    }

    return parsed
  } catch {
    return emptyState
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
