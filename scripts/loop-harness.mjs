#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const statePath = path.join(root, 'STATE.md')
const loopDir = path.join(root, '.loop')
const loopRunsDir = path.join(loopDir, 'runs')
const loopStatePath = path.join(loopDir, 'state.json')
const loopDashboardPath = path.join(root, 'docs/content/delivery/loop-dashboard.md')
const command = process.argv[2] || 'l1'
const budgetUsd = Number.parseFloat(process.env.LOOP_BUDGET_USD || '10')
const estimatedCostUsd = Number.parseFloat(process.env.LOOP_ESTIMATED_COST_USD || '0')
const maxAttempts = Number.parseInt(process.env.LOOP_MAX_ATTEMPTS || '3', 10)
const taskRoot = path.join(root, 'docs/content/delivery/scopes')
const requiredTaskFields = [
  'id',
  'status',
  'autonomy',
  'source_of_truth',
  'primary_area',
  'acceptance_criteria',
  'verification_commands',
  'handoff_conditions',
  'last_evidence'
]
const allowedStatuses = new Set(['planned', 'approved', 'in_progress', 'verifying', 'resolved', 'blocked'])
const allowedAutonomy = new Set(['manual', 'assisted', 'autonomous'])

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
  return section
}

function ensureLoopDirs() {
  mkdirSync(loopRunsDir, { recursive: true })
}

function recentRunFiles(limit = 10) {
  if (!existsSync(loopRunsDir)) {
    return []
  }

  return readdirSync(loopRunsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `.loop/runs/${entry.name}`)
    .sort()
    .slice(-limit)
    .reverse()
}

function uniqueRunLogPath(id) {
  const safeId = id.replace(/[^A-Za-z0-9_.-]/g, '-')
  let candidate = path.join(loopRunsDir, `${safeId}.md`)
  let index = 2

  while (existsSync(candidate)) {
    candidate = path.join(loopRunsDir, `${safeId}-${index}.md`)
    index += 1
  }

  return candidate
}

function extractCandidateRows(limit = 20) {
  const state = existsSync(statePath) ? readFileSync(statePath, 'utf8') : ''
  const rows = []

  for (const line of state.split('\n')) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*`?([^|`]+)`?\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/)
    if (!match) {
      continue
    }

    const [, id, stage, approval, attempts, sourceDocs, impactArea, makerAction, verifierEvidence] = match.map((value) => value.trim())
    if (id === 'ID' || id === '---' || id === '-') {
      continue
    }

    rows.push({ id, stage, approval, attempts, sourceDocs, impactArea, makerAction, verifierEvidence })
  }

  return rows.slice(-limit).reverse()
}

function persistLoopArtifacts(run) {
  ensureLoopDirs()
  const now = new Date().toISOString()
  const logPath = uniqueRunLogPath(run.id)
  const relativeLogPath = path.relative(root, logPath)
  const allCandidateRows = extractCandidateRows(Number.POSITIVE_INFINITY)
  const approvedCandidate = run.approvedItem
    ? allCandidateRows.find((candidate) => candidate.id === run.approvedItem)
    : undefined
  const sourceDocs = run.sourceDocs?.length
    ? run.sourceDocs
    : approvedCandidate
      ? [approvedCandidate.sourceDocs]
      : []
  const recentCandidates = extractCandidateRows()
  const candidateRows = approvedCandidate && !recentCandidates.some((candidate) => candidate.id === approvedCandidate.id)
    ? [approvedCandidate, ...recentCandidates.slice(0, 19)]
    : recentCandidates
  const recentRuns = recentRunFiles()
  const machineState = {
    schemaVersion: 1,
    generatedAt: now,
    sourceOfTruth: 'docs/content/',
    humanDashboard: 'docs/content/delivery/loop-dashboard.md',
    compatibilityMirror: 'STATE.md',
    currentTurn: {
      runId: run.id,
      mode: run.mode,
      result: run.result,
      approvedItem: run.approvedItem || '',
      ownerRole: run.ownerRole || ownerRoleForMode(run.mode),
      summary: run.summary || ''
    },
    policy: {
      budgetUsd,
      estimatedCostUsd,
      maxAttempts,
      writeSurface: [
        'STATE.md',
        '.loop/state.json',
        '.loop/runs/*.md',
        'docs/content/delivery/loop-dashboard.md'
      ],
      secretPolicy: 'Do not read or write secrets, credentials, tokens, .env, or .env.* values.'
    },
    sourceDocs,
    verification: run.verification || [],
    handoff: run.handoff || [],
    candidates: candidateRows,
    recentRuns: [relativeLogPath, ...recentRuns.filter((file) => file !== relativeLogPath)].slice(0, 10)
  }

  writeFileSync(logPath, renderRunLog({ ...run, timestamp: now, statePath: '.loop/state.json', sourceDocs }))
  writeFileSync(loopStatePath, `${JSON.stringify(machineState, null, 2)}\n`)
  writeFileSync(loopDashboardPath, renderDashboard(machineState))
}

function ownerRoleForMode(mode) {
  if (mode.startsWith('verifier')) {
    return 'verifier'
  }
  if (mode.includes('gate')) {
    return 'human + maker'
  }
  return 'harness'
}

function renderRunLog(run) {
  return [
    '---',
    `title: Loop Run ${run.id}`,
    `description: ${run.mode} ${run.result}`,
    'navigation: false',
    '---',
    '',
    `# Loop Run ${run.id}`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Timestamp | ${run.timestamp} |`,
    `| Mode | ${run.mode} |`,
    `| Result | ${run.result} |`,
    `| Approved Item | ${run.approvedItem || 'none'} |`,
    `| Machine State | \`${run.statePath}\` |`,
    '',
    '## Summary',
    '',
    run.summary || 'No summary recorded.',
    '',
    '## Source Docs',
    '',
    markdownItems(run.sourceDocs || [], 'No source docs recorded.'),
    '',
    '## Verification',
    '',
    markdownItems(run.verification || [], 'No verifier evidence recorded for this run.'),
    '',
    '## Handoff',
    '',
    markdownItems(run.handoff || [], 'No handoff condition recorded.'),
    ''
  ].join('\n')
}

