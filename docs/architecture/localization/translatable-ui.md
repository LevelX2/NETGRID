# Übersetzbare NETGRID-Oberfläche

Status: Umsetzung abgeschlossen; Spieler- und Maintenance-Oberfläche lokalisiert
Stand: 2026-08-21
Quelle: Nutzerauftrag zur deutsch/englisch übersetzbaren Oberfläche und zur
vorbereitenden Entkopplung von Fachsemantik und sichtbarer Sprache

## Zielprüfung

Die Vorgabe ist für die automatische Abarbeitung ausreichend präzise.

- Endzustand: Die normale Spieleroberfläche ist zwischen Deutsch, Englisch und Französisch
  umschaltbar. Die Locale beeinflusst ausschließlich Darstellung und
  Formatierung.
- Reihenfolge: Grundlage, Entkopplung, Flächenmigration,
  Präsentationsverträge, Chronik/Replay/Fehler, englische Vervollständigung.
- Abnahme: paketnahe Tests, Typechecks, Vollständigkeitsgate und fokussierte
  Firefox-orientierte Browserprüfung.
- Arbeitsmodell: eigener Worktree, Commit je Paket, finaler lokaler Merge nach
  `main`, danach verifizierter Worktree- und Branch-Cleanup.

## Gesamtziel

NETGRID besitzt eine typisierte I18N-Schicht für die Spieler- und die über den
Browser erreichbare Maintenance-Oberfläche.
Deutsch bleibt Standardsprache; Englisch und Französisch werden als weitere
vollständige Locales bereitgestellt. Derselbe Match darf auf verschiedenen Clients in
unterschiedlichen Sprachen dargestellt werden, ohne GameState, Legalität,
Action-Identität, Replay oder StateHash zu verändern.

## Technikentscheidung

- Die React-/ICU-Laufzeitschicht ist `use-intl`. NETGRID lädt den ausgewählten
  Message-Katalog im Next-Root-Layout und reicht nur diesen Katalog an einen
  schlanken Client-Provider weiter.
- Das größere `next-intl`-Paket wird nicht benötigt, weil dieser Prozess weder
  Locale-Routing noch dessen SWC-Extractor verwendet. Dadurch bleiben
  Installations-, Build- und Laufzeitumfang auf die tatsächlich verwendete
  Messageformatierung begrenzt.
- Die Locale liegt im Cookie `netgrid.locale`, damit Server-HTML, `html lang`
  und Clientdarstellung dieselbe Auswahl verwenden. Ungültige Werte werden
  geschlossen auf `de` normalisiert.
- Typen werden aus dem deutschen Referenzkatalog abgeleitet. Alle freigegebenen
  Locales müssen dieselbe Leaf-Key-Struktur besitzen; das finale Gate prüft
  zusätzlich ICU-Parameter und unklassifizierte sichtbare Literale.

## Annahmen

- Die Sprachauswahl ist ein Dropdown mit Locale-Fahne, gilt pro Browser und wird ohne URL-Präfix persistent
  gespeichert. Eine ausdrückliche Auswahl gewinnt gegenüber der Browsersprache.
- Der nicht angemeldete und der angemeldete Browser verwenden zunächst dieselbe
  lokale Präferenz; accountübergreifende Synchronisation ist kein Muss-Gate.
- Der ursprüngliche Prozess gab `de` und `en` frei; die anschließende
  Französisch-Erweiterung ergänzt `fr` nach demselben Vertrag.
- Kartenbild-Skin und Oberflächensprache bleiben getrennte Einstellungen.
- Technische Eigennamen wie Runner, Corp/Korp, ICE, HQ, R&D und Archives werden
  über ein zentrales Glossar je Locale konsistent ausgegeben.

## Nicht-Ziele

- keine Übersetzung gedruckter Kartentitel, Regeltexte, Flavor-Texte oder
  Kartenbilder;
- keine Übersetzung technischer IDs, Diagnose-Rohdaten und der privilegierten
  KI-Debug-Rohansichten; die Bedien- und Navigationsflächen der Maintenance-UI
  sind dagegen vollständig im Scope;
