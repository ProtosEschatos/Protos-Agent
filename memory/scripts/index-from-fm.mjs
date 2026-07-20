#!/usr/bin/env node
/**
 * Regenerates memory/index.jsonl from every session's YAML front-matter.
 * Idempotent — running it twice produces the same file. Sort order is
 * (date asc, id asc). Existing index rows that reference sessions with no
 * front-matter get preserved unchanged (labelled "manual").
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const SESSIONS = join(REPO_ROOT, 'memory', 'sessions')
const LEARNINGS = join(REPO_ROOT, 'memory', 'learnings')
const PROJECTS = join(REPO_ROOT, 'memory', 'projects')
const INDEX = join(REPO_ROOT, 'memory', 'index.jsonl')

function parseFrontMatter(raw) {
  if (!raw.startsWith('---\n')) return null
  const end = raw.indexOf('\n---', 4)
  if (end === -1) return null
  const block = raw.slice(4, end)
  const out = {}
  let currentKey = null
  for (const line of block.split('\n')) {
    if (!line.trim()) continue
    if (line.startsWith('  - ')) {
      if (!currentKey) continue
      const val = line.slice(4).trim().replace(/^["']|["']$/g, '')
      if (!Array.isArray(out[currentKey])) out[currentKey] = []
      out[currentKey].push(val)
      continue
    }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
    if (!m) continue
    const [, key, value] = m
    currentKey = key
    const v = value.trim()
    if (!v) {
      out[key] = []
      continue
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      out[key] = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
      continue
    }
    out[key] = v.replace(/^["']|["']$/g, '')
  }
  return out
}

const rows = []
for (const filename of readdirSync(SESSIONS).filter((f) => f.endsWith('.md')).sort()) {
  const raw = readFileSync(join(SESSIONS, filename), 'utf8')
  const fm = parseFrontMatter(raw)
  if (!fm || !fm.id) continue

  const projectSlug = (fm.project || '').toLowerCase().replace(/\s+/g, '-')
  const projectDoc = projectSlug && existsSync(join(PROJECTS, `${projectSlug}.md`))
    ? `memory/projects/${projectSlug}.md`
    : undefined

  const learnings = Array.isArray(fm.learnings)
    ? fm.learnings
        .map((slug) => (existsSync(join(LEARNINGS, `${slug}.md`)) ? `memory/learnings/${slug}.md` : null))
        .filter(Boolean)
    : []

  const row = {
    id: fm.id,
    date: fm.date,
    project: fm.project,
    session: `memory/sessions/${filename}`,
    ...(projectDoc ? { project_doc: projectDoc } : {}),
    ...(learnings.length ? { learnings } : {}),
    commits: Array.isArray(fm.commits) ? fm.commits : [],
    topics: Array.isArray(fm.topics) ? fm.topics : [],
    title: fm.title || '',
  }
  rows.push(row)
}

rows.sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id))

const out = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
writeFileSync(INDEX, out, 'utf8')
console.log(`Wrote memory/index.jsonl with ${rows.length} rows.`)