function renderDashboard(state) {
  const current = state.currentTurn
  const gateState = current.result === 'blocked'
    ? 'blocked'
    : current.result === 'ready'
      ? 'approved'
      : current.mode.startsWith('verifier')
        ? 'verifying'
        : current.result
  const nextHumanAction = current.result === 'blocked'
    ? 'Provide the missing approval, enable flag, or human decision recorded in the handoff queue.'
    : current.mode.startsWith('verifier')
      ? 'Review verifier evidence and decide whether the task can move to resolved.'
      : 'Review the current turn, keep implementation inside the approved primary area, and require verifier evidence before resolution.'

  return [
    '---',
    'title: Loop Dashboard',
    'description: Human-facing latest status for Loop Engineering.',
    'navigation:',
    '  icon: i-lucide-activity',
    '---',
    '',
    '# Loop Dashboard',
    '',
    '## Current Turn',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Run ID | \`${current.runId}\` |`,
    `| Mode | ${current.mode} |`,
    `| Status | ${current.result} |`,
    `| Autonomy Gate | ${gateState} |`,
    `| Owner Role | ${current.ownerRole} |`,
    `| Approved Item | ${current.approvedItem || 'none'} |`,
    '',
    '## Intent',
    '',
    current.summary || 'No current intent recorded.',
    '',
    '## Gate State',
    '',
    `**${gateState}**`,
    '',
    '## Next Human Action',
    '',
    nextHumanAction,
    '',
    '## Source Docs',
    '',
    markdownItems(state.sourceDocs, 'No source docs recorded for the latest run.'),
    '',
    '## Scope Boundary',
    '',
    '| Boundary | Rule |',
    '| --- | --- |',
    '| Reality Source | `docs/content/` |',
    '| Compatibility Mirror | `STATE.md` |',
    '| Machine State | `.loop/state.json` |',
    '| Run Logs | `.loop/runs/*.md` |',
    '| Dashboard | `docs/content/delivery/loop-dashboard.md` |',
    '| Denylist Reminder | Do not read or write secrets, credentials, tokens, `.env`, or `.env.*` values. |',
    '',
    '## Verification',
    '',
    markdownItems(state.verification, 'No verifier evidence recorded for the latest run.'),
    '',
    '## Handoff Queue',
    '',
    markdownItems(state.handoff, 'No handoff condition recorded for the latest run.'),
    '',
    '## Candidate Items',
    '',
    state.candidates.length
      ? [
          '| ID | Stage | Approval | Attempts | Source Docs | Impact Area |',
          '| --- | --- | --- | ---: | --- | --- |',
          ...state.candidates.map((candidate) => `| ${candidate.id} | ${candidate.stage} | ${candidate.approval} | ${candidate.attempts} | \`${candidate.sourceDocs}\` | ${candidate.impactArea} |`)
        ].join('\n')
      : 'No candidate items recorded.',
    '',
    '## Recent Runs',
    '',
    markdownItems(state.recentRuns.map((file) => `\`${file}\``), 'No run logs recorded.'),
    ''
  ].join('\n')
}

