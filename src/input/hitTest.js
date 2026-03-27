export const hitTestCreature = (world, x, y) => {
  const groundY = world.height * 0.71
  let best = null
  let bestScore = Infinity

  for (const creature of world.creatures) {
    const centerY = groundY + creature.y - creature.phenotype.height * 0.48
    const dx = x - creature.x
    const dy = y - centerY
    const radiusX = creature.phenotype.headRadius * 2.1
    const radiusY = creature.phenotype.height * 0.62
    const norm = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY)
    if (norm <= 1 && norm < bestScore) {
      best = creature.id
      bestScore = norm
    }
  }

  return best
}

export const mapPortraitPointer = (clientX, clientY, width) => ({
  x: clientY,
  y: width - clientX,
})
