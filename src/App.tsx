import { useEffect, useRef, useState } from 'react'
import './App.css'
import { WaterPour, WATER_DURATION } from './WaterPour'
import { PeelingLid } from './PeelingLid'
import { cookedNoodleImage, noodleLevelForBites, NOODLE_LEVELS, type NoodleLevel } from './noodleFrames'
import { SeasoningGrains, SeasoningPour, SEASONING_DURATION } from './Seasoning'
import { toppingLayout } from './toppingLayout'
import { asset, broths, noodles, prepSteps, toppings, type Choice, type Stage } from './game'

const STORAGE_SOUND = 'ramen-night-sound-enabled'
const STORAGE_NIGHT = 'ramen-night-goodnight-mode'
const SLURP_SOUNDS = [
  '/assets/audio/slurp/slurp-short-01.mp3',
  '/assets/audio/slurp/slurp-short-02.mp3',
]
const DRINK_SOUNDS = [
  '/assets/audio/drink/drink-small-01.mp3',
  '/assets/audio/drink/drink-small-02.mp3',
]
const soupCupImage = (id: string, level: 'mid' | 'last') => `/assets/ramen/cup-${level}-soup-${id}${level === 'last' && id === 'beef' ? '-v3' : level === 'mid' && id !== 'tonkotsu' ? '-v2' : ''}.png`

type InteractionSound = 'lid-peel' | 'noodle-drop' | 'seasoning-pour' | 'water-pour'
const FINAL_DRINK_SOUND = '/assets/audio/drink/drink-final.mp3'

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
}

