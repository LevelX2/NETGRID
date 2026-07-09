# AI Current-State Cleanup Prozess 2026-07-09

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerauftrag vom 2026-07-09, den vollständigen KI-Review-Befund mit dem Skill
`paketprozess-worktree-goal` direkt umzusetzen.

Der Review hat einen regeltechnisch stabilen, LegalActions-only laufenden
Semantic-Runtime-Pfad bestätigt, aber folgende Current-State-Schulden
festgestellt:

- irreführende beziehungsweise tautologische historische Benchmarkprofile;
- ein veraltetes, dadurch rotes Action-Semantic-Signal-Katalog-Gate;
- eine transitive Kopplung des öffentlichen AI-Pakets an Legacy-Baselines und
  die alten Corp-/Runner-Planer;
- einen generischen No-Candidate-Fallback, der verbleibende unbekannte
  LegalActions alphabetisch auswählen kann;
- strategische No-Progress-, Runner-Pressure- und Corp-Remote-/Central-
  Allokationsprobleme im aktuellen Strategy Panel;
- historische Shadow-/META-/Readiness-Codeinseln und einen sehr großen,
  Legacy-zentrierten Sammeltest;
- überholte Boundary-Ausnahmen und widersprüchliche Statusdokumentation.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Abarbeitung ausreichend
präzise. Der Endzustand, die betroffenen Schichten und die Sicherheitsgrenzen
sind aus Review, Workspace und aktueller Wissensbasis ableitbar.

Kleine Implementierungsdetails werden konservativ innerhalb der Pakete
entschieden. Ein Sicherheitsblocker liegt vor, wenn eine Entfernung nur durch
Hidden-Info-Zugriff, neue LegalAction-Erzeugung, nichtdeterministische Auswahl
oder einen fachlich beliebigen Ersatzpfad kompensiert werden könnte.

## Gesamtziel

Die produktive NETGRID-KI und ihre aktuelle Bewertungsinfrastruktur bilden nur
noch den realen Semantic-Runtime-Stand ab:

- Live-Runtime und Simulation sind als Paket- und Importgrenzen getrennt;
- produktive Root-Imports ziehen keine Legacy-Baseline oder alten Planer mehr;
- Benchmarks verwenden keine historischen Namen für den aktuellen Chooser und
  erzeugen keine tautologischen Defaultvergleiche;
- aktive AI-Gates sind grün und messen den aktuellen Datenstand;
- technische AI-Zulassung, semantische Abdeckung und Play-Strength-Readiness
  werden nicht miteinander verwechselt;
- der No-Candidate-Pfad ist fail-closed beziehungsweise auf eindeutig sichere,
  explizite Engine-Fortsetzungsaktionen begrenzt;
- bestätigte No-Progress-/Pressure-/Remote-Allokationsmuster sind mit
  generischen Runtime-Regeln und Regressionstests reduziert;
- ungenutzte Legacy-, Shadow-, META-, Readiness- und Testflächen sind entfernt;
- aktuelle Architektur-, Status- und Logartefakte beschreiben genau diesen
  Endzustand.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Ausgangscommit ist `cafa65287`.
- Arbeitsbranch ist `codex/ai-current-state-cleanup`.
- Arbeits-Worktree ist
  `C:\Projekte\NETGRID_AI_CURRENT_STATE_CLEANUP`.
- Die drei unversionierten Strategy-Panel-Berichte im Hauptworkspace gehören
  einem fremden Arbeitsstrang und werden nicht übernommen.
- Der parallele Worktree `codex/proteus-ai-release-reconciliation` besitzt die
  Proteus-spezifische Kartenfamilien-, Hint-, Szenario- und Deckpool-Arbeit.
  Dieser Prozess ändert nur generische AI-Support-/Gate-Verträge und integriert
  später den dann aktuellen `main`-Stand defensiv.
- Version 0 erlaubt das Entfernen historischer AI-Public- und
  Simulationsverträge ohne Rückwärtskompatibilität, sofern aktuelle Scripts,
  Serverpfade und Tests auf den neuen Current-State-Vertrag migriert werden.

