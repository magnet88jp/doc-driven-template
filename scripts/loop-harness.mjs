#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const statePath = path.join(root, 'STATE.md')
const command = process.argv[2] || 'l1'
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

function ensureState() {
  if (!existsSync(statePath)) {
    throw new Error('STATE.md is required before running Loop Engineering.')
  }
}

function getChangedDocs() {
  const eventName = process.env.GITHUB_EVENT_NAME || ''
  const before = process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE_SHA || ''
  const after = process.env.GITHUB_SHA || process.env.AFTER_SHA || 'HEAD'

  let changed = ''
  if (eventName === 'push' && before && !/^0+$/.test(before)) {
    changed = safeGit(['diff', '--name-only', before, after])
  } else if (eventName === 'push' || eventName === 'schedule' || eventName === 'workflow_dispatch') {
    changed = safeGit(['ls-files', 'docs/content/**/*.md'])
  } else {
    changed = safeGit(['diff', '--name-only', 'HEAD'])
  }

  const untracked = safeGit(['ls-files', '--others', '--exclude-standard', 'docs/content'])
  const allChanged = [changed, untracked].filter(Boolean).join('\n')

  return [...new Set(allChanged
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.startsWith('docs/content/') && file.endsWith('.md')))]
}

function classify(file) {
  const rules = [
    ['docs/content/design/4.loop-engineering/', 'loop engineering design', '`scripts/loop-harness.mjs`, `STATE.md`, `LOOP.md`, `.github/workflows/`', '`node --check scripts/loop-harness.mjs`, `pnpm loop:l1`'],
    ['docs/content/design/3.application-design/1.web-app.md', 'web app design', '`apps/web/app/`, `apps/web/nuxt.config.ts`', '`pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint`'],
    ['docs/content/design/3.application-design/2.server-api.md', 'server API design', '`apps/web/server/`', '`pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint`'],
    ['docs/content/design/3.application-design/3.shared-contracts.md', 'shared contracts', '`apps/web/app/types/`, future `packages/shared/`', 'affected package typecheck'],
    ['docs/content/design/2.architecture/', 'architecture', '`pnpm-workspace.yaml`, app/package boundaries', 'root script review plus affected package typechecks'],
    ['docs/content/operations/', 'operations', '`package.json`, package scripts, operational commands', 'run or validate the documented command'],
    ['docs/content/maintenance/', 'maintenance', '`STATE.md`, verifier records, PR lifecycle metadata', 'harness state inspection plus relevant command evidence'],
    ['docs/content/delivery/', 'delivery scope', 'task-specific files under `apps/`, `docs/`, future `packages/` and `infra/`', 'acceptance criteria plus affected package checks'],
    ['docs/content/design/', 'design', 'implementation area named by the design page', 'affected package lint/typecheck/build']
  ]

  const match = rules.find(([prefix]) => file === prefix || file.startsWith(prefix))
  if (!match) {
    return {
      area: 'documentation',
      implementation: 'no direct implementation mapping',
      checks: '`pnpm --dir docs typecheck`, `pnpm --dir docs lint`'
    }
  }

  return {
    area: match[1],
    implementation: match[2],
    checks: match[3]
  }
}

function runId() {
  const now = new Date().toISOString()
  return process.env.GITHUB_RUN_ID ? `gha-${process.env.GITHUB_RUN_ID}` : `local-${now.replace(/[-:.TZ]/g, '').slice(0, 14)}`
}

function appendState(section) {
  const current = readFileSync(statePath, 'utf8')
  writeFileSync(statePath, `${current.trimEnd()}\n\n${section}\n`)
}

function mergeCandidateSummary(candidates) {
  if (!candidates.length) {
    return
  }

  const rows = candidates.map(({ id: itemId, file, meta }) => `| ${itemId} | L1_ANALYZED | required | 0 | \`${file}\` | ${meta.area} | Decide whether to promote to L2 | Pending |`).join('\n')
  const current = readFileSync(statePath, 'utf8')
  const placeholder = '| - | - | - | 0 | - | - | - | - |'

  if (current.includes(placeholder)) {
    writeFileSync(statePath, current.replace(placeholder, rows))
    return
  }

  const marker = '| --- | --- | --- | ---: | --- | --- | --- | --- |'
  writeFileSync(statePath, current.replace(marker, `${marker}\n${rows}`))
}

