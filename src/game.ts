export type Stage =
  | 'home'
  | 'broth'
  | 'noodle'
  | 'toppings'
  | 'prepare'
  | 'waiting'
  | 'opening'
  | 'eating'
  | 'soup'
  | 'finished'
  | 'sleeping'

export type Choice = {
  id: string
  name: string
  note: string
  emoji: string
  image?: string
  tint?: string
}

export const broths: Choice[] = [
  { id: 'beef', name: '红烧牛肉', note: '香浓、暖乎乎', emoji: '🥩', tint: '#c85735' },
  { id: 'tonkotsu', name: '豚骨', note: '奶白、醇厚', emoji: '🍥', tint: '#e8bd78' },
  { id: 'mala', name: '麻辣', note: '深夜来点刺激', emoji: '🌶️', tint: '#a8262a' },
]

export const noodles: Choice[] = [
  { id: 'fried', name: '油炸方便面', note: '熟悉的卷卷面', emoji: '🍜', image: '/assets/ramen/noodles-fried-v1.png' },
  { id: 'udon', name: '乌冬', note: '粗粗软软', emoji: '🥢', image: '/assets/ramen/noodles-udon-v1.png' },
  { id: 'spinach', name: '菠菜面', note: '清爽的绿色面', emoji: '🌿', image: '/assets/ramen/noodles-spinach-v1.png' },
]

export const toppings: Choice[] = [
  { id: 'egg', name: '溏心蛋', note: '一整颗才满足', emoji: '🥚', image: '/assets/toppings/topping-soft-egg.png' },
  { id: 'spam', name: '午餐肉', note: '香香两大块', emoji: '🥩', image: '/assets/toppings/topping-luncheon-meat.png' },
  { id: 'bokchoy', name: '青菜', note: '夜宵也要有菜', emoji: '🥬', image: '/assets/toppings/topping-bok-choy.png' },
  { id: 'fishcake', name: '鱼板', note: '可爱的粉色旋涡', emoji: '🍥', image: '/assets/toppings/topping-fish-cake.png' },
  { id: 'scallion', name: '葱花', note: '撒一点更香', emoji: '🌱', image: '/assets/toppings/topping-scallions.png' },
  { id: 'cheese', name: '芝士', note: '融进热汤里', emoji: '🧀', image: '/assets/toppings/topping-cheese.png' },
]

export const prepSteps = [
  ['打开杯面', '先把杯盖轻轻揭开', 'ramen-lid-half-open.png'],
  ['放入面饼', '咚，一整块刚刚好', 'ramen-noodles-base-full.png'],
  ['撒入调料', '今晚是你选的味道', 'ramen-noodles-base-full.png'],
  ['放入配菜', '把喜欢的都铺上去', 'ramen-noodles-base-full.png'],
  ['倒入热水', '热气慢慢冒出来了', 'ramen-noodles-base-full.png'],
  ['盖好杯盖', '让它安静泡一会儿', 'ramen-lid-closed.png'],
] as const

export const asset = (folder: string, file: string) => `/assets/${folder}/${file}`
