# V1.2.0 Test Matrix - Event Modification Foundation

Stand: 2026-05-08
Status: eingefroren

## Engine-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V120-T001 | Imminent Event | V120-MUST-001, V120-MUST-002 | Engine-Test: Damage-Event erzeugt vor Auflösung ein kanonisches imminent event. |
| V120-T002 | Pipeline-Typen | V120-MUST-003, V120-MUST-004 | Engine-Test: prevent/avoid/interrupt sind getrennt; Replacement bleibt nicht verfügbar. |
| V120-T003 | Keine Kandidaten | V120-MUST-005, V120-MUST-006 | Engine-Test: Event ohne Kandidaten löst unverändert auf und replayt. |
| V120-T004 | Prevention Apply | V120-MUST-007, V120-MUST-014, V120-MUST-015 | Engine-Test: Damage Prevention reduziert/verhindert Damage vor RandomDrawRecords. |
| V120-T005 | Prevention Pass | V120-MUST-006, V120-MUST-012 | Engine-Test: Pass löst Original-Damage unverändert aus. |
| V120-T006 | Teil-Prevention | V120-MUST-007, V120-MUST-020 | Engine-Test: Restdamage erzeugt nur passende RandomDrawRecords und StateHash. |
| V120-T007 | Avoid Alternativpilot | V120-MUST-008, V120-MUST-016 | Engine-Test falls genutzt: Tag-Avoid vermeidet `add_tag`; sonst als nicht genutzt dokumentieren. |
| V120-T008 | Interrupt eng | V120-MUST-009 | Engine-Test oder Harness: Interrupt wirkt nur vor Auflösung und ersetzt kein Event. |
| V120-T009 | Revalidation | V120-MUST-010, V120-MUST-011 | Manipulierte Action mit falscher Event-ID, Side, StateVersion, Kosten oder Choice wird abgelehnt. |
| V120-T010 | Mehrere Kandidaten | V120-MUST-013 | Engine-Test: konfliktfreie Reihenfolge deterministisch oder sichtbarer Blocker. |
| V120-T011 | Keine Kartenpromotion | V120-MUST-017, V120-MUST-018 | Catalog/Deck-Test: Runtime-Kartenpool und KI-Deckpool bleiben unverändert. |
| V120-T012 | Replay | V120-MUST-019, V120-MUST-020 | Replay-Test: prevent/pass/avoid-Pfade ergeben stabilen finalen StateHash. |

## Visibility-, Server- und Multiplayer-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V120-T013 | PlayerView | V120-MUST-021 | Engine-PlayerView-Test: Nur berechtigte Seite sieht private Kandidaten. |
| V120-T014 | PublicEvents | V120-MUST-022 | Visibility-Test: PublicEvents enthalten keine nicht sichtbaren Quellen/Choices. |
| V120-T015 | WebSocket | V120-MUST-023 | Server-Test: WebSocket EventTail leakt keine private Candidate-Liste. |
| V120-T016 | Reconnect | V120-MUST-023, V120-MUST-028 | Server-Test: Reconnect während Event-Modification-Fenster stellt side-sichere PendingChoice wieder her. |
| V120-T017 | Idempotency/Stale | V120-MUST-028 | Server-Test: doppelte oder stale Modifikationsaction erzeugt keinen doppelten Outcome. |
| V120-T018 | Undo öffentlich | V120-MUST-024 | Server/Engine-Test: Public Pass ohne Hidden Info folgt bestehenden Undo-Regeln. |
| V120-T019 | Undo Hidden Barrier | V120-MUST-024 | Server/Engine-Test: Private Modifikation oder Damage-Randomness blockiert Undo. |
| V120-T020 | Error Redaction | V120-MUST-021, V120-MUST-022 | Negative Tests: Fehler nennen keine verdeckten Kandidaten oder Kartentitel. |

## KI-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V120-T021 | AIInput | V120-MUST-025 | AI-/Visibility-Test: KI-Input enthält nur PlayerView/LegalActions/EventTail. |
| V120-T022 | KI Apply/Pass | V120-MUST-026, V120-MUST-027 | AI-Test: KI wählt verfügbare legale Modifikation oder Pass. |
| V120-T023 | KI Fallback | V120-MUST-026 | AI-Test: unbekanntes Fenster endet in legalem Pass-/No-op-Fallback. |
| V120-T024 | DecisionDebug Redaction | V120-MUST-027 | AI-Test: Debug enthält keine private gegnerische Modifikationsquelle. |
| V120-T025 | KI-Smoke | V120-MUST-026 | AI-vs-AI oder Human-vs-KI Smoke: neue Fenster hängen nicht. |

## Web- und E2E-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V120-T026 | PendingChoice UI | V120-MUST-029 | Web-Test: UI rendert Event-Modification-Choice aus PlayerView. |
| V120-T027 | No Client Candidates | V120-MUST-029 | Web-Test/Review: Client berechnet keine Modifikationskandidaten. |
| V120-T028 | Browser Smoke | V120-MUST-021, V120-MUST-023, V120-MUST-029 | E2E: Modifikationsfenster erscheint nur berechtigter Seite. |
| V120-T029 | Leak Scan | V120-MUST-021, V120-MUST-022, V120-MUST-023, V120-MUST-025 | E2E/DOM/Storage/Payload-Leak-Scan. |
| V120-T030 | No-Scope | V120-MUST-030 | Regression: keine Replacement-, Karten-, Special-Zone-, Asset- oder Plattformänderung. |

## Pflichtchecks

Die konkreten Paketnamen können durch die laufende NETGRID-Umbenennung abweichen; der Umsetzungsthread nutzt die dann aktuellen Workspace-Skripte.

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Engine-, Server-, AI-, Web- und Visibility-Spec-Läufe für die oben genannten Tests

## Gate-Auswertung

V1.2.0 darf finalisiert werden, wenn:

- Damage Prevention oder der dokumentierte Alternativpilot grün ist,
- Replay/StateHash für apply/pass-Pfade grün ist,
- Visibility-, Reconnect-, Undo- und AIInput-Leaktests grün sind,
- keine Replacement- oder Kartenfreigabe entstanden ist.
