# AI Source Structure Optimization Process 2026-07

Status: `package_done:AISSO-6`

## Quelle und Vorgabe

Der Architektur-Review vom 2026-07-17 bestätigt die grundlegenden NETGRID-
Grenzen, zeigt aber neue Wartbarkeitsschwerpunkte nach den bisherigen AI-
Struktur-Cleanups. Der Nutzer hat die sorgfältige direkte Umsetzung mit dem
Skill `paketprozess-worktree-goal` beauftragt.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung präzise genug.
Die gefundenen Strukturprobleme sind nach Risiko und Abhängigkeit geordnet;
verhaltensneutrale Extraktion, Current-State-Bereinigung und ausführbare
Architektur-Gates bilden den verbindlichen Scope.

Konservative Annahmen:

- Bestehende AI-Bewertungen, Gewichte, Evidence-Strings und Auswahlreihenfolgen
  werden nicht fachlich verändert.
- Public-API-Reste ohne produktiven Consumer dürfen in der Version-0-Umgebung
  entfernt oder in den korrekten Subpath verschoben werden.
- Strukturarbeit erfolgt familienweise. Es gibt keine pauschale Verschiebung
  aller Dateien unter `packages/ai/src/runtime/`.
- Bereits offene Web-, Versions- und Wissensänderungen im Hauptworkspace sind
  fremd und werden weder gestaged noch verändert.

## Gesamtziel

Die produktive KI behält ihre Engine-, Hidden-Info-, LegalAction-, Replay- und
Determinismusverträge, während ihre Source-Struktur auf fachlich begrenzte,
testbare Modulgruppen zurückgeführt wird. Große und stark veränderte
Entscheidungsmodule werden verhaltensneutral zerlegt, Current-State-Reste
entfernt, Typzyklen aufgelöst, Testmonolithen verkleinert und die erreichte
Struktur durch ratchetartige Gates geschützt.

## Nicht-Ziele

- Keine Änderung von Spielregeln, Engine-Verhalten oder LegalActions.
- Keine neue KI-Strategie, keine neuen Scoringgewichte und kein Play-Strength-
  Tuning.
- Keine Kartenfreischaltung und keine Änderung von Hints oder Kartenmanifesten.
- Keine UI-, Server-, Storage- oder Multiplayer-Arbeit.
- Kein vollständiger Massenumzug aller Runtime-Dateien.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- AI-Entscheidungen verwenden nur side-sichere `PlayerView`, erlaubte
  `PublicEvents`, `LegalActions` und freigegebene Metadaten.
- Jede Extraktion erhält die bestehende Auswahlreihenfolge, Scorewerte,
  Evidence und Redaction.
- `@netgrid/ai` bleibt live-only; Simulation, Selfplay und Benchmarks liegen
  unter `@netgrid/ai/simulation`.
- Kein produktiver oder diagnostischer Pfad erhält Zugriff auf FullGameState
  oder Hidden-Zone-Daten.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktuellen Paket eng debuggt.
- Bei unerwarteter Verhaltensänderung wird die Extraktion zurückgeschnitten,
  nicht durch neue Ausnahmen kaschiert.
- Neue fachliche KI-Findings werden als Follow-up dokumentiert und nicht in
  diesen Strukturprozess gezogen.
- Bei Main-Konflikten werden beide Intentionen gelesen und erhalten, sofern
  sie kompatibel sind.
- Umfang oder Reihenfolge darf nur verkleinert werden, wenn ein konkreter
  Sicherheitsblocker mit Removal Condition dokumentiert ist.

## Sicherheitsblocker

Der Prozess stoppt, wenn:

- Hidden-Info-, LegalAction-, Replay-, StateHash- oder Randomness-Verträge
  berührt würden;
- eine vermeintlich strukturelle Extraktion KI-Entscheidungen oder Scores
  fachlich verändert;
- eine Modultrennung neue Laufzeitzyklen erzeugt;
- der Arbeitsbranch nicht ohne Verlust fremder Änderungen mit `main`
  integrierbar ist;
- Worktree- oder Branch-Cleanup nicht sicher auf den exakten Prozesspfad
  begrenzt werden kann.

