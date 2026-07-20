# Öffentliche Spieleübersicht und persönliche Spielhistorie

Status: vorbereitet
Stand: 2026-07-20
Arbeitsbranch: `codex/public-game-directory`
Arbeits-Worktree: `C:\Projekte\NETGRID_PUBLIC_GAME_DIRECTORY`

## Quelle und Vorgabe

Dieser Prozess setzt die im Chat präzisierte Trennung um:

- `Spiele` ist die globale Übersicht aller öffentlichen Matches.
- Die Filter lauten `Alle`, `Offen`, `Laufend` und `Abgeschlossen`.
- Ohne Filter stehen offene vor laufenden und laufende vor abgeschlossenen
  Spielen; innerhalb einer Gruppe gilt die letzte Aktualisierung absteigend.
- Offene Spiele zeigen Ersteller, belegte und freie Seite, Einzelspiel oder
  Matchserie und erlauben den direkten Einstieg in den bestehenden
  Beitrittsablauf.
- Laufende Spiele erlauben den read-only Zuschauerzugriff.
- Abgeschlossene Spiele erlauben das Replay.
- `Meine Spiele` zeigt ausschließlich Partien des angemeldeten Accounts,
  unabhängig davon, ob sie öffentlich oder privat sind.
- Endergebnisse werden beim terminalen Abschluss einmal ermittelt und
  persistiert. Listen hydrieren danach keine vollständigen Event- oder
  Snapshothistorien.

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung präzise genug. Sichtbare
Bereiche, Filter, Sortierung, Aktionen, Besitzgrenze, Persistenzziel und
Performanceerwartung sind bestimmt.

## Gesamtziel

`/Goal` Arbeite den Prozess „Öffentliche Spieleübersicht und persönliche
Spielhistorie“ vollständig und sequenziell von GAME-001 bis GAME-006 ab und
merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die verpflichtenden
Wiki-Einstiegsseiten, die betroffenen Package-`AGENTS.md` und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_PUBLIC_GAME_DIRECTORY` auf Branch
`codex/public-game-directory`. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktiven Paket, führe dessen Checks aus und
committe jedes Paket. Bei einem Sicherheitsblocker dokumentiere Ursache und
Removal Condition. Integriere vor dem finalen Merge ein weitergelaufenes
`main` defensiv. Entferne nach erfolgreichem lokalen Merge Worktree und Branch
verifiziert und markiere das Goal erst danach als abgeschlossen.

## Annahmen

- Dauerhafte persönliche Zugehörigkeit wird ausschließlich aus der
  vorhandenen authentifizierten Account-Teilnehmerbindung abgeleitet.
- Gäste sehen die öffentliche Spieleübersicht und behalten ihren normalen
  aktuellen Sessionzugriff; eine dauerhafte Gastidentität wird nicht
  erfunden.
- Der bestehende manuelle Join-Link-/Match-ID-Pfad bleibt erhalten.
- `Beitreten` aus der Spieleliste wählt das Match aus und öffnet den
  vorhandenen Namens-/Deck-Beitrittsablauf; Deck- und Startregeln werden nicht
  dupliziert.
- Ergebnis-Snapshots sind viewer-neutral. Ein davon abgeleitetes
  Spieler-Endergebnis darf weiterhin den jeweiligen `viewerOutcome`
  ergänzen.
- Historische terminale Matches ohne Ergebnis-Snapshot werden einmalig aus
  ihrer vorhandenen Persistenz nachgezogen und anschließend kompakt gelesen.

## Nicht-Ziele

- Kein zusätzlicher Public-, Spectator- oder Replay-Schalter.
- Keine Volltextsuche, Pagination oder komplexe Lobby-Suchmaschine.
- Kein dauerhaftes Gastkonto und keine neue Identitätsklasse.
- Keine Änderung an Rules Engine, LegalActions, Kartenpool oder KI-Verhalten.
- Kein Replay-Streaming- oder Videoformat.
- Kein Push und keine Pull Request-Erstellung.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Kein Paket wird übersprungen.
3. Jedes Paket endet mit Checks, `git diff --check` und eigenem Commit.
4. `Spiele` enthält ausschließlich `isPublic: true`.
5. `Meine Spiele` enthält ausschließlich serverseitig gebundene eigene
   Matches.
6. Live-Zuschauer erhalten weiterhin keine Hidden Info oder LegalActions.
7. Ergebnis-Snapshots entstehen nur aus autoritativem Serverzustand.
8. Listenpfade laden nach dem Backfill keine Event- oder Snapshothistorien.
9. Fremde Worktrees und Änderungen im Hauptworkspace bleiben unangetastet.

## Automatische Fehlerbehandlung

- Paketnahe rote Tests werden im aktiven Paket eng behoben.
- Ein Paket mit rotem Done-Gate wird nicht committed.
- Ein fehlender historischer Ergebnis-Snapshot wird nachgezogen und nicht
  still aus Listen entfernt.
- Ein nicht authentifizierter persönlicher Listenaufruf liefert keine
  fremden Ergebnisse.
- Konflikte mit weitergelaufenem `main` werden nach beiden Intentionen
  aufgelöst; fachlich widersprüchliche Verträge gelten als Blocker.

## Sicherheitsblocker

- Ein privates Match erscheint in `Spiele`.
- Ein fremdes Match erscheint in `Meine Spiele`.
- Der öffentliche Listenpayload enthält Tokens, private Deckdaten, Hände,
  Choices oder LegalActions.
- Ein Live-Zuschauer erhält verdeckte Kartenidentitäten.
- Ein Client kann einen Ergebnis-Snapshot vorgeben oder verändern.

## State Machine

```text
prepared
  -> GAME-001 active -> committed
  -> GAME-002 active -> committed
  -> GAME-003 active -> committed
  -> GAME-004 active -> committed
  -> GAME-005 active -> committed
  -> GAME-006 active -> committed
  -> final verification
  -> main merge
  -> worktree cleanup
  -> branch cleanup
  -> complete
