import config from '../config.js'
import { clamp, lerp } from '../utils/math.js'

export const drawCreature = (ctx, creature, groundY) => {
  const { phenotype } = creature
  const stepA = Math.sin(creature.walkPhase)
  const stepB = Math.sin(creature.walkPhase + Math.PI)
  const bob = Math.sin(creature.walkPhase) * phenotype.bouncePx
  const sway = Math.sin(creature.wobblePhase) * phenotype.swayPx
  const scaleIn = creature.age < 0 ? Math.max(0.4, 1 + creature.age * 0.5) : 1
  const gaitEnergy = clamp((Math.abs(stepA) + Math.abs(stepB)) * 0.5)
  const liftA = Math.max(0, stepA) * phenotype.stepLiftPx
  const liftB = Math.max(0, stepB) * phenotype.stepLiftPx
  const headTilt = Math.sin(creature.headTiltPhase) * (0.018 + gaitEnergy * 0.01) * creature.headTiltDirection
  const torsoLean = stepA * 0.012
  const blink = computeBlinkAmount(creature.blinkProgress)

  ctx.save()
  ctx.translate(creature.x, groundY + creature.y - bob - phenotype.legRaise)
  ctx.scale(creature.facing * scaleIn, scaleIn)
  ctx.rotate(phenotype.upright + sway * 0.005 + torsoLean)

  const pelvisY = 0
  const fused = phenotype.bodyFusion > 0.58
  const abdomenY = pelvisY - phenotype.abdomenRadius * 0.78
  const waistY = abdomenY - phenotype.abdomenRadius * (0.7 - phenotype.bodySquareness * 0.4) * (1 - phenotype.bodyFusion * 0.7)
  const thoraxY = waistY - phenotype.thoraxRadius * (0.86 - phenotype.bodyFusion * 0.35)
  const fusedBodyY = (abdomenY + thoraxY) * 0.5
  const bodyCenterY = fused ? fusedBodyY : thoraxY
  const headY = bodyCenterY - (fused ? phenotype.fusedBodyRadius * 0.72 : phenotype.thoraxRadius * 0.88) - phenotype.neck - phenotype.headRadius * 0.82
  const shoulderY = bodyCenterY - phenotype.thoraxRadius * 0.12

  drawLegSet(ctx, phenotype, pelvisY, stepA, stepB, liftA, liftB)

  if (fused) {
    drawFusedBody(ctx, phenotype, fusedBodyY, creature)
  } else {
    drawBodySegment(ctx, 0, abdomenY, phenotype.abdomenRadius * 1.12 * phenotype.bulk, phenotype.abdomenRadius * 0.88 * phenotype.bulk, phenotype.bodySquareness, phenotype.colors.abdomen, creature.highlight, creature.generation)
    drawTextureDots(ctx, 0, abdomenY, phenotype.abdomenRadius * 0.96, phenotype.skinTexture, creature.id.length, phenotype.colors.texture)
    drawBodySegment(ctx, 0, thoraxY, phenotype.thoraxRadius * 1.02 * phenotype.bulk, phenotype.thoraxRadius * 0.92 * phenotype.bulk, phenotype.bodySquareness * 0.85, phenotype.colors.thorax, creature.highlight, creature.generation + 11)
    drawTextureDots(ctx, 0, thoraxY, phenotype.thoraxRadius * 0.92, phenotype.skinTexture, creature.generation + 11, phenotype.colors.texture)
    drawNeckBridge(ctx, phenotype, thoraxY, headY)
  }

  if (phenotype.hasArms) {
    drawArms(ctx, phenotype, shoulderY, stepA, stepB, gaitEnergy)
  }

  ctx.save()
  ctx.translate(0, headY)
  ctx.rotate(headTilt)
  drawBodySegment(ctx, 0, 0, phenotype.headRadius, phenotype.headRadius * (0.84 + phenotype.bodyFusion * 0.14), phenotype.bodySquareness * 0.5, phenotype.colors.thorax, creature.highlight, creature.generation + 21)
  drawFace(ctx, phenotype, 0, blink)
  drawAntennae(ctx, phenotype, 0, headTilt, gaitEnergy)
  ctx.restore()

  if (phenotype.hairiness > 0.2) {
    drawBodyHair(ctx, phenotype, fused ? fusedBodyY : abdomenY, fused ? fusedBodyY : thoraxY)
  }

  ctx.restore()
}

