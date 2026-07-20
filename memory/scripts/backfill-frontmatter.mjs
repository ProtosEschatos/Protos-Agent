#!/usr/bin/env node
/**
 * One-shot helper — backfills YAML front-matter into legacy session files that
 * were authored before the current schema existed. Idempotent: if a file
 * already has front-matter, it is skipped.
 *
 * Rules:
 *   - id       ← `<YYYY-MM-DD>-NN` derived from filename order per day
 *   - date     ← YYYY-MM-DD from filename
 *   - project  ← existing index.jsonl row for that session, if any; else 'Protos-Web'
 *   - title    ← first H1 in the file, minus the "Session/Sesija YYYY-MM-DD — " prefix
 *   - commits[]/learnings[]/topics[] ← copied from the index row
 *
 * Run once from repo root: `node memory/scripts/backfill-frontmatter.mjs`
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const SESSIONS = join(REPO_ROOT, 'memory', 'sessions')
const INDEX = join(REPO_ROOT, 'memory', 'index.jsonl')

const indexRows = existsSync(INDEX)
  ? readFileSync(INDEX, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l))
  : []

const files = readdirSync(SESSIONS).filter((f) => f.endsWith('.md')).sort()

// Group by date to compute per-day 2-digit sequence.
const byDate = new Map()
for (const filename of files) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-/)
  if (!m) continue
  const date = m[1]
  if (!byDate.has(date)) byDate.set(date, [])
  byDate.get(date).push(filename)
}

let touched = 0
for (const filename of files) {
  const raw = readFileSync(join(SESSIONS, filename), 'utf8')
  if (raw.startsWith('---\n')) continue
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
  if (!m) continue
  const date = m[1]
  const dayFiles = byDate.get(date)
  const seq = String(dayFiles.indexOf(filename) + 1).padStart(2, '0')
  const id = `${date}-${seq}`

  const indexRow = indexRows.find(
    (r) => r.session === `memory/sessions/${filename}`,
  )

  const project = indexRow?.project ?? 'Protos-Web'
  const commits = indexRow?.commits ?? []
  const learnings = (indexRow?.learnings ?? []).map((p) =>
    p.replace(/^memory\/learnings\//, '').replace(/\.md$/, ''),
  )
  const topics = indexRow?.topics ?? []

  const h1 = raw.split('\n').find((l) => l.startsWith('# ')) ?? ''
  const rawTitle = h1.replace(/^#\s+/, '').trim()
  const title = rawTitle
    .replace(/^(Session|Sesija):?\s+\d{4}-\d{2}-\d{2}\s*[—-]\s*/i, '')
    .replace(/^(Session|Sesija):?\s+\d{4}-\d{2}-\d{2}(?:\s*→\s*\d+.*?)?\s*[—-]\s*/i, '')
    .replace(/^Sesija:\s+/i, '')
    .trim() || rawTitle

  const fm = [
    '---',
    `id: ${id}`,
    `date: ${date}`,
    `project: ${project}`,
    `title: ${title}`,
    commits.length ? 'commits:' : 'commits: []',
    ...commits.map((c) => `  - ${c}`),
    learnings.length ? 'learnings:' : 'learnings: []',
    ...learnings.map((s) => `  - ${s}`),
    topics.length ? 'topics:' : 'topics: []',
    ...topics.map((t) => `  - ${t}`),
    '---',
    '',
  ].join('\n')

  writeFileSync(join(SESSIONS, filename), fm + raw, 'utf8')
  touched++
}

console.log(`Backfilled ${touched} session files with YAML front-matter.`)
