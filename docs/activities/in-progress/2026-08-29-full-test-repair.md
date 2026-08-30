# Vollständiger Test- und Fehlerbehebungsprozess 2026-08-29

Status: verifiziert, Integration läuft
Quelle/Vorgabe: Nutzerauftrag vom 2026-08-29

## Zielprüfung

Der Endzustand, die Arbeitsumgebung, die Integrationsregel und die
Fehlerbehandlungsintention sind eindeutig. Der Nutzer verlangt bewusst einen
breiten Integrationslauf über Tests, statische Gates, Build und E2E. Das geht
über die normalerweise engen Paketchecks hinaus und ist für diesen Prozess
verbindlich.

## Gesamtziel

`/Goal` Arbeite den NETGRID-Gesamttest- und Fehlerbehebungsprozess vollständig
und sequenziell ab. Führe alle unten definierten Gates im isolierten Worktree
aus, behebe jeden reproduzierbaren Fehler an seiner Ursache unter Erhalt der
fachlichen Funktionalität, verifiziere danach den vollständigen Gate-Satz
erneut, merge den abgeschlossenen Arbeitsbranch lokal nach `main` und entferne
Worktree und Branch erst nach nachgewiesen erfolgreicher Integration.

## Annahmen

- Getestet wird der aktuell commitete lokale `main`-Stand `71be2f7a8`.
- Die uncommittierten Chronicle-/Lokalisierungsänderungen im primären
  `main`-Checkout sind fremde Nutzerarbeit. Sie werden nicht übernommen,
  verändert, verworfen oder committed.
- Das ältere Worktree `fix-full-test-failures-DL` und alle weiteren
  vorhandenen Worktrees sind fremde Arbeitsstränge und bleiben unangetastet.
- Node 24 und die durch Corepack bereitgestellte pnpm-Version sind verbindlich.
- E2E läuft nur mit vom Projekt-Runner verwalteten Prozessen und Ressourcen.
  Die reservierten Standardports und die Hauptdatenbank werden nicht aus dem
  Worktree heraus übernommen oder gestoppt.

## Nicht-Ziele

- Keine neuen Produktfunktionen und kein Redesign.
- Keine breiten Refactorings ohne direkten Bezug zu einem Gate-Fehler.
- Keine Migrationen, Legacy-Adapter, stillen Fallbacks oder
  `catch-and-continue`-Workarounds.
- Kein Push, keine Pull Request und keine Remote-Integration.
- Keine Änderung oder Bereinigung fremder Worktrees und Arbeitsbäume.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt alleinige Regelautorität.
- Hidden-Info-, Replay-, StateHash- und deterministische RNG-Grenzen werden
  durch einen Fix nicht abgeschwächt.
- Bei KI-Änderungen gilt vor dem ersten Patch der vollständige
  KI-Architektur-Preflight; Owner, Planinstanz und Continuation müssen erhalten
  oder ausdrücklich erweitert werden.
- Eine erwartete Testaussage wird nur geändert, wenn Code, Vertrag und
  fachliche Intention nachweislich die neue Erwartung tragen. Tests werden
  nicht bloß auf den fehlerhaften Ist-Stand umgeschrieben.

## Automatische Fehlerbehandlung

1. Den kleinsten reproduzierenden Test oder Check isolieren.
2. Testintention, zuständigen Vertrag und erzeugende Schicht bestimmen.
3. Den Fehler in der erzeugenden Schicht ursachenorientiert beheben.
4. Einen engen Regressionstest ergänzen oder präzisieren, sofern der bestehende
   Test den realen Fehlerpfad nicht dauerhaft schützt.
5. Engen Test, unmittelbar angrenzende Suite und `git diff --check` ausführen.
6. Nur zum Fehlerpaket gehörende Änderungen committen.
7. Danach das unterbrochene breite Gate fortsetzen beziehungsweise neu starten.

## Sicherheitsblocker

Gestoppt wird nur, wenn ein Fix eine nicht ableitbare fachliche Entscheidung,
eine Abschwächung verbindlicher Sicherheitsgrenzen, fremde uncommittierte
Arbeit oder eine externe Zustandsänderung erfordert. Der Blockerbericht nennt
Ursache, betroffenen Pfad und konkrete Removal Condition.

## State Machine

`preflight -> static_gates -> test_suites -> build_e2e -> final_verify -> integrate -> cleanup -> complete`

Bei einem roten Gate wechselt der Prozess temporär nach
`diagnose -> focused_fix -> focused_verify -> commit` und kehrt anschließend
zum unterbrochenen Gate zurück.

