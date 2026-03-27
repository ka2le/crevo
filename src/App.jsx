import { useMemo } from 'react'
import './App.css'
import { useCrevoStore } from './game/store.js'
import { GameCanvas } from './game/GameCanvas.jsx'

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
  const setMode = useCrevoStore((state) => state.setMode)
  const spawnAverageCreature = useCrevoStore((state) => state.spawnAverageCreature)
  const spawnRandomCreature = useCrevoStore((state) => state.spawnRandomCreature)
  const resetWorld = useCrevoStore((state) => state.resetWorld)

  const dominantGenes = useMemo(() => {
    return stats.geneAverages
      .slice(0, 5)
      .map((entry) => `${entry.key}:${entry.value.toFixed(2)}`)
      .join(' · ')
  }, [stats.geneAverages])

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="control-group left">
          <button className="control button-control" onClick={togglePause}>
            {controls.paused ? 'play' : 'pause'}
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
          <StatPill label="mode" value={mode} />
        </div>

        <div className="control-group right">
          <button className="control button-control" onClick={() => setMode(mode === 'multiply' ? 'explode' : 'multiply')}>
            {mode === 'multiply' ? 'switch: boom' : 'switch: clone'}
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

      <GameCanvas />

      <footer className="bottom-readout">
        <div className="readout-block">
          <span className="readout-label">gene drift</span>
          <p>{dominantGenes || 'warming up...'}</p>
        </div>
        <div className="readout-block compact">
          <span className="readout-label">hint</span>
          <p>tap/click clones · hold/right-click pops · landscape-first</p>
        </div>
      </footer>
    </main>
  )
}

export default App