## State Machine

1. `prepared_for_execution`
2. `worktree_created`
3. `package_active:AISSO-0`
4. `package_done:AISSO-0` bis `package_done:AISSO-8`
5. `final_green_ready`
6. `main_integrated`
7. `worktree_removed`
8. `branch_removed`
9. `complete`
10. `blocked:<reason>`

## Paketfolge

1. `AISSO-0` – Preflight, Messbaseline und Prozessverträge
2. `AISSO-1` – Live-/Simulation-Public-Contract und Current-State-Reste
3. `AISSO-2` – Ausführbares Source-Structure-Ratchet und Typvertragsgrenzen
4. `AISSO-3` – Semantic Choice Ranking nach Override-Familien zerlegen
5. `AISSO-4` – Corp-Scoreline, Board-Triage und Scoring-Window strukturieren
6. `AISSO-5` – Visible Run Analysis als fachliche Modulgruppe schneiden
7. `AISSO-6` – Runner Hand Development und zugehörige Tests strukturieren
8. `AISSO-7` – Simulationsverträge neutralisieren und V143-Fixtures isolieren
9. `AISSO-8` – Restprüfung, Dokumentation und vollständiges Final Gate

## Paketdetails

### AISSO-0 – Preflight, Messbaseline und Prozessverträge

- Ziel: reproduzierbare Ausgangsmessung und verbindliche Arbeitsgrenzen.
- Eingangsvoraussetzungen: Prozessartefakt liegt auf `main`; Worktree und
  Branch sind frei.
- Arbeit: Dateigrößen, Importgraph, Laufzeit-/Typzyklen, Public Exports,
  Runtime-Root-Flachheit und Testgrößen als kleine Current-State-Summary
  erfassen; aktive fremde Worktrees und Main-Änderungen dokumentieren.
- Kernartefakte: dieses Prozessartefakt und ein kleiner Preflight-Abschnitt.
- Checks: fokussierte Boundary-/Public-Export-Tests, AI-Typecheck,
  `git diff --check`.
- Done-Gate: Baseline ist reproduzierbar; Scope und fremde Änderungen sind
  klassifiziert.
- Commit: `docs(ai): record source structure optimization preflight`

Preflight-Baseline auf Commit `4bdabbc10`:

- Worktree und Branch sind exklusiv angelegt; der Arbeitsbaum ist sauber.
- Der Hauptworkspace enthält fremde uncommitted Web-, Versions-, Roadmap- und
  Wissensänderungen. Keine davon liegt unter `packages/ai/` oder an diesem
  Prozessartefakt; sie bleiben außerhalb des Prozessscope.
- Weitere aktive Worktrees betreffen eigenständige Activity- und AI-
  Arbeitszweige. Vor dem finalen Merge wird deshalb aktuelles `main` erneut
  vollständig in den Arbeitsbranch integriert.
- `packages/ai/src`: 631 produktive Dateien mit 150.558 Zeilen und 355
  Testdateien mit 108.961 Zeilen.
- Direkt unter `packages/ai/src/runtime/`: 287 produktive Dateien und 110
  Tests; Median 78 Zeilen, 97 produktive Dateien unter 50 Zeilen.
- Größte produktive Hotspots: Corp Score 3.817, Corp Board Triage 3.689,
  Runner Hand Development 2.755, Visible Run Analysis 2.464 und Semantic
  Choice Ranking 1.759 Zeilen.
- Größte Testhotspots: Corp Score 7.539, Tactical Plans 4.307, Semantic
  Runtime Cutover 4.260, Corp Board Triage 3.333 und RunTargetEvaluation
  3.149 Zeilen.
- Der produktive Importgraph besitzt keine Laufzeitzyklen. Vier reine
  Typ-SCCs bleiben zwischen Action-Semantik, RunTarget/Hand/Risk,
  Simulation-Summary/QualityMetrics und TacticalPlan/SemanticDecisionFrame.
- Die Default-Fassade besitzt 96 Value-Exports; darunter der nicht live-only
  `evaluatePracticalTacticBenchmark`.
- Baseline-Checks: Module-Boundary- und Public-Export-Suite 40/40 grün,
  AI-Typecheck grün, `git diff --check` grün.

