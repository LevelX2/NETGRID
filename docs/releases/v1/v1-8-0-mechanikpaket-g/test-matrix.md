# V1.8.0 Test Matrix - Mechanikpaket G

Stand: 2026-05-09  
Status: eingefroren

## Requirements- und Release-Gates

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V180-T001 | Abhängigkeit | V180-MUST-001 | Review: V1.7.2 Final Gate ist grün. |
| V180-T002 | Preflight-Schnitt | V180-MUST-002, V180-MUST-010 | Artefakt-Test: `freigabefähig`/`deferred` je Karte dokumentiert. |
| V180-T003 | Kernkorb exakt 6 | V180-MUST-003 | Unit-/Catalog-Test: Kartenliste exakt und vollständig. |
| V180-T004 | Runner-Event-Agenda-Gates | V180-MUST-004 | Engine-Test: `Desperate Competitor`/`Hot Tip for WNS` nur nach passender Agenda-Subtype-Liberation im selben Turn legal. |
| V180-T005 | Corporate-Ally-Kosten und Difficulty | V180-MUST-005, V180-SHOULD-001, V180-SHOULD-002 | Engine-Test: Install mit zusätzlichem Agenda-Punkt-Kostenpfad; Difficulty +1 aktiv solange installiert. |
| V180-T006 | Databroker-Aktion | V180-MUST-006, V180-SHOULD-002 | Engine-Test: Klick + Agenda-Punkt-Kosten + Self-Trash +10 Credits deterministisch. |
| V180-T007 | Executive-Extraction-Static | V180-MUST-007, V180-SHOULD-001 | Engine-Test: `gray_ops`-Agenda-Difficulty wird um 1 reduziert, andere Subtypen unverändert. |
| V180-T008 | Project-Babylon-Overadvance | V180-MUST-008 | Engine-Test: Zusatzpunkte pro zwei Overadvance-Counter beim Scoren korrekt und deterministisch. |
| V180-T009 | Replay/Visibility/StateHash | V180-MUST-009 | Regression über Engine-/Server-Testpfade. |
| V180-T010 | Runtime-Allowlist | V180-MUST-010 | Catalog-Test: Runtime-Allowlist nur +6, kein neuer AI-Support. |
| V180-T011 | No-Scope | V180-MUST-011 | No-Scope-Review: keine Counter-/Virus-/Purge-/Würfel-/Public-Feature-Ausweitung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Gate-Auswertung

V1.8.0 ist finalisierbar, wenn alle Pflichtchecks grün sind, der 6er-Kernkorb exakt freigegeben ist und Agenda-Difficulty-/Scored-Static-/Overadvance-Pfade deterministisch ohne Leak laufen.