## Nicht-Ziele

- keine Engine-Regeländerung;
- keine neue LegalAction-Erzeugung;
- keine Änderung an `applyAction`, Replay, StateHash oder Randomness;
- keine Erweiterung von PlayerViews oder Hidden-Info-Allowlisten;
- keine Proteus-spezifische Karten-ID-Sonderlogik;
- keine Proteus-Default-/Random-Pool-Promotion in diesem Arbeitsbranch;
- kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Die KI wählt ausschließlich aktuelle Engine-`LegalActions`.
- AI-Input bleibt auf side-sichere PlayerViews, erlaubte PublicEvents,
  LegalActions und ausdrücklich erlaubte Metadaten begrenzt.
- Kein Fallback darf eine von der KI nicht ausgewählte Ersatzaction im Server
  ausführen.
- Kein Benchmark darf zwei identische Controller als historischen
  Fortschrittsvergleich ausgeben.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Jedes Paket wird getestet, mit `git diff --check` geprüft und separat
  committed.

## Automatische Fehlerbehandlung

- Rote Tests werden paketlokal bis zur Ursache eingegrenzt.
- Veraltete historische Tests werden auf den aktuellen Vertrag migriert oder
  entfernt, nicht durch neue Legacy-Kompatibilität gerettet.
- Braucht eine aktuelle Simulationsmetrik einen kleinen Teil alter Planerlogik,
  wird die fachliche Diagnose in ein fokussiertes, semantisches Modul
  extrahiert.
- Strategische Änderungen werden nur behalten, wenn Safety-Gates grün bleiben
  und das feste Strategy Panel bei gleichen Seeds nicht schlechter wird.
- Neue `main`-Änderungen werden vor dem finalen Merge in den Arbeitsbranch
  integriert; Konflikte werden nach beiden fachlichen Intentionen gelöst.

## Sicherheitsblocker

Der Prozess stoppt mit Blocker-Report und Removal Condition, wenn:

- eine gewünschte Entscheidung nur mit verdeckten Gegnerdaten möglich wäre;
- eine benötigte Aktion nicht als Engine-`LegalAction` existiert;
- ein fail-closed Pfad ein Pflichtfenster ohne sichere legale Fortsetzung
  blockieren würde;
- die Entfernung alter Planer eine weiterhin aktive Produktfunktion ohne
  semantischen Ersatz beseitigen würde;
- parallele `main`-Änderungen denselben AI-Vertrag fachlich unvereinbar
  definieren.

## State Machine

```text
preflight -> process_artifact -> gates_and_support -> benchmark_truth
benchmark_truth -> package_boundary -> legacy_retirement
legacy_retirement -> fail_closed_fallback -> strategic_quality
strategic_quality -> historical_cleanup -> docs_and_full_verify
docs_and_full_verify -> integrate_main -> merge_main -> complete

any_package -> blocker
integrate_main -> blocker
```

## Paketfolge

1. `AICSC-0 Prozessartefakt und Preflight`
2. `AICSC-1 Aktuelle AI-Gates und Support-Wahrheit`
3. `AICSC-2 Wahrheitsgemäßer Benchmarkvertrag`
4. `AICSC-3 Live-/Simulations-Paketgrenze`
5. `AICSC-4 Legacy-Baseline- und Planer-Retirement`
6. `AICSC-5 Fail-closed Semantic-Coverage-Pfad`
7. `AICSC-6 Runner-/Corp-Strategiequalität`
8. `AICSC-7 Historische Shadow-/META-/Testflächen entfernen`
9. `AICSC-8 Dokumentation, Full Gate und Main-Integration`

## Fortschritt

- `AICSC-0`: `done` auf Commit `dfd8ef681`; Prozessartefakt, Goal, Branch und
  Worktree sind angelegt, der parallele Proteus-Scope ist abgegrenzt.
