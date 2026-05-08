# V1.2.1 Test Matrix - Replacement Effects

Stand: 2026-05-08
Status: eingefroren

## Engine-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V121-T001 | V1.2.0-Abhängigkeit | V121-MUST-001 | Review/Test-Setup: V1.2.0-Gate ist grün, bevor Replacement implementiert wird. |
| V121-T002 | Pipeline-Trennung | V121-MUST-002 | Engine-Test: Replacement ist nicht Prevention/Avoid/Interrupt. |
| V121-T003 | Originalevent | V121-MUST-003 | Engine-Test: Replacement bezieht sich auf kanonisches Originalevent. |
| V121-T004 | Replacementevent | V121-MUST-004 | Engine-Test: Apply erzeugt kanonisches Replacementevent. |
| V121-T005 | EventLog-Paar | V121-MUST-005 | EventLog-Test: Originalevent und Replacementevent sind gemeinsam nachvollziehbar. |
| V121-T006 | Original nicht doppelt | V121-MUST-006 | Engine-Test: Originalevent wird nach Apply nicht zusätzlich angewandt. |
| V121-T007 | Einmal-pro-Fenster | V121-MUST-007 | Engine-Test: gleicher Kandidat kann pro Window nur einmal greifen. |
| V121-T008 | Deterministische Reihenfolge | V121-MUST-008 | Engine-Test: Kandidaten werden stabil sortiert. |
| V121-T009 | Konfliktblocker | V121-MUST-009 | Engine-Test: mehrdeutige Konflikte blockieren sichtbar. |
| V121-T010 | Candidate Scope | V121-MUST-010, V121-MUST-012 | Engine-Test: nicht freigegebene Access/Trash/Steal-Kandidaten bleiben blockiert. |
| V121-T011 | Damage Pilot | V121-MUST-011 | Engine-Test: Damage Replacement ersetzt Damage vor Randomness. |
| V121-T012 | Revalidation | V121-MUST-013, V121-MUST-014 | Manipulierte PlayerAction mit falscher Window-/Event-/Candidate-ID wird abgelehnt. |
| V121-T013 | Pass/No-op | V121-MUST-015 | Engine-Test: optionales Replacement kann legal gepasst werden. |
| V121-T014 | Replay | V121-MUST-016 | Replay-Test: Pass und Apply rekonstruieren gleiche Eventfolge. |
| V121-T015 | StateHash | V121-MUST-017 | StateHash-Test: ersetzter und nicht ersetzter Pfad unterscheiden sich stabil. |
| V121-T016 | MechanicSupport | V121-MUST-029 | Review/Test: Coverage ist granular nach Replacementtyp vorbereitet. |

## Visibility-, Server- und Multiplayer-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V121-T017 | PlayerView | V121-MUST-018 | Engine-PlayerView-Test: Nur berechtigte Seite sieht private Replacement-Kandidaten. |
| V121-T018 | PublicEvents | V121-MUST-019 | Visibility-Test: PublicEvents leaken keine verdeckten Replacement-Quellen. |
| V121-T019 | WebSocket | V121-MUST-020 | Server-Test: WebSocket EventTail bleibt side-sicher. |
| V121-T020 | Reconnect | V121-MUST-020 | Server-Test: Reconnect während ReplacementWindow zeigt korrekte PendingChoice. |
| V121-T021 | Undo Pass | V121-MUST-021 | Server/Engine-Test: Pass ohne Hidden Info folgt bestehenden Undo-Regeln. |
| V121-T022 | Undo Apply Hidden | V121-MUST-021 | Server/Engine-Test: private Replacement-Quelle blockiert Undo. |
| V121-T023 | Idempotency/Stale | V121-MUST-014 | Server-Test: duplicate/stale Replacement-Actions erzeugen keinen doppelten Ersatz. |
| V121-T024 | Error Redaction | V121-MUST-018, V121-MUST-019 | Negative Tests: Konflikt-/Fehlermeldungen leaken keine Hidden Info. |

## KI-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V121-T025 | AIInput | V121-MUST-022 | AI-/Visibility-Test: KI-Input enthält keine gegnerischen privaten Kandidaten. |
| V121-T026 | KI LegalAction | V121-MUST-023 | AI-Test: KI wählt Replacement nur über LegalActions. |
| V121-T027 | KI Strategy Gate | V121-MUST-024, V121-MUST-025 | AI-Test: ohne AI-Hints passt/fallbackt KI legal. |
| V121-T028 | DecisionDebug | V121-MUST-026 | AI-Test: Debug nennt Original/Replacement nur side-sicher. |
| V121-T029 | KI-Smoke | V121-MUST-025 | Smoke: ReplacementWindow erzeugt keinen KI-Hänger. |

## Web- und E2E-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V121-T030 | PendingChoice UI | V121-MUST-018 | Web-Test: ReplacementChoice rendert aus PlayerView. |
| V121-T031 | Original/Replacement Anzeige | V121-MUST-018, V121-MUST-019 | Web-Test: sichtbares Originalevent und Ersatzoption werden redigiert korrekt angezeigt. |
| V121-T032 | No Client Candidates | V121-MUST-013 | Web-Test/Review: Client berechnet keine Replacement-Kandidaten. |
| V121-T033 | Browser Smoke | V121-MUST-020, V121-MUST-021 | E2E: ReplacementWindow, Pass/Apply und Reconnect funktionieren. |
| V121-T034 | Leak Scan | V121-MUST-018, V121-MUST-019, V121-MUST-020, V121-MUST-022 | DOM/Storage/Payload-Leak-Scan. |
| V121-T035 | No-Scope | V121-MUST-027, V121-MUST-028, V121-MUST-030 | Regression: keine Karten-/KI-Deck-/Special-Zone-/Plattformfreigabe. |

## Pflichtchecks

Die konkreten Paketnamen können durch die laufende NETGRID-Umbenennung abweichen; der Umsetzungsthread nutzt die dann aktuellen Workspace-Skripte.

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Engine-, Server-, AI-, Web- und Visibility-Spec-Läufe für die oben genannten Tests

## Gate-Auswertung

V1.2.1 darf finalisiert werden, wenn:

- Originalevent und Replacementevent korrekt geloggt und replaybar sind,
- Einmal-pro-Fenster und Konfliktblocker grün sind,
- Visibility-, Reconnect-, Undo- und AIInput-Leaktests grün sind,
- keine neue Karte und kein KI-Deck freigegeben wurde.