function VolumeIcon({ muted = false }: { muted?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h4l5 4V6l-5 4H5Z" /><path d={muted ? 'm18 9 4 6M22 9l-4 6' : 'M17 9c1.5 1.6 1.5 4.4 0 6M19.5 6.5c3.6 3.2 3.6 7.8 0 11'} /></svg>
}

function App() {
  const [stage, setStage] = useState<Stage>(() => new URLSearchParams(location.search).get('preview') === 'sleep' ? 'sleeping' : 'home')
  const [broth, setBroth] = useState(broths[0])
  const [noodle, setNoodle] = useState(noodles[0])
  const [selectedToppings, setSelectedToppings] = useState<Choice[]>([])
  const [prepIndex, setPrepIndex] = useState(0)
  const [restoringPrep, setRestoringPrep] = useState(false)
  const transitionRef = useRef<number | undefined>(undefined)
  const [seconds, setSeconds] = useState(20)
  const [bites, setBites] = useState(0)
  const [sips, setSips] = useState(0)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(STORAGE_SOUND) !== 'false')
  const [nightMode, setNightMode] = useState(() => localStorage.getItem(STORAGE_NIGHT) === 'true')
  const [modal, setModal] = useState<'settings' | 'how' | null>(null)
  const musicRef = useRef<HTMLAudioElement>(null)
  const roomRef = useRef<HTMLAudioElement>(null)
  const effectRef = useRef<HTMLAudioElement | null>(null)
  const snoreFirstRef = useRef<HTMLAudioElement>(null)
  const snoreSecondRef = useRef<HTMLAudioElement>(null)
  const effectCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    for (const id of ['beef', 'tonkotsu', 'mala']) {
      for (const level of ['mid', 'last'] as const) {
        const soup = new Image()
        soup.src = soupCupImage(id, level)
      }
    }
    // Load all eating states before play so the first change never flashes blank.
    NOODLE_LEVELS.forEach(level => {
      const image = new Image()
      image.src = cookedNoodleImage(noodle.id, level)
    })
  }, [noodle.id])

  useEffect(() => {
    localStorage.setItem(STORAGE_SOUND, String(soundOn))
    const music = musicRef.current
    const room = roomRef.current
    if (music) music.volume = 0.3
    if (room) room.volume = 0.2
    if (stage === 'sleeping') {
      effectCleanup.current?.()
      effectRef.current?.pause()
      const started = performance.now()
      let frame = 0
      const fade = () => {
        const factor = Math.max(0, 1 - (performance.now() - started) / 1800)
        if (music) music.volume = .3 * factor
        if (room) room.volume = .2 * factor
        if (factor > 0) frame = requestAnimationFrame(fade)
        else { music?.pause(); room?.pause() }
      }
      fade()
      return () => cancelAnimationFrame(frame)
    }
    if (soundOn && stage !== 'home') {
      if (music) void music.play().catch(() => undefined)
      if (room) void room.play().catch(() => undefined)
    } else {
      music?.pause()
      room?.pause()
    }
    if (!soundOn || stage === 'home') { effectCleanup.current?.(); effectRef.current?.pause() }
  }, [soundOn, stage])

  useEffect(() => {
    const first = snoreFirstRef.current
    const second = snoreSecondRef.current
    if (!first || !second) return
    first.volume = second.volume = .32
    if (stage !== 'sleeping' || !soundOn) {
      first.pause(); second.pause()
      first.currentTime = second.currentTime = 0
      return
    }
    // Keep both files preloaded; alternate only after each recording finishes.
    const play = (audio: HTMLAudioElement) => {
      audio.currentTime = 0
      void audio.play().catch(() => undefined)
    }
    const next = () => play(second)
    const repeat = () => play(first)
    const unlock = () => {
      if (first.paused && second.paused) void first.play().catch(() => undefined)
    }
    first.addEventListener('ended', next)
    second.addEventListener('ended', repeat)
    void first.play().catch(() => undefined)
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      first.removeEventListener('ended', next)
      second.removeEventListener('ended', repeat)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      first.pause(); second.pause()
      first.currentTime = second.currentTime = 0
    }
  }, [stage, soundOn])

  useEffect(() => {
    if (stage !== 'waiting') return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (stage !== 'waiting' || seconds !== 0) return
    const transition = window.setTimeout(() => setStage('opening'), 120)
    return () => window.clearTimeout(transition)
  }, [seconds, stage])

  const start = () => {
    window.clearTimeout(transitionRef.current)
    setPrepIndex(0); setRestoringPrep(false); setSeconds(20); setBites(0); setSips(0)
    setStage('broth')
    if (soundOn) {
      void musicRef.current?.play().catch(() => undefined)
      void roomRef.current?.play().catch(() => undefined)
    }
  }

  const reset = () => {
    window.clearTimeout(transitionRef.current)
    setRestoringPrep(false)
    setStage('home')
    setSelectedToppings([])
    setPrepIndex(0)
    setSeconds(20)
    setBites(0)
    setSips(0)
  }

  const goBack = () => {
    window.clearTimeout(transitionRef.current)
    effectCleanup.current?.()
    effectRef.current?.pause()
    if (stage === 'prepare') {
      if (prepIndex > 0) { setRestoringPrep(true); setPrepIndex(value => value === 4 && selectedToppings.length === 0 ? 2 : value - 1) }
      else setStage('toppings')
    } else if (stage === 'waiting') {
      setSeconds(20); setPrepIndex(5); setRestoringPrep(true); setStage('prepare')
    } else if (stage === 'opening') {
      setSeconds(20); setStage('waiting')
    } else if (stage === 'eating') {
      if (bites > 0) setBites(value => value - 1)
      else setStage('opening')
    } else if (stage === 'soup') {
      if (sips > 0) setSips(value => value - 1)
      else { setBites(6); setStage('eating') }
    } else if (stage === 'finished') {
      setSips(2); setStage('soup')
    } else {
      const previous: Partial<Record<Stage, Stage>> = { broth: 'home', noodle: 'broth', toppings: 'noodle' }
      setStage(previous[stage] ?? 'home')
    }
  }

  const toggleTopping = (choice: Choice) => {
    setSelectedToppings((current) => current.some((item) => item.id === choice.id)
      ? current.filter((item) => item.id !== choice.id)
      : current.length < 3 ? [...current, choice] : current)
  }

  const playEffect = (source: string, volume = 0.62) => {
    if (!soundOn) return
    effectCleanup.current?.()
    effectRef.current?.pause()
    const effect = effectRef.current
    if (!effect) return
    effect.src = source
    effect.loop = false
    effect.volume = volume
    effectRef.current = effect
    void effect.play().catch(() => undefined)
  }

  const playInteraction = (name: InteractionSound) => {
    if (!soundOn) return
    effectCleanup.current?.()
    effectRef.current?.pause()
    const effect = effectRef.current
    if (!effect) return
    effect.src = `/assets/audio/interaction/${name}.mp3`
    effectRef.current = effect
    effect.volume = name === 'noodle-drop' ? .42 : .36
    const delay = name === 'noodle-drop' ? 500 : name === 'water-pour' ? 440 : name === 'seasoning-pour' ? 200 : 0
    const duration = name === 'seasoning-pour' ? 2000 : name === 'water-pour' ? 1650 : 950
    effect.loop = name === 'water-pour'
    let fadeTimer = 0
    let stopTimer = 0
    let fadeFrame = 0
    const startTimer = window.setTimeout(() => {
      void effect.play().catch(() => undefined)
      fadeTimer = window.setTimeout(() => {
        const start = performance.now(), volume = effect.volume
        const fade = () => {
          effect.volume = volume * Math.max(0, 1 - (performance.now() - start) / 120)
          if (effect.volume > 0) fadeFrame = requestAnimationFrame(fade)
        }
        fadeFrame = requestAnimationFrame(fade)
      }, duration - 120)
      stopTimer = window.setTimeout(() => effect.pause(), duration)
    }, delay)
    effectCleanup.current = () => {
      window.clearTimeout(startTimer); window.clearTimeout(fadeTimer); window.clearTimeout(stopTimer)
      cancelAnimationFrame(fadeFrame); effect.pause()
    }
  }

  const eat = () => {
    playEffect(SLURP_SOUNDS[bites % SLURP_SOUNDS.length])
    if (bites >= 6) {
      setBites(7)
      transitionRef.current = window.setTimeout(() => setStage('soup'), 420)
    } else setBites((value) => value + 1)
  }

  const drink = () => {
    playEffect(sips >= 2 ? FINAL_DRINK_SOUND : DRINK_SOUNDS[sips % DRINK_SOUNDS.length], sips >= 2 ? 0.70 : 0.58)
    if (sips >= 2) {
      setSips(3)
      transitionRef.current = window.setTimeout(() => setStage('finished'), 420)
    } else setSips((value) => value + 1)
  }

  return (
    <main className={`app ${nightMode ? 'goodnight' : ''} ${stage === 'sleeping' ? 'is-sleeping' : ''}`}>
      <audio ref={snoreFirstRef} src="/assets/audio/snoring/snore-01.mp3" preload="auto" data-audio="snore-first" />
      <audio ref={snoreSecondRef} src="/assets/audio/snoring/snore-02.mp3" preload="auto" data-audio="snore-second" />
      <audio ref={effectRef} preload="auto" data-audio="interaction-effect" />
      <audio ref={musicRef} src="/assets/audio/ambient/bedroom-ambient-loop-01.m4a" loop preload="auto" data-audio="background-music" />
      <audio ref={roomRef} src="/assets/audio/ambient/bedroom-ambient-loop-02.mp3" loop preload="auto" data-audio="room-ambience" />
      <div className="phone-shell">
        <div className="scene-bg" />
        {stage === 'sleeping' ? <SleepScreen back={reset} /> : stage === 'home' ? (
          <HomeScreen start={start} soundOn={soundOn} setSoundOn={setSoundOn} nightMode={nightMode} setNightMode={setNightMode} setModal={setModal} />
        ) : (
          <>
            <header className="topbar">
              <button className="icon-button" onClick={goBack} aria-label="返回"><BackIcon /></button>
              <div className="step-chip">今晚这碗 · {stageLabel(stage)}</div>
              <button className="icon-button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? '关闭声音' : '打开声音'}><VolumeIcon muted={!soundOn} /></button>
            </header>
            {stage === 'broth' && <ChoiceScreen eyebrow="第一步" title="今晚想喝什么汤？" choices={broths} selected={[broth]} onSelect={setBroth} onNext={() => setStage('noodle')} />}
            {stage === 'noodle' && <ChoiceScreen eyebrow="第二步" title="选一份喜欢的面" choices={noodles} selected={[noodle]} onSelect={setNoodle} onNext={() => setStage('toppings')} />}
            {stage === 'toppings' && <ChoiceScreen eyebrow="第三步 · 最多 3 种" title="再加点好吃的吧" choices={toppings} selected={selectedToppings} onSelect={toggleTopping} onNext={() => { setPrepIndex(0); setRestoringPrep(false); setStage('prepare') }} grid />}
            {stage === 'prepare' && <PrepareScreen key={`${prepIndex}-${restoringPrep}`} restored={restoringPrep} index={prepIndex} broth={broth} noodle={noodle} selected={selectedToppings} playInteraction={playInteraction} advance={() => { setRestoringPrep(false); if (prepIndex === 5) setSeconds(20); const nextIndex = prepIndex === 2 && selectedToppings.length === 0 ? 4 : prepIndex + 1; if (nextIndex === 4) playInteraction('water-pour'); return prepIndex < prepSteps.length - 1 ? setPrepIndex(nextIndex) : setStage('waiting') }} />}
            {stage === 'waiting' && <WaitingScreen seconds={seconds} hurry={() => setSeconds((value) => Math.max(0, value - 3))} />}
            {stage === 'opening' && <OpeningScreen broth={broth} noodle={noodle} selected={selectedToppings} playInteraction={playInteraction} open={() => setStage('eating')} />}
            {stage === 'eating' && <EatingScreen bites={bites} selected={selectedToppings} broth={broth} noodle={noodle} eat={eat} />}
            {stage === 'soup' && <SoupScreen broth={broth} sips={sips} drink={drink} />}
            {stage === 'finished' && <FinishedScreen again={reset} night={() => { if (soundOn && snoreFirstRef.current) { snoreFirstRef.current.volume = .32; void snoreFirstRef.current.play().catch(() => undefined) }; setStage('sleeping') }} />}
          </>
        )}
        <div className="vignette" />
        {modal && <Modal type={modal} close={() => setModal(null)} soundOn={soundOn} setSoundOn={setSoundOn} />}
      </div>
    </main>
  )
}

