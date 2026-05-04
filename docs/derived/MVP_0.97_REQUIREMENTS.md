# MVP 0.97 Requirements - Run, Jack-out, Breach und Multiaccess

Status: Requirements Freeze
Stand: 2026-05-04

## Scope

V0.97 vertieft den bestehenden Run-/Access-Pfad als enges M6-Gate. Der bisherige Single-Access wird für V0.97-Szenarien als expliziter Breach mit interner Access-Queue modelliert. Jack-out wird als Runner-Entscheidung in einem klaren Movement-Fenster eingeführt. Multiaccess wird nur über eine lokale/fiktive Harness-Karte freigegeben.

Regelreferenz: CR v26.03, Abschnitte 6.1.5, 6.6, 6.7, 7.3, 7.4 und 7.5. Die Referenz wird nur für Run/Jack-out/Breach/Access genutzt und erweitert nicht automatisch spätere Mechaniken.

## Ziele

- Bestehende Runs bleiben regressionsgeschützt.
- V0.97-Runs erhalten nach passiertem ICE ein Runner-`jack_out`-Fenster vor dem nächsten ICE oder vor dem Server.
- Erfolgreiche V0.97-Runs erzeugen einen internen Breach-State mit Access-Queue.
- `access_card`, `steal_agenda`, `trash_accessed_card` und `decline_trash` bleiben kompatibel und arbeiten queue-basiert weiter.
- R&D-Multiaccess greift die obersten N Karten deterministisch in Reihenfolge zu.
- HQ-Multiaccess wählt N verschiedene Karten deterministisch ohne Replacement über RandomDrawRecords.
- Remote- und Archives-Access werden in die Queue-Struktur eingebunden, ohne komplexe Replacement- oder Candidate-Choice-Mechaniken.
- PlayerViews, PublicEvents, Reconnect, Undo, AI und UI-Diagnostics dürfen keine künftigen Hidden-Queue-Karten leaken.

## Nicht-Ziele

- Keine vollständige offizielle Priority-Maschine.
- Keine Access-Replacement-, Access-Prevention- oder "cannot access"-Mechaniken.
- Keine Candidate-Auswahl-Choice außer dem deterministischen engen MVP-Verfahren.
- Keine Search/Reveal/Expose/Arrange/Shuffle/Swap-Mechaniken.
- Keine aktiven Identity-Abilities.
- Kein Hosting, keine Viren, keine neuen Counter-Familien.
- Keine offiziellen Karten, offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine automatische Spielbarkeit durch Import, Katalog oder Deckeditor.

## Must Requirements

| ID | Requirement |
|---|---|
| M097-SHARED-001 | Shared Types enthalten additive `BreachState`-/AccessQueue-Verträge und `jack_out`, ohne V0.96-Verträge zu brechen. |
| M097-RUN-001 | Bestehende Single-Access-Runs bleiben für alte Baselines fachlich kompatibel. |
| M097-JACK-001 | `jack_out` ist nur in einem dokumentierten Runner-Movement-Fenster legal: nach passiertem ICE und vor dem nächsten ICE oder Server. |
| M097-JACK-002 | `jack_out` endet den Run deterministisch ohne erfolgreichen Breach und ohne Hidden-Info-Reveal. |
| M097-JACK-003 | Falsche Side, falsches Timing, stale StateVersion und offene Choice machen `jack_out` illegal. |
| M097-BREACH-001 | Erfolgreiche V0.97-Runs erzeugen genau einen internen Breach-State. |
| M097-BREACH-002 | Access-Queue-Einträge enthalten künftige Hidden-Zone-Karten nur intern und nie in PlayerViews oder PublicEvents vor ihrem Access. |
| M097-ACCESS-001 | `access_card` greift immer nur die nächste Queue-Position auf und revealt nur diese Karte. |
| M097-ACCESS-002 | Nach Steal, Trash oder Decline wird die Queue deterministisch fortgesetzt oder der Breach beendet. |
| M097-RD-001 | R&D-Multiaccess greift die obersten N Karten in stabiler Reihenfolge ab und revealt nur den aktuellen Access. |
| M097-HQ-001 | HQ-Multiaccess wählt N verschiedene Karten ohne Replacement über Seed, RandomCounter und RandomDrawRecords. |
| M097-ARCHIVES-001 | Archives-Access nutzt eine Queue aus Archives-Karten; facedown-Ausbau bleibt dokumentiert begrenzt und darf keine nicht zugegriffenen Titel leaken. |
| M097-REMOTE-001 | Remote-Root-Access bleibt deterministisch und kompatibel mit Agenda-Steal, Asset-/Upgrade-Trash und Decline. |
| M097-VISIBILITY-001 | PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors, AI-Inputs und UI-Diagnostics leaken keine künftigen R&D-/HQ-/Archives-/Remote-Queue-Entries. |
| M097-EVENT-001 | Jeder Hidden-Zone-Access ist `hidden_info_barrier`; public Events nennen Titel erst beim legalen Access/Steal/Trash. |
| M097-UNDO-001 | Undo vor Hidden-Info-Access bleibt möglich; nach Hidden-Info-Access bleibt es blockiert. |
| M097-REPLAY-001 | Breach- und Multiaccess-Sequenzen replayen deterministisch mit identischem StateHash. |
| M097-RANDOM-001 | Neue Randomness entsteht nur bei HQ-Multiaccess und läuft über RandomDrawRecords. |
| M097-AI-001 | AI wählt nur Breach-/Access-LegalActions aus PlayerView und LegalActions und kennt keine künftigen Queue-Karten. |
| M097-MP-001 | Multiplayer Submit, Idempotency, Reconnect und Undo-Barrieren unterstützen Breach und Multiaccess side-sicher. |
| M097-CARD-001 | Mindestens eine lokale/fiktive Multiaccess-Harness-Karte darf nur mit Manifest, Resolver, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke spielbar werden. |
| M097-DECK-001 | Deckvalidierung und Matchstart dürfen keine Multiaccess-Karte deck-legal machen, deren Mechanik-Coverage, Manifest und Tests nicht freigegeben sind. |
| M097-NOSCOPE-001 | V0.98+-Mechaniken, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention bleiben unspielbar. |
| M097-GATE-001 | V0.97 darf erst final abgeschlossen werden, wenn Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build grün sind oder Blocker dokumentiert und akzeptiert wurden. |

## Entscheidungen

- Jack-out wird in V0.97 nur für V0.97-Baselines aktiviert, um ältere Run-Regressionspfade nicht still zu verändern.
- Single Access ist in V0.97 ein Breach mit Queue-Länge 1.
- Multiaccess wird über eine lokale/fiktive Runner-Event-Harness-Karte freigegeben, die einen Run mit Access-Anzahl 2 startet.
- R&D-Queue wird intern mit konkreten Instance-IDs gebaut, aber nur die aktuelle Karte wird per Access sichtbar.
- HQ-Queue wird intern deterministisch ohne Replacement gebaut und nutzt `RandomDrawRecords`.
- Archives-facedown wird in V0.97 nicht vollständig modelliert; vorhandene Archives-Karten bleiben im engen lokalen Modell zugänglich, ohne künftige Queue-Titel vorab zu leaken.

## Gate

`MVP_0.97_requirements_freeze_done: true`

`ready_for_MVP_0.97_implementation: true`
