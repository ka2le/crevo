import { hsvToRgb, rgbToString } from '../utils/color.js'
import { lerp } from '../utils/math.js'

export const derivePhenotype = (genome) => {
  const height = lerp(42, 118, genome.height)
  const thoraxRadius = height * lerp(0.16, 0.25, genome.thoraxSize)
  const abdomenRadius = height * lerp(0.17, 0.29, genome.abdomenSize)
  const headRadius = height * lerp(0.11, 0.22, genome.headSize)
  const neck = height * lerp(0.03, 0.12, genome.neckLength)
  const upright = lerp(-0.16, 0.22, genome.uprightness)
  const legs = {
    front: height * lerp(0.2, 0.42, genome.legLengthFront),
    mid: height * lerp(0.18, 0.36, genome.legLengthMid),
    rear: height * lerp(0.22, 0.46, genome.legLengthRear),
    thickness: lerp(2, 7, genome.legThickness),
  }

  const diversity = 1 - genome.monochromeTendency
  const hueB = genome.hueA + (genome.hueB - genome.hueA) * diversity
  const baseA = hsvToRgb(genome.hueA, lerp(0.3, 0.95, genome.satA), lerp(0.28, 0.95, genome.valA))
  const baseB = hsvToRgb(hueB, lerp(0.2, 0.9, genome.satB), lerp(0.22, 0.88, genome.valB))
  const eyeTone = hsvToRgb((genome.hueA + 0.52 + genome.accentAmount * 0.2) % 1, 0.35 + genome.accentAmount * 0.5, 0.88)

  return {
    height,
    thoraxRadius,
    abdomenRadius,
    headRadius,
    neck,
    upright,
    legs,
    hasArms: genome.armPresence > 0.58,
    armLength: height * lerp(0.14, 0.34, genome.armLength),
    bouncePx: height * lerp(0.005, 0.055, genome.bounce),
    swayPx: height * lerp(0.004, 0.04, genome.sway),
    stepLiftPx: height * lerp(0.01, 0.12, genome.stepLift),
    walkHz: lerp(0.5, 2.1, genome.stepRate),
    boldness: genome.boldness,
    eyeSize: headRadius * lerp(0.16, 0.36, genome.eyeSize),
    eyeSpacing: headRadius * lerp(0.18, 0.48, genome.eyeSpacing),
    antennaLength: height * lerp(0.14, 0.34, genome.antennaLength),
    antennaCurl: lerp(-0.2, 0.7, genome.antennaCurl),
    colors: {
      thorax: rgbToString(baseA),
      abdomen: rgbToString(baseB),
      limbs: rgbToString(baseB, 0.95),
      outline: 'rgba(14, 12, 8, 0.75)',
      eye: rgbToString(eyeTone),
      glow: rgbToString(eyeTone, 0.2 + genome.accentAmount * 0.2),
    },
    fertilityCooldown: lerp(6.5, 16, 1 - genome.fertility),
    lifespan: lerp(42, 120, genome.longevity),
    crowdingTolerance: lerp(0.7, 1.35, genome.crowdingTolerance),
  }
}
