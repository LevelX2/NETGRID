# V1.1.1 Requirements - Discard, Handlimit und Core Damage

Stand: 2026-05-07
Status: eingefroren

## Ziel

V1.1.1 schließt nach V1.1.0 den engen M2+-Grundpfad für Discard-Phasen, maximale Handgröße und Core Damage. Die Rules Engine bleibt die einzige Regelautorität: UI, Server und KI dürfen Discard nur über `LegalActions`/`PlayerActions` und `resolve_choice` ausführen.

## Quellenbasis

- `docs/derived/V1_1_1_DISCARD_HANDLIMIT_CORE_DAMAGE_PLAN.md`
- `docs/derived/V1_1_0_FINAL_REVIEW.md`
- `docs/derived/DAMAGE_FLATLINE_0.94_SPEC.md`
- `docs/derived/MVP_0.94_REQUIREMENTS.md`
- `docs/derived/MVP_0.94_TEST_MATRIX.md`
- `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`, gezielt zu Discard Phase, Maximum Hand Size, Core Damage und Flatline

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V111-MUST-001 | Shared Types und Engine-State bilden Korp- und Runner-Discard-Phasen sowie passende Timingpoints deterministisch ab. |
| V111-MUST-002 | `end_turn` führt vom Action-Fenster in die Discard-Verarbeitung der aktiven Seite und wechselt erst danach zum nächsten Zug. |
| V111-MUST-003 | Beide Seiten starten mit maximaler Handgröße 5; Handlimit ist Engine-Wert oder deterministische Engine-Berechnung und wird in PlayerViews sichtbar. |
| V111-MUST-004 | Runner-Handlimit ist `5 - coreDamage` plus künftige Modifier; Korp-Handlimit ist in V1.1.1 5 plus künftige Modifier. |
| V111-MUST-005 | Bei Handgröße <= Handlimit schließt die Engine die Discard-Phase ohne Choice sauber ab. |
| V111-MUST-006 | Bei Handgröße > Handlimit erzeugt die Engine eine side-private `select_cards`-Choice mit exakt `handCount - maxHandSize` Selektionen. |
| V111-MUST-007 | `resolve_choice` revalidiert ChoiceId, Side, StateVersion, Anzahl, Optionsmenge, Handzone, Kartenbesitz und Discard-Timingpoint. |
| V111-MUST-008 | Korp-Discard bewegt gewählte HQ-Karten gleichzeitig facedown nach Archives und leakt keine Titel/DefinitionIds an Runner, PublicEvents, WebSocket, Reconnect, Undo, Logs, Fehler, KI oder UI-Diagnostik. |
| V111-MUST-009 | Runner-Discard bewegt gewählte Grip-Karten gleichzeitig in den Heap; nicht gewählte Grip-Karten bleiben privat. |
| V111-MUST-010 | Discard ist kein Trash. Events, Chronik und Payload-Kontext unterscheiden `discarded` von `trashed`. |
| V111-MUST-011 | Erfolgreicher Discard ist eine Hidden-Info-Barriere und blockiert Undo über dieses Event hinweg. |
| V111-MUST-012 | Core Damage ist spielbar und nutzt den bestehenden V0.94-Damage-Vertrag für Hidden-Info, RandomDrawRecords, Flatline und Replay. |
| V111-MUST-013 | Core Damage erhöht einen persistenten Runner-Core-Damage-Status um die Damage-Menge und reduziert dadurch dauerhaft das Runner-Handlimit. |
| V111-MUST-014 | Core Damage mit `amount > runner.grip.length` flatlined sofort ohne zusätzliche Random-Auswahl oder zusätzlichen Grip-Leak. |
| V111-MUST-015 | Core Damage mit `amount <= runner.grip.length` wählt exakt `amount` Grip-Karten ohne Replacement über Seed, RandomCounter und RandomDrawRecords. |
| V111-MUST-016 | Runner flatlined zu Beginn des Runner-Discard-Steps, wenn das maximale Runner-Handlimit kleiner als 0 ist. |
| V111-MUST-017 | PlayerViews zeigen eigene Handlimitwerte und side-sichere gegnerische Handlimit-/Core-Damage-Counts. |
| V111-MUST-018 | Server Submit, Idempotency, Stale-State-Ablehnung, Reconnect, EventTail und WebSocket-Payloads behandeln Discard und Core Damage side-sicher. |
| V111-MUST-019 | KI löst Discard-Choices deterministisch aus PlayerView/LegalActions ohne FullState- oder gegnerische Hidden-Info-Nutzung. |
| V111-MUST-020 | Web UI zeigt dynamisches Handlimit, Core-Damage-Status und eigene Discard-Choice; Gegner sehen nur Wartestatus ohne Kandidaten. |
| V111-MUST-021 | Replay reproduziert Discard-Choices, Core-Damage-Randomness, Handlimitänderungen, Flatline und finalen StateHash deterministisch. |
| V111-MUST-022 | No-Scope-Regression bestätigt, dass Prevention, Avoid, Interrupt, Replacement, Full Archives Access und Runner-Deckout-Siegbedingung nicht freigeschaltet werden. |

## Nicht-Ziele

- Keine Damage Prevention.
- Kein Avoid.
- Keine Interrupts.
- Keine Replacement Effects.
- Kein vollständiges Paid-Ability-Fenster in der Discard-Phase.
- Kein Full Archives Access.
- Keine Runner-Deckout-Siegbedingung.
- Keine neuen offiziellen Assets, Card Frames, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine öffentlichen Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turniere.
- Keine breite Kartenfreigabe außerhalb enger Harness-/bereits freigegebener lokaler Karten.

## Gate-Anforderung

V1.1.1 darf implementiert werden, wenn `V1_1_1_REQUIREMENTS.md`, `DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md`, `V1_1_1_TEST_MATRIX.md` und `V1_1_1_REQUIREMENTS_REVIEW.md` vorhanden sind und das Requirements Review `ready_for_implementation: true` meldet.