- `AICSC-1`: `done`; Signal-Katalog und Full-Derived-Facts-Inventar bilden
  616 aktive Hints ab, fehlende CardImplementations werden nicht mehr durch
  künstliche `__missing__`-Pfade als vorhanden gezählt, technische
  `ai_supported`-Zulassung ist ausdrücklich von semantischer Abdeckung und
  Play-Strength-Readiness getrennt. `check:ai` und `check:ai:full` sind grün.
- `AICSC-2`: `done`; ausführbare Benchmarkprofile sind auf den ehrlichen
  Random-Legal-Control und den aktuellen Semantic Candidate reduziert. Der
  Defaultvergleich ist `random_legal_bot` gegen `current_candidate`, alte
  V1.4-Profilnamen und zwei überholte Legacy-Paired-Gate-Scripts sind entfernt,
  aktuelle Diagnose-Scripts akzeptieren nur noch die beiden realen Modi.
- `AICSC-3`: `done`; `@netgrid/ai` exportiert nur noch Live-Verträge,
  Match-Simulation, Selfplay, Benchmarks und die vorläufig noch für AICSC-4
  benötigten Baseline-Selector liegen hinter `@netgrid/ai/simulation`.
  Server, Scripts und Tests verwenden die explizite Fassade; Export- und
  Boundarytests sichern die Trennung. Die Entfernung der intern noch von
  Simulationsdiagnostik referenzierten Legacy-Implementierung ist bewusst das
  unmittelbar folgende Retirement-Paket AICSC-4.
- `AICSC-4`: `done`; der transitive Live-Modulgraph ist durch ein ausführbares
  Boundary-Gate nachweislich frei von `legacy/`. Drei nur noch von den alten
  Corp-Planern gespeiste Selfplay-Diagnostikpfade sind entfernt; Tag-/Punish-
  Erkennung nutzt im Live-Pfad ausschließlich strukturierte Ontologie und
  aktuelle Hint-Rollen. Die beiden monolithischen V1.4-Planer-Testblöcke sind
  aus `index.test.ts` entfernt. Der nur noch simulations-/testseitige
  Legacy-Quarantänebestand wird zusammen mit den übrigen historischen
  Testflächen in AICSC-7 physisch gelöscht.
- `AICSC-5`: `done`; der Coverage-Fallback wählt nur noch eine explizite,
  nebenwirkungsarme Allowlist aus vorhandenen LegalActions. Opaque Karten-
  abilities, unbekannte Quellen und Choice-Aktionen ohne auflösbare Auswahl
  führen zu einem typisierten `SemanticCoverageFallbackError`, statt unter dem
  irreführenden Label `lowest_risk_deterministic` ausgeführt zu werden.
- `AICSC-6`: `pending`.
- `AICSC-7`: `pending`.
- `AICSC-8`: `pending`.

## Paketdetails

### AICSC-0 Prozessartefakt und Preflight

- Ziel: Scope, Sicherheitsgrenzen, Worktree und Paketfolge verbindlich machen.
- Eingangsvoraussetzungen: Projekt-/Agenten-/Skillregeln gelesen; fremde
  Hauptworkspace-Änderungen klassifiziert.
- Konkrete Arbeit: Worktree und Branch erstellen; dieses Artefakt anlegen;
  Ausgangsstatus und parallelen Proteus-Scope dokumentieren.
- Kernartefakte: dieses Prozessdokument.
- Tests/Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: sauberer Arbeits-Worktree, vollständiger Prozess, aktives `/Goal`.
- Commit: `docs(ai): define current-state cleanup process`.

### AICSC-1 Aktuelle AI-Gates und Support-Wahrheit

- Ziel: alle aktiven Root-AI-Gates auf dem aktuellen Datenstand grün machen und
  technische Zulassung von Abdeckungs-/Readiness-Signalen trennen.
