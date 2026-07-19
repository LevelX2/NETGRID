# Account-Matchstatistik – Umsetzungsplan

Stand: 2026-07-19
Zielstufe: V2.0 Closed Accounts Alpha – Folgepaket
Status: umsetzungsreifer Plan, noch nicht implementiert

## 1. Ziel und Ausgangslage

NETGRID soll für angemeldete Accounts eine private, belastbare Matchstatistik
führen. Ein Account soll seine gespielten Partien, Ergebnisse und sinnvolle
Aufschlüsselungen sehen können, ohne dass Accountdaten in Rules Engine,
`GameState`, `PlayerView`, Replay, StateHash, KI-Input oder öffentliche
Ergebnisdaten gelangen.

Bereits vorhanden sind:

- geschlossene Passwort-Accounts mit widerrufbaren Sessions;
- SQLite-Account- und Matchstorage;
- autoritative Account-Anzeigenamen beim Erstellen und Beitreten;
- öffentliche Teilnehmerkategorien `account`, `guest` und `ai`;
- terminale Spiel- und Serienergebnisse sowie „Letzte Spiele“;
- Account-Export, Accountlöschung, Backup und Match-Retention.

Noch fehlt eine sichere Zuordnung zwischen Account und Matchteilnahme. Die
öffentliche Kategorie `account` reicht dafür absichtlich nicht aus. Eine
Zurechnung über Anzeigenamen ist unzulässig, weil Namen nicht eindeutig und
später änderbar sind.

## 2. Produktvertrag der ersten Stufe

### In Scope

- Statistik ausschließlich für den jeweils angemeldeten Account;
- Spiele gesamt sowie Siege, Niederlagen und Unentschieden;
- getrennte Werte als Runner und Korp;
- Aufschlüsselung nach Gegnerart: Account, Gast oder KI;
- Aufschlüsselung nach Matchmodus und Matchformat;
- Aufgabe-/Forfeit-Ergebnisse als eigene Teilmenge;
- abgebrochene beziehungsweise verlassene Partien als eigener Wert;
- Zwei-Spiel-Serien zusätzlich als Serienstatistik, ohne die einzelnen Spiele
  aus der Spielstatistik herauszurechnen;
- private paginierte Account-Matchhistorie mit den für die Statistik
  gespeicherten, redigierten Ergebnisfakten;
- Account-Export, Accountlöschung, Backup/Restore und Wartungsprüfung für die
  neuen Daten;
- ausschließlich neue, nach dem Statistik-Cutover sicher accountgebundene
  Partien.

### Deferred Scope

- öffentliche Profile oder öffentlich sichtbare Statistiken;
- Ranking, Elo, Seasons, Leaderboards, Turniere oder Ranked/Casual-Wertung;
- Vergleich mit anderen Accounts;
- gegnerbezogene Langzeitprofile;
- Speicherung von Gegner-Account-ID oder Gegner-Anmeldename in der eigenen
  Statistik;
- vollständige Decklisten oder gegnerische Deckmetadaten;
- detaillierte Karten-, Zug-, Economy- oder KI-Entscheidungsanalysen;
- nachträgliche Zuordnung historischer Spiele über Anzeigenamen;
- globale Produkt- oder Meta-Statistiken;
- voraggregierte Zählertabellen, solange die Closed Alpha mit direkten
  SQL-Aggregationen zuverlässig und schnell genug bleibt.

## 3. Verbindliche Zählregeln

Die Begriffe müssen vor der Implementierung als gemeinsamer Vertrag in
`@netgrid/shared` festgelegt werden.

| Fall | Spiel gesamt | Sieg/Niederlage/Unentschieden | Sonderwert |
|---|---:|---:|---|
| regulär beendet | ja | entsprechend Gewinner | `completed` |
| durch Forfeit beendet | ja | entsprechend Gewinner | zusätzlich `forfeit` |
| Unentschieden | ja | Unentschieden | `draw` |
| vor Spielstart abgebrochen | nein | nein | optional nur Betriebsereignis |
| aktives Match verlassen/abandoned ohne Gewinner | nein für Winrate, separat sichtbar | nein | `abandoned` |
| laufendes oder wartendes Match | nein | nein | keine Statistikzeile |
| reine KI-gegen-KI-Beobachtung | nein | nein | ausgeschlossen |
| Account gegen KI | ja | ja | Gegnerart `ai` |
| Account gegen Gast | ja | ja | Gegnerart `guest` |
| Account gegen Account | für beide Accounts je einmal | je Perspektive | Gegnerart `account` |