- keine locale-präfixierten URLs, Domain-Locale-Routen oder SEO-Arbeit;
- keine Änderung von Engine-Regeln, KI-Verhalten oder Kartenmechanik;
- keine Legacy- oder Dual-Read-Verträge als Abschlusszustand.

## Controller-Invarianten

- Die Engine bleibt reine, deterministische Regelautorität und kennt keine
  aktive Nutzer-Locale.
- Locale, Übersetzungsschlüssel und gerenderte Sätze verändern weder
  `PlayerAction`, `actionId`, StateVersion, StateHash noch RNG/Replay.
- Präsentationsparameter stammen nur aus side-sicheren PlayerViews,
  LegalActions, ChoiceRequests, PublicEvents oder lokaler Client-State-Semantik.
- Verdeckte Identitäten dürfen weder in Übersetzungsschlüssel noch in
  Interpolationswerte, Diagnosemeldungen oder fehlende-Key-Ausgaben gelangen.
- Fachlogik parst keine sichtbaren lokalisierten Texte.
- Der Browser lokalisiert normale Nutzerfehler aus stabilen Codes und
  strukturierten, side-sicheren Parametern. Rohe Servermeldungen sind keine
  normale Präsentationsquelle.
- Fehlende Keys oder nicht übereinstimmende Parameter sind Gate-Fehler. Es gibt
  keinen stillen deutschen Produktionsfallback.
- Genau ein Paket ist aktiv; kein Folgepaket erweitert still seinen Scope.

## Automatische Fehlerbehandlung

- Ein fokussierter roter Test wird im aktiven Paket ursachenbezogen behoben.
- Unabhängige bekannte Baselinefehler werden separat dokumentiert und nicht
  nebenbei repariert.
- Kleine Lücken werden konservativ innerhalb der Invarianten entschieden.
- Ein Finding außerhalb des Paketumfangs wird als Follow-up notiert.
- Ein temporärer Dualvertrag ist nur für einen technisch notwendigen
  paketübergreifenden Cutover zulässig, wird ausdrücklich markiert und besitzt
  als Removal Condition den Abschluss des unmittelbar folgenden Cutover-Pakets.

## Sicherheitsblocker

Automatische Abarbeitung stoppt, wenn:

- eine Übersetzung verdeckte Daten benötigen oder sichtbar machen würde;
- eine Präsentationsmigration Action-Identität, Legalität, StateHash oder
  Replaydeterminismus verändern müsste;
- ein Shared-Vertrag zwei inkompatible aktuelle Autoritäten erzeugen würde;
- ein Konflikt mit neuem `main` denselben Vertrag fachlich anders definiert;
- Worktree-, Branch-, Port- oder Datenbankisolation nicht sicher nachweisbar ist.

Der Blockerbericht benennt verantwortlichen Pfad, konkrete Ursache und die
Removal Condition. Es wird kein Fallback implementiert.

## State Machine

```text
prepared
  -> package_active
  -> package_verified
  -> package_committed
  -> next_package | final_verification
  -> main_synchronized
  -> merged_to_main
  -> worktree_removed
  -> branch_removed
  -> complete
```

Bei einem Sicherheitsblocker wechselt der Prozess aus dem aktuellen Zustand in
`blocked_reported`; er überspringt kein Paket und markiert das Gesamtziel nicht
als abgeschlossen.

## Paketfolge

| ID      | Titel                                | Primärer Schnitt                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------------- |
| I18N-00 | Prozess und Architekturvertrag       | dieses Dokument, Architekturindex                                 |
| I18N-01 | I18N-Grundlage und Locale-Persistenz | Web-Konfiguration, Provider, Locale-State, deutsche Nachrichten   |
| I18N-02 | Semantische Formatierung             | Glossar, Datum/Zahl/Liste/Sortierung, sprachabhängige Stringlogik |
| I18N-03 | App-Rahmen und Account               | Layout, Optionen, App-Shell, normale Accountflächen               |
| I18N-04 | Matchstart und Deckflächen           | Start/Lobby, Decks, öffentliche und letzte Spiele                 |
| I18N-05 | Board, Actions und Choices           | normale Matchsteuerung und side-sichere Auswahlflächen            |
| I18N-06 | Präsentations- und Fehlerverträge    | Shared, Engine, Server und Web-Client                             |
| I18N-07 | Chronik, Replay und Nutzerfehler     | semantische Narration und reproduzierbare Darstellung             |
| I18N-08 | Englisch und Vollständigkeitsgate    | vollständige `en`-Nachrichten, Struktur- und Browser-QA           |

