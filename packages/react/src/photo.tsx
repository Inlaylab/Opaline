'use client'
import { useEffect, useRef, useState, type JSX } from 'react'

const STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
} as const

/** The photo stays hidden until it loads; a failed load leaves the generated avatar. */
export function Photo({ src }: { src: string }): JSX.Element | null {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    // With SSR the image can finish before hydration, so its load event is missed.
    const img = ref.current
    if (img?.complete) setState(img.naturalWidth > 0 ? 'loaded' : 'error')
  }, [])
  if (state === 'error') return null
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      style={STYLE}
      hidden={state !== 'loaded'}
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
    />
  )
}
