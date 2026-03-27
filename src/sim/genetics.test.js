import test from 'node:test'
import assert from 'node:assert/strict'
import { createRng } from '../utils/rng.js'
import { createAverageGenome, createRandomGenome, computeGeneAverages, mutateGenome, summarizeGenes } from './genetics.js'
import { createWorld, multiplyCreature, stepWorld } from './world.js'

test('mutated genomes stay normalized and differ from parent', () => {
  const rng = createRng('mut-test')
  const parent = createAverageGenome()
  const child = mutateGenome({
    parentGenome: parent,
    averages: parent,
    mutationStrength: 0.3,
    rng,
  })

  const diffs = Object.keys(parent).filter((key) => parent[key] !== child[key])
  assert.ok(diffs.length > 0)
  for (const value of Object.values(child)) {
    assert.ok(value >= 0 && value <= 1)
  }
})

test('population averages and summaries reflect drift', () => {
  const rng = createRng('summary-test')
  const creatures = Array.from({ length: 8 }, () => ({ genome: createRandomGenome(rng) }))
  const averages = computeGeneAverages(creatures)
  assert.equal(typeof averages.height, 'number')
  const summary = summarizeGenes(creatures)
  assert.ok(summary.length > 5)
  assert.ok(summary[0].key)
})

test('world births increase generations and keep gene logs populated', () => {
  const world = createWorld({ width: 900, height: 540, seed: 'world-test' })
  const startingPopulation = world.creatures.length
  multiplyCreature(world, world.creatures[0].id, {
    mutationStrength: 0.2,
    birthRate: 0.7,
    speed: 1,
    paused: false,
  })
  assert.ok(world.creatures.length > startingPopulation)

  for (let i = 0; i < 240; i += 1) {
    stepWorld(world, {
      mutationStrength: 0.2,
      birthRate: 1.1,
      speed: 1,
      paused: false,
    }, 1 / 30)
  }

  assert.ok(world.stats.geneAverages.length > 10)
  assert.ok(world.stats.maxGeneration >= 1)
})