## Paketdetails

### I18N-00 – Prozess und Architekturvertrag

- Ziel: Zielbild, Grenzen, Ablauf und Abnahme verbindlich machen.
- Eingang: sauberer Hauptworkspace; freier Zielbranch und Zielpfad.
- Arbeit: dieses Artefakt und Architekturindex anlegen.
- Kernartefakte: `docs/architecture/localization/translatable-ui.md`,
  `docs/architecture/README.md`.
- Checks: Markdown-/Referenzprüfung, `git diff --check`.
- Done-Gate: Prozess ist vollständig, Worktree/Branch sind dokumentiert.
- Commit: `docs: define translatable UI package process`

### I18N-01 – I18N-Grundlage und Locale-Persistenz

- Ziel: typisierte `de | en`-Infrastruktur mit zunächst vollständigem deutschen
  Basiskatalog und persistenter Sprachwahl.
- Eingang: I18N-00 committed.
- Arbeit: I18N-Bibliothek integrieren, Locale-/Message-Verträge, Provider,
  Cookie/Client-Persistenz, dynamisches `html lang`, Sprachwahl in Optionen.
- Kernartefakte: `apps/web/package.json`, Web-I18N-Module, Message-Dateien,
  Layout/Optionen, Lockfile.
- Checks: fokussierte I18N-/Settings-Tests, Web-Typecheck.
- Done-Gate: Standardsprache Deutsch, Wechsel/Persistenz testbar, keine zweite
  Locale vollständig erforderlich.
- Commit: `feat(web): add typed locale foundation`

### I18N-02 – Semantische Formatierung

- Ziel: feste deutsche Formatierer und fachliche Textauswertung entfernen.
- Eingang: I18N-01 committed.
- Arbeit: zentrale Locale-Formatter und Glossar; `de-DE`-Aufrufe in normalen
  Spielerflächen migrieren; sichtbare Wörter nicht länger als Fachsignale
  auswerten.
- Kernartefakte: Web-I18N-/Formattermodule, Ergebnis-/Chronik-Hilfsmodelle,
  betroffene Tests.
- Checks: Formatter-, Ergebnis- und fokussierte Chroniktests, Web-Typecheck.
- Done-Gate: keine normale Fachentscheidung hängt an deutscher Schreibweise.
- Commit: `refactor(web): decouple locale from presentation semantics`

### I18N-03 – App-Rahmen und Account

- Ziel: App-Shell, Navigation, Optionen und normale Accountansichten ausschließlich
  aus Messages rendern.
- Eingang: I18N-02 committed.
- Arbeit: Texte einschließlich ARIA, Titel, Hilfen und normale Fehler migrieren.
- Kernartefakte: `features/app-shell`, `features/settings`, `features/account`.
- Checks: fokussierte Komponenten-/Clienttests, Web-Typecheck.
- Done-Gate: im Paket-Scope existieren keine unklassifizierten sichtbaren
  deutschen Literale.
- Commit: `feat(web): localize app shell and account surfaces`

### I18N-04 – Matchstart und Deckflächen

- Ziel: Start-, Lobby-, Deck-, öffentliche und letzte Spiele übersetzbar machen.
- Eingang: I18N-03 committed.
- Arbeit: vollständige sichtbare Texte, Pluralformen, Daten und Sortierung
  migrieren; technische IDs bleiben unverändert.
- Kernartefakte: `features/match-start`, `features/decks`, `features/games`,
  `features/recent` und zugehörige App-Modelle.
