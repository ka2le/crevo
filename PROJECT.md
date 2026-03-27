# crevo project notes

## Goal
Build a static-page creature evolution sandbox called `crevo` where upright ant-like creatures wander in front of a backdrop, mutate through inheritance, and can be interactively cloned or exploded.

## Current implementation
- React + Vite scaffold created
- Fullscreen canvas renderer with minimal top HUD
- Procedural creature generation from genome -> phenotype pipeline
- Animated side-view creatures with body/limb/head/eye/antenna variation
- Autonomous movement, births, aging, and deaths
- Click clone / right-click explode / long-press explode
- Gene drift readout based on rolling population averages
- Automated tests for mutation normalization and simulation drift

## Next likely improvements
- Use the user-provided background image instead of the painted placeholder backdrop
- Better creature silhouettes and part variety
- Creature inspector card for selected critter
- More explicit gene/family history logging and charts
- Sound / juice / better explosion feedback
- Deploy to GitHub Pages
