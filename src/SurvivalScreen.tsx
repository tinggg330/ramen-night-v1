import { useEffect, useRef, useState, type ReactNode } from 'react'
import { survivalConfig as config } from './survivalConfig'
import { judgeHit, normalAudio, resolveHit, sliderPosition, watcherState, type GameStatus, type HitResult } from './survival'

const labels = { sleeping: '熟睡', stirring: '有动静', halfAwake: '半醒', danger: '高危', caught: '惊醒' }
const symbols = { sleeping: 'zzz', stirring: 'motion', halfAwake: 'question', danger: 'alert', caught: 'alert' }
export function SurvivalScreen({ progress, advance, renderFood, playEffect, stopEffect, success, back }: {
  progress: number; advance: (value: number) => void; renderFood: (value: number) => ReactNode;
  playEffect: (source: string, volume?: number) => void; stopEffect: () => void; success: () => void; back: () => void
}) {
  const [alert, setAlert] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [hit, setHit] = useState<HitResult | null>(null)
  const cursor = useRef<HTMLSpanElement>(null)
  const position = useRef(0)
  const elapsed = useRef(0)
  const locked = useRef(false)
  const snapshot = useRef({ progress, alert, status })
  const timers = useRef<number[]>([])
  const state = watcherState(alert)
  // Read the same position last painted on screen, not a stale React closure.
  useEffect(() => {
    if (status !== 'playing') return
    let frame = 0, previous = performance.now()
    const tick = (now: number) => {
      if (!document.hidden) elapsed.current += now - previous
      previous = now
      position.current = sliderPosition(elapsed.current)
      if (cursor.current) cursor.current.style.left = `${position.current * 100}%`
      frame = requestAnimationFrame(tick)
    }
    const resume = () => { previous = performance.now() }
    document.addEventListener('visibilitychange', resume)
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', resume) }
  }, [status])
  useEffect(() => {
    const pending = timers.current
    Object.keys(labels).forEach(name => { const image = new Image(); image.src = `/assets/watcher/${name}.png` })
    return () => pending.forEach(window.clearTimeout)
  }, [])
  const later = (callback: () => void, delay: number) => { timers.current.push(window.setTimeout(callback, delay)) }
  const act = () => {
    if (locked.current || snapshot.current.status !== 'playing') return
    locked.current = true
    const result = judgeHit(position.current)
    const previous = snapshot.current
    const next = resolveHit(previous.progress, previous.alert, result)
    snapshot.current = next
    advance(next.progress); setAlert(next.alert); setStatus(next.status); setHit(result)
    stopEffect()
    const source = result === 'normal' ? normalAudio(previous.progress) : config.audio[result]
    if (source) playEffect(source)
    if (next.status === 'caught' && config.audio.caught) {
      later(() => playEffect(config.audio.caught!), result === 'miss' && source ? config.caughtDelayMs : 0)
    }
    later(() => {
      setHit(null)
      if (next.status === 'success') success()
      else if (next.status === 'playing') locked.current = false
    }, config.feedbackMs[result])
  }
  const retry = () => {
    timers.current.forEach(window.clearTimeout); timers.current.length = 0
    stopEffect(); snapshot.current = { progress: 0, alert: 0, status: 'playing' }
    locked.current = false; elapsed.current = 0; position.current = 0
    advance(0); setAlert(0); setStatus('playing'); setHit(null)
  }
  return <section className={`panel survival-screen hit-${hit ?? 'none'} status-${status}`} aria-label="偷吃游戏区域" onPointerDown={event => {
    if (event.isPrimary && event.button === 0 && !(event.target as HTMLElement).closest('button, a, input, [role="dialog"]')) act()
  }} onClick={event => {
    // Keyboard/assistive activation only. Pointer releases must never settle a second hit.
    if (event.detail === 0 && !(event.target as HTMLElement).closest('button, a, input, [role="dialog"]')) act()
  }}>
    <h1>{status === 'caught' ? '被发现了！' : '嘘，偷偷吃一口'}</h1>
    <div className="watcher-row">
      <div className="watcher-art"><img className="watcher-cat" src={`/assets/watcher/${state}.png`} alt={`自律小猫：${labels[state]}`} /><img className="watcher-symbol" src={`/assets/watcher/${symbols[state]}.png`} alt="" /></div>
      <div className={`alert-display alert-${state}`}><div className="alert-label"><span>警觉度</span><span>{labels[state]}</span></div><div className="alert-track" role="img" aria-label={`警觉状态：${labels[state]}`}><span style={{ width: `${Math.min(100, alert / config.maxAlert * 100)}%` }} /></div></div>
    </div>
    <div className="survival-food-slot"><div className="survival-food ramen-stage">{renderFood(progress)}{hit === 'miss' && progress >= 7 && <img className="cup-chopsticks" src="/assets/ramen/chopsticks.png" alt="筷子碰到杯沿" />}<span className="hit-feedback" aria-live="polite">{hit === 'perfect' ? 'PERFECT!' : hit === 'miss' ? '哎呀，碰到杯子了' : hit === 'normal' ? '稳稳吃一口' : '\u00a0'}</span></div></div>
    <div className="survival-controls">
      <div className="timing-rail" aria-label="在安全区域点击屏幕"><div className="safe-zone" style={{ width: `${config.slider.safeZoneWidth * 100}%` }}><span>SAFE</span><span>SAFE</span></div><div className="perfect-zone" style={{ width: `${config.slider.perfectZoneWidth * 100}%` }} /><span className="slider-cursor" ref={cursor} /><span className="perfect-label">PERFECT</span></div>
      {status === 'caught' ? <div className="caught-actions"><button className="primary-cta" onClick={retry}>再试一次</button><button className="secondary-cta" onClick={back}>返回</button></div> : <><p className="survival-hint">看准安全区，点击画面吃一口</p><button className="primary-cta survival-tap" onPointerDown={event => {
        if (event.isPrimary && event.button === 0) act()
      }} onClick={event => { if (event.detail === 0) act() }} disabled={status !== 'playing'}>偷偷吃一口</button></>}
    </div>
  </section>
}
