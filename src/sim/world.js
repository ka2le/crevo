import { createAverageGenome, createRandomGenome, computeGeneAverages, mutateGenome, summarizeGenes } from './genetics.js'
import { derivePhenotype } from './phenotype.js'
import { createRng } from '../utils/rng.js'
import { clamp, lerp } from '../utils/math.js'

const BASE_TARGET_POP = 30
const HARD_CAP = 72

const createIdFactory = () => {
  let index = 0
  return () => `creature-${index++}`
}

const makeCreature = ({ id, genome, x, generation, bornAt, facing, rng, worldHeight }) => ({
  id,
  genome,
  phenotype: derivePhenotype(genome),
  x,
  y: rng.range(-worldHeight * 0.05, worldHeight * 0.05),
  facing,
  walkPhase: rng.next() * Math.PI * 2,
  wobblePhase: rng.next() * Math.PI * 2,
  age: 0,
  generation,
  reproductionTimer: 0,
  maturityTimer: lerp(8, 20, 1 - genome.fertility),
  deathBurst: 0,
  bornAt,
  highlight: 0,
  alive: true,
})

export const createWorld = ({ width = 1280, height = 720, seed = 'crevo' } = {}) => {
  const rng = createRng(seed)
  const nextId = createIdFactory()
  const world = {
    seed,
    width,
    height,
    time: 0,
    creatures: [],
    particles: [],
    stats: {
      births: 0,
      deaths: 0,
      population: 0,
      maxGeneration: 0,
      geneAverages: [],
    },
    rng,
    nextId,
  }

  for (let index = 0; index < 16; index += 1) {
    const genome = index < 10 ? mutateGenome({
      parentGenome: createAverageGenome(),
      averages: createAverageGenome(),
      mutationStrength: 0.8,
      rng,
    }) : createRandomGenome(rng)

    world.creatures.push(
      makeCreature({
        id: nextId(),
        genome,
        x: rng.range(width * 0.12, width * 0.88),
        generation: 0,
        bornAt: 0,
        facing: rng.chance(0.5) ? -1 : 1,
        rng,
        worldHeight: height,
      }),
    )
  }

  recomputeStats(world)
  return world
}

const spawnChild = ({ world, parent, controls, x, generationBoost = 1 }) => {
  if (world.creatures.length >= HARD_CAP) return null
  const averages = computeGeneAverages(world.creatures)
  const genome = mutateGenome({
    parentGenome: parent?.genome ?? createAverageGenome(),
    averages,
    mutationStrength: controls.mutationStrength,
    rng: world.rng,
  })

  const creature = makeCreature({
    id: world.nextId(),
    genome,
    x: clamp(x ?? parent?.x ?? world.width * 0.5, 32, world.width - 32),
    generation: (parent?.generation ?? 0) + generationBoost,
    bornAt: world.time,
    facing: world.rng.chance(0.5) ? -1 : 1,
    rng: world.rng,
    worldHeight: world.height,
  })
  creature.highlight = 1
  creature.age = -1.2
  world.creatures.push(creature)
  world.stats.births += 1
  return creature
}

const spawnParticleBurst = (world, x, y, color) => {
  for (let index = 0; index < 14; index += 1) {
    world.particles.push({
      x,
      y,
      vx: world.rng.normal(0, 1.6),
      vy: world.rng.range(-5.8, -1.1),
      life: world.rng.range(0.35, 0.9),
      ttl: world.rng.range(0.35, 0.9),
      size: world.rng.range(2, 8),
      color,
    })
  }
}

export const explodeCreature = (world, creatureId) => {
  const target = world.creatures.find((creature) => creature.id === creatureId)
  if (!target) return false
  target.alive = false
  target.deathBurst = 1
  spawnParticleBurst(world, target.x, world.height * 0.71 + target.y, target.phenotype.colors.abdomen)
  world.stats.deaths += 1
  return true
}

export const multiplyCreature = (world, creatureId, controls) => {
  const target = world.creatures.find((creature) => creature.id === creatureId)
  if (!target) return null
  target.highlight = 1
  const offset = world.rng.range(-48, 48)
  return spawnChild({ world, parent: target, controls, x: target.x + offset })
}