function markdownItems(items, fallback) {
  if (!items.length) {
    return `- ${fallback}`
  }

  return items.map((item) => `- ${item}`).join('\n')
}

function listMarkdownFiles(dir) {
  if (!existsSync(dir)) {
    return []
  }

  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return listMarkdownFiles(entryPath)
    }
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : []
  })
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return {}
  }

  const end = content.indexOf('\n---', 4)
  if (end === -1) {
    return {}
  }

  const frontmatter = content.slice(4, end).split('\n')
  const parsed = {}
  let currentKey = ''

  for (const rawLine of frontmatter) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }

    const listMatch = line.match(/^\s{2,}-\s+(.*)$/)
    if (listMatch && currentKey) {
      const value = listMatch[1].trim()
      if (!Array.isArray(parsed[currentKey])) {
        parsed[currentKey] = parsed[currentKey] ? [parsed[currentKey]] : []
      }
      parsed[currentKey].push(unquoteYamlValue(value))
      continue
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)
    if (!keyMatch) {
      currentKey = ''
      continue
    }

    currentKey = keyMatch[1]
    const value = (keyMatch[2] || '').trim()
    parsed[currentKey] = value ? unquoteYamlValue(value) : []
  }

  return parsed
}

function unquoteYamlValue(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function sectionContent(content, heading) {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'im')
  const match = content.match(pattern)
  if (!match || match.index === undefined) {
    return ''
  }
  const start = match.index + match[0].length
  const rest = content.slice(start)
  const next = rest.search(/^##\s+/m)
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function markdownListItems(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim() || '')
    .filter(Boolean)
}

function taskFromFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const frontmatter = parseFrontmatter(content)
  const relativePath = path.relative(root, filePath)
  const task = { ...frontmatter }

  task.source_file = relativePath
  task.schema_keys = Object.keys(frontmatter).filter((field) => requiredTaskFields.includes(field))
  task.id = task.id || inferTaskId(content, filePath)
  task.primary_area = task.primary_area?.length ? task.primary_area : markdownListItems(sectionContent(content, 'Primary Area'))
  task.acceptance_criteria = task.acceptance_criteria?.length ? task.acceptance_criteria : markdownListItems(sectionContent(content, 'Acceptance Criteria'))
  task.verification_commands = task.verification_commands?.length ? task.verification_commands : extractCommands(sectionContent(content, 'Verification'))
  task.handoff_conditions = task.handoff_conditions?.length ? task.handoff_conditions : markdownListItems(sectionContent(content, 'Handoff Conditions'))

  return task
}

