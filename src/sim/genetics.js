import { AVERAGE_GENOME, MUTATION_SIGMA, TRAIT_KEYS } from '../data/traitRanges.js'
import { clamp } from '../utils/math.js'

export const createAverageGenome = () => ({ ...AVERAGE_GENOME })

export const createRandomGenome = (rng) => {
  const genome = {}
  for (const key of TRAIT_KEYS) genome[key] = rng.next()
  genome.armPresence = rng.range(0.2, 0.95)
  genome.monochromeTendency = rng.range(0.05, 0.95)
  genome.uprightness = rng.range(0.4, 1)
  genome.eyeSize = rng.range(0.2, 0.9)
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
    const meanPull = key.startsWith('hue') ? 0.08 : 0.05
    let value = parentGenome[key] + rng.normal(0, sigma)
    value += (averages[key] - parentGenome[key]) * meanPull * mutationStrength
    if (rng.chance(0.02 * mutationStrength + 0.01)) {
      value += rng.normal(0, sigma * 3.2)
    }
    child[key] = clamp(value)
  }
  return child
}

export const summarizeGenes = (creatures) => {
  const averages = computeGeneAverages(creatures)
  return Object.entries(averages)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value - AVERAGE_GENOME[b.key]) - Math.abs(a.value - AVERAGE_GENOME[a.key]))
}
