# Backend 0.5 Private Storage Maintenance Plan

Status: proposal
Stand: 2026-05-14
Primaerer Agent fuer Umsetzung: `release-implementation-agent`

## Ziel

Backend 0.5 fuehrt eine kleine private Wartungsoberflaeche fuer lokalen Multiplayer-Storage ein. Der Release macht sichtbar, welche Matches, Replays, Snapshots und Runtime-Daten in der lokalen SQLite-Datenbank liegen, wie viel Platz sie belegen und welche ungefaehrlich aufraeumbar sind.

Der Schnitt ist bewusst unabhaengig von der Mechanik-/Kartenlinie: keine neue Karte, keine neue Regelmechanik, keine Aenderung an `LegalActions`, `applyAction`, KI-Entscheidungen oder PlayerViews.

## Versionseinordnung

Die sichtbare App-/Kartenrelease-Linie bleibt bei `V1.9.21` bzw. dem laufenden `V1.9.22`-Scope. Backend 0.5 ist ein separater Betriebs-/Server-Schnitt und darf keine Karten-, Mechanik- oder Webclient-Release-Promotion behaupten.

Empfohlenes Versionsmodell:

- `App/Core Release`: sichtbare Spiel-, Karten-, Mechanik- und Webclient-Version, aktuell `V1.9.21` mit `V1.9.22` in Arbeit.
- `Backend/Ops Release`: Server-, Storage-, Backup-, Diagnose- und Wartungsschnitte, z. B. `Backend 0.5`.
- `Storage Schema Version`: technische SQLite-Schema-Version, aktuell separat in `storage_meta.schema_version`.

Backend 0.5 darf in Health, Wartungsseite und Final Review als eigene Backend-/Ops-Version erscheinen, ohne `APP_STATUS_LABEL` auf `V1.9.22` oder eine neue Kartenrelease-Version zu setzen.

## Ausgangslage

Aktueller privater Storage:

- Default-Datenbank: `data/runtime/multiplayer/netgrid.sqlite`.
- SQLite ist seit V1.0.8 der lokale Standard.
- Backup/Restore/Inspect existieren als CLI-Helfer.
- Health meldet redaktiert Storage-Status.
- Private Replay-REST-Endpunkte und eine einfache `/replays`-Seite existieren bereits.
- Es gibt keine Admin-/Wartungsseite fuer Storage-Groessen, Match-Alter, Aufraeumkandidaten oder Vacuum.

Konkreter Befund vom 2026-05-14:

- Datenbankgroesse: ca. 363,6 MiB.
- 97 Matches insgesamt.
- 24 terminale Matches (`finished`, `forfeited`, `abandoned`, `cancelled`).
- 73 nicht-terminale Matches, davon 62 noch als `active`.
- Groesste Platztreiber: `matches.record_json` und `state_snapshots`.
- Events selbst sind klein; grosse Matches entstehen hauptsaechlich durch vollstaendige State-Snapshots.

## Produktentscheidung

Backend 0.5 soll kein generisches Admin-Panel fuer ein oeffentliches Produkt werden. Es ist ein lokales privates Betriebswerkzeug fuer den Projektbesitzer.

Prioritaet:

1. Transparenz vor Loeschen.
2. Backup vor riskanter Aktion.
3. Dry-Run vor Write.
4. Terminale und offensichtliche stale Lobbys zuerst.
5. Fertige Matches nicht automatisch loeschen, weil sie private Replay- und Analyseartefakte sein koennen.

## Scope

### Must

