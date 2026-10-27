import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { seedCategories, seedItems, seedSettings } from '../data/seed'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = URL && KEY ? createClient(URL, KEY) : null
export const isDemo = !supabase

const BUCKET = 'menu-images'
const LOCAL_KEY = 'lapausa-menu-v1'

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0)

// ---- demo mode: everything lives in this browser's localStorage ------------
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { categories: seedCategories, items: seedItems, settings: seedSettings }
}
function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {
    throw new Error('This device is out of storage space. Try a smaller photo.')
  }
}

const MenuContext = createContext(null)

export function MenuProvider({ children }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)

  const load = useCallback(async () => {
    if (isDemo) {
      setData(readLocal())
      return
    }
    const [c, i, s] = await Promise.all([
      supabase.from('categories').select('*').order('sort'),
      supabase.from('items').select('*').order('sort'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = c.error || i.error || s.error
    if (err) {
      setError(err.message)
      // Fall back to the starter menu so customers never see an empty page.
      setData({ categories: seedCategories, items: seedItems, settings: seedSettings })
      return
    }
    setData({ categories: c.data, items: i.data, settings: s.data || seedSettings })
  }, [])

  useEffect(() => {
    load()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [load])

  // Applies a change locally, then persists it. Returns a promise so the admin
  // UI can show saving / error states.
  const mutate = useCallback(
    async (fn, remote) => {
      const next = fn(data)
      if (isDemo) {
        writeLocal(next)
        setData(next)
        return
      }
      const { error } = await remote()
      if (error) throw new Error(error.message)
      setData(next)
    },
    [data],
  )

  const actions = useMemo(
    () => ({
      saveItem: (item) =>
        mutate(
          (d) => {
            let items = d.items.some((x) => x.id === item.id)
              ? d.items.map((x) => (x.id === item.id ? item : x))
              : [...d.items, item]
            if (item.is_featured) items = items.map((x) => (x.id === item.id ? x : { ...x, is_featured: false }))
            return { ...d, items }
          },
          async () => {
            if (item.is_featured) {
              const r = await supabase.from('items').update({ is_featured: false }).neq('id', item.id).eq('is_featured', true)
              if (r.error) return r
            }
            return supabase.from('items').upsert(item)
          },
        ),
      deleteItem: (id) =>
        mutate(
          (d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }),
          () => supabase.from('items').delete().eq('id', id),
        ),
      // Bulk sort update (used for reordering).
      reorderItems: (list) =>
        mutate(
          (d) => ({ ...d, items: d.items.map((x) => list.find((y) => y.id === x.id) || x) }),
          () => supabase.from('items').upsert(list),
        ),
      saveCategory: (cat) =>
        mutate(
          (d) => ({
            ...d,
            categories: d.categories.some((x) => x.id === cat.id)
              ? d.categories.map((x) => (x.id === cat.id ? cat : x))
              : [...d.categories, cat],
          }),
          () => supabase.from('categories').upsert(cat),
        ),
      reorderCategories: (list) =>
        mutate(
          (d) => ({ ...d, categories: list }),
          () => supabase.from('categories').upsert(list),
        ),
      deleteCategory: (id) => {
        if (data.items.some((x) => x.category_id === id)) {
          return Promise.reject(new Error('Move or delete the items in this category first.'))
        }
        return mutate(
          (d) => ({ ...d, categories: d.categories.filter((x) => x.id !== id) }),
          () => supabase.from('categories').delete().eq('id', id),
        )
      },
      saveSettings: (settings) =>
        mutate(
          (d) => ({ ...d, settings }),
          () => supabase.from('settings').upsert({ ...settings, id: 1 }),
        ),
      // Returns a public URL (Supabase) or a data URL (demo mode).
      uploadImage: async (blob) => {
        if (isDemo) {
          return await new Promise((res) => {
            const r = new FileReader()
            r.onload = () => res(r.result)
            r.readAsDataURL(blob)
          })
        }
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp', upsert: false })
        if (error) throw new Error(error.message)
        return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      },
      resetDemo: () => {
        localStorage.removeItem(LOCAL_KEY)
        setData(readLocal())
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      },
      signOut: () => supabase?.auth.signOut(),
      reload: load,
    }),
    [mutate, data, load],
  )

  const value = useMemo(() => {
    if (!data) return { ready: false, error, session, actions }
    return {
      ready: true,
      error,
      session,
      actions,
      settings: data.settings,
      categories: [...data.categories].sort(bySort),
      items: [...data.items].sort(bySort),
    }
  }, [data, error, session, actions])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export const useMenu = () => useContext(MenuContext)

export const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item'

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