- Eingangsvoraussetzungen: AICSC-0 committed.
- Konkrete Arbeit: Action-Semantic-Signal-Katalog deterministisch regenerieren;
  Driftursache testen; generische Summary-/Statusbegriffe so präzisieren, dass
  `ai_supported` keine vollständige Spielstärke behauptet; Proteus-spezifische
  PAI-Arbeit nicht duplizieren.
- Kernartefakte: `scripts/check-ai-action-semantic-signal-catalog.mjs`,
  zugehörige JSON-/Markdown-Berichte, fokussierte Gate-Tests.
- Tests/Checks: `corepack pnpm check:ai`, `corepack pnpm check:ai:full`,
  fokussierte Script-/Datenchecks.
- Done-Gate: beide aktiven AI-Gates grün; kein veralteter Report; offene
  No-Signal-/Target-Gaps bleiben explizit sichtbar.
- Commit: `fix(ai): align active gates with current support state`.

### AICSC-2 Wahrheitsgemäßer Benchmarkvertrag

- Ziel: keine identischen Controller mehr als historische Baseline und
  Kandidat ausgeben.
- Eingangsvoraussetzungen: AICSC-1 committed.
- Konkrete Arbeit: historische Controller-IDs und Defaultvergleiche entfernen
  oder in ausdrücklich aktuelle Absolute-/Random-Control-Messungen migrieren;
  aktuelle Qualitätspanels klar als Current-State-Diagnose kennzeichnen;
  Replay-/Golden-Fixtures statt lebender alter Planer als Regressionsevidence
  verwenden; Scripts, Datenprofile, Formatter und Tests nachziehen.
- Kernartefakte: `simulation/simulation-decision-context.ts`,
  Benchmarkprofile, Runner/Formatter, Scripts und Tests.
- Tests/Checks: fokussierte Simulation-/Benchmarktests, Typecheck, kleiner
  deterministischer Benchmark-Smoke.
- Done-Gate: Profilnamen entsprechen ihrem echten Controller; kein
  Default-A/B mit identischer Entscheidungsfunktion; deterministische Reports.
- Commit: `refactor(ai): make benchmark profiles current-state truthful`.

### AICSC-3 Live-/Simulations-Paketgrenze

- Ziel: Root-Importe der produktiven AI laden keine Simulation oder Legacy-
  Baseline transitiv.
- Eingangsvoraussetzungen: AICSC-2 committed.
- Konkrete Arbeit: öffentliche Live-Fassade und Simulations-Fassade trennen;
  `package.json`-Subpath definieren; Server-/Script-/Testimporte migrieren;
  Boundary-Gate für transitive Legacy-Freiheit ergänzen.
- Kernartefakte: `packages/ai/src/index.ts`, neue Simulations-Fassade,
  `packages/ai/package.json`, Server-/Scriptimporte, Exporttests.
- Tests/Checks: AI-/Server-Typecheck, Public-Export-/Boundarytests,
  Simulations-Smoke.
- Done-Gate: `@netgrid/ai` ist live-only; Simulation wird explizit importiert;
  Root-Modulgraph enthält keine Legacy-Baseline.
- Commit: `refactor(ai): split live runtime from simulation exports`.

### AICSC-4 Legacy-Baseline- und Planer-Retirement

- Ziel: alte Baseline-Scorer und V1.4-Planer vollständig aus aktiven Source-,
  Script- und Testpfaden entfernen.
- Eingangsvoraussetzungen: AICSC-3 committed.
- Konkrete Arbeit: weiterhin benötigte aktuelle Diagnosen in fokussierte
  semantische Module extrahieren; Legacy-Simulationsmodi und Public Contracts
  entfernen; alte Corp-/Runner-Planer, Scoring-Kompositionen, Kill-Switch und
  zugehörige Vergleichsscripts/-tests löschen.
- Kernartefakte: `packages/ai/src/legacy/**`, `simulation/**`, betroffene
  Scripts und Tests.
- Tests/Checks: Import-/Symbol-Gates, AI-Typecheck, Simulationtests, aktuelle
  Runtime-Regressionssuite.
