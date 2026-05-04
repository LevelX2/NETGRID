# Roadmap nach MVP 0.4

Status: Planungsentscheidung nach bestandenem MVP 0.4; Mechanikdetailplanung bis V0.99 ergänzt
Stand: 2026-05-04
Basis: `MVP_0.4_done: true`, Commit `5a1887d Complete MVP 0.4 card pool tags`

## 1. Kurzentscheidung

Nach MVP 0.4 wird die Roadmap produktnäher neu geschnitten.

Die UI- und Design-Neugestaltung wird bewusst nach V0.7 gelegt, weil dazu noch Analysen laufen. V0.5 und V0.6 sollen deshalb nicht durch ein großes visuelles Redesign blockiert werden, sondern die Daten-, Karten-, Deck- und Match-Grundlagen vorbereiten.

Empfohlene Reihenfolge:

1. V0.5: Kartenimport und Kartenkatalog.
2. V0.6: Deckeditor- und Match-Setup-Fundament.
3. V0.7: UI-Neugestaltung und Designgestaltung.
4. V0.8: Spielbarer Basisset-/Starterset-Slice.
5. V0.9: Bessere KI.
6. V0.91: Kartenbild-Asset-Gate und Bild-Import.
7. V1.0: Private stabile Plattform.

Nachtrag 2026-05-04: Nach Abschluss von V0.92 und V0.93 liegt die Mechanikdetailplanung für V0.94 bis V0.99 vor. Diese Versionen schieben sich als gate-orientierte Mechanikfolge vor eine mögliche V1.0-Stabilisierung: Damage/Flatline, Resources, Trace/Link, Run/Breach/Multiaccess, Identity/Hidden-Zone-Tools sowie Counter/Hosting/Virus/Purge.

## 2. Leitentscheidungen

- Kartenimport bedeutet nicht automatisch Spielbarkeit.
- Offizielle oder externe Kartendaten dürfen nicht als Regelinterpreter verwendet werden.
- Importierte Karten brauchen ein lokales, versioniertes Snapshot-Format.
- Eine Karte wird erst spielbar, wenn Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke bestehen.
- Der Deckeditor darf Karten anzeigen, aber nur implementierte und formatfreigegebene Karten für spielbare Decks zulassen.
- UI und Design werden in V0.7 als eigener bewusster Schnitt geplant, nicht nebenbei in V0.5 oder V0.6.
- Bis V0.7 sind nur funktionale UI-Anpassungen erlaubt, die für Import, Katalog, Decks oder Matchstart nötig sind.

## 3. Gestaffelte Zielversionen

| Version | Kernziel | Enthalten | Nicht enthalten |
|---|---|---|---|
| V0.5 | Kartenimport und Kartenkatalog | Import-Schema, lokaler Kartensnapshot, Kartenbrowser, Basis-/Starterset als Datenbestand, Importvalidierung, Manifest-Abgleich | automatische Regelumsetzung, freier Deckbau als Produktfeature, große UI-Neugestaltung |
| V0.6 | Deckeditor- und Match-Setup-Fundament | Deck speichern/laden, Import/Export, Deckvalidierung, Auswahl beim Matchstart, spielbar/nicht-spielbar Kennzeichnung | finale Designgestaltung, breite offizielle Formatlegalität, vollständiger Deckbuilder-Komfort |
| V0.7 | UI-Neugestaltung und Designgestaltung | neues Spielbrett, Matchfluss, Run-Flow, Action-Panel, Karten-/Deckansichten, Replay-/Log-Darstellung, KI-Erklärungen, visuelle Richtung | neue Regelbreite als Hauptziel, ungetestete Kartenfreigabe |
| V0.8 | Basisset-/Starterset-Spielbarkeit | ausgewählter spielbarer Slice aus importiertem Datenbestand, Damage falls benötigt, Resources/Traces/Identitäten nur gezielt, Szenario- und Visibility-Gates | vollständiges Basisset auf einmal, Freitext-Regelinterpretation |
| V0.9 | Bessere KI | deck- und rollenbewusste Heuristiken, Schwierigkeitsgrade, Risikoabschätzung, Simulationen über Kartenrollen, bessere Reason-Codes | KI mit FullState, LLM-KI als Regelakteur |
| V0.91 | Kartenbild-Asset-Gate und Bild-Import | Quellen-/Nutzungsentscheidung, lokaler nicht versionierter Bildcache, Bildmetadaten, Anzeige bekannter Karten in Katalog, Deckeditor und CardView | neue Regeln, neue Kartenfreigabe, offizielle Card Backs oder Frames, Bilddaten im Match-State |
| V1.0 | Private stabile Plattform | Human-vs-KI, KI-vs-Human, Human-vs-Human, KI-vs-KI, Deckeditor, Kartenkatalog, Replays, private Hostingfähigkeit | öffentliche Plattform ohne neue Scope-Entscheidung |

