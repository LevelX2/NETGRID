# V1.3.0 Test Matrix - Format und Deckbuilding Foundation

Stand: 2026-05-08
Status: eingefroren

## Formatprofil- und Deckvalidierungstests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V130-T001 | Abhaengigkeit | V130-MUST-001 | Review/Test-Setup: V1.2.3-Final-Gate ist gruen. |
| V130-T002 | Formatprofil | V130-MUST-002 | Daten-/Schema-Test: lokales Formatprofil existiert und ist versioniert. |
| V130-T003 | Keine Spielbarkeit | V130-MUST-003, V130-MUST-004, V130-MUST-005 | Validierungstest: Formatprofil kann nicht spielbare Karte nicht freigeben. |
| V130-T004 | Side/Identity | V130-MUST-006 | Deck-Test: fehlende/falsche Identity blockiert. |
| V130-T005 | Faction | V130-MUST-007 | Deck-Test: Faction-Kompatibilitaet wird geprueft. |
| V130-T006 | Influence | V130-MUST-008 | Deck-Test: Influence-Kosten und Limit werden geprueft. |
| V130-T007 | Mindestdeckgroesse | V130-MUST-009 | Deck-Test: zu kleines Deck blockiert. |
| V130-T008 | Agenda | V130-MUST-010 | Deck-Test: Korp-Agenda-Punkte/-Dichte werden geprueft. |
| V130-T009 | Kopienlimit | V130-MUST-011 | Deck-Test: zu viele Kopien blockieren. |
| V130-T010 | Kopienlimit-Ausnahmen | V130-MUST-012 | Deck-Test: datengetriebene Ausnahme greift. |
| V130-T011 | Fehlende Daten | V130-MUST-013 | Deck-Test: fehlende Influence-/Agenda-/Identity-Daten blockieren betroffene Decks. |
| V130-T012 | Legale Beispiele | V130-MUST-027 | Deck-Test: legales Runner- und Korp-Beispieldeck validieren. |
| V130-T013 | Illegale Beispiele | V130-MUST-027 | Deck-Test: illegale Beispiele liefern stabile Fehlercodes. |

## Snapshot-, Import-/Export- und Matchstart-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V130-T014 | Snapshot Formatversion | V130-MUST-014 | Snapshot-Test: FormatProfile-ID/-Version im Decksnapshot. |
| V130-T015 | Matchstart Revalidierung | V130-MUST-015 | Server-Test: manipuliertes oder invalide Deck wird blockiert. |
| V130-T016 | Import/Export | V130-MUST-016 | Import-/Export-Test: Formatmetadaten bleiben erhalten. |
| V130-T017 | Legacy Decks | V130-MUST-017 | Migrationstest: altes Deck wird revalidation-pflichtig markiert. |
| V130-T018 | Replay/StateHash | V130-MUST-022 | Replay-Test: Snapshot und Formatversion reproduzieren StateHash. |
| V130-T019 | Deckmutation nach Start | V130-MUST-014, V130-MUST-022 | Test: nachtraegliche Deckaenderung aendert laufendes Match nicht. |

## Web-, Visibility- und E2E-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V130-T020 | Deckeditor Fehler | V130-MUST-018 | Web-Test: Fehler konkret, aber safe. |
| V130-T021 | Status-Trennung | V130-MUST-019 | Web/Katalog-Test: Katalogstatus, Spielbarkeit, Decklegalitaet, Formatlegalitaet getrennt. |
| V130-T022 | Gegnerische Decklisten | V130-MUST-020 | Visibility-Test: keine privaten Decklisten in Bootstrap/WebSocket/Reconnect. |
| V130-T023 | Deckhash/Profil-Safety | V130-MUST-021 | Visibility-Test: Deckhashes/Rollenprofile nur side-sicher. |
| V130-T024 | Browser Legal | V130-MUST-028 | E2E: legales Formatdeck startet Match. |
| V130-T025 | Browser Illegal | V130-MUST-028 | E2E: illegales Deck blockiert Start mit safe Fehler. |
| V130-T026 | Leak Scan | V130-MUST-020, V130-MUST-021 | DOM/Storage/Payload-Leak-Scan fuer Deckdaten. |

## KI-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V130-T027 | KI-Deckpool | V130-MUST-023 | AI-Test: Deckbau nutzt nur ai_supported Karten. |
| V130-T028 | KI Ablehnung/Fallback | V130-MUST-024 | AI-Test: nicht AI-supported Deck wird abgelehnt oder Ersatzdeck genutzt. |
| V130-T029 | Deckrollenprofil | V130-MUST-025 | AI-Test: eigenes Rollenprofil aus Snapshot/Hints. |
| V130-T030 | DecisionDebug | V130-MUST-026 | AI-Test: Debug nennt keine gegnerischen privaten Deckdaten. |
| V130-T031 | AI Szenarien | V130-SHOULD-004 | Smoke/Soak: mindestens zwei validierte Deckprofile vorbereitet. |

## Review- und No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V130-T032 | No-Scope | V130-MUST-029 | Regression: keine Public Decklists, Accounts, Ranked, Turniere, Karten, Assets. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Decks-, Catalog-, Server-, AI-, Web-, Visibility- und Snapshot-Tests fuer V1.3.0

## Gate-Auswertung

V1.3.0 darf finalisiert werden, wenn:

- Formatprofile versioniert und nicht freigabeautoritativ sind,
- legale und illegale Beispieldecks korrekt validieren,
- Matchstart serverseitig revalidiert,
- Replay/StateHash mit Decksnapshots stabil bleibt,
- KI-Deckbau AI-supported-only bleibt,
- keine privaten Deckdaten leaken.
