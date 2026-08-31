# Vollständige Testregression und Fehlerbehebung 2026-08-31

Status: bereit für lokale Integration

## Quelle und Zielprüfung

Der Nutzer verlangt eine erneute vollständige Prüfung aller Tests und die
ursachenorientierte Beseitigung aller dadurch sichtbar werdenden Probleme.
Endzustand, Sicherheitsgrenzen, Arbeitsumgebung und Integrationsziel sind
eindeutig. Der bewusst breite Gate-Lauf ist für diesen Prozess verbindlich.

## Gesamtziel

`/Goal` Arbeite den NETGRID-Gesamttest- und Fehlerbehebungsprozess vollständig
und sequenziell von P1 bis P6 ab. Prüfe den aktuellen lokalen `main`-Stand mit
allen statischen, strukturellen, Unit-, Vertrags-, Integrations-, AI-Shard-,
Build- und E2E-Gates. Ermittle und dokumentiere für jeden reproduzierbaren
Fehler die Ursache, behebe ihn in der erzeugenden Schicht ohne Fallbacks,
verifiziere den vollständigen Gate-Satz erneut, merge den abgeschlossenen
Arbeitsbranch lokal nach `main` und entferne Worktree sowie Branch erst nach
nachgewiesen erfolgreicher Integration.

## Annahmen

- Getestet wird der beim Worktree-Start commitete lokale `main`-Stand
  `3d85c1417` einschließlich der seit dem letzten Gesamttest integrierten
  Änderungen.
- Der primäre Checkout ist sauber. Alle anderen vorhandenen Worktrees,
  Branches und prunable Metadaten sind fremde Arbeitsstränge und bleiben
  unangetastet.
- Node 24, Corepack und die im Repository gebundene pnpm-Version sind
  verbindlich.
- `format:check` wird als globales Format-Gate ausgeführt. Eine bekannte
  historische Baseline wird getrennt von durch diesen Stand verursachten
  Regressionen ausgewiesen; geänderte Dateien müssen zusätzlich
  `format:changed` erfüllen.
- E2E verwendet ausschließlich den Projekt-Runner. Keine auf den reservierten
  Standardports laufende Hauptinstanz und keine Hauptdatenbank werden aus dem
  Worktree beendet oder ersetzt.

## Nicht-Ziele

- Keine neue Produktfunktion und kein Redesign.
- Keine fachfremden Refactorings oder Massenformatierung.
- Keine Legacy-Adapter, Migrationen, stillen Fallbacks oder
  `catch-and-continue`-Workarounds.
- Kein Push, keine Pull Request und keine Remote-Integration.
- Keine Bereinigung fremder Worktrees oder Branches.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt alleinige Regelautorität.
- Hidden-Info-, Replay-, StateHash- und deterministische RNG-Grenzen werden
  nicht abgeschwächt.
- Tests werden nur angepasst, wenn aktueller Vertrag, Code und fachliche
  Intention die neue Erwartung gemeinsam tragen.
- Vor jedem KI-Patch wird der vollständige KI-Architektur-Preflight gelesen;
  Plan-, Step-, Route- und Continuation-Ownership bleiben eindeutig.

## Automatische Fehlerbehandlung

1. Roten Test oder Check mit dem kleinsten belastbaren Befehl reproduzieren.
2. Testintention, aktuellen Vertrag und erzeugende Schicht bestimmen.
3. Ursache als Produktfehler, Testvertragsfehler, Infrastrukturfehler oder
   bekannte unveränderte Baseline klassifizieren.
4. Reproduzierbare Produkt- und Testvertragsfehler an der Ursache beheben.
5. Fokussierten Regressionstest, angrenzende Suite und `git diff --check`
   ausführen.
6. Nur zusammengehörige Änderungen committen und zum unterbrochenen Gate
   zurückkehren.

## Sicherheitsblocker

Gestoppt wird nur, wenn eine nicht ableitbare fachliche Entscheidung, eine
Abschwächung verbindlicher Sicherheitsgrenzen, fremde uncommittierte Arbeit
oder eine externe Zustandsänderung erforderlich wäre. Der Blockerbericht nennt
Ursache, verantwortlichen Pfad und konkrete Removal Condition.

## State Machine

`preflight -> static_gates -> test_suites -> build_e2e -> final_verify -> integrate -> cleanup -> complete`

Bei einem roten Gate gilt temporär:
`diagnose -> focused_fix -> focused_verify -> commit -> interrupted_gate`.

## Paketfolge

### P1 – Preflight und Prozesssteuerung

- Ziel: isolierte Arbeitsbasis und verbindlichen Controller herstellen.
- Eingang: sauberer lokaler `main`, freie Zielnamen.
- Arbeit: Vorgaben, Status, Testarchitektur und Git-Zustand lesen; Worktree,
  Branch, `/Goal` und dieses Artefakt anlegen.