## 4. V0.5 Kartenimport und Kartenkatalog

Ziel:

V0.5 schafft eine saubere lokale Kartendatenbasis, ohne die Engine sofort mit vielen neuen Karteneffekten zu belasten.

Ergebnisse:

- `CARD_IMPORT_SPEC` mit Quellen-, Lizenz-/Nutzungshinweisen, Snapshot-Format und Update-Regeln.
- Lokales Kartenschema für importierte Karten.
- Importpipeline für einen ersten Basis-/Starterset-Datenbestand.
- Kartenkatalog als Datenansicht mit Filter nach Seite, Typ, Fraktion, Set, Implementierungsstatus und Spielbarkeit.
- Manifest-Abgleich zwischen importierten Karten und engine-implementierten Karten.
- Klare Statuswerte, zum Beispiel `imported`, `validated`, `implemented`, `playable`, `deck_legal`.

Gate:

Keine importierte Karte darf allein durch Import spielbar werden.

## 5. V0.6 Deckeditor- und Match-Setup-Fundament

Ziel:

V0.6 macht Decks als eigenes Produktobjekt nutzbar und verbindet sie mit Match-Erstellung, ohne die große UI-Neugestaltung vorwegzunehmen.

Ergebnisse:

- Deck-Datenmodell mit Side, Identity, Kartenliste, Kartenpool-Version und Validierungsstatus.
- Deck speichern, laden, duplizieren, importieren und exportieren.
- Deckvalidierung gegen implementierte Karten, Mengen, Side, Agenda Points und freigegebene Kartenpools.
- Matchstart mit Deckauswahl für Human-vs-Human, Human-vs-KI und KI-vs-KI.
- Anzeige nicht spielbarer Karten im Editor, aber Sperre für spielbare Matches.
- Basale funktionale UI nur so weit, wie sie für Deckauswahl und Validierungsfeedback nötig ist.

Gate:

Jedes gestartete Match muss reproduzierbar dokumentieren, welche Deckversion, Kartenpool-Version und RulesBaseline verwendet wurden.

## 6. V0.7 UI-Neugestaltung und Designgestaltung

Ziel:

V0.7 nutzt die laufenden Analysen und baut die Spieloberfläche bewusst neu, statt schrittweise Zufallsverbesserungen in frühere Phasen zu mischen.

Schwerpunkte:

- Informationsarchitektur für Startscreen, Match-Erstellung, Match-Fortsetzung, Deckauswahl und Spielbrett.
- Spielbrett mit klaren Zonen für Corp, Runner, Server, Rig, Archives/Heap, R&D/Stack, HQ/Grip und Score Areas.
- Run-Flow-Darstellung für Approach, Encounter, Break, Access und Resultate.
- Action-Panel, das LegalActions verständlich gruppiert, ohne Regeln im Client zu duplizieren.
- Kartenkatalog- und Deckeditor-Ansichten in der endgültigen visuellen Richtung.
- Replay-/Log-Ansicht mit side-gefilterten Perspektiven.
- KI-Erklärungen als Lernhilfe, weiterhin nur aus sichtbaren Informationen.
- Desktop-first, später tablet-tauglich; Mobile bleibt nicht Hauptgate.

Gate:

Die neue UI darf keine FullState- oder Hidden-Info-Daten im Browser benötigen. Alle Interaktionen bleiben über PlayerActions aus LegalActions geführt.

## 7. V0.8 Basisset-/Starterset-Spielbarkeit

Ziel:

V0.8 macht aus dem importierten Kartenbestand einen größeren, aber weiter kuratierten spielbaren Slice.

Vorgehen:

- Karten nach Mechanik-Risiko gruppieren.
- Requirements-Freeze erst nach grünem V0.6-/V0.7-Gate und dokumentierter Quellen-/Nutzungsentscheidung.
- Kandidaten über Engine-Aufwand, Hidden-Info-, UI-, KI-, Multiplayer-Risiko und Spielwert scoren.
- Erst einfache Economy-, Draw-, Install-, Advance-, Run- und ICE/Breaker-Karten freigeben.
- Damage nur einführen, wenn konkrete Karten es brauchen und das Damage-Gate besteht.
- Resources, Traces, Identitätsfähigkeiten und weitere Typen nur als getrennte Teilgates.
- Jede Karte erhält Manifest, Resolver-Registry-Eintrag, Per-Card-Deviation, Unit-Test, Szenario, Visibility-Test, Replay/StateHash, KI-Smoke und minimale KI-Rollen-Tags für V0.9.

