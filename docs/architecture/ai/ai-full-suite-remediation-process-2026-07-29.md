# KI-Gesamttestsuite – sequenzieller Bereinigungsprozess

Status: **abgeschlossen**

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

| Paket | Status        | Inhalt                                                                                                                                     | Mindest-Gates                                                       |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| P00   | abgeschlossen | Prozess, `/Goal`, Grenzen und Paketfolge versionieren                                                                                      | Dokumentprüfung, `git diff --check`                                 |
| P01   | abgeschlossen | Gesamte Testsuite unverändert ausführen, alle roten Tests und gemeinsame Ursachen inventarisieren                                          | `corepack pnpm test`, reproduzierbare fokussierte Gegenläufe        |
| P02   | abgeschlossen | Executor-, Planabdeckungs-, Quote- und Diagnoseinvarianten generisch reparieren                                                            | fokussierte Unit-/Integrationstests, AI-Typecheck, Source-Structure |
| P03   | abgeschlossen | Corp-Score-, Schutz-, Defense-, Rez- und Economy-Ursachen beheben                                                                          | positive und negative Corp-Checkpoints, Hidden-Info-Gegenprobe      |
| P04   | abgeschlossen | Runner-Runrisiko-, Coverage-, Wiederholungs- und Sequenzursachen beheben                                                                   | positive und negative Runner-Checkpoints, Hidden-Info-Gegenprobe    |
| P05   | abgeschlossen | Nur nachweislich veraltete Testverträge aktualisieren und Lücken mit Gegenproben schließen                                                 | betroffene Tests plus benachbarte Suiten                            |
| P06   | abgeschlossen | Paketübergreifende Gates und vollständige Testsuite schließen; Review- und Wissensstand aktualisieren                                      | Typecheck, Struktur-/Vertragsgates, `corepack pnpm test`, Build     |
| P07   | abgeschlossen | Aktuelles `main` integrieren, dort vollständig verifizieren, Hauptinstanz über das Startscript aktualisieren und Worktree/Branch entfernen | Main-Gates, Server-SHA/Health, Git-/Dateisystem-Cleanup             |

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

| Bereich              | Ergebnis                                               |
| -------------------- | ------------------------------------------------------ |
| Shared               | 1/1 Dateien, 16/16 Tests grün                          |
| Catalog              | 3/3 Dateien, 20/20 Tests grün                          |
| Engine               | 209/209 Dateien, 1.820/1.820 Tests grün                |
| Decks                | 1/1 Dateien, 19/19 Tests grün                          |
| AI                   | 30 rote, 487 grüne Dateien; 80 rote, 4.153 grüne Tests |
| Web                  | 70/70 Dateien, 716/716 Tests grün                      |
| Server               | 1 rote, 22 grüne Dateien; 1 roter, 213 grüne Tests     |
| Root-Spezifikationen | 3/3 Dateien, 8/8 Tests grün                            |
| Test-Discovery       | vollständig grün                                       |

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

### P03 – Corp-Score, Defense, Rez und Economy

Wurzelursachen:

- Der Live-Adapter erzeugte für eine Agenda-Installation eine angeblich
  ausführbare „staged ETR uncertainty“, obwohl die aktuelle öffentliche
  Runner-Lage den späteren Zugriff nicht exakt ausschloss. Das exponierte
  Agenden hinter nominellem statt tatsächlich ausreichendem Schutz.
- Materialer oder akuter Zentraldruck war in der globalen Defense-Auswahl
  nicht stark genug an den ausgewählten Server gebunden. Gleichzeitig konnte
  eine threat-freie Ausweichzentrale gewählt oder ein bereits geschützter,
  leerer Remote weiter überbaut werden.
- Ein bereits installiertes, exponiertes Score-Projekt blieb hinter einer
  gleichrangigen zusätzlichen Zentral-Schicht zurück. Eine sichtbare Agenda
  im Archiv erzeugte ebenfalls keine eigenständige dringende Schutzklasse.