### AISSO-1 – Live-/Simulation-Public-Contract und Current-State-Reste

- Ziel: Default-Fassade und Current-State-Dokumentation entsprechen wieder dem
  live-only Vertrag.
- Arbeit: `PracticalTacticBenchmark` aus der Default-Fassade entfernen und bei
  Bedarf über Simulation exportieren; Public-Export-Gate auf vollständige
  Value-Export-Allowlist beziehungsweise gleichwertige fail-closed Regeln
  härten; nicht existente Legacy-Routingregeln entfernen; Placement Guide auf
  „kein ausführbares Legacy“ aktualisieren; produktiven Access-Memory-Consumer
  aus dem deprecated Adapter auf die Access-Grenze migrieren und den Adapter
  entfernen, sofern keine aktuellen Consumer bleiben.
- Kernartefakte: `packages/ai/src/index.ts`, `simulation.ts`, Public-/Boundary-
  Tests, Access-Memory, Placement Guides.
- Checks: Public-Export-, Module-Boundary-, Access-Memory- und RunTarget-Tests,
  AI-Typecheck, `git diff --check`.
- Done-Gate: `@netgrid/ai` ist live-only; kein produktiver Legacy-Adapter oder
  Gate auf ein nicht existentes `legacy/`-Verzeichnis bleibt.
- Commit: `refactor(ai): align public and current-state boundaries`

Ergebnis:

- `PracticalTacticBenchmark` ist aus `@netgrid/ai` entfernt und über
  `@netgrid/ai/simulation` erreichbar; das Public-Gate verbietet nun
  fail-closed Exporte aus `evaluation/` oder `simulation/` in der
  Default-Fassade.
- Obsolete Legacy-Entrypoint-Routingtests und die nicht mehr existierende
  `legacy/`-Platzierung sind entfernt. Historische Evidence darf nur als
  unveränderliche Regression-Fixture fortbestehen.
- Die produktive öffentliche No-Progress-Access-Ableitung liegt direkt in
  `access/access-outcome-memory.ts`. Der deprecated Parallelpfad unter
  `memory/` samt ausschließlich kompatibilitätsbezogenen Tests ist entfernt.
- Checks: Public Export, Module Boundaries, Access Outcome Memory und
  RunTargetEvaluation 114/114 grün; AI-Typecheck und `git diff --check` grün.
- Zusätzliche Regressionsevidence: TacticalPlans ist grün. Der isolierte Test
  `stops loading Broker when stored credits and runner pool are comfortable`
  ist auf Arbeitsbranch und unverändertem `main` identisch rot und damit
  vorbestehend. Er wird nicht durch Strukturarbeit umgedeutet. Removal
  Condition für das Final Gate: der separate Broker-Arbeitsstand ist in
  `main` integriert oder der Fall ist dort anderweitig fachlich grün.

### AISSO-2 – Ausführbares Source-Structure-Ratchet und Typvertragsgrenzen

- Ziel: erneutes Anwachsen oder neue Zyklen werden automatisch sichtbar.
- Arbeit: reproduzierbares AI-Source-Structure-Gate für Laufzeitzyklen,
  bekannte Typzyklen, Hotspot-Größen und Runtime-Root-Ratchet ergänzen;
  reine Contractmodule für kleine, eindeutig lösbare Typzyklen einführen.
- Kernartefakte: neues Script/Test, Root-Scriptverdrahtung und betroffene
  Contractmodule.
- Checks: Gate-Selbsttest oder negative Fixtures, Module-Boundary-Test,
  AI-Typecheck, `git diff --check`.
- Done-Gate: keine Laufzeitzyklen; Typzyklen sind entfernt oder mit enger
  Removal Condition ratcheted; keine neuen Großdateien oder Runtime-Root-
  Dateien können still hinzukommen.
- Commit: `test(ai): add source structure ratchet`

Ergebnis:

- `check:ai-source-structure` ist Teil des aktiven `check:ai`-Gates und prüft
  produktive Value-/Type-Importgraphen, ratcheted Hotspot- und Testgrößen sowie
  die Zahl produktiver Dateien direkt im Runtime-Root.