Nicht-Ziel:

Das vollständige Basis-/Starterset wird nicht in einem Schritt spielbar gemacht.

## 8. V0.9 Bessere KI

Ziel:

V0.9 macht die KI nicht nur regelkonform, sondern spürbar nützlicher zum Spielen, Testen und Lernen.

Detailplanung:

- `docs/derived/MVP_0.9_DETAILED_PLAN.md`

Schwerpunkte:

- Deck- und Kartenrollen in der Bewertung.
- Bessere Run-, Score-, Install-, Rez- und Trash-Entscheidungen.
- Schwierigkeitsgrade über Heuristikqualität, Risikoabschätzung und begrenzte Simulation, nicht über verdeckte Information.
- KI-Erklärungen mit besseren Reason-Codes.
- Soak- und Regressionstests über mehrere Decks und Seeds.

## 9. V0.91 Kartenbild-Asset-Gate und Bild-Import

Ziel:

V0.91 ergänzt nach V0.9 offizielle oder externe Kartenbilder als rein lokales Anzeige-Feature. Die Phase wird bewusst nicht vor V0.9 umgesetzt, damit Kartenpool, Decks, UI und KI zuerst ohne Asset- und Lizenzrisiko stabil bleiben.

Detailplanung:

- `docs/derived/MVP_0.91_DETAILED_PLAN.md`

Schwerpunkte:

- Quellen-, Nutzungs- und Lizenzentscheidung als hartes Asset-Gate.
- Importprogramm für Bildmetadaten und lokale Bilddateien.
- Nicht versionierter lokaler Bildcache.
- Anzeige bekannter Kartenbilder in Katalog, Deckeditor, Match-Setup, Card Preview, Zoom und Board.
- Einheitliche generische Platzhalter für Hidden Cards.
- Keine Bilddaten in Engine, KI, Replay, StateHash, LegalActions, PlayerActions oder Match-State.
- Visibility-Tests gegen Bild-URL-, Alt-Text-, DOM- und Ladezustands-Leaks.

## 10. V1.0 Zielbild

V1.0 ist eine private stabile Plattform mit:

- gutem Matchstart und Matchfluss,
- Human-vs-Human,
- Human-vs-KI in beide Richtungen,
- KI-vs-KI und Simulationen,
- Kartenkatalog,
- Deckeditor,
- kuratiertem spielbarem Kartenpool,
- Replay und Debugging,
- robuster Testsuite,
- privater Hostingfähigkeit.

Öffentliche Lobbies, Accounts, Rankings, Matchmaking, Turnierfunktionen, Chat und breite öffentliche Plattformfunktionen bleiben außerhalb von V1.0, sofern sie nicht ausdrücklich neu gescopt werden.

## 11. Offene Entscheidungen vor V0.5

| ID | Entscheidung | Empfehlung |
|---|---|---|
| POST04-O-001 | Quelle für Kartendaten | Lokaler versionierter Snapshot; externe Quelle nur als Importquelle, nicht als Laufzeitabhängigkeit. |
| POST04-O-002 | Basis-/Starterset-Auswahl | Zuerst als Datenbestand importieren, Spielbarkeit später pro Slice. |
| POST04-O-003 | UI-Analysen | Ergebnisse sammeln und erst für V0.7 als Design-Requirements einfrieren. |
| POST04-O-004 | Deckeditor-Tiefe in V0.6 | Funktionales Fundament ja; finale Gestaltung und Komfort in V0.7. |
| POST04-O-005 | Damage | Nicht als V0.5-Hauptziel; in V0.8 aufnehmen, sobald konkrete Karten es verlangen. |
| POST04-O-006 | Kartenbilder | Als V0.91 nach V0.9 führen; Umsetzung nur nach separater Quellen-, Nutzungs- und Asset-Freigabe. |

## 12. Detailpläne

- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
- `docs/derived/MVP_0.7_DETAILED_PLAN.md`
- `docs/derived/MVP_0.8_DETAILED_PLAN.md`
- `docs/derived/MVP_0.9_DETAILED_PLAN.md`
- `docs/derived/MVP_0.91_DETAILED_PLAN.md`
- `docs/derived/MVP_0.92_DETAILED_PLAN.md`
- `docs/derived/MVP_0.93_DETAILED_PLAN.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`
- `docs/derived/MVP_0.96_DETAILED_PLAN.md`
- `docs/derived/MVP_0.97_DETAILED_PLAN.md`
- `docs/derived/MVP_0.98_DETAILED_PLAN.md`
- `docs/derived/MVP_0.99_DETAILED_PLAN.md`
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md`
