import { AVERAGE_GENOME, MUTATION_SIGMA, TRAIT_KEYS } from '../data/traitRanges.js'
import { clamp } from '../utils/math.js'

export const createAverageGenome = () => ({ ...AVERAGE_GENOME })

export const createRandomGenome = (rng) => {
  const genome = {}
  for (const key of TRAIT_KEYS) genome[key] = rng.next()
  genome.armPresence = rng.range(0.2, 0.95)
  genome.monochromeTendency = rng.range(0.45, 0.98)
  genome.uprightness = rng.range(0.4, 1)
  genome.eyeSize = rng.range(0.2, 0.9)
  genome.hairiness = rng.range(0, 0.65)
  genome.antennaFluff = rng.range(0, 0.55)
  genome.satA = rng.range(0.12, 0.6)
  genome.satB = rng.range(0.1, 0.52)
  genome.valA = rng.range(0.58, 0.86)
  genome.valB = rng.range(0.5, 0.8)
  return genome
}

export const computeGeneAverages = (creatures) => {
  if (!creatures.length) {
    return TRAIT_KEYS.reduce((acc, key) => {
      acc[key] = AVERAGE_GENOME[key]
      return acc
    }, {})
  }

  return TRAIT_KEYS.reduce((acc, key) => {
    acc[key] = creatures.reduce((sum, creature) => sum + creature.genome[key], 0) / creatures.length
    return acc
  }, {})
}

export const mutateGenome = ({ parentGenome, averages, mutationStrength, rng }) => {
  const child = {}
  for (const key of TRAIT_KEYS) {
    const sigma = MUTATION_SIGMA[key] * mutationStrength
    const meanPull = key.startsWith('hue') || key.startsWith('sat') || key.startsWith('val') ? 0.1 : 0.05
    let value = parentGenome[key] + rng.normal(0, sigma)
    value += (averages[key] - parentGenome[key]) * meanPull * mutationStrength
    if (rng.chance(0.02 * mutationStrength + 0.01)) {
      value += rng.normal(0, sigma * 3.2)
    }
    child[key] = clamp(value)
  }

  child.monochromeTendency = clamp(Math.max(child.monochromeTendency, rng.range(0.45, 0.78) * 0.5))
  child.hairiness = clamp(child.hairiness * rng.range(0.6, 1.05))
  child.antennaFluff = clamp(child.antennaFluff * rng.range(0.6, 1.08))
  child.satA = clamp(child.satA * 0.8 + 0.12)
  child.satB = clamp(child.satB * 0.78 + 0.1)
  child.valA = clamp(child.valA * 0.55 + 0.35)
  child.valB = clamp(child.valB * 0.55 + 0.3)
  return child
}

export const summarizeGenes = (creatures) => {
  const averages = computeGeneAverages(creatures)
  return Object.entries(averages)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value - AVERAGE_GENOME[b.key]) - Math.abs(a.value - AVERAGE_GENOME[a.key]))
}
