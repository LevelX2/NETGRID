# AI Source Structure Optimization Process 2026-07

Status: `prepared_for_execution`

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
