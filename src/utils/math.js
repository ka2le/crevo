export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const lerp = (a, b, t) => a + (b - a) * t
export const inverseLerp = (a, b, value) => (value - a) / (b - a)
export const smoothstep = (edge0, edge1, value) => {
  const t = clamp(inverseLerp(edge0, edge1, value))
  return t * t * (3 - 2 * t)
}
export const mapRange = (inMin, inMax, outMin, outMax, value) => lerp(outMin, outMax, inverseLerp(inMin, inMax, value))
export const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0)