- Checks: `git status --short --branch`, `git worktree list --porcelain`,
  `git diff --check`.
- Done-Gate: sauberer Worktree, korrekter Branch, aktives Goal und commitetes
  Prozessartefakt.
- Commit: `docs(activity): define full test regression process`

### P2 – Installation sowie statische und strukturelle Gates

- Ziel: Abhängigkeits-, Quell-, Typ-, Format- und Architekturverträge prüfen.
- Arbeit: Frozen-Lockfile-Installation; Lint, Format, Typecheck und alle
  aktuellen read-only `check:*`-Gates ausführen. Schreibläufe sowie Gates mit
  privaten oder externen Laufzeitdaten werden nicht als Tests ausgegeben.
- Kernchecks: `corepack pnpm install --frozen-lockfile`,
  `corepack pnpm lint`, `corepack pnpm format:check`,
  `corepack pnpm typecheck`, `corepack pnpm check:ai`,
  Engine-/Cards-/Package-/CardSpec-/i18n-/Deck-Gates aus `package.json`.
- Done-Gate: alle einbezogenen Gates grün oder unveränderte Baseline präzise
  getrennt; jeder neue Fehler behoben und committed.
- Commit je Fix: `fix(<scope>): repair <gate-contract>`

### P3 – Vollständige Test-Suites

- Ziel: alle Unit-, Vertrags-, Integrations- und KI-Tests bestätigen.
- Checks: `corepack pnpm test`, `corepack pnpm test:ai:shards`,
  `corepack pnpm test:selfplay-evidence`.
- Done-Gate: alle Suites grün; keine ignorierten reproduzierbaren Fehler.
- Commit je Fix: `fix(<scope>): preserve <behavior> under full tests`

### P4 – Build und Browser-E2E

- Ziel: produktionsnahe Kompilierung und zentrale Nutzerflüsse bestätigen.
- Checks: `corepack pnpm build`, `corepack pnpm test:e2e`.
- Done-Gate: Build und alle E2E-Szenarien grün; keine fremden Listener oder
  Datenbanken verändert.
- Commit je Fix: `fix(<scope>): repair <build-or-e2e-contract>`

### P5 – Finaler Gesamtnachweis und Ursachenliste

- Ziel: Wechselwirkungen aller Reparaturen ausschließen und Ursachen
  vollständig verdichten.
- Arbeit: Falls P2 bis P4 Änderungen erzeugt haben, den vollständigen Gate-Satz
  erneut ausführen; ohne Änderungen gelten die erstmaligen vollständigen Läufe
  zugleich als finaler Nachweis. Ursachen, Fixes und Regressionsevidence in
  diesem Artefakt dokumentieren.
- Checks: P2 bis P4 nach der obigen Regel sowie `git diff --check`.
- Done-Gate: alle relevanten Gates grün, Ursachenliste vollständig, Worktree
  sauber und jede Reparatur committed.
- Commit: `docs(activity): record full test regression result`

### P6 – Main-Abgleich, Integration und Cleanup

- Ziel: geprüften Stand lokal integrieren und temporäre Git-Artefakte entfernen.
- Arbeit: aktuelles `main` in den Arbeitsbranch integrieren, nur tatsächlich
  konfliktbetroffene Gates ergänzend prüfen, bevorzugt Fast-Forward nach
  `main` mergen, Main-Status prüfen, exakten Worktree entfernen und doppelt
  verifizieren, gemergten Branch mit `git branch -d` löschen.
- Checks: `git status --short`, `git diff --check`,
  `git worktree list --porcelain`, `Test-Path` und Branch-Existenz.
- Done-Gate: Merge nachgewiesen; Worktree weder in Git noch im Dateisystem;
  Branch gelöscht; `/Goal` vollständig abgeschlossen.

## Verifikationsregeln

- Breite Test-, Typecheck-, Build- und AI-Shard-Läufe erhalten mindestens
  600 Sekunden äußeres Zeitfenster.
- Fokussierte AI-Tests erhalten mindestens 180 Sekunden.
- Noch laufende Prozesse werden über ihre Session fortgesetzt und nicht wegen
  des ersten Yield-Zeitfensters neu gestartet.
