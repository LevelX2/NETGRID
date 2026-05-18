# V1.2.3 Test Matrix - Mechanic Unlock Card Release 1

Stand: 2026-05-08
Status: eingefroren

## Preflight- und Manifest-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V123-T001 | Abhaengigkeit | V123-MUST-001 | Review/Test-Setup: V1.2.2-Final-Gate ist gruen. |
| V123-T002 | Finale Kartenliste | V123-MUST-002 | Review: finale Liste mit maximal 20 Karten liegt vor. |
| V123-T003 | Quellen/Provenienz | V123-MUST-003 | Manifest-Test: jede Karte hat Quelle. |
| V123-T004 | RequiredMechanics | V123-MUST-004, V123-MUST-007 | Manifest-/MechanicSupport-Test: alle Mechaniken sind abgedeckt. |
| V123-T005 | ResolverRefs | V123-MUST-005 | Manifest-/Engine-Test: jede human_playable Karte hat Resolver/Ability. |
| V123-T006 | No Auto-Promotion | V123-MUST-006 | Katalog-Test: listed/imported/image-only wird nicht spielbar. |
| V123-T007 | Deferred Blocker | V123-MUST-008, V123-MUST-029 | Review/Test: zurueckgestellte Karten bleiben gesperrt. |
| V123-T008 | Manifestdatei | V123-MUST-009 | JSON-/Schema-Test fuer Manifest 1.2.3. |

## Engine-, Katalog- und Decktests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V123-T009 | Runtime-Gate | V123-MUST-010 | Katalog-Test: exakt V1.2.3-Karten werden promoted. |
| V123-T010 | Decklegalitaet | V123-MUST-011 | Deck-Test: deck_legal setzt human_playable voraus. |
| V123-T011 | Matchstart-Revalidierung | V123-MUST-012 | Server-Test: Matchstart blockiert nicht freigegebene Karten. |
| V123-T012 | Statusanzeige | V123-MUST-013 | Katalog/Web-Test: Status getrennt sichtbar. |
| V123-T013 | Per-Card Tests | V123-MUST-014 | Engine-Test: jede freigegebene Karte hat Testabdeckung. |
| V123-T014 | Batch-Szenario | V123-MUST-015 | Szenario-Test: v123-card-release-smoke mit finalem StateHash. |
| V123-T015 | Visibility | V123-MUST-016 | Visibility-Test: neue Bewegungen/Effekte leaken nicht. |
| V123-T016 | Replay/StateHash | V123-MUST-017 | Replay-Test: neue Effekte deterministisch. |
| V123-T017 | Existing Cards Stable | V123-MUST-010 | Regression: V1.0.5K/V1.0.6K/V1.1.2K bleiben unveraendert. |

## Server-, Multiplayer-, Undo- und E2E-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V123-T018 | Multiplayer Smoke | V123-MUST-018 | Server/E2E: V1.2.3-Deck startet und spielt relevanten Effekt. |
| V123-T019 | Reconnect | V123-MUST-019 | Server-Test: Reconnect waehrend neuem Effektpfad side-sicher. |
| V123-T020 | Undo | V123-MUST-020 | Engine/Server-Test: Undo vor/nach Effekt gemaess Spezifikation. |
| V123-T021 | Browser Smoke | V123-MUST-021 | E2E: Browser spielt V1.2.3-Deck ohne UI-Hänger. |
| V123-T022 | Leak Scan | V123-MUST-022 | DOM/Storage/Payload-Leak-Scan fuer neue Karten. |

## KI-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V123-T023 | AI-Hints Blocker | V123-MUST-023 | Manifest-/AI-Test: ohne Hints kein ai_supported. |
| V123-T024 | AI-Hints Schema | V123-MUST-024 | AI-Daten-Test: Rollen, Mechanics, Fallback, Szenarien vorhanden. |
| V123-T025 | KI-Deckpool | V123-MUST-025, V123-MUST-026 | AI-Test: Deckpool nutzt nur ai_supported. |
| V123-T026 | KI-Smoke | V123-MUST-027 | AI-Smoke: keine illegalen Actions oder Hänger. |
| V123-T027 | DecisionDebug | V123-MUST-028 | AI-Test: Debug bleibt side-sicher. |

## Review- und No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V123-T028 | Final Review Listen | V123-MUST-029 | Review: freigegeben, human-only, ai-supported, deferred getrennt. |
| V123-T029 | No-Scope | V123-MUST-030 | Regression: keine Format-/Public-/Asset-/Parser-Ausweitung. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Shared-, Catalog-, Decks-, Engine-, Server-, AI-, Web- und Visibility-Tests fuer V1.2.3

## Gate-Auswertung

V1.2.3 darf finalisiert werden, wenn:

- die finale Kartenliste exakt im Runtime-Gate abgebildet ist,
- jede freigegebene Karte Manifest-, Resolver-, Test-, Visibility- und Replay/StateHash-Abdeckung hat,
- `ai_supported` nur mit AI-Hints und KI-Smoke gesetzt wurde,
- keine nicht freigegebene Karte in Matchstart oder KI-Deckpool gelangt.
