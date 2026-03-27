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

  ctx.fillStyle = '#111411'
  ctx.fillRect(0, 0, width, height)

  const backdrop = getBackdrop()
  if (backdrop?.complete) {
    ctx.globalAlpha = 1
    ctx.drawImage(backdrop, 0, 0, width, height)
    ctx.globalAlpha = 1
  }
  drawBottomShade(ctx, width, height)
  const groundY = height * 0.71

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

const drawBottomShade = (ctx, width, height) => {
  const shade = ctx.createLinearGradient(0, height * 0.64, 0, height)
  shade.addColorStop(0, 'rgba(10, 12, 10, 0)')
  shade.addColorStop(0.5, 'rgba(9, 11, 9, 0.14)')
  shade.addColorStop(1, 'rgba(5, 6, 5, 0.38)')
  ctx.fillStyle = shade
  ctx.fillRect(0, height * 0.6, width, height * 0.4)
}

