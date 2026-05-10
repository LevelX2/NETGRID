# V1.9.1 Test Matrix - Mechanikpaket J

Stand: 2026-05-10  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V191-T001 | Abhängigkeit | V191-MUST-001 | Review: V1.9.0 Final Gate ist grün. |
| V191-T002 | Preflight-Schnitt | V191-MUST-002 | Artefakt-Test: exakt 3 Karten im V1.9.1-Kernkorb. |
| V191-T003 | Cockroach Counter-Aufbau | V191-MUST-003 | Engine-Test: erfolgreicher HQ-Run erhöht Cockroach-Counter deterministisch. |
| V191-T004 | Cockroach HQ-Randomdiscard | V191-MUST-003, V191-SHOULD-001 | Engine-/Scenario-Test: ab `>=2` Counter werden HQ-Discards randomisiert und replaybar. |
| V191-T005 | Incubator Counter-Aufbau | V191-MUST-004 | Engine-Test: erfolgreicher Run erhöht Incubate-Counter. |
| V191-T006 | Incubator Start-of-turn Multiroll | V191-MUST-004 | Engine-Test: pro Counter genau ein deterministic die roll; `6` erzeugt Transform-Pending. |
| V191-T007 | Incubator Choice-Transform | V191-MUST-005, V191-SHOULD-002 | Engine-Test: Choice-Resolver transformiert Virus-Counter korrekt und side-sicher. |
| V191-T008 | Grubb Remainder-of-run Strength | V191-MUST-006 | Engine-/Run-Test: Grubb-Pump bleibt über Encounter im gleichen Run erhalten, endet mit Run-Ende. |
| V191-T009 | Virus-Purge-Integration | V191-MUST-007 | Engine-Test: Purge entfernt Cockroach-/Incubator-/andere Virus-Counter konsistent. |
| V191-T010 | Replay/Visibility/StateHash | V191-MUST-008 | Replay- und Payload-Regression für Cockroach/Incubator/Grubb. |
| V191-T011 | Runtime-Gate/No-Scope | V191-MUST-009, V191-MUST-010 | Catalog-/Manifest-Test: nur 3 neue Karten, keine Scope-Erweiterung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Release-spezifische Smokes/Regressionen

- `data/scenarios/v191-card-release-smoke.json`
- `packages/engine/src/index.test.ts::V1.9.1 Mechanikpaket J`
- `packages/catalog/src/index.test.ts::catalog import and status logic`

## Gate-Auswertung

V1.9.1 ist finalisierbar, wenn:

1. der 3er-Kernkorb exakt freigegeben ist,
2. Cockroach-/Incubator-Zufallspfade deterministisch und side-sicher laufen,
3. Grubb-Remainder-of-run-Stärkepfad regressionsfrei ist,
4. alle Pflichtchecks grün sind.
