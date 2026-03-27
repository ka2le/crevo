export const drawCreature = (ctx, creature, groundY) => {
  const { phenotype } = creature
  const bob = Math.sin(creature.walkPhase) * phenotype.bouncePx
  const sway = Math.sin(creature.wobblePhase) * phenotype.swayPx
  const scaleIn = creature.age < 0 ? Math.max(0.4, 1 + creature.age * 0.5) : 1
  const lift = Math.max(0, Math.sin(creature.walkPhase) * phenotype.stepLiftPx)

  ctx.save()
  ctx.translate(creature.x, groundY + creature.y - bob)
  ctx.scale(creature.facing * scaleIn, scaleIn)
  ctx.rotate(phenotype.upright + sway * 0.005)

  const hipY = -phenotype.legs.rear - phenotype.abdomenRadius * 0.25
  const thoraxY = hipY - phenotype.thoraxRadius * 1.15
  const headY = thoraxY - phenotype.thoraxRadius - phenotype.neck - phenotype.headRadius * 0.55

  const legAlpha = 0.52
  drawLegPair(ctx, phenotype, hipY, 1, -1, lift, legAlpha)
  drawLegPair(ctx, phenotype, hipY - phenotype.thoraxRadius * 0.35, 0.86, 0, lift * 0.8, legAlpha)

  ctx.fillStyle = phenotype.colors.abdomen
  ellipse(ctx, 0, hipY, phenotype.abdomenRadius * 1.08, phenotype.abdomenRadius * 0.82)
  ctx.fill()

  ctx.fillStyle = phenotype.colors.thorax
  ellipse(ctx, 0, thoraxY, phenotype.thoraxRadius, phenotype.thoraxRadius * 0.88)
  ctx.fill()

  drawLegPair(ctx, phenotype, hipY + 2, 1, 1, lift, 1)
  drawLegPair(ctx, phenotype, hipY - phenotype.thoraxRadius * 0.32, 0.9, 0.12, lift * 0.8, 1)

  if (phenotype.hasArms) {
    drawArms(ctx, phenotype, thoraxY + phenotype.thoraxRadius * 0.12, lift)
  }

  ctx.fillStyle = phenotype.colors.thorax
  ellipse(ctx, 0, headY, phenotype.headRadius, phenotype.headRadius * 0.88)
  ctx.fill()

  drawFace(ctx, phenotype, headY)
  drawAntennae(ctx, phenotype, headY)

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

const drawLegPair = (ctx, phenotype, hipY, spread, sideBias, lift, alpha) => {
  const upper = phenotype.legs.rear * 0.52
  const lower = phenotype.legs.rear * 0.58
  const liftOffset = sideBias === 1 ? lift : -lift * 0.65
  const x = phenotype.abdomenRadius * 0.3 * spread

  ctx.strokeStyle = phenotype.colors.limbs.replace(/0\.95\)/, `${0.45 + alpha * 0.4})`)
  ctx.lineWidth = phenotype.legs.thickness * alpha
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, hipY)
  ctx.lineTo(x + 10 * sideBias, hipY + upper * 0.42)
  ctx.lineTo(x + 18 * sideBias, hipY + upper + lower + liftOffset)
  ctx.stroke()
}

const drawArms = (ctx, phenotype, shoulderY, lift) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1.8, phenotype.legs.thickness * 0.72)
  ctx.lineCap = 'round'
  const arm = phenotype.armLength
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * phenotype.thoraxRadius * 0.72, shoulderY)
    ctx.lineTo(side * (phenotype.thoraxRadius + arm * 0.42), shoulderY + arm * 0.3 - lift * 0.15)
    ctx.lineTo(side * (phenotype.thoraxRadius + arm * 0.62), shoulderY + arm * 0.65)
    ctx.stroke()
  }
}

const drawFace = (ctx, phenotype, headY) => {
  ctx.fillStyle = phenotype.colors.glow
  ctx.beginPath()
  ctx.arc(-phenotype.eyeSpacing, headY, phenotype.eyeSize * 1.6, 0, Math.PI * 2)
  ctx.arc(phenotype.eyeSpacing, headY, phenotype.eyeSize * 1.6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = phenotype.colors.eye
  ctx.beginPath()
  ctx.arc(-phenotype.eyeSpacing, headY, phenotype.eyeSize, 0, Math.PI * 2)
  ctx.arc(phenotype.eyeSpacing, headY, phenotype.eyeSize, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(7, 9, 8, 0.85)'
  ctx.beginPath()
  ctx.arc(-phenotype.eyeSpacing, headY, phenotype.eyeSize * 0.42, 0, Math.PI * 2)
  ctx.arc(phenotype.eyeSpacing, headY, phenotype.eyeSize * 0.42, 0, Math.PI * 2)
  ctx.fill()
}

const drawAntennae = (ctx, phenotype, headY) => {
  ctx.strokeStyle = phenotype.colors.limbs
  ctx.lineWidth = Math.max(1, phenotype.legs.thickness * 0.24)
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * phenotype.headRadius * 0.26, headY - phenotype.headRadius * 0.5)
    ctx.quadraticCurveTo(
      side * phenotype.antennaLength * 0.24,
      headY - phenotype.antennaLength * (0.42 + phenotype.antennaCurl * 0.12),
      side * phenotype.antennaLength * (0.52 + phenotype.antennaCurl * 0.18),
      headY - phenotype.antennaLength,
    )
    ctx.stroke()
  }
}
