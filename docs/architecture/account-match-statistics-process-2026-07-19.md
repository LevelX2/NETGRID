# Account-Matchstatistik – kontrollierter Paketprozess

Status: `AMS-05 completed; AMS-06 pending`

## Quelle und Vorgabe

- Fachplan:
  `docs/releases/v2/account-match-statistics-plan-2026-07-19.md`
- Nutzerauftrag: Plan committen und anschließend vollständig mit
  `paketprozess-worktree-goal` umsetzen.
- Arbeitsbranch: `codex/account-match-statistics`
- Arbeits-Worktree: `C:\Projekte\NETGRID_ACCOUNT_MATCH_STATISTICS`
- Integrationsbranch: lokaler `main`

## Zielprüfung

Die Vorgabe ist ausreichend präzise. Gesamtziel, Reihenfolge, Nicht-Ziele,
Kernartefakte, Datenschutzgrenzen, Paketgates und Abschlussregeln sind aus dem
Fachplan und den Projektanweisungen ableitbar.

## Gesamtziel

Eine private, accountgebundene Matchstatistik implementieren, die
authentifizierte Teilnehmer serverseitig sicher zuordnet, terminale Spiel- und
Serienergebnisse idempotent und retention-unabhängig speichert, private
Statistik-/History-APIs sowie Account-Export und -Löschung unterstützt und im
Webclient verständlich dargestellt wird. Accountdaten bleiben vollständig
außerhalb von Engine, PlayerViews, LegalActions, PublicEvents, Replay,
StateHash und KI-Input.

## Annahmen

- Self-Play bleibt für lokale Zwei-Tab-Tests zulässig, wird separat markiert
  und standardmäßig nicht in Siege, Niederlagen oder Winrate eingerechnet.
- Die erste UI enthält neben Aggregaten eine private paginierte Matchhistorie.
- Historische Matches vor sicherer Accountbindung werden nicht über
  Anzeigenamen zugerechnet.
- Direkte SQL-Aggregationen über das schmale Ledger reichen für die Closed
  Alpha; voraggregierte Accountzähler sind nicht erforderlich.
- Statistikdaten beginnen mit dem Schema-v3-Cutover und weisen diesen
  Zeitpunkt sichtbar aus.

## Nicht-Ziele

- öffentliche Profile, Rankings, Elo, Leaderboards, Seasons oder Turniere;
- Gegnerprofile oder Speicherung fremder Account-IDs in der eigenen Statistik;
- Decklisten-, Karten-, Zug-, Economy- oder KI-Detailanalyse;
- Änderung der Spielregeln, des Replays oder der Rules Engine;
- Remote-Push oder Pull Request.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Kein Folgepaket beginnt vor grünem Done-Gate und Paketcommit.
3. Account-ID stammt ausschließlich aus einer gültigen Account-Session.
4. Account-ID wird nie in `MatchRecord`, Matchsession, GameState, Replay oder
   öffentliche Verträge kopiert.
5. Statistikprojektionen verwenden nur terminale, bereits fachlich
   feststehende Ergebnisfakten.
6. Wiederholung, Reconnect, Neustart und Reconciliation dürfen keine
   Doppelzählung erzeugen.
7. Accountlöschung entfernt persönliche Statistikdaten; Match-Retention nicht.
8. Fremde Änderungen werden weder überschrieben noch pauschal revertiert.
9. Jeder Paketabschluss enthält Checks, `git diff --check`, gezieltes Staging,
   Commit und Aktualisierung dieses Prozessstands.
10. `/Goal` wird erst nach Main-Merge, Main-Prüfung, Worktree- und
    Branch-Cleanup abgeschlossen.

## Automatische Fehlerbehandlung

- Rote Tests werden innerhalb des aktuellen Pakets eng diagnostiziert und
  behoben.
- Ein fehlgeschlagener idempotenter Schreibpfad wird nicht durch einen
  Best-Effort-Callback kaschiert; Transaktion, Outbox oder Reconciliation
  müssen den Ergebnisverlust verhindern.
- Bei parallel weitergelaufenem `main` wird `main` vor dem Finalgate defensiv
  in den Arbeitsbranch integriert und fachlich kompatibel aufgelöst.
