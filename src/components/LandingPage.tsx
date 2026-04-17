import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import logoProfPol from '../assets/logo prof_pol.png'
import ellipseDecor from '../assets/landing/Ellipse 10.png'
import rectangleDecor from '../assets/landing/Rectangle 13.png'
import {
  ellipse60,
  ellipse70,
  ellipse90,
  image30,
  image40,
  image41,
  image42,
  image43,
  image50,
  image60,
  image100,
  image110,
  image120,
  image130,
  image140,
  image150,
} from '../assets/landing/media'
import { ImageSlider } from './ImageSlider'

const DESIGN_W = 1920

/** Куда слать заявки: на Beget в `public_html/api/lead.php` → путь `/api/lead.php`; с localhost — полный URL в `.env` */
const LEAD_ENDPOINT =
  (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined)?.trim() || '/api/lead.php'

async function postLeadToServer(payload: { name: string; phone: string; message: string }) {
  const res = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  let data: { ok?: boolean; error?: string } = {}
  try {
    data = (await res.json()) as { ok?: boolean; error?: string }
  } catch {
    // не JSON
  }
  if (!res.ok || !data.ok) {
    const msg = data.error ?? `Ошибка ${res.status}`
    throw new Error(msg)
  }
}

function syncLandingScale() {
  const w = window.visualViewport?.width ?? window.innerWidth
  // На части масштабов 1920×scale чуть уже вьюпорта — просвечивает белый фон (полоска у края, заметна на жёлтом).
  const scale = (w + 1) / DESIGN_W
  document.documentElement.style.setProperty('--landing-scale', String(scale))
}

function scrollToSection(id: string) {
  const element = document.getElementById(id)
  if (!element) return

  const top = Math.max(window.scrollY + element.getBoundingClientRect().top - 24, 0)
  window.scrollTo({
    top,
    left: 0,
    behavior: 'smooth',
  })
}

function scrollToContactForm() {
  scrollToSection('contact-form')
}

function formatNameValue(value: string) {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/(^|[\s-])([a-zа-яё])/giu, (_, separator: string, letter: string) => {
      return `${separator}${letter.toLocaleUpperCase('ru-RU')}`
    })
}

function wrapReviewText(text: string, maxLineLen = 54) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return ['']

  const paragraphs = normalized
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)

  const out: string[] = []
  for (const p of paragraphs) {
    let line = ''
    const pushLine = () => {
      const v = line.trim()
      if (v) out.push(v)
      line = ''
    }

    const words = p.split(/\s+/g).filter(Boolean)
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (next.length > maxLineLen && line) {
        pushLine()
        line = w
      } else {
        line = next
      }
    }
    pushLine()
    out.push('')
  }
  if (out.length && out[out.length - 1] === '') out.pop()
  return out
}

function getInitials(name: string) {
  const cleaned = String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
  if (!cleaned) return '?'

  const parts = cleaned.split(/[\s-]+/g).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length >= 2 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toLocaleUpperCase('ru-RU')
}

function formatPhoneValue(value: string) {
  let digits = value.replace(/\D/g, '')

  if (digits === '7' || digits === '8') return '+7'

  if (digits.startsWith('8')) {
    digits = digits.slice(1)
  } else if (digits.startsWith('7')) {
    digits = digits.slice(1)
  }

  digits = digits.slice(0, 10)

  if (!digits) return ''

  const part1 = digits.slice(0, 3)
  const part2 = digits.slice(3, 6)
  const part3 = digits.slice(6, 8)
  const part4 = digits.slice(8, 10)

  let formatted = '+7'
  if (part1) formatted += ` (${part1}`
  if (part1.length === 3) formatted += ')'
  if (part2) formatted += ` ${part2}`
  if (part3) formatted += `-${part3}`
  if (part4) formatted += `-${part4}`

  return formatted
}

function removePhoneDigitBeforeCaret(value: string, caret: number) {
  for (let i = caret - 1; i >= 0; i -= 1) {
    if (!/\d/.test(value[i])) continue
    if (i === 1 && value.startsWith('+7')) continue
    return formatPhoneValue(value.slice(0, i) + value.slice(i + 1))
  }

  return ''
}

