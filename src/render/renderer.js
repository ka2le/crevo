import { drawCreature } from './drawCreature.js'

let cachedBackdrop = null

const getBackdrop = () => {
  if (typeof Image === 'undefined') return null
  if (!cachedBackdrop) {
    cachedBackdrop = new Image()
    cachedBackdrop.src = `${import.meta.env.BASE_URL}crevo-background.png`
  }
  return cachedBackdrop
}

export const renderWorld = ({ ctx, world, width, height, pointer }) => {
  ctx.clearRect(0, 0, width, height)

  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#4d623f')
  sky.addColorStop(0.35, '#768b57')
  sky.addColorStop(0.78, '#1d261b')
  sky.addColorStop(1, '#121711')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  const backdrop = getBackdrop()
  if (backdrop?.complete) {
    ctx.globalAlpha = 0.34
    ctx.drawImage(backdrop, 0, 0, width, height)
    ctx.globalAlpha = 1
  }

  drawBackdrop(ctx, width, height)
  const groundY = height * 0.78
  drawGround(ctx, width, height, groundY)

  for (const creature of world.creatures) {
    drawCreature(ctx, creature, groundY)
  }

  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.ttl)
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  if (pointer.hovered) {
    const hovered = world.creatures.find((creature) => creature.id === pointer.hovered)
    if (hovered) {
      ctx.strokeStyle = 'rgba(244, 240, 221, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(hovered.x, groundY - hovered.phenotype.height * 0.5, hovered.phenotype.headRadius * 2.2, hovered.phenotype.height * 0.72, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

const drawBackdrop = (ctx, width, height) => {
  ctx.save()
  ctx.globalAlpha = 0.25
  for (let index = 0; index < 5; index += 1) {
    const y = height * (0.18 + index * 0.08)
    ctx.fillStyle = `rgba(15, 18, 13, ${0.1 + index * 0.03})`
    ctx.beginPath()
    ctx.moveTo(0, y + 42)
    for (let x = 0; x <= width + 80; x += 80) {
      const peak = Math.sin(x * 0.01 + index * 0.7) * 18 + Math.cos(x * 0.005 + index) * 12
      ctx.lineTo(x, y + peak)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

const drawGround = (ctx, width, height, groundY) => {
  const soil = ctx.createLinearGradient(0, groundY - 30, 0, height)
  soil.addColorStop(0, 'rgba(53, 60, 32, 0.8)')
  soil.addColorStop(0.22, 'rgba(50, 42, 29, 0.92)')
  soil.addColorStop(1, 'rgba(17, 17, 13, 1)')
  ctx.fillStyle = soil
  ctx.fillRect(0, groundY - 18, width, height - groundY + 18)

  ctx.strokeStyle = 'rgba(192, 227, 139, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  for (let x = 0; x <= width; x += 22) {
    ctx.lineTo(x, groundY + Math.sin(x * 0.02) * 4)
  }
  ctx.stroke()
}