- Kleine, eindeutige Lücken werden konservativ nach Fachplan entschieden und
  im Paketabschluss dokumentiert.
- Follow-ups erweitern den laufenden Scope nicht still.

## Sicherheitsblocker

Der Prozess stoppt mit Blocker-Report und Removal Condition, wenn:

- Account- oder Gegneridentität nur durch Aufnahme in Engine-/Replaydaten
  realisierbar wäre;
- eine transaktionale oder reparierbare Ergebnisaufnahme nicht hergestellt
  werden kann;
- Accountlöschung oder private Zugriffstrennung nicht zuverlässig prüfbar ist;
- eine Schemaänderung bestehende Daten ohne sicheren Backup-/Migrationspfad
  gefährdet;
- ein Konflikt auf `main` denselben Statistik- oder Datenschutzvertrag
  unvereinbar anders definiert.

## State Machine

```text
prepared
  -> AMS-00_process
  -> AMS-01_schema_contracts
  -> AMS-02_account_binding
  -> AMS-03_result_ledger
  -> AMS-04_private_api_operations
  -> AMS-05_web_ui
  -> AMS-06_final_review
  -> merge_main
  -> verify_main
  -> remove_worktree
  -> delete_branch
  -> complete
```

Fehlerzustände:

```text
package_failed -> diagnose_current_package -> package_active
safety_blocker -> blocker_report -> blocked
merge_conflict -> understand_both_intentions -> resolve_and_reverify
cleanup_failed -> diagnose_cleanup -> cleanup_pending
```

## Fortschrittsstand

| Paket | Status | Commit |
|---|---|---|
| AMS-00 Prozess und Controller | completed | dieser Paketcommit |
| AMS-01 Verträge und SQLite-Schema v3 | completed | dieser Paketcommit |
| AMS-02 Sichere Account-Matchbindung | completed | dieser Paketcommit |
| AMS-03 Ergebnisledger und Reconciliation | completed | dieser Paketcommit |
| AMS-04 Private API und Betrieb | completed | dieser Paketcommit |
| AMS-05 Account-Statistik-UI | completed | dieser Paketcommit |
| AMS-06 Final Review und Integration | pending | – |

## Paketdetails

### AMS-00 – Prozess und Controller

Ziel: Worktree, Arbeitsbranch, Prozessartefakt, State Machine und verbindlichen
Controllervertrag einrichten.

Eingangsvoraussetzungen:

- Plancommit liegt auf `main`.
- Hauptworkspace ist sauber.
- Zielbranch und Ziel-Worktree sind frei.

Arbeit:

- Worktree und Branch anlegen.
- Prozessartefakt erstellen.
- `/Goal` aktivieren und Paketplan setzen.

Checks:

- Branch, Worktree und sauberer Status;
- `git diff --check`.

Done-Gate: Prozessartefakt committed; Worktree zeigt auf den Arbeitsbranch.

Commit: `docs(accounts): define statistics package process`

### AMS-01 – Shared-Verträge und SQLite-Schema v3

Ziel: fachliche Typen, Zählregeln und persistente Tabellen als belastbare
Grundlage schaffen.

Arbeit:

- Shared-API-Typen für Statistik, Filter, Aggregat und History.
- Schema v3 mit `account_match_participants`, `account_game_results` und
  `account_series_results`.
- Indizes, Constraints, Storage-Typen und Query-Grundlagen.
- Migration von Schema 2, Backup/Restore und leere Statistik testen.

Kernartefakte:

- `packages/shared/src/api-contracts.ts`
- `packages/shared/src/index.ts`
- `apps/server/src/storage-sqlite.ts`
- Storage-/Schema-Tests.

Checks:

- Shared- und Server-Typecheck;
- Shared-Tests;
- fokussierte Storage-/Migrations-/Backup-Tests;
- Package Boundaries.

Done-Gate: Schema 2 migriert sicher auf 3; neue Tabellen sind leer und
konsistent; bestehende Daten bleiben erhalten.

Commit: `feat(accounts): add statistics schema and contracts`

