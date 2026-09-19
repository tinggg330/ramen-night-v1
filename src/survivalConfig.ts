import { MAX_PROGRESS } from './eatingSystem'
export const survivalConfig = {
  maxProgress: MAX_PROGRESS,
  maxAlert: 100,
  normal: { progress: 1, alertDelta: -12 },
  perfect: { progress: 3, alertDelta: 34 },
  miss: { progress: 0, alertDelta: 45 },
  slider: { singlePassMs: 1800, safeZoneWidth: .40, perfectZoneWidth: .06 },
  feedbackMs: { normal: 450, perfect: 650, miss: 450 },
  caughtDelayMs: 180,
  alertThresholds: { sleeping: 0, stirring: 34, halfAwake: 60, danger: 80, caught: 100 },
  audio: {
    perfect: '/assets/audio/slurp/slurp-long.mp3',
    // Supply a public asset URL here when the user's recordings arrive.
    miss: null as string | null,
    caught: null as string | null,
  },
}
