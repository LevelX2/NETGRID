# V1.0 Deck- und Match-Setup-Stabilisierung

Status: implemented_locally_verified
Stand: 2026-05-04

## Zweck

Dieser Schnitt konsolidiert Deckbau, Deckauswahl beim Spielstart und private Matchserien, bevor weitere Mechaniken oder Karten in den normalen Spielpfad aufgenommen werden.

Auslöser ist die Bestandsprüfung nach V0.99/S01: Der Deckeditor und das Match Setup funktionieren als V0.6-Fundament, S01 ergänzt private Zwei-Spiel-Serien, aber die Produktlogik für deckbasierte Tests ist noch nicht eindeutig genug.

## Anpassung nach O:NR-Entscheidung

Die O:NR-Frage ist nicht mehr offen. V1.0 muss O:NR nicht mehr grundsätzlich entscheiden, sondern die begonnene private lokale Datenpool-Integration härten:

- Web-Katalog, Web-Deckvalidierung und Server-Matchstart verwenden denselben Runtime-Kartenpool.
- Lokale O:NR-v1-Karten bleiben privat/lokal und werden nur verwendet, wenn sie als `playable` und `deck_legal` markiert sind.
- Für den Release fehlen noch AI-/Multiplayer-Smokes, Manifest-/Final-Review-Abgleich und klare Dokumentation, dass daraus keine öffentliche Distribution abgeleitet wird.

Der eigentliche V1.0-Schnitt bleibt dadurch unverändert: Deckpaare pro Teilnehmer, KI-Deckpolitik, Serienwertung und UI-Smokes sind weiterhin die stabilisierenden Kernpunkte.

## Ist-Stand

### Deckeditor

Umgesetzt:

- Lokale Deckentwürfe im Browser.
- Anlegen leerer Runner- und Corp-Decks.
- Kopien aus versionierten Templates.
- Mengenbearbeitung, Suche, Typfilter, Vorschau, Import, Export, Duplizieren und Löschen.
- Validierung über `/api/decks/validate`.
- Erzeugung eines immutable Deck-Snapshots nach erfolgreicher Validierung.
- Übergabe eines validierten lokalen Runner- oder Corp-Snapshots in das Match Setup.

Aktuelle Grenzen:

- Lokale Decks sind browserlokal und nicht synchronisiert.
- Der Editor arbeitet mit einem festen Identity-Feld; Identity-Auswahl ist kein eigener Workflow.
- Import im Web ist praktisch, aber noch nicht so streng über das zentrale `@netrunner/decks`-Importmodell geführt wie das Paket selbst.
- Vollständige offizielle Deckbuilding-Regeln, Einfluss, Rotation, Banlist und Turnierlegalität sind nicht umgesetzt.

### Angebotene Karten

Der versionierte Kartenpool `card-snapshot-0.8` enthält 38 Katalogkarten. Davon sind 36 als `playable` und `deck_legal` markiert:

- Runner: 16 Karten.
- Corp: 20 Karten.

Diese Karten werden im Deckeditor side-gefiltert und ohne Identity-Karten angeboten. Das passt zum aktuellen versionierten Matchstart.

Auf dieser Maschine existiert zusätzlich ein ignoriertes privates O:NR-v1-Overlay mit 374 Katalogkarten. Davon sind lokal 45 als `playable` und `deck_legal` markiert:

- Runner: 12 Karten.
- Corp: 33 Karten.

Entscheidung 2026-05-04: Da dieses Projekt privat/lokal genutzt wird, gehören die lokal als `playable` und `deck_legal` markierten O:NR-v1-Karten zum erlaubten privaten Datenpool. Web-Katalog, Web-Deckvalidierung und serverseitige Matchstart-Revalidierung müssen denselben Runtime-Kartenpool verwenden. Die Nutzung bleibt privat/lokal und hebt keine Sperre für öffentliche Distribution auf.

### Matchstart

Umgesetzt:

- Auswahl von Modus: Human-vs-Human, Runner gegen Corp-KI, Corp gegen Runner-KI, KI-vs-KI-Simulation.
- Auswahl von Spielziel: Regelmatch mit 7 Agendapunkten, Einzelspiel mit Deckziel, private Matchserie mit Seitenwechsel.
- Auswahl je eines Runner- und Corp-Deck-Snapshots.
- Seed und KI-Schwierigkeit.
- Serverautoritative Revalidierung der Deck-Snapshots.
- Side-sichere Deckmetadaten in PlayerViews, ohne gegnerische Decklisten.

Aktuelle Grenzen:

- Es gibt nur ein globales Runner-Deck und ein globales Corp-Deck pro Spielstart.
- Es gibt noch kein Modell für „Spieler A besitzt Runner-Deck und Corp-Deck“ sowie „Spieler B oder KI besitzt Runner-Deck und Corp-Deck“.
- Für KI-Spiele ist nicht eindeutig modelliert, ob die KI fest gesetzte Decks, die global ausgewählten Decks, eigene Deckpaare oder eine deterministisch zufällige Auswahl nutzt.
- Random-Deck-Auswahl existiert für die Host-Seite im Human-vs-Human-Start, aber nicht als KI-Deckpolitik.

### Matchserie

Umgesetzt:

- `two_game_side_swap` als private Zwei-Spiel-Hülle.
- Folgespiel nach Spielende über `series-next`.
- Seitenwechsel im zweiten Spiel.
- Neues Einzelspiel mit eigenem `GameState`, Replay, StateHash und privatem Session-/Join-Kontext.
- Ergebnisstand mit Siegen, Niederlagen und Draws; Agenda-Punkte je Spiel werden im Ergebnis gespeichert.

Aktuelle Grenzen:

- Das Folgespiel verwendet dieselben side-spezifischen Deck-Snapshots wie Spiel 1. Es wechselt also Seiten, aber nicht sauber die persönlichen Deckpaare der Beteiligten.
- Eine Matchwertung über aggregierte Agenda-Punkte oder einen definierten Tie-Breaker ist nicht umgesetzt.
- Für Human-vs-KI-Serien fehlt eine explizite Regel: Welche Runner-/Corp-Decks gehören dem Menschen, welche der KI, und darf die KI zufällig wählen?

## Zielbild für V1.0

V1.0 soll keine neuen Regeln und keine neue Kartenbreite einführen. Der Schnitt soll den privaten Testbetrieb verlässlich machen.

## Produktentscheidungen für die Umsetzung

Stand 2026-05-04, als V1.0-Arbeitsannahmen festgelegt:

1. Serienwertung: Historische V1.0-Arbeitsannahme war eine Wertung nur nach Siegen, Niederlagen und Draws. Seit der Korrektur vom 2026-05-07 entscheidet bei gleicher Siegzahl die Summe der side-sicher gespeicherten Agenda-Punkte; nur bei gleicher Sieg- und Agenda-Punkte-Summe endet die private Serie als Draw.
2. KI-Deckpolitik: KI-Gegner unterstützen drei Modi. `fixed` nutzt das feste V0.8-Standarddeckpaar. `selected` nutzt die explizit im Matchstart gewählten KI-Runner-/Corp-Decks. `seeded_random` wählt deterministisch aus serverseitig eingefrorenen, matchstartfähigen Snapshots; private lokale O:NR-Snapshots werden nur bei expliziter Auswahl verwendet, nicht zufällig.
3. UI-Modell: Teilnehmer A ist die hostende/lokale Person, Teilnehmer B ist Gast oder KI. Die vier Slots heißen `Teilnehmer A · Runner-Deck`, `Teilnehmer A · Corp-Deck`, `Teilnehmer B · Runner-Deck` und `Teilnehmer B · Corp-Deck`; bei KI-Modi zeigt die UI Teilnehmer B als KI. Einzelspiele verwenden die Decks der aktuell zugewiesenen Seiten, Serien behalten die persönlichen Deckpaare und wechseln in Spiel 2 nur die Seite.

## Umsetzungsergebnis 2026-05-04

V1.0 ist implementiert und lokal verifiziert. Das Ergebnis ist zusätzlich in `docs/derived/V1_0_DECK_MATCH_STABILIZATION_FINAL_REVIEW.md` dokumentiert.

Umgesetzt:

- Matchstart akzeptiert explizite persönliche Deckpaare für Teilnehmer A und B.
- Private Serien behalten diese persönlichen Runner-/Corp-Deckpaare über den Seitenwechsel.
- Serienwertung nutzt Siege/Niederlagen/Draws und seit 2026-05-07 aggregierte Agenda-Punkte als Tiebreaker.
- KI-Deckpolitik unterstützt `fixed`, `selected` und `seeded_random`.
- Deterministische KI-Random-Auswahl nutzt nur eingefrorene, validierte Snapshots.
- Die Web-UI zeigt V1.0, vier Deckslots und bietet im Matchstart nur validierte versionierte Snapshots sowie validierte lokale Snapshots an.
- Lokale O:NR-v1-Snapshots sind mit AI-/Multiplayer-Smokes, Manifest-/Review-Abgleich und Hidden-Info-Schutz gehärtet.
- Browser-Smoke ausgeführt: Template kopieren, Deck ändern, validieren, für Match verwenden, Runner-vs-Corp-KI-Match starten.

Checks:

- `corepack pnpm lint`: bestanden.
- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden, 175 Tests.
- `corepack pnpm build`: bestanden; die frühere Turbopack-NFT-Warnung zur `card-images`-Route ist durch feste repo-relative Datenpfade behoben.

