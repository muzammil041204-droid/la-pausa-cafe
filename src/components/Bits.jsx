// Small shared pieces used by both the menu and the admin panel.

export function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#2B1A12" />
      <path d="M18 28h24v6a12 12 0 0 1-24 0z" fill="#F6EFE6" />
      <path d="M42 30h3a5 5 0 0 1 0 10h-4" fill="none" stroke="#F6EFE6" strokeWidth="3" />
      <path d="M25 14c-3 4 3 6 0 10M32 12c-3 4 3 6 0 10" fill="none" stroke="#E8772E" strokeWidth="3" strokeLinecap="round" />
      <rect x="16" y="46" width="30" height="3" rx="1.5" fill="#E8772E" />
    </svg>
  )
}

// Indian food-label style veg / non-veg mark.
export function VegMark({ veg, className = '' }) {
  const c = veg ? 'var(--color-veg)' : 'var(--color-nonveg)'
  return (
    <span
      role="img"
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-grid size-4 shrink-0 place-items-center rounded-[3px] border-2 bg-white ${className}`}
      style={{ borderColor: c }}
    >
      {veg ? (
        <span className="size-2 rounded-full" style={{ background: c }} />
      ) : (
        <span className="h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent" style={{ borderBottomColor: c }} />
      )}
    </span>
  )
}

// Shows the food photo, or a friendly plate placeholder when there is none yet.
export function FoodImage({ src, name, className = '', shadow = true }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
        draggable="false"
        className={`select-none object-contain ${shadow ? 'food-shadow' : ''} ${className}`}
      />
    )
  }
  return (
    <div className={`grid place-items-center ${className}`} aria-label={`${name} (photo coming soon)`} role="img">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="60" cy="64" r="48" fill="#FFFDF9" stroke="#2B1A12" strokeOpacity=".12" strokeWidth="2" />
        <circle cx="60" cy="64" r="36" fill="none" stroke="#2B1A12" strokeOpacity=".1" strokeWidth="2" strokeDasharray="4 6" />
        <path d="M50 12c-4 6 4 9 0 15M60 8c-4 6 4 9 0 15M70 12c-4 6 4 9 0 15" fill="none" stroke="#E8772E" strokeWidth="3" strokeLinecap="round" />
        <text x="60" y="76" textAnchor="middle" fontFamily="Yellowtail, cursive" fontSize="34" fill="#6B4A36">
          {(name || '?').trim().charAt(0)}
        </text>
      </svg>
    </div>
  )
}
