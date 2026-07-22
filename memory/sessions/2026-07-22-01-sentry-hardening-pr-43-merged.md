---
id: 2026-07-22-01
date: 2026-07-22
project: Protos-Web
title: Sentry hardening PR #43 — merged (close-out)
run_id: cursor-2026-07-22-agent-session
commits:
  - aa84ccc
topics:
  - sentry
  - session-replay
  - ignore-errors
  - pr-merge
  - close-out
tags: []
---

---

## RETRACTED / SUPERSEDED 2026-07-22

**Sentry uklonjen u potpunosti** (PR #47, squash `5d046b6`). Integracija,
DSN usage, Replay, ignoreErrors — više nisu u kodu. Vidi close-out sesiju
[`2026-07-22-06`](2026-07-22-06-sentry-rip-out-and-konfigurator-verify.md).
Zadrži ovaj fajl samo kao historiju odluke, ne kao aktivan runbook.

---

# Session 2026-07-22 (01) — Sentry hardening PR #43 merged

## Kontekst

Nastavak sesije `2026-07-20-13`. PR #43 (Sentry hardening — `ignoreErrors`
filter + Replay canvas block) je bio otvoren od 2026-07-20, sve CI provjere
zelene, samo nije bio pritisnut merge gumb. User na startu današnje sesije
tražio je "ako je merge okej, uradi to sa zadnjim commitom jer ne znam
zašto još samo stoji open".

## Što je napravljeno

- Verificiran mergeStateStatus `CLEAN`, mergeable `MERGEABLE`, sve CI
  provjere `SUCCESS` (Build, Supabase, Cloudflare DNS, Vercel).
- Squash merge PR #43 → commit `aa84ccc` na `main` (2026-07-22 00:02 UTC).
- Remote `feat/sentry-hardening` grana automatski obrisana (Vercel repo ima
  auto-delete on merge uključeno).
- Lokalno prebačen na `main`, fast-forward `690459a..aa84ccc`, working tree
  clean.

## Odluke i tradeoffi

- **Squash umjesto merge/rebase**: potvrđeno da je konvencija repo-a (svi
  prethodni merged PR-ovi imaju `... (#NN)` suffix pattern u main commit
  message-u, što je squash signal).
- **Preostale mrtve grane** (`feat/sentry-adoption`, `fix/admin-konfigurator-assets-crash-boundaries`):
  ostavljene za sada, obrisane tek nakon PR #45 merge-a u istoj sesiji.

## Otvoreno / Sljedeći koraci

- [ ] Kroz 1-2 tjedna: pregledati Sentry Issues dashboard — mjerenje je li
  `ignoreErrors` + Replay canvas block stvarno smanjilo noise (metrika:
  events/day prije vs poslije).
- [ ] Ako Replay video-i daju vrijednost samo za konfigurator crashove →
  razmisliti o route-based sampling (`replaysOnErrorSampleRate` samo na
  `/admin/*`).

## Reference

- Prethodna sesija: `memory/sessions/2026-07-20-13-sentry-hardening-pr-43.md`
- PR: <https://github.com/ProtosEschatos/Protos-Web/pull/43>
- Squash commit: [aa84ccc](https://github.com/ProtosEschatos/Protos-Web/commit/aa84ccc)
