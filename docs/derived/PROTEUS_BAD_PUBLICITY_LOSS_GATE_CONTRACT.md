# Proteus Bad-Publicity-Loss-Gate Contract

Status: planning contract, no runtime implementation
Stand: 2026-05-17

## Scope und Quellen

Dieses Artefakt beschreibt den engen Game-End-Vertrag fuer das Proteus-Cluster `bad_publicity_loss_gate` aus `data/rules/proteus-mechanics-coverage-2026-05-17.json`.

Betroffene Planungs-Karten:

| Karte | Seite | Typ | Relevanz |
| --- | --- | --- | --- |
| `onr_proteus_002_charity-takeover` | corp | agenda | Korp kann beim Scoren Bad Publicity nehmen und zugleich Agenda-Sieg erreichen. |
| `onr_proteus_094_scaldan` | runner | program | Start-of-turn-/Wuerfelpfad kann Bad Publicity durch deterministischen Zufall erhoehen. |
| `onr_proteus_108_faked-hit` | runner | event | Bad Publicity und unpreventable Damage liegen in derselben Aufloesung. |
| `onr_proteus_109_frame-up` | runner | event | Bad Publicity kann von Run-/Access-Historie abhaengen. |
| `onr_proteus_112_identity-donor` | runner | event | Prevention/Replacement-Pfad waehrend des Korp-Zugs. |
| `onr_proteus_113_live-news-feed` | runner | event | Run-, Tag-, Encounter- und Agenda-Liberation-Kontext. |
| `onr_proteus_117_poisoned-water-supply` | runner | event | Trash-Kosten plus Bad-Publicity-Gate. |
| `onr_proteus_123_senatorial-field-trip` | runner | event | Korp-Choice zwischen Derez und Bad Publicity. |
| `onr_proteus_125_subliminal-corruption` | runner | event | Run-trash-basierte Bad-Publicity-Menge. |
| `onr_proteus_129_back-door-to-netwatch` | runner | resource | Hidden-Resource-/Trace-Cancel-Pfad mit Redaction-Gate. |

Kein Punkt in diesem Dokument promotet Proteus-Karten zu `human_playable`, `deck_legal`, `ai_supported` oder Runtime-Resolvern.

## Game-End-Vertrag

Bad Publicity bleibt oeffentliche Korp-Information in `corp.badPublicity`. Sobald ein erfolgreicher Engine-Uebergang den Wert auf mindestens 7 setzt oder ein spaeterer Check einen bereits erreichten Wert von mindestens 7 bestaetigt, verliert die Korp. Der Gewinner ist der Runner.

Der neue Game-End-Grund soll als eigener Wert modelliert werden, empfohlen `bad_publicity_7`. Eine spaetere Implementierung muss den Wert konsistent durch `GameEndReason`, API-Ergebnisgrund, PublicEvent/Replay-Projektion und UI-Ergebnisanzeige fuehren. Bis dahin bleibt dies nur Vertragsvorgabe.

Das Gate ist eine Engine-Regel, keine Kartenregel im UI oder in der KI. UI, Server, menschliche Controller und KI reichen weiterhin nur `PlayerActions` ein, die aus aktuellen `LegalActions` stammen. `applyAction` bleibt die finale Revalidierung fuer Seite, Action-ID, `stateVersion`, Timingpunkt, Kosten, Ziele und Choices.

## Timing und Prioritaet

Der Check laeuft nach jedem abgeschlossenen Action-/Choice-/Automatik-Uebergang, der `corp.badPublicity` veraendern kann, bevor eine neue Spieleraktion oder ein neuer Timingpunkt ausgegeben wird. Bei mehrstufigen Effekten darf die Engine keine neue LegalAction anbieten, nachdem das Gate erreicht wurde.

Prioritaetsvertrag:

| Gleichzeitiger Zustand | Ergebnis |
| --- | --- |
| Korp erreicht 7+ Bad Publicity und 7+ Agenda-Punkte im selben Uebergang | Runner gewinnt, `gameEndReason = bad_publicity_7`. |
| Korp erreicht 7+ Bad Publicity und Runner erreicht 7+ Agenda-Punkte im selben Uebergang | Runner gewinnt, primaerer `gameEndReason = bad_publicity_7`; Agenda-Punkte bleiben als finaler State sichtbar. |
| Korp erreicht 7+ Bad Publicity und Runner wuerde im selben Uebergang flatlinen | Runner gewinnt, `gameEndReason = bad_publicity_7`; die Flatline darf nicht nachtraeglich den Sieger ueberschreiben. |
| Korp erreicht 7+ Bad Publicity und Korp-Deckout waere ebenfalls wahr | Runner gewinnt, `gameEndReason = bad_publicity_7`; beide Bedingungen fuehren zum Runner-Sieg, aber der Proteus-Grund bleibt primaer. |
| Bereits `state.winner` gesetzt, danach wuerde ein Bad-Publicity-Effekt eintreten | Kein weiterer Effekt wird aufgeloest; bestehender Game-Over-State bleibt unveraendert. |

