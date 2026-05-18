# AI Simulation Test Matrix

Status: frozen_for_implementation  
Stand: 2026-05-03

## Unit Tests

| ID | Bereich | Erwartung | Requirement |
|---|---|---|---|
| T-AI-001 | Contract | AI-Input ist side-neutral für Runner und Corp. | V03-REQ-001 |
| T-AI-002 | Visibility | AI-Input enthält keinen FullState und keine Hidden-Info-Titel. | V03-REQ-002 |
| T-AI-003 | Controller | Controller-Typen erlauben Human, AI und Replay ohne Engine-Regelautorität. | V03-REQ-003 |
| T-AI-004 | Runner AI | Runner-KI wählt nur LegalActions und kann Access/Steal priorisieren. | V03-REQ-004 |
| T-AI-005 | Corp AI | Corp-KI wählt Mandatory/Score/Rez/Economy/Remote-Aufbau priorisiert. | V03-REQ-005 |
| T-AI-006 | Fallback | Ungültige interne Entscheidung wird deterministisch ersetzt. | V03-REQ-006 |
| T-AI-007 | Forbidden Fields | Serialisierter AI-Input enthält keine verbotenen Felder. | V03-REQ-002 |
| T-AI-008 | Determinismus | Gleicher Input ergibt gleiche Entscheidung. | V03-REQ-007 |
| T-AI-011 | Explanation | Decisions enthalten Reason-Code und Erklärung. | V03-REQ-010 |
| T-AI-012 | Explanation Visibility | Erklärungen leaken keine verdeckten Kartentitel. | V03-REQ-011 |

## Scenario/Integration

| ID | Szenario | Erwartung | Datei |
|---|---|---|---|
| SCN-AI-001 | Runner stiehlt R&D-Agenda | Runner-KI wählt Access und Steal legal. | `data/scenarios/ai-runner-steals-rd-agenda.json` |
| SCN-AI-002 | Corp scored Remote Agenda | Corp-KI kann Install/Advance/Score-Pfad wählen. | `data/scenarios/ai-corp-scores-remote-agenda.json` |
| SCN-AI-003 | KI-vs-KI Smoke Replay | Simulation endet reproduzierbar mit StateHash und Replay-Erfolg. | `data/scenarios/ai-vs-ai-smoke-replay.json` |

## Server/UI

| ID | Bereich | Erwartung |
|---|---|---|
| T-SRV-AI-001 | Human Runner vs Corp-KI | Match startet aktiv und Corp-KI handelt automatisch bis Runner dran ist. |
| T-SRV-AI-002 | Human Corp vs Runner-KI | Runner-KI handelt automatisch nach Corp-Zug. |
| T-SRV-AI-003 | KI-vs-KI API | Simulation liefert side-sichere Summary ohne FullState. |
| T-WEB-AI-001 | UI | Moduswahl und Simulationsergebnis sind ohne Engine-Import im Browser verfügbar. |

## Gates

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