Must:

- Sichtbare UI-Version auf aktuellen Stand bringen.
- Deckeditor-Angebot eindeutig an „serverseitig matchstartfähig“ oder „nur lokales Experiment“ koppeln.
- Matchstart mit expliziten Deck-Zuweisungen modellieren.
- Für Serien stabile Teilnehmer-Slots mit je einem Runner- und einem Corp-Deckpaar einführen.
- Für KI-Gegner eine klare Deckpolitik anbieten:
  - festes Standard-Deckpaar,
  - explizit gewähltes KI-Deckpaar,
  - optional deterministisch zufällige Auswahl aus serverseitig legalen Snapshots.
- Serienwertung definieren: Siege/Draws bleiben Minimum; aggregierte Agenda-Punkte als Anzeige oder Tie-Breaker nur nach expliziter Entscheidung.
- Hidden-Info-Vertrag erhalten: Decklisten bleiben privat, öffentlich sind nur erlaubte Metadaten.

Should:

- Web-Deckimport über das zentrale `@netrunner/decks`-Importmodell führen.
- Browser-Smoke für Deck erstellen, validieren, im Matchstart verwenden und Match starten ergänzen.
- UI-Texte im Startbereich so trennen, dass Einzelspiel, Regelmatch und private Serie verständlich unterscheidbar sind.
- O:NR-Overlay als privaten lokalen Test-Scope durch Manifest-, Smoke- und Final-Review-Abdeckung härten.

Nicht Teil von V1.0:

- Offizielle Turnierlegalität.
- Accounts, Cloud-Decks, öffentliche Decklisten, Matchmaking oder Rankings.
- Neue Mechaniken jenseits der bereits freigegebenen V0.94- bis V0.99-Harnesses.
- Öffentliche Distribution offizieller Assets.

## Vorgeschlagene Daten- und Servermodelle

### DeckAssignment

Für Einzelspiele genügt weiterhin:

- Runner-Deck-Snapshot für die Runner-Seite.
- Corp-Deck-Snapshot für die Corp-Seite.

Für Serien sollte zusätzlich ein Teilnehmermodell eingeführt werden:

- `participantA.runnerDeckSnapshot`
- `participantA.corpDeckSnapshot`
- `participantB.runnerDeckSnapshot`
- `participantB.corpDeckSnapshot`
- `participantB.controller: human | ai`
- optionale `aiDeckPolicy: fixed | selected | seeded_random`

Spiel 1 und Spiel 2 wählen dann das Deck anhand von Teilnehmer und aktueller Seite, nicht anhand eines globalen Runner-/Corp-Paars.

### O:NR-Entscheidung

Gewählter Pfad: formaler privater lokaler Test-Scope.

- Server nutzt denselben expliziten lokalen Kartenpool wie Web-Deckvalidierung.
- Jede lokal spielbare O:NR-Karte muss für den gehärteten Abschluss Manifest-, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke-Abdeckung haben.
- Matchstart-Smoke mit lokalem O:NR-Deck ist Pflicht und wurde als erster Server-Smoke ergänzt.
- Der Scope bleibt privat/lokal und ignorierte Daten bleiben nicht für öffentliche Distribution bestimmt.

## Testbedarf

Pflichttests für V1.0:

- Deck-Paket: Import-Sanitisierung, Snapshot-Stabilität, falsche Seite, zu viele Kopien, unbekannte Karte, falscher Kartenpool.
- Web-Deck-API: lokale Deckvalidierung, negative Validierung, Payload-Safety, O:NR-Entscheidungspfad.
- Server-Matchstart: explizite Runner-/Corp-Snapshots, lokale Snapshots, falsche Seite, invalidierter Hash, kein Decklisten-Leak.
- KI-Matchstart: Standard-Deckpaar, gewähltes Deckpaar und deterministisch zufällige Auswahl.
- Matchserie: vier Deckslots für zwei Teilnehmer, Spiel 1/Spiel 2 Seitenwechsel mit jeweils richtigem persönlichen Deck.
- Ergebnis: Siege/Draws und, falls freigegeben, aggregierte Agenda-Punkte.
- Browser-Smoke: Deck aus Template kopieren, ändern, validieren, für Match verwenden, Spiel starten.
- Visibility: PlayerViews, WebSocket, Reconnect, Undo, ResultSummary und Logs enthalten keine privaten Decklisten.

## Gate-Ergebnis

`V1_0_deck_match_stabilization_done: true`

Die Produktentscheidungen sind getroffen, umgesetzt und lokal verifiziert. O:NR-v1 bleibt privater lokaler Testzugang; daraus folgt keine öffentliche Distribution und kein breiter offizieller Kartenpool.
