import seedrandom from 'seedrandom'

export const createRng = (seed = Math.random().toString(36).slice(2)) => {
  const rng = seedrandom(seed)

  const next = () => rng()
  const range = (min, max) => min + (max - min) * next()
  const int = (min, max) => Math.floor(range(min, max + 1))
  const pick = (items) => items[Math.floor(next() * items.length)]
  const chance = (probability) => next() < probability
  const normal = (mean = 0, deviation = 1) => {
    let u = 0
    let v = 0
    while (u === 0) u = next()
    while (v === 0) v = next()
    const mag = Math.sqrt(-2.0 * Math.log(u))
    const z0 = mag * Math.cos(2.0 * Math.PI * v)
    return mean + z0 * deviation
  }

  return { next, range, int, pick, chance, normal, seed }
}