- Checks: fokussierte Matchstart-/Deck-/Games-Tests, Web-Typecheck.
- Done-Gate: alle normalen Vor-/Nach-Match-Flächen beziehen Texte aus I18N.
- Commit: `feat(web): localize match start and deck surfaces`

### I18N-05 – Board, Actions und Choices

- Ziel: aktive Matchoberfläche und Auswahlinteraktionen übersetzbar machen.
- Eingang: I18N-04 committed.
- Arbeit: Boardzonen, Ressourcen, ActionPanels, ChoicePanels, Overlays,
  Ergebnisflächen und ARIA-Texte migrieren.
- Kernartefakte: `features/game-board`, `features/actions`, `features/results`,
  normale Teile von `app/page.tsx`.
- Checks: fokussierte Board-/Action-/Choice-Tests, Web-Typecheck.
- Done-Gate: normale aktive Matchsteuerung besitzt keine eigene
  deutschsprachige Textautorität.
- Commit: `feat(web): localize board actions and choices`

### I18N-06 – Präsentations- und Fehlerverträge

- Ziel: Engine und Server liefern Semantik statt lokalisierter Nutzertexte.
- Eingang: I18N-05 committed; Shared-/Engine-/Server-Anweisungen gelesen.
- Arbeit: explizite diskriminierte Präsentationsdeskriptoren und Fehlercodes;
  side-sichere Parameter; Web-Renderer; alte Textautorität im migrierten
  Vertrag entfernen.
- Kernartefakte: `@netgrid/shared`, betroffene Engine-Action-/Choice-/Eventpfade,
  Serverpayloads, Web-Client.
- Checks: Shared-/Engine-/Server-/Web-Typechecks, fokussierte Payload-,
  Hidden-Info-, Action- und Error-Tests.
- Done-Gate: Locale bleibt außerhalb Engine/Server; zwei Clients können dieselbe
  Semantik unabhängig rendern.
- Commit: `refactor: make presentation contracts locale neutral`

### I18N-07 – Chronik, Replay und Nutzerfehler

- Ziel: normale historische Darstellung aus semantischen Daten lokalisieren.
- Eingang: I18N-06 committed.
- Arbeit: Chroniknarration, Replaytexte und normale Nutzerfehler migrieren;
  vorhandene side-sichere Eventdaten nutzen; keine Satzfragmente speichern.
- Kernartefakte: `app/chronicle.ts`, `features/chronicle`, `features/replay`,
  normale Web-Fehlerdarstellung.
- Checks: fokussierte Chronik-/Replay-/Fehlertests, Determinismus- und
  Hidden-Info-Nachweise der betroffenen Pfade, Web-/Engine-Typecheck.
- Done-Gate: derselbe Replay/Eventstrom rendert in beiden Locales ohne
  fachlichen Unterschied.
- Commit: `feat(web): localize chronicle replay and user errors`

### I18N-08 – Englisch und Vollständigkeitsgate

- Ziel: zweite Locale vervollständigen und unübersetzte normale UI verhindern.
- Eingang: I18N-07 committed.
- Arbeit: englische Nachrichten, Key-/Parameterparität, Quellguard für
  unklassifizierte sichtbare Literale, fokussiertes Layout-QA in Firefox.
- Kernartefakte: englische Messages, Prüfscripts, Tests, Root-Scripts und
  dauerhafte Architektur-/Statusdokumentation.
- Checks: Message-Gate, Webtests/-typecheck/-build, relevante Shared-/Engine-/
  Serverchecks, `git diff --check`; Browserprüfung nur auf isolierten freien
  Ports und ohne Hauptdatenbank.
- Done-Gate: normale Spieleroberfläche vollständig de/en; bekannte Ausnahmen
  explizit und maschinenprüfbar.
- Commit: `feat(web): complete English locale and i18n gates`

## Verifikationsregeln

- Während eines Pakets läuft zuerst der engste betroffene Test.
- Typoberflächenänderungen erhalten die Typechecks aller betroffenen Pakete.
- Engine-/Event-/Replayänderungen erhalten fokussierte Determinismus- und
  Hidden-Info-Nachweise.
