# Protos-Agent Memory

Trajna baza znanja za AI agente — odluke, projekti, greške i obrasci iz stvarnog rada.

## Struktura

| Put | Svrha |
|-----|--------|
| `memory/projects/` | Sažetak po projektu (stack, arhitektura, tajne, ključne putanje) |
| `memory/sessions/` | Dnevnik sesija — što je napravljeno i zašto |
| `memory/learnings/` | Ponovno upotrebljivi obrasci i fix-evi |
| `memory/index.jsonl` | Indeks sesija (jedan JSON red po unosu) |

## Pravila

1. **Prije novog zadatka** — pročitaj `memory/projects/<projekt>.md` ako postoji.
2. **Nakon značajnog rada** — dopuni session + project + learnings; dodaj red u `index.jsonl`.
3. **Ne dupliciraj** — ažuriraj postojeći project file umjesto novog ako je isti projekt.
4. **Tajne** — nikad puni API ključevi; samo *gdje* idu (Vercel / Supabase / GitHub).

## Aktivni projekti

- [Protos-Web](./projects/protos-web.md) — `www.protosweb.eu` (Next.js 14, Vercel, Supabase)
- [Bodulica](./projects/bodulica.md) — `bodulica.shop` (vanilla HTML/JS, Cloudflare Pages, Supabase Edge, Stripe)
