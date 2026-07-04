# Project Skill: Document Driven Template

This file defines project-local operating knowledge for agents working in this repository.

## Core Rule

Docs are the source of truth. Before changing implementation, read the relevant `docs/content/` page and prefer the smallest implementation that satisfies the documented scope. If implementation behavior changes the agreement, update the corresponding doc in the same task or record the needed doc change in `STATE.md`.

## Documentation Ownership

- `docs/content/design/`: ideal design, architecture, responsibility boundaries, long-term principles.
- `docs/content/operations/`: repeatable procedures, setup, daily/weekly/monthly operations, environment notes.
- `docs/content/delivery/`: current scope, task plans, acceptance criteria, verification expectations.
- `STATE.md`: loop memory, triage results, readiness score, watchlist, and unresolved synchronization items.
- `LOOP.md`: loop operating model, guardrails, autonomy tier, budget, handoff rules.

When docs conflict, implementation priority is:

1. `docs/content/delivery/2.current-scope.md`
2. A specific delivery task under `docs/content/delivery/scopes/`
3. `docs/content/design/`
4. `docs/content/operations/`

## Doc-Code Mapping

Use this initial mapping when analyzing impact:

| Documentation Area | Implementation Area | Verification |
| --- | --- | --- |
| `docs/content/design/3.application-design/1.web-app.md` | `apps/web/app/`, `apps/web/nuxt.config.ts` | `pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint` |
| `docs/content/design/3.application-design/2.server-api.md` | `apps/web/server/` | `pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint` |
| `docs/content/design/3.application-design/3.shared-contracts.md` | `apps/web/app/types/`, future `packages/shared/` | Typecheck for affected package |
| `docs/content/design/2.architecture/` | workspace layout, `pnpm-workspace.yaml`, app boundaries | root script review plus package typechecks |
| `docs/content/operations/` | `package.json`, `docs/package.json`, `apps/web/package.json`, deployment config | Run the documented command or record why unavailable |
| `docs/content/delivery/` | task-specific files in `apps/`, `docs/`, future `packages/` and `infra/` | Acceptance criteria plus package checks |

## Build And Test Commands

Run only the commands relevant to the changed area, and record command output evidence in the final report.

- Docs typecheck: `pnpm --dir docs typecheck`
- Docs lint: `pnpm --dir docs lint`
- Docs build: `pnpm --dir docs build`
- Web typecheck: `pnpm --dir apps/web typecheck`
- Web lint: `pnpm --dir apps/web lint`
- Web build: `pnpm --dir apps/web build`
- L1 loop report: `pnpm loop:l1`

If dependencies are missing, install only after human approval. Do not treat an unrun command as proof.

## Maker-Checker Protocol

Implementer responsibilities:

- Read `SKILL.md`, `LOOP.md`, and relevant docs before editing code.
- Sync docs to code or code to docs within the documented scope.
- Keep changes outside denylisted paths.
- Record assumptions and commands run.

Verifier responsibilities:

- Use an independent context from the implementer.
- Re-read `SKILL.md`, `LOOP.md`, the changed docs, and the diff.
- Run the relevant verification commands.
- Reject completion if command evidence is absent.
- Check that docs and implementation agree with acceptance criteria.

The verifier must not accept "looks correct" or summaries without command output as evidence.

## Safety Rules

- Do not automatically edit `.env`, `.env.*`, credentials, tokens, secrets, authentication configuration, or deployment credentials.
- Do not widen scope beyond `delivery/current-scope` without recording a proposed doc update.
- Do not add new docs pages when an existing page can own the content.
- Do not make destructive git changes without explicit human approval.

