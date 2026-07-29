# KI-Gesamttestsuite – sequenzieller Bereinigungsprozess

Status: **aktiv**

Stand: 2026-07-29

Arbeitsbranch: `codex/ai-full-suite-remediation`

Worktree: `C:\Projekte\NETGRID_AI_FULL_SUITE_REMEDIATION`

## /Goal

Die gesamte NETGRID-Testsuite wird auf dem aktuellen Plan-first-Stand
reproduzierbar ausgeführt und vollständig bereinigt. Jeder Fehler wird nach
seiner gemeinsamen Wurzelursache klassifiziert. Generische Runtime-,
Planmodul-, Executor-, Testinfrastruktur- oder Diagnosefehler werden im Sinne
einer regelkonformen und gut spielenden KI behoben. Eine bestehende
Testerwartung wird nur geändert, wenn eine Positivprobe, ein Gegenfall und der
aktuelle Architekturvertrag belegen, dass das heutige Verhalten fachlich
besser und der Test veraltet ist. Einzelkarten- oder Match-IDs dürfen nur
Tests und reproduzierbare Checkpoints präzisieren; produktive Freischaltungen
bleiben generisch.

## Verbindliche Grenzen

- Die Rules Engine bleibt einzige Regelautorität; die KI wählt ausschließlich
  vorhandene `LegalActions`.
- KI-Eingaben, Diagnostik und Tests bewahren den Hidden-Info-Vertrag.
- Kein freier Credit-, Draw-, Run- oder EndTurn-Fallback kaschiert fehlende
  Planabdeckung, unbekannte Assessments oder Executorfehler.
- `assessment_unknown` blockiert nur seinen unbewiesenen Pfad und niemals
  eine unabhängig exakt gebundene produktive Route.
- Corp-ICE-Allokation und Rez-Entscheidungen bleiben Eigentum von
  `corp.defend_servers`; Score-, Remote- und Economy-Pläne delegieren nur
  exakte Needs und Parentbindung.
- Agenda-Install, Advance und Score bleiben Phasen derselben exakten
  `corp.score_agenda`-Instanz.
- Runner-Run-, Access-, Pump-, Break- und Jack-out-Routen benötigen weiterhin
  ein positives planlokales Assessment.
- Es entstehen keine produktiven Abfragen nach konkreter Karten-ID.
- Umfangreiche Rohdaten bleiben lokal und werden nicht versioniert.

## Fehlerklassifikation

Jeder rote Test erhält genau eine primäre Klasse:

1. **Runtimefehler:** Die gewählte oder fehlende Aktion verletzt den aktuellen
   fachlichen Plan-first-Vertrag oder führt nachweislich zu schlechterem Spiel.
2. **Infrastruktur-/Diagnosefehler:** Executor-, Quote-, Planattributions-,
   Fixture- oder Auswertungsvertrag ist inkonsistent, ohne dass die
   gewünschte Spielentscheidung falsch sein muss.
3. **Veralteter Testvertrag:** Die Runtime wählt nachweislich die bessere
   legale Aktion; Positiv- und Gegenprobe schützen den neuen Vertrag.
4. **Nichtdeterminismus:** Derselbe Seed und dieselben side-sicheren Inputs
   führen nicht reproduzierbar zu derselben Entscheidung oder Evidence.

Ein Test wird nicht allein deshalb aktualisiert, weil eine andere Aktion
gewählt wird. Rohscores allein entscheiden ebenfalls keine Klassifikation.

## Sequenzielle Pakete

