# Übersetzbare NETGRID-Oberfläche

Status: Umsetzung aktiv  
Stand: 2026-08-20  
Quelle: Nutzerauftrag zur deutsch/englisch übersetzbaren Oberfläche und zur
vorbereitenden Entkopplung von Fachsemantik und sichtbarer Sprache

## Zielprüfung

Die Vorgabe ist für die automatische Abarbeitung ausreichend präzise.

- Endzustand: Die normale Spieleroberfläche ist zwischen Deutsch und Englisch
  umschaltbar. Die Locale beeinflusst ausschließlich Darstellung und
  Formatierung.
- Reihenfolge: Grundlage, Entkopplung, Flächenmigration,
  Präsentationsverträge, Chronik/Replay/Fehler, englische Vervollständigung.
- Abnahme: paketnahe Tests, Typechecks, Vollständigkeitsgate und fokussierte
  Firefox-orientierte Browserprüfung.
- Arbeitsmodell: eigener Worktree, Commit je Paket, finaler lokaler Merge nach
  `main`, danach verifizierter Worktree- und Branch-Cleanup.

## Gesamtziel

NETGRID erhält eine typisierte I18N-Schicht für die normale Spieleroberfläche.
Deutsch bleibt Standardsprache; Englisch wird als zweite vollständige Locale
bereitgestellt. Derselbe Match darf auf verschiedenen Clients in
unterschiedlichen Sprachen dargestellt werden, ohne GameState, Legalität,
Action-Identität, Replay oder StateHash zu verändern.

## Annahmen

- Die Sprachauswahl gilt pro Browser und wird ohne URL-Präfix persistent
  gespeichert. Eine ausdrückliche Auswahl gewinnt gegenüber der Browsersprache.
- Der nicht angemeldete und der angemeldete Browser verwenden zunächst dieselbe
  lokale Präferenz; accountübergreifende Synchronisation ist kein Muss-Gate.
- `de` und `en` sind die einzigen freigegebenen Locales dieses Prozesses.
- Kartenbild-Skin und Oberflächensprache bleiben getrennte Einstellungen.
- Technische Eigennamen wie Runner, Corp/Korp, ICE, HQ, R&D und Archives werden
  über ein zentrales Glossar je Locale konsistent ausgegeben.

## Nicht-Ziele

- keine Übersetzung gedruckter Kartentitel, Regeltexte, Flavor-Texte oder
  Kartenbilder;
- keine Übersetzung der privilegierten Maintenance- und KI-Debugflächen;
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
- Fachlogik parst keine sichtbaren deutschen oder englischen Texte.
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

| ID | Titel | Primärer Schnitt |
| --- | --- | --- |
| I18N-00 | Prozess und Architekturvertrag | dieses Dokument, Architekturindex |
| I18N-01 | I18N-Grundlage und Locale-Persistenz | Web-Konfiguration, Provider, Locale-State, deutsche Nachrichten |
| I18N-02 | Semantische Formatierung | Glossar, Datum/Zahl/Liste/Sortierung, sprachabhängige Stringlogik |
| I18N-03 | App-Rahmen und Account | Layout, Optionen, App-Shell, normale Accountflächen |
| I18N-04 | Matchstart und Deckflächen | Start/Lobby, Decks, öffentliche und letzte Spiele |
| I18N-05 | Board, Actions und Choices | normale Matchsteuerung und side-sichere Auswahlflächen |
| I18N-06 | Präsentations- und Fehlerverträge | Shared, Engine, Server und Web-Client |
| I18N-07 | Chronik, Replay und Nutzerfehler | semantische Narration und reproduzierbare Darstellung |
| I18N-08 | Englisch und Vollständigkeitsgate | vollständige `en`-Nachrichten, Struktur- und Browser-QA |

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
- Deutsch und Englisch sind für die normale Spieleroberfläche vollständig.
- Die Sprache ist einstellbar und persistent; `html lang` und Locale-Formatter
  folgen der Auswahl.
- Engine, Server, Replay, StateHash und Legalität bleiben locale-neutral.
- Karteninhalte, Kartenbilder, Maintenance und privilegiertes KI-Debug sind als
  bewusste Nicht-Ziele getrennt.
- Finale Checks sind grün oder unabhängige Baselineabweichungen sind eindeutig
  belegt.
- Arbeitsbranch ist lokal in `main` integriert.
- Arbeits-Worktree und gemergter Arbeitsbranch sind entfernt und die Entfernung
  ist doppelt verifiziert.

## Fortschritt

- [x] I18N-00 – Prozess und Architekturvertrag
- [ ] I18N-01 – I18N-Grundlage und Locale-Persistenz
- [ ] I18N-02 – Semantische Formatierung
- [ ] I18N-03 – App-Rahmen und Account
- [ ] I18N-04 – Matchstart und Deckflächen
- [ ] I18N-05 – Board, Actions und Choices
- [ ] I18N-06 – Präsentations- und Fehlerverträge
- [ ] I18N-07 – Chronik, Replay und Nutzerfehler
- [ ] I18N-08 – Englisch und Vollständigkeitsgate