- Done-Gate: kein produktiver oder aktueller diagnostischer Consumer der alten
  Planer; Legacy-Verzeichnis entfernt oder nur mit begründetem, nicht
  ausführbarem Fixture-Rest.
- Commit: `refactor(ai): retire legacy baseline and planners`.

### AICSC-5 Fail-closed Semantic-Coverage-Pfad

- Ziel: fehlende Semantic Choices dürfen keine beliebige unbekannte Action
  auswählen.
- Eingangsvoraussetzungen: AICSC-4 committed.
- Konkrete Arbeit: explizite sichere Pflicht-/Fortsetzungsfamilien definieren;
  generischen `lowest_risk_deterministic`-Pfad entfernen; bei ungedeckter
  nichttrivialer Action sichtbar ohne Ersatzentscheidung stoppen; Evidence und
  Serverintegration testen.
- Kernartefakte: `runtime/semantic-runtime.ts`, Shared-/Serververtrag nur falls
  nötig, AI-/Servertests.
- Tests/Checks: Choice-, Score-/Steal-, Run-, Access-, End-Turn- und
  unbekannte-Action-Regressionsfälle; Hidden-Info- und IllegalAction-Gates.
- Done-Gate: kein alphabetischer Catch-all; Pflichtfenster funktionieren;
  unbekannte semantische Lücken sind sichtbar und fail-closed.
- Commit: `fix(ai): fail closed on uncovered semantic actions`.

### AICSC-6 Runner-/Corp-Strategiequalität

- Ziel: die bestätigten Current-State-Stallmuster generisch reduzieren.
- Eingangsvoraussetzungen: AICSC-5 committed.
- Konkrete Arbeit: No-Progress-Wiederholungen, Runner-Pressure-Skips,
  Corp-Central-Overice bei Remote-Unterbau und unnötige Economy vor sicheren
  Scorefenstern anhand konkreter Decision Cases analysieren; kleine
  TacticalPlan-/Score-/Guard-Anpassungen samt Regressionen implementieren;
  festes Strategy Panel vor/nachher auswerten.
- Kernartefakte: fokussierte Runtime-/Planmodule, Regressionstests,
  aktueller verdichteter Quality-Report.
- Tests/Checks: feste Seeds und Deckslots; 0 IllegalActions, ReplayFailures und
  Timeouts; AI-Typecheck und fokussierte Tests.
- Done-Gate: harte Safety-Signale bleiben 0; Action-Limit- und No-Progress-
  Signale verschlechtern sich nicht und mindestens ein bestätigter Runner- und
  Corp-Treiber verbessert sich. Nicht kausale Diagnosezähler werden nicht
  blind auf null getunt.
- Commit: `fix(ai): reduce current strategic no-progress patterns`.

### AICSC-7 Historische Shadow-/META-/Testflächen entfernen

- Ziel: abgeschlossene Einmal-Prozessimplementierungen und Legacy-zentrierte
  Testlast aus dem aktiven Paket entfernen.
- Eingangsvoraussetzungen: AICSC-6 committed.
- Konkrete Arbeit: Controlled-Shadow-, Shadow-Readiness-, Semantic-Core-META-,
  Production-Readiness- und alte Scoring-Diagnostik-Inseln samt Einmal-
  Checkskripten löschen, sofern kein aktueller Consumer bleibt; `index.test.ts`
  in aktuelle fachliche Regressionen und kleine Fixtures zerlegen; ersetzte
  historische Assertions entfernen.
- Kernartefakte: historische Top-Level-AI-Module, zugehörige Tests/Scripts,
  `packages/ai/src/index.test.ts`.
- Tests/Checks: Import-/Referenzscan, AI-Typecheck, vollständiger AI-Testlauf,
  aktuelle Root-Gates.
- Done-Gate: keine unreferenzierte Shadow-/META-Codeinsel; keine nachgebaute
  Env-Legacy-Umschaltung; aktuelle Tests bleiben grün und klar geroutet.