```

## Paketfolge

| Paket | Titel | Commit-Vorschlag |
| --- | --- | --- |
| GAME-001 | Listen- und Ergebnisverträge | `docs: define game directory and result snapshot contracts` |
| GAME-002 | Persistierte Endergebnisse und Backfill | `feat(server): persist immutable match result snapshots` |
| GAME-003 | Schnelle öffentliche Spieleübersicht | `feat(server): enrich public game directory` |
| GAME-004 | Persönliche Spielhistorie | `feat(account): scope match history to participants` |
| GAME-005 | Spielebereich und direkte Aktionen | `feat(web): add public games workspace` |
| GAME-006 | End-to-End-, Performance- und Abschlussreview | `test(games): verify directory and cached histories` |

## Paketdetails

### GAME-001 – Listen- und Ergebnisverträge

Ziel: Shared-, Server-, Storage- und UI-Verträge sind eindeutig festgelegt.

Arbeit:

- Viewer-neutralen persistierten Ergebnis-Snapshot definieren.
- Öffentlichen Listeneintrag um Seitenbelegung, freie Seite,
  Serieninformation und kompaktes Endergebnis ergänzen.
- Authentifizierten persönlichen Ergebnislistenvertrag definieren.
- Statuspriorität und Filtersemantik als getestete pure Funktionen abbilden.

Checks:

- Shared-Typecheck und Contracttests.
- Serverseitige DTO-/Redaktions-Tests.
- `git diff --check`.

Done-Gate: Kein UI- oder Storagepfad muss die Bedeutung von Offen, Laufend,
Abgeschlossen, öffentlich oder persönlich erraten.

### GAME-002 – Persistierte Endergebnisse und Backfill

Ziel: Ein terminales Match besitzt eine unveränderliche, kompakte
Ergebnisquelle.

Arbeit:

- Ergebnis-Snapshot bei regulärem Ende, Aufgabe und Zeitablauf erzeugen.
- Snapshot in der kompakten Matchpersistenz speichern.
- Ergebnisanzeige aus derselben Quelle ableiten.
- Historische terminale Matches ohne Snapshot einmalig nachziehen.
- Kompakten Storage-Listenpfad ohne Event-/Snapshot-Hydrierung ergänzen.

Checks:

- Terminalpfade, Unveränderlichkeit und Serienfälle.
- SQLite-Neustart und historischer Backfill.
- Test, dass der schnelle Folgeabruf keine Vollhydrierung verwendet.
- `git diff --check`.

Done-Gate: Nach dem einmaligen Backfill wird kein Endergebnis erneut aus der
gesamten Historie berechnet.

### GAME-003 – Schnelle öffentliche Spieleübersicht

Ziel: `/api/public/matches` liefert alle und nur öffentliche Matches mit den
für die globale Liste benötigten Metadaten.

Arbeit:

- Offene Matches mit Ersteller, belegter und freier Seite sowie Format
  ausgeben.
- Laufende Matches mit Teilnehmern, Seiten und Format ausgeben.
- Abgeschlossene Matches mit gespeichertem Ergebnis ausgeben.
- Sortierung Offen, Laufend, Abgeschlossen und danach `updatedAt` absteigend.
- Join-, Spectator- und Replayziele unverändert anbinden.

Checks:

- Öffentliche/private Positiv- und Negativtests.
- Sortierungs- und Metadatentests.
- Hidden-Info-/Token-Negativscan.
- `git diff --check`.

Done-Gate: Ein einziger kompakter Endpoint trägt den globalen Spielebereich.

### GAME-004 – Persönliche Spielhistorie

Ziel: `Meine Spiele` enthält ausschließlich Matches des authentifizierten
Accounts.

Arbeit:

- Bestehende Account-Teilnehmerbindung serverseitig zur Filterung verwenden.
- Öffentliche und private eigene Ergebnisse zulassen.
- Fremde Ergebnisse und anonyme Aufrufe ausschließen.
- Persönliche Liste aus den gespeicherten Ergebnis-Snapshots liefern.
- Bisherigen globalen `recent-results`-Vertrag entfernen oder auf den
  authentifizierten persönlichen Pfad umstellen.

Checks:

- Zwei Accounts, Gast und fremdes Match.
- Private eigene Partie positiv, private fremde Partie negativ.
- Kein Vollstorage-Listenpfad.
- `git diff --check`.

Done-Gate: „Meine Spiele“ ist tatsächlich persönlich und nicht nur anders
beschriftet.

### GAME-005 – Spielebereich und direkte Aktionen

Ziel: Der globale Spielebereich ist dauerhaft sichtbar und vollständig
bedienbar.

Arbeit:

- Hauptbereich `Spiele` im Start- und aktiven App-Shell ergänzen.
- Filter `Alle`, `Offen`, `Laufend`, `Abgeschlossen` bereitstellen.
- Statusgruppen, Metadaten und Leerzustände rendern.
- `Beitreten`, `Zuschauen` und `Replay ansehen` direkt an den Listeneintrag
  setzen.
- Öffentliche Liste aus dem bisherigen Joinformular entfernen; manuelle
  Eingabe behalten.
- `Letzte Spiele` in `Meine Spiele` umbenennen und auf den persönlichen
  Endpoint umstellen; Gäste erhalten einen klaren Account-Hinweis.

Checks:

- Komponenten- und Navigationshilfstests.
- Web-Typecheck und Webtests.
- Tastatur-/ARIA-Smoke der Filter und Aktionen.
- `git diff --check`.

Done-Gate: Öffentliche Discovery und persönliche Historie sind sichtbar und
inhaltlich getrennt.

### GAME-006 – End-to-End-, Performance- und Abschlussreview

Ziel: Der Gesamtflow ist messbar schnell, sicher und dokumentiert.

Arbeit:

- Browser-E2E für Offen -> Beitreten, Laufend -> Zuschauen und Abgeschlossen
  -> Replay.
- Browser-/API-Negativspur für private und fremde Matches.
- Kalt-/Warmmessung des historischen Backfills und des kompakten Folgeabrufs.
- Implementation Review, Final Review, Status, Wissensbasis und Log pflegen.

Checks:

- `corepack pnpm typecheck`.
- `corepack pnpm test:contracts`.
- relevante Server- und Webtests.
- `corepack pnpm build`.
- Browser-E2E.
- `corepack pnpm format:changed` und `git diff --check`.

Done-Gate: Alle drei globalen Aktionen funktionieren, persönliche Ergebnisse
sind accountgebunden und warme Listenabrufe benötigen keine Vollhydrierung.

## Verifikationsregeln

- Paketnahe Tests laufen vor breiten Gates.
- Hidden-Info-Negativtests prüfen serialisierten Payload und sichtbares DOM.
- Performance wird nicht nur über Zeit, sondern strukturell über einen Test
  abgesichert, der den Vollstoragepfad nach vorhandenem Snapshot verbietet.
- Der historische Backfill berichtet Anzahl gescannter und ergänzter Matches.
- Browserprozesse und temporäre Daten werden nach dem E2E entfernt.

## Worktree-, Git- und Integrationsregeln

- Alle Prozessänderungen entstehen im dokumentierten Arbeits-Worktree.
- Jedes Paket besitzt einen eigenen Commit.
- `main` und fremde Worktrees werden bis zum finalen Merge nicht verändert.
- Ein weitergelaufenes `main` wird vor dem Merge defensiv integriert.
- Der lokale Merge erfolgt bevorzugt per Fast-Forward.
- Nach erfolgreichem Merge werden Worktree und vollständig gemergter Branch
  ohne Force entfernt und doppelt verifiziert.

## Controller-Prompt-Kern

Arbeite ohne erneute Scope-Rückfragen sequenziell durch GAME-001 bis GAME-006.
Behalte genau einen Public-Flag und die vorhandene Accountbindung bei. Erzeuge
keine parallele Lobby-, Ergebnis- oder Identitätsarchitektur. Committe jedes
grüne Paket einzeln und schließe erst nach lokalem Main-Merge und verifiziertem
Cleanup ab.

## Abschlusskriterien

- GAME-001 bis GAME-006 besitzen je einen grünen Commit.
- `Spiele` zeigt öffentliche offene, laufende und abgeschlossene Partien mit
  den richtigen Aktionen.
- Filter und Sortierung entsprechen der Vorgabe.
- `Meine Spiele` enthält nur eigene Partien.
- Endergebnisse sind persistiert und warme Listenpfade kompakt.
- Live-Zuschauer und private Matches bleiben geschützt.
- Branch ist lokal nach `main` integriert.
- Worktree und Branch sind verifiziert entfernt.
- Das `/Goal` ist erst danach `complete`.
