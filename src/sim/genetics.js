import { AVERAGE_GENOME, MUTATION_SIGMA, TRAIT_KEYS } from '../data/traitRanges.js'
import { clamp } from '../utils/math.js'
import config from '../config.js'

export const createAverageGenome = () => ({ ...AVERAGE_GENOME })

const COLOR_KEYS = new Set(['hueA', 'satA', 'valA', 'hueB', 'satB', 'valB'])
const CLICK_MUTATION_POOLS = [
  ['height', 'bulk', 'bodyFusion'],
  ['eyeCount', 'eyeSize', 'eyeSpacing', 'pupilHueShift'],
  ['rainbowness', 'accentAmount', 'contrastTendency', 'monochromeTendency'],
  ['legLengthFront', 'legLengthMid', 'legLengthRear', 'legThickness'],
  ['thoraxSize', 'abdomenSize', 'headSize', 'waistTightness'],
]

const hueDistance = (a, b) => {
  const diff = Math.abs(a - b) % 1
  return Math.min(diff, 1 - diff)
}

const inHueBand = (value) => config.genetics.colorNormalBands.hue.some((band) => hueDistance(value, band.center) <= band.radius)
const inLinearBand = (value, band) => value >= band.min && value <= band.max

const isOutsideNormalColorBand = (key, value) => {
  if (key === 'hueA' || key === 'hueB') return !inHueBand(value)
  if (key === 'satA' || key === 'satB') return !inLinearBand(value, config.genetics.colorNormalBands.sat)
  if (key === 'valA' || key === 'valB') return !inLinearBand(value, config.genetics.colorNormalBands.val)
  return false
}

const inheritColorGene = (key, parentValue, meanValue, sigma, meanPull, lockToParent, rng) => {
  const outside = isOutsideNormalColorBand(key, parentValue)
  const appliedMeanPull = outside ? config.genetics.outsideBandMeanPull : meanPull
  const drifted = parentValue + rng.normal(0, sigma) + (meanValue - parentValue) * appliedMeanPull
  return clamp(parentValue * lockToParent + drifted * (1 - lockToParent))
}

const applyTraitNudge = (genome, key, amount, rng) => {
  const sigma = MUTATION_SIGMA[key] * amount
  genome[key] = clamp(genome[key] + rng.normal(0, sigma))
}

const applyRareMutationProfile = (child, rng) => {
  if (!rng.chance(config.genetics.rareMutationChance)) return false
  const profileEntries = Object.entries(config.genetics.rareMutationProfiles)
  const weighted = []
  for (const [name, profile] of profileEntries) {
    const copies = Math.max(1, Math.round(profile.chance * 100))
    for (let i = 0; i < copies; i += 1) weighted.push([name, profile])
  }
  const [, profile] = rng.pick(weighted)
  for (const key of profile.traits) {
    applyTraitNudge(child, key, config.genetics.macroMutationMultiplier * profile.amount, rng)
  }

  if (profile.traits.includes('rainbowness')) {
    child.rainbowness = clamp(Math.max(child.rainbowness, 0.62 + rng.range(0, 0.25)))
    child.monochromeTendency = clamp(child.monochromeTendency * rng.range(0.2, 0.58))
    child.hueB = (child.hueA + rng.range(0.18, 0.52)) % 1
    child.satA = clamp(Math.max(child.satA, 0.55 + rng.range(0, 0.3)))
    child.satB = clamp(Math.max(child.satB, 0.45 + rng.range(0, 0.35)))
    child.valA = clamp(Math.max(child.valA, 0.42 + rng.range(0, 0.28)))
    child.valB = clamp(Math.max(child.valB, 0.36 + rng.range(0, 0.3)))
  }

  if (profile.traits.includes('eyeCount')) {
    child.eyeCount = clamp(Math.max(child.eyeCount, 0.68 + rng.range(0, 0.28)))
    child.eyeSize = clamp(child.eyeSize * rng.range(0.92, 1.2))
  }

  if (profile.traits.includes('bodyFusion')) {
    child.bodyFusion = clamp(Math.max(child.bodyFusion, 0.72 + rng.range(0, 0.22)))
    child.bulk = clamp(Math.max(child.bulk, 0.6 + rng.range(0, 0.25)))
    child.waistTightness = clamp(child.waistTightness * rng.range(0.15, 0.45))
  }

  return true
}

const forceClickMutations = (child, rng) => {
  const pools = [...CLICK_MUTATION_POOLS]
  const picks = Math.min(config.genetics.forcedTraitMutationCount, pools.length)
  for (let i = 0; i < picks; i += 1) {
    const poolIndex = rng.int(0, pools.length - 1)
    const [pool] = pools.splice(poolIndex, 1)
    const trait = rng.pick(pool)
    applyTraitNudge(child, trait, config.genetics.macroMutationMultiplier * config.genetics.clickMutationStrengthBoost, rng)
  }

  if (rng.chance(config.genetics.clickMutationRareBoost)) {
    applyRareMutationProfile(child, rng)
  }
}

