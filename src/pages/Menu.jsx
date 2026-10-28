import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { rupees, useMenu } from '../lib/store'
import { FoodImage, Logo, VegMark } from '../components/Bits'
import Intro from '../components/Intro'

gsap.registerPlugin(ScrollTrigger)

const CARD_COLORS = ['bg-latte', 'bg-honey', 'bg-matcha', 'bg-blush']

export default function Menu() {
  const menu = useMenu()
  const lenisRef = useRef(null)
  const rootRef = useRef(null)
  const [openItem, setOpenItem] = useState(null)
  // 'playing' → name being written, 'revealing' → intro lifting away, 'done'
  const [intro, setIntro] = useState('playing')

  // Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // No scrolling while the intro is on screen.
  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (intro === 'playing') lenis.stop()
    else lenis.start()
  }, [intro])

  useEffect(() => {
    if (menu.settings?.cafe_name) document.title = `${menu.settings.cafe_name} — Menu`
  }, [menu.settings?.cafe_name])

  const sections = useMemo(() => {
    if (!menu.ready) return []
    const visible = menu.items.filter((i) => !i.is_hidden)
    return menu.categories
      .map((c) => ({ ...c, items: visible.filter((i) => i.category_id === c.id) }))
      .filter((c) => c.items.length)
  }, [menu])

  const featured = useMemo(() => {
    if (!menu.ready) return null
    const visible = menu.items.filter((i) => !i.is_hidden)
    return visible.find((i) => i.is_featured) || visible.find((i) => i.image_url) || visible[0] || null
  }, [menu])

  // Section reveal animations.
  useLayoutEffect(() => {
    if (!menu.ready) return
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('[data-reveal-row]').forEach((row) => {
          gsap.from(row.querySelectorAll('[data-card]'), {
            y: 60,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          })
          gsap.from(row.querySelectorAll('[data-card-img]'), {
            rotate: -25,
            scale: 0.6,
            duration: 1,
            ease: 'back.out(1.6)',
            stagger: 0.08,
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          })
        })
        gsap.utils.toArray('[data-reveal-head]').forEach((el) => {
          gsap.from(el.children, {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })
      })
    }, rootRef)
    ScrollTrigger.refresh()
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [menu.ready, sections.length])

  const scrollTo = (target) => {
    const el = typeof target === 'string' ? document.getElementById(target) : target
    if (!el) return
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -76, duration: 1.1 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  const introNode = intro !== 'done' && (
    <Intro ready={menu.ready} onReveal={() => setIntro('revealing')} onDone={() => setIntro('done')} />
  )

  if (!menu.ready)
    return (
      <>
        <Splash />
        {introNode}
      </>
    )

  const s = menu.settings

  return (
    <>
    {introNode}
    <div ref={rootRef} className="mx-auto min-h-dvh max-w-[520px] overflow-x-clip bg-paper shadow-[0_0_60px_rgba(43,26,18,0.08)]">
      <header className="grain flex items-center justify-between bg-cream px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center gap-2.5">
          <Logo className="size-11" />
          <div className="leading-tight">
            <p className="text-[17px] font-extrabold tracking-tight">{s.cafe_name}</p>
            <p className="text-[13px] font-medium text-cocoa">{s.tagline}</p>
          </div>
        </div>
        <span className="rounded-full border-2 border-veg px-2.5 py-1 text-[12px] font-extrabold tracking-wider text-veg">
          HALAL
        </span>
      </header>

      {featured && <Hero item={featured} play={intro !== 'playing'} onDetails={() => setOpenItem(featured)} onMenu={() => scrollTo('menu-start')} />}

      {s.offer_text && <Marquee text={s.offer_text} />}

      <div id="menu-start" />
      <CategoryNav sections={sections} onPick={scrollTo} />

      <main className="pb-10">
        {sections.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} data-section={c.id} className="pt-8">
            <div data-reveal-head className="px-5">
              <p className="font-script text-[26px] leading-none text-orange">{c.script}</p>
              <h2 className="text-[30px] font-black leading-tight tracking-tight">{c.name}</h2>
            </div>
            <div
              data-reveal-row
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pt-24 pb-6"
            >
              {c.items.map((item, i) => (
                <Card key={item.id} item={item} color={CARD_COLORS[i % CARD_COLORS.length]} onOpen={() => setOpenItem(item)} />
              ))}
              <div className="w-1 shrink-0" aria-hidden="true" />
            </div>
          </section>
        ))}
      </main>

      <Footer settings={s} />

      {openItem && <ItemSheet item={openItem} lenis={lenisRef.current} onClose={() => setOpenItem(null)} />}
    </div>
    </>
  )
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-cream">
      <Logo className="size-16 animate-pulse" />
    </div>
  )
}