function HomeScreen({ start, soundOn, setSoundOn, nightMode, setNightMode, setModal }: {
  start: () => void; soundOn: boolean; setSoundOn: (value: boolean) => void; nightMode: boolean; setNightMode: (value: boolean) => void; setModal: (value: 'settings' | 'how') => void
}) {
  const toggleNight = () => {
    const next = !nightMode
    setNightMode(next)
    localStorage.setItem(STORAGE_NIGHT, String(next))
  }
  return <section className="home-screen">
    <button className="sound-float" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? '关闭声音' : '打开声音'}><VolumeIcon muted={!soundOn} /></button>
    <div className="home-copy">
      <img className="title-sticker" src={asset('text', 'title-still-awake.png')} alt="还没睡？" />
      <p>睡不着的时候，<br />总觉得差点什么。<br />嗯……<br />大概是碗泡面。</p>
    </div>
    <div className="home-food">
      <RamenCupVisual surface="ramen-food-full.png" lid="open" steam className="home-cup-visual" />
    </div>
    <div className="home-note">今晚计划：<br />☑ 吃一碗泡面<br /><span>☑ 好好睡觉</span></div>
    <button className="primary-cta home-cta" onClick={start}><span>🍜</span>吃碗泡面<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
    <nav className="home-nav" aria-label="辅助功能">
      <button onClick={() => setModal('settings')}><img src={asset('ui', 'icon-settings.png')} alt="" /><span>设置</span></button>
      <button onClick={() => setModal('how')}><img src={asset('ui', 'icon-how-to.png')} alt="" /><span>玩法介绍</span></button>
      <button onClick={toggleNight}><img src={asset('ui', 'icon-good-night.png')} alt="" /><span>晚安模式</span></button>
    </nav>
  </section>
}