Damit ist das Proteus-Wording "Korp verliert auch bei gleichzeitiger Victory Condition" als harte Override-Regel gegen Score, Steal, Flatline und Agenda-Sieg dokumentiert.

## PublicPayload, PlayerView und Replay

Der Game-End-Event darf oeffentlich enthalten:

- `winner: "runner"`
- `loser: "corp"`
- `gameEndReason: "bad_publicity_7"`
- `badPublicityThreshold: 7`
- `corpBadPublicityBefore`, sofern der vorherige Wert aus dem Uebergang oeffentlich ableitbar ist
- `corpBadPublicityAfter`
- `sourceCardDefinitionId` nur, wenn die ausloesende Karte in diesem Moment legal oeffentlich bekannt ist
- `sourceVisibility: "public" | "redacted"`

Der Event darf nicht enthalten:

- verdeckte Karten aus HQ, R&D, Grip, Stack, Archives facedown oder verdeckten Runner-Resources
- nicht oeffentliche Choice-Optionen oder abgelehnte Alternativen
- private Decklisten, private Hand-/Stack-/R&D-Positionen, `privatePayload`, `cardInstances`, FullState oder KI-Debugdaten
- Kartenname/Definition-ID einer Hidden Resource, solange deren Offenlegung nicht selbst Teil des rechtmaessigen oeffentlichen Effekts ist

Public Replay nutzt denselben redigierten Event. Private Replay-Perspektiven duerfen nur das zeigen, was die jeweilige Seite regelmaessig sehen durfte. PublicEvent-, Reconnect-, WebSocket-, Undo-Preview-, KI-Input- und Log-Pfade muessen denselben Hidden-Info-Vertrag einhalten.

## Replay, StateHash und Zufall

`corp.badPublicity`, `winner`, `gameEndReason`, Phase und Timingpunkt sind StateHash-relevante Engine-State-Felder. Eine spaetere Implementierung darf keine Ergebnisentscheidung nur aus PublicPayload ableiten.

Replay muss aus InitialState plus EventLog denselben finalen `StateHash` reproduzieren. Bei Scaldan oder anderen zufallsbasierten Proteus-Pfaden muss die Bad-Publicity-Erhoehung ausschliesslich ueber Seed, `randomCounter` und `RandomDrawRecords` laufen; der Game-End-Check selbst ist deterministisch und zieht keinen Zufall.

## Testmatrix fuer spaeteren Harness

| ID | Fall | Erwartung |
| --- | --- | --- |
| P-BP-T001 | Korp steigt von 6 auf 7 Bad Publicity durch oeffentlichen Effekt | Phase `game_over`, Winner Runner, Reason `bad_publicity_7`. |
| P-BP-T002 | Korp steigt nur auf 6 | Kein Game Over, LegalActions werden normal weitergeleitet. |
| P-BP-T003 | Charity-Takeover-artiger Score erreicht zugleich Korp-Agenda-Ziel und 7 Bad Publicity | Runner gewinnt; Agenda-Sieg ueberschreibt nicht. |
| P-BP-T004 | Runner-Steal/Agenda-Punkt und Bad-Publicity-Gate fallen zusammen | Runner gewinnt mit primaerem Proteus-Grund; finale Agenda-Punkte bleiben konsistent. |
| P-BP-T005 | Faked-Hit-artiger Effekt erreicht 7 Bad Publicity und wuerde Runner flatlinen | Runner gewinnt; Flatline ueberschreibt nicht. |
| P-BP-T006 | Korp-Deckout und 7 Bad Publicity fallen in denselben Check | Runner gewinnt mit `bad_publicity_7`; Deckout ist nicht primaerer Grund. |
| P-BP-T007 | Hidden-Resource-Trace-Cancel gibt Bad Publicity | PublicPayload enthaelt keine verdeckte Karten-ID, ausser die Resource wurde im Effekt rechtmaessig aufgedeckt. |
| P-BP-T008 | Scaldan-artiger Wuerfelpfad gibt Bad Publicity | `RandomDrawRecords` reproduzieren Ergebnis und finalen StateHash. |
| P-BP-T009 | Replay des Game-End-Events | Replayed finaler StateHash entspricht Original; `gameEndReason` bleibt stabil. |
| P-BP-T010 | PlayerView/Reconnect/AIInput nach Game Over | Kein Hidden-Info-Leak; nur public-safe Ergebnis- und Bad-Publicity-Daten. |

## Handoff-Grenze

Ein spaeterer Engine-Harness darf mit synthetischen Testeffekten oder Test-Fixtures arbeiten. Er darf keine Proteus-Karte spielbar machen, keine Proteus-Decklegalitaet erzeugen, keine AI-Hints hinzufuegen und keine Kartendaten in Runtime-Resolver promoten.
