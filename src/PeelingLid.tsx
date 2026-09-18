import { useEffect, useRef } from 'react'
import { asset } from './game'

/** Bend the existing foil artwork around a moving crease, keeping the sealed part flat. */
export function PeelingLid({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const completeRef = useRef(onComplete)
  useEffect(() => { completeRef.current = onComplete }, [onComplete])
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    let cancelled = false
    const image = new Image()
    const finish = () => { if (!cancelled) completeRef.current?.() }
    image.onerror = finish
    image.onload = () => {
      if (cancelled) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return }
      const start = performance.now()
      const w = 600, h = 270, ox = 600, oy = 540
      const draw = (now: number) => {
        const t = Math.min(1, (now - start) / 1800)
        const peel = Math.min(1, t / .79)
        const eased = peel * peel * (3 - 2 * peel)
        const crease = w * (1 - eased)
        const release = Math.max(0, (t - .79) / .21)
        const radius = 80
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1 - release * release
        // Each narrow strip follows the same continuous cylindrical fold.
        // Right-to-left source sampling places the original left pull-tab on the right.
        const project = (x: number) => {
          const distance = Math.max(0, x - crease)
          const angle = Math.min(Math.PI * .92, distance / radius)
          const tail = Math.max(0, distance - Math.PI * .92 * radius)
          return {
            x: distance === 0 ? x : crease + radius * Math.sin(angle) - tail * .94,
            y: -radius * (1 - Math.cos(angle)) - tail * .24,
          }
        }
        for (let x = 0; x < w; x += 2) {
          const a = project(x), b = project(x + 2)
          const dx = b.x - a.x
          ctx.save()
          ctx.translate(ox + a.x - release * 190, oy + a.y - release * 210)
          ctx.transform(dx / 2, (b.y - a.y) / 2, 0, 1, 0, 0)
          ctx.translate(2, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(image, (1 - (x + 2) / w) * image.width, 0, image.width * 2 / w, image.height, 0, 0, 2.3, h)
          ctx.restore()
        }
        if (t < 1) frame = requestAnimationFrame(draw)
        else finish()
      }
      frame = requestAnimationFrame(draw)
    }
    image.src = asset('ramen', 'ramen-lid-closed.png')
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [])
  return <span className="cup-lid-closed lid-curling"><canvas ref={canvasRef} width={1800} height={1080} aria-hidden="true" /></span>
}