Für eine Zwei-Spiel-Serie gelten beide Ebenen:

- jedes beendete Spiel zählt genau einmal in der Spielstatistik;
- erst eine fachlich abgeschlossene Serie zählt genau einmal in der
  Serienstatistik;
- ein begonnenes, aber nicht abgeschlossenes Serienpaar erzeugt noch keinen
  Serien-Sieg oder -Verlust;
- Matchpunkte und Agenda-Punkte werden aus dem bestehenden Serienvertrag
  übernommen, nicht neu berechnet.

Kontrolliert derselbe Account in einer privaten Testpartie beide menschlichen
Teilnehmerslots, wird die Partie als `self_play` markiert und standardmäßig
nicht in Siege, Niederlagen oder Winrate eingerechnet. Sie darf separat als
Test-/Eigenpartie sichtbar bleiben. Damit bleiben lokale Zwei-Tab-Tests
möglich, ohne die fachliche Statistik zu verfälschen.

## 4. Datenmodell und Persistenz

### 4.1 Grundsatz

Keine Statistikzähler werden direkt am Account hoch- und heruntergezählt.
Stattdessen wird ein schmales, idempotentes Ergebnisledger geführt und bei
Abfragen aggregiert. Das vermeidet Drift nach Wiederholungen, Reconnect,
Serverneustart oder Reparaturläufen.

### 4.2 Account-Matchbindung

Neue SQLite-Tabelle `account_match_participants`:

- `match_id`
- `participant_slot` (`player_a` oder `player_b`)
- `account_id`
- `bound_at`
- `binding_source` (`authenticated_create` oder `authenticated_join`)
- Primärschlüssel `(match_id, participant_slot)`
- Index `(account_id, bound_at)`
- Foreign Key auf `accounts` mit `ON DELETE CASCADE`
- Foreign Key auf `matches` mit `ON DELETE CASCADE`

Diese Tabelle gehört zur Server-Control-Plane. Account-ID und Bindung werden
nicht in `MatchRecord`, Matchsession, Engine-State oder Replay kopiert.

Bindungsregeln:

- Die Account-ID stammt ausschließlich aus einer gültigen Account-Session.
- Requestdaten dürfen niemals eine Account-ID vorgeben.
- Erstellen bindet den authentifizierten Host an `player_a`.
- Beitreten bindet den authentifizierten Joiner an `player_b`.
- Ein als Gast gestarteter Teilnehmer wird durch spätere Anmeldung nicht
  rückwirkend zum Accountteilnehmer.
- Logout oder Sessionablauf nach Matchstart entfernt eine bestehende Bindung
  nicht.
- Recreate und folgende Serienspiele übernehmen die bereits autorisierten
  Teilnehmerbindungen kontrolliert auf die neuen Match-IDs.

### 4.3 Dauerhaftes Ergebnisledger

Neue SQLite-Tabelle `account_game_results`, eine Zeile je sicher gebundenem
Account und statistisch relevantem terminalen Spielereignis. Dazu gehören
beendete Spiele und gesondert geführte Abbrüche nach Spielstart:

- `account_game_result_id`
- `account_id`
- `origin_match_id`
- `participant_slot`
- `series_id` und `game_number`, falls vorhanden
- `completed_at`
- `side` (`runner` oder `corp`)
- `outcome` (`win`, `loss`, `draw`, `abandoned`)
- `finish_kind` (`regular`, `forfeit`, `time_expired`, `leave`, `abandon`
  oder weiterer bereits definierter terminaler Grund)
- `opponent_kind` (`account`, `guest`, `ai`)
- `match_mode`, `match_format` und versioniertes Kartenpool-/Formatprofil
- `agenda_points_for`, `agenda_points_against`, `match_points`
- `statistics_eligible` und optionaler Ausschlussgrund wie `self_play`
- `recorded_at`
- Unique Constraint `(account_id, origin_match_id, participant_slot)`
- Foreign Key nur auf `accounts` mit `ON DELETE CASCADE`

`origin_match_id` bleibt ein opaker Herkunftsschlüssel ohne Foreign Key auf
`matches`. Dadurch darf die bestehende Match-Retention große Match-, Event-
und Replaydaten löschen, ohne die schmale persönliche Langzeitstatistik zu
vernichten.

