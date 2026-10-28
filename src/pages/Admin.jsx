import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isDemo, rupees, slugify, supabase, useMenu } from '../lib/store'
import { compressImage } from '../lib/image'
import { FoodImage, Logo, VegMark } from '../components/Bits'

export default function Admin() {
  const menu = useMenu()
  const [isAdmin, setIsAdmin] = useState(isDemo ? true : null)

  useEffect(() => {
    document.title = 'Menu editor'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  // Make sure the signed-in account is on the admins list.
  useEffect(() => {
    if (isDemo) return
    if (!menu.session) return setIsAdmin(null)
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true))
  }, [menu.session])

  if (!menu.ready) return <Centered>Loading…</Centered>
  if (!isDemo && !menu.session) return <Login />
  if (isAdmin === null) return <Centered>Checking access…</Centered>
  if (!isAdmin)
    return (
      <Centered>
        <p className="text-[17px] font-bold">This account can’t edit the menu.</p>
        <p className="mt-2 text-[15px] text-cocoa">Add its email to the admins table in Supabase.</p>
        <button onClick={menu.actions.signOut} className="mt-6 rounded-full bg-espresso px-6 py-3 font-bold text-cream">
          Sign out
        </button>
      </Centered>
    )
  return <Dashboard />
}

function Centered({ children }) {
  return <div className="grid min-h-dvh place-items-center bg-cream p-6 text-center">{<div>{children}</div>}</div>
}

function Login() {
  const { actions } = useMenu()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await actions.signIn(email.trim(), password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message)
    }
    setBusy(false)
  }
  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-paper p-6 shadow-[0_20px_50px_rgba(43,26,18,0.1)]">
        <Logo className="mx-auto size-14" />
        <h1 className="mt-4 text-center text-[24px] font-black">Menu editor</h1>
        <p className="mt-1 text-center text-[15px] text-cocoa">Sign in to edit the menu</p>
        <Field label="Email">
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        {error && <p className="mt-3 rounded-xl bg-nonveg/10 p-3 text-[14px] font-semibold text-nonveg">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-orange py-3.5 text-[16px] font-extrabold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="mt-4 block text-center text-[14px] font-bold text-cocoa underline">
          Back to menu
        </Link>
      </form>
    </div>
  )
}

const inputCls =
  'mt-1.5 w-full rounded-xl border-2 border-espresso/10 bg-white px-3.5 py-3 text-[16px] font-medium outline-none focus:border-orange'

function Field({ label, hint, children }) {
  return (
    <label className="mt-4 block">
      <span className="text-[14px] font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-cocoa">{hint}</span>}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-veg' : 'bg-espresso/20'}`}
    >
      <span className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  )
}

// ---- toast -------------------------------------------------------------------
function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef()
  const show = (text, bad = false) => {
    clearTimeout(timer.current)
    setToast({ text, bad })
    timer.current = setTimeout(() => setToast(null), bad ? 4500 : 2000)
  }
  const node = toast && (
    <div
      role="status"
      className={`fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-sm rounded-2xl px-4 py-3 text-center text-[15px] font-bold shadow-lg ${
        toast.bad ? 'bg-nonveg text-white' : 'bg-espresso text-cream'
      }`}
    >
      {toast.text}
    </div>
  )
  return [show, node]
}

