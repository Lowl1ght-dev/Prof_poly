import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

function syncLandingScale() {
  const w = window.visualViewport?.width ?? window.innerWidth
  const scale = w / DESIGN_W
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
  const [leadNameValue, setLeadNameValue] = useState('')
  const [leadPhoneValue, setLeadPhoneValue] = useState('')
  const [leadEmailValue, setLeadEmailValue] = useState('')
  const [leadMessageValue, setLeadMessageValue] = useState('')
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useLayoutEffect(() => {
    syncLandingScale()
    const vv = window.visualViewport
    vv?.addEventListener('resize', syncLandingScale)
    window.addEventListener('resize', syncLandingScale)
    return () => {
      vv?.removeEventListener('resize', syncLandingScale)
      window.removeEventListener('resize', syncLandingScale)
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
        <div className="_1">
          <span>
            <span className="_1-span">
              Механизированная стяжка пола
              <br />
            </span>
            <span className="_1-span2">за 1 день</span>
            <span className="_1-span">в Истре и Балашихе</span>
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
        <img className="rectangle-13" src={rectangleDecor} alt="" />
        <img className="rectangle-14" src={rectangleDecor} alt="" />
        <img className="rectangle-15" src={rectangleDecor} alt="" />
        <img className="rectangle-16" src={rectangleDecor} alt="" />
        <img className="rectangle-17" src={rectangleDecor} alt="" />
        <div className="div2">Виды работ</div>
        <div className="div3">Наши преимущества</div>
        <div className="div4">Как мы работаем</div>
        <div id="portfolio-section" className="div5">
          Примеры наших работ
        </div>
        <div id="reviews-section" className="div6">
          Отзывы о нашей работе
        </div>
        <div className="div7">Оставьте заявку и мы с вами свяжемся</div>
        <div className="div8">Наши контакты</div>
        <div className="group-2">
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
        <div className="group-2">
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
        <div className="group-2">
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
        <div className="group-2">
          <div className="group-1">
            <div className="rectangle-24" />
            <div className="div15">Полусухая стяжка</div>
            <div className="div16">
            Ровный пол под ламинат или плитку за 1 день. Без шума и грязи. Можно ходить уже через 12 часов.
            </div>
          </div>
        </div>
        <div className="ellipse-1" />
        <div className="div17">Замер</div>
        <div className="div18">
          Приезжаем,
          <br />
          меряем перепады высот
        </div>
        <div className="ellipse-12" />
        <div className="ellipse-2" />
        <div className="ellipse-3" />
        <div className="div19">Договор</div>
        <div className="div20">Монтаж</div>
        <div className="div21">Сдача</div>
        <div className="div22">Фиксируем цену и сроки</div>
        <div className="div23">
          Привозим технику и материалы, делаем стяжку за день
        </div>
        <div className="div24">
          Вы принимаете идеально ровный пол под финишное покрытие
        </div>
        <img className="group-10" src="/group-100.svg" alt="" />
        <img className="group-8" src="/group-80.svg" alt="" />
        <img className="group-9" src="/group-90.svg" alt="" />
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
        <div className="_13">Утром заходим на объект — вечером вы уже можете ходить по ровному полу. Никаких простоев в ремонте</div>
        <div className="div29">Используем собственное оборудование Alpha. Подаем смесь по шлангу до 30 этажа — никакой грязи в подъезде и лифте</div>
        <div className="div30">Приедем в день обращения. Проверим перепады высот и рассчитаем окончательную стоимость, которая не изменится в процессе</div>
        <div className="div31">Работа по договору с фиксированной ценой и гарантией. Соблюдаем СНиП, а минимальное содержание воды исключает риск протечек к соседям.</div>
        <div className="div32">Готовый пол за 1 день</div>
        <div className="div33">Немецкая технология</div>
        <div className="div34">Бесплатный выезд и точный расчёт</div>
        <div className="div35">Надежность</div>
        <div className="group-22">
          <div className="group-15">
            <img className="image-4" src={image40} alt="" />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img className="image-42" src={image41} alt="" />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img className="image-43" src={image42} alt="" />
          </div>
        </div>
        <div className="group-22">
          <div className="group-15">
            <img className="image-44" src={image43} alt="" />
          </div>
        </div>
        <form
          id="contact-form"
          className="contact-form"
          onSubmit={(e) => e.preventDefault()}
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
              />
            </div>
          </div>
        </form>
        <button
          type="submit"
          form="contact-form"
          className="rectangle-18 contact-form__submit cta-button cta-button--footer"
          disabled={!isContactConsentChecked}
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
        <img className="ellipse-6" src={ellipse60} alt="" />
        <img className="ellipse-9" src={ellipse90} alt="" />
        <img className="ellipse-7" src={ellipse70} alt="" />
        <div className="icon-house-ru">iconHouse.ru</div>
        <div className="icon-house-ru2">iconHouse.ru</div>
        <div className="icon-house-ru3">iconHouse.ru</div>
        <div className="div44">Артем Артемский</div>
        <div className="div45">Артем Артемский</div>
        <div className="div46">Артем Артемский</div>
        <div className="div47">
          Из огромного количества фирм а
          <br />
          Из огромного количества фирм аааа
          <br />
          Из огромного количества фирм ааы
          <br />
          Из огромного количества фирм ыаыа
          <br />
          Из огромныааого количества фирм
          <br />
          Из огромного количесаатва фирм
        </div>
        <div className="div48">
          Из огромного количества фирм а
          <br />
          Из огромного количества фирм аааа
          <br />
          Из огромного количества фирм ааы
          <br />
          Из огромного количества фирм ыаыа
          <br />
          Из огромныааого количества фирм
          <br />
          Из огромного количесаатва фирм
        </div>
        <div className="div49">
          Из огромного количества фирм а
          <br />
          Из огромного количества фирм аааа
          <br />
          Из огромного количества фирм ааы
          <br />
          Из огромного количества фирм ыаыа
          <br />
          Из огромныааого количества фирм
          <br />
          Из огромного количесаатва фирм
        </div>
        <img
          className="material-symbols-service-toolbox-rounded"
          src="/material-symbols-service-toolbox-rounded0.svg"
          alt=""
        />
        <img className="mdi-paper" src="/mdi-paper0.svg" alt="" />
        <div className="line-3" />
        <div className="line-4" />
        <div className="line-5" />
        <div className="line-6" />
        <div className="line-7" />
        <img className="ellipse-10" src={ellipseDecor} alt="" />
        <div className="div53">
          Реализуем проекты любой сложности: от небольших квартир до
          загородных домов и промышленных цехов.
        </div>
        <div className="div54">
          На фото - наши реальные объекты, где мы создали идеально ровное
          основание под чистовое покрытие.
        </div>
        <img className="image-10" src={image100} alt="" />
        <img className="image-11" src={image110} alt="" />
        <img className="image-14" src={image140} alt="" />
        <img className="image-15" src={image150} alt="" />
        <img className="image-12" src={image120} alt="" />
        <img className="image-13" src={image130} alt="" />
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
              onSubmit={(e) => {
                e.preventDefault()
                setIsLeadModalOpen(false)
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

              <label className="lead-modal__field">
                <span className="lead-modal__label">Электронный адрес</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={leadEmailValue}
                  onChange={(e) => setLeadEmailValue(e.target.value)}
                  placeholder="mail@mail.ru"
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
                disabled={!isLeadConsentChecked}
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
    </div>
  )
}