- Ein Fehler wird nicht durch Erwartungslockerung, Skip, Fallback oder
  unklassifiziertes Ignorieren grün gemacht.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_FULL_TEST_REGRESSION_2026_08_31`
- Branch: `codex/full-test-regression-2026-08-31`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen Merge und Main-Prüfung.
- Jedes abgeschlossene Fehlerpaket erhält einen eigenen Commit.
- Kein `git reset --hard`, kein pauschaler Revert, kein `--force`-Cleanup.
- Konflikte werden unter Erhalt beider kompatibler Intentionen gelöst.

## Controller-Prompt-Kern

Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen
Paket. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Behebe rote Gates ursachenorientiert, dokumentiere
die Ursachen und committe jedes abgeschlossene Fehlerpaket. Nutze den
Hauptworkspace erst zur finalen Integration. Markiere das Goal erst nach
grünem Main-Nachweis und verifiziertem Worktree-/Branch-Cleanup als complete.

## Abschlusskriterien

- Alle aufgenommenen Gates sind grün oder eine unveränderte globale Baseline
  ist transparent und nicht durch den geprüften Stand verursacht.
- Jeder reproduzierbare neue Fehler ist erklärt, ursachenorientiert behoben
  und angemessen regressionsgeschützt.
- Arbeitsbranch ist lokal in `main` integriert.
- Arbeits-Worktree und gemergter Branch sind nachweislich entfernt.
- Kein Push und keine Remote-Änderung wurden ausgeführt.

## Fortschritt und Ergebnisse

- 2026-08-31: P1 gestartet; Projekt-, Agenten-, Skill-, Test- und
  Git-Preflight abgeschlossen. Worktree und `/Goal` angelegt.
- 2026-08-31: P2 abgeschlossen. Installation, Format-, Lint-, Typecheck- und
  sämtliche aktuellen read-only `check:*`-Gates sind grün.
- 2026-08-31: P3 abgeschlossen. Der vollständige Workspace-Lauf ist mit 8.613
  Tests grün; zusätzlich sind alle drei AI-Shards (573 Dateien, 4.923 Tests)
  und die sieben Selfplay-Evidence-Tests grün.
- 2026-08-31: P4 abgeschlossen. Vollständiger Build und alle neun Browser-E2E-
  Szenarien sind grün. Die Läufe verwendeten freie Nicht-Standardports und
  jeweils eine isolierte temporäre SQLite-Datei.
- 2026-08-31: P5 abgeschlossen. Nach den letzten Web- und E2E-Reparaturen sind
  `format:check`, die 998 Web-Tests, der Web-Typecheck, der Web-Build, ein
  gezielter E2E-Aufruf mit Leerzeichen und der vollständige E2E-Lauf erneut
  grün. Alle Änderungen sind einzeln committed; der Worktree ist sauber.

## Ursachen und verankerte Regeln

### Produkt- und Architekturfehler

1. **Engine erzeugte semantisch identische Aktionen mehrfach.** Kombinierte
   Subroutinen mit gleichen Effekten wurden nach ihrer physischen Auswahl statt
   nach ihrer Wirkung unterschieden. Dadurch entstanden bei realen Karten bis
   zu 6.884 äquivalente Aktionen, mit Laufzeit- und Timeoutfolgen. Die Engine
   kanonisiert solche Kombinationen nun über ihre Effekt-Multimenge.
2. **Plan-Ownership ging an Engine-Fortsetzungen verloren.** Bei Event-Install-
   Zahlfenstern wurde der gewählte Installationsplan nicht bis zur
   fortgesetzten Aktion getragen. Die bestehende `PlanExecutionOrigin` bleibt
   nun über das Zahlungsfenster exakt erhalten.
3. **Access-Ambush-Choices hatten keinen fachlichen Owner.** Die Choice für
   Viral Breeding Ground war legal, aber nicht an den bereits gewählten
   Ambush-Plan gebunden. Die Choice vervollständigt nun ausschließlich dessen
   Payload und bildet keine zweite Entscheidungsautorität.
4. **Aufeinanderfolgende Run-Start-Fenster kappten die Continuation.** Der
   Fortsetzungscode nahm genau eine sofortige Choice an. Mehrere Top Runners’
   Conference-Fenster verloren dadurch Ursprung und Run-Bindung. Eine explizite
   `continuedThroughStateVersion` und die Prüfung derselben zusammenhängenden
   Run-Ereigniskette erhalten Root, Executor und Run-ID über alle Fenster.
5. **Die schmale Webansicht hatte echte Min-Content-Überbreite.** Implizite
   Grid-Tracks und nicht umbrechende Statusgruppen ließen Konto-Header und
   Setupbereich über den Viewport wachsen. Explizite `minmax(0, 1fr)`-Tracks,
   Breitenbegrenzungen und responsive Umbrüche verankern den Layoutvertrag.

### Testvertragsfehler

6. **Abstraktions-Baselines verwendeten volatile Quellpositionen.** Zeile,
   Spalte und Quelltextausschnitt machten reine Format- oder Nachbaränderungen
   zu Architekturabweichungen. Baseline-Schema v2 vergleicht nur noch die
   semantische Abstraktionsidentität.
7. **Ein Test benutzte ein veränderliches Standarddeck als Bedeutungsfixture.**
   Die fachlich korrekte Ergänzung von King of the Road um eine Wall änderte
   unbeabsichtigt die Testbedingung. Die Bedingung wird nun durch eine kleine,
   explizite synthetische Fixture hergestellt.
8. **Mehrere AI-Regressionstests fixierten alte Einzelschritte statt den
   Vertrag.** Neue korrekte Owner- und Prioritätsregeln für Remote-Druck,
   Economy/MU-Finanzierung, Event-Runs und zentrale Verteidigung machten alte
   exakte Action-Erwartungen falsch. Die Tests sichern nun Plan-Owner,
   Fähigkeit, Evidence und die aktuell fachlich richtige Aktion.
9. **Ein Decoder-Coverage-Test ließ konkurrierende Routen offen.** Seine Live-
   Fixture behauptete eine isolierte Bedingung, erlaubte aber zugleich andere
   Run- und Eventpläne. Die Fixture isoliert jetzt ausdrücklich den geprüften
   Decoderpfad.
10. **Der Real-Engine-Korpus erlaubte nur `start_run`.** Der bereits gültige
    Event-Run-Pfad `play_event` wurde fälschlich als Regression behandelt. Der
    Vertrag erlaubt beide vom zuständigen Plan getragenen Routen.
11. **Snapshots und Laufzeitbudgets bildeten den aktuellen Vertrag nicht ab.**
    Version-0-Snapshots fehlte das neue Continuation-Feld; zwei bewusst schwere
    reale Simulationen hatten Budgets knapp unter ihrer gemessenen Laufzeit.
    Snapshots wurden ohne Legacy-Adapter erneuert und die betroffenen Budgets
    explizit auf 60 beziehungsweise 120 Sekunden gesetzt.

### Generator- und Testinfrastrukturfehler

12. **Ein Generator erzeugte nicht format-idempotenten TypeScript-Code.** Der
    Card-Importindex bestand inhaltlich, scheiterte aber nach Regeneration am
    Formatter. Der Generator formatiert sein eigenes Ergebnis jetzt vor dem
    Vergleich und Schreiben.
13. **Langlebige Proteus-Simulationsprozesse akkumulierten Speicher.** Die
    Isolation galt nur pro Pilot beziehungsweise Shard, obwohl mehrere reale
    Spiele große Zustände aufbauten. Die harte Isolationsgrenze liegt nun bei
    jedem einzelnen Spiel; Fehler bleiben dem verursachenden Spiel zugeordnet.
14. **Der Konto-E2E-Helper hatte eine Hydration-TOCTOU-Race.** Er prüfte ein
    zunächst editierbares Namensfeld und füllte es erst, nachdem die
    Account-Hydration das Feld gesperrt hatte. Der Helper wartet nun auf den
    Accountzustand und befüllt ausschließlich anonyme, weiterhin editierbare
    Felder.
15. **Der Windows-E2E-Starter interpretierte Argumente zweimal.** `corepack.cmd`
    lief mit `shell: true`; Leerzeichen wurden neu aufgespalten und das übliche
    pnpm-Trennargument `--` als Playwright-Dateimuster weitergegeben. Corepack
    wird unter Windows nun direkt über Node ohne Shell gestartet; die
    Prozessgrenze entfernt ausschließlich das führende Trennargument.
16. **Parallel integrierte AI-Dateien waren nicht formatterkonform.** Der vor
    P6 weitergelaufene `main`-Stand brachte drei semantisch gültige, aber nicht
    Prettier-konforme Dateien mit. Der verpflichtende Formattercheck direkt am
    Integrationspunkt hat sie erkannt; genau diese Dateien wurden normalisiert,
    bevor der Merge fortgesetzt wurde.

## Finaler Gate-Nachweis vor Integration

- `corepack pnpm format:check`, `lint`, `typecheck`: grün.
- Sämtliche aufgenommenen read-only `check:*`-Gates: grün.
- `corepack pnpm test`: 8.613 Tests über Shared, Cards, Catalog, Engine,
  Decks, Card Images, AI, Web, Server und Specs grün.
- `corepack pnpm test:ai:shards`: 3/3 Shards, 573 Dateien und 4.923 Tests grün.
- `corepack pnpm test:selfplay-evidence`: 7/7 grün.
- `corepack pnpm build`: alle Pakete und Apps einschließlich Next.js grün.
- `corepack pnpm test:e2e`: 9/9 grün; gezielter Argumentweitergabe-Test 1/1
  grün.
- Abschließende betroffene Gates: Web 128 Dateien/998 Tests, Web-Typecheck,
  Web-Build, Formatcheck und `git diff --check` grün.