| Paket | Status | Inhalt | Mindest-Gates |
| --- | --- | --- | --- |
| P00 | abgeschlossen | Prozess, `/Goal`, Grenzen und Paketfolge versionieren | Dokumentprüfung, `git diff --check` |
| P01 | abgeschlossen | Gesamte Testsuite unverändert ausführen, alle roten Tests und gemeinsame Ursachen inventarisieren | `corepack pnpm test`, reproduzierbare fokussierte Gegenläufe |
| P02 | abgeschlossen | Executor-, Planabdeckungs-, Quote- und Diagnoseinvarianten generisch reparieren | fokussierte Unit-/Integrationstests, AI-Typecheck, Source-Structure |
| P03 | aktiv | Corp-Score-, Schutz-, Defense-, Rez- und Economy-Ursachen beheben | positive und negative Corp-Checkpoints, Hidden-Info-Gegenprobe |
| P04 | ausstehend | Runner-Runrisiko-, Coverage-, Wiederholungs- und Sequenzursachen beheben | positive und negative Runner-Checkpoints, Hidden-Info-Gegenprobe |
| P05 | ausstehend | Nur nachweislich veraltete Testverträge aktualisieren und Lücken mit Gegenproben schließen | betroffene Tests plus benachbarte Suiten |
| P06 | ausstehend | Paketübergreifende Gates und vollständige Testsuite schließen; Review- und Wissensstand aktualisieren | Typecheck, Struktur-/Vertragsgates, `corepack pnpm test`, Build |
| P07 | ausstehend | Aktuelles `main` integrieren, dort vollständig verifizieren, Hauptinstanz über das Startscript aktualisieren und Worktree/Branch entfernen | Main-Gates, Server-SHA/Health, Git-/Dateisystem-Cleanup |

Es ist immer genau ein Paket aktiv. Paketgrenzen dürfen nach P01 nur dann
verfeinert werden, wenn die Baseline mehrere unabhängige Wurzelursachen
belegt; jede Änderung wird vor der Umsetzung hier dokumentiert.

## Paketabnahme

Für jedes Paket gilt:

1. Ausgangsfehler oder Vertragslücke reproduzieren.
2. Wurzelursache im fachlichen Owner beheben.
3. Mindestens eine Positivprobe und einen relevanten Gegenfall ausführen.
4. Keine unabhängigen Testfehler in derselben Nachbarsuite neu erzeugen.
5. `git diff --check` ausführen.
6. Ergebnis und Reststatus in diesem Artefakt dokumentieren.
7. Ausschließlich den Paketumfang committen.

## Abschlusskriterien

Das `/Goal` ist erst erreicht, wenn:

- die vollständige Root-Testsuite ohne übersprungene Fehler grün ist;
- alle aktiven Projektgates einschließlich Typecheck, Struktur,
  Hidden-Info-/Authority-Verträgen und Build grün sind;
- keine Erwartung ohne fachlichen Nachweis bloß auf die aktuelle Ausgabe
  umgeschrieben wurde;
- der integrierte `main`-Stand erneut vollständig verifiziert ist;
- die lokale Hauptinstanz exakt diesen `main`-SHA meldet;
- eigener Worktree und gemergter Arbeitsbranch nachweislich entfernt sind;
- fremde Worktrees und Nutzerartefakte unverändert geblieben sind.

## Ausführungschronik

### P00 – Prozessstart

- 2026-07-29: Wiki-, Rollen-, AI-Architektur- und Plan-first-Verträge gelesen.
- 2026-07-29: Nutzerartefakt
  `apps/web/.next-e2e-1785273470251/` und fremden detached Baseline-Worktree
  als unberührten Fremdumfang klassifiziert.
- 2026-07-29: Isolierten Worktree und Branch auf `57cc652a3` angelegt.
- 2026-07-29: Prozessartefakt mit Commit `dad231252` abgeschlossen.

### P01 – Unveränderte Gesamtbaseline

Ausgeführt:

```text
corepack pnpm test
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/web test
corepack pnpm check:test-discovery
corepack pnpm exec vitest run tests/specs --passWithNoTests
```

Der Root-Lauf arbeitet die Workspace-Pakete sequenziell ab und brach
vertragsgemäß am roten AI-Paket ab. Deshalb wurden Server, Web,
Test-Discovery und Root-Spezifikationen ergänzend isoliert ausgeführt.