function inferTaskId(content, filePath) {
  const title = content.match(/^#\s+([A-Z]+-\d+)/m)
  if (title) {
    return title[1]
  }

  const basename = path.basename(filePath)
  const fileId = basename.match(/(?:^|\.)([a-z]+-\d+)/i)
  return fileId ? fileId[1].toUpperCase() : ''
}

function extractCommands(section) {
  const fence = section.match(/```(?:bash|sh|txt)?\n([\s\S]*?)```/i)
  if (!fence) {
    return markdownListItems(section)
  }

  return fence[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function allTasks() {
  return listMarkdownFiles(taskRoot)
    .filter((file) => file.includes(`${path.sep}tasks${path.sep}`))
    .map(taskFromFile)
}

function findTask(taskId) {
  const normalized = taskId.trim().toUpperCase()
  return allTasks().find((task) => String(task.id).toUpperCase() === normalized)
}

function isPresent(value) {
  if (Array.isArray(value)) {
    return value.some((item) => String(item).trim())
  }
  return String(value || '').trim().length > 0
}

function validateTaskShape(task) {
  const errors = []
  for (const field of requiredTaskFields) {
    if (!isPresent(task[field])) {
      errors.push(`missing required field: ${field}`)
    }
  }

  if (isPresent(task.status) && !allowedStatuses.has(String(task.status))) {
    errors.push(`invalid status: ${task.status}`)
  }

  if (isPresent(task.autonomy) && !allowedAutonomy.has(String(task.autonomy))) {
    errors.push(`invalid autonomy: ${task.autonomy}`)
  }

  if (isPresent(task.source_of_truth)) {
    const sources = Array.isArray(task.source_of_truth) ? task.source_of_truth : [task.source_of_truth]
    for (const source of sources) {
      if (!String(source).startsWith('docs/content/')) {
        errors.push(`invalid source_of_truth: ${source}`)
      } else if (!existsSync(path.join(root, source))) {
        errors.push(`source_of_truth does not exist: ${source}`)
      }
    }
  }

  if (!isPresent(task.verification_commands)) {
    errors.push('verification_commands must include at least one command')
  }

  if (!isPresent(task.handoff_conditions)) {
    errors.push('handoff_conditions must include at least one condition')
  }

  return errors
}

function validateTask(taskId) {
  if (!taskId) {
    console.error('Task ID is required. Usage: pnpm loop:validate-task <task-id>')
    process.exit(1)
  }

  const task = findTask(taskId)
  if (!task) {
    console.error(`Unknown task ID: ${taskId}`)
    process.exit(1)
  }

  const errors = validateTaskShape(task)
  if (errors.length) {
    console.error(`Task validation failed for ${task.id} (${task.source_file}):`)
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log(`Task ${task.id} is valid: ${task.source_file}`)
}

function validateTasks() {
  const discoveredTasks = allTasks()
  const tasks = discoveredTasks.filter(isSchemaManagedTask)
  const failures = []

  for (const task of tasks) {
    const errors = validateTaskShape(task)
    if (errors.length) {
      failures.push({ task, errors })
    }
  }

  if (failures.length) {
    console.error(`Task validation failed for ${failures.length} task(s):`)
    for (const { task, errors } of failures) {
      console.error(`\n${task.id || 'unknown'} (${task.source_file}):`)
      for (const error of errors) {
        console.error(`- ${error}`)
      }
    }
    process.exit(1)
  }

  const skipped = discoveredTasks.length - tasks.length
  const skippedSummary = skipped ? ` Skipped ${skipped} legacy task(s) without schema fields.` : ''
  console.log(`Validated ${tasks.length} task(s).${skippedSummary}`)
}

function isSchemaManagedTask(task) {
  return task.schema_keys.length > 0 || task.source_file.startsWith('docs/content/delivery/scopes/2.loop-engineering-turn-foundation/tasks/')
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
  const section = appendState([
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
  persistLoopArtifacts({
    id,
    mode: 'L1 impact analysis',
    result: 'candidates-recorded',
    summary: `Detected ${files.length} changed docs file(s) and recorded candidate items for human L2 approval.`,
    sourceDocs: files,
    verification: ['Verifier evidence is required before any item moves to resolved.'],
    section
  })

  console.log(`L1 report appended to STATE.md for ${files.length} docs file(s).`)
}

function gatedMode(mode) {
  ensureState()
  const approvedItem = process.env.LOOP_APPROVED_ITEM_ID || ''
  const now = new Date().toISOString()
  const id = runId()
  const enabled = process.env.LOOP_ENABLE_AUTONOMY === mode

  if (!approvedItem || !enabled) {
    const section = appendState([
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
    persistLoopArtifacts({
      id: `${id}-${mode}`,
      mode: `${mode.toUpperCase()} gate`,
      result: 'blocked',
      approvedItem,
      summary: `${mode.toUpperCase()} gate blocked because the approved item or explicit enable flag is missing.`,
      handoff: ['Human approval and explicit enable flag are required before this tier may modify implementation or prepare a PR.'],
      section
    })
    console.log(`${mode.toUpperCase()} blocked: set LOOP_APPROVED_ITEM_ID and LOOP_ENABLE_AUTONOMY=${mode}.`)
    return
  }

  const section = appendState([
    `### ${id}-${mode}`,
    '',
    `- Timestamp: ${now}`,
    `- Mode: ${mode.toUpperCase()} gate`,
    '- Result: ready',
    `- Approved item: ${approvedItem}`,
    '- Next action: maker may implement within the approved scope and verifier must record command evidence.',
    ''
  ].join('\n'))
  persistLoopArtifacts({
    id: `${id}-${mode}`,
    mode: `${mode.toUpperCase()} gate`,
    result: 'ready',
    approvedItem,
    summary: 'Maker may implement within the approved scope and verifier must record command evidence.',
    section
  })
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
  const id = `${runId()}-verify-${target}`
  const section = appendState([
    `### ${id}`,
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
  persistLoopArtifacts({
    id,
    mode: `verifier:${target}`,
    result: rows.every((row) => row.includes(' | pass | ')) ? 'pass' : 'fail',
    approvedItem: process.env.LOOP_APPROVED_ITEM_ID || '',
    summary: `Verifier ${target} command set completed.`,
    verification: rows,
    section
  })
}

if (command === 'l1') {
  l1()
} else if (command === 'l2') {
  gatedMode('l2')
} else if (command === 'l3') {
  gatedMode('l3')
} else if (command === 'validate-task') {
  validateTask(process.argv[3] || '')
} else if (command === 'validate-tasks') {
  validateTasks()
} else if (command.startsWith('verify:')) {
  verify(command.split(':')[1])
} else {
  throw new Error(`Unknown loop command: ${command}`)
}