- Commit: `refactor(ai): remove historical shadow and legacy test islands`.

### AICSC-8 Dokumentation, Full Gate und Main-Integration

- Ziel: Current-State-Wahrheit dokumentieren, final verifizieren und lokal
  integrieren.
- Eingangsvoraussetzungen: AICSC-7 committed.
- Konkrete Arbeit: aktuelle AI-README, Projektstatus, Wissensindex, Monatslog
  und verdichteten Final Review aktualisieren; ersetzte historische
  Status-/Notaus-Aussagen nach Retention-Regel entfernen; aktuelles `main` in
  den Arbeitsbranch integrieren; Konflikte defensiv lösen; Full Gate; Branch
  nach `main` mergen; Worktree entfernen.
- Kernartefakte: aktuelle Architektur-/Status-/Review-/Logseiten.
- Tests/Checks: `corepack pnpm check:ai:full`, AI-/Server-/Web-Typechecks,
  vollständiger AI-Testlauf, fokussierte Serverintegration, relevante
  Simulation, `git diff --check`.
- Done-Gate: Dokumentation widerspruchsfrei; Arbeitsbranch und `main` grün;
  Worktree entfernt; kein Push.
- Commit: `docs(ai): finalize current-state cleanup`.

## Verifikationsregeln

- Nach jedem Paket laufen die paketnahen Checks und `git diff --check`.
- Nur paketzugehörige Änderungen werden gestaged.
- Jeder Paketcommit hat eine eindeutige Message.
- Der vollständige AI-Testlauf ist mindestens nach AICSC-4, AICSC-7 und final
  Pflicht; langsam laufende Tests werden nicht als bestanden behauptet, wenn
  sie nur durch Timeout beendet wurden.
- Strategy-Panel-Vergleiche verwenden dieselben versionierten Decks, Seeds und
  Action-Limits.
- Report-/Datenartefakte werden nur versioniert, wenn sie aktuellen Gate-,
  Entscheidungs- oder Regressionsevidence-Wert haben.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID` auf `main`.
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_AI_CURRENT_STATE_CLEANUP`.
- Arbeitsbranch: `codex/ai-current-state-cleanup`.
- Der Hauptworkspace wird vor dem finalen Merge nicht beschrieben.
- Fremde uncommitted Dateien werden weder gestaged noch gelöscht.
- Vor dem finalen Merge wird aktuelles lokales `main` in den Arbeitsbranch
  integriert.
- Bevorzugter Main-Merge ist Fast-Forward; andernfalls wird der notwendige
  Merge-Commit begründet.
- Kein `reset --hard`, kein pauschales Revert und kein Push.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Current-State Cleanup vollständig und sequenziell von AICSC-0 bis AICSC-8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissenspflichtseiten, agents/release-implementation-agent.md, packages/ai/AGENTS.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_CURRENT_STATE_CLEANUP auf Branch codex/ai-current-state-cleanup.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- `@netgrid/ai` lädt nur Live-Runtime-/Current-State-Verträge.
- Simulation wird über einen expliziten Subpath konsumiert.
- Keine alten Corp-/Runner-Planer oder produktiv irrelevanten
  Legacy-Baselines bleiben ausführbar.
- Kein historisch benanntes Benchmarkprofil ruft still den aktuellen Chooser
  auf; kein tautologischer Defaultvergleich bleibt.
- `check:ai` und `check:ai:full` sind grün.
- Kein generischer alphabetischer Semantic-Coverage-Catch-all bleibt.
- Aktuelle strategische Safety-Gates bleiben bei 0 Fehlern; bestätigte
  No-Progress-Treiber sind regressionsgeschützt.
- Historische Shadow-/META-/Einmal-Codeinseln und Legacy-Testshims sind
  entfernt.
- Aktuelle Dokumentation und Statusseiten sind widerspruchsfrei.
- Alle Paketcommits liegen auf dem Arbeitsbranch, sind lokal nach `main`
  integriert, der Worktree ist entfernt und es erfolgte kein Push.
