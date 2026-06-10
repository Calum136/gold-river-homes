# Gold River Homes - Project Documentation Index

> Proof-of-concept: Modular/Mini Home Total Cost & Mortgage Calculator
> Client: Gold River Homes (Chester Basin, NS)
> Deployment: Netlify (temporary) → live site later

## Documentation

- [Design Tokens](./design-tokens.md) — Colors, fonts, spacing extracted from supremehomes.ca
- [Architecture](./architecture.md) — Tech stack, file structure, component hierarchy
- [Calculator Logic](./calculator-logic.md) — Cost categories, formulas, default values
- [Decisions Log](./decisions.md) — Key decisions and rationale
- [Business Context](./business-context.md) — Client info, service area, product lines

## Visualization System (phased build plan)

- [Master Plan](./visualization/00-master-plan.md) — **read first**: locked architecture decisions, phase index, constraints
- [Phase 1 — Parametric Exterior](./visualization/01-parametric-exterior.md) — live SVG house reacting to every exterior option ✅
- [Phase 2 — Lot Visuals](./visualization/02-lot-visuals.md) — illustrated NS backdrops ✅ · real photo standards (owner-blocked)
- [Phase 3 — Asset Pipeline](./visualization/03-asset-pipeline.md) — Supreme Homes dealer asset request, naming, directories
- [Phase 4 — AI Render Library](./visualization/04-ai-render-library.md) — AI-edited exteriors (stopgap track only)
- [Phase 5 — Interior Rooms](./visualization/05-interior-rooms.md) — room-level finish preview (masked compositing → renders)
- [Phase 6 — Floor Plans](./visualization/06-floor-plans.md) — plan viewer with room hotspots
- [Phase 7 — Photoreal Pipeline](./visualization/07-photoreal-pipeline.md) — **the destination**: 3D render-stack → exact photoreal configurator