- Nach jedem Paket läuft `git diff --check` vor dem Commit.
- Der finale Integrationscheckpoint umfasst mindestens:
  - `corepack pnpm --filter @netgrid/shared typecheck`
  - `corepack pnpm --filter @netgrid/engine typecheck`
  - `corepack pnpm --filter @netgrid/server typecheck`
  - `corepack pnpm --filter @netgrid/web test`
  - `corepack pnpm --filter @netgrid/web typecheck`
  - `corepack pnpm --filter @netgrid/web build`
  - die in I18N-06/I18N-07 betroffenen fokussierten Engine-/Servertests.
- Keine Server- oder Browserinstanz wird auf den für `main` reservierten Ports
  3100/8787 gestartet. Browser-QA verwendet freie Ports und isolierte Daten.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_I18N_TRANSLATABLE_UI`
- Arbeitsbranch: `codex/i18n-translatable-ui`
- Integrationsbranch: lokaler `main`
- Der Hauptworkspace wird bis zum finalen Merge nicht für Prozessänderungen
  verwendet.
- Jedes Paket wird separat verifiziert und committed.
- Vor dem finalen Merge wird ein weitergelaufenes `main` defensiv in den
  Arbeitsbranch integriert und der relevante Verify-Lauf wiederholt.
- Merge nach `main` bevorzugt Fast-Forward; kein Push und keine PR ohne eigenen
  Nutzerauftrag.
- Nach erfolgreichem Merge wird ausschließlich der oben genannte, erneut
  aufgelöste und saubere Worktree entfernt. Anschließend werden Git-Registrierung
  und Dateisystem geprüft und der vollständig gemergte Branch mit `git branch -d`
  gelöscht.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess „Übersetzbare NETGRID-Oberfläche“ vollständig und
sequenziell von I18N-00 bis I18N-08 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die paketlokalen AGENTS.md und
docs/architecture/localization/translatable-ui.md. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_I18N_TRANSLATABLE_UI auf Branch
codex/i18n-translatable-ui. Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische
Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Aktualisiere den
Prozessstand, führe Paketchecks und git diff --check aus und committe jedes
abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe ohne Fallback und
schreibe einen Blockerbericht mit Removal Condition. Nach Abschluss integriere
aktuelles main, verifiziere final, merge lokal nach main, prüfe main, entferne
den sauberen Arbeits-Worktree, verifiziere seine Entfernung in Git und im
Dateisystem, lösche den gemergten Arbeitsbranch und markiere das Goal erst dann
als complete.
```

## Abschlusskriterien

- I18N-00 bis I18N-08 sind in Reihenfolge abgeschlossen und jeweils committed.
- Deutsch, Englisch und Französisch sind für die normale Spieleroberfläche vollständig.
- Die Sprache ist einstellbar und persistent; `html lang` und Locale-Formatter
  folgen der Auswahl.
- Engine, Server, Replay, StateHash und Legalität bleiben locale-neutral.
- Karteninhalte, Kartenbilder und privilegierte KI-Debug-Rohdaten sind als
  bewusste Nicht-Ziele getrennt. Maintenance-Navigation, Anmeldung,
  Storage-Wartung, Kartenbildverwaltung und KI-Trace-Bedienung sind lokalisiert.
- Finale Checks sind grün oder unabhängige Baselineabweichungen sind eindeutig
  belegt.
- Arbeitsbranch ist lokal in `main` integriert.
- Arbeits-Worktree und gemergter Arbeitsbranch sind entfernt und die Entfernung
  ist doppelt verifiziert.

## Fortschritt

- [x] I18N-00 – Prozess und Architekturvertrag
- [x] I18N-01 – I18N-Grundlage und Locale-Persistenz
- [x] I18N-02 – Semantische Formatierung
- [x] I18N-03 – App-Rahmen und Account
- [x] I18N-04 – Matchstart und Deckflächen
- [x] I18N-05 – Board, Actions und Choices
- [x] I18N-06 – Präsentations- und Fehlerverträge
- [x] I18N-07 – Chronik, Replay und Nutzerfehler
- [x] I18N-08 – Englisch und Vollständigkeitsgate