| ID | Muss-Anforderung |
| --- | --- |
| B05-MUST-001 | Eine private Wartungsansicht zeigt redaktierte Storage-Kennzahlen: Datenbankgroesse, Matchanzahl, Statusverteilung, Modusverteilung, aeltestes/neustes Match und letzte Aktualisierung. |
| B05-MUST-002 | Die Ansicht zeigt Tabellen-/Payload-Groessen fuer `matches`, `state_snapshots`, `game_states`, `events` und weitere Storage-Tabellen ohne verdeckte Kartendaten oder Token offenzulegen. |
| B05-MUST-003 | Die Ansicht zeigt einzelne Matches mit sicheren Metadaten: Match-ID, Status, Modus, Beteiligte/Anzeigenamen, Created/Updated, Alter, StateVersion, ungefaehre Groesse, Event-/Snapshot-Anzahl. |
| B05-MUST-004 | Es gibt Filter nach Status, Terminal/Nicht-terminal, Alter, Groesse und Modus. |
| B05-MUST-005 | Vor jeder destruktiven Aktion wird ein Dry-Run mit Anzahl, Match-IDs und erwarteter Payload-Ersparnis erzeugt. |
| B05-MUST-006 | Vor jeder destruktiven Aktion wird automatisch ein SQLite-Backup erzeugt und dessen Pfad/ID angezeigt. |
| B05-MUST-007 | Stale Lobbys und offensichtlich abgebrochene Pre-Game-Zustaende koennen geloescht werden, wenn sie aelter als ein konfigurierbarer Schwellwert sind. |
| B05-MUST-008 | Terminale Matches koennen selektiv geloescht werden; `finished` ist nie Default-Auswahl. |
| B05-MUST-009 | Einzelne Matches koennen gezielt zur Loeschung ausgewaehlt werden; interne Einzelzeilen wie Events, StateSnapshots, Tokens oder Sessions bleiben in Backend 0.5 nicht einzeln loeschbar. |
| B05-MUST-010 | Nach Loeschaktionen gibt es optional oder explizit einen SQLite-`VACUUM`-Schritt, damit Speicherplatz tatsaechlich an das Dateisystem zurueckgegeben wird. |
| B05-MUST-011 | Alle Wartungs-APIs sind lokal/private-only und geben keine Tokens, Decklisten, CardInstances, privatePayloads oder Hidden-Info-Felder aus. |
| B05-MUST-012 | Replay-Endpunkte und aktive Matchflows bleiben unveraendert nutzbar. |

### Should

| ID | Sollte-Anforderung |
| --- | --- |
| B05-SHOULD-001 | Dashboard unterscheidet klar zwischen `aktive Partien`, `stale aktive Partien`, `Warte-/Lobby-Reste`, `abgebrochen/aufgegeben`, `fertige Replays`. |
| B05-SHOULD-002 | Die UI bietet Presets: `abgebrochene Lobbys > 7 Tage`, `nicht-terminale Matches > 14 Tage`, `forfeited/abandoned/cancelled > 30 Tage`. |
| B05-SHOULD-003 | Fertige Matches koennen als `behalten` markiert oder von Cleanup-Presets ausgeschlossen werden. |
| B05-SHOULD-004 | Nach Backup, Delete und Vacuum wird ein kurzer lokaler Wartungsbericht angezeigt. |
| B05-SHOULD-005 | Der Wartungsbericht kann ins Projektlog uebertragen werden, aber nicht automatisch bei jeder Routineaktion. |
| B05-SHOULD-006 | Die UI zeigt eine Warnung, wenn sehr grosse aktive Matches wahrscheinlich Replay-/Snapshot-Ballast enthalten. |

### Could

| ID | Koennte-Anforderung |
| --- | --- |
| B05-COULD-001 | Archiv-Export fuer einzelne terminale Matches vor Loeschung. |
| B05-COULD-002 | Kompakter Replay-Export fuer `finished` Matches als Alternative zur vollstaendigen StoredMatch-Persistenz. |
| B05-COULD-003 | Automatische Retention-Empfehlung ohne automatische Ausfuehrung. |
| B05-COULD-004 | Storage-Wachstum ueber Zeit in einer kleinen lokalen Verlaufstabelle. |

### Non-Scope

- Keine Accounts.
- Kein oeffentliches Admin-Panel.
- Keine Rollen-/Rechtematrix fuer fremde Nutzer.
- Keine Loeschung aktiver Matches ohne explizite Auswahl.
- Keine automatische Loeschung beim Serverstart.
- Keine Aenderung an Engine, Replay-Hash, Randomness, LegalActions oder KI.
- Keine Anzeige von FullState, Hidden Zones, private Decklisten, CardInstances oder Tokenmaterial in der UI.
- Keine direkte SQLite-Bearbeitung ausserhalb typisierter Storage-Helper.

## UI-Konzept

Route-Vorschlag: `/maintenance` oder `/admin/storage`.

Empfehlung: `/maintenance`, weil es in der privaten App weniger nach oeffentlicher Plattformadministration klingt.

### Ansicht 1: Uebersicht

Kennzahlen:

