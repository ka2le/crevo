import { create } from 'zustand'
import {
  createAverageCreature,
  createRandomCreature,
  createWorld,
  explodeCreature,
  multiplyCreature,
  recomputeStats,
  resizeWorld,
  stepWorld,
} from '../sim/world.js'

const makeWorld = () => createWorld({ seed: 'crevo-seed-1' })

export const useCrevoStore = create((set, get) => ({
  world: makeWorld(),
  controls: {
    mutationStrength: 0.18,
    birthRate: 0.72,
    speed: 1,
    paused: false,
  },
  mode: 'multiply',
  pointer: { x: 0, y: 0, hovered: null },
  stats: {
    population: 0,
    births: 0,
    deaths: 0,
    maxGeneration: 0,
    geneAverages: [],
  },
  setControl: (key, value) =>
    set((state) => ({ controls: { ...state.controls, [key]: value } })),
  togglePause: () => set((state) => ({ controls: { ...state.controls, paused: !state.controls.paused } })),
  setMode: (mode) => set({ mode }),
  tick: (dt) => {
    const world = get().world
    stepWorld(world, get().controls, dt)
    set({
      world,
      stats: {
        population: world.stats.population,
        births: world.stats.births,
        deaths: world.stats.deaths,
        maxGeneration: world.stats.maxGeneration,
        geneAverages: world.stats.geneAverages,
      },
    })
  },
  resize: (width, height) => {
    const world = get().world
    resizeWorld(world, width, height)
    set({ world })
  },
  setPointer: (pointer) => set({ pointer }),
  multiplyCreature: (id) => {
    const state = get()
    multiplyCreature(state.world, id, state.controls)
    recomputeStats(state.world)
    set({ world: state.world, stats: { ...state.world.stats } })
  },
  explodeCreature: (id) => {
    const state = get()
    explodeCreature(state.world, id)
    recomputeStats(state.world)
    set({ world: state.world, stats: { ...state.world.stats } })
  },
  spawnAverageCreature: () => {
    const world = get().world
    createAverageCreature(world)
    set({ world, stats: { ...world.stats } })
  },
  spawnRandomCreature: () => {
    const world = get().world
    createRandomCreature(world)
    set({ world, stats: { ...world.stats } })
  },
  resetWorld: () => {
    const world = makeWorld()
    set({
      world,
      stats: { ...world.stats },
      pointer: { x: 0, y: 0, hovered: null },
    })
  },
}))

const initialWorld = useCrevoStore.getState().world
useCrevoStore.setState({ stats: { ...initialWorld.stats } })