// ---- dashboard ---------------------------------------------------------------
function Dashboard() {
  const { actions } = useMenu()
  const [tab, setTab] = useState('items')
  const [toast, toastNode] = useToast()

  // Runs a save and reports the result.
  const run = async (fn, okText = 'Saved') => {
    try {
      await fn()
      toast(okText)
      return true
    } catch (e) {
      toast(e.message || 'Something went wrong', true)
      return false
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[560px] bg-cream pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-espresso/10 bg-cream/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Logo className="size-9" />
          <h1 className="text-[18px] font-black">Menu editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="rounded-full bg-paper px-3.5 py-2 text-[14px] font-bold shadow-sm">
            View menu
          </Link>
          {!isDemo && (
            <button onClick={actions.signOut} className="rounded-full px-2 py-2 text-[14px] font-bold text-cocoa">
              Sign out
            </button>
          )}
        </div>
      </header>

      {isDemo && (
        <div className="m-4 rounded-2xl bg-honey/30 p-4 text-[14px] font-semibold leading-relaxed">
          Demo mode: changes are saved only on this device. Connect Supabase so the changes reach every customer.
          <button
            onClick={() => confirm('Reset the menu back to the starter items?') && actions.resetDemo()}
            className="mt-2 block font-extrabold text-nonveg underline"
          >
            Reset demo menu
          </button>
        </div>
      )}

      {tab === 'items' && <ItemsTab run={run} />}
      {tab === 'categories' && <CategoriesTab run={run} />}
      {tab === 'settings' && <SettingsTab run={run} />}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-espresso/10 bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-[560px] grid-cols-3">
          {[
            ['items', 'Items', '🍔'],
            ['categories', 'Categories', '🗂️'],
            ['settings', 'Cafe info', '⚙️'],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 py-3 text-[13px] font-extrabold ${tab === id ? 'text-orange' : 'text-cocoa'}`}
            >
              <span className="text-[20px]" aria-hidden="true">
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>
      {toastNode}
    </div>
  )
}

// ---- items ---------------------------------------------------------------------
function ItemsTab({ run }) {
  const { items, categories, actions } = useMenu()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categories
      .map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id && (!q || i.name.toLowerCase().includes(q))) }))
      .filter((g) => g.items.length || !q)
  }, [items, categories, query])

  const newItem = (category_id) => ({
    id: '',
    category_id: category_id || categories[0]?.id,
    script: '',
    name: '',
    description: '',
    price: '',
    old_price: null,
    is_veg: true,
    image_url: null,
    is_available: true,
    is_hidden: false,
    is_featured: false,
    sort: Math.max(0, ...items.map((i) => i.sort || 0)) + 1,
  })

  const move = (group, index, dir) => {
    const list = [...group.items]
    const j = index + dir
    if (j < 0 || j >= list.length) return
    ;[list[index], list[j]] = [list[j], list[index]]
    const sorts = group.items.map((i) => i.sort).sort((a, b) => a - b)
    run(() => actions.reorderItems(list.map((it, k) => ({ ...it, sort: sorts[k] }))), 'Order saved')
  }

  return (
    <div className="px-4">
      <div className="mt-4 flex gap-2">
        <input
          type="search"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputCls} mt-0 flex-1`}
          aria-label="Search items"
        />
        <button
          onClick={() => setEditing(newItem())}
          disabled={!categories.length}
          className="shrink-0 rounded-xl bg-orange px-4 text-[15px] font-extrabold text-white disabled:opacity-50"
        >
          + Add
        </button>
      </div>
      {!categories.length && <p className="mt-6 text-center text-[15px] text-cocoa">Add a category first.</p>}

      {groups.map((g) => (
        <section key={g.id} className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[19px] font-black">
              {g.name} <span className="text-[14px] font-bold text-cocoa">({g.items.length})</span>
            </h2>
            <button onClick={() => setEditing(newItem(g.id))} className="text-[14px] font-extrabold text-orange">
              + Add here
            </button>
          </div>
          <ul className="grid gap-2">
            {g.items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                run={run}
                onEdit={() => setEditing(item)}
                onUp={i > 0 ? () => move(g, i, -1) : null}
                onDown={i < g.items.length - 1 ? () => move(g, i, 1) : null}
              />
            ))}
          </ul>
        </section>
      ))}

      {editing && <ItemEditor initial={editing} run={run} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ItemRow({ item, run, onEdit, onUp, onDown }) {
  const { actions } = useMenu()
  const [price, setPrice] = useState(String(item.price))
  useEffect(() => setPrice(String(item.price)), [item.price])

  const savePrice = () => {
    const n = Math.round(Number(price))
    if (!price.trim() || Number.isNaN(n) || n < 0) return setPrice(String(item.price))
    if (n !== item.price) run(() => actions.saveItem({ ...item, price: n }), `${item.name}: ${rupees(n)}`)
  }

  return (
    <li className={`flex items-center gap-3 rounded-2xl bg-paper p-2.5 shadow-sm ${item.is_hidden ? 'opacity-55' : ''}`}>
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream p-1">
          <FoodImage src={item.image_url} name={item.name} shadow={false} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[16px] font-extrabold">
            <VegMark veg={item.is_veg} /> <span className="truncate">{item.name}</span>
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-cocoa">
            {item.is_featured && '★ Special · '}
            {item.is_hidden ? 'Hidden' : item.is_available ? 'Available' : 'Sold out'}
            {!item.image_url && ' · No photo'}
          </p>
        </div>
      </button>
      <label className="flex shrink-0 items-center rounded-xl border-2 border-espresso/10 bg-white px-2 focus-within:border-orange">
        <span className="text-[15px] font-bold text-cocoa">₹</span>
        <input
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={savePrice}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Price of ${item.name}`}
          className="w-12 bg-transparent py-2 text-[16px] font-extrabold outline-none"
        />
      </label>
      <div className="flex shrink-0 flex-col">
        <button disabled={!onUp} onClick={onUp} aria-label="Move up" className="px-1.5 text-[15px] disabled:opacity-20">
          ▲
        </button>
        <button disabled={!onDown} onClick={onDown} aria-label="Move down" className="px-1.5 text-[15px] disabled:opacity-20">
          ▼
        </button>
      </div>
    </li>
  )
}

function ItemEditor({ initial, run, onClose }) {
  const { items, categories, actions } = useMenu()
  const isNew = !initial.id
  const [f, setF] = useState({ ...initial, price: String(initial.price ?? ''), old_price: initial.old_price ? String(initial.old_price) : '' })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = prev)
  }, [])

  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const ok = await run(async () => {
      const blob = await compressImage(file)
      const url = await actions.uploadImage(blob)
      setF((p) => ({ ...p, image_url: url }))
    }, 'Photo ready — tap Save')
    if (!ok) fileRef.current?.focus()
    setUploading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    const price = Math.round(Number(f.price))
    const old = f.old_price ? Math.round(Number(f.old_price)) : null
    let id = f.id
    if (isNew) {
      const base = slugify(f.name)
      id = base
      let n = 2
      while (items.some((x) => x.id === id)) id = `${base}-${n++}`
    }
    const item = {
      ...f,
      id,
      name: f.name.trim(),
      script: f.script.trim(),
      description: f.description.trim(),
      price,
      old_price: old && old > price ? old : null,
    }
    setBusy(true)
    const ok = await run(() => actions.saveItem(item), isNew ? 'Item added' : 'Saved')
    setBusy(false)
    if (ok) onClose()
  }

  const remove = async () => {
    if (!confirm(`Delete "${initial.name}" from the menu? This can't be undone.`)) return
    setBusy(true)
    const ok = await run(() => actions.deleteItem(initial.id), 'Item deleted')
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream" role="dialog" aria-modal="true" aria-label={isNew ? 'Add item' : `Edit ${initial.name}`}>
      <form onSubmit={save} className="mx-auto max-w-[560px] px-4 pb-32">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-cream/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
          <button type="button" onClick={onClose} className="rounded-full bg-paper px-4 py-2 text-[15px] font-bold shadow-sm">
            Cancel
          </button>
          <h2 className="text-[17px] font-black">{isNew ? 'New item' : 'Edit item'}</h2>
          <button disabled={busy || uploading} className="rounded-full bg-orange px-5 py-2 text-[15px] font-extrabold text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="mt-2 rounded-3xl bg-paper p-4">
          <div className="mx-auto flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl bg-cream p-3">
            {uploading ? (
              <p className="text-[15px] font-bold text-cocoa">Uploading photo…</p>
            ) : (
              <FoodImage src={f.image_url} name={f.name || 'New item'} className="h-full w-full" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 rounded-full bg-espresso py-3 text-[15px] font-bold text-cream">
              {f.image_url ? 'Change photo' : 'Add photo'}
            </button>
            {f.image_url && (
              <button type="button" onClick={() => set('image_url')(null)} className="rounded-full border-2 border-espresso/15 px-4 text-[15px] font-bold">
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[13px] text-cocoa">Tip: photos with a transparent background (PNG cut-outs) look best.</p>
        </div>

        <div className="mt-4 rounded-3xl bg-paper p-4 pt-1">
          <Field label="Name">
            <input required value={f.name} onChange={(e) => set('name')(e.target.value)} className={inputCls} placeholder="e.g. Chicken Burger" />
          </Field>
          <Field label="Small script word" hint="Shown in handwriting above the name, e.g. Crispy, Grilled, Fresh">
            <input value={f.script} onChange={(e) => set('script')(e.target.value)} className={inputCls} maxLength={24} />
          </Field>
          <Field label="Category">
            <select value={f.category_id} onChange={(e) => set('category_id')(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                required
                inputMode="numeric"
                value={f.price}
                onChange={(e) => set('price')(e.target.value.replace(/[^\d]/g, ''))}
                className={inputCls}
              />
            </Field>
            <Field label="Old price (₹)" hint="Optional — shown crossed out">
              <input inputMode="numeric" value={f.old_price} onChange={(e) => set('old_price')(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={4} value={f.description} onChange={(e) => set('description')(e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
          <div className="mt-4">
            <span className="text-[14px] font-bold">Type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                [true, 'Veg'],
                [false, 'Non-veg'],
              ].map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set('is_veg')(v)}
                  aria-pressed={f.is_veg === v}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-[15px] font-bold ${
                    f.is_veg === v ? 'border-espresso bg-espresso text-cream' : 'border-espresso/10 bg-white'
                  }`}
                >
                  <VegMark veg={v} /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-espresso/10 rounded-3xl bg-paper px-4">
          {[
            ['is_available', 'Available today', 'Turn off to show “Sold out”'],
            ['is_featured', "Today's special", 'Shown big at the top of the menu'],
            ['is_hidden', 'Hide from menu', 'Customers won’t see this item'],
          ].map(([k, label, hint]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-[15px] font-bold">{label}</p>
                <p className="text-[13px] text-cocoa">{hint}</p>
              </div>
              <Toggle checked={!!f[k]} onChange={set(k)} label={label} />
            </div>
          ))}
        </div>

        {!isNew && (
          <button type="button" onClick={remove} disabled={busy} className="mt-6 w-full rounded-full border-2 border-nonveg py-3.5 text-[15px] font-extrabold text-nonveg">
            Delete item
          </button>
        )}
      </form>
    </div>
  )
}

// ---- categories ------------------------------------------------------------------
function CategoriesTab({ run }) {
  const { categories, items, actions } = useMenu()
  const [name, setName] = useState('')

  const add = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    let id = slugify(n)
    let k = 2
    while (categories.some((c) => c.id === id)) id = `${slugify(n)}-${k++}`
    const ok = await run(() => actions.saveCategory({ id, name: n, script: '', sort: Math.max(0, ...categories.map((c) => c.sort || 0)) + 1 }), 'Category added')
    if (ok) setName('')
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= categories.length) return
    const list = [...categories]
    ;[list[i], list[j]] = [list[j], list[i]]
    run(() => actions.reorderCategories(list.map((c, k) => ({ ...c, sort: k + 1 }))), 'Order saved')
  }

  return (
    <div className="px-4">
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className={`${inputCls} mt-0 flex-1`} aria-label="New category name" />
        <button className="shrink-0 rounded-xl bg-orange px-4 text-[15px] font-extrabold text-white">+ Add</button>
      </form>
      <ul className="mt-4 grid gap-3">
        {categories.map((c, i) => (
          <CategoryRow
            key={c.id}
            cat={c}
            count={items.filter((x) => x.category_id === c.id).length}
            run={run}
            onUp={i > 0 ? () => move(i, -1) : null}
            onDown={i < categories.length - 1 ? () => move(i, 1) : null}
          />
        ))}
      </ul>
    </div>
  )
}

function CategoryRow({ cat, count, run, onUp, onDown }) {
  const { actions } = useMenu()
  const [f, setF] = useState(cat)
  useEffect(() => setF(cat), [cat])
  const dirty = f.name !== cat.name || f.script !== cat.script
  return (
    <li className="rounded-2xl bg-paper p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 gap-2">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={`${inputCls} mt-0 font-extrabold`} aria-label="Category name" />
          <input
            value={f.script || ''}
            onChange={(e) => setF({ ...f, script: e.target.value })}
            placeholder="Script word (e.g. Crispy)"
            className={`${inputCls} mt-0`}
            aria-label="Script word"
          />
        </div>
        <div className="flex flex-col">
          <button disabled={!onUp} onClick={onUp} aria-label="Move up" className="px-2 py-1 text-[16px] disabled:opacity-20">
            ▲
          </button>
          <button disabled={!onDown} onClick={onDown} aria-label="Move down" className="px-2 py-1 text-[16px] disabled:opacity-20">
            ▼
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-cocoa">{count} items</span>
        <div className="flex gap-2">
          <button
            onClick={() => confirm(`Delete category "${cat.name}"?`) && run(() => actions.deleteCategory(cat.id), 'Category deleted')}
            className="rounded-full px-3 py-2 text-[14px] font-bold text-nonveg"
          >
            Delete
          </button>
          <button
            disabled={!dirty || !f.name.trim()}
            onClick={() => run(() => actions.saveCategory({ ...f, name: f.name.trim(), script: (f.script || '').trim() }))}
            className="rounded-full bg-espresso px-4 py-2 text-[14px] font-bold text-cream disabled:opacity-30"
          >
            Save
          </button>
        </div>
      </div>
    </li>
  )
}

// ---- settings ----------------------------------------------------------------------
function SettingsTab({ run }) {
  const { settings, actions } = useMenu()
  const [f, setF] = useState(settings)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    await run(() => actions.saveSettings(f))
    setBusy(false)
  }
  const fields = [
    ['cafe_name', 'Cafe name'],
    ['tagline', 'Tagline'],
    ['offer_text', 'Offer banner', 'Scrolling strip under the special. Leave empty to hide.'],
    ['note_text', 'Footer note', 'e.g. bulk orders, parties'],
    ['phone', 'Phone number'],
    ['instagram', 'Instagram', '@handle or full link'],
    ['address', 'Address'],
    ['maps_url', 'Google Maps link'],
  ]
  return (
    <form onSubmit={save} className="mx-4 mt-4 rounded-3xl bg-paper p-4 pt-1">
      {fields.map(([k, label, hint]) => (
        <Field key={k} label={label} hint={hint}>
          {k === 'note_text' ? (
            <textarea rows={3} value={f[k] || ''} onChange={set(k)} className={`${inputCls} resize-none`} />
          ) : (
            <input value={f[k] || ''} onChange={set(k)} className={inputCls} />
          )}
        </Field>
      ))}
      <button disabled={busy} className="mt-6 w-full rounded-full bg-orange py-3.5 text-[16px] font-extrabold text-white disabled:opacity-60">
        {busy ? 'Saving…' : 'Save cafe info'}
      </button>
    </form>
  )
}