- Neue Laufzeitzyklen schlagen immer fehl. Das Gate akzeptiert nur die exakt
  benannten verbleibenden Type-SCCs und wird rot, sobald eine neue SCC entsteht
  oder eine bereits entfernte SCC als stale Ausnahme im Ratchet verbleibt.
- Der Simulation-Summary-/QualityMetrics-Vierzyklus ist über reine
  `doctrine-quality-types` und `quality-metric-types` vollständig entfernt.
- `TacticalGoalLike` besitzt einen eigenen Decision-Contract. Der frühere
  Dreizyklus ist auf den engeren `plan-portfolio`-/`tactical-plan-types`-
  Zweizyklus reduziert.
- Verbleibende exakt ratcheted Type-SCCs: Action-Semantik, RunTarget/Hand/Risk
  und PlanPortfolio/TacticalPlan. Removal Conditions: RunTarget im AISSO-5-
  Familienschnitt; PlanPortfolio beim AISSO-3-Plan-Mapping-Schnitt; Action-
  Semantik nur über eine eigene Contractextraktion, falls sie ohne breiten
  Consumer-Umbau in diesem Prozess sicher möglich ist.
- Checks: Structure-Gate und Selbsttest grün; sechs fokussierte Testdateien mit
  64/64 Tests grün; AI-Typecheck, Package-Boundaries und
  `git diff --check` grün.

### AISSO-3 – Semantic Choice Ranking nach Override-Familien zerlegen

- Ziel: der volatile Ranking-Kern wird zum kleinen Orchestrator.
- Arbeit: Runner-Run-, Runner-Development-/Survival-, Corp-Scoreline- und
  gemeinsame Plan-Mapping-Overrides in fachlich benannte Module unter
  `runtime/choice-ranking/` extrahieren; Exporte und Entscheidungskette
  unverändert halten; den 1-Datei-Test nach denselben Familien teilen.
- Kernartefakte: `runtime/semantic-choice-ranking.ts`, neue
  `runtime/choice-ranking/*`-Module und Tests.
- Checks: Choice-Ranking-, Decision-Chain-, Plan-Portfolio- und relevante
  Decision-Checkpoint-Tests, AI-Typecheck, Struktur-Gate, `git diff --check`.
- Done-Gate: Ranking-Orchestrator ist deutlich kleiner; Reihenfolge, Scores,
  Evidence und Entscheidungen bleiben durch bestehende Regressionen identisch.
- Commit: `refactor(ai): split semantic choice ranking families`

Ergebnis:

- `runtime/semantic-choice-ranking.ts` ist von 1.759 auf 535 Zeilen reduziert
  und bleibt als sichtbarer, reihenfolgetreuer Orchestrator erhalten.
- Corp-Overrides, Runner-Overrides, Mapping-Auswahl sowie gemeinsame
  Mapping-/Evidence-Verträge liegen in vier fachlich benannten Modulen unter
  `runtime/choice-ranking/`; kein neues Modul überschreitet 523 Zeilen.
- Der bisher 1.882 Zeilen große Testmonolith ist in Runner-, Corp- und
  Mapping-Suiten plus gemeinsamem Test-Support geteilt. Alle bisherigen 69
  Choice-Ranking-Fälle bleiben erhalten.
- Die PlanPortfolio-/TacticalPlan-Type-SCC ist über reine
  `plan-contract-types` und `plan-portfolio-types` entfernt. Das Gate erlaubt
  jetzt nur noch die zwei verbleibenden Type-SCCs Action-Semantik und
  RunTarget/Hand/Risk.
- Das Source-Structure-Ratchet wurde auf die neuen Dateigrößen abgesenkt und
  erkennt `*.test-support.ts` ausdrücklich als Testcode.
- Checks: fünf fokussierte Choice-/Plan-Suiten mit 148/148 Tests grün;
  AI-Typecheck, Structure-Gate und Selbsttest, Package-Boundaries sowie
  `git diff --check` grün.

### AISSO-4 – Corp-Scoreline, Board-Triage und Scoring-Window strukturieren

