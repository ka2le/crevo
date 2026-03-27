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

const inheritColorGene = (parentValue, meanValue, sigma, meanPull, lockToParent, rng) => {
  const drifted = parentValue + rng.normal(0, sigma) + (meanValue - parentValue) * meanPull
  return clamp(parentValue * lockToParent + drifted * (1 - lockToParent))
}

export const mutateGenome = ({ parentGenome, averages, mutationStrength, rng }) => {
  const child = {}
  for (const key of TRAIT_KEYS) {
    const sigmaBase = MUTATION_SIGMA[key] * mutationStrength
    if (COLOR_KEYS.has(key)) {
      const sigma = sigmaBase * config.genetics.colorMutationMultiplier * config.genetics.colorDrift
      child[key] = inheritColorGene(
        parentGenome[key],
        averages[key],
        sigma,
        config.genetics.colorMeanPull * mutationStrength,
        config.genetics.colorLockToParent,
        rng,
      )
      continue
    }

    const sigma = key === 'height'
      ? sigmaBase * config.genetics.heightMutationMultiplier * config.genetics.heightDrift
      : sigmaBase
    const meanPull = config.genetics.defaultMeanPull
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
    const blend = 1 - config.genetics.colorLockToParent
    child.hueA = clamp(child.hueA * (1 - blend) + darkBrown.h * blend + rng.normal(0, 0.002))
    child.hueB = clamp(child.hueB * (1 - blend) + darkBrown.h * blend + rng.normal(0, 0.0025))
    child.satA = clamp(child.satA * (1 - blend) + darkBrown.s * blend)
    child.satB = clamp(child.satB * (1 - blend) + darkBrown.s * blend * 0.92)
    child.valA = clamp(child.valA * (1 - blend) + darkBrown.v * blend)
    child.valB = clamp(child.valB * (1 - blend) + darkBrown.v * blend * 0.92)
  }

  return child
}

export const summarizeGenes = (creatures) => {
  const averages = computeGeneAverages(creatures)
  return Object.entries(averages)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value - AVERAGE_GENOME[b.key]) - Math.abs(a.value - AVERAGE_GENOME[a.key]))
}
