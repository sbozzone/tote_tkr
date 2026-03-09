import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Totes' },
  { to: '/search', label: 'Search' },
  { to: '/scan', label: 'Scan' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="app-shell-nav screen-only sticky bottom-0 z-20 border-t border-[color:var(--line)] bg-[color:rgba(248,242,234,0.92)] px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

          return (
            <Link
              className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                active
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[0_10px_20px_rgba(40,77,65,0.2)]'
                  : 'bg-white text-[color:var(--muted)]'
              }`}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
