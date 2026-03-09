import { useEffect, useEffectEvent, useId, useState } from 'react'

type QrScannerProps = {
  onScan: (value: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const regionId = useId().replace(/:/g, '')
  const [status, setStatus] = useState('Starting camera...')
  const onScanEvent = useEffectEvent(onScan)

  useEffect(() => {
    let active = true
    let scanner: {
      stop: () => Promise<void>
      clear: () => void
    } | null = null

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!active) {
          return
        }

        const cameras = await Html5Qrcode.getCameras()

        if (!cameras.length) {
          setStatus('No camera detected. Use manual code entry below.')
          return
        }

        const html5Qrcode = new Html5Qrcode(regionId)
        scanner = html5Qrcode

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: {
              width: 240,
              height: 240,
            },
          },
          (decodedText: string) => {
            setStatus('Code detected. Opening tote...')
            onScanEvent(decodedText)
          },
          () => undefined,
        )

        if (active) {
          setStatus('Point the camera at a ToteScan label.')
        }
      } catch {
        if (active) {
          setStatus('Camera access failed. Use manual code entry below.')
        }
      }
    }

    startScanner()

    return () => {
      active = false

      scanner
        ?.stop()
        .catch(() => undefined)
        .finally(() => {
          scanner?.clear()
        })
    }
  }, [regionId])

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:#e5ddd0]">
        <div className="min-h-72 [&>div]:min-h-72" id={regionId} />
      </div>
      <p className="text-sm text-[color:var(--muted)]">{status}</p>
    </div>
  )
}
