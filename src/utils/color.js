import { clamp, lerp } from './math.js'

const toByte = (value) => Math.round(clamp(value, 0, 1) * 255)

export const hsvToRgb = (h, s, v) => {
  const hue = ((h % 1) + 1) % 1
  const i = Math.floor(hue * 6)
  const f = hue * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const modes = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ]
  const [r, g, b] = modes[i % 6]
  return { r: toByte(r), g: toByte(g), b: toByte(b) }
}

export const rgbToString = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`

export const mixHsv = (a, b, amount) => ({
  h: lerp(a.h, b.h, amount),
  s: lerp(a.s, b.s, amount),
  v: lerp(a.v, b.v, amount),
})
