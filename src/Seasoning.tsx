import type { CSSProperties } from 'react'
import type { Choice } from './game'

export const SEASONING_DURATION = 2300
const palettes: Record<string, { packet: string; label: string; grains: string[] }> = {
  beef: { packet: '#bc5033', label: '红烧', grains: ['#99441e', '#cf7533', '#edd39b', '#60722a'] },
  tonkotsu: { packet: '#edd2a1', label: '豚骨', grains: ['#fff0c6', '#e2c394', '#b29365', '#637b32'] },
  mala: { packet: '#a92e2a', label: '麻辣', grains: ['#a62b15', '#e84f22', '#713a20', '#d79930'] },
}

// Stable landing positions avoid particles jumping when the next step renders.
const grains = Array.from({ length: 52 }, (_, index) => ({
  x: 102 + ((index * 37) % 95),
  y: 53 + ((index * 17) % 42),
  radius: 1.2 + (index % 3) * .45,
  delay: .45 + (index % 13) * .085,
}))

export function SeasoningGrains({ broth, falling = false }: { broth: Choice; falling?: boolean }) {
  const palette = palettes[broth.id] ?? palettes.beef
  return <g>{grains.map((grain, index) => <circle key={index}
    className={falling ? 'seasoning-grain falling' : 'seasoning-grain'}
    cx={grain.x} cy={grain.y} r={grain.radius} fill={palette.grains[index % 4]}
    style={{ '--grain-x': `${186 - grain.x}px`, '--grain-y': `${24 - grain.y}px`, animationDelay: `${grain.delay}s` } as CSSProperties}
  />)}</g>
}

export function SeasoningPour({ broth }: { broth: Choice }) {
  const palette = palettes[broth.id] ?? palettes.beef
  return <svg className="seasoning-pour" viewBox="0 0 300 288" role="img" aria-label={`${broth.name}调料包倾倒，颗粒落入杯中`}>
    <SeasoningGrains broth={broth} falling />
    <g className="seasoning-packet">
      <path d="M185 -43 L241 -43 L244 20 L188 25 L182 16 Z" fill={palette.packet} stroke="#633a29" strokeWidth="2.5" />
      <path d="M187 -36 H239 M188 -31 H240 M189 15 L241 10" fill="none" stroke="#ffe6af" strokeWidth="2" opacity=".65" />
      <path d="M183 16 L193 19 L188 25 Z" fill="#f5dbb1" stroke="#633a29" strokeWidth="1.5" />
      <rect x="193" y="-25" width="41" height="32" rx="7" fill="#fff0cb" />
      <text x="213" y="-6" textAnchor="middle" fill="#6b3927" fontSize="13" fontWeight="800">{palette.label}</text>
      <text x="215" y="35" textAnchor="middle" fill="#fff0cb" fontSize="9">调料包</text>
    </g>
  </svg>
}
