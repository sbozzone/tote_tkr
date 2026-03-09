export function buildToteQrValue(toteId: string) {
  if (typeof window === 'undefined') {
    return `totescan://tote/${toteId}`
  }

  const basePath = import.meta.env.BASE_URL || '/'
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`

  return new URL(`${normalizedBasePath}#/totes/${toteId}`, window.location.origin).toString()
}

export function extractToteId(rawValue: string) {
  const value = rawValue.trim()

  if (!value) {
    return null
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return value
  }

  try {
    const url = new URL(value)
    const parts = [
      url.hostname,
      ...url.pathname.split('/').filter(Boolean),
      ...url.hash.replace(/^#/, '').split('/').filter(Boolean),
    ]
    const toteIndex = parts.findIndex((part) => part === 'tote' || part === 'totes')

    if (toteIndex >= 0 && parts[toteIndex + 1]) {
      return parts[toteIndex + 1]
    }
  } catch {
    const match = value.match(/totes?\/([a-z0-9-]+)/i) ?? value.match(/tote:([a-z0-9-]+)/i)
    return match?.[1] ?? null
  }

  return null
}
