import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCrevoStore } from './game/store.js'
import { GameCanvas } from './game/GameCanvas.jsx'
import { canFullscreen, isFullscreenActive, subscribeFullscreenChange, toggleFullscreen } from './utils/fullscreen.js'

const formatPercent = (value) => `${Math.round(value * 100)}%`

function Slider({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <label className="control slider-control">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function App() {
  const stats = useCrevoStore((state) => state.stats)
  const controls = useCrevoStore((state) => state.controls)
  const mode = useCrevoStore((state) => state.mode)
  const setControl = useCrevoStore((state) => state.setControl)
  const togglePause = useCrevoStore((state) => state.togglePause)
  const toggleMode = useCrevoStore((state) => state.toggleMode)
  const spawnAverageCreature = useCrevoStore((state) => state.spawnAverageCreature)
  const spawnRandomCreature = useCrevoStore((state) => state.spawnRandomCreature)
  const resetWorld = useCrevoStore((state) => state.resetWorld)
  const canvasApiRef = useRef(null)
  const [fullscreenActive, setFullscreenActive] = useState(() => isFullscreenActive())
  const [fullscreenSupported, setFullscreenSupported] = useState(true)

  useEffect(() => {
    setFullscreenSupported(canFullscreen(canvasApiRef.current?.getFullscreenTarget?.()))
    return subscribeFullscreenChange(() => {
      setFullscreenActive(isFullscreenActive())
    })
  }, [])

  const fullscreenLabel = useMemo(() => {
    if (!fullscreenSupported) return 'expand'
    return fullscreenActive ? 'shrink' : 'full'
  }, [fullscreenActive, fullscreenSupported])

  const handleFullscreen = async () => {
    const target = canvasApiRef.current?.getFullscreenTarget?.() || document.documentElement
    setFullscreenSupported(canFullscreen(target))
    try {
      await toggleFullscreen(target)
      setFullscreenActive(isFullscreenActive())
    } catch {
      const root = document.documentElement
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      root.style.minHeight = '100svh'
      root.style.height = '100svh'
      setFullscreenActive(isFullscreenActive())
    }
  }

  return (
    <main className="app-shell">
      <div className="rotatable-page">
        <header className="top-bar">
          <div className="control-group left">
            <button className="control button-control" onClick={togglePause}>
              {controls.paused ? 'play' : 'pause'}
            </button>
            <button className="control button-control accent" onClick={handleFullscreen}>
              {fullscreenLabel}
            </button>
            <Slider
              label={`mut ${formatPercent(controls.mutationStrength)}`}
              value={controls.mutationStrength}
              min={0.01}
              max={0.4}
              step={0.01}
              onChange={(value) => setControl('mutationStrength', value)}
            />
            <Slider
              label={`birth ${formatPercent(controls.birthRate)}`}
              value={controls.birthRate}
              min={0.1}
              max={1.6}
              step={0.05}
              onChange={(value) => setControl('birthRate', value)}
            />
            <Slider
              label={`spd ${controls.speed.toFixed(1)}x`}
              value={controls.speed}
              min={0.4}
              max={3}
              step={0.1}
              onChange={(value) => setControl('speed', value)}
            />
          </div>

          <div className="control-group center stats-strip">
            <StatPill label="pop" value={stats.population} />
            <StatPill label="born" value={stats.births} />
            <StatPill label="lost" value={stats.deaths} />
            <StatPill label="gen" value={stats.maxGeneration} />
            <StatPill label="mode" value={mode === 'multiply' ? 'create' : 'destroy'} />
          </div>

          <div className="control-group right">
            <button className={`control button-control mode-toggle ${mode === 'explode' ? 'danger' : 'accent'}`} onClick={toggleMode}>
              {mode === 'multiply' ? 'create' : 'destroy'}
            </button>
            <button className="control button-control accent" onClick={spawnAverageCreature}>
              avg
            </button>
            <button className="control button-control accent" onClick={spawnRandomCreature}>
              rnd
            </button>
            <button className="control button-control" onClick={resetWorld}>
              reset
            </button>
          </div>
        </header>

        <GameCanvas ref={canvasApiRef} />
      </div>

      <aside className="portrait-hint" aria-hidden="true">
        <div className="portrait-card">
          <span>portrait</span>
          <p>tap uses current mode, desktop right-click does the opposite</p>
        </div>
      </aside>
    </main>
  )
}

export default App
