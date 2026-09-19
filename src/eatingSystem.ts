// One progress source for the existing seven bites and three sips.
export const MAX_PROGRESS = 10
export function advanceEatingState(progress: number, amount: number) {
  return Math.min(MAX_PROGRESS, Math.max(0, progress + amount))
}
export function eatingView(progress: number) {
  return { bites: Math.min(progress, 7), sips: Math.max(0, progress - 7) }
}
