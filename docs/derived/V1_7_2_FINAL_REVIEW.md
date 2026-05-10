# V1.7.2 Final Review - Mechanikpaket F

Stand: 2026-05-09  
Status: passed

## Gate-Ergebnis

V1.7.2 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_7_2_implemented: true`; `V1_7_2_verified: true`; `V1_7_2_done: true`; `ready_for_V1_8_0: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.7.1 | pass |
| Preflight `freigabefähig`/`deferred` | pass |
| Kernkorb exakt 5 Karten | pass |
| Last-Turn-Run-Attempt-Gates | pass |
| Operation-Trace außerhalb Run-Kontext | pass |
| Tagged-Runner Resource-Trash | pass |
| Runner-Resource-Aktionen (Tag-Remove / Credit+Draw) | pass |
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