Neue Tabelle `account_series_results`, eine Zeile je Account und vollständig
beendeter Serie:

- `account_series_result_id`
- `account_id`, `series_id`, `participant_slot`, `completed_at`
- `outcome`, `opponent_kind`
- `games_played`, `wins`, `losses`, `draws`
- `match_points_for`, `match_points_against`
- `agenda_points_for`, `agenda_points_against`
- `statistics_eligible` und Ausschlussgrund
- Unique Constraint `(account_id, series_id, participant_slot)`
- Foreign Key auf `accounts` mit `ON DELETE CASCADE`

Auch hier werden weder Gegner-Account-ID noch Gegner-Anmeldename gespeichert.
Für die erste Stufe wird ebenfalls keine vollständige Deckliste gespeichert.

### 4.4 Schema und Migration

- SQLite-Schema von Version 2 auf Version 3 anheben.
- Bestehenden Pre-Migration-Backupvertrag beibehalten.
- Migration legt nur neue Tabellen und Indizes an.
- Keine historische Befüllung anhand von Anzeigenamen.
- Ein `statisticsSince`-Zeitpunkt kennzeichnet in API und UI den Beginn der
  verlässlichen Erfassung.

## 5. Ergebnisaufnahme und Führung

Ein eigener `AccountMatchStatisticsService` beziehungsweise klar
abgegrenzter Serverdienst übernimmt:

1. authentifizierte Teilnehmerbindung;
2. Erzeugung einer redigierten terminalen Statistikprojektion;
3. idempotente Ablage der Spielzeilen;
4. idempotente Ablage einer abgeschlossenen Serienzeile;
5. Aggregation und paginierte Historie;
6. Export, Lösch- und Reconciliation-Unterstützung.

Die terminale Projektion darf ausschließlich bereits fachlich feststehende
Ergebnisfakten verwenden. Sie darf keine privaten Hände, Draw-Piles,
Decklisten, LegalActions, KI-Traces oder vollständigen Events lesen oder
kopieren.

Die Ergebnisablage muss wiederholbar sein:

- mehrfaches Persistieren desselben terminalen Matches erzeugt keine
  Doppelzählung;
- Serverneustart und Reconnect erzeugen keine neue Zeile;
- das nächste Serienspiel dupliziert das vorherige Ergebnis nicht;
- bei einem Schreibfehler kann ein Reconciliation-Lauf die fehlende Zeile aus
  noch vorhandenen Matchdaten und der sicheren Bindung nachtragen;
- widersprüchliche bereits gespeicherte Ergebnisfakten werden nicht still
  überschrieben, sondern als Integritätsfehler gemeldet.

Für die langfristige Internettauglichkeit soll die finale Matchpersistenz und
die Ledgeraufnahme in derselben SQLite-Transaktion erfolgen. Falls der erste
Umsetzungsschnitt dies architektonisch noch nicht sauber erlaubt, ist ein
persistenter Outbox-Eintrag plus Reconciliation-Gate vorzuziehen; ein reiner
Best-Effort-Callback ohne Reparaturpfad ist nicht akzeptabel.

## 6. API-Vertrag

Neue authentifizierte Endpunkte:

### `GET /api/account/statistics`

Antwort mit versioniertem Schema, mindestens:

- `statisticsSince`
- `totals`: Spiele, Siege, Niederlagen, Unentschieden, Forfeits, Abbrüche,
  Eigenpartien und abgeschlossene Serien
- `bySide`: Runner und Korp
- `byOpponentKind`: Account, Gast und KI
- `byMode` und `byMatchFormat`
- `series`
- `generatedAt`

Optional zulässige Filter der ersten Stufe:

- Zeitraum `all`, `30d`, `90d`
- Seite
- Gegnerart
- Matchmodus

### `GET /api/account/match-history`

- cursorbasierte Pagination;
- standardmäßig 20, maximal 50 Einträge;
- nur eigene redigierte Ledgerzeilen;
- keine Gegner-ID, kein Anmeldename, keine Deckliste;
- Link auf ein Match oder Replay nur, wenn ein eigener, separat
  autorisierter Replayvertrag besteht und die Rohdaten noch vorhanden sind.