- Datenbankdatei und Dateigroesse.
- Freelist/Page-Info.
- Anzahl Matches gesamt.
- Anzahl nach Status.
- Anzahl nach Modus.
- Terminal vs. nicht-terminal.
- Letzte Aktualisierung.
- Tabellenanteile: `matches`, `state_snapshots`, `events`, `game_states`.

### Ansicht 2: Matchliste

Spalten:

- Match-ID kurz und voll kopierbar.
- Status.
- Modus.
- Beteiligte/Anzeigenamen, soweit side-sicher aus Sessions oder Replay-Index ableitbar.
- Created/Updated.
- Alter seit letzter Aktualisierung.
- StateVersion.
- Eventanzahl.
- Snapshotanzahl.
- ungefaehre Record-/Snapshot-Groesse.
- Replay-Status, wenn verfuegbar: `replayOk`, finaler StateHash nur als Hash.

Keine Spalten:

- keine Decklisten.
- keine Kartentitel aus verdeckten Zonen.
- keine Tokens oder Token-Hashes.
- keine private Payloads.

### Ansicht 3: Matchdetail

Ein einzelnes Match kann geoeffnet werden. Die Detailansicht bleibt eine Wartungs- und Diagnoseansicht, kein Full-State-Viewer.

Sichere Detaildaten:

- Match-ID.
- Status, Modus, Format und Seed nur, wenn bereits als normale Matchmetadaten genutzt.
- Beteiligte/Anzeigenamen.
- Created/Updated und Alter.
- StateVersion und MatchVersion.
- Eventanzahl und Snapshotanzahl.
- Groessenanteile: kompletter Match-Record, aktueller GameState, Events, StateSnapshots, DeckSnapshot-Block.
- Replay-Verweis, falls Replay-Index fuer das Match vorhanden ist.
- Loeschbarkeitseinschaetzung: `sicherer Cleanup-Kandidat`, `nur explizit`, `nicht empfohlen`, mit Grund.

Nicht erlaubt:

- keine FullState-Ausgabe.
- keine einzelnen Event-PrivatePayloads.
- keine einzelne StateSnapshot-Inhalte.
- keine Einzelbearbeitung von Events, Snapshots, Sessions oder Tokens.
- keine Reparatur per manueller Tabellenbearbeitung.

### Ansicht 4: Cleanup-Dry-Run

Der Nutzer waehlt ein Preset oder Filter.

Dry-Run zeigt:

- Anzahl betroffene Matches.
- Statusverteilung.
- aeltestes/neustes betroffenes Match.
- ungefaehr freigebbare Payload-Groesse.
- Hinweis: Datei schrumpft erst nach `VACUUM`.
- Liste sicherer Match-Metadaten.

### Ansicht 5: Ausfuehrung

Ausfuehrung in vier Schritten:

1. Backup erzeugen.
2. Ausgewaehlte Matches in einer Transaktion loeschen.
3. Integritaetspruefung ausfuehren.
4. Optional `VACUUM`.

Ergebnis:

- Backup-ID/Pfad.
- geloeschte Matchanzahl.
- Datenbankgroesse vor/nach Vacuum.
- Health/Integrity-Ergebnis.

## Serverseitiger Vertrag

Neue lokale Endpunkte als Vorschlag:

### `GET /api/storage/maintenance/summary`

Liefert redaktierte Kennzahlen.

Beispielstruktur:

- `database`
- `fileSizeBytes`
- `pageSize`
- `pageCount`
- `freelistCount`
- `matchCountsByStatus`
- `matchCountsByMode`
- `terminalCount`
- `nonTerminalCount`
- `tableSizes`
- `largestMatches`

### `GET /api/storage/maintenance/matches`

Parameter:

- `status`
- `terminal`
- `olderThanDays`
- `largerThanBytes`
- `mode`
- `limit`

Liefert nur sichere Match-Metadaten.

### `GET /api/storage/maintenance/matches/:matchId`

Liefert die sichere Matchdetailansicht. Keine FullState-, Snapshot-, Event-PrivatePayload-, Token- oder Decklisten-Daten.

### `POST /api/storage/maintenance/cleanup/preview`

Body:

- Filter/Preset.
- optional explizite Match-IDs.

Liefert Dry-Run ohne Schreibzugriff.

### `POST /api/storage/maintenance/cleanup/apply`

Body:

- Preview-ID oder wiederholte Filter mit Bestätigung.
- `createBackup: true` Pflicht.
- `vacuumAfter: boolean`.

Serververhalten:

- Validiert Filter erneut.
- Erzeugt Backup.
- Loescht nur ganze Matches, die weiterhin Filter und Sicherheitsregeln erfuellen.
- Loescht keine einzelnen internen Event-/State-/Session-/Token-Zeilen.
- Fuehrt optional Vacuum aus.
- Gibt redaktierten Bericht zurueck.

## Sicherheitsregeln

- Endpunkte sind nur im lokalen/private Deployment-Profil aktiv.
- Keine Wartungsaktion im `private_internet`-Profil ohne separate Gate-Entscheidung.
- Keine Antwort enthaelt Token, Token-Hashes, Decklisten, CardInstances, Hidden-Zone-Karten, private Payloads oder FullState.
- Alle Fehlertexte bleiben side-safe.
- Loeschaktionen schreiben keine Matchdetails in Logs.
- Backup-Dateien bleiben lokale Runtime-Artefakte und werden nicht versioniert.
- Wartungsseite darf keine normale Spielseite blockieren.

## Storage- und Datenmodell-Anpassungen

Minimal noetig:

- Read-only Analysehelper fuer SQLite:
  - Dateigroesse.
  - Page/Freelist.
  - Tabellen-/Payload-Groessen.
  - Match-Metadaten.
  - pro Match Event-/Snapshot-Zaehler.
- Delete-Helper mit Transaktion:
  - primaer `DELETE FROM matches WHERE match_id IN (...)`, weil bestehende Foreign Keys `ON DELETE CASCADE` fuer Spiegeltabellen nutzen.
  - danach Integritaetscheck.
- Keine Helper fuer punktuelle Loeschung einzelner Events, Snapshots, Sessions oder Tokens in Backend 0.5.
- Backup vor Delete ueber vorhandene Backup-Funktion.
- Vacuum-Funktion nur nach erfolgreichem Delete und ohne laufende Schreiboperation.

Optional spaeter:

- `retention_marks` oder `match_notes`, um bestimmte Replays dauerhaft zu behalten.
- Komprimierter Archivpfad fuer fertige Matches.

## Abhaengigkeitsmatrix

| Bereich | Aenderung | Abhaengigkeit | Risiko |
| --- | --- | --- | --- |
| Server Storage | Analyse-, Dry-Run-, Delete- und Vacuum-Helper | vorhandener SQLite-Adapter | mittel, weil destruktive Aktionen |
| Server HTTP | lokale Wartungsendpunkte | Deployment-Profil/Origin-Regeln | mittel, wegen Admin-Surface |
| Web | neue Wartungsseite | Server-APIs | niedrig bis mittel |
| Replay | nur Anzeige/Verlinkung, keine Replay-Aenderung | bestehende Replay-API | niedrig |
| Engine/KI/Karten | keine Aenderung | keine | niedrig |
| Tests | Server-, Web- und Leak-Tests | bestehende Vitest-Struktur | mittel |
| Wissen/Doku | Plan, Requirements, Testmatrix, Review | Projektlog-Regeln | niedrig |

## Risiken und Gegenmassnahmen

| Risiko | Bewertung | Gegenmassnahme |
| --- | --- | --- |
| Versehentlich wertvolle Replays geloescht | hoch | `finished` nicht als Default, Dry-Run, Backup-Pflicht, explizite Auswahl |
| Hidden-Info-Leak in Wartungsansicht | hoch | Minimalmetadaten, Redaction-Tests, keine FullState-/record_json-Ausgabe |
| Loeschen aktiver Matches stoert laufende Partie | mittel | aktive Matches nicht per Default, Altersgrenze, erneute Statuspruefung vor Delete |
| Datei schrumpft nach Delete nicht | mittel | UI erklaert Vacuum, optionaler Vacuum-Schritt |
| Vacuum blockiert laufenden Server | mittel | nur lokale Wartung, Aktion kurz halten, bei Bedarf Warnung/Serverruhe empfehlen |
| Admin-Endpunkte in falschem Deployment verfuegbar | hoch | Endpunkte an lokales Profil binden und testen |
| Scope-Creep zu voller Admin-/Moderationskonsole | mittel | Non-Scope hart halten |

## Teststrategie

### Server-Tests