- Ziel: die drei größten Corp-Entscheidungsmodule besitzen eine gemeinsame,
  navigierbare Domänengrenze.
- Arbeit: bestehendes `runtime/corp-scoreline/` um reine Facts, Funding-/Rez-
  Assessment, Scoring-Window, Board-Triage und Score-Component-Familien
  erweitern; wiederholte Advancement-, Agenda-, Server- und Rules-Text-Helfer
  nur bei identischem Vertrag zusammenführen; Tests familienweise teilen.
- Kernartefakte: Corp-Score-, Triage-, Window-Module und Tests.
- Checks: vollständige Corp-Score-/Triage-/Window-Tests, Score-Conversion-
  Decision-Checkpoints, AI-Typecheck, Struktur-Gate, `git diff --check`.
- Done-Gate: keine der drei Orchestrator-Dateien bleibt ein mehrere tausend
  Zeilen großer Mischblock; Scorewerte und Evidence bleiben unverändert.
- Commit: `refactor(ai): organize corp scoreline runtime`

Ergebnis:

- Die drei bisherigen Corp-Hotspots sind von 3.817/3.689/1.719 auf
  807/792/248 Zeilen reduziert. Sie bleiben als schmale Orchestratoren und
  öffentliche Fassaden erhalten.
- Scoreline-Komponenten, Install-/ICE-Ökonomie, HQ-Druck, Zustandsfacts,
  Board-Triage-Policies und -Action-Facts sowie Scoring-Window-Projektion
  liegen unter `runtime/corp-scoreline/` in fachlich benannten Modulen. Die
  größte neue Einheit umfasst 2.275 Zeilen und bleibt unter dem generischen
  2.500-Zeilen-Gate.
- Reine Contracts für Corp-Score, Board-Triage und Scoring-Window verhindern
  Rückimporte in die Fassaden; der Laufzeitimportgraph bleibt zyklenfrei.
- Die drei großen Testsuiten sind in Score-/Scoreline, Triage-/Clock und
  Window-/Protection-Familien plus Test-Support geteilt. Die Ratchets wurden
  auf 3.796/3.313, 1.763/1.372 und 811/876 Zeilen abgesenkt.
- Checks: zehn vollständige Corp-Score-/Triage-/Window-/Score-Conversion-
  Suiten mit 221/221 Tests grün; AI-Typecheck, Structure-Gate und
  `git diff --check` grün.

### AISSO-5 – Visible Run Analysis als fachliche Modulgruppe schneiden

- Ziel: der hoch gekoppelte Run-Analyse-Owner wird ohne Consumer-Drift
  modularisiert.
- Arbeit: Contracts, Creditbudget, Hazard-/Trace-Projektion, Breakkosten und
  Path-Assessment unter `run-analysis/` trennen; Rootpfad nur als schmale
  interne Fassade erhalten, solange Consumer damit migrationsarm bleiben;
  RunTarget-/Risk-/HandDevelopment-Typzyklus auflösen; Tests teilen.
- Kernartefakte: `visible-run-analysis.ts`, neue `run-analysis/*`-Module,
  betroffene Consumer und Tests.
- Checks: Visible-Run-, RunTarget-, Risk-, Breaker- und Real-Engine-
  Regressionen, AI-Typecheck, Struktur-Gate, `git diff --check`.
- Done-Gate: keine Typzyklen in dieser Familie; Runquotes, Hazards und Kosten
  sind unverändert regressionsgeschützt.
- Commit: `refactor(ai): split visible run analysis domains`

Ergebnis:

- `visible-run-analysis.ts` ist von 2.464 auf 628 Zeilen reduziert und bleibt
  als bestehende Consumer-Fassade erhalten.
- Contracts, Creditbudget, Breaker-/Path-Projektion und sichtbare
  Trace-/Hazardbewertung liegen unter `run-analysis/`; das größte neue
  Produktionsmodul umfasst 837 Zeilen.
- RunTarget- und HandDevelopment-Verträge wurden in reine Typmodule
  extrahiert. Dadurch ist die fünfteilige RunTarget-/Hand-/Risk-Type-SCC
  vollständig entfernt; nur die bereits eng geratchete Action-Semantik-SCC
  bleibt übrig.
