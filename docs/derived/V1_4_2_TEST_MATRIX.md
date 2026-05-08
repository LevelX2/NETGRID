# V1.4.2 Test Matrix - Belief State und Gegner-Modell

Stand: 2026-05-08
Status: eingefroren

## Memory- und Inputtests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V142-T001 | Abhängigkeit | V142-MUST-001 | Review: V1.4.1 Final Gate ist grün. |
| V142-T002 | Inputvertrag | V142-MUST-002, V142-MUST-003 | Hidden-Info-Test: Belief-Reconstructor erhält keinen FullState und keine verdeckten Gegnerkarten. |
| V142-T003 | Wissenstypen | V142-MUST-004 | Unit-Test: Einträge werden als Fakt, eigene Privatinfo, revealed Fact, Hypothese oder unknown klassifiziert. |
| V142-T004 | Determinismus | V142-MUST-005 | Replay-Test: gleiche side-sichere Historie erzeugt identischen Belief State. |
| V142-T005 | Undo/Reconnect | V142-MUST-006 | Server/AI-Test: Memory wird nach Undo/Reconnect rekonstruiert. |
| V142-T006 | Debug | V142-MUST-007 | Redaction-Test: DecisionDebug zeigt Hypothesen, aber keine private Wahrheit. |

## Modelltests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V142-T007 | Corp-Modelle | V142-MUST-008 | AI-Test: RunnerThreat, Aggression, BreakerAvailability und Serverdruck werden aus erlaubten Daten erzeugt. |
| V142-T008 | Runner-Modelle | V142-MUST-009 | AI-Test: CorpPlan, RemoteBelief, ICE-Risk, HQ/R&D-Werte und CreditInterpretation entstehen side-sicher. |
| V142-T009 | Remote-Hypothesen | V142-MUST-010 | Hidden-State-Invariance: unterschiedliche verdeckte Remote-Titel bei gleicher Sicht ändern keine Fakten. |
| V142-T010 | Unrezzed ICE | V142-MUST-011 | Redaction-Test: unrezzed ICE-Titel tauchen nicht auf. |
| V142-T011 | Archives/Reveal/Expose | V142-MUST-012 | Szenario: bekannte und unbekannte Archives-/Reveal-/Expose-Fakten werden korrekt markiert. |
| V142-T012 | Invalidation | V142-MUST-013 | Unit/Szenario: Shuffle, Arrange, Move und Reveal invalidieren betroffene Hypothesen. |

## R&D-Freshness und KI-Verhalten

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V142-T013 | R&D Freshness Negativfall | V142-MUST-014 | Szenario: Runner-KI wiederholt nicht mehrfach denselben bekannten wertlosen R&D-Top-Access. |
| V142-T014 | R&D Freshness Invalidation | V142-MUST-015 | Szenario: Nach Corp-Draw oder Shuffle wird R&D-Druck wieder normal bewertet. |
| V142-T015 | Hidden Invariance | V142-MUST-016 | Zwei echte States mit gleicher Sicht erzeugen gleichen Belief State oder gleiche deterministische Unsicherheit. |
| V142-T016 | Engine-Isolation | V142-MUST-017 | Replay/StateHash-Test: Belief State verändert echte GameState-Hashes nicht. |
| V142-T017 | No-Scope | V142-MUST-018 | Regression: keine neuen Karten, Mechaniken, Simulation, Selfplay, Replay-UI oder Public-Funktionen. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- gezielte AI-, Hidden-Info-, Replay-/StateHash-, Server-/Reconnect- und No-Scope-Tests

## Gate-Auswertung

V1.4.2 darf finalisiert werden, wenn Memory deterministisch, side-sicher, undo-/reconnect-stabil und ohne StateHash-Einfluss arbeitet.
