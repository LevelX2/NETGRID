# V1.9.4 Final Review - Mechanikpaket M

Stand: 2026-05-10  
Status: passed

## Gate-Ergebnis

V1.9.4 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_9_4_implemented: true`; `V1_9_4_verified: true`; `V1_9_4_done: true`; `V1_9_1_bis_V1_9_4_sequenziell_abgeschlossen: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.9.3 | pass |
| Preflight `freigabefähig`/`deferred` inkl. Data-Darts-Entscheidung | pass |
| Kernkorb exakt 2 Karten | pass |
| Tagged-only Damage-Aktionen der gescorten Agenden | pass |
| Replay/Visibility/StateHash-Regression | pass |
| Catalog-/Manifest-/Scenario-Konsistenz | pass |
| Webclient sichtbare Versionsnummer `V1.9.4` | pass |
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
