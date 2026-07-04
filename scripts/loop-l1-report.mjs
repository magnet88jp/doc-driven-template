#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const statePath = path.join(root, 'STATE.md')
const budgetUsd = Number.parseFloat(process.env.LOOP_BUDGET_USD || '10')
const estimatedCostUsd = Number.parseFloat(process.env.LOOP_ESTIMATED_COST_USD || '0')
const maxAttempts = Number.parseInt(process.env.LOOP_MAX_ATTEMPTS || '3', 10)

if (estimatedCostUsd > budgetUsd) {
  throw new Error(`Loop budget exceeded: estimated $${estimatedCostUsd} > cap $${budgetUsd}`)
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function safeGit(args) {
  try {
    return git(args)
  } catch {
    return ''
  }
}

function getChangedDocs() {
  const eventName = process.env.GITHUB_EVENT_NAME || ''
  const before = process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE_SHA || ''
  const after = process.env.GITHUB_SHA || process.env.AFTER_SHA || 'HEAD'

  let changed = ''
  if (eventName === 'push' && before && !/^0+$/.test(before)) {
    changed = safeGit(['diff', '--name-only', before, after])
  } else if (eventName === 'push' && before && /^0+$/.test(before)) {
    changed = safeGit(['ls-files', 'docs/**/*.md'])
  } else if (eventName === 'schedule' || eventName === 'workflow_dispatch') {
    changed = safeGit(['ls-files', 'docs/**/*.md'])
  } else {
    changed = safeGit(['diff', '--name-only', 'HEAD'])
  }

  return changed
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.startsWith('docs/') && file.endsWith('.md'))
}

function classify(file) {
  const rules = [
    {
      match: 'docs/content/design/3.application-design/1.web-app.md',
      area: 'web app design',
      implementation: '`apps/web/app/`, `apps/web/nuxt.config.ts`',
      checks: '`pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint`'
    },
    {
      match: 'docs/content/design/3.application-design/2.server-api.md',
      area: 'server API design',
      implementation: '`apps/web/server/`',
      checks: '`pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint`'
    },
    {
      match: 'docs/content/design/3.application-design/3.shared-contracts.md',
      area: 'shared contracts',
      implementation: '`apps/web/app/types/`, future `packages/shared/`',
      checks: 'affected package typecheck'
    },
    {
      match: 'docs/content/design/2.architecture/',
      area: 'architecture',
      implementation: '`pnpm-workspace.yaml`, app/package boundaries',
      checks: 'root script review plus affected package typechecks'
    },
    {
      match: 'docs/content/operations/',
      area: 'operations',
      implementation: '`package.json`, package scripts, deployment config',
      checks: 'run or validate the documented command'
    },
    {
      match: 'docs/content/delivery/',
      area: 'delivery scope',
      implementation: 'task-specific files under `apps/`, `docs/`, future `packages/` and `infra/`',
      checks: 'acceptance criteria plus affected package checks'
    },
    {
      match: 'docs/content/design/',
      area: 'design',
      implementation: 'implementation area named by the design page',
      checks: 'affected package lint/typecheck/build'
    }
  ]

  return rules.find((rule) => file === rule.match || file.startsWith(rule.match)) || {
    area: 'documentation',
    implementation: 'no direct implementation mapping',
    checks: '`pnpm --dir docs typecheck`, `pnpm --dir docs lint`'
  }
}

function makeEntry(files) {
  const now = new Date().toISOString()
  const runId = process.env.GITHUB_RUN_ID ? `gha-${process.env.GITHUB_RUN_ID}` : `local-${now.replace(/[-:.TZ]/g, '').slice(0, 14)}`
  const source = process.env.GITHUB_EVENT_NAME || 'local'
  const branch = safeGit(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown'
  const head = safeGit(['rev-parse', '--short', 'HEAD']) || 'unknown'

  const items = files.map((file) => ({ file, meta: classify(file) }))
  const summary = items.map(({ file, meta }) => `- ${file}: ${meta.area}; likely implementation: ${meta.implementation}; suggested checks: ${meta.checks}`).join('\n')

  const impact = summary || '- No changed Markdown files under `docs/` were detected.'
  const actions = files.length
    ? [
        '- Human reviews the mapped implementation areas and promotes specific items to L2 only if scope and verification commands are clear.',
        '- Verifier must run the suggested checks before any item is marked resolved.'
      ].join('\n')
    : '- No implementation action proposed.'

  return [
    '',
    `### ${runId}`,
    '',
    `- Timestamp: ${now}`,
    '- Mode: L1 report only',
    `- Trigger: ${source}`,
    `- Branch: ${branch}`,
    `- HEAD: ${head}`,
    `- Changed docs: ${files.length || 0}`,
    `- Budget cap: $${budgetUsd}/run`,
    `- Estimated cost: $${estimatedCostUsd}`,
    `- Max attempts: ${maxAttempts}`,
    '',
    '#### Impact Analysis',
    '',
    impact,
    '',
    '#### Proposed Next Actions',
    '',
    actions,
    '',
    '#### Evidence',
    '',
    '- Detection command source: git diff or git ls-files fallback inside `scripts/loop-l1-report.mjs`.',
    '- L1 guardrail honored: only `STATE.md` is updated by this loop.',
    ''
  ].join('\n')
}

if (!existsSync(statePath)) {
  throw new Error('STATE.md is required before running the L1 loop.')
}

const files = getChangedDocs()
const current = readFileSync(statePath, 'utf8')
const updated = current.replace(
  /- Last loop run: .*/,
  `- Last loop run: ${new Date().toISOString()}`
) + makeEntry(files)

writeFileSync(statePath, updated)
console.log(`L1 report appended to STATE.md for ${files.length} docs file(s).`)
