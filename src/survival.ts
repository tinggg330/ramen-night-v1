import { advanceEatingState } from './eatingSystem'
import { survivalConfig as config } from './survivalConfig'
export type HitResult = 'normal' | 'perfect' | 'miss'
export type GameStatus = 'playing' | 'caught' | 'success'
export function sliderPosition(elapsedMs: number) {
  const phase = (elapsedMs / config.slider.singlePassMs) % 2
  return phase <= 1 ? phase : 2 - phase
}
export function judgeHit(position: number): HitResult {
  const distance = Math.abs(position - .5)
  if (distance <= config.slider.perfectZoneWidth / 2 + Number.EPSILON) return 'perfect'
  if (distance <= config.slider.safeZoneWidth / 2 + Number.EPSILON) return 'normal'
  return 'miss'
}
export function resolveHit(progress: number, alert: number, hit: HitResult) {
  const nextProgress = advanceEatingState(progress, config[hit].progress)
  const nextAlert = Math.max(0, alert + config[hit].alertDelta)
  const status: GameStatus = nextAlert >= config.maxAlert ? 'caught' : nextProgress >= config.maxProgress ? 'success' : 'playing'
  return { progress: nextProgress, alert: nextAlert, status }
}
export function watcherState(alert: number) {
  const t = config.alertThresholds
  return alert >= t.caught ? 'caught' : alert >= t.danger ? 'danger' : alert >= t.halfAwake ? 'halfAwake' : alert >= t.stirring ? 'stirring' : 'sleeping'
}
export function normalAudio(progress: number) {
  return progress < 7 ? `/assets/audio/slurp/slurp-short-0${progress % 2 + 1}.mp3`
    : progress >= 9 ? '/assets/audio/drink/drink-final.mp3'
    : `/assets/audio/drink/drink-small-0${(progress - 7) % 2 + 1}.mp3`
}