Beide Endpunkte verlangen eine gültige Account-Session, liefern
`Cache-Control: no-store` und erhalten einen eigenen Rate-Limit-Bucket. Es
gibt in dieser Stufe keinen Endpunkt `/api/accounts/:id/statistics`.

## 7. Oberfläche

Im Accountbereich entsteht eine Ansicht `Statistik`:

- Kopfzeile „Deine Matchstatistik“ mit Hinweis „Erfasst seit …“;
- Kennzahlen für Spiele, Siege, Niederlagen und Unentschieden;
- Winrate nur bei mindestens einem wertbaren Ergebnis und immer zusammen mit
  der absoluten Stichprobengröße;
- Runner-/Korp-Aufschlüsselung;
- Aufschlüsselung gegen Account, Gast und KI;
- getrennte Serienkarte;
- Filter für Zeitraum, Seite und Gegnerart;
- darunter private Matchhistorie mit Datum, eigener Seite, Gegnerart,
  Ergebnis, Agenda-Punkten, Modus und gegebenenfalls Serienbezug;
- klare Kennzeichnung von Forfeit, Abbruch und ausgeschlossener Eigenpartie.

Die globale Ansicht „Letzte Spiele“ bleibt die allgemeine Ergebnisliste. Die
Accountstatistik ist eine eigene, private Ansicht und ersetzt sie nicht.

## 8. Datenschutz, Export und Löschung

- Statistik ist standardmäßig privat.
- Keine öffentliche Profilstatistik ohne späteres Consent-, Moderations- und
  Privacy-Gate.
- Account-Export wird auf ein neues versioniertes Schema erweitert und enthält
  eigene Spiel- und Serienledgerzeilen sowie die aggregierte Zusammenfassung.
- Accountlöschung entfernt Bindungen und persönliche Ledgerzeilen per
  `ON DELETE CASCADE`.
- Die Löschung eines Gegners verändert nicht die eigene anonyme
  Ergebnisstatistik, weil dort keine Gegner-ID gespeichert ist.
- Match-Retention darf das Ergebnisledger nicht löschen.
- Backup/Restore umfasst die neuen Tabellen.
- Logs und Fehler enthalten weder Account-ID/Anmeldename zusammen mit
  Matchinhalt noch vollständige Statistikantworten.

## 9. Umsetzungspakete

### Paket A – Vertrag und SQLite-Grundlage

- Shared-Typen und Zählregeln festschreiben.
- Schema-v3-Migration und Tabellen ergänzen.
- Storage-Interfaces für Bindung, Ledger, Aggregation und Pagination.
- Migration-, Constraint-, Backup- und Restore-Tests.

Gate: Schema 2 migriert sicher auf 3; leere Statistiken sind korrekt; keine
bestehenden Account- oder Matchdaten ändern sich.

### Paket B – Sichere Teilnehmerbindung

- Authentifizierten Create-/Join-Kontext mit `player_a`/`player_b` verbinden.
- Bindung außerhalb des Matchrecords persistieren.
- Recreate und Serienfortsetzung abdecken.
- Gast-, Logout-, manipulierte Request- und Self-Play-Fälle testen.

Gate: Account-ID kommt nur aus der Account-Session und erscheint in keinem
öffentlichen oder Engine-/Replay-Payload.

### Paket C – Terminale Ergebnisprojektion

- Spiel- und Serienprojektoren implementieren.
- Lifecycle- und Zählregeln abdecken.
- transaktionale/idempotente Aufnahme und Reconciliation ergänzen.
- Retention-Unabhängigkeit verifizieren.

Gate: wiederholtes Finalisieren, Neustart und Reconciliation verändern jede
fachliche Statistik genau einmal.

### Paket D – Private API, Export und Löschung

- Statistik- und History-Endpunkte ergänzen.
- Auth, Rate Limit, `no-store`, Filter und Cursor testen.
- Account-Export versionieren.
- Accountlöschung, Backup/Restore und Maintenance-Übersicht ergänzen.

Gate: Ein Account kann ausschließlich eigene Statistikdaten lesen; Export und
Löschung sind vollständig.

### Paket E – Account-UI

- Statistiknavigation und Kennzahlenansicht ergänzen.
- Filter und paginierte Historie anbinden.
- Empty State, kleine Stichprobe, Forfeit, Abbruch, Serie und Self-Play
  verständlich darstellen.