const computeBlinkAmount = (progress) => {
  if (progress <= 0) return 0
  const t = clamp(1 - progress)
  return Math.sin(t * Math.PI)
}

const organicBlob = (ctx, x, y, rx, ry, seed = 0) => {
  const points = 18
  ctx.beginPath()
  for (let i = 0; i <= points; i += 1) {
    const t = (i / points) * Math.PI * 2
    const wobble = 1 + Math.sin(t * 3 + seed * 0.17) * 0.06 + Math.cos(t * 5 + seed * 0.11) * 0.04
    const px = x + Math.cos(t) * rx * wobble
    const py = y + Math.sin(t) * ry * wobble
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

const roundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x - width / 2 + r, y - height / 2)
  ctx.lineTo(x + width / 2 - r, y - height / 2)
  ctx.quadraticCurveTo(x + width / 2, y - height / 2, x + width / 2, y - height / 2 + r)
  ctx.lineTo(x + width / 2, y + height / 2 - r)
  ctx.quadraticCurveTo(x + width / 2, y + height / 2, x + width / 2 - r, y + height / 2)
  ctx.lineTo(x - width / 2 + r, y + height / 2)
  ctx.quadraticCurveTo(x - width / 2, y + height / 2, x - width / 2, y + height / 2 - r)
  ctx.lineTo(x - width / 2, y - height / 2 + r)
  ctx.quadraticCurveTo(x - width / 2, y - height / 2, x - width / 2 + r, y - height / 2)
  ctx.closePath()
}

const buildBodyPath = (ctx, x, y, rx, ry, square, seed) => {
  if (square > 0.16) {
    roundedRect(ctx, x, y, rx * 2, ry * 2, Math.min(rx, ry) * (0.9 - square))
  } else {
    organicBlob(ctx, x, y, rx, ry, seed)
  }
}

