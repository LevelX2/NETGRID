# V2.3a Requirements - LAN Open Lobby Mini Slice

Stand: 2026-05-10
Status: requirements_freeze

## Kurzfassung

V2.3a friert einen kleinen UX-/Server-Slice ein: Im Bereich `Beitreten` soll eine Liste offener, joinbarer LAN-Matches sichtbar sein, damit Spieler ohne manuelle Linkkopie beitreten können.

Der Slice bleibt strikt privat und nicht-öffentlich: kein Matchmaking, keine öffentliche Lobby, keine Accounts, keine Regel- oder Kartenänderung.

## Roadmap-Grenze

- Die bestehende Pflichtlinie bleibt unverändert: V1.9.1 bis V1.9.8 vor V2.x.
- V2.3a ist als Vorstufe für spätere V2.3-Lobbyarbeit gedacht, ohne den Mechanikpfad zu verändern.

## Ist-Basis

- Join per Join-Link und manuelle Match-ID/Token-Eingabe existieren.
- Private Startlobby-, Ready-, Countdown- und Lifecycle-Verträge sind vorhanden.
- Hidden-Info-, Token- und Payload-Redaction-Gates sind etabliert.
- Serverautoritärer Join mit Revalidierung ist vorhanden.

## Anforderungen

| ID | Priorität | Anforderung | Testspur |
| --- | --- | --- | --- |
| V23A-MUST-001 | Must | Web-UI zeigt unter `Beitreten` eine Liste offener Matches aus dem aktuellen Serverkontext. | V23A-T001 |
| V23A-MUST-002 | Must | Gelistet werden nur joinbare `pending`-Matches mit `discoverableInLan = true`. | V23A-T002, V23A-T003 |
| V23A-MUST-003 | Must | Jeder Listeneintrag enthält nur freigegebene Metadaten: `matchId` (kurz), Host-Anzeigename, Modus, Zeitstempel/Alter, Status. | V23A-T004 |
| V23A-MUST-004 | Must | Listenpayloads enthalten keine Tokens, keine Decknamen, keine Deckhashes, keine Decklisten und keine Hidden-Info-Felder. | V23A-T005, V23A-T018 |
| V23A-MUST-005 | Must | Auswahl eines Eintrags nutzt den bestehenden Join-Prozess; es entsteht keine parallele zweite Join-Logik. | V23A-T006 |
| V23A-MUST-006 | Must | Join-Link- und manuelle Eingabe bleiben als Fallback erhalten und regressionsfrei. | V23A-T007 |
| V23A-MUST-007 | Must | Match-Erstellung unterstützt `discoverableInLan` (an/aus); nur aktivierte Matches erscheinen in der LAN-Liste. | V23A-T008, V23A-T009 |
| V23A-MUST-008 | Must | Die Liste aktualisiert sich automatisch (z. B. Intervall) und manuell per Refresh. | V23A-T010 |
| V23A-MUST-009 | Must | Join-Versuche auf inzwischen ungültige Einträge werden side-sicher abgelehnt; UI zeigt klare Rückmeldung und aktualisiert die Liste. | V23A-T011, V23A-T012 |
| V23A-MUST-010 | Must | Hidden-Info-, Token- und Payload-Redaction-Gates bleiben für REST, WebSocket, Reconnect, Logs und Browser-Storage grün. | V23A-T013, V23A-T018 |
| V23A-MUST-011 | Must | V2.3a führt keine neue Spielmechanik, keine Kartenfreigabe, keine RulesBaseline-Änderung und keine Änderung an Replay/StateHash/RNG ein. | V23A-T014 |
| V23A-MUST-012 | Must | V2.3a führt kein Matchmaking, keine öffentliche Lobby, keine Accounts, keine Rankings, keine Turniere, keinen Spectator und keinen Chat-Ausbau ein. | V23A-T015 |
| V23A-MUST-013 | Must | Join bleibt serverautoritativ; finale Revalidierung beim Join verhindert Race-bedingte Fehlstarts. | V23A-T011, V23A-T016 |
| V23A-SHOULD-001 | Should | Listenanzeige bleibt bei leerer Menge klar verständlich (`Keine offenen Spiele gefunden`). | V23A-T017 |
| V23A-SHOULD-002 | Should | Antwortzeiten für `GET /api/matches/open` bleiben für kleine private LAN-Setups flüssig (ohne zusätzliche Infrastruktur). | V23A-T019 |

## Nicht-Ziele

- Keine öffentliche Discovery über mehrere Hosts oder Internet.
- Kein automatisches Matchmaking.
- Keine neuen Persistenztechnologien.
- Keine Engine-/KI-Logikänderung.

## Akzeptanz

V2.3a ist umsetzungsbereit, wenn Requirements, Testmatrix und Requirements-Review konsistent sind.

V2.3a ist abgeschlossen, wenn:

- offene LAN-Matches im Bereich `Beitreten` sichtbar sind,
- Join aus der Liste stabil funktioniert,
- Join-Link-/Manuell-Fallback regressionsfrei bleibt,
- keine Token-/Deck-/Hidden-Info-Leaks auftreten,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` grün sind.