export const createRandomGenome = (rng) => {
  const genome = { ...AVERAGE_GENOME }
  for (const key of TRAIT_KEYS) {
    genome[key] = clamp(AVERAGE_GENOME[key] + rng.normal(0, MUTATION_SIGMA[key] * 3))
  }

  if (rng.chance(0.62)) {
    const darkBrown = rng.pick(config.genetics.naturalPalettes)
    genome.hueA = clamp(darkBrown.h + rng.normal(0, 0.02))
    genome.hueB = clamp(darkBrown.h + rng.normal(0, 0.03))
    genome.satA = clamp(darkBrown.s + rng.normal(0, 0.06))
    genome.satB = clamp(darkBrown.s * 0.9 + rng.normal(0, 0.07))
    genome.valA = clamp(darkBrown.v + rng.normal(0, 0.06))
    genome.valB = clamp(darkBrown.v * 0.85 + rng.normal(0, 0.06))
    genome.monochromeTendency = rng.range(0.66, 0.97)
    genome.rainbowness = rng.range(0, 0.14)
  } else if (rng.chance(0.14)) {
    genome.hueA = rng.range(0, 1)
    genome.hueB = (genome.hueA + rng.range(0.15, 0.55)) % 1
    genome.satA = rng.range(0.55, 1)
    genome.satB = rng.range(0.45, 1)
    genome.valA = rng.range(0.35, 0.95)
    genome.valB = rng.range(0.3, 0.9)
    genome.monochromeTendency = rng.range(0.04, 0.4)
    genome.rainbowness = rng.range(0.62, 1)
  } else {
    genome.hueA = rng.range(0, 1)
    genome.hueB = clamp(genome.hueA + rng.normal(0, 0.09))
    genome.satA = rng.range(0.18, 0.7)
    genome.satB = rng.range(0.14, 0.64)
    genome.valA = rng.range(0.24, 0.82)
    genome.valB = rng.range(0.18, 0.78)
    genome.monochromeTendency = rng.range(0.28, 0.92)
    genome.rainbowness = rng.range(0.04, 0.38)
  }

  genome.bodySquareness = rng.range(0, 0.42)
  genome.bodyFusion = rng.range(0.02, 0.42)
  genome.bulk = rng.range(0.18, 0.82)
  genome.hairiness = rng.range(0, 0.7)
  genome.antennaFluff = rng.range(0, 0.45)
  genome.neckLength = rng.range(0.01, 0.28)
  genome.eyeStyle = rng.range(0, 0.95)
  genome.eyeCount = rng.chance(0.12) ? rng.range(0.68, 1) : rng.range(0, 0.28)
  genome.pupilHueShift = rng.range(0, 1)
  genome.height = clamp(genome.height + rng.normal(0, 0.08))

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

export const mutateGenome = ({ parentGenome, averages, mutationStrength, rng, context = 'natural' }) => {
  const child = {}
  for (const key of TRAIT_KEYS) {
    const sigmaBase = MUTATION_SIGMA[key] * mutationStrength
    if (COLOR_KEYS.has(key)) {
      const sigma = sigmaBase * config.genetics.colorMutationMultiplier * config.genetics.colorDrift
      child[key] = inheritColorGene(
        key,
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

  applyRareMutationProfile(child, rng)

  child.neckLength = clamp(child.neckLength * 0.72 + 0.01)
  child.bodySquareness = clamp(child.bodySquareness * config.genetics.bodySquarenessDamping + parentGenome.bodySquareness * 0.15)
  child.height = clamp(child.height * (1 - config.genetics.heightParentBlend) + parentGenome.height * config.genetics.heightParentBlend)
  child.hairiness = clamp(child.hairiness * rng.range(config.genetics.hairDampingMin, config.genetics.hairDampingMax))
  child.antennaFluff = clamp(child.antennaFluff * rng.range(config.genetics.hairDampingMin, config.genetics.hairDampingMax))
  child.monochromeTendency = clamp(Math.max(child.monochromeTendency, config.genetics.monochromeFloor * (1 - child.rainbowness * 0.85)))
  child.colorDriftBias = clamp(parentGenome.colorDriftBias + rng.normal(0, MUTATION_SIGMA.colorDriftBias * mutationStrength))

  const likelyNatural = rng.chance(config.genetics.naturalPaletteChance * Math.max(0.08, 1 - child.rainbowness))
  if (likelyNatural && !isOutsideNormalColorBand('hueA', parentGenome.hueA) && !isOutsideNormalColorBand('hueB', parentGenome.hueB)) {
    const darkBrown = rng.pick(config.genetics.naturalPalettes)
    const blend = (1 - config.genetics.colorLockToParent) * Math.max(0.1, child.colorDriftBias)
    child.hueA = clamp(child.hueA * (1 - blend) + darkBrown.h * blend + rng.normal(0, 0.002))
    child.hueB = clamp(child.hueB * (1 - blend) + darkBrown.h * blend + rng.normal(0, 0.0025))
    child.satA = clamp(child.satA * (1 - blend) + darkBrown.s * blend)
    child.satB = clamp(child.satB * (1 - blend) + darkBrown.s * blend * 0.92)
    child.valA = clamp(child.valA * (1 - blend) + darkBrown.v * blend)
    child.valB = clamp(child.valB * (1 - blend) + darkBrown.v * blend * 0.92)
  }

  if (context === 'clicked') {
    forceClickMutations(child, rng)
  }

  return child
}

export const summarizeGenes = (creatures) => {
  const averages = computeGeneAverages(creatures)
  return Object.entries(averages)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => Math.abs(b.value - AVERAGE_GENOME[b.key]) - Math.abs(a.value - AVERAGE_GENOME[a.key]))
}