### Paketnachweise

- I18N-01: `use-intl` 4.13.7, dynamisches `html lang`, Cookie-Persistenz,
  Locale-Auswahl in den Optionen sowie typisierte `de`-/`en`-Basiskataloge
  integriert. Fokustest `i18n/locale.test.ts`: 3/3 grün.
- Der Web-Typecheck erreicht ausschließlich dieselben acht unabhängigen
  Baselinefehler wie `main` (fehlende aktuelle AI-Debug-Fixture-Felder und
  bestehende optionale AI-Payload-Narrowings); es existiert kein zusätzlicher
  I18N-Typefehler. Der identische Fehlerstand wurde im primären `main`-Checkout
  mit demselben Befehl reproduziert.
- I18N-02: Zentrale Locale-Formatter für Datum, Sortierung und sprachabhängige
  Kleinschreibung eingeführt und normale Account-, Lobby-, Spiele- und
  Katalogflächen darauf umgestellt. Ergebnisüberschriften erkennen die direkte
  Ansprache nun semantisch statt über das Wort `du`; die Chronik erkennt
  Programmsuchen ausschließlich über `searchFilter: "program"` statt über
  deutsche Anzeigetexte. Die fokussierten Formatter-, Ergebnis-, Matchstart-,
  Katalog- und Public-Games-Tests sind mit 60/60 grün. Die 15 weiterhin roten
  Chroniktests sind unverändert auf `main` reproduzierbar und betreffen die
  unabhängige CardSpec-/Titeldaten-Baseline; der Web-Typecheck bleibt bei den
  bereits für I18N-01 dokumentierten acht unabhängigen AI-Baselinefehlern.
- I18N-03: App-Navigation, aktive Match-Topbar, Optionen- und
  Bestätigungsdialog, Zurücknahmefläche, sämtliche normalen Optionen sowie
  Account-, Sicherheits-, Deckbibliotheks- und Statistikflächen an typisierte
  `use-intl`-Messages gebunden. Deutsche und englische Texte umfassen auch
  ARIA-Labels, Tooltips, Hilfen, Pluralformen und lokale Fehler. Der sichtbare
  Build-Zeitpunkt wird locale-abhängig aus dem semantischen ISO-Wert formatiert.
  Acht fokussierte Dateien mit 22 Tests sind grün; die Katalogstruktur bleibt
  deckungsgleich. Der Web-Typecheck enthält keine neuen Fehler und erreicht nur
  die acht dokumentierten, auf `main` reproduzierten AI-Baselinefehler.
- I18N-04: Öffentliche und letzte Spiele, Matchstart, Wiederaufnahme, Host-,
  Beitritts- und Lobbyflächen, erweiterte Startoptionen, Kartenkatalog sowie die
  normalen Deckauswahl-, Deckbau-, Tisch- und Anleitungskomponenten verwenden
  typisierte deutsche und englische Messages. Status, Seiten, Matchformate,
  Pluralformen, Datumswerte, ARIA-Texte und Tooltips werden semantisch
  übersetzt; technische IDs bleiben unverändert. Privilegierte KI-Deckprofile
  und Legacy-/Maintenance-Panels bleiben gemäß Scope ausgeschlossen. Die 17
  fokussierten Dateien mit 87 Tests sind grün; der Web-Typecheck enthält keine
  neuen Fehler und erreicht nur die acht dokumentierten AI-Baselinefehler.
- I18N-05: Aktives Board, Runner- und Korp-Zonen, Ressourcen- und Uhrenleisten,
  Run-Timeline, Action- und Choice-Fenster, Access-/Damage-Overlays sowie die
  statischen Teile des Spielergebnisdialogs verwenden typisierte `Board`-,
  `Actions`- und `Results`-Messages. Dynamische ARIA-Texte, Pluralformen,
  Auswahlfragen und Board-Hilfen sind deutsch und englisch hinterlegt. Die 17
  fokussierten Dateien mit 123 Tests sind grün. Der Web-Typecheck bleibt bei den
  acht dokumentierten AI-Baselinefehlern. Ein ebenfalls roter, unabhängiger
  Action-Label-Test (`Trace 5` erwartet, aktuelle CardSpec liefert `Trace 3`)
  wurde mit demselben Einzeltest auf unverändertem `main` reproduziert.
