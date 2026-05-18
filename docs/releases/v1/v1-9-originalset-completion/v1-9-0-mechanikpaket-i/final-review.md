# V1.9.0 Final Review - Mechanikpaket I

Stand: 2026-05-10  
Status: passed

## Gate-Ergebnis

V1.9.0 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_9_0_implemented: true`; `V1_9_0_verified: true`; `V1_9_0_done: true`; `ready_for_next_release: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhaengigkeitsgate V1.8.1 | pass |
| Preflight `freigabefaehig`/`deferred` | pass |
| Kernkorb exakt 5 Karten | pass |
| V190-T003 Deterministischer Wuerfelresolver | pass |
| V190-T004 Bartmoss post-encounter die | pass |
| V190-T005 Blink break-or-damage + usage-limit | pass |
| V190-T006 Terrorist-Reprisal Last-Turn-Gate | pass |
| V190-T007 Terrorist-Reprisal deterministic HQ-discard | pass |
| V190-T008 Banpei konkreter Sonderresolver | pass |
| V190-T009 Vacuum-Link deterministic rewind | pass |
| V190-T010 Ambush-on-access foundation hook | pass |
| V190-T011 Replay/Visibility/StateHash-Regression | pass |
| V190-T012 Runtime-Gate/No-Scope | pass |
| Catalog-/Manifest-/Scenario-Konsistenz | pass |
| Webclient sichtbare Versionsnummer `V1.9.0` | pass |
| No-Scope-Grenzen | pass |

## Pflichtchecks

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass

Hinweis: `corepack pnpm build` enthaelt weiterhin die bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Next/Turbopack-Trace-Pfad.
