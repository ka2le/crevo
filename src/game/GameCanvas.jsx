import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useCrevoStore } from './store.js'
import { renderWorld } from '../render/renderer.js'
import { hitTestCreature, mapPortraitPointer } from '../input/hitTest.js'

const PORTRAIT_QUERY = '(max-width: 760px) and (orientation: portrait)'

export const GameCanvas = forwardRef(function GameCanvas(_, ref) {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastTimeRef = useRef(0)
  const portraitRef = useRef(false)

  useImperativeHandle(ref, () => ({
    getFullscreenTarget: () => wrapperRef.current || canvasRef.current,
    getCanvas: () => canvasRef.current,
  }), [])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const portraitRotated = window.matchMedia(PORTRAIT_QUERY).matches
      portraitRef.current = portraitRotated
      const width = window.innerWidth
      const height = window.innerHeight
      const ratio = window.devicePixelRatio || 1
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      useCrevoStore.getState().resize(portraitRotated ? height : width, portraitRotated ? width : height)
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
          portrait: portraitRef.current,
        })
      }
      animationFrameRef.current = requestAnimationFrame(frame)
    }

    animationFrameRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [])

  const mapPointer = (clientX, clientY) => {
    const state = useCrevoStore.getState()
    if (!portraitRef.current) return { x: clientX, y: clientY, world: state.world }
    const mapped = mapPortraitPointer(clientX, clientY, window.innerWidth)
    return { x: mapped.x, y: mapped.y, world: state.world }
  }

  const updatePointer = (clientX, clientY) => {
    const state = useCrevoStore.getState()
    const mapped = mapPointer(clientX, clientY)
    const hovered = hitTestCreature(mapped.world, mapped.x, mapped.y)
    state.setPointer({ x: mapped.x, y: mapped.y, hovered })
    return hovered
  }

  const performAction = (id, primary = true) => {
    const state = useCrevoStore.getState()
    const action = primary ? state.mode : state.mode === 'multiply' ? 'explode' : 'multiply'
    state.performCreatureAction(id, action)
  }

  return (
    <div ref={wrapperRef} className="game-stage">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseMove={(event) => updatePointer(event.clientX, event.clientY)}
        onMouseLeave={() => useCrevoStore.getState().setPointer({ x: 0, y: 0, hovered: null })}
        onClick={(event) => {
          const id = updatePointer(event.clientX, event.clientY)
          if (id) performAction(id, true)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          const id = updatePointer(event.clientX, event.clientY)
          if (id) performAction(id, false)
        }}
        onTouchStart={(event) => {
          event.preventDefault()
          const touch = event.touches[0]
          updatePointer(touch.clientX, touch.clientY)
        }}
        onTouchMove={(event) => {
          event.preventDefault()
          const touch = event.touches[0]
          updatePointer(touch.clientX, touch.clientY)
        }}
        onTouchEnd={(event) => {
          event.preventDefault()
          const touch = event.changedTouches[0]
          const id = updatePointer(touch.clientX, touch.clientY)
          if (id) performAction(id, true)
        }}
      />
    </div>
  )
})