| Bereich | Ergebnis |
| --- | --- |
| Shared | 1/1 Dateien, 16/16 Tests grün |
| Catalog | 3/3 Dateien, 20/20 Tests grün |
| Engine | 209/209 Dateien, 1.820/1.820 Tests grün |
| Decks | 1/1 Dateien, 19/19 Tests grün |
| AI | 30 rote, 487 grüne Dateien; 80 rote, 4.153 grüne Tests |
| Web | 70/70 Dateien, 716/716 Tests grün |
| Server | 1 rote, 22 grüne Dateien; 1 roter, 213 grüne Tests |
| Root-Spezifikationen | 3/3 Dateien, 8/8 Tests grün |
| Test-Discovery | vollständig grün |

Die 30 roten AI-Dateien sind:

```text
semantic-ai-runtime-cutover-corp.test.ts
semantic-ai-runtime-cutover-runner-plans.test.ts
runner-golden-deck-debug.test.ts
runtime/corp-scoreline/semantic-runtime-corp-board-triage-central.test.ts
known-ice-run-risk.test.ts
evaluation/decision-contract-real-engine.test.ts
runner-wilson-run-action.test.ts
evaluation/decision-checkpoints/manhunt-execution-refinement-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-five-game-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/latest-two-corp-match-remediation-decision-checkpoints.test.ts
runtime/runner-hq-repeat-run-score.test.ts
evaluation/decision-checkpoints/match-3bb14-corp-draw-near-tie-decision-checkpoints.test.ts
evaluation/decision-checkpoints/manhunt-coup-selfplay-decision-checkpoints.test.ts
runtime/runner-rnd-repeat-run-score.test.ts
evaluation/decision-checkpoints/match-e676-decision-checkpoints.test.ts
simulation/proteus-pirate-broadcast-run-sequence-coverage.test.ts
evaluation/decision-checkpoints/match-7bfe-decision-checkpoints.test.ts
evaluation/decision-checkpoints/match-e2f2-corp-decision-windows-remediation-decision-checkpoints.test.ts
simulation/all-nighter-restricted-run-window-coverage.test.ts
evaluation/decision-checkpoints/match-3bb14-corp-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/baseline-seed03-seed05-loop-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-ten-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/match-74e2369-corp-regression-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-six-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-two-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-three-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-five-remediation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/corp-ineffective-virus-purge-decision-checkpoints.test.ts
evaluation/decision-checkpoints/baseline-seed02-effect-activation-decision-checkpoints.test.ts
evaluation/decision-checkpoints/renticon-code-rot-cycle-nine-remediation-decision-checkpoints.test.ts
```

#### Wurzelcluster

1. **Exakte Disposition gegen historische Diagnoseform:** Die Runtime liefert
   bei mehreren korrekt verworfenen Runner- und Corp-Routen die aktuelle
   autoritative Form
   `explicitly_nonproductive:<module>:<reason>`. Ältere Tests verlangen
   weiterhin `candidate_plan_evidence`, `candidate_plan_blocker` oder
   `not_selected_by_plan`. Die alte Form darf nicht wieder zur
   Auswahlautorität werden. Wo der neue Eintrag fachliche Details wie
   sichtbare ICE-Gefahr, Wilson-Spend-Limit oder Trace-Art verliert, muss die
   generische Disposition diese Detail-Evidence zusätzlich bewahren.
2. **Corp-Score-/Defense-Arbitration:** Ein großer Teil der Checkpoints fällt
   auf `corp.gain_credit`, eine andere Defense-Route oder Targeted Draw
   zurück, obwohl ein exakt gebundener Score-, Schutz- oder
   Economy-Supportpfad erwartet wird. Besonders häufig sind
   `corp_score_protection_funding_gap`,
   `score_plan_requires_effective_ice_draw` und
   `engine_certified_global_defense_access_probability_reduced`.
3. **Executor-Invariante:** Fünf reproduzierbare Zustandsgruppen enden in
   `PlanResolutionFailure: executor_invariant_broken`. Der Portfolio-Owner
   meldet dabei `actions=none`; das ist ein struktureller Fehler und darf
   nicht durch eine Ersatzaktion kaschiert werden.
