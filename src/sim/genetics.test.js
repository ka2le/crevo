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

test('clicked offspring force a few targeted mutations', () => {
  const rng = createRng('clicked-mutation-test')
  const parent = createAverageGenome()
  const child = mutateGenome({
    parentGenome: parent,
    averages: parent,
    mutationStrength: 0.2,
    rng,
    context: 'clicked',
  })

  const changed = Object.keys(parent).filter((key) => Math.abs(parent[key] - child[key]) > 0.01)
  assert.ok(changed.length >= 3)
})

test('out-of-band color drift is not strongly pulled back to the natural center', () => {
  const rng = createRng('out-band-color-test')
  const parent = createAverageGenome()
  parent.hueA = 0.42
  parent.hueB = 0.68
  parent.satA = 0.82
  parent.satB = 0.76
  parent.valA = 0.84
  parent.valB = 0.8
  parent.rainbowness = 0.88
  parent.monochromeTendency = 0.08

  const child = mutateGenome({
    parentGenome: parent,
    averages: createAverageGenome(),
    mutationStrength: 0.3,
    rng,
  })

  assert.ok(Math.abs(child.hueA - parent.hueA) < 0.12)
  assert.ok(Math.abs(child.satA - parent.satA) < 0.2)
  assert.ok(Math.abs(child.valA - parent.valA) < 0.2)
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

test('offspring blend mostly from parent with some donor influence', () => {
  const rng = createRng('secondary-parent-blend-test')
  const parent = createAverageGenome()
  const donor = createAverageGenome()
  donor.height = 1
  donor.bulk = 0

  const child = mutateGenome({
    parentGenome: parent,
    donorGenome: donor,
    averages: parent,
    mutationStrength: 0,
    rng,
    donorBlend: 0.15,
  })

  assert.ok(Math.abs(child.height - (parent.height * 0.85 + donor.height * 0.15)) < 0.02)
  assert.ok(Math.abs(child.bulk - (parent.bulk * 0.85 + donor.bulk * 0.15)) < 0.04)
})
