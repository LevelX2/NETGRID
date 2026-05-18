# V1.8.0 Final Review - Mechanikpaket G

Stand: 2026-05-09  
Status: passed

## Gate-Ergebnis

V1.8.0 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_8_0_implemented: true`; `V1_8_0_verified: true`; `V1_8_0_done: true`; `ready_for_V1_8_1: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.7.2 | pass |
| Preflight `freigabefähig`/`deferred` | pass |
| Kernkorb exakt 6 Karten | pass |
| Agenda-Subtype-Theft-Gates | pass |
| Corporate-Ally-Agenda-Kostenpfad + Difficulty | pass |
| Databroker-Aktionspfad | pass |
| Executive-Extraction-Static | pass |
| Project-Babylon-Overadvance-Bonus | pass |
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
