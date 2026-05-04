# MVP 0.8 Requirements

Status: Requirements Freeze
Stand: 2026-05-03
Phase: V0.8 spielbarer Base-/Starterset-Slice

## Kurzentscheidung

V0.8 macht einen kleinen, lokalen und fiktiven Starterset-Slice spielbar. Der Slice erweitert die vorhandenen MVP-0.4-Mechaniken um mehr Economy, Draw, Runs, Breaker, ICE, Asset- und Agenda-Varianz, ohne Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention oder Replacement einzuführen.

Die Quellenentscheidung ist verbindlich:

- `source_mode: local_original`
- keine offiziellen Kartenabbilder, Logos, Card Frames oder Card Backs
- keine externe Kartendatenbank und keine Laufzeit-API
- Kartentext bleibt Anzeigeinformation und ist keine Regelautorität

Spielbar wird eine V0.8-Karte nur, wenn sie in Manifest, Resolver-Registry, Unit-Test, Szenario, Visibility-Test, Replay/StateHash und KI-Smoke abgedeckt ist.

## Eingangsgate

- `MVP_0.6_done: true` ist dokumentiert.
- `MVP_0.7_done: true` ist dokumentiert.
- V0.7 UI nutzt `PlayerView`, `LegalActions` und side-gefilterte Events ohne FullState im Browser.
- Bestehende V0.1- bis V0.7-Checks sind grün.
- Der Arbeitsbranch bleibt `codex/mvp-0-1-requirements`.

## Nicht-Ziele

V0.8 baut nicht:

- vollständiges Base-/Starterset,
- offizielle Format- oder Turnierlegalität,
- automatische Kartentextauswertung,
- neue UI-Hauptphase oder neues visuelles Design,
- Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention oder Replacement,
- öffentliche Plattform, Accountsystem, Matchmaking, Rankings oder Cloud Sync,
- KI mit FullState oder verdeckter gegnerischer Information.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| V08-MUST-001 | Requirements Freeze | Dieses Dokument, Slice-Spezifikation, Mechanik-Spezifikation, Implementierungsspezifikation, Testmatrix und Requirements Review existieren. | V08-T001 |
| V08-MUST-002 | Lokaler Starterset-Slice | Die Kartenliste ist lokal/fiktiv, klein, versioniert und enthält keine offiziellen Assets oder externen IDs als Regelquelle. | V08-T002 |
| V08-MUST-003 | Katalogdaten nicht Regelautorität | Importierte oder angezeigte Kartendaten können ohne Manifest und Resolver kein Match starten. | V08-T003 |
| V08-MUST-004 | Explizite Resolver | Jede neue spielbare Karte referenziert einen benannten Resolver; Kartentext wird nie interpretiert. | V08-T004 |
| V08-MUST-005 | Manifestpflicht | Jede neue spielbare Karte hat Manifest-Eintrag mit Mechaniken, Risiko, Tests, Szenarien, Visibility, Replay und KI-Smoke. | V08-T005 |
| V08-MUST-006 | Unit-Test je Karte | Jede neue spielbare Karte ist durch gezielte Unit-Tests für Kosten, Timing, Effekt und illegale Nutzung abgedeckt. | V08-T006 |
| V08-MUST-007 | Szenarioabdeckung je Karte | Jede neue spielbare Karte ist in mindestens einem versionierten V0.8-Szenario abgedeckt. | V08-T007 |
| V08-MUST-008 | Visibility je Risiko | Draw, Access, Rezzing, Install, Trash, Score, Steal und Hidden-Zonen bleiben side-sicher. | V08-T008 |
| V08-MUST-009 | Replay und StateHash | V0.8-Szenarien und Smokes sind mit Seed, Deck-Snapshot und RulesBaseline reproduzierbar. | V08-T009 |
| V08-MUST-010 | KI-Smoke | KI nutzt V0.8-Karten nur über `LegalActions`, `PlayerView` und side-gefilterte Events. | V08-T010 |
| V08-MUST-011 | Decklegalität | V0.8-Matches starten nur mit validierten immutable Deck-Snapshots und `playable` plus `deck_legal` Karten. | V08-T011 |
| V08-MUST-012 | Import-only blockiert | Import-only, blocked oder mechanic-gated Karten blockieren Matchstart. | V08-T012 |
| V08-MUST-013 | Deck-Snapshots stabil | V0.8-Deck-Snapshots haben deterministische Hashes und enthalten keine privaten Decklisten in Public Metadata. | V08-T013 |
| V08-MUST-014 | Server-Revalidierung | Matchstart revalidiert V0.8-Deck-Snapshots serverseitig. | V08-T014 |
| V08-MUST-015 | Multiplayer-Kompatibilität | Human-vs-Human, Reconnect, Undo-Barriere und stale-action-Schutz bleiben mit V0.8-Decks korrekt. | V08-T015 |
| V08-MUST-016 | UI-Erhalt | V0.7 UI bleibt Datenkonsument, zeigt neue Karten nur generisch/textuell und erhält alle bestehenden Features. | V08-T016 |
| V08-MUST-017 | KI-Rollen-Tags | Jede neue spielbare Karte hat minimale Rollen-Tags als Anschluss für V0.9. | V08-T017 |
| V08-MUST-018 | Per-Card-Deviation | Jede neue Karte dokumentiert `local_original`; spätere offizielle Approximationen bleiben ausgeschlossen. | V08-T018 |
| V08-MUST-019 | Playability-Smoke | Kuratierte V0.8-Starterdecks laufen über mehrere Seeds ohne illegale Actions oder StateHash-Drift. | V08-T019 |
| V08-MUST-020 | Performance-Budget | `getLegalActions`, `applyAction`, `getPlayerView` und KI-Smokes bleiben lokal innerhalb dokumentierter Budgets oder dokumentieren Blocker. | V08-T020 |
| V08-MUST-021 | Regression | `lint`, `typecheck`, `test`, `build` und relevante Pakettests bleiben grün. | V08-T021 |

## Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V08-SHOULD-001 | Kuratierte Starterdecks | Ein Runner- und ein Corp-Deck nutzen den neuen Slice und bleiben klein genug für schnelle Tests. |
| V08-SHOULD-002 | Kandidaten-Scoring | Aufgenommene und zurückgestellte Karten dokumentieren Aufwand, Risiko und Spielwert. |
| V08-SHOULD-003 | Reason-Codes | KI-Smokes melden sichtbasierte Reason-Codes für neue Kartenrollen, soweit sinnvoll. |
| V08-SHOULD-004 | StateHash Review | Golden-Hash-Änderungen werden begründet und reviewbar dokumentiert. |

## Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V08-COULD-001 | V0.8.x Teilgates | Nur nach bestandenem Hauptslice und eigener Requirements-/Testspur. |
| V08-COULD-002 | Nicht decklegale Mechanik-Prototypen | Nur als gesperrte Experimente ohne Matchstart-Freigabe. |

## Gate-Ergebnis

Die Anforderungen sind reviewfähig und innerhalb des bestehenden Engine-/Deck-/AI-Modells umsetzbar.

`ready_for_implementation: true`
