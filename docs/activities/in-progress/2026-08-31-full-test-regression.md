# Vollständige Testregression und Fehlerbehebung 2026-08-31

Status: in Bearbeitung

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