- I18N-06: `@netgrid/shared` veröffentlicht einen geschlossenen, typisierten
  Katalog normaler Nutzerfehler sowie einen semantischen Lobby-Deskriptor. Der
  WebSocket-Transport entfernt serverseitige Diagnoseprosa und überträgt nur
  Code, side-sichere Zustandsdaten und gegebenenfalls einen privilegierten
  Diagnosecode; unbekannte interne Codes werden fail-closed als
  `server_operation_failed` projiziert. Der Webclient besitzt die vollständige
  Code-zu-Message-Abbildung und rendert denselben Fehler unabhängig in Deutsch
  oder Englisch. Auch das Warten auf die Deckauswahl wird erst im Client
  formuliert. Shared-, Web-, Engine-Action-, Server-Payload-, Hidden-Info- und
  WebSocket-Fokustests sind mit 26/26 grün. Shared-Typecheck ist grün; Engine-,
  Server- und Web-Typechecks enthalten ausschließlich die auf unverändertem
  `main` reproduzierten Engine-/AI-Baselinefehler und keinen neuen
  Lokalisierungsfehler.
- I18N-07: Chronik und Replay formulieren sichtbare Ereignisse, Effekte,
  Gruppen, Kartenhinweise und Bedienelemente aus side-sicherer Semantik mit
  `Chronicle`-/`Replay`-Messages. Serverseitig gespeicherte Replay-Labels und
  Lernhinweise werden nicht als Textautorität angezeigt. Derselbe Eventstrom
  rendert nachweislich in Deutsch und Englisch; verdeckte Quellen bleiben in
  beiden Locales redigiert. Ergebnisdialog und normale Match-Lifecycle-Fehler
  sind ebenfalls lokalisiert; HTTP- und WebSocket-Grenzen geben dafür nur
  stabile Fehlercodes und side-sichere Parameter aus. Acht Web-Testdateien mit
  30 Tests, zwei Engine-Dateien mit 12 Replay-/Hidden-Info-Tests und der
  fokussierte Server-Payload-Test sind grün. Shared-Typecheck ist grün;
  Engine-, Server- und Web-Typechecks erreichen ausschließlich die bereits auf
  `main` reproduzierten Engine-/AI-Baselinefehler.
- I18N-08: Der englische Katalog ist für die normale Spieleroberfläche
  vervollständigt. `corepack pnpm check:i18n` prüft dauerhaft 1.740
  deckungsgleiche Message-Leaves, ICU-Parameterparität, 60 klassifizierte
  Spielerflächen, semantische Statusmeldungen und die Trennung von gespeicherter
  Replay-Prosa. Bewusste Nicht-Ziele sind im maschinenlesbaren
  `i18n-exceptions.json` dokumentiert. Elf fokussierte Web-Testdateien mit 36
  Tests sowie Shared-Typecheck, Server-Payload-Test und 12 Engine-Replay-/
  Hidden-Info-Tests sind grün. Die Firefox-Prüfung auf isoliertem Port 3117
  bestätigte Deutsch, den vollständigen Wechsel auf Englisch, dynamisches
  `html lang` und Cookie-Persistenz über einen Reload; dabei gefundene
  deutschbleibende Startnavigation und Defaultnamen wurden behoben. Der breite
  Weblauf erreichte 807/837 Tests; seine CardSpec-/AI-/Source-String-Abweichungen
  entsprechen der dokumentierten `main`-Baseline. Der Produktionscode
  kompiliert; Build und Web-Typecheck stoppen anschließend ausschließlich an
  den bekannten AI-Typfehlern aus `packages/ai` beziehungsweise der
  AI-Debug-Fixture.

### Französisch-Erweiterung

