export const hitTestCreature = (world, x, y) => {
  const groundY = world.height * 0.71
  let best = null
  let bestScore = Infinity

  for (const creature of world.creatures) {
    const centerY = groundY + creature.y - creature.phenotype.height * 0.5 - creature.phenotype.legRaise * 0.45
    const dx = x - creature.x
    const dy = y - centerY
    const radiusX = Math.max(creature.phenotype.silhouetteWidth * 0.6, creature.phenotype.headRadius * 2.2)
    const radiusY = creature.phenotype.height * (0.46 + creature.phenotype.bodyFusion * 0.12)
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
