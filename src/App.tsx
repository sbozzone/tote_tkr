import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

import { BottomNav } from './components/BottomNav'
import { QrScanner } from './components/QrScanner'
import { useToteScanStore, type ToteScanStore } from './hooks/useToteScanStore'
import { buildToteQrValue, extractToteId } from './lib/qr'
import type { Item, ItemInput, Tote, ToteInput } from './types'

type ToteDraft = ToteInput
type ItemDraft = ItemInput

const emptyToteDraft: ToteDraft = {
  name: '',
  location: '',
}

const emptyItemDraft: ItemDraft = {
  name: '',
  quantity: 1,
  notes: '',
}

function App() {
  const store = useToteScanStore()

  return (
    <Routes>
      <Route element={<AppShell store={store} />}>
        <Route index element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/totes/:toteId" element={<TotePageRoute />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}

function AppShell({ store }: { store: ToteScanStore }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[color:var(--ink)]">
      <div className="screen-only pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(95,153,126,0.18),transparent_65%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
        <header className="screen-only mb-6 overflow-hidden rounded-[32px] border border-[color:var(--line)] bg-[color:rgba(255,250,245,0.82)] p-5 shadow-[var(--shadow)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--highlight)]">
            ToteScan
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl leading-none">Find every part fast.</h1>
              <p className="mt-2 max-w-xs text-sm text-[color:var(--muted)]">
                QR labels, quick inventory updates, and workshop-friendly search in one mobile flow.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                {store.storageMode === 'firebase' ? `Cloud sync: ${store.syncStatus}` : 'Storage: Local preview mode'}
              </p>
            </div>
            <div className="rounded-[24px] bg-[color:var(--paper-strong)] px-4 py-3 text-right">
              <p className="text-2xl font-bold">{store.totes.length}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Totes</p>
            </div>
          </div>
        </header>

        <Outlet context={store} />
      </main>
      <BottomNav />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { totes, items, createTote, deleteTote } = useStore()
  const [draft, setDraft] = useState<ToteDraft>(emptyToteDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedTotes = [...totes].sort(
    (left, right) => new Date(right.dateUpdated).getTime() - new Date(left.dateUpdated).getTime(),
  )

  async function handleCreateTote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!draft.name.trim() || !draft.location.trim() || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const toteId = await createTote({
        name: draft.name,
        location: draft.location,
      })

      setDraft(emptyToteDraft)
      navigate(`/totes/${toteId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Items" value={items.length} />
        <MetricCard label="Totes" value={totes.length} />
        <MetricCard label="Ready" value={sortedTotes.length ? 'Live' : 'Start'} />
      </section>

      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl">Create a tote</h2>
            <p className="text-sm text-[color:var(--muted)]">Give it a name and location so it is label-ready.</p>
          </div>
          <Link
            className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)]"
            to="/scan"
          >
            Scan label
          </Link>
        </div>

        <form className="space-y-3" onSubmit={handleCreateTote}>
          <Field
            label="Tote name"
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Tote #3"
            value={draft.name}
          />
          <Field
            label="Location"
            onChange={(value) => setDraft((current) => ({ ...current, location: value }))}
            placeholder="Garage Rack A"
            value={draft.location}
          />
          <button
            className="w-full rounded-2xl bg-[color:var(--highlight)] px-4 py-3 font-semibold text-white transition hover:brightness-105"
            type="submit"
          >
            {isSubmitting ? 'Creating tote...' : 'Create tote and print label'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Recent totes</h2>
          <Link className="text-sm font-semibold text-[color:var(--accent)]" to="/search">
            Search inventory
          </Link>
        </div>

        {sortedTotes.length ? (
          sortedTotes.map((tote) => (
            <article
              className="rounded-[28px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.82)] p-4 shadow-[var(--shadow)] backdrop-blur"
              key={tote.id}
            >
              <div className="flex items-start justify-between gap-4">
                <Link className="min-w-0 flex-1" to={`/totes/${tote.id}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--highlight)]">
                    {tote.location}
                  </p>
                  <h3 className="mt-1 truncate text-xl">{tote.name}</h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">Updated {formatDate(tote.dateUpdated)}</p>
                </Link>
                <button
                  className="rounded-full border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)]"
                  onClick={() => {
                    if (window.confirm(`Delete ${tote.name} and all of its items?`)) {
                      void deleteTote(tote.id)
                    }
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyCard
            body="Create your first tote to generate a QR label and start tracking inventory."
            title="No totes yet"
          />
        )}
      </section>
    </div>
  )
}

function TotePageRoute() {
  const { toteId } = useParams()
  const { totes, storageMode } = useStore()

  if (!toteId) {
    return (
      <EmptyCard
        action={
          <Link className="rounded-full bg-[color:var(--accent)] px-4 py-2 font-semibold text-[color:var(--accent-ink)]" to="/">
            Back to totes
          </Link>
        }
        body="This route is missing a tote identifier."
        title="Tote not found"
      />
    )
  }

  const tote = totes.find((entry) => entry.id === toteId)

  if (!tote) {
    return (
      <EmptyCard
        action={
          <Link className="rounded-full bg-[color:var(--accent)] px-4 py-2 font-semibold text-[color:var(--accent-ink)]" to="/">
            Back to totes
          </Link>
        }
        body={
          storageMode === 'firebase'
            ? 'This QR label does not match a tote in Firebase yet.'
            : 'This tote label does not match a record in local storage yet.'
        }
        title="Tote not found"
      />
    )
  }

  return <TotePage key={toteId} tote={tote} toteId={toteId} />
}

function TotePage({ tote, toteId }: { tote: Tote; toteId: string }) {
  const navigate = useNavigate()
  const { items, updateTote, deleteTote, createItem, updateItem, deleteItem } = useStore()
  const toteItems = items
    .filter((item) => item.toteId === toteId)
    .sort((left, right) => left.name.localeCompare(right.name))
  const [toteDraft, setToteDraft] = useState<ToteDraft>(() => ({
    name: tote.name,
    location: tote.location,
  }))
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isSavingTote, setIsSavingTote] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)

  async function handleSaveTote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!toteDraft.name.trim() || !toteDraft.location.trim() || isSavingTote) {
      return
    }

    setIsSavingTote(true)

    try {
      await updateTote(toteId, toteDraft)
    } finally {
      setIsSavingTote(false)
    }
  }

  function beginEditItem(item: Item) {
    setEditingItemId(item.id)
    setItemDraft({
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
    })
  }

  function resetItemForm() {
    setEditingItemId(null)
    setItemDraft(emptyItemDraft)
  }

  async function handleSaveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!itemDraft.name.trim() || isSavingItem) {
      return
    }

    const normalizedDraft = {
      ...itemDraft,
      quantity: Number.isFinite(itemDraft.quantity) && itemDraft.quantity > 0 ? itemDraft.quantity : 1,
    }

    setIsSavingItem(true)

    try {
      if (editingItemId) {
        await updateItem(editingItemId, normalizedDraft)
      } else {
        await createItem(toteId, normalizedDraft)
      }

      resetItemForm()
    } finally {
      setIsSavingItem(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--highlight)]">
          {tote.location} / {tote.name}
        </p>
        <h2 className="mt-2 text-2xl">{tote.name}</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Updated {formatDate(tote.dateUpdated)}</p>

        <form className="mt-5 space-y-3" onSubmit={handleSaveTote}>
          <Field
            label="Rename tote"
            onChange={(value) => setToteDraft((current) => ({ ...current, name: value }))}
            value={toteDraft.name}
          />
          <Field
            label="Location"
            onChange={(value) => setToteDraft((current) => ({ ...current, location: value }))}
            value={toteDraft.location}
          />
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-2xl bg-[color:var(--accent)] px-4 py-3 font-semibold text-[color:var(--accent-ink)]"
              type="submit"
            >
              {isSavingTote ? 'Saving...' : 'Save details'}
            </button>
            <button
              className="rounded-2xl border border-[color:var(--line)] px-4 py-3 font-semibold text-[color:var(--muted)]"
              onClick={() => {
                if (window.confirm(`Delete ${tote.name} and all of its items?`)) {
                  void deleteTote(toteId).then(() => {
                    navigate('/')
                  })
                }
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        </form>
      </section>

      <section className="print-sheet rounded-[30px] border border-[color:var(--line)] bg-white p-5 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--highlight)]">
              Permanent QR label
            </p>
            <h3 className="mt-1 text-xl">{tote.name}</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{tote.location}</p>
          </div>
          <button
            className="screen-only rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold"
            onClick={() => window.print()}
            type="button"
          >
            Print label
          </button>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-[24px] bg-[color:var(--paper)] p-4">
          <QRCodeSVG bgColor="transparent" fgColor="#4f9072" size={132} value={buildToteQrValue(toteId)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{tote.name}</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{tote.location}</p>
            <p className="mt-3 break-all text-xs text-[color:var(--muted)]">{buildToteQrValue(toteId)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl">{editingItemId ? 'Edit item' : 'Add item'}</h3>
            <p className="text-sm text-[color:var(--muted)]">Fast updates for quantity and notes while you are at the tote.</p>
          </div>
          {editingItemId ? (
            <button
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold"
              onClick={resetItemForm}
              type="button"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <form className="space-y-3" onSubmit={handleSaveItem}>
          <Field
            label="Item name"
            onChange={(value) => setItemDraft((current) => ({ ...current, name: value }))}
            placeholder="Router bits"
            value={itemDraft.name}
          />
          <NumberField
            label="Quantity"
            onChange={(value) => setItemDraft((current) => ({ ...current, quantity: value }))}
            value={itemDraft.quantity}
          />
          <TextAreaField
            label="Notes"
            onChange={(value) => setItemDraft((current) => ({ ...current, notes: value }))}
            placeholder="1/4 in roundover set, carbide"
            value={itemDraft.notes}
          />
          <button
            className="w-full rounded-2xl bg-[color:var(--highlight)] px-4 py-3 font-semibold text-white"
            type="submit"
          >
            {isSavingItem ? 'Saving item...' : editingItemId ? 'Save item changes' : 'Add item to tote'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl">Inventory</h3>
          <p className="text-sm text-[color:var(--muted)]">{toteItems.length} item(s)</p>
        </div>

        {toteItems.length ? (
          toteItems.map((item) => (
            <article
              className="rounded-[28px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.84)] p-4 shadow-[var(--shadow)] backdrop-blur"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-lg">{item.name}</h4>
                    <span className="rounded-full bg-[color:var(--paper-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Qty {item.quantity}
                    </span>
                  </div>
                  {item.notes ? <p className="mt-2 text-sm text-[color:var(--muted)]">{item.notes}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="rounded-full border border-[color:var(--line)] px-3 py-2 text-sm font-semibold"
                    onClick={() => beginEditItem(item)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-full border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)]"
                    onClick={() => {
                      if (window.confirm(`Delete ${item.name}?`)) {
                        void deleteItem(item.id)
                      }
                    }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyCard
            body="Scan this tote and add the first item while you are standing at the shelf."
            title="No items in this tote yet"
          />
        )}
      </section>
    </div>
  )
}

function SearchPage() {
  const { totes, items } = useStore()
  const [query, setQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const results = items
    .map((item) => ({
      item,
      tote: totes.find((tote) => tote.id === item.toteId),
    }))
    .filter((entry) => entry.tote)
    .filter(({ item, tote }) => {
      const matchesQuery =
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.notes.toLowerCase().includes(query.toLowerCase())

      const matchesLocation =
        !locationFilter.trim() || tote!.location.toLowerCase().includes(locationFilter.toLowerCase())

      return matchesQuery && matchesLocation
    })
    .sort((left, right) => left.item.name.localeCompare(right.item.name))

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <h2 className="text-2xl">Find anything fast</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Search by item name or notes, then narrow by tote location when the shop gets crowded.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Search item" onChange={setQuery} placeholder="router bits" value={query} />
          <Field
            label="Location filter"
            onChange={setLocationFilter}
            placeholder="Garage Rack A"
            value={locationFilter}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl">Results</h3>
          <p className="text-sm text-[color:var(--muted)]">{results.length} match(es)</p>
        </div>

        {results.length ? (
          results.map(({ item, tote }) => (
            <Link
              className="block rounded-[28px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.84)] p-4 shadow-[var(--shadow)] backdrop-blur"
              key={item.id}
              to={`/totes/${tote!.id}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--highlight)]">
                {tote!.location}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-lg">{item.name}</h4>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {tote!.name} | Qty {item.quantity}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--paper-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Open
                </span>
              </div>
            </Link>
          ))
        ) : (
          <EmptyCard
            body="Try a broader item name or clear the location filter to search every tote."
            title="No matching items"
          />
        )}
      </section>
    </div>
  )
}

function ScanPage() {
  const navigate = useNavigate()
  const { totes, storageMode } = useStore()
  const [manualValue, setManualValue] = useState('')
  const [message, setMessage] = useState('Scan a tote QR label to jump straight into inventory.')

  function openScannedValue(rawValue: string) {
    const toteId = extractToteId(rawValue)

    if (!toteId) {
      setMessage('That QR code does not look like a ToteScan label.')
      return
    }

    const tote = totes.find((entry) => entry.id === toteId)

    if (!tote) {
      setMessage(
        storageMode === 'firebase'
          ? 'Label recognized, but the tote does not exist in Firebase yet.'
          : 'Label recognized, but the tote does not exist in this local workspace yet.',
      )
      return
    }

    navigate(`/totes/${tote.id}`)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <h2 className="text-2xl">Scan a label</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Use the rear camera on your phone, or paste a code when testing on desktop.
        </p>
        <div className="mt-4">
          <QrScanner onScan={openScannedValue} />
        </div>
      </section>

      <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.84)] p-5 shadow-[var(--shadow)] backdrop-blur">
        <h3 className="text-lg">Manual code entry</h3>
        <p className="mt-1 text-sm text-[color:var(--muted)]">{message}</p>
        <div className="mt-4 space-y-3">
          <Field
            label="Paste QR value"
            onChange={setManualValue}
            placeholder="https://your-app.example/#/totes/..."
            value={manualValue}
          />
          <button
            className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 font-semibold text-[color:var(--accent-ink)]"
            onClick={() => openScannedValue(manualValue)}
            type="button"
          >
            Open tote
          </button>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-[24px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.72)] p-4 shadow-[var(--shadow)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  )
}

function EmptyCard({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <article className="rounded-[28px] border border-dashed border-[color:var(--line)] bg-[color:rgba(255,255,255,0.6)] p-5 text-center">
      <h3 className="text-lg">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--muted)]">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[color:var(--muted)]">{label}</span>
      <input
        className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--highlight)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[color:var(--muted)]">{label}</span>
      <input
        className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--highlight)]"
        min={1}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[color:var(--muted)]">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--highlight)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function useStore() {
  return useOutletContext<ToteScanStore>()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default App