function SplitWords({ text, className = '' }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-1 align-bottom">
          <span data-word className="inline-block">
            {w}
            {' '}
          </span>
        </span>
      ))}
    </span>
  )
}

function Hero({ item, play, onDetails, onMenu }) {
  const ref = useRef(null)
  const len = item.name.length
  const titleSize = len > 16 ? 'text-[34px]' : len > 10 ? 'text-[40px]' : 'text-[48px]'

  useLayoutEffect(() => {
    if (!play) return
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.25 })
        tl.from('[data-hero-img]', { x: -120, rotate: -35, opacity: 0, duration: 1.2 })
          .from('[data-hero-script]', { y: 20, opacity: 0, duration: 0.6 }, 0.3)
          .from('[data-word]', { yPercent: 110, duration: 0.8, stagger: 0.08 }, 0.35)
          .from('[data-hero-badge]', { scale: 0, rotate: -90, duration: 0.8, ease: 'back.out(2)' }, 0.6)
          .from('[data-hero-fade]', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.7)
        gsap.to('[data-hero-float]', { y: -10, rotate: 3, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.to('[data-hero-badge-spin]', { rotate: 360, duration: 18, ease: 'none', repeat: -1 })
        gsap.to('[data-hero-parallax]', {
          yPercent: 18,
          rotate: 12,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      })
    }, ref)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [item.id, play])

  return (
    <section ref={ref} className="grain relative bg-cream pb-16" aria-label="Today's special">
      <div className="relative grid grid-cols-[1.05fr_1fr] items-center gap-1 pt-6">
        <div data-hero-parallax className="-ml-6 aspect-square">
          <div data-hero-img className="h-full w-full">
            <div data-hero-float className="h-full w-full">
              <FoodImage src={item.image_url} name={item.name} className="h-full w-full" />
            </div>
          </div>
        </div>
        <div className="relative pr-4">
          <p data-hero-script className="font-script text-[30px] leading-none text-cocoa">
            {item.script || "Today's special"}
          </p>
          <h1 className={`${titleSize} font-black leading-[0.95] tracking-tight break-words`}>
            <SplitWords text={item.name} />
          </h1>
        </div>
        <PriceBadge
          data-hero-badge
          price={item.price}
          old={item.old_price}
          className="absolute -top-1 right-4 size-[86px] text-[22px]"
          label
        />
      </div>

      <div className="px-4">
        <div data-hero-fade className="mt-3 rounded-2xl bg-paper p-4 shadow-[0_10px_30px_rgba(43,26,18,0.08)]">
          <div className="mb-1.5 flex items-center gap-2">
            <VegMark veg={item.is_veg} />
            <p className="text-[13px] font-extrabold uppercase tracking-wider text-orange">Today's special</p>
          </div>
          <p className="text-[15px] leading-relaxed text-espresso/85">{item.description}</p>
        </div>
        <div data-hero-fade className="mt-4 flex gap-3">
          <button
            onClick={onMenu}
            className="flex-1 rounded-full bg-orange px-5 py-3.5 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(232,119,46,0.35)] active:scale-[0.97]"
          >
            See full menu
          </button>
          <button
            onClick={onDetails}
            className="flex-1 rounded-full border-2 border-espresso/80 px-5 py-3 text-[15px] font-extrabold active:scale-[0.97]"
          >
            Details
          </button>
        </div>
      </div>

      <svg className="absolute inset-x-0 -bottom-px h-12 w-full" viewBox="0 0 400 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30 C 60 0, 120 48, 200 24 S 330 0, 400 26 L400 48 L0 48 Z" fill="#FFFDF9" />
      </svg>
    </section>
  )
}

function PriceBadge({ price, old, className = '', label = false, ...rest }) {
  return (
    <div {...rest} className={`grid place-items-center rounded-full ${label ? 'bg-honey' : 'bg-paper'} shadow-[0_8px_20px_rgba(43,26,18,0.18)] ${className}`}>
      {label && (
        <svg data-hero-badge-spin className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#2B1A12" strokeOpacity=".25" strokeDasharray="2 5" strokeWidth="2" />
        </svg>
      )}
      <div className="relative text-center leading-none">
        {label && <p className="mb-0.5 text-[11px] font-extrabold uppercase tracking-widest">Price</p>}
        <p className="font-black tracking-tight">{rupees(price)}</p>
        {old ? <p className="mt-0.5 text-[12px] font-semibold text-espresso/60 line-through">{rupees(old)}</p> : null}
      </div>
    </div>
  )
}

