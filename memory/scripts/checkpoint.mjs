#!/usr/bin/env node
/**
 * Auto-snapshot helper for long working sessions.
 *
 * Called by Cursor hook (`hooks.json`) or manually. Creates a checkpoint
 * session file in `memory/sessions/` and updates the index — but only if the
 * previous checkpoint is > 30 min old AND at least one commit landed in the
 * target repo since then. Otherwise it silently no-ops.
 *
 * Env vars:
 *   AGENT_REPO       Absolute path to the Protos-Agent checkout.
 *                    Defaults to script's grand-parent dir.
 *   TARGET_REPO      Absolute path to the code repo being tracked.
 *                    Defaults to CWD. Example: /home/protos/Protos-Web.
 *   PROJECT_SLUG     Project name (must match memory/projects/<slug>.md).
 *                    Defaults to basename(TARGET_REPO), lowercased.
 *   CHAT_RUN_ID      Optional chat/session ID for `run_id:` front-matter.
 *   MIN_INTERVAL_SEC Throttle threshold (default 1800 = 30 min).
 *   DRY_RUN          If set, prints what would happen and exits.
 *
 * Never commits secrets — the checkpoint body contains only commit shortlogs.
 */

import { execSync } from 'node:child_process'
import { readdirSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const AGENT_REPO = process.env.AGENT_REPO ?? resolve(HERE, '..', '..')
const TARGET_REPO = process.env.TARGET_REPO ?? process.cwd()
const PROJECT_SLUG = (process.env.PROJECT_SLUG ?? basename(TARGET_REPO)).toLowerCase()
const CHAT_RUN_ID = process.env.CHAT_RUN_ID ?? 'auto-snapshot'
const MIN_INTERVAL_SEC = Number.parseInt(process.env.MIN_INTERVAL_SEC ?? '1800', 10)
const DRY_RUN = Boolean(process.env.DRY_RUN)

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts }).trim()
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function findLastCheckpoint() {
  const dir = resolve(AGENT_REPO, 'memory', 'sessions')
  if (!existsSync(dir)) return null
  const files = readdirSync(dir).filter((f) => /checkpoint/i.test(f))
  if (files.length === 0) return null
  const mostRecent = files
    .map((f) => ({ f, mtime: statSync(resolve(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0]
  return mostRecent
}

function nextSeqFor(date) {
  const dir = resolve(AGENT_REPO, 'memory', 'sessions')
  if (!existsSync(dir)) return '01'
  const prefix = `${date}-`
  const nums = readdirSync(dir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => Number.parseInt(f.slice(prefix.length, prefix.length + 2), 10))
    .filter((n) => Number.isFinite(n))
  const next = (nums.length === 0 ? 0 : Math.max(...nums)) + 1
  return String(next).padStart(2, '0')
}

function main() {
  if (!existsSync(TARGET_REPO)) {
    console.error(`[checkpoint] TARGET_REPO does not exist: ${TARGET_REPO}`)
    process.exit(2)
  }

  // Throttle
  const last = findLastCheckpoint()
  if (last) {
    const ageSec = (Date.now() - last.mtime) / 1000
    if (ageSec < MIN_INTERVAL_SEC) {
      console.log(`[checkpoint] SKIP — last checkpoint ${Math.round(ageSec)}s ago (< ${MIN_INTERVAL_SEC}s)`)
      return
    }
  }

  // Don't checkpoint mid-edit
  const dirty = sh('git status --porcelain', { cwd: TARGET_REPO })
  if (dirty) {
    console.log('[checkpoint] SKIP — target working tree is dirty; commit first.')
    return
  }

  // Fetch commits since last checkpoint (or since 30 min ago as fallback)
  const sinceArg = last
    ? new Date(last.mtime).toISOString()
    : new Date(Date.now() - MIN_INTERVAL_SEC * 1000).toISOString()
  const commits = sh(
    `git log --since="${sinceArg}" --pretty=format:"%h %s" --no-merges`,
    { cwd: TARGET_REPO },
  )

  if (!commits) {
    console.log('[checkpoint] SKIP — no new commits since last checkpoint.')
    return
  }

  const date = isoDate()
  const seq = nextSeqFor(date)
  const id = `${date}-${seq}`
  const filename = `${date}-checkpoint-${seq}.md`
  const dest = resolve(AGENT_REPO, 'memory', 'sessions', filename)
  const commitLines = commits.split('\n').filter(Boolean)
  const shas = commitLines.map((l) => l.split(' ')[0])

  const body = [
    '---',
    `id: ${id}`,
    `run_id: ${CHAT_RUN_ID}`,
    `title: "${PROJECT_SLUG} — auto checkpoint ${seq}"`,
    `project: ${PROJECT_SLUG}`,
    'topics:',
    '  - checkpoint',
    '  - auto-snapshot',
    'commits:',
    ...shas.map((s) => `  - ${s}`),
    'status: partial',
    `date: ${date}`,
    '---',
    '',
    `# ${PROJECT_SLUG} — auto checkpoint ${seq}`,
    '',
    `Automated 30-min snapshot triggered by \`memory/scripts/checkpoint.mjs\`.`,
    `Chat context: ${CHAT_RUN_ID}`,
    '',
    '## Commits since last checkpoint',
    '',
    ...commitLines.map((l) => `- \`${l.split(' ')[0]}\` ${l.split(' ').slice(1).join(' ')}`),
    '',
    '## Open work',
    '',
    'See chat transcript. This checkpoint is intentionally minimal — the point',
    'is to guarantee the commit trail is captured, not to duplicate narrative.',
    '',
  ].join('\n')

  if (DRY_RUN) {
    console.log(`[checkpoint] DRY_RUN — would write ${dest}`)
    console.log(body)
    return
  }

  writeFileSync(dest, body, 'utf8')

  // Regenerate index + validate
  try {
    sh('node memory/scripts/index-from-fm.mjs', { cwd: AGENT_REPO })
  } catch (err) {
    console.warn('[checkpoint] index-from-fm.mjs failed:', err.message)
  }
  try {
    sh('node memory/scripts/validate.mjs', { cwd: AGENT_REPO })
  } catch (err) {
    console.warn('[checkpoint] validator returned errors — file kept locally, NOT committing.')
    console.warn(err.stdout ?? err.message)
    return
  }

  // Commit + push (best-effort)
  try {
    sh(`git add memory/sessions/${filename} memory/index.jsonl`, { cwd: AGENT_REPO })
    sh(`git commit -m "checkpoint: ${PROJECT_SLUG} ${id} (${shas.length} commits)"`, {
      cwd: AGENT_REPO,
    })
    sh('git push', { cwd: AGENT_REPO })
    console.log(`[checkpoint] OK — pushed ${filename}`)
  } catch (err) {
    console.warn('[checkpoint] git push failed:', err.message)
  }
}

main()
