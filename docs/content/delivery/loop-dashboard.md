---
title: Loop Dashboard
description: Human-facing latest status for Loop Engineering.
navigation:
  icon: i-lucide-activity
---

# Loop Dashboard

## Current Turn

| Field | Value |
| --- | --- |
| Run ID | `local-20260705085305-l2` |
| Mode | L2 gate |
| Status | ready |
| Autonomy Gate | approved |
| Owner Role | human + maker |
| Approved Item | gha-28725482289-04 |

## Intent

Maker may implement within the approved scope and verifier must record command evidence.

## Gate State

**approved**

## Next Human Action

Review the current turn, keep implementation inside the approved primary area, and require verifier evidence before resolution.

## Source Docs

- docs/content/delivery/scopes/2.loop-engineering-turn-foundation/tasks/02.le-02-loop-state-separation.md

## Scope Boundary

| Boundary | Rule |
| --- | --- |
| Reality Source | `docs/content/` |
| Compatibility Mirror | `STATE.md` |
| Machine State | `.loop/state.json` |
| Run Logs | `.loop/runs/*.md` |
| Dashboard | `docs/content/delivery/loop-dashboard.md` |
| Denylist Reminder | Do not read or write secrets, credentials, tokens, `.env`, or `.env.*` values. |

## Verification

- No verifier evidence recorded for the latest run.

## Handoff Queue

- No handoff condition recorded for the latest run.

## Candidate Items

| ID | Stage | Approval | Attempts | Source Docs | Impact Area |
| --- | --- | --- | ---: | --- | --- |
| gha-28725482289-04 | L1_ANALYZED | required | 0 | `docs/content/delivery/scopes/2.loop-engineering-turn-foundation/tasks/02.le-02-loop-state-separation.md` | delivery scope |
| gha-28735108593-47 | L1_ANALYZED | required | 0 | `docs/content/operations/9.environment-info.md` | operations |
| gha-28735108593-46 | L1_ANALYZED | required | 0 | `docs/content/operations/8.ad-hoc.md` | operations |
| gha-28735108593-45 | L1_ANALYZED | required | 0 | `docs/content/operations/7.monthly.md` | operations |
| gha-28735108593-44 | L1_ANALYZED | required | 0 | `docs/content/operations/6.weekly.md` | operations |
| gha-28735108593-43 | L1_ANALYZED | required | 0 | `docs/content/operations/5.daily.md` | operations |
| gha-28735108593-42 | L1_ANALYZED | required | 0 | `docs/content/operations/4.initial.md` | operations |
| gha-28735108593-41 | L1_ANALYZED | required | 0 | `docs/content/operations/3.documentation.md` | operations |
| gha-28735108593-40 | L1_ANALYZED | required | 0 | `docs/content/operations/2.overview.md` | operations |
| gha-28735108593-39 | L1_ANALYZED | required | 0 | `docs/content/operations/10.loop-engineering.md` | operations |
| gha-28735108593-38 | L1_ANALYZED | required | 0 | `docs/content/operations/1.getting-started.md` | operations |
| gha-28735108593-37 | L1_ANALYZED | required | 0 | `docs/content/maintenance/2.pr-automation.md` | maintenance |
| gha-28735108593-36 | L1_ANALYZED | required | 0 | `docs/content/maintenance/1.state-management.md` | maintenance |
| gha-28735108593-35 | L1_ANALYZED | required | 0 | `docs/content/design/4.loop-engineering/4.maker-verifier.md` | loop engineering design |
| gha-28735108593-34 | L1_ANALYZED | required | 0 | `docs/content/design/4.loop-engineering/3.autonomy-tiers.md` | loop engineering design |
| gha-28735108593-33 | L1_ANALYZED | required | 0 | `docs/content/design/4.loop-engineering/2.harness-design.md` | loop engineering design |
| gha-28735108593-32 | L1_ANALYZED | required | 0 | `docs/content/design/4.loop-engineering/1.overall-architecture.md` | loop engineering design |
| gha-28735108593-31 | L1_ANALYZED | required | 0 | `docs/content/design/3.application-design/3.shared-contracts.md` | shared contracts |
| gha-28735108593-30 | L1_ANALYZED | required | 0 | `docs/content/design/3.application-design/2.server-api.md` | server API design |
| gha-28735108593-29 | L1_ANALYZED | required | 0 | `docs/content/design/3.application-design/1.web-app.md` | web app design |

## Recent Runs

- `.loop/runs/local-20260705085305-l2.md`
- `.loop/runs/local-20260705085234-l2.md`