## Paketfolge und Paketdetails

### P1 – Preflight und Prozesssteuerung

- Ziel: saubere isolierte Arbeitsbasis und verbindlichen Controller herstellen.
- Eingang: lokaler `main`, bekannte fremde Änderungen, freie Zielnamen.
- Arbeit: Wissens-/Agentenvorgaben lesen, Git- und Runtime-Stand prüfen,
  Worktree/Branch anlegen, dieses Artefakt erstellen.
- Kernartefakt: diese Activity.
- Checks: `git status --short --branch`, `git worktree list --porcelain`,
  `git diff --check`.
- Done-Gate: Worktree sauber, Zielbranch korrekt, Prozessartefakt committed.
- Commit: `docs: define full test repair process`

### P2 – Statische und strukturelle Gates

- Ziel: Quell-, Typ-, Format- und Architekturverträge bestätigen.
- Arbeit: Abhängigkeiten reproduzierbar installieren; Lint, Formatcheck,
  Typecheck sowie die aktuellen Engine-, Cards-, Package-, CardSpec-, i18n-,
  AI- und Deck-Gates ausführen. Rote Gates paketweise reparieren.
- Checks: `corepack pnpm install --frozen-lockfile`, `corepack pnpm lint`,
  `corepack pnpm format:check`, `corepack pnpm typecheck` und die in
  `package.json` definierten aktuellen `check:*`-Integrationsgates, soweit sie
  weder Schreibläufe noch externe/private Runtime-Daten verlangen.
- Done-Gate: alle einbezogenen statischen/strukturellen Gates grün; bewusste
  Ausschlüsse mit Grund dokumentiert.
- Commit je Fix: `fix(<scope>): repair <gate>`

### P3 – Vollständige Test-Suites

- Ziel: alle Unit-, Vertrags-, Integrations- und KI-Tests bestätigen.
- Arbeit: Root-Testlauf und den projektdefinierten vollständigen AI-Shard-Lauf
  mit den vorgeschriebenen äußeren Zeitfenstern ausführen; Fehler einzeln
  reproduzieren und reparieren.
- Checks: `corepack pnpm test`, `corepack pnpm test:ai:shards`,
  `corepack pnpm test:selfplay-evidence`.
- Done-Gate: alle Test-Suites grün und keine ignorierten reproduzierbaren
  Fehler.
- Commit je Fix: `fix(<scope>): preserve <behavior> under full tests`

### P4 – Build und Browser-E2E

- Ziel: produktionsnahe Kompilierung und zentrale Nutzerflüsse bestätigen.
- Arbeit: vollständigen Workspace-Build und den projektverwalteten E2E-Runner
  ausführen; im Fehlerfall die tatsächliche Produktintention anhand von
  Verträgen und UI-Flows bestimmen.
- Checks: `corepack pnpm build`, `corepack pnpm test:e2e`.
- Done-Gate: Build und E2E grün; keine fremden Listener oder Datenbanken
  verändert.
- Commit je Fix: `fix(<scope>): repair <build-or-e2e-contract>`

### P5 – Finaler Gesamtnachweis

- Ziel: Wechselwirkungen aller Fixes ausschließen.
- Arbeit: den vollständigen relevanten Gate-Satz aus P2 bis P4 erneut auf dem
  finalen Arbeitsbranch ausführen; Ergebnisse in diesem Artefakt verdichten.
- Checks: alle in P2 bis P4 aufgenommenen Befehle sowie `git diff --check`.
- Done-Gate: durchgehend grün, Worktree sauber und jeder Fix committed.
- Commit: `docs: record full test gate result`

### P6 – Main-Abgleich, Integration und Cleanup

- Ziel: geprüften Stand sicher lokal integrieren und temporäre Git-Artefakte
  vollständig entfernen.
- Arbeit: aktuelles `main` in den Arbeitsbranch integrieren, konfliktbetroffene
  Checks wiederholen, bevorzugt Fast-Forward nach `main` mergen, Main-Status
  prüfen, exakten Worktree entfernen und doppelt verifizieren, gemergten Branch
  mit `git branch -d` löschen.
- Checks: `git status --short`, `git diff --check`, relevante konfliktnahe
  Tests, `git worktree list --porcelain`, `Test-Path`.
- Done-Gate: Merge nachgewiesen; fremde Main-Änderungen unverändert vorhanden;
  Worktree weder in Git noch im Dateisystem vorhanden; Branch gelöscht.

## Verifikationsregeln

- Breite Prozesse erhalten mindestens 600 Sekunden äußeres Zeitfenster; noch
  laufende Prozesse werden über ihre Session fortgesetzt.
