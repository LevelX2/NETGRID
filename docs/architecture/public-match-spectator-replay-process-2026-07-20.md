# Öffentliche Matches, Zuschauer und Analyse-Replay

Status: Umsetzung abgeschlossen; lokale Integration ausstehend
Stand: 2026-07-20
Arbeitsbranch: `codex/public-replay-spectator`
Arbeits-Worktree: `C:\Projekte\NETGRID_PUBLIC_REPLAY_SPECTATOR`

## Quelle und Vorgabe

Dieser Prozess setzt den im Chat freigegebenen Gesamtplan um:

- Jedes Match besitzt genau `isPublic: boolean`.
- Der Standard ist `true`.
- Der Wert wird beim Erstellen festgelegt und danach nicht geändert.
- Öffentliche offene Matches sind öffentlich ausgeschrieben und beitretbar.
- Öffentliche aktive Matches sind schreibgeschützt zuschaubar.
- Live-Zuschauer erhalten keine Hände oder andere verdeckte Informationen.
- Öffentliche beendete Matches besitzen ein öffentliches Full-Information-Replay.
- Das Replay startet aus Sicht von Teilnehmer A oder B.
- Die gegnerische Hand kann in einem mitlaufenden Fenster ein- und ausgeblendet werden.
- Alle zum Umsetzungszeitpunkt vorhandenen gespeicherten Matches werden rückwirkend öffentlich und replayfähig gemacht.

## Zielprüfung

Die Vorgabe ist für eine sequenzielle automatische Umsetzung ausreichend präzise. Produktverhalten, Sichtbarkeitsgrenzen, Bestandshandhabung, UI-Ziel, Replay-Vertrag und Abnahmekriterien sind bestimmt.

## Gesamtziel

`/Goal` Arbeite den Prozess „Öffentliche Matches, Zuschauer und Analyse-Replay“ vollständig und sequenziell von Paket PUB-001 bis PUB-005 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die verpflichtenden Wiki-Einstiegsseiten, die betroffenen Package-`AGENTS.md` und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_PUBLIC_REPLAY_SPECTATOR` auf Branch `codex/public-replay-spectator`. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe jedes abgeschlossene Paket. Bei einem echten Sicherheitsblocker dokumentiere Ursache und Removal Condition. Integriere vor dem finalen Merge ein weitergelaufenes `main` defensiv. Entferne nach erfolgreichem lokalen Merge den sauberen Arbeits-Worktree und den vollständig gemergten Arbeitsbranch und verifiziere beides, bevor das Goal abgeschlossen wird.

## Annahmen

- `isPublic` ersetzt den bisherigen Matchstartvertrag `discoverableInLan`; es entstehen keine zwei konkurrierenden Sichtbarkeitsregeln.
- Öffentliche Listings verwenden die bestehende Match-ID; es wird kein zusätzliches ID-System eingeführt.
- Bestehende Matches werden unabhängig von ihrem bisherigen LAN-Flag auf `isPublic: true` normalisiert.
- Ein Full-Information-Replay wird erst nach endgültigem Matchende ausgeliefert.
- Private Matches bleiben für ihre Teilnehmer replaybar, erscheinen aber nicht in öffentlichen Listen und sind für Außenstehende nicht abrufbar.
- Die vorhandene deterministische Replay-, StateHash- und Spectator-Projektionsbasis wird erweitert statt ersetzt.

## Nicht-Ziele

- Keine zusätzlichen Consent-, Veröffentlichungs-, Widerrufs- oder Unlisting-Workflows.
- Keine getrennten Public-Lobby-, Spectator- und Replay-Schalter.
- Kein Live-Zugriff auf Hände oder andere verdeckte Daten für Zuschauer.
- Kein Video-/GIF-Export, Replay-Fork oder automatisches Coaching.
- Keine Änderung an Spielregeln, LegalActions, Kartenfreigaben oder KI-Entscheidungslogik.
- Kein Push und keine Pull Request-Erstellung.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Kein Paket wird übersprungen.
3. Ein Paket endet erst nach Checks, `git diff --check` und eigenem Commit.
4. Spielerpayloads bleiben side-sicher.
5. Live-Zuschauerpayloads bleiben ohne Hidden Info, LegalActions und Choices.
6. Full-Information-Daten werden nur für beendete Replays erzeugt.
7. Replay- und Zuschaueroberflächen sind schreibgeschützt.
8. Fremde Änderungen im Hauptworkspace werden weder verändert noch verworfen.

## Automatische Fehlerbehandlung

- Rote paketnahe Tests werden im aktuellen Paket eng diagnostiziert und behoben.
- Ein Paket mit rotem Done-Gate wird nicht committed und nicht verlassen.
- Bestehende, fachfremde Warnungen werden dokumentiert, aber nicht durch Nebenrefactorings bearbeitet.
- Bei einem Konflikt mit weitergelaufenem `main` werden beide Intentionen gelesen und kompatibel zusammengeführt.
- Ein nicht replayfähiges bestehendes Match wird als Implementierungsfehler behandelt und nicht still aus der öffentlichen Replayliste entfernt.

## Sicherheitsblocker

- Eine Live-Zuschauerpayload enthält Handkarten, verdeckte Kartenidentitäten, private Choices oder LegalActions.
- Ein Full-Information-Replay ist vor Matchende abrufbar.
- Ein privates Match erscheint in einem öffentlichen Listing oder ist öffentlich abrufbar.
- Eine Replay- oder Zuschaueraktion kann den autoritativen Matchzustand verändern.

## State Machine

```text
prepared
  -> PUB-001 active -> committed
  -> PUB-002 active -> committed
  -> PUB-003 active -> committed
  -> PUB-004 active -> committed
  -> PUB-005 active -> committed
  -> final verification
  -> main merge
  -> worktree cleanup
  -> branch cleanup
  -> complete