- Der Within-Class-Wert eines Parent-Funding-Plans stieg mit der Größe der
  Kreditlücke. Dadurch konnte ein weit entfernter Score-Supportpfad eine
  sofort konvertierbare Economy-/Punish-Aktion verdrängen.
- Mehrere historische Checkpoints verlangten weiterhin riskante
  Agenda-Installationen, pauschales Nicht-Rezzen oder ältere unspezifische
  Evidence, obwohl die neue exakte Route nachweislich sicherer oder
  produktiver ist.

Änderungen:

- Die Live-Runtime startet keine Agenda-Installation mehr allein aufgrund
  einer unsicheren späteren ETR-Annahme. Ein aktueller Score-Start braucht
  eine exakt tragfähige Schutzquote oder einen separat zertifizierten
  Same-Turn-/Opening-Rush-Pfad.
- Öffentliche, über Shell Trader beiseite gelegte Breaker fließen mit
  Memory-Fit und dem exakten nächsten Runner-Start-Rabatt in die
  Schutzbewertung ein. Der Gegenfall auf bereits laufender Runner-Seite
  behält die ungekürzten Installationskosten.
- Zentrale Verteidigung unterscheidet nun material, akut und terminal:
  Erstabdeckung und akuter Druck sind P3, terminaler Druck P2. Eine
  akut/terminal ausgewählte Zentrale bleibt gesperrt, solange der sichtbare
  finanzierte Zugriffspfad fortbesteht; threat-freie bereits geschützte
  Fallback-Zentralen und dritte leere Remote-Schichten verdrängen sie nicht.
- Ein exponiertes installiertes Score-Projekt erhält P3-Schutzdruck. Bei
  gleicher Klasse gewinnt dessen exakte aktuelle ICE-Installation gegen eine
  weitere Zentral-Schicht; terminaler Zentraldruck bleibt höher. Eine
  sichtbar im Archiv liegende Agenda erzeugt einen eigenständigen
  dringenden Archivschutz.
- Parent-Funding wird innerhalb derselben Klasse nach Nähe zur
  Ausführbarkeit bewertet: kleine Kreditlücken sind wertvoller als weit
  entfernte. Die vererbte P1–P4-Priorität bleibt unverändert.
- Qualitativ wirksames, Engine-zertifiziertes Encounter-ICE wird nicht mehr
  allein deshalb abgelehnt, weil es die exakte Access-Wahrscheinlichkeit
  nicht senkt. Ein gezielter einmaliger Schutz-Draw bleibt zulässig, wenn er
  nicht über das Handlimit führt; sein Turn-Receipt verhindert Wiederholung.
- Nur fachlich überholte Checkpoints wurden migriert. Positive Gegenproben
  erhalten Same-Turn-Score, terminale Zentralverteidigung, sichere Advances,
  leere-R&D- und fehlende-ICE-Fälle.

Ergebnis:

- Die ursprünglichen Corp-Cutover-, First-Turn-, R&D/HQ-Verteidigungs-,
  Shell-Trader-, Rez-, Economy-, EFA215-, 3bb14-, 7bfe-, 74e2369-, e2f2-,
  e676- und Rent-I-Con/CODE-ROT-Gruppen sind in ihren fokussierten
  Nachbarschaften grün.
- Letzte gemeinsame Corp-Abnahme: 10 Dateien, 74/74 Tests grün.
- Planmodul-/EFA-Abnahme einschließlich neuer Prioritätsgegenprobe:
  135/135 Tests grün.
- `@netgrid/ai`-Typecheck grün.
- AI-Source-Structure grün:
  `production=733`, `runtimeCycles=0`, `typeCycles=0`.
- `git diff --check` grün; keine produktive Karten-ID-Sonderbehandlung.

### P04 – Runner-Runfenster, Sequenzen und Coverage

Wurzelursachen:

- Die All-Nighter-Simulation band ihren Vertrag an zwei historische
  Action-Indizes. Der frühere Fast-Advance-Pfad spielt All-Nighter nach der
  verbesserten Corp-Entwicklung nicht mehr; der Hybrid-Pfad erzeugt das
  Engine-Grant-Fenster weiterhin deterministisch.
- Pirate Broadcast erzeugt seine korrekten R&D-/Archives-Folgefenster jetzt
  bei State 96 und 100. Der Test beendete die Simulation bereits nach 90
  Aktionen und meldete deshalb fälschlich fehlende Runtime-Coverage.
- Der Wilson-Test verlangte vier Run-Ziele einschließlich `remote_1`.
  Dieser Remote existiert im aktuellen Seed nicht mehr, weil die Corp keine
  unsichere Agenda installiert. Die Engine erzeugt korrekt genau einen
  Restricted-Run pro tatsächlich vorhandenem Server.
- Ein Runner-Checkpoint akzeptierte ausschließlich Sneak Preview, obwohl die
  Runtime mit Airport Locker einen legalen, exakt dem offenen
  Code-Gate-Breaker-Need zugeordneten Programmtutor auswählt. Der negative
  Cloak-Install bleibt weiterhin verboten.

Änderungen:

- All-Nighter sucht das echte deterministische Grant-Fenster über die
  Captures des positiven Hybrid-Seeds, statt einen historischen
  State-Index als fachlichen Vertrag zu behandeln.
- Der Pirate-Broadcast-Horizont umfasst die weiterhin reproduzierbaren
  R&D-/Archives-Sequenzbeine.
- Wilson prüft alle und nur die in der aktuellen PlayerView vorhandenen
  Server; Kostenprofil, Grant-Restmenge, Plan-Owner und Archives-Auswahl
  bleiben exakt abgesichert.
- Der Coverage-Checkpoint akzeptiert den exakten Tutorpfad bei unverändertem
  Plan, Capability und Evidence; die negative persistente Installation
  bleibt Gegenprobe.

Ergebnis:

- All-Nighter, Pirate Broadcast, Wilson und der Coverage-Checkpoint:
  4 Dateien, 7/7 Tests grün.
- Kein produktiver Runner-Code musste geändert oder durch
  Karten-ID-Sonderlogik ergänzt werden.

### P05 – Veraltete Verträge, Draw-Sequenzierung und Funding-Routen

Wurzelursachen:

- Mehrere Checkpoints und Corp-Cutover-Tests verlangten weiterhin die in P03
  entfernte Agenda-Installation auf Basis unsicherer späterer ETR-Annahmen.
  Die aktuelle Runtime verweigert diese Exposition korrekt und bindet
  stattdessen Schutzsuche oder sichere Liquidität an den Score-Parent.
- Ein gezielter Schutz-Draw durfte bei voller HQ sofort ausgeführt werden,
  obwohl eine exakte, sofortige Geldoperation mit drei verbleibenden Klicks
  die sichere Reihenfolge „konvertieren, ziehen, installieren“ ermöglichte.
  Der vermeintliche „exact same-turn capacity release“ war nur ein
  probabilistischer Treffer des noch unbekannten Draws.
- Der generische Funding-Router fand bei gleichwertigen Routen sowohl
  „stärkerer Karten-Credit zuerst“ als auch „Basiscredit zuerst“, entschied
  deren Reihenfolge am Ende aber alphabetisch nach Action-ID. So verlor
  Night Shift mit +2 Credits und Draw gegen den schwächeren Basiscredit.
- Historische Simulationshorizonte erwarteten einen Ambush-Install bereits
  als erste Corp-Aktion. Die aktuelle Corp deckt in diesem Seed stattdessen
  zuerst beide offenen Zentralen ab; ein separater späterer Positivseed
  beweist weiterhin die Ambush-Planabdeckung.

Änderungen:

