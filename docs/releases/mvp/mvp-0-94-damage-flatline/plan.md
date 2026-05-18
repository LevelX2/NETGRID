# MVP 0.94 Detailed Plan - Damage und Flatline

Status: detaillierte Planungsfassung, keine Implementierung
Stand: 2026-05-03

## Kurzentscheidung

V0.94 soll Damage und Flatline als erstes hohes Hidden-Info-Gate einführen. Der Scope ist absichtlich eng: Net- und Meat-Damage werden als zufälliges Trashing aus dem Runner-Grip modelliert, Flatline wird als Game-End-Grund abbildbar, und jede Damage-Auflösung wird als Hidden-Info-Barriere behandelt.

V0.94 implementiert nicht den vollen M2-Block. Mulligan, Identity-Setup, Trace, Resources, Multiaccess, Prevention, Replacement und Core-Damage bleiben außerhalb dieser Phase.

## Voraussetzungen

Vor einem V0.94-Requirements-Freeze muss gelten:

- V0.93-Finalgate ist bestanden.
- Fremde lokale Worktree-Änderungen sind geprüft und von V0.94 getrennt.
- CR-v26.03-Damage-/Flatline-Semantik wurde noch einmal gegen die lokale Regelreferenz geprüft.
- Bestehende Engine-, Server-, AI-, Visibility-, Replay- und Build-Checks laufen reproduzierbar.
- Die V0.91-Assetentscheidung bleibt mechanikunabhängig.

## Ziele

- `DamageType` und einen deterministischen Damage-Effect planen.
- Random Grip-Trash über Seed, RandomCounter und RandomDrawRecords absichern.
- Flatline als `corp`-Sieg mit maschinenlesbarem Game-End-Grund vorbereiten.
- Damage als `hidden_info_barrier` klassifizieren.
- Replay, Undo, WebSocket, Reconnect und AI-Input side-sicher halten.
- Eine minimale lokale/fiktive Damage-Testkarte oder ein enges Test-Fixture nur nach Requirements-Freeze erlauben.

## Nicht-Ziele

- Kein Core-Damage/Handlimit-Umbau.
- Keine Damage-Prevention.
- Keine Trace- oder Resource-Mechanik.
- Keine neue offizielle Karte, kein offizielles Artwork, keine externen Kartendaten.
- Kein Mulligan im Matchstart.
- Keine Multiaccess-, Jack-out-, Breach- oder Archives-Erweiterung.

## Vorgeschlagene Shared-/Engine-Erweiterungen

| Bereich | Vorgabe |
|---|---|
| `DamageType` | Start mit `net` und `meat`; `core` nur typisiert oder dokumentiert, aber nicht spielbar. |
| `DamageRequest` | Quelle, Side, DamageType, Amount, Reason, StateVersion. |
| `EffectCommand` | `do_damage` als neuer Command oder dedizierter Engine-Helfer, der intern dieselben Invarianten erfüllt. |
| Randomness | Ein RandomDrawRecord pro zufällig ausgewählter Grip-Karte oder ein dokumentierter Batch-Record mit stabiler Auswahl ohne Zurücklegen. |
| Game-End | Optionaler `winnerReason`/`gameEndReason`, mindestens `agenda_points`, `corp_deck_empty`, `flatline`, `unknown`. |
| Events | Damage-Event mit `visibilityClass: "hidden_info_barrier"` und öffentlicher Zusammenfassung ohne vor-Damage-Grip-Leak. |

## Damage-Semantik

V0.94 soll folgende Mindestsemantik abbilden:

1. Damage-Quelle wird aus einer legalen Engine-Aktion oder einem testbaren Effect erzeugt.
2. Engine prüft Amount, Timing und Quelle erneut in `applyAction`.
3. Runner-Grip-Karten werden deterministisch zufällig ausgewählt.
4. Ausgewählte Karten bewegen sich in den Heap.
5. Wenn der Runner nicht genug Karten trashen kann, wird Flatline ausgelöst.
6. Nach Damage ist Undo über dieses Event blockiert.
7. Replay reproduziert RandomDrawRecords, Zone-Moves, Flatline und finalen StateHash.