const drawBodySegment = (ctx, x, y, rx, ry, square, fill, highlight = 0, seed = 0) => {
  if (highlight > 0) {
    ctx.save()
    ctx.shadowColor = `rgba(244, 240, 221, ${config.visuals.highlight.edgeGlowAlpha + highlight * config.visuals.highlight.edgeGlowBoost})`
    ctx.shadowBlur = config.visuals.highlight.edgeGlowBlur * highlight
    ctx.strokeStyle = `rgba(244, 240, 221, ${0.08 + highlight * 0.24})`
    ctx.lineWidth = 1.5
    buildBodyPath(ctx, x, y, rx, ry, square, seed)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = fill
  buildBodyPath(ctx, x, y, rx, ry, square, seed)
  ctx.fill()
}

const drawFusedBody = (ctx, phenotype, centerY, creature) => {
  drawBodySegment(
    ctx,
    0,
    centerY,
    phenotype.fusedBodyRadius * 1.12,
    phenotype.fusedBodyRadius * 0.88,
    phenotype.bodySquareness * 0.7,
    phenotype.colors.abdomen,
    creature.highlight,
    creature.generation + 101,
  )
  drawBodySegment(
    ctx,
    phenotype.fusedBodyRadius * 0.06,
    centerY - phenotype.fusedBodyRadius * 0.08,
    phenotype.fusedBodyRadius * 0.92,
    phenotype.fusedBodyRadius * 0.74,
    phenotype.bodySquareness * 0.45,
    phenotype.colors.thorax,
    creature.highlight * 0.7,
    creature.generation + 121,
  )
  drawTextureDots(ctx, 0, centerY, phenotype.fusedBodyRadius * 0.9, phenotype.skinTexture, creature.id.length + 31, phenotype.colors.texture)
  if (phenotype.colors.rainbow !== 'rgba(0, 0, 0, 0)') {
    ctx.fillStyle = phenotype.colors.rainbow
    ctx.beginPath()
    ctx.ellipse(0, centerY - phenotype.fusedBodyRadius * 0.08, phenotype.fusedBodyRadius * 0.78, phenotype.fusedBodyRadius * 0.48, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawTextureDots = (ctx, x, y, radius, amount, seed, color) => {
  if (amount < 0.08) return
  const dots = 5 + Math.floor(amount * 14)
  for (let i = 0; i < dots; i += 1) {
    const angle = (i / dots) * Math.PI * 2 + seed * 0.13
    const distance = radius * (0.18 + ((i * 17) % 7) / 9)
    const px = x + Math.cos(angle) * distance * 0.62
    const py = y + Math.sin(angle) * distance * 0.42
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px, py, Math.max(1.1, amount * 2.7), 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawNeckBridge = (ctx, phenotype, thoraxY, headY) => {
  ctx.strokeStyle = phenotype.colors.shadow
  ctx.lineWidth = Math.max(2, phenotype.headRadius * 0.24)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, thoraxY - phenotype.thoraxRadius * 0.55)
  ctx.lineTo(0, headY + phenotype.headRadius * 0.52)
  ctx.stroke()
}

const drawLegSet = (ctx, phenotype, pelvisY, stepA, stepB, liftA, liftB) => {
  drawSingleLeg(ctx, phenotype, -phenotype.thoraxRadius * 0.14, pelvisY, -1, phenotype.legs.rear, liftFarValue(liftB, phenotype.bodyFusion), stepB, 0.45)
  drawSingleLeg(ctx, phenotype, -phenotype.thoraxRadius * 0.02, pelvisY - 2, -0.45, phenotype.legs.mid, liftFarValue(liftA, phenotype.bodyFusion), stepA, 0.72)
  drawSingleLeg(ctx, phenotype, phenotype.thoraxRadius * 0.14, pelvisY + 1, 1, phenotype.legs.front, liftNearValue(liftA, phenotype.bodyFusion), stepA, 1)
}

const liftFarValue = (lift, fusion) => lift * (0.75 + fusion * 0.1)
const liftNearValue = (lift, fusion) => lift * (0.9 + fusion * 0.1)

const drawSingleLeg = (ctx, phenotype, anchorX, anchorY, sideDepth, length, lift, stepValue, alpha) => {
  const stride = sideDepth * (10 + phenotype.bodyFusion * 8)
  const swing = stepValue * (7 + phenotype.stepLiftPx * 0.08)
  const forward = 18 + phenotype.bodyFusion * 12
  const kneeX = anchorX + stride * 0.35 + sideDepth * forward * 0.42 + swing * 0.18
  const kneeY = anchorY + length * 0.34 - lift * 0.32
  const footX = anchorX + sideDepth * forward + swing
  const footY = anchorY + length + lift

  ctx.strokeStyle = phenotype.colors.limbs.replace(/0\.95\)/, `${0.2 + alpha * 0.66})`)
  ctx.lineWidth = phenotype.legs.thickness * alpha
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(anchorX, anchorY)
  ctx.lineTo(kneeX, kneeY)
  ctx.lineTo(footX, footY)
  ctx.stroke()
}

const drawArms = (ctx, phenotype, shoulderY, stepA, stepB, gaitEnergy) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1.8, phenotype.legs.thickness * 0.72)
  ctx.lineCap = 'round'
  const arm = phenotype.armLength
  for (const [index, side] of [-1, 1].entries()) {
    const armSwing = (index === 0 ? stepB : stepA) * (arm * 0.16 + gaitEnergy * 4)
    const shoulderX = side * phenotype.thoraxRadius * 0.9
    const elbowX = side * (phenotype.thoraxRadius + arm * 0.42) + armSwing * 0.4
    const elbowY = shoulderY + arm * 0.22 - Math.abs(armSwing) * 0.08
    const handX = side * (phenotype.thoraxRadius + arm * 0.74) + armSwing
    const handY = shoulderY + arm * 0.68 + Math.abs(armSwing) * 0.05

    ctx.beginPath()
    ctx.moveTo(shoulderX, shoulderY)
    ctx.lineTo(elbowX, elbowY)
    ctx.lineTo(handX, handY)
    ctx.stroke()

    ctx.fillStyle = phenotype.colors.muscle
    ctx.beginPath()
    ctx.arc(side * (phenotype.thoraxRadius + arm * 0.18) + armSwing * 0.16, shoulderY + arm * 0.14, Math.max(3, arm * phenotype.armMuscle * 0.28), 0, Math.PI * 2)
    ctx.arc(side * (phenotype.thoraxRadius + arm * 0.46) + armSwing * 0.34, shoulderY + arm * 0.4, Math.max(2, arm * phenotype.armMuscle * 0.22), 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawFace = (ctx, phenotype, headY, blink = 0) => {
  const rows = phenotype.eyePairs === 3 ? [-0.6, 0, 0.6] : phenotype.eyePairs === 2 ? [-0.34, 0.34] : [0]
  for (const row of rows) {
    const y = headY + row * phenotype.eyeSize * 1.45
    const spacingScale = phenotype.eyePairs === 1 ? 1 : 0.68 + Math.abs(row) * 0.12
    const leftX = -phenotype.eyeSpacing * spacingScale
    const rightX = phenotype.eyeSpacing * spacingScale
    const open = lerp(1, 0.08, blink)
    ctx.fillStyle = phenotype.colors.glow
    ctx.beginPath()
    ctx.ellipse(leftX, y, phenotype.eyeSize * 1.6, phenotype.eyeSize * 1.6 * Math.max(0.16, open), 0, 0, Math.PI * 2)
    ctx.ellipse(rightX, y, phenotype.eyeSize * 1.6, phenotype.eyeSize * 1.6 * Math.max(0.16, open), 0, 0, Math.PI * 2)
    ctx.fill()

    if (phenotype.eyeStyle === 'anime') {
      drawAnimeEye(ctx, leftX, y, phenotype, -1, open)
      drawAnimeEye(ctx, rightX, y, phenotype, 1, open)
    } else if (phenotype.eyeStyle === 'lash') {
      drawRoundEye(ctx, leftX, y, phenotype, open)
      drawRoundEye(ctx, rightX, y, phenotype, open)
      drawLashes(ctx, leftX, y, phenotype, -1, open)
      drawLashes(ctx, rightX, y, phenotype, 1, open)
    } else {
      drawRoundEye(ctx, leftX, y, phenotype, open)
      drawRoundEye(ctx, rightX, y, phenotype, open)
    }
  }
}

const drawRoundEye = (ctx, x, y, phenotype, open = 1) => {
  const eyeHeight = phenotype.eyeSize * Math.max(0.12, open)
  ctx.fillStyle = phenotype.colors.eye
  ctx.beginPath()
  ctx.ellipse(x, y, phenotype.eyeSize, eyeHeight, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(7, 9, 8, 0.85)'
  ctx.beginPath()
  ctx.ellipse(x, y, phenotype.eyeSize * 0.42, eyeHeight * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()

  if (open < 0.22) {
    ctx.strokeStyle = 'rgba(7, 9, 8, 0.78)'
    ctx.lineWidth = Math.max(1, phenotype.eyeSize * 0.12)
    ctx.beginPath()
    ctx.moveTo(x - phenotype.eyeSize * 0.86, y)
    ctx.lineTo(x + phenotype.eyeSize * 0.86, y)
    ctx.stroke()
  }
}

const drawAnimeEye = (ctx, x, y, phenotype, side, open = 1) => {
  const lidHeight = phenotype.eyeSize * lerp(0.18, 1.1, open)
  ctx.fillStyle = phenotype.colors.eye
  ctx.beginPath()
  ctx.moveTo(x - phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.quadraticCurveTo(x, y - lidHeight, x + phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.quadraticCurveTo(x, y + phenotype.eyeSize * Math.max(0.18, open * 0.9), x - phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.fill()
  ctx.strokeStyle = 'rgba(7, 9, 8, 0.85)'
  ctx.lineWidth = Math.max(1, phenotype.eyeSize * 0.14)
  ctx.beginPath()
  ctx.moveTo(x - phenotype.eyeSize * 0.9, y)
  ctx.quadraticCurveTo(x, y - lidHeight, x + phenotype.eyeSize * 0.9, y)
  ctx.stroke()
  if (open > 0.2) {
    ctx.beginPath()
    ctx.arc(x + side * phenotype.eyeSize * 0.12, y + phenotype.eyeSize * 0.14, phenotype.eyeSize * 0.28 * open, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(7, 9, 8, 0.82)'
    ctx.fill()
  }
}

const drawLashes = (ctx, x, y, phenotype, side, open = 1) => {
  ctx.strokeStyle = phenotype.colors.eye
  ctx.lineWidth = Math.max(0.8, phenotype.eyeSize * 0.11)
  const lashLift = phenotype.eyeSize * lerp(0.18, 0.68, open)
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath()
    ctx.moveTo(x + i * phenotype.eyeSize * 0.4, y - lashLift)
    ctx.lineTo(x + i * phenotype.eyeSize * 0.55 + side * phenotype.lashiness * 3, y - phenotype.eyeSize * (0.6 + open * 0.45 + Math.abs(i) * 0.12))
    ctx.stroke()
  }
}

const drawAntennae = (ctx, phenotype, headY, headTilt = 0, gaitEnergy = 0) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1, phenotype.legs.thickness * 0.24)
  ctx.lineCap = 'round'
  const wigglePhase = gaitEnergy * 0.9 + headTilt * 18
  for (const side of [-1, 1]) {
    const startX = side * phenotype.headRadius * 0.26
    const startY = headY - phenotype.headRadius * 0.5
    const wiggle = Math.sin(wigglePhase + side * 0.9) * (2.6 + phenotype.antennaLength * 0.04)
    const swayX = headTilt * phenotype.antennaLength * 3.8 + gaitEnergy * side * 1.2 + wiggle
    const midX = side * phenotype.antennaLength * 0.24 + swayX * 0.45
    const midY = headY - phenotype.antennaLength * (0.42 + phenotype.antennaCurl * 0.12) + Math.cos(wigglePhase + side) * 1.2
    const endX = side * phenotype.antennaLength * (0.52 + phenotype.antennaCurl * 0.18) + swayX
    const endY = headY - phenotype.antennaLength + Math.sin(wigglePhase + side * 1.7) * 1.6

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.quadraticCurveTo(midX, midY, endX, endY)
    ctx.stroke()

    if (phenotype.antennaFluff > 0.32) {
      drawAntennaFluff(ctx, startX, startY, endX, endY, phenotype, side)
    }
  }
}

const drawAntennaFluff = (ctx, startX, startY, endX, endY, phenotype, side) => {
  ctx.strokeStyle = phenotype.colors.hair
  ctx.lineWidth = 1
  const hairs = 3 + Math.floor(phenotype.antennaFluff * 7)
  for (let i = 1; i < hairs; i += 1) {
    const t = i / hairs
    const x = startX + (endX - startX) * t
    const y = startY + (endY - startY) * t
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + side * (2 + phenotype.antennaFluff * 8), y - 3 - i)
    ctx.stroke()
  }
}

const drawBodyHair = (ctx, phenotype, abdomenY, thoraxY) => {
  ctx.strokeStyle = phenotype.colors.hair
  ctx.lineWidth = 1
  const hairs = 5 + Math.floor(phenotype.hairiness * 12)
  for (let i = 0; i < hairs; i += 1) {
    const side = i % 2 === 0 ? -1 : 1
    const anchorY = i % 3 === 0 ? abdomenY : thoraxY
    const anchorX = side * (i % 3 === 0 ? phenotype.abdomenRadius * 0.8 : phenotype.thoraxRadius * 0.72)
    ctx.beginPath()
    ctx.moveTo(anchorX, anchorY + i)
    ctx.lineTo(anchorX + side * (3 + phenotype.hairiness * 9), anchorY - 3 + i * 0.6)
    ctx.stroke()
  }
}
