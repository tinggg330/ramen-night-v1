export const WATER_DURATION = 2600

export function WaterPour() {
  return <svg className="water-pour" viewBox="0 0 365 350" role="img" aria-label="水壶倾斜，热水流入杯中">
    <defs>
      <linearGradient id="kettle-body" x2="0.9" y2="1"><stop stopColor="#fff4cf"/><stop offset=".5" stopColor="#e3b779"/><stop offset="1" stopColor="#a66c48"/></linearGradient>
      <linearGradient id="pour-water"><stop stopColor="#e8fbff" stopOpacity=".9"/><stop offset="1" stopColor="#9cd8ee" stopOpacity=".65"/></linearGradient>
    </defs>
    <g className="water-stream" fill="none" strokeLinecap="round">
      <path d="M258 0 Q238 30 228 76" stroke="url(#pour-water)" strokeWidth="9"/>
      <path d="M259 1 Q240 31 230 73" stroke="#fffbe6" strokeWidth="2"/>
    </g>
    <g className="water-ripples" fill="none" stroke="#ffefba" strokeWidth="2">
      <ellipse cx="228" cy="79" rx="17" ry="5"/><ellipse cx="228" cy="79" rx="29" ry="9" opacity=".55"/>
    </g>
    <g className="pour-kettle" stroke="#694536" strokeWidth="3" strokeLinejoin="round">
      <path d="M324 -24 C357 -38 364 26 334 28" fill="none" stroke="#65493e" strokeWidth="10"/>
      <path d="M284 -15 L258 0 Q272 7 284 12 L292 1 Z" fill="#f0d9ad"/>
      <path d="M283 -30 Q280 -13 276 10 Q272 35 292 39 L322 39 Q343 36 338 12 L328 -30 Z" fill="url(#kettle-body)"/>
      <path d="M283 -30 Q304 -40 328 -30 L330 -24 Q305 -30 281 -23 Z" fill="#f9deb0"/>
      <path d="M299 -36 L299 -42 Q305 -46 312 -42 L313 -35" fill="#795344"/>
      <path d="M287 -10 Q283 14 291 22" fill="none" stroke="#fff5d5" strokeWidth="5" strokeLinecap="round"/>
      <path d="M288 36 L326 36" stroke="#997154" strokeWidth="4"/>

    </g>
  </svg>
}
