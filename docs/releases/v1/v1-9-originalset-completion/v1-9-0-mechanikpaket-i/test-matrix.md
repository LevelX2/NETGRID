# V1.9.0 Test Matrix - Mechanikpaket I

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V190-T001 | Abhängigkeit | V190-MUST-001 | Review: V1.8.1 Final Gate ist grün. |
| V190-T002 | Preflight-Schnitt | V190-MUST-002, V190-MUST-013 | Artefakt-Test: 5er-Kernkorb exakt, Deferred-Karten explizit dokumentiert. |
| V190-T003 | Würfel-Resolver zentral | V190-MUST-003, V190-SHOULD-001 | Unit-Test: `rollDeterministicDie` liefert deterministische `1..6`-Ergebnisse inkl. RandomRecord-Fortschritt. |
| V190-T004 | Bartmoss-Wurf nach Encounter | V190-MUST-004 | Engine-Test: Nutzung bei Break triggert Wurf; Ergebnis `1` trasht Bartmoss, sonst kein Trash. |
| V190-T005 | Blink-Roll-Break/Damage | V190-MUST-005, V190-MUST-006 | Engine-Test: `4..6` bricht Subroutine, `1..3` verursacht Net Damage; pro Subroutine/Encounter nur einmal. |
| V190-T006 | Terrorist Reprisal Play-Condition | V190-MUST-007, V190-SHOULD-002 | Engine-Test: Event nur legal bei `corp_scored_black_ops_last_turn=true`. |
| V190-T007 | Terrorist Reprisal Random HQ Discard | V190-MUST-007 | Engine-/Scenario-Test: bis zu 5 HQ-Karten werden deterministisch und ohne Duplikate nach Archives verschoben. |
| V190-T008 | Banpei-Sonderresolver | V190-MUST-008 | Engine-Test: `trash program`-Subroutine greift deterministisch, danach `end the run` unverändert. |
| V190-T009 | Vacuum-Link-Rewind | V190-MUST-009 | Engine-/Scenario-Test: Wurf `1..3` rewound rezzte ICE korrekt; Edgecases (zu wenig rezzte ICE, erstes ICE) abgedeckt. |
| V190-T010 | Ambush-Foundation | V190-MUST-010, V190-SHOULD-004 | Foundation-Test: Ambush-Resolver-Einstiegspunkt wird im Access-Pfad deterministisch ausgeführt (Harness/Fixture). |
| V190-T011 | Replay/Visibility/StateHash | V190-MUST-011 | Regression über Engine-/Server-Testpfade bei Zufalls- und Rewind-Sequenzen. |
| V190-T012 | Runtime-Gate/No-Scope | V190-MUST-012, V190-MUST-014 | Catalog-/Manifest-Review: nur 5 Karten neu; keine V2.x- oder Public-Scope-Ausweitung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v190-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.0 Mechanikpaket I`
- `packages/catalog/src/index.test.ts::catalog import and status logic`

## Gate-Auswertung

V1.9.0 ist finalisierbar, wenn:

1. der 5er-Kernkorb exakt freigegeben ist,
2. Würfel-/Rewind-/Discard-Zufall deterministisch und replaybar läuft,
3. Ambush-Foundation nachweisbar vorhanden ist,
4. der Deferred-Überhang aus V1.8.1 unverändert dokumentiert bleibt.
