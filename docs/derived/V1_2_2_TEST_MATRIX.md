# V1.2.2 Test Matrix - Special Zones, Ownership und Control

Stand: 2026-05-08
Status: eingefroren

## Engine-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V122-T001 | Abhaengigkeit | V122-MUST-001 | Review/Test-Setup: V1.2.1-Final-Gate ist gruen. |
| V122-T002 | Set Aside Modell | V122-MUST-002 | Engine-Test: Karte kann test-only nach Set Aside bewegt werden. |
| V122-T003 | Removed Modell | V122-MUST-003 | Engine-Test: Karte kann test-only nach Removed from Game bewegt werden. |
| V122-T004 | Einzigartige ZoneRef | V122-MUST-004, V122-MUST-010 | Invariantentest: CardInstance existiert nach Move genau einmal. |
| V122-T005 | Owner/Controller Trennung | V122-MUST-005, V122-MUST-006 | Engine-Test: Owner bleibt unveraendert. |
| V122-T006 | Control Change | V122-MUST-007, V122-MUST-008 | Engine-Test: Controller wechselt deterministisch. |
| V122-T007 | Revalidation | V122-MUST-009 | Manipulierte PlayerAction mit falscher Side/StateVersion/Ziel wird abgelehnt. |
| V122-T008 | EventLog Moves | V122-MUST-011 | EventLog-Test: Spezialzonen-Move ist nachvollziehbar. |
| V122-T009 | Set Aside Return Harness | V122-MUST-012 | Test-only: Rueckkehrpfad erzeugt keine Runtime-Freigabe. |
| V122-T010 | Removed Terminal | V122-MUST-013 | Engine-Test: Removed from Game kehrt ohne freigegebenen Harness nicht zurueck. |
| V122-T011 | Host-Kaskade | V122-MUST-014, V122-MUST-015 | Engine-Test: gehostete Karten bleiben invariantensicher. |
| V122-T012 | Replay | V122-MUST-022 | Replay-Test: ZoneMove und ControlChange rekonstruieren Endzustand. |
| V122-T013 | StateHash | V122-MUST-023 | StateHash-Test: Zone und Controller beeinflussen Hash stabil. |
| V122-T014 | Baseline-Kompatibilitaet | V122-MUST-024 | Snapshot-/Replay-Test: alte Fixtures bleiben lesbar oder klar versioniert. |
| V122-T015 | MechanicSupport | V122-MUST-031 | Review/Test: granularer Mechanikstatus wird vorbereitet. |

## Visibility-, Server- und Multiplayer-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V122-T016 | PlayerView Spezialzonen | V122-MUST-016 | PlayerView-Test: sichtbare, side-private und hidden Spezialzonen werden korrekt projiziert. |
| V122-T017 | PublicEvents | V122-MUST-017 | Visibility-Test: keine verdeckten Kartenidentitaeten in PublicEvents. |
| V122-T018 | WebSocket | V122-MUST-018 | Server-Test: WebSocket-Payloads kommen aus side-sicherer Projektion. |
| V122-T019 | Reconnect | V122-MUST-019 | Server-Test: Reconnect nach ZoneMove/ControlChange bleibt side-sicher. |
| V122-T020 | Undo neutral | V122-MUST-020 | Undo-Test: Move ohne neue Hidden Info folgt bestehendem Vertrag. |
| V122-T021 | Undo Barriere | V122-MUST-021 | Undo-Test: neu sichtbare Hidden Info blockiert Undo. |
| V122-T022 | Idempotency/Stale | V122-MUST-009 | Server-Test: duplicate/stale Zone-/Control-Actions erzeugen keine Doppeltransition. |
| V122-T023 | Error Redaction | V122-MUST-017, V122-MUST-018 | Negative Tests: Fehler leaken keine Spezialzonen-Payloads. |

## KI-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V122-T024 | AIInput | V122-MUST-025 | AI-/Visibility-Test: keine gegnerischen Hidden-Zone-Daten im KI-Input. |
| V122-T025 | KI LegalAction | V122-MUST-026 | AI-Test: KI nutzt nur LegalActions fuer Special-Zone-/Control-Fenster. |
| V122-T026 | KI Fallback | V122-MUST-027 | AI-Test: ohne Hints passt/fallbackt KI legal. |
| V122-T027 | DecisionDebug | V122-MUST-028 | AI-Test: Debug nennt nur sichtbare Zone-/Controllerdaten. |
| V122-T028 | KI-Deck-No-Scope | V122-MUST-030 | Regression: KI-Deckpool bleibt unveraendert. |

## Web- und E2E-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V122-T029 | Zoneanzeige | V122-MUST-016 | Web-Test: Spezialzonen werden generisch und redigiert angezeigt, falls sichtbar. |
| V122-T030 | Controlleranzeige | V122-MUST-005, V122-MUST-007 | Web-Test: sichtbarer Controllerwechsel wird nicht als Ownerwechsel angezeigt. |
| V122-T031 | No Client Authority | V122-MUST-009 | Web-Test/Review: Client berechnet keine ZoneMoves oder Controllerwechsel selbst. |
| V122-T032 | Browser Smoke | V122-MUST-018, V122-MUST-019, V122-MUST-020 | E2E: Move, ControlChange, Reconnect, Undo-Pfad. |
| V122-T033 | Leak Scan | V122-MUST-016, V122-MUST-017, V122-MUST-018, V122-MUST-025 | DOM/Storage/Payload-Leak-Scan. |
| V122-T034 | No-Scope | V122-MUST-029, V122-MUST-030, V122-MUST-032, V122-MUST-033 | Regression: keine Karten-/KI-/Format-/Public-Freigabe. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Engine-, Server-, AI-, Web- und Visibility-Spec-Laeufe fuer die oben genannten Tests

## Gate-Auswertung

V1.2.2 darf finalisiert werden, wenn:

- ZoneRef-, Owner- und Controller-Invarianten gruen sind,
- PlayerViews, PublicEvents, WebSocket, Reconnect, Undo und AIInput keine Hidden-Info-Leaks zeigen,
- Replay und StateHash deterministisch bleiben,
- keine neue Karte und kein KI-Deck freigegeben wurde.
