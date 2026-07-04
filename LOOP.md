# Loop Engineering Design

Loop Engineering keeps documentation and implementation synchronized through a controlled maker-checker workflow. The first operating mode is L1 report-only.

## Cadence

- On push: run when Markdown files under `docs/` change.
- Scheduled triage: run daily at 00:00 UTC.
- Manual: run through GitHub Actions `workflow_dispatch`.

## Autonomy Tiers

| Tier | Name | Allowed Actions | Human Gate |
| --- | --- | --- | --- |
| L1 | Report only | Detect changed docs, analyze likely impact, append proposals to `STATE.md` | Required before any implementation |
| L2 | Semi-automatic | Create a branch and PR for a human-approved `STATE.md` item | Required before merge |
| L3 | Full loop | Implement, verify, and open PRs for eligible low-risk items | Required before enabling |

Current tier: L1.

## L1 Workflow

1. Detect changed Markdown files under `docs/`.
2. Map changed docs to likely implementation areas using `SKILL.md`.
3. Append an evidence-backed triage entry to `STATE.md`.
4. Do not edit implementation files.
5. Do not claim completion of any implementation task.

## L2 Promotion Procedure

Move from L1 to L2 only after all conditions are met:

- At least three L1 runs completed without malformed `STATE.md` entries.
- Readiness score in `STATE.md` is 20/25 or higher.
- A human approves a specific `STATE.md` Active Item for implementation.
- The approved item has clear affected docs, expected implementation paths, and verification commands.
- The verifier can run the required commands in CI or locally.

For L2, the loop may create a branch and PR, but may not merge it. The PR must include verifier evidence.

## Maker-Checker Separation

Implementer:

- Performs approved synchronization work.
- Uses `SKILL.md` for doc-code mapping and verification commands.
- Records assumptions, changed files, and attempted commands.

Verifier:

- Runs in an independent context.
- Reads the diff and relevant docs.
- Runs lint, typecheck, build, or task-specific checks.
- Requires concrete command evidence before accepting completion.

Verifier Theater is prohibited: no item can be marked resolved without verification command results or an explicit, evidence-backed reason that the command cannot run.

## Handoff Triggers

Escalate to a human and stop autonomous retries when any condition occurs:

- The same item reaches `max_attempts: 3`.
- Required changes touch a denylisted path.
- The loop would exceed the budget cap.
- Docs conflict and priority rules in `SKILL.md` do not resolve the conflict.
- Verification fails for the same reason twice.
- A required dependency install, credential, external service, or deployment permission is unavailable.
- The proposed change expands scope beyond `delivery/current-scope`.

## Guardrails

- `max_attempts`: 3 per item.
- Budget cap: $10/run hard limit.
- Token budget: 120k input tokens and 20k output tokens per run.
- Default branch protection: the loop must not push directly to the default branch in L2 or higher.
- L1 write surface: `STATE.md` only.

## Denylist

The loop must not automatically modify these paths or path patterns:

- `.env`
- `.env.*`
- `**/.env`
- `**/.env.*`
- `**/*secret*`
- `**/*credential*`
- `**/*token*`
- `**/auth/**`
- `**/authentication/**`
- `.github/dependabot.yml`
- `.github/workflows/*deploy*`
- `apps/web/amplify.yml`
- `docs/amplify.yml`
- `infra/**/parameters*`
- `infra/**/secrets*`

If a required change touches a denylisted path, append the analysis to `STATE.md` and hand off to a human.