const spontaneousBirths = (world, controls) => {
  const population = world.creatures.length
  if (!population) {
    spawnChild({ world, parent: null, controls, x: world.width * 0.5, generationBoost: 0 })
    return
  }
  const pressure = population / BASE_TARGET_POP
  const birthChance = clamp((0.3 + controls.birthRate * 0.55) * (1.15 - pressure * 0.5), 0.02, 0.82)
  if (!world.rng.chance(birthChance * 0.018)) return
  const fertile = world.creatures.filter((creature) => creature.age > creature.maturityTimer && creature.reproductionTimer <= 0)
  if (!fertile.length) return
  const parent = world.rng.pick(fertile)
  spawnChild({ world, parent, controls, x: parent.x + world.rng.range(-64, 64) })
  parent.reproductionTimer = parent.phenotype.fertilityCooldown * lerp(0.85, 1.2, world.rng.next())
}

const updateCreature = (creature, world, controls, dt) => {
  creature.age += dt
  creature.highlight = Math.max(0, creature.highlight - dt * 1.3)
  creature.reproductionTimer -= dt
  creature.walkPhase += dt * creature.phenotype.walkHz * controls.speed * Math.PI * 2
  creature.wobblePhase += dt * (0.8 + creature.genome.boldness)

  const margin = 36
  const speed = lerp(18, 66, creature.genome.stepRate) * controls.speed
  creature.x += creature.facing * speed * dt

  const laneCenter = world.height * 0.71
  const laneVariance = world.height * 0.1
  const desiredY = Math.sin(creature.x * 0.01 + creature.wobblePhase * 0.35) * laneVariance * 0.45 + Math.cos(creature.x * 0.004 + creature.generation) * laneVariance * 0.2
  creature.y += (desiredY - creature.y) * Math.min(1, dt * 1.8)
  creature.y = clamp(creature.y, -laneVariance, laneVariance)

  if (creature.x < margin) {
    creature.x = margin
    creature.facing = 1
  } else if (creature.x > world.width - margin) {
    creature.x = world.width - margin
    creature.facing = -1
  } else if (world.rng.chance(0.0025 * dt * 60 * (0.35 + creature.genome.boldness))) {
    creature.facing *= -1
  }

  const populationPressure = world.creatures.length / (BASE_TARGET_POP * creature.phenotype.crowdingTolerance)
  const ageRatio = Math.max(0, creature.age / creature.phenotype.lifespan)
  const deathRisk = clamp(ageRatio * ageRatio * 0.018 + Math.max(0, populationPressure - 1) * 0.0028, 0, 0.15)
  if (creature.age > 6 && world.rng.chance(deathRisk * dt * 60)) {
    creature.alive = false
    spawnParticleBurst(world, creature.x, laneCenter + creature.y, creature.phenotype.colors.thorax)
    world.stats.deaths += 1
  }
}

const updateParticles = (world, dt) => {
  world.particles = world.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt * 60,
      y: particle.y + particle.vy * dt * 60,
      vy: particle.vy + 0.22 * dt * 60,
      life: particle.life - dt,
    }))
    .filter((particle) => particle.life > 0)
}

export const stepWorld = (world, controls, dt) => {
  if (controls.paused) return world

  world.time += dt * controls.speed
  spontaneousBirths(world, controls)

  for (const creature of world.creatures) {
    updateCreature(creature, world, controls, dt * controls.speed)
  }

  world.creatures = world.creatures.filter((creature) => creature.alive)
  updateParticles(world, dt * controls.speed)
  recomputeStats(world)
  return world
}

export const resizeWorld = (world, width, height) => {
  world.width = width
  world.height = height
  for (const creature of world.creatures) {
    creature.x = clamp(creature.x, 24, width - 24)
  }
}

export const recomputeStats = (world) => {
  world.stats.population = world.creatures.length
  world.stats.maxGeneration = world.creatures.reduce((max, creature) => Math.max(max, creature.generation), 0)
  world.stats.geneAverages = summarizeGenes(world.creatures)
}

export const createAverageCreature = (world) => {
  const creature = makeCreature({
    id: world.nextId(),
    genome: createAverageGenome(),
    x: world.width * 0.5,
    generation: 0,
    bornAt: world.time,
    facing: world.rng.chance(0.5) ? -1 : 1,
    rng: world.rng,
    worldHeight: world.height,
  })
  creature.highlight = 1
  world.creatures.push(creature)
  recomputeStats(world)
}

export const createRandomCreature = (world) => {
  const creature = makeCreature({
    id: world.nextId(),
    genome: createRandomGenome(world.rng),
    x: world.rng.range(64, world.width - 64),
    generation: 0,
    bornAt: world.time,
    facing: world.rng.chance(0.5) ? -1 : 1,
    rng: world.rng,
    worldHeight: world.height,
  })
  creature.highlight = 1
  world.creatures.push(creature)
  recomputeStats(world)
}
