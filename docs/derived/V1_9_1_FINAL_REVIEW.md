# V1.9.1 Final Review - Mechanikpaket J

Stand: 2026-05-10  
Status: passed

## Gate-Ergebnis

V1.9.1 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_9_1_implemented: true`; `V1_9_1_verified: true`; `V1_9_1_done: true`; `ready_for_V1_9_2_manual_gate: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.9.0 | pass |
| Preflight `freigabefähig`/`deferred` | pass |
| Kernkorb exakt 3 Karten | pass |
| V191-T003 Cockroach Counter-Aufbau | pass |
| V191-T004 Cockroach HQ-Randomdiscard deterministic | pass |
| V191-T005 Incubator Counter-Aufbau | pass |
| V191-T006 Incubator Start-of-turn Multiroll | pass |
| V191-T007 Incubator Choice-Transform side-sicher | pass |
| V191-T008 Grubb remainder-of-run Strength | pass |
| V191-T009 Virus-Purge-Integration | pass |
| V191-T010 Replay/Visibility/StateHash-Regression | pass |
| V191-T011 Runtime-Gate/No-Scope | pass |
| Catalog-/Manifest-/Scenario-Konsistenz | pass |
| Webclient sichtbare Versionsnummer `V1.9.1` | pass |
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