4. **Runner-Runfenster und Capture-Fixtures:** All-Nighter und Pirate
   Broadcast erreichen in den gespeicherten Sequenzen nicht mehr die vom
   Test angenommenen Entscheidungspunkte. Es ist getrennt zu prüfen, ob die
   produktive Continuation verloren ging oder die Simulation inzwischen
   vorher legal anders endet.
5. **Öffentlich erreichbarer Breaker:** Ein Shell-Trader-Fall erkennt den
   staged Breaker grundsätzlich, verliert aber den erwarteten installierbaren
   Drei-Credit-Kostenbeleg. Kostenreduktion und vollständige Bezahlbarkeit
   müssen am öffentlichen Staging-Vertrag geprüft werden.
6. **Server-SQLite-Vertrag:** `VACUUM` liefert im synthetischen Test
   `afterBytes === beforeBytes`; der Test verlangt strikt `<`. Zu klären ist,
   ob die Produktionsfunktion physische Schrumpfung verspricht oder sichere
   Kompaktheit bei bereits minimaler Seitenzahl.

Die Rohlogs liegen ausschließlich lokal unter `data/local/` und werden nicht
versioniert.

### P02 – Executor und exakte Dispositionsdiagnostik

Wurzelursachen:

- `resident-plan-portfolio` setzte „residente Kindinstanz vorhanden“ mit
  „aktives Supportkind ist Leaf-Executor“ gleich. Dadurch konnte ein aktuell
  wieder ausführbarer Parent nicht handeln, obwohl der Scheduler das frühere
  oder für den aktuellen Need inaktive Kind korrekt nicht ausgewählt hatte.
- Eine exakte `explicitly_nonproductive`-Disposition ersetzte in
  `actionAlternatives.whyNot` sämtliche ergänzende residente Plan-,
  Runrouten- und Action-Assessment-Evidence. Die Entscheidung blieb richtig,
  verlor aber sichtbare Gründe wie ICE-Gefahr, Known-Low-Payoff oder Wilson-
  Spend-Limit.
- Einzelne Regressionstests verlangten noch die frühere unspezifische Form
  `not_selected_by_plan`, obwohl die Action inzwischen autoritativ und exakt
  dispositioniert wird.

Änderungen:

- Der Portfolio-Kernel prüft weiterhin genau einen ready Executor, aber nicht
  mehr die bloße Existenz inaktiver Kinder. Ob ein Supportkind aktiv ist,
  bleibt beim aktuellen Assessment, der exakten `parentNeedId`-Bindung und
  der Schedulerwahl.
- Neuer Gegenfall: Ein ready Parent darf mit einem residenten Kind ohne
  aktiven Need Executor sein; das Kind bleibt idle im Background.
- Exakte Dispositionen behalten ihren autoritativen ersten Grund und führen
  zusätzlich die zugehörige residente Plan-, Runrouten- und
  Action-Assessment-Evidence.
- Betroffene Tests prüfen den aktuellen exakten Dispositionsvertrag. Wo eine
  Action eine weiterhin echte ungewählte Planroute bleibt, ist
  `not_selected_by_plan` weiterhin zulässige Diagnose und keine
  Auswahlautorität.

Ergebnis:

- Alle fünf ursprünglichen `executor_invariant_broken`-Gruppen erreichen nun
  die normale fachliche Decision-Checkpoint-Auswertung.
- Runner-Diagnose-, Known-ICE-, Wilson-, Repeat-Run-, Real-Engine-,
  Portfolio- und Scheduler-Nachbarschaft: 11 Dateien, 270/270 Tests grün.
- `@netgrid/ai`-Typecheck grün.
- AI-Source-Structure grün:
  `production=733`, `runtimeCycles=0`, `typeCycles=0`.
- Im Corp-Cutover verbleiben acht fachliche Score-Start-Fehlentscheidungen;
  sie sind bewusst nicht durch den Kernel-Fix kaschiert und gehen in P03.