- Desktop-, Tablet- und Mobile-Smokes ergänzen.

Gate: reale Browserprüfung mit Account gegen KI sowie zwei getrennten
Accounts; Gastansicht zeigt keine Accountstatistik.

### Paket F – Final Review und Betriebsübergabe

- Datenschutz-/Leak-Review.
- Reconciliation- und Restore-Probelauf.
- Runbook, Wissensbasis und Account-Final-Review aktualisieren.
- vollständige projektweite Gates ausführen.

## 10. Abhängigkeiten

| Bereich | Abhängigkeit | Betroffene Pakete |
|---|---|---|
| Accountauth | sichere Account-ID aus gültiger Session | B, D |
| Multiplayer | stabile Teilnehmer-Slots und terminale Ergebnisse | B, C |
| Serien | vorhandene Matchpunkte-/Agenda-Wertung | C |
| SQLite | Schema-v3-Migration und gemeinsame Transaktion | A, C |
| Retention | Ledger bleibt nach Rohmatch-Löschung erhalten | C, F |
| Datenschutz | Export, Löschung, keine Gegneridentifikation | D, F |
| Webclient | Accountbereich und private API | E |

Reihenfolge: `A → B → C → D → E → F`. Paket B und die reine UI-Vorbereitung
aus E können nach Vertragsfreeze teilweise parallel vorbereitet werden; die
Abnahme bleibt sequenziell.

## 11. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Doppelzählung bei mehrfacher Speicherung | Unique Constraints, idempotenter Upsert ohne stilles Umschreiben |
| falsche historische Zuordnung | kein Anzeigenamen-Backfill, sichtbarer Cutover-Zeitpunkt |
| Verlust durch Match-Retention | unabhängiges schmales Ledger ohne Match-Foreign-Key |
| Leak von Account- oder Gegnerdaten | Control-Plane-Trennung, private Endpunkte, Payload-Leaktests |
| Serien werden doppelt gezählt | getrennte Spiel- und Serienledger mit eigenen Unique Constraints |
| Self-Play verfälscht Werte | `statistics_eligible=false`, separate Darstellung |
| Ergebnisaufnahme scheitert | gemeinsame Transaktion oder persistente Outbox plus Reconciliation |
| späterer Scope wird zu Ranking | öffentliche Profile, Elo und Leaderboards explizit deferred halten |

## 12. Akzeptanzkriterien und Gates

1. Nur eine authentifizierte Matchteilnahme erzeugt Accountstatistik.
2. Account-ID und Anmeldename erscheinen nicht in Matchrecord, Engine,
   PlayerViews, LegalActions, PublicEvents, Replays, StateHash oder KI-Input.
3. Reguläre Ergebnisse, Draw, Forfeit, Abbruch, KI, Gast, Account, Self-Play
   und Zwei-Spiel-Serie folgen den festgelegten Zählregeln.
4. Jedes Spiel und jede Serie wird je Account höchstens einmal verbucht.
5. Match-Retention verändert die bereits geführte Statistik nicht.
6. Accountlöschung entfernt alle persönlichen Statistikzeilen.
7. Account-Export enthält die eigenen Statistikdaten in versionierter Form.
8. Kein Account kann Statistik oder History eines anderen Accounts abrufen.
9. Migration, Backup, Restore und Reconciliation sind getestet.
10. Shared-, Server-, Web-, Contract-, Package-Boundary- und Browser-Gates
    sind grün; Hidden-Info-/Replay-/StateHash-Verträge bleiben unverändert.

## 13. Handoff

Primärer Umsetzungsagent: `release-implementation-agent`.

Empfohlene Qualitätsprüfung nach Paket C und vor Paket F:
`test-quality-agent` für Zählmatrix, Idempotenz, Migration, Datenschutz,
Retention und Browser-E2E.

Vor Implementierungsbeginn sind nur noch zwei Produktentscheidungen nötig,
falls vom empfohlenen Default abgewichen werden soll:

1. Soll Self-Play vollständig verborgen statt separat ausgeschlossen gezeigt
   werden?
2. Soll die erste UI bereits eine redigierte Matchhistorie enthalten oder nur
   aggregierte Kennzahlen?

Empfohlener Default: Self-Play separat kennzeichnen und die private,
paginierte Matchhistorie bereits in der ersten Stufe mitliefern.
