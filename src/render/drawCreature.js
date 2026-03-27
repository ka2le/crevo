export const drawCreature = (ctx, creature, groundY) => {
  const { phenotype } = creature
  const bob = Math.sin(creature.walkPhase) * phenotype.bouncePx
  const sway = Math.sin(creature.wobblePhase) * phenotype.swayPx
  const scaleIn = creature.age < 0 ? Math.max(0.4, 1 + creature.age * 0.5) : 1
  const stepA = Math.sin(creature.walkPhase)
  const stepB = Math.sin(creature.walkPhase + Math.PI)
  const liftA = Math.max(0, stepA) * phenotype.stepLiftPx
  const liftB = Math.max(0, stepB) * phenotype.stepLiftPx

  ctx.save()
  ctx.translate(creature.x, groundY + creature.y - bob)
  ctx.scale(creature.facing * scaleIn, scaleIn)
  ctx.rotate(phenotype.upright + sway * 0.005)

  const pelvisY = 0
  const abdomenY = pelvisY - phenotype.abdomenRadius * 0.78
  const waistY = abdomenY - phenotype.abdomenRadius * (0.7 - phenotype.bodySquareness * 0.4)
  const thoraxY = waistY - phenotype.thoraxRadius * 0.86
  const headY = thoraxY - phenotype.thoraxRadius * 0.88 - phenotype.neck - phenotype.headRadius * 0.82
  const shoulderY = thoraxY - phenotype.thoraxRadius * 0.12

  drawLegSet(ctx, phenotype, pelvisY, -1, liftA, 0.44)
  drawLegSet(ctx, phenotype, pelvisY, 1, liftB, 1)

  drawBodySegment(ctx, 0, abdomenY, phenotype.abdomenRadius * 1.12, phenotype.abdomenRadius * 0.88, phenotype.bodySquareness, phenotype.colors.abdomen)
  drawTextureDots(ctx, 0, abdomenY, phenotype.abdomenRadius * 0.9, phenotype.skinTexture, creature.id.length)
  drawBodySegment(ctx, 0, thoraxY, phenotype.thoraxRadius * 1.02, phenotype.thoraxRadius * 0.92, phenotype.bodySquareness * 0.85, phenotype.colors.thorax)
  drawTextureDots(ctx, 0, thoraxY, phenotype.thoraxRadius * 0.84, phenotype.skinTexture, creature.generation + 11)

  drawNeckBridge(ctx, phenotype, thoraxY, headY)

  if (phenotype.hasArms) {
    drawArms(ctx, phenotype, shoulderY, liftA, liftB)
  }

  drawBodySegment(ctx, 0, headY, phenotype.headRadius, phenotype.headRadius * 0.9, phenotype.bodySquareness * 0.5, phenotype.colors.thorax)
  drawFace(ctx, phenotype, headY)
  drawAntennae(ctx, phenotype, headY)

  if (phenotype.hairiness > 0.28) {
    drawBodyHair(ctx, phenotype, abdomenY, thoraxY)
  }

  if (creature.highlight > 0) {
    ctx.strokeStyle = `rgba(244, 240, 221, ${0.15 + creature.highlight * 0.5})`
    ctx.lineWidth = 2
    ellipse(ctx, 0, thoraxY, phenotype.thoraxRadius * 2.2, phenotype.height * 0.82)
    ctx.stroke()
  }

  ctx.restore()
}

