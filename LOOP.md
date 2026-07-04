# Loop Engineering Pipeline

This root file is a compact harness guide. The Reality Source for the full design is Nuxt Content:

- `docs/content/design/4.loop-engineering/1.overall-architecture.md`
- `docs/content/design/4.loop-engineering/2.harness-design.md`
- `docs/content/design/4.loop-engineering/3.autonomy-tiers.md`
- `docs/content/design/4.loop-engineering/4.maker-verifier.md`
- `docs/content/operations/10.loop-engineering.md`
- `docs/content/maintenance/1.state-management.md`
- `docs/content/maintenance/2.pr-automation.md`

## Pipeline

1. Update Nuxt Content.
2. Run L1 impact analysis.
3. Record candidate items in `STATE.md`.
4. Human approves a candidate for L2.
5. Maker implements the approved item.
6. Verifier runs commands and records evidence.
7. Docs are updated if implementation changes Reality Source assumptions.
8. L2/L3 prepares a pull request.

## Commands

- L1: `pnpm loop:l1`
- L2 planning gate: `pnpm loop:l2`
- L3 gate: `pnpm loop:l3`
- Docs verifier: `pnpm loop:verify:docs`
- Web verifier: `pnpm loop:verify:web`

## Guardrails

- `max_attempts`: 3
- Budget cap: $10/run
- L1 writes only `STATE.md`
- L2 requires explicit approved candidate item
- L3 remains disabled until the readiness score and PR automation criteria are met