- Die bestehende Visible-Run-Testsuite ist bereits nach Known-Path,
  Server-ID, Breakkosten, Access-Erhalt, Deflector, Creditpools und Hazards in
  getrennte Describe-Familien gegliedert; ihr bestehender Importpfad bleibt
  unverändert.
- Checks: sechs fokussierte Visible-Run-/RunTarget-/Risk-/Breaker-/Real-
  Engine-Suiten mit 125/125 Tests grün; AI-Typecheck, Structure-Gate und
  Laufzeitzyklusprüfung grün.

### AISSO-6 – Runner Hand Development und Tests strukturieren

- Ziel: Handentwicklung trennt Contracts, Kartensignale, Persistent-Install-
  Bewertung und Orchestrierung.
- Arbeit: fachliche Module unter `runner/hand-development/` extrahieren;
  strukturierte Hints bleiben führend, bestehende Textfallbacks unverändert;
  Testmonolith nach Bewertung, Funding und Persistent-Install schneiden.
- Kernartefakte: `runner-hand-development.ts`, neue Module und Tests.
- Checks: HandDevelopment-, RunTarget-, TacticalPlan- und relevante
  Decision-Checkpoint-Tests, AI-Typecheck, Struktur-Gate, `git diff --check`.
- Done-Gate: kleine öffentliche/interne Fassade; keine Bewertungs- oder
  Evidence-Änderung.
- Commit: `refactor(ai): split runner hand development domains`

Ergebnis:

- `runner-hand-development.ts` ist von 2.650 auf 915 Zeilen reduziert und
  bleibt als bestehender Orchestrator sowie als Consumer-Fassade erhalten.
- Öffentliche Verträge, interne Bewertungsverträge, Kartentextsignale und die
  Persistent-Install-Bewertung liegen unter `runner/hand-development/` in
  fachlich benannten Modulen; das größte neue Produktionsmodul umfasst 1.407
  Zeilen.
- Strukturierte Hints bleiben unverändert führend. Die vorhandenen
  Textfallbacks wurden ohne neue Heuristiken in ein eigenes Signalmodul
  verschoben und werden von der Persistent-Install-Bewertung wiederverwendet.
- Der bisher 1.741 Zeilen große Testmonolith ist in eine 589 Zeilen große
  Basissuite und eine 911 Zeilen große Persistent-Install-Suite mit gemeinsamem
  Test-Support geteilt. Alle verschobenen Fälle bleiben erhalten.
- Die Source-Structure-Ratchets begrenzen die neue Fassade, beide extrahierten
  Produktionsmodule und beide Testsuiten auf ihre erreichten Größen.
- Checks: elf HandDevelopment-, RunTarget-, TacticalPlan-, Discard- und
  Search-Suiten mit 208/208 Tests grün; AI-Typecheck, Structure-Gate und
  Selbsttest, Package-Boundaries sowie `git diff --check` grün.

### AISSO-7 – Simulationsverträge neutralisieren und V143-Fixtures isolieren

- Ziel: Current-State-Benchmarks verwenden neutrale Verträge; historische
  V143-Namen bleiben höchstens bei echten Regression-Fixtures.
- Arbeit: generische Run-/League-/Gate-Typen und Runner neutral benennen;
  V143-spezifische Fixtures unter einem erkennbaren Regressionbereich
  isolieren; aktuelle Public-Simulation-Fassade bereinigen; Simulation-
  Typzyklus auflösen.
- Kernartefakte: `simulation.ts`, Simulation-Entrypoints, Benchmarktypen,
  V143-Fixtures und Tests.
- Checks: Simulation-Harness, Benchmark-, Fixture- und Public-Export-Tests,
  AI-Typecheck, Struktur-Gate, deterministischer kleiner Simulation-Smoke,
  `git diff --check`.
- Done-Gate: öffentliche und generische aktuelle Verträge tragen keine
  historische Controller-/Frameworkversion; echte Fixtures bleiben
  reproduzierbar.
- Commit: `refactor(ai): neutralize current simulation contracts`

### AISSO-8 – Restprüfung, Dokumentation und vollständiges Final Gate