function ChoiceScreen({ eyebrow, title, choices, selected, onSelect, onNext, grid = false }: {
  eyebrow: string; title: string; choices: Choice[]; selected: Choice[]; onSelect: (choice: Choice) => void; onNext: () => void; grid?: boolean
}) {
  return <section className="panel choice-screen">
    <p className="eyebrow">{eyebrow}</p><h1>{title}</h1>
    <div className={`choice-list ${grid ? 'choice-grid' : ''}`}>
      {choices.map((choice) => {
        const active = selected.some((item) => item.id === choice.id)
        return <button className={`choice-card ${active ? 'selected' : ''}`} onClick={() => onSelect(choice)} key={choice.id}>
          <span className="choice-art" style={{ background: choice.tint }}>{choice.image ? <img src={choice.image} alt="" /> : choice.emoji}</span>
          <span><strong>{choice.name}</strong><small>{choice.note}</small></span><i>{active ? '✓' : ''}</i>
        </button>
      })}
    </div>
    <button className="primary-cta next-cta" onClick={onNext}>{grid && selected.length === 0 ? '不加配菜，也很好' : '就选这个'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
  </section>
}

function PrepareScreen({ restored, index, broth, noodle, selected, advance, playInteraction }: { restored: boolean; playInteraction: (name: InteractionSound) => void; index: number; broth: Choice; noodle: Choice; selected: Choice[]; advance: () => void }) {
  const [peeling, setPeeling] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [pouring, setPouring] = useState(false)
  const [seasoningStarted, setSeasoningStarted] = useState(restored && index === 2)
  const [watering, setWatering] = useState(index === 4 && !restored)
  useEffect(() => {
    if (!watering) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : WATER_DURATION
    const timer = window.setTimeout(() => setWatering(false), duration)
    return () => window.clearTimeout(timer)
  }, [watering])
  useEffect(() => {
    if (!pouring) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SEASONING_DURATION
    const timer = window.setTimeout(() => setPouring(false), duration)
    return () => window.clearTimeout(timer)
  }, [pouring])
  const startPeeling = () => { playInteraction('lid-peel'); setPeeling(true) }
  const startPlacing = () => { playInteraction('noodle-drop'); setPlacing(true) }
  const startSeasoning = () => { playInteraction('seasoning-pour'); setSeasoningStarted(true); setPouring(true) }
  const busy = pouring || peeling || placing || watering
  const act = () => {
    if (busy) return
    if (index === 0) startPeeling()
    else if (index === 1 && !restored) startPlacing()
    else if (index === 2 && !seasoningStarted) startSeasoning()
    else advance()
  }
  const cupAction = index === 0 ? '点击杯盖撕开'
    : index === 1 && !restored ? '点击杯口放入面饼'
    : index === 2 && !seasoningStarted ? '点击面饼撒入调料'
    : index === 3 ? '点击面饼倒入热水'
    : index === 4 ? '点击杯口盖好杯盖'
    : index === 5 ? '点击杯盖开始泡面' : '点击面饼继续'
  const step = prepSteps[index]
  const showToppings = index >= 3 && index < 5
  return <section className="panel action-screen">
    <p className="eyebrow">泡面进行中 · {index + 1 - (selected.length === 0 && index > 3 ? 1 : 0)}/{prepSteps.length - (selected.length === 0 ? 1 : 0)}</p><h1>{index === 1 && noodle.id !== 'fried' ? `放入${noodle.name}` : step[0]}</h1><p className="subcopy">{index === 2 ? `把${broth.name}调料撒在面上` : index === 1 && noodle.id !== 'fried' ? '放上一份，刚刚好' : step[1]}</p>
    <div className={`ramen-stage prep-${index} ${watering ? 'is-watering' : ''}`}>
      <RamenCupVisual
        noodle={(index > 1 || (index === 1 && restored)) && index < 5 ? noodle : undefined}
        broth={broth} dry={index < 4} uncooked seasoned={(index >= 3 || (index === 2 && restored)) && index < 5}
        toppings={showToppings ? selected : []}
        lid={index === 0 || index === 5 ? 'closed' : 'none'}
        peeling={peeling} onLidRemoved={advance}
        steam={index === 5 || (index === 4 && !watering)}
      />
      <button className="lid-tap-target" aria-label={cupAction} disabled={busy} onClick={act} />
      {placing && <div className="cup-opening noodle-drop-space"><img className={`noodle-serving noodle-${noodle.id} noodle-dry noodle-dropping`} src={noodle.image} alt={`正在放入${noodle.name}`} onAnimationEnd={advance} /></div>}
      {index === 2 && seasoningStarted && !restored && <SeasoningPour broth={broth} />}
      {watering && <WaterPour />}
    </div>
    <div className="recipe-strip"><span>{broth.emoji} {broth.name}</span><span>{noodle.emoji} {noodle.name}</span><span>＋{selected.length} 配菜</span></div>
    <button className="primary-cta tap-cta" disabled={busy} onClick={act}>{watering ? '热水正在倒入…' : placing ? '面饼正在落入杯中…' : peeling ? '正在撕开杯盖…' : pouring ? '调料正在落下…' : index === 2 && !seasoningStarted ? '点击撒入调料' : index === prepSteps.length - 1 ? '开始泡面' : '点一下继续'}</button>
  </section>
}

function WaitingScreen({ seconds, hurry }: { seconds: number; hurry: () => void }) {
  return <section className="panel action-screen waiting-screen"><p className="eyebrow">泡 3 分钟 · 游戏里只要 20 秒</p><h1>耐心等一小会儿</h1><p className="subcopy">听着房间里的声音，泡面正在慢慢变软。</p>
    <button className="timer-bowl" onClick={hurry} aria-label="轻点杯盖，让等待时间减少三秒">
      <span className="timer">00:{String(seconds).padStart(2, '0')}</span><RamenCupVisual lid="closed" /><span className="pulse-ring" />
    </button><p className="hint">忍不住的话，轻点杯盖可以快 3 秒</p></section>
}

function OpeningScreen({ selected, broth, noodle, open, playInteraction }: { playInteraction: (name: InteractionSound) => void; selected: Choice[]; broth: Choice; noodle: Choice; open: () => void }) {
  const [peeling, setPeeling] = useState(false)
  const startPeeling = () => { playInteraction('lid-peel'); setPeeling(true) }
  return <section className="panel action-screen"><p className="eyebrow">叮——泡好了</p><h1>揭开看看吧</h1><p className="subcopy">热气和香味一起跑出来了。</p>
    <button className="ramen-stage opening-stage" disabled={peeling} onClick={startPeeling}><RamenCupVisual noodle={noodle} broth={broth} seasoned toppings={selected} lid="open" steam peeling={peeling} onLidRemoved={open} /></button><p className="hint">点击杯盖揭开</p></section>
}

function EatingScreen({ bites, selected, broth, noodle, eat }: { bites: number; selected: Choice[]; broth: Choice; noodle: Choice; eat: () => void }) {
  const noodleLevel = noodleLevelForBites(bites)
  return <section className="panel action-screen eating-screen"><p className="eyebrow">{broth.name} · {noodle.name}</p><h1>{bites === 0 ? '趁热开吃' : bites < 6 ? '再来一口' : '最后一口面'}</h1><p className="subcopy">每点一下，就嗦掉一小口。</p>
    <button className="ramen-stage eating-bowl" disabled={bites >= 7} onClick={eat}><RamenCupVisual noodle={noodle} broth={broth} noodleLevel={noodleLevel} eatenBites={bites} seasoned={bites < 4} toppings={selected} steam chopsticksClass={`bite-${bites % 3}`} label={`还剩 ${Math.max(0, 100 - bites * 15)}% 的面`} /></button>
    <div className="bite-progress" aria-label={`已经吃了 ${bites} 口`}><span style={{ width: `${(bites / 7) * 100}%` }} /></div><p className="hint">点击泡面，夹起一口</p></section>
}

function SoupScreen({ sips, broth, drink }: { sips: number; broth: Choice; drink: () => void }) {
  return <section className="panel action-screen"><p className="eyebrow">面吃完啦</p><h1>{sips < 2 ? '喝口热汤吧' : '最后一口汤'}</h1><p className="subcopy">捧起杯子，咕嘟一小口。</p>
    <button className={`ramen-stage soup-bowl sip-${sips}`} aria-label="剩下的汤" disabled={sips >= 3} onClick={drink}>{sips === 1 || sips === 2 ? <div className="cup-visual"><img className="cup-body" src={soupCupImage(broth.id, sips === 1 ? 'mid' : 'last')} alt={`${broth.name}汤，${sips === 1 ? '喝过一口的中液面' : '最后一口的低液面'}`} /></div> : <RamenCupVisual broth={broth} surface={sips < 2 ? 'ramen-broth-only.png' : undefined} label="剩下的汤" />}</button><div className="bite-progress"><span style={{ width: `${(sips / 3) * 100}%` }} /></div><p className="hint">点击杯子喝汤</p></section>
}

function SleepScreen({ back }: { back: () => void }) {
  return <section className="sleep-screen" aria-label="熄灯，安心睡觉">
    <div className="sleep-scene">
      <img className="sleep-art" src="/assets/background/sleep-moon-v1.png" alt="月光房间：灯已经熄灭，小猫蜷在柔软的被子上熟睡" />
      <div className="sleep-zzz" aria-hidden="true">{[0, 1, 2].map(index => <span key={index}><svg viewBox="0 0 40 40"><path className="zzz-outline" d="M10 11 Q20 9 30 10 L11 29 Q21 31 31 28" /><path className="zzz-fill" d="M10 11 Q20 9 30 10 L11 29 Q21 31 31 28" /></svg></span>)}</div>
    </div>
    <button className="sleep-back" onClick={back} aria-label="返回首页，重新开始游戏"><BackIcon /></button>
  </section>
}

function FinishedScreen({ again, night }: { again: () => void; night: () => void }) {
  return <section className="panel action-screen finish-screen"><p className="eyebrow">空碗达成</p><h1>今晚就吃到这里吧</h1><p className="subcopy">吃饱了，盖好被子去睡觉。</p><img className="empty-cup" src={asset('ramen', 'ramen-cup-two-chopsticks.png')} alt="吃空的泡面杯" /><div className="finish-actions"><button className="primary-cta" onClick={again}>再来一碗</button><button className="secondary-cta" onClick={night}>吃饱了，去睡觉</button></div></section>
}

function ToppingLayer({ items, eatenBites = 0 }: { items: Choice[]; eatenBites?: number }) {
  // Compute the serving once from the original selection: eating a piece must
  // never enlarge or rearrange the remaining pieces into a fresh serving.
  const pieces = toppingLayout(items)
  const eatOrder = [...pieces].sort((a, b) => b.x - a.x || a.y - b.y)
  const removed = new Set(eatOrder.slice(0, Math.floor(pieces.length * Math.min(eatenBites, 7) / 7)).map(piece => piece.key))
  return <div className="topping-layer" aria-label={items.map(item => item.name).join('、')}>
    {pieces.filter(piece => !removed.has(piece.key)).map(({ item, key, x, y, width, angle }) => <img
      key={key} className={`topping topping-${item.id}`} src={item.image} alt=""
      style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, transform: `translate(-50%, -50%) rotate(${angle}deg) scaleY(.68)` }}
    />)}
  </div>
}