```

## Fortschritt

| Paket   | Status        | Ergebnis                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUB-001 | abgeschlossen | `isPublic` ersetzt den LAN-Flag, Client und Server verwenden Standard `true`, Recreate und Serien übernehmen den Wert, SQLite normalisiert alle Bestandsmatches einmalig auf öffentlich.                                                                                                                                                                                                                                |
| PUB-002 | abgeschlossen | Gemeinsame öffentliche Liste für offene, aktive und beendete Matches; statusabhängige Navigation; öffentliche aktive Matches besitzen eine polling-aktualisierte read-only Zuschaueransicht auf Basis der leak-geprüften `SpectatorProjectionV1`.                                                                                                                                                                       |
| PUB-003 | abgeschlossen | Terminale Matches liefern StateHash-geprüfte Analyseframes mit Boardzustand und beiden Händen sowie A/B-Seitenzuordnung. Öffentliche Replays sind anonym abrufbar; private nur mit Teilnehmersession; aktive Matches liefern über den Requestpfad keine Frames. Eine temporäre Kopie der realen Bestandsdatenbank bestätigte 19/19 terminale Matches mit 4.218 verifizierten Frames und `isPublic: true` nach Backfill. |
| PUB-004 | abgeschlossen | Visueller read-only Replay-Player mit A/B-Perspektive, Start/Zurück/Play-Pause/Weiter/Ende, Scrubber, 0,5×/1×/2× und dauerhaft zuschaltbarem Gegnerhandfenster. Das Fenster aktualisiert Karten und Gegner automatisch bei Seek, Playback und Perspektivwechsel.                                                                                                                                                        |
| PUB-005 | abgeschlossen | Ergebnisdialog und Matchhistorie verlinken öffentliche beendete Matches direkt in den Replay-Player. Die öffentliche SQLite-Liste nutzt einen kompakten Metadatenpfad ohne History-Hydrierung. Abschlussreviews, Status, Wissensbasis und Log sind aktualisiert; Kern-, Browser- und Produktgates sind dokumentiert.                                                                                                    |

## Paketfolge

| Paket   | Titel                                                | Commit-Vorschlag                                          |
| ------- | ---------------------------------------------------- | --------------------------------------------------------- |
| PUB-001 | Öffentlicher Matchvertrag und Bestandsnormalisierung | `feat(server): add public match contract and backfill`    |
| PUB-002 | Öffentliche Matchliste und Live-Zuschauerpfad        | `feat(server): expose public matches and live spectators` |
| PUB-003 | Full-Information-Replay-Frames und Zugriff           | `feat(replay): add finished-match analysis frames`        |
| PUB-004 | Visueller Replay-Player und Gegnerhand               | `feat(web): add visual replay analysis player`            |
| PUB-005 | Produktintegration, Regression und Abschlussreview   | `test(replay): verify public spectator and replay flow`   |

## Paketdetails

### PUB-001 – Öffentlicher Matchvertrag und Bestandsnormalisierung

Ziel: Ein einziger persistierter Matchflag mit Standard `true` steuert neue und bestehende Matches.

Eingangsvoraussetzungen:

- Prozessartefakt ist committed.
- Shared-, Server- und Storage-Verträge sind gelesen.

Arbeit:

- `isPublic` in die gemeinsamen Create-/Match-Verträge aufnehmen.
- Serverdefault und Webdefault auf `true` setzen.
- `discoverableInLan` durch `isPublic` ersetzen.
- Serienfolgespiele und Recreate übernehmen den Ausgangswert.
- Bestehende gespeicherte Matches unabhängig vom Altwert auf `true` normalisieren und dauerhaft speichern.

Kernartefakte:

- `packages/shared/`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/storage-sqlite.ts`
- Matchstart-UI und paketnahe Tests.