### AMS-02 – Sichere Account-Matchbindung

Ziel: authentifizierte Teilnehmer außerhalb des Matchrecords mit
`player_a`/`player_b` verbinden.

Arbeit:

- Create und Join nur aus gültiger Account-Session binden.
- Gast, Logout, Reconnect, Recreate und Serienfortsetzung abdecken.
- Self-Play zuverlässig erkennen.
- Negative Leak- und manipulierte Requesttests ergänzen.

Kernartefakte:

- Account-/HTTP-Service;
- Multiplayer-Control-Plane;
- SQLite-Binding-Storage;
- Account-HTTP- und Multiplayer-Tests.

Checks:

- Server-Typecheck;
- Account-HTTP- und Multiplayer-Fokustests;
- Payload-/Replay-/StateHash-Leaktests.

Done-Gate: sichere Bindung funktioniert in allen Startpfaden; Account-ID ist
in keinem öffentlichen, Engine-, Replay- oder KI-Payload vorhanden.

Commit: `feat(accounts): bind authenticated match participants`

### AMS-03 – Ergebnisledger und Reconciliation

Ziel: terminale Spiel- und Serienergebnisse je Account genau einmal führen.

Arbeit:

- redigierte Spiel- und Serienprojektoren;
- Zählregeln für regulär, Draw, Forfeit, Time Expired, Abbruch, KI, Gast,
  Account, Self-Play und Serie;
- transaktionale oder persistent reparierbare Aufnahme;
- Reconciliation und Integritätsfehler;
- Retention-Unabhängigkeit.

Checks:

- Projektor-/Ledger-Unit- und Integrationstests;
- Wiederholung, Neustart, Reconnect und Reconciliation;
- Serien-Deduplikation;
- Match-Cleanup bei erhaltenem Ledger.

Done-Gate: jede fachliche Zeile wird genau einmal geschrieben und bleibt nach
Rohmatch-Retention erhalten.

Commit: `feat(accounts): record durable match statistics`

### AMS-04 – Private API und Betrieb

Ziel: eigene Statistik und History sicher abrufen sowie vollständig
exportieren, löschen, sichern und warten.

Arbeit:

- `GET /api/account/statistics`;
- `GET /api/account/match-history` mit Cursor;
- Sessionpflicht, `no-store`, Filter und Rate Limit;
- Export-Schema erweitern;
- Accountlöschung, Backup/Restore, Maintenance und Reconciliation-Bedienpfad.

Checks:

- Auth-/Owner-/Filter-/Pagination-/Rate-Limit-Tests;
- Export-/Delete-/Backup-/Restore-Tests;
- Redaction- und Observability-Tests.

Done-Gate: Accounts lesen nur eigene Daten; Export und Löschung sind
vollständig; Betriebswerkzeuge erkennen und sichern die Tabellen.

Commit: `feat(accounts): expose private statistics api`

### AMS-05 – Account-Statistik-UI

Ziel: Aggregat und private Matchhistorie im Accountbereich verständlich
darstellen.

Arbeit:

- Navigation `Statistik`;
- Kennzahlen, Erfasst-seit-Hinweis und kleine Stichprobe;
- Runner/Korp, Gegnerart, Modus und Zeitraum;
- Serienwerte und cursorbasierte History;
- Forfeit, Abbruch und Self-Play klar kennzeichnen;
- Gast- und Fehlerzustände.

Checks:

- Web-Typecheck und Webtests;
- Komponenten-/Client-API-Tests;
- Browserflüsse Account gegen KI, zwei Accounts, Gast und responsive Layouts.

Done-Gate: Statistik ist ausschließlich angemeldet sichtbar, fachlich korrekt
und in den Ziel-Viewports bedienbar.

Commit: `feat(web): add private account match statistics`

### AMS-06 – Final Review und Integration

Ziel: Dokumentation, Datenschutz- und Gesamtgates abschließen und sauber nach
`main` integrieren.

Arbeit:

