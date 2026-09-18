import type { Choice } from './game'

type Placement = { x: number; y: number; width: number; angle: number }
const piece = (x: number, y: number, width: number, angle = 0): Placement => ({ x, y, width, angle })

// Coordinates describe the edible oval, not the entire cup. A selection is a
// serving: the meat artwork already contains two slices, the egg one half.
const singleServings: Record<string, Placement[]> = {
  egg: [piece(34, 48, 46, -12), piece(65, 51, 46, 14)],
  spam: [piece(32, 43, 43, -15), piece(54, 43, 43, 7), piece(64, 65, 43, 18)],
  bokchoy: [piece(34, 46, 48, -18), piece(64, 52, 48, 20)],
  fishcake: [piece(33, 39, 31, -15), piece(56, 36, 31, 9), piece(70, 57, 31, 18), piece(46, 65, 31, -7)],
  cheese: [piece(40, 44, 72, -10), piece(61, 57, 65, 12)],
  scallion: [piece(29, 39, 26), piece(51, 32, 26, 30), piece(73, 43, 26, -18), piece(38, 66, 26, 17), piece(62, 65, 26, -10)],
}

export function toppingLayout(items: Choice[]) {
  // A fixed food order keeps the arrangement independent of selection order.
  const order = ['cheese', 'bokchoy', 'spam', 'fishcake', 'egg', 'scallion']
  const sorted = [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  const solids = sorted.filter(item => item.id !== 'scallion')
  return sorted.flatMap(item => {
    let placements: Placement[]
    if (items.length === 1) {
      placements = singleServings[item.id] ?? [piece(50, 50, 60)]
    } else if (item.id === 'scallion') {
      placements = [piece(25, 49, 19, -8), piece(50, 30, 19, 25), piece(72, 58, 19, 8)]
    } else {
      const index = solids.indexOf(item)
      const anchors = solids.length === 1
        ? [piece(49, 52, 64)]
        : solids.length === 2
          ? [piece(33, 45, 51, -12), piece(66, 56, 51, 12)]
          : [piece(28, 43, 43, -16), piece(51, 65, 43, 5), piece(72, 40, 40, 15)]
      const anchor = anchors[index]
      placements = item.id === 'fishcake'
        ? [piece(anchor.x - 6, anchor.y - 10, anchor.width * .7, -12), piece(anchor.x + 5, anchor.y + 10, anchor.width * .7, 15)]
        : item.id === 'cheese'
          ? [piece(anchor.x + 5, anchor.y, anchor.width * 1.35, anchor.angle)]
          : [anchor]
    }
    return placements.map((placement, index) => ({ ...placement, item, key: `${item.id}-${index}` }))
  })
}
