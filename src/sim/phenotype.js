import { hsvToRgb, rgbToString } from '../utils/color.js'
import { lerp } from '../utils/math.js'

const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`
const BASE_VIEWPORT_HEIGHT = 900

export const derivePhenotype = (genome, worldHeight = BASE_VIEWPORT_HEIGHT) => {
  const viewportScale = Math.max(0.58, Math.min(1.05, worldHeight / BASE_VIEWPORT_HEIGHT))
  const scaleBias = lerp(0.74, 1.34, genome.bulk)
  const height = lerp(68, 296, genome.height) * viewportScale
  const bodyFusion = genome.bodyFusion
  const thoraxRadius = height * lerp(0.14, 0.29, genome.thoraxSize) * lerp(0.84, 1.2, genome.bulk)
  const abdomenRadius = height * lerp(0.15, 0.33, genome.abdomenSize) * lerp(0.82, 1.28, genome.bulk)
  const fusedBodyRadius = Math.max(thoraxRadius, abdomenRadius) * lerp(1.05, 1.5, bodyFusion) * scaleBias
  const headRadius = height * lerp(0.09, 0.25, genome.headSize)
  const neck = height * lerp(0.01, 0.11, genome.neckLength) * (1 - bodyFusion * 0.45)
  const upright = lerp(-0.22, 0.3, genome.uprightness)
  const bodySquareness = lerp(0.04, 0.5, genome.bodySquareness)
  const legs = {
    front: height * lerp(0.14, 0.54, genome.legLengthFront),
    mid: height * lerp(0.12, 0.48, genome.legLengthMid),
    rear: height * lerp(0.14, 0.58, genome.legLengthRear),
    thickness: lerp(1.8, 8.4, genome.legThickness) * viewportScale * lerp(0.8, 1.22, genome.bulk),
  }

  const diversity = (1 - genome.monochromeTendency) * (0.65 + genome.rainbowness * 0.9)
  const hueB = (genome.hueA + (genome.hueB - genome.hueA) * diversity * 0.8 + genome.rainbowness * 0.14) % 1
  const satA = lerp(0.02, 1, genome.satA)
  const satB = lerp(0.02, 1, genome.satB)
  const valA = lerp(0.06, 0.98, genome.valA)
  const valB = lerp(0.05, 0.95, genome.valB)
  const baseA = hsvToRgb(genome.hueA, satA, valA)
  const baseB = hsvToRgb(hueB, satB, valB)
  const accentHue = (genome.hueA + 0.2 + genome.pupilHueShift * 0.75 + genome.rainbowness * 0.12) % 1
  const eyeTone = hsvToRgb(accentHue, 0.26 + genome.accentAmount * 0.5 + genome.rainbowness * 0.16, 0.84 + genome.rainbowness * 0.12)
  const rainbowTone = hsvToRgb((genome.hueA + 0.33 + genome.rainbowness * 0.25) % 1, 0.45 + genome.rainbowness * 0.5, 0.5 + genome.rainbowness * 0.4)
  const shadow = rgba(baseA.r * 0.5, baseA.g * 0.48, baseA.b * 0.46, 0.8)

  const eyeStyleIndex = genome.eyeStyle < 0.33 ? 'round' : genome.eyeStyle < 0.66 ? 'anime' : 'lash'
  const eyePairs = genome.eyeCount > 0.9 ? 3 : genome.eyeCount > 0.58 ? 2 : 1
  const rainbowAlpha = 0.12 + genome.rainbowness * 0.42
  const legRaise = Math.max(legs.front, legs.mid, legs.rear) * lerp(0.34, 0.58, genome.uprightness)

  return {
    height,
    bodyFusion,
    bulk: scaleBias,
    thoraxRadius,
    abdomenRadius,
    fusedBodyRadius,
    headRadius,
    neck,
    upright,
    bodySquareness,
    legs,
    hasArms: genome.armPresence > 0.58,
    armLength: height * lerp(0.12, 0.38, genome.armLength),
    armMuscle: lerp(0.12, 0.54, genome.armMuscle),
    bouncePx: height * lerp(0.004, 0.06, genome.bounce),
    swayPx: height * lerp(0.004, 0.05, genome.sway),
    stepLiftPx: height * lerp(0.008, 0.16, genome.stepLift),
    walkHz: lerp(0.46, 2.2, genome.stepRate),
    blinkInterval: lerp(4.8, 1.1, genome.blinkRate),
    boldness: genome.boldness,
    eyeSize: headRadius * lerp(0.12, 0.42, genome.eyeSize),
    eyeSpacing: headRadius * lerp(0.12, 0.55, genome.eyeSpacing),
    eyeStyle: eyeStyleIndex,
    eyePairs,
    lashiness: genome.lashiness,
    antennaLength: height * lerp(0.08, 0.4, genome.antennaLength),
    antennaCurl: lerp(-0.26, 0.88, genome.antennaCurl),
    antennaFluff: genome.antennaFluff,
    hairiness: genome.hairiness,
    skinTexture: genome.skinTexture,
    silhouetteWidth: Math.max(fusedBodyRadius * 2.4, thoraxRadius + abdomenRadius + headRadius),
    legRaise,
    colors: {
      thorax: rgbToString(baseA),
      abdomen: rgbToString(baseB),
      limbs: rgbToString(baseB, 0.95),
      outline: 'rgba(14, 12, 8, 0.75)',
      eye: rgbToString(eyeTone),
      glow: rgbToString(eyeTone, 0.18 + genome.accentAmount * 0.18 + genome.rainbowness * 0.16),
      shadow,
      texture: rgba(baseA.r * 0.62 + 34, baseA.g * 0.6 + 28, baseA.b * 0.58 + 24, 0.2 + genome.skinTexture * 0.24),
      hair: rgba(245, 240, 228, 0.16 + genome.hairiness * 0.18),
      muscle: rgba(baseA.r, baseA.g, baseA.b, 0.55),
      rainbow: rgbToString(rainbowTone, rainbowAlpha),
    },
    fertilityCooldown: lerp(6.5, 16, 1 - genome.fertility),
    lifespan: lerp(42, 120, genome.longevity),
    crowdingTolerance: lerp(0.7, 1.35, genome.crowdingTolerance),
  }
}
