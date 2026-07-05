# Project Skill: Loop Engineering for Document Driven Template

Agents must treat Nuxt Content under `docs/content/` as the Reality Source. Root-level files such as `STATE.md`, `LOOP.md`, and this file are harness-facing operational memory and shortcuts; they do not override Nuxt Content.

## Required Reading

Before implementation, read:

1. `docs/content/delivery/2.current-scope.md`
2. The target task under `docs/content/delivery/scopes/**/tasks/*.md`
3. `docs/content/delivery/3.implementation-flow.md`
4. Related design, operations, and maintenance docs
5. `docs/content/design/4.loop-engineering/` when changing loop behavior
6. `STATE.md` latest candidate item and verifier evidence

For Loop Engineering tasks, also read the task schema and status discipline in `docs/content/delivery/3.implementation-flow.md` before editing. The target task must be the approved task for the requested work, not just a nearby candidate.

## Pre-Implementation Stop Rules

Stop before implementation when the target task is missing any required schema field:

- `id`
- `status`
- `autonomy`
- `source_of_truth`
- `primary_area`
- `acceptance_criteria`
- `verification_commands`
- `handoff_conditions`
- `last_evidence`

Stop when task `status` is not actionable for the requested role, when `autonomy` does not allow the requested action, or when `verification_commands` or `handoff_conditions` are empty. Use `pnpm loop:validate-task <task-id>` for a machine check when the task has an ID.

For Loop Engineering tasks, run `pnpm loop:validate-task <task-id>` before editing. If it fails, stop and report the schema error instead of implementing.

After implementation, run `pnpm loop:validate-task <task-id>` again before reporting completion. If the task schema changed or other schema-managed task pages were touched, also run `pnpm loop:validate-tasks`.

## Doc-Code Mapping

| Reality Source | Primary Code Area | Verification |
| --- | --- | --- |
| `docs/content/design/3.application-design/1.web-app.md` | `apps/web/app/`, `apps/web/nuxt.config.ts` | `pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint` |
| `docs/content/design/3.application-design/2.server-api.md` | `apps/web/server/` | `pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint` |
| `docs/content/design/3.application-design/3.shared-contracts.md` | `apps/web/app/types/`, future `packages/shared/` | affected package typecheck |
| `docs/content/design/2.architecture/` | workspace layout and package boundaries | affected package typecheck/build |
| `docs/content/design/4.loop-engineering/` | `scripts/loop-harness.mjs`, `STATE.md`, `LOOP.md`, `.github/workflows/` | `node --check scripts/loop-harness.mjs`, loop dry run |
| `docs/content/operations/` | root scripts, package scripts, operational commands | run or validate the documented command |
| `docs/content/maintenance/` | state transition, verifier records, PR lifecycle | harness state inspection and relevant command evidence |
| `docs/content/delivery/` | scoped implementation tasks | task acceptance criteria plus affected checks |

## Maker Responsibilities

- Implement only a human-approved `STATE.md` candidate item in L2 or higher.
- Keep changes within the target task scope and outside the denylist.
- Record assumptions, changed files, commands attempted, and docs updates.
- If implementation changes Reality Source assumptions, update the relevant Nuxt Content doc.

## Verifier Responsibilities

- Use a context independent from the maker.
- Read the candidate item, diff, relevant Reality Source docs, and acceptance criteria.
- Run the documented commands; do not accept completion without evidence.
- Record command, result, and failure reason in `STATE.md` or the PR body.

## Verification Commands

- Loop harness syntax: `node --check scripts/loop-harness.mjs`
- Single task schema validation: `pnpm loop:validate-task <task-id>`
- Schema-managed task validation: `pnpm loop:validate-tasks`
- L1 analysis: `pnpm loop:l1`
- Docs typecheck: `pnpm --dir docs typecheck`
- Docs lint: `pnpm --dir docs lint`
- Docs build: `pnpm --dir docs build`
- Web typecheck: `pnpm --dir apps/web typecheck`
- Web lint: `pnpm --dir apps/web lint`
- Web build: `pnpm --dir apps/web build`

## Denylist

Do not automatically modify:

- `.env`, `.env.*`, `**/.env`, `**/.env.*`
- `**/*secret*`, `**/*credential*`, `**/*token*`
- `**/auth/**`, `**/authentication/**`
- deployment credentials and parameter files
- `apps/web/amplify.yml`, `docs/amplify.yml`
- `.github/workflows/*deploy*`
