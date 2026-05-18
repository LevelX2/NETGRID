# V1.8.1 Test Matrix - Mechanikpaket H

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V181-T001 | Abhängigkeit | V181-MUST-001 | Review: V1.8.0 Final Gate ist grün. |
| V181-T002 | Preflight-Schnitt | V181-MUST-002, V181-MUST-004, V181-MUST-005, V181-MUST-013 | Artefakt-Test: `freigabefähig`/`deferred` je Karte dokumentiert. |
| V181-T003 | Kernkorb exakt 12 | V181-MUST-003 | Unit-/Catalog-Test: Kartenliste exakt und vollständig. |
| V181-T004 | Clown-Encounter-Modifier | V181-MUST-006 | Engine-Test: ICE-Stärke während Encountern deterministisch `-1` bei installiertem Clown. |
| V181-T005 | Pattel/Pox Trigger + Purge | V181-MUST-007, V181-SHOULD-003 | Engine-Test: erfolgreiche Runs erzeugen Virus-Counter; Purge entfernt Karten- und Server-Viruszustände. |
| V181-T006 | Inside Job Bypass | V181-MUST-008 | Engine-Test: erster ICE im Run wird deterministisch bypassed. |
| V181-T007 | Server-Install-Tax | V181-MUST-009, V181-SHOULD-002 | Engine-Test: Restrictive Net Zoning + Pox erhöhen ICE-Installkosten servergebunden. |
| V181-T008 | Coup-Agenda-Aktionen | V181-MUST-010 | Engine-Test: Score-Counter (5/6) + LegalAction-only Click->Credit inkl. Revalidierung. |
| V181-T009 | Run-Folgeflags ICE-Paket | V181-MUST-011, V181-SHOULD-001 | Engine-Test: Ball and Chain / Canis Major / Canis Minor / Fatal Attractor / Shock.r deterministisch. |
| V181-T010 | Replay/Visibility/StateHash | V181-MUST-012 | Regression über Engine-/Server-Testpfade. |
| V181-T011 | No-Scope | V181-MUST-014 | No-Scope-Review: keine Würfel-/Ambush-/V2.x-/Public-Feature-Ausweitung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v181-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.8.1 Mechanikpaket H`
- `packages/catalog/src/index.test.ts::catalog import and status logic`

## Gate-Auswertung

V1.8.1 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 12er-Kernkorb exakt freigegeben ist und Counter-/Purge-/Run-Folgeflag-Pfade deterministisch ohne Hidden-Info-Leak laufen.