- Die Draw-Admission darf eine produktive P4-Geldkonvertierung vor einer
  P3-Score-Schutzsuche sequenzieren, wenn HQ sonst überläuft und
  Konvertierung, Draw und anschließende Installation noch exakt in denselben
  Zug passen. P1/P2-Routen und Fälle ohne vollständigen Klickhorizont bleiben
  unberührt.
- Funding-Routen mit gleichem Status, Horizont, Gesamtklickaufwand,
  Schrittzahl, Zuverlässigkeit und Endcredits bevorzugen nun lexikografisch
  den größeren sofortigen Liquiditätsgewinn je Schritt. Action-IDs sind nur
  noch der letzte technische Tie-Breaker.
- Checkpoints akzeptieren einen einzelnen gebundenen Schutz-Draw nur dort,
  wo keine sofortige bessere Kartenverwertung die vollständige Sequenz
  erlaubt. Night Shift wird dagegen als exakte Economy-Konvertierung vor
  Basisliquidität abgesichert.
- Unsichere Corporate-War-, Tycho- und Black-Ice-QA-Install-Erwartungen
  wurden auf die nachweislich sichere Schutz- oder Economy-Route migriert.
  Purge-Gegenproben verbieten weiterhin wirkungslose Virus-Purges.
- Prioritätsassertionen unterscheiden jetzt P3 für ein bereits exponiertes
  Score-Projekt von P4 für einen noch strategischen, nicht exponierten
  Parent. Die Parent-/Need-Bindung bleibt jeweils explizit geprüft.

Ergebnis:

- Fokussierter Restcluster einschließlich Cutover, Corp-Triage, Funding,
  Draw-Admission, Purge, Score-Schutz, Rent-I-Con/CODE ROT, Fetal AI und
  Simulationsgegenproben: 15 Dateien, 121/121 Tests grün.
- Vollständige `@netgrid/ai`-Suite: 517/517 Dateien und 4.238/4.238 Tests
  grün.
- `@netgrid/ai`-Typecheck grün.
- AI-Source-Structure grün:
  `production=733`, `runtimeCycles=0`, `typeCycles=0`.
- `git diff --check` grün; produktiver Code bleibt frei von
  Karten-ID-Sonderbehandlungen.

### P06 – Paketübergreifende Gates und Gesamtabnahme im Worktree

Wurzelursachen:

- Der Server-Wartungstest meldete trotz erfolgreichem `VACUUM` keine
  physische Verkleinerung. Die SQLite-Verbindung arbeitet im WAL-Modus:
  `VACUUM` schrieb den kompakten Stand zunächst in die WAL-Datei, während
  `databaseSizeBytes()` noch die unveränderte Hauptdatei maß. Damit waren
  Integrität und logische Kompaktheit korrekt, aber die zurückgegebene
  physische Größen- und Freigabeinformation veraltet.
- Engine- und KI-Runtime enthielten noch einen toten historischen
  Source-Präfix für eine einzelne Advancement-Karte. Der aktuelle generische
  Vertrag verwendet `ChoiceRequest.continuation.family =
"corp_advancement_counter"` beziehungsweise die generischen
  Distribute-/Move-Advancement-Quellen; der alte Fallback war weder Erzeuger
  noch vollständiger Binder und verletzte nur noch das Architektur-Gate.
- Das abgeleitete Proteus-Readiness-Inventar führte für öffentlich gestufte
  Shell-Trader-Effekte noch 13 statt der aktuellen 15 generischen
  Effektbelege. Die Runtime war bereits korrekt; nur das generierte Inventar
  war veraltet.

Änderungen:

- Nach `VACUUM` und `PRAGMA optimize` führt die Storage-Wartung
  `PRAGMA wal_checkpoint(TRUNCATE)` aus. Integritätsprüfung und
  Größenmessung sehen damit denselben dauerhaft geschriebenen Stand.
- Der ungenutzte kartenbezogene Advancement-Source-Fallback wurde in Engine
  und KI entfernt. Die generische Continuation- und Source-Bindung bleibt
  vollständig getestet.