function Marquee({ text }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to('[data-track]', { xPercent: -50, duration: 16, ease: 'none', repeat: -1 })
      })
    }, ref)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [text])
  const chunk = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center gap-4 pr-4">
      <span>{text}</span>
      <span className="text-honey">✦</span>
    </span>
  ))
  return (
    <div ref={ref} className="overflow-hidden bg-espresso py-3 text-[15px] font-extrabold uppercase tracking-wide text-cream" role="note" aria-label={text}>
      <div data-track className="flex w-max" aria-hidden="true">
        {chunk}
        {chunk}
      </div>
    </div>
  )
}

function CategoryNav({ sections, onPick }) {
  const [active, setActive] = useState(sections[0]?.id)
  const barRef = useRef(null)

  useLayoutEffect(() => {
    const triggers = sections.map((c) =>
      ScrollTrigger.create({
        trigger: `#cat-${c.id}`,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => self.isActive && setActive(c.id),
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [sections])

  // Keep the active chip in view.
  useEffect(() => {
    const bar = barRef.current
    const chip = bar?.querySelector(`[data-chip="${active}"]`)
    if (!chip) return
    bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  return (
    <nav className="sticky top-0 z-30 border-b border-espresso/10 bg-paper/90 backdrop-blur-md" aria-label="Menu categories">
      <div ref={barRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {sections.map((c) => (
          <button
            key={c.id}
            data-chip={c.id}
            onClick={() => onPick(`cat-${c.id}`)}
            aria-current={active === c.id ? 'true' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-bold transition-colors duration-300 ${
              active === c.id ? 'bg-espresso text-cream' : 'bg-cream text-espresso'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </nav>
  )
}

function Card({ item, color, onOpen }) {
  const soldOut = !item.is_available
  return (
    <article data-card className="relative w-[66vw] max-w-[272px] shrink-0 snap-start">
      <button
        onClick={onOpen}
        className={`relative block w-full rounded-[28px] ${color} px-4 pt-20 pb-4 text-left active:scale-[0.98] transition-transform`}
        aria-label={`${item.name}, ${rupees(item.price)}${soldOut ? ', sold out' : ''}`}
      >
        <div data-card-img className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[82%] -translate-x-1/2">
          <FoodImage src={item.image_url} name={item.name} className={`h-full w-full ${soldOut ? 'grayscale opacity-70' : ''}`} />
        </div>
        <PriceBadge price={item.price} old={item.old_price} className="absolute top-4 -right-1 size-[64px] text-[17px]" />

        <div className="mt-1 flex items-center gap-2">
          <VegMark veg={item.is_veg} />
          {item.script && <p className="truncate font-script text-[22px] leading-none text-cocoa">{item.script}</p>}
        </div>
        <h3 className="mt-1 text-[22px] font-black leading-[1.05] tracking-tight">{item.name}</h3>
        <p className="line-clamp-3 mt-2 min-h-[63px] text-[14px] leading-[1.5] text-espresso/80">{item.description}</p>
        <div className="mt-3 flex items-center justify-between">
          {soldOut ? (
            <span className="rounded-full bg-espresso px-3 py-1.5 text-[13px] font-extrabold uppercase text-cream">Sold out</span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-paper px-4 py-2 text-[13px] font-extrabold uppercase tracking-wide shadow-sm">View</span>
        </div>
      </button>
    </article>
  )
}

function ItemSheet({ item, lenis, onClose }) {
  const ref = useRef(null)
  const closing = useRef(false)

  const close = () => {
    if (closing.current) return
    closing.current = true
    gsap.to('[data-sheet]', { yPercent: 100, duration: 0.35, ease: 'power3.in' })
    gsap.to('[data-backdrop]', { opacity: 0, duration: 0.35, onComplete: onClose })
  }

  useLayoutEffect(() => {
    lenis?.stop()
    const ctx = gsap.context(() => {
      gsap.from('[data-backdrop]', { opacity: 0, duration: 0.3 })
      gsap.from('[data-sheet]', { yPercent: 100, duration: 0.55, ease: 'power4.out' })
      gsap.from('[data-sheet-img]', { scale: 0.5, rotate: -30, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', delay: 0.1 })
    }, ref)
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      ctx.revert()
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swipe down to close.
  const startY = useRef(null)
  const onTouchStart = (e) => (startY.current = e.touches[0].clientY)
  const onTouchEnd = (e) => {
    if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 80) close()
    startY.current = null
  }

  return (
    <div ref={ref} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={item.name}>
      <div data-backdrop className="absolute inset-0 bg-espresso/55 backdrop-blur-[2px]" onClick={close} />
      <div
        data-sheet
        data-lenis-prevent
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[90dvh] max-w-[520px] overflow-y-auto rounded-t-[32px] bg-paper px-5 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-paper pt-3 pb-2">
          <span className="h-1.5 w-12 rounded-full bg-espresso/20" />
        </div>
        <button
          onClick={close}
          className="absolute top-4 right-4 z-20 grid size-10 place-items-center rounded-full bg-cream text-[22px] font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="grain -mx-5 mt-1 grid place-items-center bg-cream py-6">
          <div data-sheet-img className="h-56 w-[78%]">
            <FoodImage src={item.image_url} name={item.name} className={`h-full w-full ${item.is_available ? '' : 'grayscale'}`} />
          </div>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            {item.script && <p className="font-script text-[28px] leading-none text-orange">{item.script}</p>}
            <h2 className="text-[32px] font-black leading-[1.02] tracking-tight">{item.name}</h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[28px] font-black">{rupees(item.price)}</p>
            {item.old_price ? <p className="text-[15px] font-semibold text-espresso/55 line-through">{rupees(item.old_price)}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-[13px] font-bold">
            <VegMark veg={item.is_veg} /> {item.is_veg ? 'Veg' : 'Non-veg'}
          </span>
          {!item.is_available && (
            <span className="rounded-full bg-espresso px-3 py-1.5 text-[13px] font-bold text-cream">Sold out today</span>
          )}
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-espresso/85">{item.description}</p>
        <p className="mt-5 rounded-2xl bg-cream p-4 text-[14px] font-semibold text-cocoa">
          Ready to order? Just tell our staff at the counter.
        </p>
      </div>
    </div>
  )
}

function Footer({ settings: s }) {
  const ig = s.instagram?.trim()
  const igUrl = ig ? (ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`) : null
  return (
    <footer className="relative bg-espresso px-5 pt-14 pb-[max(32px,env(safe-area-inset-bottom))] text-cream">
      <svg className="absolute inset-x-0 -top-px h-10 w-full" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 L400 0 L400 14 C 320 40, 250 0, 180 20 S 60 36, 0 12 Z" fill="#FFFDF9" />
      </svg>
      <div className="flex items-center gap-3">
        <Logo className="size-12" />
        <div>
          <p className="text-[20px] font-black">{s.cafe_name}</p>
          <p className="font-script text-[22px] leading-none text-honey">{s.tagline}</p>
        </div>
      </div>
      {s.note_text && <p className="mt-5 text-[15px] font-semibold leading-relaxed text-cream/85">{s.note_text}</p>}
      <div className="mt-6 grid gap-2.5">
        {s.address && (
          <a href={s.maps_url || undefined} target="_blank" rel="noreferrer" className="rounded-2xl bg-cream/10 px-4 py-3.5 text-[15px] font-bold">
            📍 {s.address}
          </a>
        )}
        {s.phone && (
          <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="rounded-2xl bg-cream/10 px-4 py-3.5 text-[15px] font-bold">
            📞 {s.phone}
          </a>
        )}
        {igUrl && (
          <a href={igUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-cream/10 px-4 py-3.5 text-[15px] font-bold">
            📷 {ig.startsWith('http') ? 'Instagram' : `@${ig.replace(/^@/, '')}`}
          </a>
        )}
      </div>
      <p className="mt-8 text-center text-[13px] font-semibold text-cream/50">100% Halal · Prices in ₹</p>
      <p className="mt-4 border-t border-cream/10 pt-4 text-center text-[13px] font-semibold text-cream/60">
        © {new Date().getFullYear()} {s.cafe_name}. All rights reserved ·{' '}
        <a
          href="https://isoform.in"
          target="_blank"
          rel="noopener"
          className="font-extrabold tracking-[0.18em] text-honey underline-offset-4 hover:underline"
        >
          ISOFORM
        </a>
      </p>
    </footer>
  )
}