Checks:

- Shared-, Server- und Web-Typecheck.
- Paketnahe Create-/Persistenz-/Recreate-/Serientests.
- Bestandsnormalisierungstest.
- `git diff --check`.

Done-Gate:

- Fehlender Create-Wert ergibt `true`.
- UI ist standardmäßig aktiviert.
- Explizites `false` bleibt erhalten.
- Bestehende Datensätze werden auf `true` normalisiert.

### PUB-002 – Öffentliche Matchliste und Live-Zuschauerpfad

Ziel: Öffentliche Matches sind nach Status auffindbar; aktive öffentliche Matches besitzen eine read-only Zuschaueransicht ohne Hidden Info.

Eingangsvoraussetzung: PUB-001 committed.

Arbeit:

- Öffentliche Liste für offene, aktive und beendete Matches bereitstellen.
- Statusabhängige Aktionen `Beitreten`, `Zuschauen`, `Replay ansehen` ermöglichen.
- `SpectatorProjectionV1` an Route und einen automatisch aktualisierten Lesepfad anbinden.
- Zuschauerboard ohne Spieleraktion rendern.
- Private Matches vollständig aus öffentlichen Pfaden ausschließen.

Kernartefakte:

- `apps/server/src/spectator-projection.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.ts`
- öffentliche Matchlisten- und Zuschauerkomponenten im Webclient.

Checks:

- Server-Projektions- und HTTP-Tests.
- Web-Komponententests.
- Negativscan auf Hände, private Karten, Choices und LegalActions.
- `git diff --check`.

Done-Gate:

- Öffentliche Statusliste funktioniert.
- Aktive öffentliche Matches sind zuschaubar.
- Live-Zuschauer erhalten keine Hidden Info und können keine Aktion ausführen.

### PUB-003 – Full-Information-Replay-Frames und Zugriff

Ziel: Beendete Matches liefern deterministisch verifizierte Analyseframes mit beiden Teilnehmerzuständen.

Eingangsvoraussetzung: PUB-002 committed.

Arbeit:

- Replayrekonstruktion um Frames pro Aktion erweitern.
- Teilnehmer A/B auf die damaligen Seiten abbilden.
- Replay-Anzeigemodell mit beiden Händen und den vollständigen Analyseinformationen erzeugen.
- Öffentlichen Zugriff nur für `isPublic && finished` erlauben.
- Private Replays nur für vorhandene Teilnehmerberechtigung ausliefern.
- Alle bestehenden Matches auf Replayfähigkeit prüfen und erkannte Bestandslücken beheben.

