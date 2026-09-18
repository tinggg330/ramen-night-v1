export const NOODLE_LEVELS = [100, 70, 40, 10] as const
export type NoodleLevel = typeof NOODLE_LEVELS[number]

export const cookedNoodleImage = (id: string, level: NoodleLevel) =>
  `/assets/ramen/cooked-${id}-${level}.png`

export function noodleLevelForBites(bites: number): NoodleLevel {
  return bites < 2 ? 100 : bites < 4 ? 70 : bites < 6 ? 40 : 10
}