- Ziel: Current-State-Dokumentation und ausführbarer Endstand stimmen überein.
- Arbeit: AI-README, Placement Guides, Prozessstatus und Final Review
  aktualisieren; verbleibende Hotspots und begründete Ausnahmen messen;
  aktuelles `main` defensiv in den Arbeitsbranch integrieren; Full Gate.
- Kernartefakte: AI-Architektur-README, Prozessartefakt, neuer Final Review.
- Checks: `corepack pnpm check:package-boundaries`, Struktur-Gate,
  `corepack pnpm check:ai`, `corepack pnpm check:ai:full`, AI-Typecheck,
  `corepack pnpm test:ai:shards`, Server-Typecheck, `git diff --check`.
- Done-Gate: alle Pakete dokumentiert und grün; Arbeitsbranch sauber und mit
  aktuellem `main` abgeglichen.
- Commit: `docs(ai): finalize source structure optimization`

## Verifikationsregeln

- Nach jedem Paket laufen paketnahe Tests, AI-Typecheck und
  `git diff --check`, soweit der Paketumfang sie betrifft.
- Tests mit Timeout oder abgebrochene Prozesse gelten nicht als bestanden.
- Strukturänderungen dürfen keine Snapshot-/Checkpoint-Erwartung still
  umschreiben, um Verhaltensdrift zu verstecken.
- Nur paketzugehörige Dateien werden gestaged.
- Jedes Paket erhält genau einen klaren Abschlusscommit; notwendige enge
  Reparaturcommits werden im Prozessstatus begründet.
- Der vollständige AI-Shard-Lauf und beide aktiven AI-Gates sind final Pflicht.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID` auf `main`.
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPTIMIZATION_2026_07`.
- Arbeitsbranch: `codex/ai-source-structure-optimization-2026-07`.
- Umsetzung ausschließlich im Arbeits-Worktree; Hauptworkspace nur für
  Prozessvorbereitung und finalen lokalen Merge.
- Fremde uncommitted Dateien und andere Worktrees werden nicht gestaged,
  verändert oder entfernt.
- Vor dem finalen Merge wird aktuelles lokales `main` in den Arbeitsbranch
  integriert und erneut verifiziert.
- Main-Merge bevorzugt Fast-Forward; kein Push.
- Nach erfolgreichem Merge werden der exakte Arbeits-Worktree und anschließend
  der vollständig gemergte Arbeitsbranch entfernt. Beide Entfernungen werden
  in Git und Dateisystem verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den AI Source Structure Optimization Process 2026-07 vollständig
und sequenziell von AISSO-0 bis AISSO-8 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissenspflichtseiten,
agents/release-implementation-agent.md, packages/ai/AGENTS.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_SOURCE_STRUCTURE_OPTIMIZATION_2026_07 auf Branch
codex/ai-source-structure-optimization-2026-07. Nutze den Hauptworkspace nur
für den finalen Merge. Stelle keine Zwischenfragen, solange konservative
automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket.
Aktualisiere das Prozessartefakt, führe Paketchecks aus und committe jedes
abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe
einen Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren,
lokal nach main mergen, main prüfen, den sauberen Arbeits-Worktree entfernen,
seine Entfernung in Git und Dateisystem verifizieren, den gemergten
Arbeitsbranch löschen und das Goal erst dann als complete markieren.
```

## Abschlusskriterien

- AISSO-0 bis AISSO-8 sind sequenziell abgeschlossen oder ein echter
  Sicherheitsblocker ist dokumentiert.
- Live-/Simulation-Public-Vertrag und Current-State-Guides stimmen überein.
- Priorisierte Choice-, Corp-, Run- und HandDevelopment-Hotspots besitzen
  fachliche Modulgrenzen und geteilte Tests.
- Keine Laufzeitzyklen; Typzyklen sind entfernt oder eng und ausführbar
  ratcheted.
- Full AI-Gates, AI-Shards, Package-Boundaries, AI- und Server-Typecheck sind
  grün.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree und gemergter Arbeitsbranch sind sicher entfernt und die
  Entfernung ist doppelt verifiziert.
- Es erfolgt kein Push.
