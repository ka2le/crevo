import { useEffect, useRef } from 'react'
import { useCrevoStore } from './store.js'
import { renderWorld } from '../render/renderer.js'
import { hitTestCreature } from '../input/hitTest.js'

const HOLD_MS = 360
const TOUCH_CLICK_GUARD_MS = 700

export function GameCanvas() {
  const canvasRef = useRef(null)
  const holdTimerRef = useRef(null)
  const holdIdRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastTimeRef = useRef(0)
  const ignoreClickUntilRef = useRef(0)

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const portraitRotated = window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches
      const width = portraitRotated ? window.innerHeight : window.innerWidth
      const height = portraitRotated ? window.innerWidth : window.innerHeight
      const ratio = window.devicePixelRatio || 1
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      useCrevoStore.getState().resize(width, height)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const frame = (time) => {
      const delta = Math.min(0.033, (time - lastTimeRef.current) / 1000 || 0.016)
      lastTimeRef.current = time
      const state = useCrevoStore.getState()
      state.tick(delta)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        renderWorld({
          ctx,
          world: state.world,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          pointer: state.pointer,
        })
      }
      animationFrameRef.current = requestAnimationFrame(frame)
    }

    animationFrameRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [])

  const updatePointer = (clientX, clientY) => {
    const state = useCrevoStore.getState()
    const hovered = hitTestCreature(state.world, clientX, clientY)
    state.setPointer({ x: clientX, y: clientY, hovered })
    return hovered
  }

  const explodeIfHeld = (id) => {
    if (!id) return
    useCrevoStore.getState().explodeCreature(id)
    holdIdRef.current = null
  }

  const clearHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onMouseMove={(event) => updatePointer(event.clientX, event.clientY)}
      onMouseLeave={() => useCrevoStore.getState().setPointer({ x: 0, y: 0, hovered: null })}
      onClick={(event) => {
        if (Date.now() < ignoreClickUntilRef.current) return
        const id = updatePointer(event.clientX, event.clientY)
        if (id) useCrevoStore.getState().multiplyCreature(id)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        const id = updatePointer(event.clientX, event.clientY)
        if (id) useCrevoStore.getState().explodeCreature(id)
      }}
      onTouchStart={(event) => {
        event.preventDefault()
        ignoreClickUntilRef.current = Date.now() + TOUCH_CLICK_GUARD_MS
        const touch = event.touches[0]
        const id = updatePointer(touch.clientX, touch.clientY)
        holdIdRef.current = id
        clearHold()
        holdTimerRef.current = window.setTimeout(() => explodeIfHeld(holdIdRef.current), HOLD_MS)
      }}
      onTouchMove={(event) => {
        event.preventDefault()
        const touch = event.touches[0]
        const id = updatePointer(touch.clientX, touch.clientY)
        if (holdIdRef.current && holdIdRef.current !== id) {
          clearHold()
          holdIdRef.current = id
          holdTimerRef.current = window.setTimeout(() => explodeIfHeld(holdIdRef.current), HOLD_MS)
        }
      }}
      onTouchEnd={(event) => {
        event.preventDefault()
        ignoreClickUntilRef.current = Date.now() + TOUCH_CLICK_GUARD_MS
        clearHold()
        const state = useCrevoStore.getState()
        const touch = event.changedTouches[0]
        const id = updatePointer(touch.clientX, touch.clientY)
        if (holdIdRef.current && holdIdRef.current === id) {
          state.multiplyCreature(id)
        }
        holdIdRef.current = null
      }}
    />
  )
}