- Final Review, Runbook, Wissensindex, Projektstatus und Monatslog;
- vollständige relevante Gates;
- aktuelles `main` integrieren und Konflikte defensiv lösen;
- Arbeitsbranch lokal nach `main` mergen;
- Main prüfen;
- Worktree entfernen und doppelt verifizieren;
- gemergten Arbeitsbranch mit `git branch -d` löschen.

Checks:

- paketnahe Typechecks und Tests;
- `corepack pnpm typecheck`;
- `corepack pnpm test:contracts`;
- `corepack pnpm check:package-boundaries`;
- vollständige Server- und Webtests;
- `corepack pnpm build`;
- Browser-Smokes;
- `git diff --check` und sauberer Status auf Arbeitsbranch und `main`.

Done-Gate: alle Akzeptanzkriterien sind belegt; `main` enthält alle
Paketcommits; Worktree und Arbeitsbranch sind verifiziert entfernt.

Commit: `docs(accounts): complete match statistics review`

## Verifikationsregeln

- Tests mit Timeout, Abbruch oder übersprungenem sicherheitsrelevantem Fall
  gelten nicht als bestanden.
- Paketnahe Tests laufen vor breiten Gates.
- Schema-, Idempotenz-, Owner- und Leaktests sind harte Gates.
- Nicht ausgeführte optionale Checks werden mit Grund dokumentiert.
- Nach Konfliktlösung laufen die betroffenen Paketchecks erneut.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_ACCOUNT_MATCH_STATISTICS`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen Merge und Main-Prüfung.
- Paketdateien gezielt stagen; keine fremden Änderungen übernehmen.
- Kein `reset --hard`, kein pauschaler Revert, kein erzwungener Cleanup.
- Vor Finalmerge aktuelles `main` in den Arbeitsbranch integrieren, wenn es
  weitergelaufen ist.
- Bevorzugt Fast-Forward nach `main`; Merge-Commit nur begründet.
- Worktree erst nach erfolgreichem Main-Merge und sauberem Status entfernen.
- Entfernung über `git worktree list --porcelain` und `Test-Path` verifizieren.
- Arbeitsbranch erst danach mit `git branch -d` löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite Account-Matchstatistik vollständig und sequenziell von AMS-00
bis AMS-06 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die paketbezogenen AGENTS.md,
docs/releases/v2/account-match-statistics-plan-2026-07-19.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_ACCOUNT_MATCH_STATISTICS auf Branch
codex/account-match-statistics. Nutze den Hauptworkspace nur für den finalen
Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung erlaubt ist. Arbeite immer nur am aktuellen Paket, führe dessen
Checks aus, dokumentiere Abweichungen, führe git diff --check aus und committe
das abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report und
Removal Condition. Nach AMS-06 final verifizieren, lokal nach main mergen,
main prüfen, den sauberen Worktree verifiziert entfernen und anschließend den
gemergten Arbeitsbranch löschen. Markiere das Goal erst dann als complete.
```

## Abschlusskriterien

- alle AMS-Pakete mit grünem Done-Gate und eigenem Commit;
- alle fachlichen Akzeptanzkriterien des Quellplans belegt;
- keine Account-/Hidden-Info-Leaks;
- vollständige private API, Export-/Lösch- und UI-Funktion;
- dokumentierter Final Review und Betriebsvertrag;
- lokaler Merge nach `main` erfolgreich;
- `main` sauber und geprüft;
- Worktree in Git und Dateisystem entfernt;
- Arbeitsbranch regulär gelöscht;
- `/Goal` als complete markiert.

## Paketabschlussprotokoll

### AMS-01

- Shared-Verträge für Aggregat, Serienstatistik und Matchhistorie ergänzt.
- SQLite-Schema 3 führt sichere Bindungs-, Spiel- und Serienledgertabellen ein.
- Schema-1- und Schema-2-Migration erzeugen Pre-Migration-Backup; historische
  Matches bleiben ohne automatische Zuordnung.
- Grün: Shared-Tests (12), Server-Typecheck, fokussierte Storage-/Accounttests
  (9) und Package Boundaries.
- Nicht ausgeführt: breite Server-/Webgates; sie sind für die späteren
  Integrationspakete und AMS-06 vorgesehen.

### AMS-02