Kernartefakte:

- `packages/engine/src/game/replay.ts`
- Replay-DTOs in `packages/shared/`
- Replay-Service und HTTP-Routen im Server.

Checks:

- Replay-/StateHash-Tests.
- HTTP-Zugriffstests für public/private/active/finished.
- Bestands-Replayprüfung.
- `git diff --check`.

Done-Gate:

- Jeder Frame ist StateHash-verifiziert.
- Vor Matchende existiert keine Full-Information-Ausgabe.
- Öffentliche abgeschlossene Matches sind öffentlich replaybar.
- Private abgeschlossene Matches bleiben nicht öffentlich.

### PUB-004 – Visueller Replay-Player und Gegnerhand

Ziel: Das Replay ist als Board aus Sicht von Teilnehmer A oder B abspielbar und besitzt ein dauerhaft zuschaltbares Gegnerhandfenster.

Eingangsvoraussetzung: PUB-003 committed.

Arbeit:

- Technische Replayseite zum visuellen Player ausbauen.
- Perspektivwahl Teilnehmer A/B.
- Play/Pause, Schritt vor/zurück, Anfang/Ende, Scrubber und Geschwindigkeiten.
- Gegnerhandfenster öffnen/schließen und während Wiedergabe/Seek offen halten.
- Beim Perspektivwechsel automatisch die andere Hand anzeigen.
- Bestehende Boardkomponenten in einem read-only Pfad wiederverwenden.

Kernartefakte:

- `apps/web/app/replays/page.tsx`
- neue oder angepasste Komponenten unter `apps/web/features/replay/` und `apps/web/features/game-board/`.

Checks:

- Web-Typecheck und Komponententests.
- Browser-Smoke für Perspektive, Seek, Playback und Gegnerhand.
- Read-only-Negativtest.
- `git diff --check`.

Done-Gate:

- Beide Perspektiven funktionieren.
- Gegnerhand entspricht jedem gewählten Schritt.
- Fensterzustand bleibt bei Playback, Seek und Perspektivwechsel erhalten.

### PUB-005 – Produktintegration, Regression und Abschlussreview

Ziel: Der komplette Flow ist integriert, regressionsgesichert und dokumentiert.

Eingangsvoraussetzung: PUB-004 committed.

Arbeit:

- Matchstart, öffentliche Liste, Ergebnisdialog, Matchhistorie und Replayseite verbinden.
- E2E-Flow für public und private ausführen.
- Bestandsmigration und Replayfähigkeit dokumentieren.
- Implementation Review und Final Review erstellen.
- Wissensbasis, Status und Log nur für belastbare neue Endstände aktualisieren.

Checks:

- Paketnahe Tests.
- `corepack pnpm typecheck`.
- `corepack pnpm test:contracts`.
- relevante Engine-, Server- und Webtests.
- `corepack pnpm build`.
- gezielter Browser-E2E.
- `git diff --check`.

Done-Gate:

- Öffentlicher End-to-End-Flow funktioniert.
- Private Negativspur funktioniert.
- Live-Zuschauer bleiben redigiert.
- Replay nach Matchende besitzt beide Hände.
- Alle vorhandenen gespeicherten Matches sind öffentlich und replayfähig.
- Abschlussartefakte benennen Checks und Abweichungen vollständig.

## Verifikationsregeln

- Paketnahe Tests laufen vor breiten Gates.
- Timeout oder abgebrochener Prozess gilt nicht als bestanden.
- Hidden-Info-Negativtests prüfen Payload und DOM.
- Full-Information-Positivtests prüfen mehrere Schritte vor und nach Handänderungen.
- Bestandsprüfung berichtet Gesamtzahl, normalisierte Matches, replayfähige Matches und konkrete Fehler.
- Der finale Build und Browser-Flow laufen erst nach grünen Kernverträgen.