- `fr` ist als dritte vollständige Locale mit `fr-FR`-Formatierung in die
  bestehende Laufzeitumschaltung und Cookie-Persistenz aufgenommen.
- Der französische Katalog enthält dieselben 1.742 Message-Leaves wie Deutsch
  und Englisch, einschließlich Nutzerfehlern, Chronik, Replay, ARIA-Texten und
  ICU-Pluralformen. Das Vollständigkeitsgate prüft Schlüssel- und
  Parameterparität nun über alle freigegebenen Locales.
- Backend, Engine und gemeinsame Verträge bleiben sprachneutral: Sie liefern
  stabile Fehlercodes und strukturierte Semantik; ausschließlich der Client
  formuliert daraus den Text in der gewählten Sprache.

### Maintenance-Erweiterung

- Die Sprachwahl ist als gemeinsames Fahnen-Dropdown in den normalen Optionen,
  der Maintenance-Anmeldung und den Maintenance-Sicherheitskontrollen verfügbar
  und wirkt nach der Auswahl ohne Neustart.
- Storage-Wartung, Kartenbildverwaltung und KI-Trace-Maintenance verwenden
  eigene, nur für die gewählte Locale geladene Katalogsegmente für `de`, `en`
  und `fr`. Datumswerte und Statusbezeichnungen folgen ebenfalls der Locale.
- Sichtbare Fehler werden im Client sicher lokalisiert. Rohe Backendprosa,
  technische IDs, Trace-Payloads und persistierte Matchdaten bleiben
  sprachneutral und werden nicht zur Präsentationsautorität.

### Deckguide-Erweiterung

- Standarddeck-Guides verwenden ein eigenes mehrsprachiges Inhaltsformat mit
  verpflichtendem Englisch und optionalen weiteren Sprachen. Deutsch und
  Englisch sind gepflegt; Französisch fällt für Guide-Prosa ausdrücklich auf
  Englisch zurück, während die Dialogbedienung französisch bleibt.
- Der gerenderte Guide-Inhalt trägt die tatsächlich verwendete Sprache über
  `lang`; Kartentitel und technische Karten-IDs bleiben unverändert.
- Während einer aktiven Partie kann der eigene verfügbare Standarddeck-Guide
  über das Buchsymbol der Topbar erneut geöffnet werden. Der Dialog verändert
  weder Matchzustand noch Timer.
- Die Match-Payload enthält nur einen strukturierten `ownDeckGuideRef` für
  einen exakt gebundenen kuratierten Snapshot. Es werden weder vollständige
  Guide-Texte noch ein gegnerischer Guide-Verweis übertragen; eigene oder
  veränderte Deckkopien erhalten keinen heuristisch abgeleiteten Verweis.

### Dynamische Action- und Choice-Präsentation

- Kartenaktionen und zusätzliche Entscheidungen verwenden für ihre sichtbare
  Formulierung eine zentrale `de`-/`en`-/`fr`-Präsentationsschicht. Die Engine
  liefert dafür stabile `presentationKey`-Werte und side-sichere Metadaten wie
  Kartentitel, Beträge, Ziele und Entscheidungsvarianten; der Webclient wertet
  keine deutschen Laufzeitlabels als Fachsemantik aus.
- Alle produktiven `select_option`-Choices besitzen einen spezialisierten
  Präsentationsschlüssel. Ein AST-basierter Vertragstest verhindert, dass neue
  Optionsentscheidungen ohne diesen Schlüssel ergänzt werden.
- Allgemeine Karten- und Betragsauswahlen erhalten bei der PlayerView-Projektion
  eine bewusst generische, lokalisierte Grundpräsentation. Kartentitel bleiben
  als fachliche Eigennamen unverändert; spezialisierte Choice-Typen dürfen die
  Grundpräsentation mit genauerer Semantik ersetzen.
- Action- und Choice-Präsentation verändert weder `actionId`, Auswahlwerte,
  Legalität, StateVersion, StateHash noch Replay. Metadaten werden nur auf der
  bereits zulässigen privaten oder öffentlichen Choice-Fläche projiziert.
