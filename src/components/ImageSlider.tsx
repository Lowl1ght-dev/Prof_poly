import { useState } from 'react'

export type ImageSliderProps = {
  before: string
  after: string
  beforeTitle?: string
  beforeSubtitle?: string
  afterTitle?: string
  afterSubtitle?: string
  afterNote?: string
}

export function ImageSlider({
  before,
  after,
  beforeTitle = 'До',
  beforeSubtitle = 'Голые доски',
  afterTitle = 'После',
  afterSubtitle = 'Идеально ровный пол',
  afterNote = 'Объект в Истре 80м2, сделано за 8 часов',
}: ImageSliderProps) {
  const [position, setPosition] = useState(50)

  return (
    <div className="before-after-slider">
      <img
        src={after}
        alt=""
        className="before-after-slider__after"
      />

      {/* Текст «После» — над второй фоткой, под слоем «до» слева */}
      <div className="before-after-slider__after-caption">
        <div className="before-after-slider__after-title">{afterTitle}</div>
        <div className="before-after-slider__after-sub">{afterSubtitle}</div>
        <div className="before-after-slider__after-note">{afterNote}</div>
      </div>

      <div
        className="before-after-slider__before-clip"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={before}
          alt=""
          className="before-after-slider__before"
        />
        <div className="before-after-slider__before-caption">
          <div className="before-after-slider__before-title">{beforeTitle}</div>
          <div className="before-after-slider__before-sub">{beforeSubtitle}</div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="before-after-slider__range"
        aria-label="Сравнение до и после, перетащите ползунок"
      />

      <div
        className="before-after-slider__divider"
        style={{ left: `${position}%` }}
        aria-hidden
      >
        <span className="before-after-slider__grip" />
      </div>
    </div>
  )
}