function l1() {
  ensureState()
  const id = runId()
  const now = new Date().toISOString()
  const branch = safeGit(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown'
  const head = safeGit(['rev-parse', '--short', 'HEAD']) || 'unknown'
  const source = process.env.GITHUB_EVENT_NAME || 'local'
  const files = getChangedDocs()
  const candidates = files.map((file, index) => {
    const meta = classify(file)
    return {
      id: `${id}-${String(index + 1).padStart(2, '0')}`,
      file,
      meta
    }
  })

  const impact = candidates.length
    ? candidates.map(({ id: itemId, file, meta }) => `- ${itemId}: ${file}: ${meta.area}; likely implementation: ${meta.implementation}; suggested checks: ${meta.checks}`).join('\n')
    : '- No changed Markdown files under `docs/content/` were detected.'

  const candidateRows = candidates.length
    ? candidates.map(({ id: itemId, file, meta }) => `| ${itemId} | L1_ANALYZED | required | 0 | \`${file}\` | ${meta.area} | Decide whether to promote to L2 | Pending |`).join('\n')
    : '| - | - | - | 0 | - | - | - | - |'

  mergeCandidateSummary(candidates)
  appendState([
    `### ${id}`,
    '',
    `- Timestamp: ${now}`,
    '- Mode: L1 impact analysis',
    `- Trigger: ${source}`,
    `- Branch: ${branch}`,
    `- HEAD: ${head}`,
    `- Changed docs: ${files.length}`,
    `- Budget cap: $${budgetUsd}/run`,
    `- Estimated cost: $${estimatedCostUsd}`,
    `- Max attempts: ${maxAttempts}`,
    '',
    '#### Candidate Items',
    '',
    '| ID | Stage | Approval | Attempts | Source Docs | Impact Area | Maker Action | Verifier Evidence |',
    '| --- | --- | --- | ---: | --- | --- | --- | --- |',
    candidateRows,
    '',
    '#### Impact Analysis',
    '',
    impact,
    '',
    '#### Next Gate',
    '',
    '- L2 can start only after a human marks one candidate as approved.',
    '- Verifier evidence is required before any item moves to resolved.',
    ''
  ].join('\n'))

  console.log(`L1 report appended to STATE.md for ${files.length} docs file(s).`)
}

function gatedMode(mode) {
  ensureState()
  const approvedItem = process.env.LOOP_APPROVED_ITEM_ID || ''
  const now = new Date().toISOString()
  const id = runId()
  const enabled = process.env.LOOP_ENABLE_AUTONOMY === mode

  if (!approvedItem || !enabled) {
    appendState([
      `### ${id}-${mode}`,
      '',
      `- Timestamp: ${now}`,
      `- Mode: ${mode.toUpperCase()} gate`,
      '- Result: blocked',
      `- Approved item: ${approvedItem || 'missing'}`,
      `- Required enable flag: LOOP_ENABLE_AUTONOMY=${mode}`,
      '',
      '#### Handoff',
      '',
      '- Human approval and explicit enable flag are required before this tier may modify implementation or prepare a PR.',
      ''
    ].join('\n'))
    console.log(`${mode.toUpperCase()} blocked: set LOOP_APPROVED_ITEM_ID and LOOP_ENABLE_AUTONOMY=${mode}.`)
    return
  }

  appendState([
    `### ${id}-${mode}`,
    '',
    `- Timestamp: ${now}`,
    `- Mode: ${mode.toUpperCase()} gate`,
    '- Result: ready',
    `- Approved item: ${approvedItem}`,
    '- Next action: maker may implement within the approved scope and verifier must record command evidence.',
    ''
  ].join('\n'))
  console.log(`${mode.toUpperCase()} gate ready for ${approvedItem}.`)
}

function verify(target) {
  ensureState()
  const commandSets = {
    docs: [
      ['pnpm', ['--dir', 'docs', 'typecheck']],
      ['pnpm', ['--dir', 'docs', 'lint']]
    ],
    web: [
      ['pnpm', ['--dir', 'apps/web', 'typecheck']],
      ['pnpm', ['--dir', 'apps/web', 'lint']]
    ],
    harness: [
      ['node', ['--check', 'scripts/loop-harness.mjs']]
    ]
  }
  const selected = commandSets[target]
  if (!selected) {
    throw new Error(`Unknown verifier target: ${target}`)
  }

  const evidence = []
  for (const [bin, args] of selected) {
    const printable = [bin, ...args].join(' ')
    const result = spawnSync(bin, args, { cwd: root, encoding: 'utf8' })
    if (result.stdout) {
      process.stdout.write(result.stdout)
    }
    if (result.stderr) {
      process.stderr.write(result.stderr)
    }
    evidence.push(`| ${process.env.LOOP_APPROVED_ITEM_ID || 'manual'} | \`${printable}\` | ${result.status === 0 ? 'pass' : 'fail'} | exit ${result.status} |`)
    if (result.status !== 0) {
      appendVerifierEvidence(target, evidence)
      process.exit(result.status || 1)
    }
  }
  appendVerifierEvidence(target, evidence)
}

function appendVerifierEvidence(target, rows) {
  appendState([
    `### ${runId()}-verify-${target}`,
    '',
    `- Timestamp: ${new Date().toISOString()}`,
    `- Mode: verifier:${target}`,
    '',
    '#### Evidence',
    '',
    '| ID | Command | Result | Evidence |',
    '| --- | --- | --- | --- |',
    ...rows,
    ''
  ].join('\n'))
}

if (command === 'l1') {
  l1()
} else if (command === 'l2') {
  gatedMode('l2')
} else if (command === 'l3') {
  gatedMode('l3')
} else if (command.startsWith('verify:')) {
  verify(command.split(':')[1])
} else {
  throw new Error(`Unknown loop command: ${command}`)
}
