import { AVERAGE_GENOME, MUTATION_SIGMA, TRAIT_KEYS } from '../data/traitRanges.js'
import { clamp } from '../utils/math.js'
import config from '../config.js'

export const createAverageGenome = () => ({ ...AVERAGE_GENOME })

const COLOR_KEYS = new Set(['hueA', 'satA', 'valA', 'hueB', 'satB', 'valB'])

export const createRandomGenome = (rng) => {
  const genome = { ...AVERAGE_GENOME }
  for (const key of TRAIT_KEYS) {
    genome[key] = clamp(AVERAGE_GENOME[key] + rng.normal(0, MUTATION_SIGMA[key] * 3))
  }

  if (rng.chance(0.7)) {
    const darkBrown = rng.pick(config.genetics.naturalPalettes)
    genome.hueA = clamp(darkBrown.h + rng.normal(0, 0.015))
    genome.hueB = clamp(darkBrown.h + rng.normal(0, 0.02))
    genome.satA = clamp(darkBrown.s + rng.normal(0, 0.05))
    genome.satB = clamp(darkBrown.s * 0.9 + rng.normal(0, 0.05))
    genome.valA = clamp(darkBrown.v + rng.normal(0, 0.05))
    genome.valB = clamp(darkBrown.v * 0.85 + rng.normal(0, 0.05))
  } else {
    genome.hueA = rng.range(0, 1)
    genome.hueB = clamp(genome.hueA + rng.normal(0, 0.06))
    genome.satA = rng.range(0.18, 0.6)
    genome.satB = rng.range(0.14, 0.54)
    genome.valA = rng.range(0.3, 0.78)
    genome.valB = rng.range(0.24, 0.7)
  }

  genome.monochromeTendency = rng.range(0.65, 0.98)
  genome.bodySquareness = rng.range(0, 0.22)
  genome.hairiness = rng.range(0, 0.45)
  genome.antennaFluff = rng.range(0, 0.35)
  genome.neckLength = rng.range(0.03, 0.22)
  genome.eyeStyle = rng.range(0, 0.55)
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
    const sigmaBase = MUTATION_SIGMA[key] * mutationStrength
    const sigma = COLOR_KEYS.has(key)
      ? sigmaBase * config.genetics.colorMutationMultiplier
      : key === 'height'
        ? sigmaBase * config.genetics.heightMutationMultiplier
        : sigmaBase
    const meanPull = COLOR_KEYS.has(key) ? config.genetics.colorMeanPull : config.genetics.defaultMeanPull
    let value = parentGenome[key] + rng.normal(0, sigma)
    value += (averages[key] - parentGenome[key]) * meanPull * mutationStrength
    child[key] = clamp(value)
  }

  if (rng.chance(config.genetics.macroMutationChanceScale * mutationStrength + config.genetics.macroMutationChanceBase)) {
    const key = rng.pick(config.genetics.macroMutationTraits)
    child[key] = clamp(child[key] + rng.normal(0, MUTATION_SIGMA[key] * config.genetics.macroMutationMultiplier))
  }

  child.neckLength = clamp(child.neckLength * 0.55 + 0.02)
  child.bodySquareness = clamp(child.bodySquareness * config.genetics.bodySquarenessDamping)
  child.height = clamp(child.height * (1 - config.genetics.heightParentBlend) + parentGenome.height * config.genetics.heightParentBlend)
  child.hairiness = clamp(child.hairiness * rng.range(config.genetics.hairDampingMin, config.genetics.hairDampingMax))
  child.antennaFluff = clamp(child.antennaFluff * rng.range(config.genetics.hairDampingMin, config.genetics.hairDampingMax))
  child.monochromeTendency = clamp(Math.max(child.monochromeTendency, config.genetics.monochromeFloor))

  const likelyNatural = rng.chance(config.genetics.naturalPaletteChance)
  if (likelyNatural) {
    const darkBrown = rng.pick(config.genetics.naturalPalettes)
    child.hueA = clamp(child.hueA * 0.45 + darkBrown.h * 0.55 + rng.normal(0, 0.01))
    child.hueB = clamp(child.hueB * 0.4 + darkBrown.h * 0.6 + rng.normal(0, 0.012))
    child.satA = clamp(child.satA * 0.5 + darkBrown.s * 0.5)
    child.satB = clamp(child.satB * 0.5 + darkBrown.s * 0.45)
    child.valA = clamp(child.valA * 0.45 + darkBrown.v * 0.55)
    child.valB = clamp(child.valB * 0.45 + darkBrown.v * 0.5)
  } else {
    child.satA = clamp(child.satA * 0.82 + 0.1)
    child.satB = clamp(child.satB * 0.8 + 0.1)
    child.valA = clamp(child.valA * 0.72 + 0.2)
    child.valB = clamp(child.valB * 0.72 + 0.18)
  }

  return child
}

export const summarizeGenes = (creatures) => {
  const averages = computeGeneAverages(creatures)
  return Object.entries(averages)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value - AVERAGE_GENOME[b.key]) - Math.abs(a.value - AVERAGE_GENOME[a.key]))
}