## Bisherige Prüfergebnisse

- PUB-002: Shared-, Server- und Web-Typecheck grün; Projektions-, HTTP- und Navigationshilfstests grün; Web-Produktionsbuild grün.
- PUB-003: Shared- und Server-Typecheck grün; Replay-Zugriffs-, Frame-, Handänderungs- und StateHash-Tests grün.
- PUB-004: Web-Typecheck, Player-Modelltests und Produktionsbuild grün. Isolierter Playwright-Smoke auf Ports 8788/3101 bestätigte 9-Schritt-Replay, A/B-Wechsel ohne Schrittverlust, offenes automatisch wechselndes Gegnerhandfenster, Einzelschritt und 2×-Playback bis zu aktualisierten Board-/Handzuständen; Browserkonsole ohne Fehler oder Warnungen. Testprozesse, Browserdaten und temporäre SQLite-Datei wurden anschließend entfernt.
- PUB-005: Projektweiter Typecheck grün; Contract-Gates mit 20 Tests grün; sieben gezielte Serverregressionen für Default, Backfill, öffentliche Liste, Live-Redaktion und Replayzugriff grün; 59 Webtestdateien mit 674 Tests grün; Produktionsbuild, `format:changed` und `git diff --check` grün. Ergebnisdialog und Matchhistorie verlinken öffentliche Replays direkt; der häufige öffentliche Listenabruf liest keine Event- oder Snapshothistorien mehr.
- Bestandsaudit auf einer anschließend gelöschten temporären SQLite-Kopie: 21 Matches insgesamt, 19 terminal, 19/19 aus persistierten StateHash-verifizierten Frames abspielbar, 4.218 Frames erzeugt, alle 21 nach Migration öffentlich. Drei historische Matches lassen sich zusätzlich vollständig mit der aktuellen Engine neu simulieren; die übrigen historischen Partien bleiben über ihre persistierten verifizierten Zustände replaybar und benötigen keine Legacy-Regelkompatibilität.
- Breiter `multiplayer.test.ts`-Lauf: 136/137 grün. Ein fachfremder, isoliert reproduzierbarer Altfehler bleibt in `advances Corp AI in a root-rez window even when activeSide is runner`: Der Test erwartet keine Runner-`LegalActions`, die aktuelle Engine liefert `jack_out` und `continue_run`. Das Replay-Paket verändert diese Regelspur nicht.

## Worktree-, Git- und Integrationsregeln

- Alle Prozessänderungen entstehen ausschließlich im dokumentierten Arbeits-Worktree.
- Jeder Paketcommit enthält nur den Paketumfang.
- Der Hauptworkspace bleibt bis zum finalen Merge unangetastet.
- Vor dem Merge wird ein weitergelaufenes `main` in den Arbeitsbranch integriert und erneut geprüft.
- Der lokale Merge erfolgt bevorzugt per Fast-Forward.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Arbeitsbranch ohne Force entfernt und ihre Entfernung in Git sowie im Dateisystem verifiziert.

## Controller-Prompt-Kern

Arbeite ohne erneute Scope-Rückfragen sequenziell durch PUB-001 bis PUB-005. Behalte den freigegebenen einfachen Produktvertrag bei: genau ein Flag, Standard öffentlich, keine Zusatz-Policy. Stoppe nur bei einem dokumentierten Sicherheitsblocker oder einem fachlich unauflösbaren Konflikt. Committe jedes grüne Paket einzeln und schließe erst nach lokalem Main-Merge und verifiziertem Cleanup ab.

## Abschlusskriterien

- PUB-001 bis PUB-005 besitzen je einen grünen Commit.
- Finale Checks sind dokumentiert und grün oder mit akzeptierter, nicht fachlicher Einschränkung begründet.
- Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist nach dem Merge geprüft.
- Arbeits-Worktree existiert weder in `git worktree list` noch im Dateisystem.
- Der gemergte Arbeitsbranch ist gelöscht.
- Das `/Goal` ist erst danach `complete`.