function RamenCupVisual({ surface, noodle, broth = broths[0], noodleLevel = 100, eatenBites = 0, dry = false, uncooked = false, seasoned = false, toppings: selected = [], lid = 'none', steam = false, peeling = false, onLidRemoved, chopsticksClass, className = '', label = '泡面杯' }: {
  surface?: string
  noodle?: Choice
  broth?: Choice
  noodleLevel?: NoodleLevel
  eatenBites?: number
  dry?: boolean
  uncooked?: boolean
  seasoned?: boolean
  toppings?: Choice[]
  lid?: 'none' | 'open' | 'closed'
  steam?: boolean
  peeling?: boolean
  onLidRemoved?: () => void
  chopsticksClass?: string
  className?: string
  label?: string
}) {
  return <div className={`cup-visual ${className}`} role="img" aria-label={label}>
    <img className="cup-body" src={asset('ramen', 'ramen-cup-two-chopsticks.png')} alt="" />
    {surface || noodle ? <div className={`cup-opening broth-${broth.id} ${noodle ? 'has-noodles' : ''} ${dry ? 'is-dry' : ''}`}>
      {noodle ? <>
        {!dry && <img className="cup-surface broth-surface" src={asset('ramen', 'ramen-broth-only.png')} alt="" />}
        {eatenBites < 7 && <img className={`noodle-serving ${dry || uncooked ? `noodle-${noodle.id} noodle-dry` : 'noodle-cooked'}`}
          src={dry || uncooked ? noodle.image : cookedNoodleImage(noodle.id, noodleLevel)} alt={noodle.name} data-noodle-level={dry || uncooked ? 'dry' : noodleLevel} />}
      </> : <img className={`cup-surface ${surface?.startsWith('ramen-broth-') ? 'broth-surface' : ''}`} src={asset('ramen', surface!)} alt="" />}
      {seasoned && <svg className="seasoning-settled" viewBox="17.4 18.72 265.2 97.92" preserveAspectRatio="none" aria-hidden="true"><SeasoningGrains broth={broth} /></svg>}
      <ToppingLayer items={selected} eatenBites={eatenBites} />
    </div> : null}
    {steam ? <img className="cup-steam" src={asset('effects', 'steam-main.png')} alt="" /> : null}
    {lid === 'closed' ? peeling ? <PeelingLid onComplete={onLidRemoved} /> : <span className="cup-lid-closed"><img src={asset('ramen', 'ramen-lid-closed.png')} alt="" /></span> : null}
    {lid === 'open' ? <img className={`cup-lid-open ${peeling ? 'lid-peeling' : ''}`} onAnimationEnd={peeling ? onLidRemoved : undefined} src={asset('ramen', 'ramen-lid-open-from-composite.png')} alt="" /> : null}
    {chopsticksClass ? <img className={`cup-chopsticks ${chopsticksClass}`} src={asset('ramen', 'chopsticks.png')} alt="" /> : null}
  </div>
}

function Modal({ type, close, soundOn, setSoundOn }: { type: 'settings' | 'how'; close: () => void; soundOn: boolean; setSoundOn: (value: boolean) => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={close}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="关闭"><CloseIcon /></button>
    <p className="eyebrow">{type === 'settings' ? '设置' : '玩法介绍'}</p><h2 id="modal-title">{type === 'settings' ? '让深夜更舒服' : '怎么吃这碗面？'}</h2>
    {type === 'settings' ? <button className="setting-row" onClick={() => setSoundOn(!soundOn)}><span>房间背景音</span><b>{soundOn ? '已开启' : '已关闭'}</b></button> : <ol><li>选汤底、面和最多三种配菜</li><li>跟着提示，把泡面一步步泡好</li><li>点击面碗，一小口一小口吃完</li><li>喝完热汤，就安心去睡觉</li></ol>}
  </section></div>
}

function stageLabel(stage: Stage) {
  return ({ broth: '选汤底', noodle: '选面', toppings: '选配菜', prepare: '泡面', waiting: '等待', opening: '揭盖', eating: '开吃', soup: '喝汤', finished: '吃饱了' } as Partial<Record<Stage, string>>)[stage]
}

export default App