export function LandingPage() {
  const [nameValue, setNameValue] = useState('')
  const [phoneValue, setPhoneValue] = useState('')
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [isHeaderScrolling, setIsHeaderScrolling] = useState(false)
  const [isContactConsentChecked, setIsContactConsentChecked] = useState(false)
  const [isLeadConsentChecked, setIsLeadConsentChecked] = useState(false)
  const [contactEmailValue, setContactEmailValue] = useState('')
  const [contactMessageValue, setContactMessageValue] = useState('')
  const [leadNameValue, setLeadNameValue] = useState('')
  const [leadPhoneValue, setLeadPhoneValue] = useState('')
  const [leadMessageValue, setLeadMessageValue] = useState('')
  const [isLeadSending, setIsLeadSending] = useState(false)
  const [leadToast, setLeadToast] = useState<{ open: boolean; tone: 'success' | 'error'; text: string }>({
    open: false,
    tone: 'success',
    text: '',
  })
  const leadToastTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const showLeadToast = useCallback((tone: 'success' | 'error', text: string) => {
    if (leadToastTimeoutRef.current) window.clearTimeout(leadToastTimeoutRef.current)
    setLeadToast({ open: true, tone, text })
    leadToastTimeoutRef.current = window.setTimeout(() => {
      setLeadToast((prev) => (prev.open ? { ...prev, open: false } : prev))
    }, 3200)
  }, [])

  useEffect(() => {
    return () => {
      if (leadToastTimeoutRef.current) window.clearTimeout(leadToastTimeoutRef.current)
    }
  }, [])
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const workTypesSectionRef = useRef<HTMLDivElement | null>(null)
  const [isWorkTypesVisible, setIsWorkTypesVisible] = useState(false)
  const advantagesSectionRef = useRef<HTMLDivElement | null>(null)
  const [isAdvantagesVisible, setIsAdvantagesVisible] = useState(false)

  const howWeWorkHeadingRef = useRef<HTMLDivElement | null>(null)
  /** Документная Y верхней границы заголовка «Как мы работаем» — кэш для стабильного параллакса при скролле туда‑сюда */
  const howWeWorkParallaxAnchorYRef = useRef<number | null>(null)
  const portfolioHeadingRef = useRef<HTMLDivElement | null>(null)
  const reviewsHeadingRef = useRef<HTMLDivElement | null>(null)
  const contactsHeadingRef = useRef<HTMLDivElement | null>(null)

  const reviews = [
    {
      name: 'Алексей Поляков',
      source: 'ЖК «Символ»',
      avatar: ellipse90,
      text:
        'Сделали стяжку быстро и аккуратно. Приехали вовремя, всё по договору.После работ чисто, поверхность ровная — под ламинат легло идеально, даже не пришлось ровнять наливным полом.'
    },
    {
      name: 'Мария Воронцова',
      source: 'КП «Миллениум Парк»',
      avatar: ellipse60,
      text:
        'Очень понравился подход: сразу посчитали смету и цена в процессе не изменилась. Работу на 120 квадратах сделали за день, на следующий день уже продолжили ремонт. Стяжка на теплый пол легла идеально'
    },
    {
      name: 'Виктор Назаров',
      source: 'Истра, д. Аносино',
      avatar: ellipse70,
      text:
        'Ровно, без трещин, выдержали сроки. Бригада опытная — это видно по деталям и тому, как работают с лазерным уровнем. Рекомендую, если нужен технически грамотный результат без сюрпризов'
    },
    {
      name: 'Елена Соколова',
      source: 'ЖК «Сердце Столицы»',
      avatar: ellipse90,
      text:
        'Порадовало, что всё объяснили и показали по уровню. Углы и стыки аккуратные, дверные проемы вывели четко. Команда вежливая, после себя не оставили мусора и не запачкали стены',
    },
    {
      name: 'Игорь Данилов',
      source: 'дер. Жуковка',
      avatar: ellipse60,
      text:
        'Делали стяжку в доме на большой площади — справились без проблем за одну смену. Техника своя, мощная, работа организована профессионально. Качество поверхности отличное',
    },
  ] as const

  /** Совпадает с .review-card width + gap в landing.css */
  const REVIEW_CARD_W = 520
  const REVIEW_GAP = 70
  const REVIEW_SCROLL_STEP = REVIEW_CARD_W + REVIEW_GAP

  const reviewsViewportRef = useRef<HTMLDivElement | null>(null)
  const isSyncingReviewsScrollRef = useRef(false)
  const reviewsProgrammaticScrollRef = useRef(false)
  const activeReviewIndexRef = useRef(0)
  const [activeReviewIndex, setActiveReviewIndex] = useState(0)
  /** Пока тянем ползунок — непрерывное значение 0..1; иначе null → берём индекс */
  const [reviewsRangeOverride, setReviewsRangeOverride] = useState<number | null>(null)

  const [isReviewsDragging, setIsReviewsDragging] = useState(false)
  const [reviewsThumbStretch, setReviewsThumbStretch] = useState(0) // 0..0.1
  const reviewsDragRef = useRef<{ x: number; t: number } | null>(null)
  const reviewsIsPointerDownRef = useRef(false)
  const reviewsViewportPointerDownRef = useRef(false)
  const reviewsWheelSnapTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const reviewCount = reviews.length
  const reviewsMaxIndex = Math.max(0, reviewCount - 1)
  const hasReviewsLoop = reviewCount >= 2
  /** Первый реальный отзыв по центру вьюпорта: смещение на один шаг после клона последнего */
  const REVIEWS_FIRST_OFFSET = REVIEW_SCROLL_STEP
  /** Период сдвига: N реальных (вторая копия нужна, чтобы не было пустоты при подходе к концу) */
  const REVIEWS_CYCLE_WIDTH = reviewCount * REVIEW_SCROLL_STEP
  const reviewsThumbRangeScroll = reviewsMaxIndex * REVIEW_SCROLL_STEP

  const [reviewsScrollOffset, setReviewsScrollOffset] = useState(() =>
    reviewCount >= 2 ? REVIEW_SCROLL_STEP : 0,
  )
  const reviewsScrollOffsetRef = useRef(reviewCount >= 2 ? REVIEW_SCROLL_STEP : 0)
  useEffect(() => {
    reviewsScrollOffsetRef.current = reviewsScrollOffset
  }, [reviewsScrollOffset])

  const [reviewsThumbProgress, setReviewsThumbProgress] = useState(0)
  const reviewsThumbAnimatingRef = useRef(false)
  const reviewsSkipSnapUntilRef = useRef(0)
  const reviewsSmoothScrollRafRef = useRef<number | null>(null)
  const reviewsDragStartXRef = useRef(0)
  const reviewsDragStartOffsetRef = useRef(0)

  const reviewsSliderProgress = reviewsRangeOverride ?? reviewsThumbProgress

  const REVIEWS_AUTO_MS = 10_000
  const [reviewsAutoProgress, setReviewsAutoProgress] = useState(0)
  const reviewsAutoStartRef = useRef<number>(performance.now())
  const reviewsAutoPausedRef = useRef(false)
  const reviewsAutoElapsedBeforePauseRef = useRef(0)
  const reviewsIsHoveringRef = useRef(false)
  const resetReviewsAutoTimer = useCallback(() => {
    reviewsAutoStartRef.current = performance.now()
    reviewsAutoPausedRef.current = false
    reviewsAutoElapsedBeforePauseRef.current = 0
    setReviewsAutoProgress(0)
  }, [])

  useEffect(() => {
    activeReviewIndexRef.current = activeReviewIndex
  }, [activeReviewIndex])

  const REVIEWS_SCROLL_SMOOTH_MS = 780

  const normalizeReviewsOffset = (x: number) => {
    if (reviewCount < 2) return 0
    // Держим offset в диапазоне [FIRST_OFFSET .. FIRST_OFFSET + CYCLE_WIDTH)
    // чтобы "последний" (FIRST_OFFSET + (N-1)*STEP) не оборачивался в 0 и не давал видимый скачок.
    const lo = REVIEWS_FIRST_OFFSET
    const hi = lo + REVIEWS_CYCLE_WIDTH
    let v = x
    while (v >= hi) v -= REVIEWS_CYCLE_WIDTH
    while (v < lo) v += REVIEWS_CYCLE_WIDTH
    return v
  }

  const indexFromOffset = (offsetPx: number) => {
    if (reviewsMaxIndex <= 0) return 0
    if (reviewCount < 2) return 0
    const phase = offsetPx - REVIEWS_FIRST_OFFSET
    const raw = Math.round(phase / REVIEW_SCROLL_STEP)
    const mod = ((raw % reviewCount) + reviewCount) % reviewCount
    return Math.max(0, Math.min(reviewsMaxIndex, mod))
  }

  const cancelReviewsSmoothScroll = () => {
    if (reviewsSmoothScrollRafRef.current != null) {
      cancelAnimationFrame(reviewsSmoothScrollRafRef.current)
      reviewsSmoothScrollRafRef.current = null
    }
  }

  const prefersReducedMotionReviews = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const applyReviewsThumbFromOffset = (offsetPx: number) => {
    if (reviewCount <= 1 || reviewsThumbRangeScroll <= 0) {
      setReviewsThumbProgress(0)
      return
    }
    const base = reviewCount >= 2 ? REVIEWS_FIRST_OFFSET : 0
    const clamped = Math.min(Math.max(offsetPx - base, 0), reviewsThumbRangeScroll)
    setReviewsThumbProgress(clamped / reviewsThumbRangeScroll)
  }

  const smoothReviewsOffsetTo = (targetOffset: number, durationMs: number, onDone?: () => void) => {
    cancelReviewsSmoothScroll()
    const start = reviewsScrollOffsetRef.current
    const delta = targetOffset - start
    if (prefersReducedMotionReviews() || Math.abs(delta) < 0.5) {
      const next = normalizeReviewsOffset(targetOffset)
      setReviewsScrollOffset(next)
      applyReviewsThumbFromOffset(next)
      reviewsProgrammaticScrollRef.current = false
      const idx = indexFromOffset(next)
      setActiveReviewIndex(idx)
      activeReviewIndexRef.current = idx
      onDone?.()
      return
    }
    reviewsProgrammaticScrollRef.current = true
    reviewsSkipSnapUntilRef.current = Math.max(
      reviewsSkipSnapUntilRef.current,
      performance.now() + durationMs + 280,
    )
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      const next = start + delta * t
      setReviewsScrollOffset(next)
      applyReviewsThumbFromOffset(next)
      const idx = indexFromOffset(next)
      setActiveReviewIndex(idx)
      activeReviewIndexRef.current = idx
      if (t < 1) {
        reviewsSmoothScrollRafRef.current = requestAnimationFrame(step)
      } else {
        const settled = normalizeReviewsOffset(next)
        setReviewsScrollOffset(settled)
        applyReviewsThumbFromOffset(settled)
        reviewsSmoothScrollRafRef.current = null
        reviewsProgrammaticScrollRef.current = false
        const i = indexFromOffset(settled)
        setActiveReviewIndex(i)
        activeReviewIndexRef.current = i
        onDone?.()
      }
    }
    reviewsSmoothScrollRafRef.current = requestAnimationFrame(step)
  }

  /** Индекс отзыва 0..N-1 или «виртуальный» шаг на копию первого (бесшовный переход с последнего) */
  const scrollToReviewIndex = (reviewIdx: number, behavior: ScrollBehavior = 'smooth') => {
    if (reviewIdx < 0 || reviewIdx > reviewsMaxIndex) return
    if (reviewCount < 2) {
      cancelReviewsSmoothScroll()
      reviewsProgrammaticScrollRef.current = false
      setReviewsScrollOffset(0)
      reviewsScrollOffsetRef.current = 0
      applyReviewsThumbFromOffset(0)
      setActiveReviewIndex(0)
      activeReviewIndexRef.current = 0
      return
    }
    const target = REVIEWS_FIRST_OFFSET + reviewIdx * REVIEW_SCROLL_STEP
    if (behavior === 'auto') {
      cancelReviewsSmoothScroll()
      reviewsProgrammaticScrollRef.current = false
      const next = normalizeReviewsOffset(target)
      setReviewsScrollOffset(next)
      applyReviewsThumbFromOffset(next)
      setActiveReviewIndex(reviewIdx)
      activeReviewIndexRef.current = reviewIdx
    } else {
      smoothReviewsOffsetTo(target, REVIEWS_SCROLL_SMOOTH_MS)
    }
  }

  /** С последнего реального — плавно на первый во второй копии; normalize убирает численный перенос без визуального скачка */
  const scrollToNextReviewAutoplay = () => {
    if (!hasReviewsLoop) {
      const cur = activeReviewIndexRef.current
      scrollToReviewIndex(Math.min(reviewsMaxIndex, cur + 1), 'smooth')
      return
    }
    const cur = activeReviewIndexRef.current
    if (cur >= reviewsMaxIndex) {
      // Во второй копии первый отзыв находится на +N*STEP от текущего цикла
      const dupFirstOffset = REVIEWS_FIRST_OFFSET + reviewCount * REVIEW_SCROLL_STEP
      smoothReviewsOffsetTo(dupFirstOffset, REVIEWS_SCROLL_SMOOTH_MS)
    } else {
      scrollToReviewIndex(cur + 1, 'smooth')
    }
  }

  const snapReviewsToNearestCard = () => {
    if (performance.now() < reviewsSkipSnapUntilRef.current) return
    const o = reviewsScrollOffsetRef.current
    const snapped = Math.round(o / REVIEW_SCROLL_STEP) * REVIEW_SCROLL_STEP
    smoothReviewsOffsetTo(normalizeReviewsOffset(snapped), REVIEWS_SCROLL_SMOOTH_MS)
  }

  const resetReviewsViewportToStart = useCallback(() => {
    reviewsThumbAnimatingRef.current = false
    reviewsProgrammaticScrollRef.current = false
    activeReviewIndexRef.current = 0
    cancelReviewsSmoothScroll()
    const next = reviewCount >= 2 ? REVIEWS_FIRST_OFFSET : 0
    setReviewsScrollOffset(next)
    reviewsScrollOffsetRef.current = next
    setReviewsThumbProgress(0)
    setActiveReviewIndex(0)
    setReviewsRangeOverride(null)
  }, [reviewCount])

  useLayoutEffect(() => {
    resetReviewsViewportToStart()
    let cancelled = false
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) resetReviewsViewportToStart()
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [reviewCount, resetReviewsViewportToStart])

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        requestAnimationFrame(() => resetReviewsViewportToStart())
      }
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [resetReviewsViewportToStart])

  useEffect(() => {
    let raf = 0
    let cancelled = false

    const step = (now: number) => {
      if (cancelled) return

      if (document.visibilityState !== 'visible') {
        reviewsAutoStartRef.current = now
        reviewsAutoPausedRef.current = false
        reviewsAutoElapsedBeforePauseRef.current = 0
        setReviewsAutoProgress(0)
        raf = requestAnimationFrame(step)
        return
      }

      if (reviewsIsHoveringRef.current && reviewCount >= 2) {
        if (!reviewsAutoPausedRef.current) {
          reviewsAutoPausedRef.current = true
          reviewsAutoElapsedBeforePauseRef.current = Math.max(0, now - reviewsAutoStartRef.current)
        }
        const p = Math.min(1, reviewsAutoElapsedBeforePauseRef.current / REVIEWS_AUTO_MS)
        setReviewsAutoProgress(p)
        raf = requestAnimationFrame(step)
        return
      }

      if (reviewsAutoPausedRef.current) {
        // Возобновляем с того же места (без скачка прогресса)
        reviewsAutoPausedRef.current = false
        reviewsAutoStartRef.current = now - reviewsAutoElapsedBeforePauseRef.current
      }

      if (reviewCount < 2 || reviewsIsPointerDownRef.current || isReviewsDragging) {
        reviewsAutoStartRef.current = now
        reviewsAutoPausedRef.current = false
        reviewsAutoElapsedBeforePauseRef.current = 0
        if (reviewsAutoProgress !== 0) setReviewsAutoProgress(0)
        raf = requestAnimationFrame(step)
        return
      }

      const elapsed = Math.max(0, now - reviewsAutoStartRef.current)
      const p = Math.min(1, elapsed / REVIEWS_AUTO_MS)
      setReviewsAutoProgress(p)

      if (p >= 1) {
        reviewsAutoStartRef.current = now
        setReviewsAutoProgress(0)
        scrollToNextReviewAutoplay()
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReviewsDragging, reviewCount, reviewsMaxIndex, hasReviewsLoop, REVIEWS_AUTO_MS])

  useEffect(() => {
    const viewport = reviewsViewportRef.current
    if (!viewport) return

    const onWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX)
      const absY = Math.abs(e.deltaY)
      if (!e.shiftKey && absX < absY) return
      e.preventDefault()
      if (reviewsProgrammaticScrollRef.current || reviewsIsPointerDownRef.current) return
      const dx = e.shiftKey ? e.deltaY : e.deltaX
      const n = normalizeReviewsOffset(reviewsScrollOffsetRef.current - dx)
      reviewsScrollOffsetRef.current = n
      setReviewsScrollOffset(n)
      applyReviewsThumbFromOffset(n)
      const idx = indexFromOffset(n)
      setActiveReviewIndex(idx)
      activeReviewIndexRef.current = idx
      resetReviewsAutoTimer()
      if (reviewsWheelSnapTimeoutRef.current) window.clearTimeout(reviewsWheelSnapTimeoutRef.current)
      reviewsWheelSnapTimeoutRef.current = window.setTimeout(() => {
        reviewsWheelSnapTimeoutRef.current = null
        if (reviewsIsPointerDownRef.current || isReviewsDragging) return
        snapReviewsToNearestCard()
      }, 180)
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })

    const resizeObserver = new ResizeObserver(() => {
      if (reviewsThumbAnimatingRef.current || reviewsIsPointerDownRef.current || isReviewsDragging) return
      applyReviewsThumbFromOffset(reviewsScrollOffsetRef.current)
    })
    resizeObserver.observe(viewport)

    applyReviewsThumbFromOffset(reviewsScrollOffsetRef.current)
    return () => {
      viewport.removeEventListener('wheel', onWheel)
      resizeObserver.disconnect()
      if (reviewsWheelSnapTimeoutRef.current) window.clearTimeout(reviewsWheelSnapTimeoutRef.current)
    }
  }, [isReviewsDragging, reviewsMaxIndex, reviewCount, resetReviewsAutoTimer])

  type LowerSectionHeadingKey = 'howWeWork' | 'portfolio' | 'reviews' | 'contacts'

  const [lowerSectionHeadingsVisible, setLowerSectionHeadingsVisible] = useState<
    Record<LowerSectionHeadingKey, boolean>
  >({
    howWeWork: false,
    portfolio: false,
    reviews: false,
    contacts: false,
  })

  const measureHowWeWorkParallaxAnchor = () => {
    const el = howWeWorkHeadingRef.current
    if (!el) return
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    howWeWorkParallaxAnchorYRef.current = scrollY + el.getBoundingClientRect().top
  }

  useLayoutEffect(() => {
    const onResize = () => {
      syncLandingScale()
      measureHowWeWorkParallaxAnchor()
    }
    syncLandingScale()
    measureHowWeWorkParallaxAnchor()
    const vv = window.visualViewport
    vv?.addEventListener('resize', onResize)
    window.addEventListener('resize', onResize)
    return () => {
      vv?.removeEventListener('resize', onResize)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY === 0) {
        setIsHeaderScrolling(false)
        if (scrollIdleTimeoutRef.current) window.clearTimeout(scrollIdleTimeoutRef.current)
        scrollIdleTimeoutRef.current = null
        return
      }

      setIsHeaderScrolling(true)
      if (scrollIdleTimeoutRef.current) window.clearTimeout(scrollIdleTimeoutRef.current)
      scrollIdleTimeoutRef.current = window.setTimeout(() => setIsHeaderScrolling(false), 220)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (scrollIdleTimeoutRef.current) window.clearTimeout(scrollIdleTimeoutRef.current)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsWorkTypesVisible(true)
      return
    }

    const el = workTypesSectionRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsWorkTypesVisible(true)
        io.disconnect()
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsAdvantagesVisible(true)
      return
    }

    const el = advantagesSectionRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsAdvantagesVisible(true)
        io.disconnect()
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLowerSectionHeadingsVisible({
        howWeWork: true,
        portfolio: true,
        reviews: true,
        contacts: true,
      })
      return
    }

    const pairs: { ref: RefObject<HTMLDivElement | null>; key: LowerSectionHeadingKey }[] = [
      { ref: howWeWorkHeadingRef, key: 'howWeWork' },
      { ref: portfolioHeadingRef, key: 'portfolio' },
      { ref: reviewsHeadingRef, key: 'reviews' },
      { ref: contactsHeadingRef, key: 'contacts' },
    ]

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const key = entry.target.getAttribute('data-section-heading') as LowerSectionHeadingKey | null
          if (key) {
            setLowerSectionHeadingsVisible((s) => ({ ...s, [key]: true }))
          }
          io.unobserve(entry.target)
        })
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    pairs.forEach(({ ref, key }) => {
      const el = ref.current
      if (el) {
        el.setAttribute('data-section-heading', key)
        io.observe(el)
      }
    })

    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement

    let rafId = 0

    const update = () => {
      rafId = 0
      if (howWeWorkParallaxAnchorYRef.current == null) {
        measureHowWeWorkParallaxAnchor()
      }
      const anchor = howWeWorkParallaxAnchorYRef.current
      if (anchor == null) return

      const vh = window.innerHeight || 1
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0

      // Длинный участок скролла → плавное движение туда и обратно без «залипания»
      const startScroll = anchor - vh * 1.15
      const endScroll = anchor + vh * 2.05
      const tRaw = (scrollY - startScroll) / Math.max(1, endScroll - startScroll)
      const t = Math.min(1, Math.max(0, tRaw))

      const maxUp = 104
      const y = -t * maxUp
      root.style.setProperty('--how-we-work-rect-parallax', `${y.toFixed(2)}px`)
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(update)
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      measureHowWeWorkParallaxAnchor()
      onScroll()
    }

    const onPageShow = () => {
      measureHowWeWorkParallaxAnchor()
      onScroll()
    }

    update()
    const scrollOpts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('scroll', onScroll, scrollOpts)
    document.addEventListener('scroll', onScroll, scrollOpts)
    window.visualViewport?.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll, scrollOpts)
      document.removeEventListener('scroll', onScroll, scrollOpts)
      window.visualViewport?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  useEffect(() => {
    const anyModalOpen = isLeadModalOpen || isPrivacyModalOpen || isTermsModalOpen
    if (!anyModalOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isPrivacyModalOpen) setIsPrivacyModalOpen(false)
      else if (isTermsModalOpen) setIsTermsModalOpen(false)
      else setIsLeadModalOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isLeadModalOpen, isPrivacyModalOpen, isTermsModalOpen])

  return (
    <div className="landing-viewport">
      <header className={`landing-header${isHeaderScrolling ? ' landing-header--scrolling' : ''}`}>
        <div className="landing-header__inner">
          <img className="logo-prof-pol" src={logoProfPol} alt="ПРОФ ПОЛЫ" />

          <button
            type="button"
            className="div50 header-nav-button"
            onClick={() => scrollToSection('contact-form')}
          >
            Контакты
          </button>
          <button
            type="button"
            className="div51 header-nav-button"
            onClick={() => scrollToSection('reviews-section')}
          >
            Отзывы
          </button>
          <button
            type="button"
            className="div52 header-nav-button"
            onClick={() => scrollToSection('portfolio-section')}
          >
            Портфолио
          </button>

          <button
            type="button"
            className="header-cta cta-button cta-button--header"
            onClick={() => setIsLeadModalOpen(true)}
          >
            Заказать замер
          </button>
        </div>
      </header>

      <div className="landing-scale-outer">
        <div className="landing-scale-inner">
          <div className="frame-427318908">
        <div className="rectangle-9" />
        <div className="rectangle-11" />
        <div className="rectangle-10" />
        <img
          className="material-symbols-brick"
          src="/material-symbols-brick0.svg"
          alt=""
        />
        <img
          className="material-symbols-speed"
          src="/material-symbols-speed0.svg"
          alt=""
        />
        <div className="rectangle-12" />
        <img className="image-3" src={image30} alt="" />
        <div className="hero-vignette" aria-hidden={true} />
        <div className="_1">
          <span>
            <span className="_1-span">
              Механизированная стяжка пола
              <br />
            </span>
            <span className="_1-span2">за 1 день</span>
            <span className="_1-span"> в Истре, Балашихе и по всей Московской области</span>
          </span>
        </div>
        <div className="_3-10">
          Работаем по договору с гарантией 3 года. Своя техника
          <br />
          и материалы. Опыт работы бригады - 10 лет.
        </div>
        <button
          type="button"
          className="rectangle-1 cta-button cta-button--hero"
          onClick={scrollToContactForm}
        >
          <span className="div">Записаться на бесплатный замер</span>
        </button>
        <div className="hero-depth-shadow hero-depth-shadow--on-work-types" aria-hidden />
        <div className="section-depth-shadow section-depth-shadow--work-to-advantages" aria-hidden />
        <div className="section-depth-shadow section-depth-shadow--slider-on-advantages" aria-hidden />
        <img className="rectangle-13" src={rectangleDecor} alt="" />
        <img className="rectangle-14" src={rectangleDecor} alt="" />
        <img className="rectangle-15" src={rectangleDecor} alt="" />
        <img className="rectangle-16" src={rectangleDecor} alt="" />
        <img className="rectangle-17" src={rectangleDecor} alt="" />
        <div
          ref={workTypesSectionRef}
          id="work-types-section"
          className={`div2 section-heading${isWorkTypesVisible ? ' section-heading--visible' : ''}`}
        >
          Виды работ
        </div>
        <div
          ref={advantagesSectionRef}
          id="advantages-section"
          className={`div3 section-heading${isAdvantagesVisible ? ' section-heading--visible' : ''}`}
        >
          Наши преимущества
        </div>
        <div
          ref={howWeWorkHeadingRef}
          className={`div4 section-heading${lowerSectionHeadingsVisible.howWeWork ? ' section-heading--visible' : ''}`}
        >
          Как мы работаем
        </div>
        <div
          ref={portfolioHeadingRef}
          id="portfolio-section"
          className={`div5 section-heading${lowerSectionHeadingsVisible.portfolio ? ' section-heading--visible' : ''}`}
        >
          Примеры наших работ
        </div>
        <div className="portfolio-top-shadow" aria-hidden />
        <div
          ref={reviewsHeadingRef}
          id="reviews-section"
          className={`div6 section-heading${lowerSectionHeadingsVisible.reviews ? ' section-heading--visible' : ''}`}
        >
          Отзывы о нашей работе
        </div>
        <div className="portfolio-bottom-shadow" aria-hidden />
        <div className="div7">Оставьте заявку и мы с вами свяжемся</div>
        <div className="contact-top-shadow" aria-hidden />
        <div
          ref={contactsHeadingRef}
          className={`div8 section-heading${lowerSectionHeadingsVisible.contacts ? ' section-heading--visible' : ''}`}
        >
          Наши контакты
        </div>
        <div
          className={`group-2 work-types-card work-types-card--1${isWorkTypesVisible ? ' work-types--visible' : ''}`}
        >
          <div className="group-1">
            <div className="rectangle-2" />
            <div className="div9">Стяжка в квартире</div>
            <div className="div10">
              Идеально ровная поверхность под ламинат, плитку или
              <br />
              кварцвинил. Без протечек к соседям.
            </div>
          </div>
        </div>
        <div
          className={`group-2 work-types-card work-types-card--2${isWorkTypesVisible ? ' work-types--visible' : ''}`}
        >
          <div className="group-1">
            <div className="rectangle-22" />
            <div className="div11">Стяжка в частном доме</div>
            <div className="div12">
              Работаем на любых площадях. Идеальное решение для
              <br />
              системы водяного теплого пола.
            </div>
          </div>
        </div>
        <div
          className={`group-2 work-types-card work-types-card--3${isWorkTypesVisible ? ' work-types--visible' : ''}`}
        >
          <div className="group-1">
            <div className="rectangle-23" />
            <div className="div13">Стяжка в гараже или коммерции</div>
            <div className="div14">
              Повышенная прочность и износостойкость. Выдерживает
              <br />
              высокие нагрузки и спецтехнику.
            </div>
          </div>
        </div>
        <div
          className={`group-2 work-types-card work-types-card--4${isWorkTypesVisible ? ' work-types--visible' : ''}`}
        >
          <div className="group-1">
            <div className="rectangle-24" />
            <div className="div15">Полусухая стяжка</div>
            <div className="div16">
            Ровный пол под ламинат или плитку за 1 день. Без шума и грязи. Можно ходить уже через 12 часов.
            </div>
          </div>
        </div>
        <div className={`ellipse-1 how-we-work-step how-we-work-step--1${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`} />
        <div className={`div17 how-we-work-step how-we-work-step--1${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>Замер</div>
        <div className={`div18 how-we-work-step how-we-work-step--1${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>
          Приезжаем,
          <br />
          меряем перепады высот
        </div>
        <div className={`ellipse-12 how-we-work-step how-we-work-step--2${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`} />
        <div className={`ellipse-2 how-we-work-step how-we-work-step--3${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`} />
        <div className={`ellipse-3 how-we-work-step how-we-work-step--4${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`} />
        <div className={`div19 how-we-work-step how-we-work-step--2${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>Договор</div>
        <div className={`div20 how-we-work-step how-we-work-step--3${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>Монтаж</div>
        <div className={`div21 how-we-work-step how-we-work-step--4${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>Сдача</div>
        <div className={`div22 how-we-work-step how-we-work-step--2${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>Фиксируем цену и сроки</div>
        <div className={`div23 how-we-work-step how-we-work-step--3${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>
          Привозим технику и материалы, делаем стяжку за день
        </div>
        <div className={`div24 how-we-work-step how-we-work-step--4${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}>
          Вы принимаете идеально ровный пол под финишное покрытие
        </div>
        <svg
          className={`group-10 how-we-work-arrow how-we-work-arrow--1${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}
          width="485"
          height="522"
          viewBox="0 0 485 522"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            className="how-we-work-arrow__path"
            pathLength={1}
            d="M36.1532 101.642C104.505 166.515 280.835 228.948 283.21 167.179C283.665 155.37 245.474 63.3234 196.497 148.966C161.257 213.902 97.1574 401.099 388.324 470.705"
            stroke="black"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path
            className="how-we-work-arrow__head"
            d="M392.116 454.935L421.691 478.312L383.721 486.089L392.116 454.935Z"
            fill="black"
          />
        </svg>
        <svg
          className={`group-8 how-we-work-arrow how-we-work-arrow--2${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}
          width="448"
          height="281"
          viewBox="0 0 448 281"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            className="how-we-work-arrow__path"
            pathLength={1}
            d="M395.632 30.7664C329.211 64.6722 240.181 172.918 288.101 186.775C297.262 189.424 378.151 181.529 322.086 131.069C279.145 94.1069 146.841 13.1936 26.0987 198.567"
            stroke="black"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path
            className="how-we-work-arrow__head"
            d="M37.6094 204.283L12.5518 219.883L15.074 192.372L37.6094 204.283Z"
            fill="black"
          />
        </svg>
        <svg
          className={`group-9 how-we-work-arrow how-we-work-arrow--3${lowerSectionHeadingsVisible.howWeWork ? ' how-we-work--visible' : ''}`}
          width="733"
          height="763"
          viewBox="0 0 733 763"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            className="how-we-work-arrow__path"
            pathLength={1}
            d="M71.5111 262.242C137.511 415.742 390.671 361.742 363.873 299.13C358.75 287.161 279.085 210.596 272.746 315.729C269.745 394.684 460.51 645.742 667.511 481.243"
            stroke="black"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path
            className="how-we-work-arrow__head"
            d="M651.308 469.433L688.788 453.308L678.418 491.736L651.308 469.433Z"
            fill="black"
          />
        </svg>
        <div className="before-after-slider-root">
          <ImageSlider before={image50} after={image60} />
        </div>
        <div className="ellipse-4" />
        <div className="_12">1</div>
        <div className="ellipse-42" />
        <div className="_2">2</div>
        <div className="ellipse-43" />
        <div className="_3">3</div>
        <div className="ellipse-44" />
        <div className="_4">4</div>
        <div className={`_13${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>
          Утром заходим на объект — вечером вы уже можете ходить по ровному полу. Никаких простоев в ремонте
        </div>
        <div className={`div29${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>
          Используем собственное оборудование Alpha. Подаем смесь по шлангу до 30 этажа — никакой грязи в подъезде и лифте
        </div>
        <div className={`div30${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>
          Приедем в день обращения. Проверим перепады высот и рассчитаем окончательную стоимость, которая не изменится в процессе
        </div>
        <div className={`div31${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>
          Работа по договору с фиксированной ценой и гарантией. Соблюдаем СНиП, а минимальное содержание воды исключает риск протечек к соседям.
        </div>
        <div className={`div32${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>Готовый пол за 1 день</div>
        <div className={`div33${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>Немецкая технология</div>
        <div className={`div34${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>
          Бесплатный выезд и точный расчёт
        </div>
        <div className={`div35${isAdvantagesVisible ? ' advantages-text--visible' : ''}`}>Надежность</div>
        <div className="group-22">
          <div className="group-15">
            <img
              className={`image-4${isWorkTypesVisible ? ' work-types--visible' : ''}`}
              src={image40}
              alt=""
            />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img
              className={`image-42${isWorkTypesVisible ? ' work-types--visible' : ''}`}
              src={image41}
              alt=""
            />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img
              className={`image-43${isWorkTypesVisible ? ' work-types--visible' : ''}`}
              src={image42}
              alt=""
            />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img
              className={`image-44${isWorkTypesVisible ? ' work-types--visible' : ''}`}
              src={image43}
              alt=""
            />
          </div>
        </div>
        <form
          id="contact-form"
          className="contact-form"
          onSubmit={async (e) => {
            e.preventDefault()
            const name = nameValue.trim()
            const phone = phoneValue.trim()
            const digits = phone.replace(/\D/g, '')
            if (!name || digits.length < 11) {
              showLeadToast('error', 'Укажите имя и полный номер телефона.')
              return
            }
            let message = contactMessageValue.trim()
            const email = contactEmailValue.trim()
            if (email) {
              message = message ? `${message}\n\nEmail: ${email}` : `Email: ${email}`
            }
            setIsLeadSending(true)
            try {
              await postLeadToServer({ name, phone, message })
              showLeadToast('success', 'Заявка отправлена. Мы свяжемся с вами.')
              setNameValue('')
              setPhoneValue('')
              setContactEmailValue('')
              setContactMessageValue('')
              setIsContactConsentChecked(false)
            } catch (err) {
              showLeadToast('error', err instanceof Error ? err.message : 'Не удалось отправить заявку.')
            } finally {
              setIsLeadSending(false)
            }
          }}
        >
          <div className="contact-form__left">
            <div className="contact-form__field">
              <label className="contact-form__label" htmlFor="contact-name">
                Как к вам обращаться?
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                value={nameValue}
                onChange={(e) => setNameValue(formatNameValue(e.target.value))}
                placeholder="Имя"
              />
            </div>
            <div className="contact-form__field">
              <label className="contact-form__label" htmlFor="contact-phone">
                Номер телефона
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phoneValue}
                onChange={(e) => setPhoneValue(formatPhoneValue(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key !== 'Backspace') return

                  const input = e.currentTarget
                  const caret = input.selectionStart ?? input.value.length
                  const hasSelection = input.selectionStart !== input.selectionEnd
                  if (hasSelection || caret === 0) return

                  const previousChar = input.value[caret - 1]
                  if (/\d/.test(previousChar) && !(caret - 1 === 1 && input.value.startsWith('+7'))) {
                    return
                  }

                  e.preventDefault()
                  setPhoneValue(removePhoneDigitBeforeCaret(input.value, caret))
                }}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className="contact-form__field">
              <label className="contact-form__label" htmlFor="contact-email">
                Электронный адрес
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                value={contactEmailValue}
                onChange={(e) => setContactEmailValue(e.target.value)}
                placeholder="mail@mail.ru"
              />
            </div>
          </div>
          <div className="contact-form__right">
            <div className="contact-form__field contact-form__field--message">
              <label className="contact-form__label" htmlFor="contact-message">
                Есть вопросы?
              </label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="Ваш вопрос"
                rows={8}
                value={contactMessageValue}
                onChange={(e) => setContactMessageValue(e.target.value)}
              />
            </div>
          </div>
        </form>
        <button
          type="submit"
          form="contact-form"
          className="rectangle-18 contact-form__submit cta-button cta-button--footer"
          disabled={!isContactConsentChecked || isLeadSending}
        >
          <span className="div36">Записаться на бесплатный замер</span>
        </button>
        <label className="form-consent form-consent--contact">
          <input
            className="form-consent__checkbox"
            type="checkbox"
            checked={isContactConsentChecked}
            onChange={(e) => setIsContactConsentChecked(e.target.checked)}
          />
          <span className="form-consent__text">
            Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с{' '}
            <button
              type="button"
              className="form-consent__link"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsPrivacyModalOpen(true)
              }}
            >
              политикой конфиденциальности
            </button>
          </span>
        </label>
        <div className="div43">Москва, ул. Адмирала Лазарева, 35</div>
        <div className="contact-phone-inline">
          Телефон:{' '}
          <a href="tel:+79852232369" style={{ color: 'inherit', textDecoration: 'none' }}>
            +7 (985) 223-23-69
          </a>
        </div>
        <div className="contact-email-inline">
          Почта:{' '}
          <a
            href="mailto:info@profpol-stjazhka.ru"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            info@profpol-stjazhka.ru
          </a>
        </div>
        <div className="rectangle-8" />
        <button
          type="button"
          className="footer-policy"
          onClick={() => setIsPrivacyModalOpen(true)}
        >
          Политика конфиденциальности
        </button>
        <button
          type="button"
          className="footer-terms"
          onClick={() => setIsTermsModalOpen(true)}
        >
          Пользовательское соглашение
        </button>
        <div className="footer-phone">
          Тел: <a href="tel:+79852232369">+7 (985) 223-23-69</a>
        </div>
        <div className="footer-email">
          Почта:{' '}
          <a
            href="mailto:info@profpol-stjazhka.ru"
          >
            info@profpol-stjazhka.ru
          </a>
        </div>
        <div className="footer-copy">ПРОФ ПОЛЫ © 2026</div>
        <div className="div8" style={{ marginBottom: '16px' }}>Наши контакты</div>

      <div className="image-7" style={{ 
        overflow: 'hidden', 
        borderRadius: '24px', // Скругляем как у инпутов формы
        border: '1px solid #E0E0E0', // Тонкая серая рамка, чтобы карта не «растекалась»
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', // Легкая тень для объема
        height: '400px' // Убедись, что высота зафиксирована
      }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2257.1955198199153!2d37.54116527762533!3d55.546380807870705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x414aac47ceb4e20f%3A0xaa4a3d3d71df0f42!2z0YPQuy4g0JDQtNC80LjRgNCw0LvQsCDQm9Cw0LfQsNGA0LXQstCwLCAzNSwg0JzQvtGB0LrQstCwLCAxMTcxNDk!5e0!3m2!1sru!2sru!4v1776290791546!5m2!1sru!2sru"
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }} // Немного приглушим яркость карт под стиль лендинга
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
        <div className="reviews-slider" aria-label="Отзывы">
          <div
            ref={reviewsViewportRef}
            className="reviews-viewport"
            onMouseEnter={() => {
              reviewsIsHoveringRef.current = true
            }}
            onMouseLeave={() => {
              reviewsIsHoveringRef.current = false
            }}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              reviewsViewportPointerDownRef.current = true
              reviewsDragStartXRef.current = e.clientX
              reviewsDragStartOffsetRef.current = reviewsScrollOffsetRef.current
            }}
            onPointerMove={(e) => {
              if (!reviewsViewportPointerDownRef.current) return
              const dx = e.clientX - reviewsDragStartXRef.current
              const n = normalizeReviewsOffset(reviewsDragStartOffsetRef.current - dx)
              reviewsScrollOffsetRef.current = n
              setReviewsScrollOffset(n)
              applyReviewsThumbFromOffset(n)
              const idx = indexFromOffset(n)
              setActiveReviewIndex(idx)
              activeReviewIndexRef.current = idx
            }}
            onPointerUp={() => {
              reviewsViewportPointerDownRef.current = false
              snapReviewsToNearestCard()
            }}
            onPointerCancel={() => {
              reviewsViewportPointerDownRef.current = false
              snapReviewsToNearestCard()
            }}
          >
            <div
              className="reviews-track"
              style={{
                transform: `translate3d(${-reviewsScrollOffset}px, 0, 0)`,
              }}
            >
              {hasReviewsLoop && (
                <article className="review-card review-card--loop-clone" aria-hidden>
                  <div className="review-card__avatar" aria-hidden="true">
                    {getInitials(reviews[reviewsMaxIndex].name)}
                  </div>
                  <div className="review-card__name">{reviews[reviewsMaxIndex].name}</div>
                  <div className="review-card__source">{reviews[reviewsMaxIndex].source}</div>
                  <div className="review-card__text">
                    {wrapReviewText(reviews[reviewsMaxIndex].text).map((line, lineIdx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <span key={lineIdx}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                </article>
              )}
              {hasReviewsLoop &&
                reviews.map((r, idx) => (
                  <article
                    key={`a-${r.name}-${idx}`}
                    className={`review-card${activeReviewIndex === idx ? ' review-card--active' : ''}`}
                  >
                    <div className="review-card__avatar" aria-hidden="true">
                      {getInitials(r.name)}
                    </div>
                    <div className="review-card__name">{r.name}</div>
                    <div className="review-card__source">{r.source}</div>
                    <div className="review-card__text">
                      {wrapReviewText(r.text).map((line, lineIdx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={lineIdx}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              {hasReviewsLoop &&
                reviews.map((r, idx) => (
                  <article
                    key={`b-${r.name}-${idx}`}
                    className={`review-card${activeReviewIndex === idx ? ' review-card--active' : ''}`}
                  >
                    <div className="review-card__avatar" aria-hidden="true">
                      {getInitials(r.name)}
                    </div>
                    <div className="review-card__name">{r.name}</div>
                    <div className="review-card__source">{r.source}</div>
                    <div className="review-card__text">
                      {wrapReviewText(r.text).map((line, lineIdx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={lineIdx}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              {!hasReviewsLoop &&
                reviews.map((r, idx) => (
                  <article
                    key={`${r.name}-${r.text.slice(0, 12)}`}
                    className={`review-card${activeReviewIndex === idx ? ' review-card--active' : ''}`}
                  >
                    <div className="review-card__avatar" aria-hidden="true">
                      {getInitials(r.name)}
                    </div>
                    <div className="review-card__name">{r.name}</div>
                    <div className="review-card__source">{r.source}</div>
                    <div className="review-card__text">
                      {wrapReviewText(r.text).map((line, lineIdx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={lineIdx}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
            </div>
          </div>

          <div
            className="reviews-sliderbar"
            aria-hidden={false}
            style={
              {
                ['--reviews-auto-progress' as any]: reviewsAutoProgress,
              } as React.CSSProperties
            }
          >
            <div className="reviews-autotimer" aria-hidden="true">
              <div className="reviews-autotimer__fill" />
            </div>
            <input
              className="reviews-range"
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={reviewsSliderProgress}
              onChange={(e) => {
                const next = Number(e.target.value)
                setReviewsRangeOverride(next)
                const maxScroll = reviewsThumbRangeScroll
                const base = reviewCount >= 2 ? REVIEWS_FIRST_OFFSET : 0
                const targetOffset = normalizeReviewsOffset(base + next * maxScroll)
                isSyncingReviewsScrollRef.current = true
                if (reviewsIsPointerDownRef.current) {
                  reviewsScrollOffsetRef.current = targetOffset
                  setReviewsScrollOffset(targetOffset)
                  applyReviewsThumbFromOffset(targetOffset)
                  const idx = indexFromOffset(targetOffset)
                  setActiveReviewIndex(idx)
                  activeReviewIndexRef.current = idx
                  isSyncingReviewsScrollRef.current = false
                } else {
                  smoothReviewsOffsetTo(targetOffset, 320, () => {
                    isSyncingReviewsScrollRef.current = false
                  })
                  window.setTimeout(() => {
                    isSyncingReviewsScrollRef.current = false
                  }, 400)
                }
                resetReviewsAutoTimer()
              }}
              onPointerDown={(e) => {
                setIsReviewsDragging(true)
                reviewsIsPointerDownRef.current = true
                setReviewsRangeOverride(reviewsThumbProgress)
                reviewsDragRef.current = { x: e.clientX, t: performance.now() }
                resetReviewsAutoTimer()
              }}
              onPointerMove={(e) => {
                if (!isReviewsDragging) return
                const prev = reviewsDragRef.current
                const nowT = performance.now()
                if (!prev) {
                  reviewsDragRef.current = { x: e.clientX, t: nowT }
                  return
                }
                const dx = e.clientX - prev.x
                const dt = Math.max(1, nowT - prev.t)
                // скорость px/ms → растяжение 0..0.1
                const speed = Math.abs(dx) / dt
                const stretch = Math.min(0.1, Math.max(0, speed * 0.035))
                setReviewsThumbStretch(stretch)
                reviewsDragRef.current = { x: e.clientX, t: nowT }
              }}
              onPointerUp={() => {
                setIsReviewsDragging(false)
                reviewsIsPointerDownRef.current = false
                reviewsDragRef.current = null
                setReviewsThumbStretch(0)
                requestAnimationFrame(() => {
                  snapReviewsToNearestCard()
                  setReviewsRangeOverride(null)
                })
                resetReviewsAutoTimer()
              }}
              onPointerCancel={() => {
                setIsReviewsDragging(false)
                reviewsIsPointerDownRef.current = false
                reviewsDragRef.current = null
                setReviewsThumbStretch(0)
                requestAnimationFrame(() => {
                  snapReviewsToNearestCard()
                  setReviewsRangeOverride(null)
                })
                resetReviewsAutoTimer()
              }}
              aria-label="Прокрутка отзывов"
              style={
                {
                  // CSS vars for custom track/thumb rendering
                  ['--reviews-progress' as any]: reviewsSliderProgress,
                  ['--reviews-thumb-stretch' as any]: reviewsThumbStretch,
                  ['--reviews-dragging' as any]: isReviewsDragging ? 1 : 0,
                } as React.CSSProperties
              }
              data-dragging={isReviewsDragging ? '1' : '0'}
            />
          </div>
        </div>
        <img
          className="material-symbols-service-toolbox-rounded"
          src="/material-symbols-service-toolbox-rounded0.svg"
          alt=""
        />
        <img className="mdi-paper" src="/mdi-paper0.svg" alt="" />
        <div className={`line-3 section-line${isWorkTypesVisible ? ' section-line--visible' : ''}`} />
        <div className={`line-4 section-line${isAdvantagesVisible ? ' section-line--visible' : ''}`} />
        <div className={`line-5 section-line${lowerSectionHeadingsVisible.howWeWork ? ' section-line--visible' : ''}`} />
        <div className={`line-6 section-line${lowerSectionHeadingsVisible.portfolio ? ' section-line--visible' : ''}`} />
        <div className={`line-7 section-line${lowerSectionHeadingsVisible.reviews ? ' section-line--visible' : ''}`} />
        <img className="ellipse-10" src={ellipseDecor} alt="" />
        <div
          className={`div53 portfolio-intro-text portfolio-intro-text--1${lowerSectionHeadingsVisible.portfolio ? ' portfolio-intro-text--visible' : ''}`}
        >
          Реализуем проекты любой сложности: от небольших квартир до
          загородных домов и промышленных цехов.
        </div>
        <div
          className={`div54 portfolio-intro-text portfolio-intro-text--2${lowerSectionHeadingsVisible.portfolio ? ' portfolio-intro-text--visible' : ''}`}
        >
          На фото - наши реальные объекты, где мы создали идеально ровное
          основание под чистовое покрытие.
        </div>
        <img
          className={`image-10 portfolio-photo portfolio-photo--1${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image100}
          alt=""
        />
        <img
          className={`image-11 portfolio-photo portfolio-photo--2${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image110}
          alt=""
        />
        <img
          className={`image-14 portfolio-photo portfolio-photo--3${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image140}
          alt=""
        />
        <img
          className={`image-15 portfolio-photo portfolio-photo--4${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image150}
          alt=""
        />
        <img
          className={`image-12 portfolio-photo portfolio-photo--5${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image120}
          alt=""
        />
        <img
          className={`image-13 portfolio-photo portfolio-photo--6${lowerSectionHeadingsVisible.portfolio ? ' portfolio-photo--visible' : ''}`}
          src={image130}
          alt=""
        />
          </div>
        </div>
      </div>

      {isLeadModalOpen && (
        <div
          className="lead-modal-overlay"
          role="presentation"
          onMouseDown={() => setIsLeadModalOpen(false)}
        >
          <div
            className="lead-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="lead-modal__header">
              <div id="lead-modal-title" className="lead-modal__title">
                Оставить заявку
              </div>
              <button
                type="button"
                className="lead-modal__close"
                aria-label="Закрыть"
                onClick={() => setIsLeadModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="lead-modal__form"
              onSubmit={async (e) => {
                e.preventDefault()
                const name = leadNameValue.trim()
                const phone = leadPhoneValue.trim()
                const digits = phone.replace(/\D/g, '')
                if (!name || digits.length < 11) {
                  showLeadToast('error', 'Укажите имя и полный номер телефона.')
                  return
                }
                const message = leadMessageValue.trim()
                setIsLeadSending(true)
                try {
                  await postLeadToServer({ name, phone, message })
                  showLeadToast('success', 'Заявка отправлена. Мы свяжемся с вами.')
                  setIsLeadModalOpen(false)
                  setLeadNameValue('')
                  setLeadPhoneValue('')
                  setLeadMessageValue('')
                  setIsLeadConsentChecked(false)
                } catch (err) {
                  showLeadToast('error', err instanceof Error ? err.message : 'Не удалось отправить заявку.')
                } finally {
                  setIsLeadSending(false)
                }
              }}
            >
              <label className="lead-modal__field">
                <span className="lead-modal__label">Как к вам обращаться?</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={leadNameValue}
                  onChange={(e) => setLeadNameValue(formatNameValue(e.target.value))}
                  placeholder="Имя"
                />
              </label>

              <label className="lead-modal__field">
                <span className="lead-modal__label">Номер телефона</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={leadPhoneValue}
                  onChange={(e) => setLeadPhoneValue(formatPhoneValue(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key !== 'Backspace') return

                    const input = e.currentTarget
                    const caret = input.selectionStart ?? input.value.length
                    const hasSelection = input.selectionStart !== input.selectionEnd
                    if (hasSelection || caret === 0) return

                    const previousChar = input.value[caret - 1]
                    if (/\d/.test(previousChar) && !(caret - 1 === 1 && input.value.startsWith('+7'))) {
                      return
                    }

                    e.preventDefault()
                    setLeadPhoneValue(removePhoneDigitBeforeCaret(input.value, caret))
                  }}
                  placeholder="+7 (___) ___-__-__"
                />
              </label>

              <label className="lead-modal__field lead-modal__field--message">
                <span className="lead-modal__label">Есть вопросы?</span>
                <textarea
                  rows={5}
                  value={leadMessageValue}
                  onChange={(e) => setLeadMessageValue(e.target.value)}
                  placeholder="Ваш вопрос"
                />
              </label>

              <button
                type="submit"
                className="lead-modal__submit cta-button cta-button--header"
                disabled={!isLeadConsentChecked || isLeadSending}
              >
                Отправить заявку
              </button>

              <label className="form-consent form-consent--modal">
                <input
                  className="form-consent__checkbox"
                  type="checkbox"
                  checked={isLeadConsentChecked}
                  onChange={(e) => setIsLeadConsentChecked(e.target.checked)}
                />
                <span className="form-consent__text">
                  Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с{' '}
                  <button
                    type="button"
                    className="form-consent__link"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsPrivacyModalOpen(true)
                    }}
                  >
                    политикой конфиденциальности
                  </button>
                </span>
              </label>
            </form>
          </div>
        </div>
      )}

      {isPrivacyModalOpen && (
        <div
          className="policy-modal-overlay"
          role="presentation"
          onMouseDown={() => setIsPrivacyModalOpen(false)}
        >
          <div
            className="policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="policy-modal__header">
              <div id="policy-modal-title" className="policy-modal__title">
                Политика конфиденциальности
              </div>
              <button
                type="button"
                className="policy-modal__close"
                aria-label="Закрыть"
                onClick={() => setIsPrivacyModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="policy-modal__body">
              <p className="policy-modal__lead">
              Настоящая политика описывает порядок обработки персональных данных посетителей сайта. Оператор: Хатагов Александр Сергеевич ИНН: 500314805747, далее по тексту — «Оператор».
              </p>
              <h3 className="policy-modal__h3">1. Общие положения</h3>
              <p>
                Оператор обрабатывает персональные данные в соответствии с Федеральным законом № 152-ФЗ «О персональных
                данных» и иными нормами РФ. Используя формы на сайте, вы подтверждаете ознакомление с настоящей
                политикой.
              </p>
              <h3 className="policy-modal__h3">2. Какие данные мы можем получать</h3>
              <p>Фамилия, имя;
                <br />
                Номер телефона;
                <br />
                Адрес электронной почты;
                <br />
                Технические сведения: файлы cookie, IP-адрес, данные об устройстве и браузере (собираются автоматически для аналитики).</p>
              <h3 className="policy-modal__h3">3. Цели обработки</h3>
              <p>Обеспечение обратной связи, консультирование по услугам (бренд «ПРОФ ПОЛЫ»), обработка заявок для последующего заключения сделок, а также информирование по согласованным каналам связи..</p>
              <h3 className="policy-modal__h3">4. Срок хранения и защита</h3>
              <p>Персональные данные обрабатываются на территории РФ (хостинг ООО «БЕГЕТ»). 
                Для связи по заявке Оператор имеет право передавать данные привлеченным специалистам (ПРОФ ПОЛЫ). 
                Данные хранятся не дольше, чем это необходимо для указанных целей, либо до отзыва согласия. 
                Оператор принимает организационные и технические меры для защиты информации.</p>
              <h3 className="policy-modal__h3">5. Ваши права</h3>
              <p>Для уточнения, удаления данных или отзыва согласия направьте письмо Оператору на e-mail: info@lowl1ght-dev.ru</p>
            </div>
          </div>
        </div>
      )}

      {isTermsModalOpen && (
        <div
          className="policy-modal-overlay"
          role="presentation"
          onMouseDown={() => setIsTermsModalOpen(false)}
        >
          <div
            className="policy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="policy-modal__header">
              <div id="terms-modal-title" className="policy-modal__title">
                Пользовательское соглашение
              </div>
              <button
                type="button"
                className="policy-modal__close"
                aria-label="Закрыть"
                onClick={() => setIsTermsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="policy-modal__body">
              <p className="policy-modal__lead">
              Настоящее Соглашение регулирует отношения между Хатаговым Александром Сергеевичем ИНН: 500314805747, далее по тексту — Оператор, и пользователем сайта.
Сайт является информационным ресурсом Оператора, предназначенным для ознакомления с услугами бренда «ПРОФ ПОЛЫ». Используя сайт (в том числе заполняя формы обратной связи), вы подтверждаете свое согласие с условиями настоящего Соглашения.
              </p>
              <h3 className="policy-modal__h3">1. Общие положения</h3>
              <p>
                Используя сайт (включая заполнение форм), вы соглашаетесь с условиями настоящего соглашения. Если вы не
                согласны — прекратите использование сайта.
              </p>
              <h3 className="policy-modal__h3">2. Сервисы и информация</h3>
              <p>
                Информация на сайте носит справочный характер и не является публичной офертой, если иное прямо не
                указано. Оператор вправе изменять содержимое сайта без предварительного уведомления.
              </p>
              <h3 className="policy-modal__h3">3. Обработка заявок</h3>
              <p>
              Оставляя заявку через форму на сайте, Пользователь понимает и соглашается, что сайт является технической площадкой для передачи данных специалистам. Оператор не является стороной в последующих сделках между Пользователем и специалистами и не несет ответственности за качество оказанных ими услуг.

              </p>
              <h3 className="policy-modal__h3">4. Ограничение ответственности</h3>
              <p>
                Оператор не несёт ответственности за временную недоступность сайта, а также за возможные убытки,
                возникшие в результате использования или невозможности использования ресурса.
              </p>
              <h3 className="policy-modal__h3">5. Заключительные положения</h3>
<div className="policy-modal__content">
  <p>
    Порядок обработки персональных данных регулируется отдельным документом — 
    <strong>Политикой конфиденциальности</strong>.
  </p>
  <p>
    Оператор имеет право в одностороннем порядке изменять условия настоящего Соглашения 
    без предварительного уведомления Пользователя. Новая редакция вступает в силу с момента ее размещения на сайте.
  </p>
  <p>
    Все споры, возникающие из настоящего Соглашения, подлежат разрешению путем переговоров. 
    При невозможности достижения согласия споры рассматриваются в соответствии с действующим законодательством РФ.
  </p>
  <p>
    По вопросам, связанным с использованием сайта, вы можете обратиться к Оператору 
    по электронной почте: <strong>info@lowl1ght-dev.ru</strong>
  </p>
</div>
          </div>
        </div>
      </div>)}

      <div
        className={`lead-toast${leadToast.open ? ' lead-toast--open' : ''}${
          leadToast.tone === 'error' ? ' lead-toast--error' : ''
        }`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="lead-toast__inner">
          <div className="lead-toast__title">{leadToast.tone === 'error' ? 'Не отправлено' : 'Готово'}</div>
          <div className="lead-toast__text">{leadToast.text}</div>
        </div>
        <button
          type="button"
          className="lead-toast__close"
          aria-label="Закрыть уведомление"
          onClick={() => setLeadToast((prev) => ({ ...prev, open: false }))}
        >
          ×
        </button>
      </div>
    </div>
  )
}