- Summary enthaelt korrekte Status- und Modusverteilung.
- Summary enthaelt Tabellen-/Groessenwerte, aber keine sensiblen Felder.
- Matchliste filtert nach Status, Alter, Groesse und Modus.
- Matchdetail zeigt Beteiligte/Anzeigenamen, Datum, Groessen und Replay-Verweis, aber keine FullState-/Hidden-Info-Daten.
- Cleanup-Preview ist read-only.
- Cleanup-Apply erzeugt vor Delete ein Backup.
- Cleanup-Apply loescht nur erneut validierte Matches.
- Cleanup-Apply erlaubt ganze Match-Loeschung, aber keine Einzelzeilenloeschung aus Events/Snapshots/Sessions/Tokens.
- Foreign-Key-Cascade entfernt zugehoerige Events, Snapshots, Tokens, Sessions usw.
- `finished` Matches werden nicht durch Default-Presets geloescht.
- Vacuum kann nach Delete ausgefuehrt werden und Health bleibt ok.
- Wartungsendpunkte sind im falschen Profil blockiert oder nicht verfuegbar.

### Web-Tests

- Uebersicht rendert Kennzahlen.
- Filter und Presets erzeugen Preview.
- Apply-Button bleibt ohne Preview/Bestaetigung deaktiviert.
- Ergebnisbericht zeigt Backup-ID, Anzahl und Groessen.
- Fehlerfaelle sind klar und nicht technisch ueberladen.
- DOM enthaelt keine Token-, Decklisten- oder Hidden-Info-Marker.

### Regression

- `GET /api/replays` bleibt unveraendert.
- `GET /health` bleibt redaktiert.
- Match erstellen, Join, Action submit und Reconnect bleiben gruen.
- Bestehende Storage-Backup-/Restore-Tests bleiben gruen.

### Pflichtchecks

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`

## Akzeptanzkriterien

Backend 0.5 ist done, wenn:

1. Eine private Wartungsseite sichere Storage-Kennzahlen zeigt.
2. Alte/stale Matchgruppen vor Loeschung als Dry-Run sichtbar sind.
3. Loeschaktionen immer ein Backup erzeugen.
4. `finished` Replays nicht versehentlich durch Default-Presets geloescht werden.
5. SQLite-Integritaet nach Cleanup und optionalem Vacuum gruen ist.
6. Keine sensiblen Daten in Wartungs-API, DOM, Logs oder Fehlern erscheinen.
7. Replays, Health, Matchstart, Join, Action Submit und Reconnect nicht regressieren.
8. Implementation Review und Final Review dokumentieren Ergebnis, Grenzen, Verifikation und bekannte Restpunkte.

## Handoff an `release-implementation-agent`

Empfohlene Umsetzungsschnitte:

1. Requirements/Testmatrix aus diesem Plan ableiten:
   - `requirements.md`
   - `test-matrix.md`
2. Server read-only zuerst:
   - Storage summary helper.
   - sichere Matchliste.
   - Server-Tests und Redaction-Tests.
3. Web read-only Dashboard:
   - `/maintenance`.
   - Kennzahlen, Tabellenanteile, groesste Matches, Filter.
4. Cleanup-Preview:
   - Presets und explizite Auswahl.
   - Preview ohne Write.
5. Cleanup-Apply:
   - Backup-Pflicht.
   - transaktionales Delete.
   - Integritaetscheck.
   - optional Vacuum.
6. Reviews und Projektwissen aktualisieren.

## Empfohlene Verifikation durch `test-quality-agent`

Vor Abschluss sollte der `test-quality-agent` gezielt pruefen:

- ob alle Wartungsantworten redigiert sind,
- ob Loeschpresets keine `finished` Matches versehentlich treffen,
- ob Backup-vor-Delete in Tests wirklich erzwungen ist,
- ob Vacuum/Integritaetscheck robust abgedeckt sind,
- ob bestehende Replay- und Match-Lifecycle-Tests ausreichend regressionssicher bleiben.

## Deferred Scope

- Automatische periodische Retention.
- Komprimierte Archivdatenbank.
- Vollwertige Replay-Verwaltung mit Favoriten/Tags.
- Public/Admin-Rollenmodell.
- Cloud- oder Multi-User-Admin.
- UI fuer Backup-Restore.
- Storage-Wachstumshistorie ueber mehrere Tage.
