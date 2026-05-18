# V1.7.2 Test Matrix - Mechanikpaket F

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V172-T001 | Abhängigkeit | V172-MUST-001 | Review: V1.7.1 Final Gate ist grün. |
| V172-T002 | Preflight-Schnitt | V172-MUST-002, V172-MUST-010 | Artefakt-Test: `freigabefähig`/`deferred` je Karte dokumentiert. |
| V172-T003 | Kernkorb exakt 5 | V172-MUST-003 | Unit-/Catalog-Test: Kartenliste exakt und vollständig. |
| V172-T004 | Last-Turn-Run-Attempt-Gates | V172-MUST-004, V172-SHOULD-002 | Engine-Test: `Audit of Call Records` (>=2) und `Chance Observation` (>=1) legal/illegal. |
| V172-T005 | Operation-Trace-Fenster | V172-MUST-004, V172-MUST-005, V172-SHOULD-001 | Engine-Test: Trace aus Corp-Operation ohne aktiven Run, deterministische Rückkehr in Corp-Action-Context. |
| V172-T006 | Resource-Tag-Interaktion | V172-MUST-006 | Engine-Test: `Corporate Detective Agency` trasht bis zu zwei Runner-Resources ohne Zusatzkosten. |
| V172-T007 | Tag-Remove-Resource-Ability | V172-MUST-007 | Engine-Test: `Danshi's Second ID` entfernt bis zu 3 Tags ohne Credit-Kosten und trasht sich bei Nutzung. |
| V172-T008 | Action-Economy-Resource-Ability | V172-MUST-008 | Engine-Test: `Silicon Saloon Franchise` gibt +1 Credit und +1 Draw pro Aktion. |
| V172-T009 | Replay/Visibility/StateHash | V172-MUST-009 | Regression über Engine-/Server-Testpfade. |
| V172-T010 | Runtime-Allowlist | V172-MUST-010 | Catalog-Test: Runtime-Allowlist nur +5, kein neuer AI-Support. |
| V172-T011 | No-Scope | V172-MUST-011 | No-Scope-Review: keine Agenda-/Counter-/Public-Feature-Ausweitung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.7.2 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 5er-Kernkorb exakt freigegeben ist und Operation-Trace-/Tag-/Resource-/ActionEconomy-Pfade deterministisch ohne Leak laufen.