Die exakte Frage, ob und wie getrashed Cards für beide Seiten sichtbar werden, muss vor Requirements-Freeze mit CR v26.03 und dem bestehenden PlayerView-Modell abgeglichen werden. Keine PublicEvent- oder PlayerView-Ausgabe darf die vor-Damage-Grip-Zusammensetzung leaken.

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V094-T001 | Shared Types | Damage- und Game-End-Typen sind additiv und brechen bestehende Imports nicht. |
| V094-T002 | Damage Normalfall | Net/Meat Damage trashen exakt Amount Karten aus Grip. |
| V094-T003 | Randomness | Gleicher Seed erzeugt gleiche Damage-Auswahl und gleiche RandomDrawRecords. |
| V094-T004 | Randomness ohne Replacement | Eine Karte kann in einem Damage-Event nicht doppelt ausgewählt werden. |
| V094-T005 | Flatline | Zu wenig Grip führt zu `winner: "corp"` und `gameEndReason: "flatline"`. |
| V094-T006 | PublicEvent-Redaktion | PublicEvent nennt Amount/Type/Quelle, aber keinen vor-Damage-Grip-Inhalt. |
| V094-T007 | Sichtbarkeit | RunnerView, CorpView, WebSocket und Reconnect zeigen nur zulässige Informationen nach Damage. |
| V094-T008 | Undo | Undo nach Damage wird blockiert, inklusive Damage ohne Flatline. |
| V094-T009 | Replay/StateHash | Replay reproduziert finalen StateHash nach Damage und Flatline. |
| V094-T010 | Illegal Action | Falsche Side, stale StateVersion, falsches Timing und nicht zahlbare Kosten werden abgelehnt. |
| V094-T011 | AI Contract | AI sieht nur PlayerView, LegalActions und side-gefilterte Events; keine Grip-Liste des Gegners. |
| V094-T012 | Multiplayer | Submit, Idempotency, Reconnect und EventTail bleiben side-sicher. |
| V094-T013 | No Prevention | Keine `prevent_damage`-, Replacement- oder Interrupt-Action wird spielbar. |
| V094-T014 | No Scope Creep | Keine Trace-, Resource-, Mulligan-, Multiaccess- oder Identity-Mechanik wird freigeschaltet. |
| V094-T015 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.94

Vor Implementierung:

- `docs/releases/mvp/mvp-0-94-damage-flatline/requirements.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/damage-flatline-spec.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/test-matrix.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/requirements-review.md`
- optional `data/scenarios/v094-*.json`

Nach Implementierung:

- `docs/releases/mvp/mvp-0-94-damage-flatline/implementation-review.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/final-review.md`
- aktualisierte Mechanik-Coverage
- Status- und Wissensbasis-Update

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Damage leakt verdeckte Grip-Karten. | Negative Leaktests über alle Payloads und Fehlerpfade. |
| Randomness ist nicht replaybar. | RandomDrawRecords verpflichtend und StateHash-Regression. |
| Flatline mischt sich mit vollem M2-Scope. | Nur Game-End-Grundvertrag, kein Mulligan/Identity-Setup. |
| Prevention schleicht ein. | Prevention nur als späteres Gate; V0.94 lehnt solche Actions ab. |
| AI bekommt FullState-Abkürzungen. | AI-Vertragstest mit Damage-Boardstates. |

## Definition of Done

V0.94 ist erst fertig, wenn Damage/Flatline spielbar, deterministic replaybar, side-sicher sichtbar, Undo-barriered und AI-/Multiplayer-sicher getestet sind. Kein anderes Mechanikgate darf dabei nebenbei aktiviert werden.