- Authentifizierte Create-/Join-Flows binden ausschließlich die serverseitig
  authentifizierte Account-ID an `player_a` beziehungsweise `player_b`.
- Recreate und Serienfortsetzung erben Bindungen kontrolliert auf die neue
  Match-ID; Gast und KI-Beobachter erzeugen keine Accountbindung.
- Die Bindung bleibt außerhalb von Matchrecord, Engine und Replay. Weil
  `NETGRID_ACCOUNT_SQLITE_PATH` Match- und Accountstorage trennen darf, besitzt
  die Account-Bindung bewusst keinen datenbankübergreifend unmöglichen
  Foreign Key auf `matches`; Accountlöschung bleibt per Foreign Key kaskadiert.
- Grün: Server-Typecheck, sechs fokussierte Account-/HTTP-/Schema-Tests und
  Package Boundaries.
- Nicht ausgeführt: vollständiger Multiplayerlauf und breite Webgates; sie
  folgen mit Ledgerintegration beziehungsweise im Finalgate.

### AMS-03

- Jede Matchpersistenz benachrichtigt den accountseitigen Statistikprojektor;
  bestehende Storage- und Matchverträge bleiben unverändert.
- Spiel- und Serienledger erfassen nur terminale Ergebnisfakten und behandeln
  regulär, Draw, Forfeit, Time Expired, Abbruch, KI, Gast, Account und
  Self-Play getrennt.
- Deterministische IDs, Unique Constraints und Inhaltsvergleich verhindern
  Doppelzählung beziehungsweise stilles Überschreiben widersprüchlicher
  Ergebnisse.
- `reconcilePersistedMatches` repariert verpasste Projektionen aus dauerhaft
  gespeicherten Matches; Ledgerzeilen bleiben nach Rohmatch-Löschung erhalten.
- Grün: Server-Typecheck, fokussierte Ledger-/Schema-Tests, Account-HTTP-Tests
  und der vollständige Multiplayerlauf mit 125 Tests.
- Nicht ausgeführt: Webgates und vollständige Account-API-Tests; sie folgen in
  AMS-04 und AMS-05.

### AMS-04

- Authentifizierte Endpunkte liefern private Aggregate und cursorpaginierte
  Matchhistorie mit Zeitraum-, Seiten-, Gegnerart- und Modusfiltern.
- Eigener Read-Rate-Limit-Bucket und `Cache-Control: no-store` schützen die
  Kontoantworten; es existiert kein fremder Account-ID-Lookup.
- Account-Export v2 enthält redigierte Statistikdaten. Accountlöschung entfernt
  Bindungen, Spiel- und Serienledger auch bei getrenntem Accountstorage.
- Der reguläre Serverstart reconciliert persistierte Matches vor dem Listen;
  Maintenance zeigt nur redigierte Tabellenanzahlen und Größen.
- Grün: Server-Typecheck und 136 Tests aus Accountstatistik, HTTP, Sessions und
  vollständigem Multiplayerlauf.
- Nicht ausgeführt: Webclient- und Browsergates; sie sind Gegenstand von AMS-05.

### AMS-05

- Die eingeloggte Accountansicht zeigt private Gesamtwerte, Siegquote,
  Runner-/Korp-Aufteilung, Serienstand und eine redigierte Matchhistorie.
- Zeitraum, Seite, Gegnerart und Matchmodus sind clientseitig bedienbare
  Serverfilter; weitere Historieneinträge werden cursorpaginiert geladen.
- Gastansichten erhalten die Komponente nicht. Fehler-, Lade- und Leerzustände
  bleiben explizit und verraten keine fremden Account- oder Deckdaten.
- Grün: Web-Typecheck, vollständiger Webtestlauf mit 643 Tests und Browser-Gate
  über den regulären Startpfad. Geprüft wurden Accountaktivierung, same-site
  Login, private Leerstatistik, Filterinteraktion, fehlende Browserfehler und
  die einspaltige 560-Pixel-Ansicht ohne horizontalen Überlauf.
- Der temporäre Browser-Testaccount wurde anschließend über den regulären
  Accountlösch-Endpunkt vollständig entfernt.
