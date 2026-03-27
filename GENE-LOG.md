# gene log

This file tracks how genes are represented in the current build.

## Gene families

### Body
- height
- thoraxSize
- abdomenSize
- waistTightness
- neckLength
- headSize
- headShape

### Limbs
- legLengthFront
- legLengthMid
- legLengthRear
- legThickness
- armPresence
- armLength

### Motion
- uprightness
- bounce
- stepLift
- stepRate
- sway
- boldness

### Face
- eyeSize
- eyeSpacing
- antennaLength
- antennaCurl

### Color
- hueA / satA / valA
- hueB / satB / valB
- accentAmount
- monochromeTendency
- contrastTendency

### Life
- fertility
- longevity
- crowdingTolerance

## Runtime tracking
The game computes rolling population averages and surfaces the most drifted genes in the bottom readout. This is backed by `summarizeGenes()` in `src/sim/genetics.js` and is covered by tests in `src/sim/genetics.test.js`.