- Card-Function-Abstraction-Report und Proteus-Readiness-Inventar wurden mit
  den vorhandenen Generatoren aktualisiert. Der Abstraction-Baselinewert
  sinkt exakt um den entfernten Runtime-Fund; das Readiness-Inventar ändert
  semantisch nur die Shell-Trader-Effektzahl von 13 auf 15.
- Das Changed-Format-Gate hat ausschließlich die 18 bereits auf diesem
  Arbeitsbranch geänderten Dateien mechanisch formatiert.

Ergebnis:

- Vollständiger Produktions-Build grün.
- Vollständige Root-Testsuite grün:
  Shared 16/16, Catalog 20/20, Engine 1.820/1.820, Decks 19/19,
  AI 4.238/4.238, Web 716/716, Server 214/214 und
  Root-Spezifikationen 8/8.
- Test-Discovery deckt jede physische Paket-Testdatei ab.
- Root-Typecheck, Root-Lint, AI-Vertrags-, Hint-, Economy-,
  Action-Capacity- und Approval-Gates grün.
- AI- und Engine-Source-Structure ohne Runtime- oder Typzyklen; Engine-
  Architektur-, Credit-Gain-, Package-Boundary-, Card-Function-Abstraction-,
  Proteus-Readiness- und Proteus-Family-Scenario-Gates grün.
- `format:changed` und `git diff --check` grün.

### P07 – Integration, Main-Abnahme und lokaler Abschluss

Integration:

- Der seit Prozessstart hinzugekommene lokale `main`-Commit
  `abeadcca6` mit der kompakten öffentlichen Spieleansicht wurde zuerst in
  den Arbeitsbranch integriert. Der kombinierte Stand wurde anschließend
  per Fast-forward lokal nach `main` übernommen.
- Der fremde detached Baseline-Worktree und der parallel geführte
  `codex/ai-match-f809-rd-defense`-Worktree blieben unangetastet.
- Während der Main-Abnahme entstandene fremde Web- und Wissensänderungen
  wurden weder formatiert noch gestaged oder committed.

Main-Abnahme:

- Vollständige Root-Testsuite grün:
  Shared 16/16, Catalog 20/20, Engine 1.820/1.820, Decks 19/19,
  AI 4.238/4.238, Web 720/720, Server 214/214 und
  Root-Spezifikationen 8/8.
- Test-Discovery, Produktions-Build, Root-Typecheck und Root-Lint grün.
- AI-Hint-, Source-Structure-, Economy-, Action-Capacity- und
  Approval-Consistency-Gates grün.
- Engine-Architektur-, Engine-Source-Structure-, Credit-Gain-,
  Package-Boundary-, Card-Function-Abstraction-, Proteus-Readiness-,
  Readiness-Inventory- und Family-Scenario-Gates grün.
- Das zunächst rote `format:changed` war kein Quellcodefehler: Der
  absichtlich zeitgestempelte lokale E2E-Buildpfad `.next-e2e-*` war nicht
  als generiertes Artefakt ignoriert und wurde deshalb als 150 unversionierte
  Prettier-Eingaben erfasst. `apps/web/.next-e2e-*/` ist nun generisch
  ignoriert; der vorhandene Nutzerordner blieb unverändert. Danach waren
  `format:changed` und `git diff --check` grün.

Cleanup und Laufzeit:

- Der eigene saubere Worktree
  `C:\Projekte\NETGRID_AI_FULL_SUITE_REMEDIATION` und der vollständig
  integrierte Branch `codex/ai-full-suite-remediation` wurden entfernt.
- Die lokale Hauptinstanz wird nach dem Abschluss-Commit ausschließlich aus
  dem primären `main`-Checkout über `scripts/start-netgrid.ps1` neu gestartet
  und anschließend gegen den finalen `main`-SHA und die Health-Endpunkte
  geprüft.