- Fokussierte AI-Tests erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Der vollständige AI-Gate-Lauf ist `corepack pnpm test:ai:shards`.
- Ein breites Gate wird nach einem Fix erneut ausgeführt; ein finaler
  Gesamtnachweis folgt erst nach allen Reparaturen.
- Baseline-, Umgebungs- und Produktfehler werden durch Reproduktion getrennt,
  nicht durch Annahme.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID-worktrees\full-test-repair-20260829-02`
- Branch: `codex/full-test-repair-20260829-02`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für finalen Merge und
  Main-Prüfung.
- Paketbezogene Änderungen werden einzeln gestaged und committed.
- Kein `git reset --hard`, kein pauschaler Revert, kein Cleanup mit `--force`
  ohne die im Skill verlangten Nachweise.
- Bei Main-Konflikten werden beide Intentionen gelesen und, soweit fachlich
  kompatibel, erhalten.

## Controller-Prompt-Kern

Arbeite ausschließlich im festgelegten Worktree und immer nur am aktuellen
Paket. Stelle keine Zwischenfragen, solange die konservative automatische
Fortsetzung möglich ist. Behebe rote Gates ursachenorientiert und ohne
Funktionalitätsverlust. Committe jedes abgeschlossene Fehlerpaket. Nutze den
Hauptworkspace erst zur finalen lokalen Integration. Markiere das Goal erst
nach grünem Main-Nachweis und verifiziertem Worktree-/Branch-Cleanup als
abgeschlossen.

## Abschlusskriterien

- Alle aufgenommenen statischen, Test-, Build- und E2E-Gates sind grün.
- Jeder reproduzierbare Fehler wurde erklärt, ursachenorientiert behoben und
  mit angemessener Regressionsevidence geschützt.
- Arbeitsbranch ist lokal in `main` integriert.
- Fremde uncommittierte Main-Änderungen sind erhalten.
- Arbeits-Worktree und gemergter Branch sind nachweislich entfernt.
- Kein Push und keine Remote-Änderung wurden ausgeführt.

## Fortschritt und Ergebnisse

- 2026-08-29: P1 gestartet; Wiki-, Agenten-, Git-, Runtime- und
  Worktree-Preflight abgeschlossen.
- 2026-08-29: P2 abgeschlossen. Installation mit Frozen Lockfile, Lint,
  Typecheck, `format:changed` und alle einbezogenen `check:*`-Gates sind grün.
  Der globale historische `format:check` meldet 768 bereits vor diesem Branch
  vorhandene Dateien. Diese Baseline wurde nicht durch einen fachfremden
  Massenformatierungs-Commit verändert; sämtliche 92 gegenüber `main`
  geänderten Dateien erfüllen den Formatvertrag.
- 2026-08-29: P3 abgeschlossen. Der Root-Testlauf ist vollständig grün:
  Shared 26, Cards 123, Catalog 26, Engine 2.159, Decks 29, Card Images 65,
  AI 4.891, Web 978, Server 253 sowie Discovery-/Root-Tests 8. Der zusätzliche
  AI-Gate-Lauf `test:ai:shards` bestätigt dieselben 4.891 Tests in drei Shards;
  `test:selfplay-evidence` bestätigt 5 von 5 Registry-Tests.
- 2026-08-30: P4 abgeschlossen. Der vollständige Workspace-Build ist grün.
  Der finale isolierte Browserlauf bestätigt 9 von 9 E2E-Szenarien. Die
  E2E-Verträge wurden an die aktuelle Setup-Beschriftung, den aktuellen
  Optionen-/Darstellungsworkflow und die öffentliche Deckvalidierung
  angeglichen. Der Installationsflow bedient überlappende Handkarten über den
  real sichtbaren Kartenrand und anschließend den Aktionsmarker; es gibt
  keinen erzwungenen Klick und keine Umgehung der Nutzerinteraktion.
- 2026-08-30: P5 abgeschlossen. Root-Tests, AI-Shards, statische und
  strukturelle Gates, Build, vollständiger E2E-Lauf, Selfplay-Evidence,
  `format:changed` und `git diff --check` sind auf dem finalen Arbeitsbranch
  grün. Alle Fehlerpakete und Vertragskorrekturen sind einzeln committed.
- 2026-08-30: P6 aktiv. Als letzter Schritt folgen der Abgleich mit dem
  aktuellen lokalen `main`, die konfliktnahe Verifikation, die lokale
  Integration sowie der doppelt verifizierte Worktree- und Branch-Cleanup.
