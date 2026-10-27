import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { letters, viewBox } from '../data/introLetters'

// Opening screen: the cafe name is hand-written in script, letter by letter,
// an orange swash underlines it, then the screen lifts away to the menu.
// Tap anywhere to skip.
export default function Intro({ ready, onReveal, onDone }) {
  const ref = useRef(null)
  const [written, setWritten] = useState(false)
  const leaving = useRef(false)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      const strokes = gsap.utils.toArray('[data-letter]')
      strokes.forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 })
      })
      const swash = ref.current.querySelector('[data-swash]')
      const swashLen = swash.getTotalLength()
      gsap.set(swash, { strokeDasharray: swashLen, strokeDashoffset: swashLen })

      if (reduce) {
        gsap.set(strokes, { strokeDashoffset: 0, fillOpacity: 1 })
        gsap.set(swash, { strokeDashoffset: 0 })
        gsap.set('[data-intro-sub]', { opacity: 1 })
        gsap.delayedCall(0.6, () => setWritten(true))
        return
      }

      const tl = gsap.timeline({ onComplete: () => setWritten(true) })
      strokes.forEach((p, i) => {
        const at = i * 0.13
        tl.to(p, { strokeDashoffset: 0, duration: 0.55, ease: 'power1.inOut' }, at)
        tl.to(p, { fillOpacity: 1, duration: 0.35, ease: 'power1.out' }, at + 0.32)
      })
      tl.to(swash, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.25')
        .to('[data-intro-sub]', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .to({}, { duration: 0.45 })
    }, ref)
    return () => ctx.revert()
  }, [])

  const leave = () => {
    if (leaving.current) return
    leaving.current = true
    onReveal?.()
    gsap
      .timeline({ onComplete: onDone })
      .to(ref.current.querySelector('[data-intro-name]'), { scale: 0.9, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .to(ref.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 0.15)
  }

  useEffect(() => {
    if (written && ready) leave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [written, ready])

  return (
    <div
      ref={ref}
      onClick={() => ready && leave()}
      className="grain fixed inset-0 z-[100] grid place-items-center bg-cream px-6"
      role="presentation"
    >
      <div data-intro-name className="w-full max-w-[460px]">
        <svg viewBox={viewBox} className="w-full overflow-visible" role="img" aria-label="La Pausa Caffè">
          {letters.map((d, i) => (
            <path key={i} data-letter d={d} fill="#2B1A12" stroke="#2B1A12" strokeWidth="1.4" strokeLinejoin="round" />
          ))}
        </svg>
        <svg viewBox="0 0 400 40" className="mx-auto -mt-1 w-[78%] overflow-visible" aria-hidden="true">
          <path
            data-swash
            d="M8 26 C 90 8, 170 34, 250 18 S 360 6, 392 14"
            fill="none"
            stroke="#E8772E"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <p data-intro-sub className="mt-4 translate-y-2 text-center text-[14px] font-extrabold uppercase tracking-[0.4em] text-cocoa opacity-0">
          Menu
        </p>
      </div>
    </div>
  )
}
