#!/usr/bin/env node
/**
 * Protos-Agent memory validator.
 *
 * Reads every file under memory/sessions/, memory/learnings/, memory/projects/,
 * and memory/index.jsonl, and verifies:
 *   - Session files have a valid YAML front-matter (id, date, project, title,
 *     commits[8-char], learnings[slug], topics[]).
 *   - id matches filename date, filename slug uses YYYY-MM-DD-<slug>.md.
 *   - project references resolve to an existing memory/projects/<slug>.md.
 *   - learnings[] references resolve to memory/learnings/<slug>.md.
 *   - commits[] are all 7–40 lowercase hex chars.
 *   - Every session is referenced by exactly one row in index.jsonl.
 *   - Every row in index.jsonl points to an existing session file and matches
 *     its front-matter.
 *   - No duplicate ids across sessions or index rows.
 *   - Dates in index.jsonl are non-decreasing.
 *
 * Runs with plain Node ≥ 20, no dependencies.
 * Exit code 0 on success, 1 on any error, 2 on warnings only.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const MEMORY = join(REPO_ROOT, 'memory')
const SESSIONS = join(MEMORY, 'sessions')
const LEARNINGS = join(MEMORY, 'learnings')
const PROJECTS = join(MEMORY, 'projects')
const INDEX = join(MEMORY, 'index.jsonl')

const errors = []
const warnings = []
const err = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

function parseFrontMatter(raw, filepath, { optional = false } = {}) {
  if (!raw.startsWith('---\n')) {
    if (optional) return null
    err(`${filepath}: missing YAML front-matter (must start with '---')`)
    return null
  }
  const end = raw.indexOf('\n---', 4)
  if (end === -1) {
    err(`${filepath}: unterminated YAML front-matter (missing closing '---')`)
    return null
  }
  const block = raw.slice(4, end)
  const out = {}
  let currentKey = null
  for (const line of block.split('\n')) {
    if (!line.trim()) continue
    if (line.startsWith('  - ')) {
      if (!currentKey) {
        err(`${filepath}: list item without key: ${line}`)
        continue
      }
      const val = line.slice(4).trim().replace(/^["']|["']$/g, '')
      if (!Array.isArray(out[currentKey])) out[currentKey] = []
      out[currentKey].push(val)
      continue
    }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
    if (!m) {
      err(`${filepath}: unparseable front-matter line: ${line}`)
      continue
    }
    const [, key, rawValue] = m
    currentKey = key
    const value = rawValue.trim()
    if (value === '' || value === undefined) {
      out[key] = []
      continue
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      out[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
      continue
    }
    out[key] = value.replace(/^["']|["']$/g, '')
  }
  return out
}

function isShortSha(s) {
  // Accept 7–40 hex chars (git default short is 7, we recommend 8 for new work).
  return typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)
}
function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}
function isSessionId(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}-\d{2}$/.test(s)
}

// ─── Collect existing files ──────────────────────────────────────────────

const sessionFiles = existsSync(SESSIONS)
  ? readdirSync(SESSIONS).filter((f) => f.endsWith('.md'))
  : []
const learningSlugs = existsSync(LEARNINGS)
  ? readdirSync(LEARNINGS)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''))
  : []
const projectSlugs = existsSync(PROJECTS)
  ? readdirSync(PROJECTS)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  : []

// ─── Validate every session ──────────────────────────────────────────────

const sessionMeta = new Map() // filename → parsed front-matter
const sessionIds = new Map() // id → filename

for (const filename of sessionFiles) {
  const abs = join(SESSIONS, filename)
  const raw = readFileSync(abs, 'utf8')
  const fm = parseFrontMatter(raw, relative(REPO_ROOT, abs))
  if (!fm) continue
  const rel = relative(REPO_ROOT, abs).replace(/\\/g, '/')

  const required = ['id', 'date', 'project', 'title']
  for (const key of required) {
    if (!fm[key]) err(`${rel}: missing required front-matter field "${key}"`)
  }
  if (fm.id && !isSessionId(fm.id))
    err(`${rel}: id must be YYYY-MM-DD-NN, got "${fm.id}"`)
  if (fm.date && !isIsoDate(fm.date)) err(`${rel}: date must be YYYY-MM-DD, got "${fm.date}"`)
  if (fm.id && fm.date && !fm.id.startsWith(fm.date))
    err(`${rel}: id "${fm.id}" must start with date "${fm.date}"`)
  if (fm.id) {
    const expectedPrefix = `${fm.id.slice(0, 10)}-`
    if (!filename.startsWith(fm.id.slice(0, 10)))
      err(`${rel}: filename must start with the id's date "${expectedPrefix.slice(0, 10)}"`)
  }
  const projectSlug = fm.project?.toLowerCase().replace(/\s+/g, '-')
  if (projectSlug && !projectSlugs.includes(projectSlug))
    warn(
      `${rel}: project "${fm.project}" has no doc at memory/projects/${projectSlug}.md (add one or fix the name)`,
    )

  if (Array.isArray(fm.commits)) {
    for (const c of fm.commits) {
      if (!isShortSha(c))
        err(`${rel}: commit "${c}" must be 7–40 hex chars`)
    }
  }
  if (Array.isArray(fm.learnings)) {
    for (const slug of fm.learnings) {
      if (!learningSlugs.includes(slug))
        err(`${rel}: learning "${slug}" has no file at memory/learnings/${slug}.md`)
    }
  }

  if (fm.id) {
    if (sessionIds.has(fm.id))
      err(`${rel}: duplicate session id "${fm.id}" (already used by ${sessionIds.get(fm.id)})`)
    else sessionIds.set(fm.id, rel)
  }
  sessionMeta.set(rel, fm)
}

// ─── Validate index.jsonl ────────────────────────────────────────────────

const indexRows = []
if (!existsSync(INDEX)) {
  err(`memory/index.jsonl is missing`)
} else {
  const raw = readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '')
  const lines = raw.split('\n')
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let row
    try {
      row = JSON.parse(trimmed)
    } catch (e) {
      err(`memory/index.jsonl:${i + 1}: invalid JSON — ${e.message}`)
      return
    }
    row.__line = i + 1
    indexRows.push(row)
  })
}

const seenIds = new Set()
let lastDate = ''
for (const row of indexRows) {
  const loc = `memory/index.jsonl:${row.__line}`
  for (const key of ['id', 'date', 'project', 'session']) {
    if (!row[key]) err(`${loc}: missing required field "${key}"`)
  }
  if (row.id && !isSessionId(row.id)) err(`${loc}: id must be YYYY-MM-DD-NN, got "${row.id}"`)
  if (row.date && !isIsoDate(row.date))
    err(`${loc}: date must be YYYY-MM-DD, got "${row.date}"`)
  if (row.date && row.date < lastDate)
    err(`${loc}: date "${row.date}" out of order (previous row was "${lastDate}")`)
  lastDate = row.date || lastDate

  if (row.id) {
    if (seenIds.has(row.id)) err(`${loc}: duplicate id "${row.id}"`)
    else seenIds.add(row.id)
  }
  if (row.session) {
    const abs = join(REPO_ROOT, row.session)
    if (!existsSync(abs)) {
      err(`${loc}: session file "${row.session}" does not exist`)
    } else {
      const fm = sessionMeta.get(row.session)
      if (fm) {
        if (fm.id !== row.id)
          err(
            `${loc}: session front-matter id "${fm.id}" does not match index row id "${row.id}"`,
          )
        if (fm.date !== row.date)
          err(
            `${loc}: session front-matter date "${fm.date}" does not match index row date "${row.date}"`,
          )
      }
    }
  }
  if (Array.isArray(row.commits)) {
    for (const c of row.commits) {
      if (!isShortSha(c)) err(`${loc}: commit "${c}" must be 7–40 hex chars`)
    }
  }
  if (Array.isArray(row.learnings)) {
    for (const path of row.learnings) {
      if (!existsSync(join(REPO_ROOT, path)))
        err(`${loc}: learning path "${path}" does not exist`)
    }
  }
  if (row.project_doc && !existsSync(join(REPO_ROOT, row.project_doc)))
    err(`${loc}: project_doc "${row.project_doc}" does not exist`)
}

// ─── Cross-check: every session file has an index row ────────────────────

for (const [rel, fm] of sessionMeta) {
  if (!fm.id) continue
  if (!seenIds.has(fm.id))
    err(`${rel}: session id "${fm.id}" is not referenced by any row in memory/index.jsonl`)
}

// ─── Learning file front-matter (soft) ───────────────────────────────────

for (const slug of learningSlugs) {
  const abs = join(LEARNINGS, `${slug}.md`)
  const raw = readFileSync(abs, 'utf8')
  const fm = parseFrontMatter(raw, relative(REPO_ROOT, abs), { optional: true })
  if (!fm) {
    warn(`memory/learnings/${slug}.md: missing YAML front-matter (recommended)`)
    continue
  }
  if (!fm.id) warn(`memory/learnings/${slug}.md: missing front-matter field "id"`)
  if (!fm.project) warn(`memory/learnings/${slug}.md: missing front-matter field "project"`)
  if (!fm.extracted_from)
    warn(`memory/learnings/${slug}.md: missing "extracted_from" (session id backlink)`)
}

// ─── Project file front-matter (soft) ────────────────────────────────────

for (const slug of projectSlugs) {
  const abs = join(PROJECTS, `${slug}.md`)
  const raw = readFileSync(abs, 'utf8')
  const fm = parseFrontMatter(raw, relative(REPO_ROOT, abs), { optional: true })
  if (!fm) {
    warn(`memory/projects/${slug}.md: missing YAML front-matter (recommended)`)
    continue
  }
  if (!fm.name) warn(`memory/projects/${slug}.md: missing front-matter "name"`)
  if (!fm.status) warn(`memory/projects/${slug}.md: missing front-matter "status"`)
  if (!fm.last_updated)
    warn(`memory/projects/${slug}.md: missing front-matter "last_updated"`)
}

// ─── Report ──────────────────────────────────────────────────────────────

const nS = sessionFiles.length
const nL = learningSlugs.length
const nP = projectSlugs.length
const nI = indexRows.length
console.log(
  `memory/: ${nS} sessions | ${nL} learnings | ${nP} projects | ${nI} index rows`,
)

if (warnings.length) {
  console.warn(`\nWarnings (${warnings.length}):`)
  for (const w of warnings) console.warn(`  ⚠ ${w}`)
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log('\n✓ All memory files pass validation.')
process.exit(warnings.length ? 2 : 0)
