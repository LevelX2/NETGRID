# V1.8.1 Final Review - Mechanikpaket H

Stand: 2026-05-10  
Status: passed

## Gate-Ergebnis

V1.8.1 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_8_1_implemented: true`; `V1_8_1_verified: true`; `V1_8_1_done: true`; `ready_for_next_release: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.8.0 | pass |
| Preflight `freigabefähig`/`deferred` | pass |
| Kernkorb exakt 12 Karten | pass |
| Clown-Encounter-Modifier | pass |
| Pattel/Pox Trigger + Purge | pass |
| Inside Job Bypass | pass |
| Restrictive/Pox Server-Install-Tax | pass |
| Coup-Agenda-Counteraktionen | pass |
| Ball/Canis/Fatal/Shock Run-Folgeflags | pass |
| Replay-/Visibility-/StateHash-Regression | pass |
| Catalog-/Manifest-/Scenario-Konsistenz | pass |
| No-Scope-Grenzen | pass |

## Pflichtchecks

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass

Hinweis: `corepack pnpm build` enthält weiterhin die bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Next/Turbopack-Trace-Pfad.
