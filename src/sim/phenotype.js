import { hsvToRgb, rgbToString } from '../utils/color.js'
import { lerp } from '../utils/math.js'

const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`
const BASE_VIEWPORT_HEIGHT = 900

export const derivePhenotype = (genome, worldHeight = BASE_VIEWPORT_HEIGHT) => {
  const viewportScale = Math.max(0.58, Math.min(1.05, worldHeight / BASE_VIEWPORT_HEIGHT))
  const height = lerp(84, 236, genome.height) * viewportScale
  const thoraxRadius = height * lerp(0.16, 0.25, genome.thoraxSize)
  const abdomenRadius = height * lerp(0.17, 0.29, genome.abdomenSize)
  const headRadius = height * lerp(0.11, 0.22, genome.headSize)
  const neck = height * lerp(0.02, 0.09, genome.neckLength)
  const upright = lerp(-0.16, 0.22, genome.uprightness)
  const bodySquareness = lerp(0.05, 0.42, genome.bodySquareness)
  const legs = {
    front: height * lerp(0.2, 0.42, genome.legLengthFront),
    mid: height * lerp(0.18, 0.36, genome.legLengthMid),
    rear: height * lerp(0.22, 0.46, genome.legLengthRear),
    thickness: lerp(2, 7, genome.legThickness) * viewportScale,
  }

  const diversity = 1 - genome.monochromeTendency
  const hueB = genome.hueA + (genome.hueB - genome.hueA) * diversity * 0.7
  const satA = lerp(0.02, 0.56, genome.satA)
  const satB = lerp(0.02, 0.48, genome.satB)
  const valA = lerp(0.08, 0.88, genome.valA)
  const valB = lerp(0.06, 0.82, genome.valB)
  const baseA = hsvToRgb(genome.hueA, satA, valA)
  const baseB = hsvToRgb(hueB, satB, valB)
  const eyeTone = hsvToRgb((genome.hueA + 0.52 + genome.accentAmount * 0.14) % 1, 0.22 + genome.accentAmount * 0.38, 0.92)
  const shadow = rgba(baseA.r * 0.5, baseA.g * 0.48, baseA.b * 0.46, 0.8)

  const eyeStyleIndex = genome.eyeStyle < 0.33 ? 'round' : genome.eyeStyle < 0.66 ? 'anime' : 'lash'

  return {
    height,
    thoraxRadius,
    abdomenRadius,
    headRadius,
    neck,
    upright,
    bodySquareness,
    legs,
    hasArms: genome.armPresence > 0.58,
    armLength: height * lerp(0.14, 0.34, genome.armLength),
    armMuscle: lerp(0.12, 0.48, genome.armMuscle),
    bouncePx: height * lerp(0.005, 0.055, genome.bounce),
    swayPx: height * lerp(0.004, 0.04, genome.sway),
    stepLiftPx: height * lerp(0.01, 0.12, genome.stepLift),
    walkHz: lerp(0.5, 2.1, genome.stepRate),
    boldness: genome.boldness,
    eyeSize: headRadius * lerp(0.16, 0.36, genome.eyeSize),
    eyeSpacing: headRadius * lerp(0.18, 0.48, genome.eyeSpacing),
    eyeStyle: eyeStyleIndex,
    lashiness: genome.lashiness,
    antennaLength: height * lerp(0.14, 0.34, genome.antennaLength),
    antennaCurl: lerp(-0.2, 0.7, genome.antennaCurl),
    antennaFluff: genome.antennaFluff,
    hairiness: genome.hairiness,
    skinTexture: genome.skinTexture,
    colors: {
      thorax: rgbToString(baseA),
      abdomen: rgbToString(baseB),
      limbs: rgbToString(baseB, 0.95),
      outline: 'rgba(14, 12, 8, 0.75)',
      eye: rgbToString(eyeTone),
      glow: rgbToString(eyeTone, 0.18 + genome.accentAmount * 0.18),
      shadow,
      texture: rgba(baseA.r * 0.8, baseA.g * 0.78, baseA.b * 0.76, 0.14 + genome.skinTexture * 0.18),
      hair: rgba(245, 240, 228, 0.16 + genome.hairiness * 0.18),
      muscle: rgba(baseA.r, baseA.g, baseA.b, 0.55),
    },
    fertilityCooldown: lerp(6.5, 16, 1 - genome.fertility),
    lifespan: lerp(42, 120, genome.longevity),
    crowdingTolerance: lerp(0.7, 1.35, genome.crowdingTolerance),
  }
}
