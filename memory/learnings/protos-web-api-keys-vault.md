# Learning: Encrypted API keys vault (AES-256-GCM u Supabase)

**Kontekst:** Protos-Web `/admin/kljucevi` — user je htio spremati stvarne API ključeve za razne servise (Sketchfab, OpenAI itd.) tako da ih server-side code može čitati bez izlaganja anon roli.

## Model

```
Plaintext key (user submits kroz admin UI)
     │
     ▼
encryptSecret(k, master = env ADMIN_KEYS_ENCRYPTION_KEY)
     │
     ├── ciphertext (base64)  ─┐
     ├── iv (base64)  ────────┤─→ INSERT INTO admin_api_keys (...)
     └── auth_tag (base64) ───┘     [RLS: service_role only, nikad anon]
     │
     ▼
maskSecret(k) → "sk_l...wxyz"  → stored kao masked_hint (safe za UI list view)
```

**Reveal flow (samo server-side actions iza `requireAdmin()`):**

```
requireAdmin() → serviceRole.select(row) → decryptSecret(...) → plaintext
     │
     └─ stamp last_used_at = now() (audit)
```

## Ključne komponente

- [`src/lib/security/api-keys-crypto.ts`](src/lib/security/api-keys-crypto.ts) — `encryptSecret`, `decryptSecret`, `maskSecret`, `getMasterKey`
- [`src/lib/config/api-key-providers.ts`](src/lib/config/api-key-providers.ts) — registry svih poznatih providera (OpenAI, Stripe, Sketchfab, DeepSeek, Gemini, itd.) s label/category/docsUrl/envHint
- [`src/lib/schemas/api-key.ts`](src/lib/schemas/api-key.ts) — Zod schemas (create/update)
- [`src/lib/queries/admin/api-keys.ts`](src/lib/queries/admin/api-keys.ts) — `listAdminApiKeys`, `create`, `update`, `delete`, `revealAdminApiKey`, `getActiveApiKey`
- [`src/actions/admin-api-keys.ts`](src/actions/admin-api-keys.ts) — server actions s `requireAdmin()` + Zod validation
- [`src/types/admin-api-keys.ts`](src/types/admin-api-keys.ts) — list item / form / update types (**nikad ne exposeaju ciphertext klijentu**)
- DB tablica `admin_api_keys` (migracija `supabase/migrations/20260720062823_admin_api_keys.sql`)

## Pravila

1. **Master key = env `ADMIN_KEYS_ENCRYPTION_KEY`** = base64 32 bytes. Generira se JEDNOM: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Postavi ISTU vrijednost u Vercel Production + Preview + Development.
2. **Gubitak master key-a = svi vault entries nečitljivi.** Backup master key IZVAN Vercela (password manager, sigurni tref).
3. **RLS `service_role only`** — nikad `anon` ili `authenticated` ne smiju čitati tablicu. Client komponente pristupaju SAMO kroz server actions.
4. **`masked_hint`** je jedino što UI list view pokazuje bez reveal action-a. Puni plaintext samo poslije eksplicitnog "Otkrij" gumba (koji zahtijeva requireAdmin i loga u `last_used_at`).
5. **`getActiveApiKey(provider)`** — convenience za druge server modele: `const key = await getActiveApiKey('sketchfab')` — koristi ovo umjesto direktnog `process.env.SKETCHFAB_API_TOKEN` kada je moguće (fallback pattern u `src/lib/config/sketchfab.ts`).

## UI

- Warning banner na `/admin/kljucevi` ako `ADMIN_KEYS_ENCRYPTION_KEY` nedostaje (aplikacija ne pada, blokira samo reveal)
- Grupiranje po providerskoj kategoriji
- Toast notifikacije na create/update/delete/reveal preko `useToastStore`

## Isti model za automation webhooks

Identičan pattern se koristi u `automation_webhooks` tablici — auth vrijednost (bearer/basic/custom header) šifrirana istim master key-om (`auth_ciphertext`, `auth_iv`, `auth_tag`).

## Kada koristiti (i kada ne)

**Da:**
- API ključevi trećih strana koje admin panel poziva server-side (Sketchfab, LLM providers, image APIs)
- Webhook autorizacija (šalju se u outbound HTTP)
- Svaki secret koji admin sam registrira kroz UI

**Ne:**
- Core infra secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_*`) — ostaju u Vercelu/Supabase Edge, ne u vault-u
- Client-side ključevi (nema smisla — anon key namijenjen javnosti)

## Zapamti

- **Sve nove providerske integracije** koje trebaju API key **preferiraju vault** (`getActiveApiKey`) uz fallback na `process.env.*` — vidi `src/lib/config/sketchfab.ts` kao referencu.
- **Never expose ciphertext klijentu.** Types u `src/types/admin-api-keys.ts` su namjerno tako složeni.