const ellipse = (ctx, x, y, rx, ry) => {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
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

const drawBodySegment = (ctx, x, y, rx, ry, square, fill) => {
  ctx.fillStyle = fill
  if (square > 0.16) {
    roundedRect(ctx, x, y, rx * 2, ry * 2, Math.min(rx, ry) * (0.9 - square))
  } else {
    ellipse(ctx, x, y, rx, ry)
  }
  ctx.fill()
}

const drawTextureDots = (ctx, x, y, radius, amount, seed) => {
  if (amount < 0.08) return
  ctx.fillStyle = ctx.fillStyle = 'rgba(255,255,255,0)'
  const dots = 4 + Math.floor(amount * 12)
  for (let i = 0; i < dots; i += 1) {
    const angle = (i / dots) * Math.PI * 2 + seed * 0.13
    const distance = radius * (0.2 + ((i * 17) % 7) / 10)
    const px = x + Math.cos(angle) * distance * 0.62
    const py = y + Math.sin(angle) * distance * 0.42
    ctx.fillStyle = `rgba(255, 250, 240, ${0.04 + amount * 0.13})`
    ctx.beginPath()
    ctx.arc(px, py, Math.max(0.8, amount * 2.1), 0, Math.PI * 2)
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

const drawLegSet = (ctx, phenotype, pelvisY, sideDepth, lift, alpha) => {
  const anchors = [
    { x: -phenotype.thoraxRadius * 0.22, length: phenotype.legs.front, phase: lift },
    { x: 0, length: phenotype.legs.mid, phase: lift * 0.72 },
    { x: phenotype.abdomenRadius * 0.24, length: phenotype.legs.rear, phase: lift * 0.45 },
  ]

  for (let index = 0; index < anchors.length; index += 1) {
    const leg = anchors[index]
    const stride = (index - 1) * 8
    drawSingleLeg(ctx, phenotype, leg.x, pelvisY - index * 1.5, sideDepth, leg.length, leg.phase, stride, alpha)
  }
}

const drawSingleLeg = (ctx, phenotype, anchorX, anchorY, sideDepth, length, lift, stride, alpha) => {
  const kneeX = anchorX + sideDepth * (10 + stride * 0.1)
  const kneeY = anchorY + length * 0.34 - lift * 0.32
  const footX = anchorX + sideDepth * (22 + stride * 0.26)
  const footY = anchorY + length + lift

  ctx.strokeStyle = phenotype.colors.limbs.replace(/0\.95\)/, `${0.28 + alpha * 0.62})`)
  ctx.lineWidth = phenotype.legs.thickness * alpha
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(anchorX, anchorY)
  ctx.lineTo(kneeX, kneeY)
  ctx.lineTo(footX, footY)
  ctx.stroke()
}

const drawArms = (ctx, phenotype, shoulderY, liftA, liftB) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1.8, phenotype.legs.thickness * 0.72)
  ctx.lineCap = 'round'
  const arm = phenotype.armLength
  for (const [index, side] of [-1, 1].entries()) {
    const lift = index === 0 ? liftA : liftB
    const shoulderX = side * phenotype.thoraxRadius * 0.9
    const elbowX = side * (phenotype.thoraxRadius + arm * 0.42)
    const elbowY = shoulderY + arm * 0.22 - lift * 0.12
    const handX = side * (phenotype.thoraxRadius + arm * 0.74)
    const handY = shoulderY + arm * 0.68

    ctx.beginPath()
    ctx.moveTo(shoulderX, shoulderY)
    ctx.lineTo(elbowX, elbowY)
    ctx.lineTo(handX, handY)
    ctx.stroke()

    ctx.fillStyle = phenotype.colors.muscle
    ctx.beginPath()
    ctx.arc(side * (phenotype.thoraxRadius + arm * 0.18), shoulderY + arm * 0.14, Math.max(3, arm * phenotype.armMuscle * 0.28), 0, Math.PI * 2)
    ctx.arc(side * (phenotype.thoraxRadius + arm * 0.46), shoulderY + arm * 0.4, Math.max(2, arm * phenotype.armMuscle * 0.22), 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawFace = (ctx, phenotype, headY) => {
  const leftX = -phenotype.eyeSpacing
  const rightX = phenotype.eyeSpacing
  ctx.fillStyle = phenotype.colors.glow
  ctx.beginPath()
  ctx.arc(leftX, headY, phenotype.eyeSize * 1.6, 0, Math.PI * 2)
  ctx.arc(rightX, headY, phenotype.eyeSize * 1.6, 0, Math.PI * 2)
  ctx.fill()

  if (phenotype.eyeStyle === 'anime') {
    drawAnimeEye(ctx, leftX, headY, phenotype, -1)
    drawAnimeEye(ctx, rightX, headY, phenotype, 1)
  } else if (phenotype.eyeStyle === 'lash') {
    drawRoundEye(ctx, leftX, headY, phenotype)
    drawRoundEye(ctx, rightX, headY, phenotype)
    drawLashes(ctx, leftX, headY, phenotype, -1)
    drawLashes(ctx, rightX, headY, phenotype, 1)
  } else {
    drawRoundEye(ctx, leftX, headY, phenotype)
    drawRoundEye(ctx, rightX, headY, phenotype)
  }
}

const drawRoundEye = (ctx, x, y, phenotype) => {
  ctx.fillStyle = phenotype.colors.eye
  ctx.beginPath()
  ctx.arc(x, y, phenotype.eyeSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(7, 9, 8, 0.85)'
  ctx.beginPath()
  ctx.arc(x, y, phenotype.eyeSize * 0.42, 0, Math.PI * 2)
  ctx.fill()
}

const drawAnimeEye = (ctx, x, y, phenotype, side) => {
  ctx.fillStyle = phenotype.colors.eye
  ctx.beginPath()
  ctx.moveTo(x - phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.quadraticCurveTo(x, y - phenotype.eyeSize * 1.1, x + phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.quadraticCurveTo(x, y + phenotype.eyeSize * 0.9, x - phenotype.eyeSize * 0.9, y + phenotype.eyeSize * 0.15)
  ctx.fill()
  ctx.strokeStyle = 'rgba(7, 9, 8, 0.85)'
  ctx.lineWidth = Math.max(1, phenotype.eyeSize * 0.14)
  ctx.beginPath()
  ctx.moveTo(x - phenotype.eyeSize * 0.9, y)
  ctx.quadraticCurveTo(x, y - phenotype.eyeSize * 1.08, x + phenotype.eyeSize * 0.9, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + side * phenotype.eyeSize * 0.12, y + phenotype.eyeSize * 0.14, phenotype.eyeSize * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(7, 9, 8, 0.82)'
  ctx.fill()
}

const drawLashes = (ctx, x, y, phenotype, side) => {
  ctx.strokeStyle = phenotype.colors.eye
  ctx.lineWidth = Math.max(0.8, phenotype.eyeSize * 0.11)
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath()
    ctx.moveTo(x + i * phenotype.eyeSize * 0.4, y - phenotype.eyeSize * 0.68)
    ctx.lineTo(x + i * phenotype.eyeSize * 0.55 + side * phenotype.lashiness * 3, y - phenotype.eyeSize * (1.05 + Math.abs(i) * 0.12))
    ctx.stroke()
  }
}

const drawAntennae = (ctx, phenotype, headY) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1, phenotype.legs.thickness * 0.24)
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    const startX = side * phenotype.headRadius * 0.26
    const startY = headY - phenotype.headRadius * 0.5
    const midX = side * phenotype.antennaLength * 0.24
    const midY = headY - phenotype.antennaLength * (0.42 + phenotype.antennaCurl * 0.12)
    const endX = side * phenotype.antennaLength * (0.52 + phenotype.antennaCurl * 0.18)
    const endY = headY - phenotype.antennaLength

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
