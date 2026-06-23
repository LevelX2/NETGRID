# AI Semantic Architecture Completion Ledger 2026-06-23

## Status

`IN_PROGRESS`

Branch: `codex/ai-semantic-architecture-completion`

Worktree: `C:\Projekte\NETGRID_AI_SEMANTIC_ARCHITECTURE_COMPLETION`

Start-Commit: `670944b57a9497c969bd54a26e578b37886ec758`

## Controller-Regeln

- Zulässige Zielstatus: `PENDING`, `IN_PROGRESS`, `VERIFIED`, `HARD_BLOCKED`.
- Kein In-Scope-Ziel wird als Folgeauftrag verschoben.
- Neue In-Scope-Findings werden in dieses Ledger aufgenommen und bearbeitet.
- Abschluss ist erst nach zwei vollständigen Audits ohne neue In-Scope-Findings erlaubt.
- Die KI bleibt LegalActions-only; Engine, `applyAction`, Replay, StateHash, Randomness und Hidden-Info-Verträge bleiben Regelautorität beziehungsweise Sicherheitsgrenzen.

## Ausgangsmetriken

| Metrik | Ausgang |
| --- | ---: |
| `packages/ai/src/index.ts` | 35172 Zeilen |
| `packages/ai/src/tactical-plans.ts` | 3945 Zeilen |
| `packages/ai/src/legacy/runner-plans.ts` | 8479 Zeilen |
| `packages/ai/src/legacy/corp-plans.ts` | 9307 Zeilen |
| `packages/ai/src/deck-doctrine.ts` | 287 Zeilen |
| `packages/ai/src/deck-capabilities.ts` | 936 Zeilen |
| Semantische Module mit Legacy-/LegacyDecision-Treffern | PENDING Messauswertung |
| Produktive `action.label`-/Regex-/Titel-Treffer | PENDING Messauswertung |
| Action-Type-Scoreverwendungen | PENDING Messauswertung |
| Legacy-Fallback-Rate | PENDING Messauswertung |
| ActionSemanticCandidate-Coverage | PENDING Messauswertung |
| TargetProfile-/TargetConstraint-Coverage | PENDING Messauswertung |
| WhyNot-Abdeckung | PENDING Messauswertung |

## Baseline-Checks

| Check | Status | Evidenz |
| --- | --- | --- |
| `corepack pnpm install` | `VERIFIED` | Lockfile unverändert; Worktree-Abhängigkeiten installiert. |
| `corepack pnpm --filter @netgrid/ai typecheck` | `VERIFIED` | grün. |
| `git diff --check` | `VERIFIED` | grün. |
| `corepack pnpm --filter @netgrid/ai test` | `VERIFIED` | Nach `AI-COMPLETE-F001`: 134 Dateien, 1541 Tests grün. |

## Startziele

| ID | Ziel | Status | Ausgangsevidenz | Definition of Done |
| --- | --- | --- | --- | --- |
| AI-COMPLETE-01 | Produktive Action-Type-Priorität entfernen. | `VERIFIED` | `semanticRuntimeTypePriority` war produktiver Scorebestandteil in `semanticRuntimeScoreBreakdown`. | Erfüllt: produktiver Score nutzt nur noch `semanticRuntimeTypeTieBreakerScore`; Tag-Removal, Coverage-Search, kartenbasierter Draw, Run-only-Aktionen und erreichbare Runs erhalten fachliche Goal-Fit-Komponenten; Pflichtszenarien und voller AI-Testlauf sind grün. |
| AI-COMPLETE-02 | Semantic Runtime von Legacy-Entscheidung entkoppeln. | `VERIFIED` | Runtime-Pfade enthielten `legacyDecision` als vorab berechnete Eingabe. | Erfüllt: Runner-/Corp-Einstiege übergeben einen memoisierten Legacy-Provider; die Runtime materialisiert Legacy nur bei Forced-Legacy, No-Candidate-Fallback oder nach der semantischen Auswahl für Diagnose/Comparator. |
| AI-COMPLETE-03 | `packages/ai/src/index.ts` entkernen. | `IN_PROGRESS` | 35172 Zeilen, viele Runtime-/Scoring-/Debug-/Benchmark-Verantwortungen. | Dünne Public-/Composition-Fassade; Boundary-Test verhindert neue Fachlogik. |
| AI-COMPLETE-04 | `tactical-plans.ts` real aufteilen. | `PENDING` | 3945 Zeilen mit Runner/Corp/Mapping/Progression/Debug/Labelpfaden. | Runner, Corp, Mapping, Progression, Ranking und Debug fachlich getrennt; Fassade dünn. |
| AI-COMPLETE-05 | Legacy kontrolliert migrieren, einfrieren und abbauen. | `PENDING` | Legacy-Planer zusammen 17786 Zeilen; Adapter und Fallbacks aktiv. | Genau eine Legacy-Eingangsschnittstelle; Matrix klassifiziert alle Nutzungen; ersetzte/ungenutzte Bereiche entfernt. |
| AI-COMPLETE-06 | Productive DeckDoctrine vereinheitlichen. | `PENDING` | Alte Doctrine/PlanWeight-Begriffe existieren neben neuen Profilen. | Produktiver Pfad nutzt klare Doctrine-Schnittstelle mit NeutralDoctrine, Vollständigkeit und Rollenstatus. |
| AI-COMPLETE-07 | Runner-TacticalGoals produktiv vollständig integrieren. | `PENDING` | Runner-Zielmodule existieren, Integration und Coverage werden geprüft. | Runner-Ziele entstehen aus Doctrine, Capabilities und Boardstate und wirken im Hauptscore. |
| AI-COMPLETE-08 | Corp-TacticalGoals produktiv vollständig integrieren. | `PENDING` | Corp-Ziele wurden begonnen, müssen produktiv und diagnosefähig durchgängig wirken. | Corp-Ziele für Score, Remote, Zentralserver, Rez, Economy, Tag/Punish und Damage/Kill wirken im Hauptscore. |
| AI-COMPLETE-09 | ActionSemanticCandidate-Befüllung vervollständigen. | `PENDING` | Source/Ability/Cost/Timing/Target/BoardContext-Coverage muss gemessen und geschlossen werden. | Relevanter Runtime-Scope ist ausreichend befüllt; Gaps sind echte Blocker oder repariert. |
| AI-COMPLETE-10 | Cost/Timing/BoardContext verallgemeinern. | `PENDING` | Score- und Planpfade enthalten verstreute Spezialbewertungen. | Gemeinsame side-safe Projektionen speisen Scoring und Debug. |
| AI-COMPLETE-11 | TargetProfile-/TargetChoice-Pipeline produktiv machen. | `PENDING` | TargetChoice ist überwiegend Shadow/Diagnose. | Konkrete legale Zieloptionen wirken im Target Fit ohne `selectedChoices`-Erzeugung oder Hidden Info. |
| AI-COMPLETE-12 | Hard-Gate-Vertrag härten. | `PENDING` | HardGates existieren, müssen Vorrang vor allen Scorepfaden behalten. | Blockierte Kandidaten können nicht durch positive Scores gewinnen; WhyNot nennt Blocker. |
| AI-COMPLETE-13 | Micro-/Overlay-/Override-Pfade in den Spine integrieren oder entfernen. | `PENDING` | `runtime/practical-*` und Runtime-Overlays sind aktiv. | Kein dauerhaftes Score-plus-Override-System; terminale Entscheidungen sind modellierte Gate-/Outcome-Typen. |
| AI-COMPLETE-14 | Kartennamenspezifische und payloadspezifische KI-Logik abbauen. | `PENDING` | CardDefinitionId-, Titel- und Label-Treffer in `index.ts`, `tactical-plans.ts` und Runtimepfaden. | Produktiver Planner/Scorer/Targeter nutzt generische Semantik oder gekapselte Ability-Adapter. |
| AI-COMPLETE-15 | Text-/Regex-/Label-Fallbacks aus produktiver Entscheidung lösen. | `PENDING` | `action.label` und Regex werden in produktiven Pfaden verwendet. | Text-/Regex-/Label-Fallbacks sind nur diagnostisch und erzeugen Coverage-Gaps. |
| AI-COMPLETE-16 | Doppelte und widersprüchliche Bewertungslogik beseitigen. | `PENDING` | Mehrere Module bewerten Reachability, Target, Economy, Access und Planfortschritt parallel. | Ownership-Matrix: Konzept -> ein Owner -> erlaubte Consumer; konkurrierende Logik entfernt. |
| AI-COMPLETE-17 | Fachliche Scoring-Consumer aufbauen. | `PENDING` | Aktueller Score enthält große Typpriorität und verstreute Komponenten. | Goal Fit, Target Fit, Cost, Timing, Reachability, Boardstate Need, Risk, Doctrine, Plan Continuity, Terminal Outcome, Reserve und Uncertainty haben definierte Skalen. |
| AI-COMPLETE-18 | DecisionTrace, WhyChosen und WhyNot vollständig machen. | `PENDING` | Debug ist vorhanden, aber WhyNot-Kategorien und Alternativenabdeckung müssen geprüft werden. | Redaction-safe Trace erklärt gewählte Action und relevante Ablehnungen inklusive Fallback/Gaps. |
| AI-COMPLETE-19 | Kommentare und Entwicklerleitplanken korrigieren. | `PENDING` | Grenzkommentare existieren, müssen nach Runtime-Änderungen stimmen. | Nur knappe, aktuelle Grenzkommentare an Fehlentwicklungsrisiken; veraltete No-Effect-Texte entfernt. |
| AI-COMPLETE-20 | Praktische Spielqualität und Kalibrierung belegen. | `PENDING` | Full AI-Test ist baseline-rot; Benchmarks/Selfplay müssen nach Reparatur geprüft werden. | Tests, Szenarien und Benchmarks belegen 0 Illegalität, 0 Hidden-Info-Verstoß, keine Action-Type-Dominanz und bessere Erklärbarkeit. |

## Neu gefundene In-Scope-Findings

| ID | Ziel | Status | Ausgangsevidenz | Definition of Done |
| --- | --- | --- | --- | --- |
| AI-COMPLETE-F001 | Baseline-Regression bei `The Shell Traders` reparieren. | `VERIFIED` | Full AI-Test war rot: vier `packages/ai/src/index.test.ts`-Fälle fanden keine erwarteten Shell-Traders-`LegalActions`, weil Engine-LegalActions jetzt `delayedInstallAbility` statt `shellTradersAbility` tragen. | Erfüllt: gemeinsame Delayed-Install-Erkennung akzeptiert neue Engine-Payloads und alte Fixtures; fokussierte Shell-Traders-Tests und vollständiger `@netgrid/ai test` grün. |

## Implementierungsnachweise

- `AI-COMPLETE-F001`:
  - `packages/ai/src/actions/delayed-install-action.ts` ergänzt eine gekapselte Delayed-Install-Ability-Erkennung für neue `delayedInstallAbility`-Payloads und alte `shellTradersAbility`-Fixtures.
  - `packages/ai/src/input-dto.ts` lässt `delayedInstallAbility` side-safe in AI LegalAction-Payloads durch.
  - `packages/ai/src/index.ts`, `packages/ai/src/legacy/runner-plans.ts` und `packages/ai/src/index.test.ts` nutzen die gemeinsame Erkennung statt direkter Shell-Traders-Payloadvergleiche.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Shell Traders"` grün, 5 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.

- `AI-COMPLETE-01`:
  - `packages/ai/src/index.ts` ersetzt die produktive Score-Komponente `semantic_type_priority` durch den bounded `semantic_type_tie_breaker`.
  - `packages/ai/src/index.ts` ergänzt Runner-Goal-Fit-Komponenten für `tag_removal`, `coverage_search`, `setup_card_search`, kartenbasierten Draw, Run-only-Aktionen und erreichbare Runs, damit Fachsignale statt Action-Type-Gewicht entscheiden.
  - `packages/ai/src/runtime/semantic-choice-ranking.ts` bewahrt `planProgressionReason` und `whyPlanAbandoned`, wenn kein aktuelles Mapping ausgewählt ist; damit bleibt WhyNot/Planfortschritt im Debug sichtbar.
  - Verifikation: `rg -n "semanticRuntimeTypePriority\\(|semanticRuntimeTypeTieBreakerScore\\(" packages/ai/src --glob '!**/*.json'` zeigt produktiv nur `semanticRuntimeTypeTieBreakerScore` in `packages/ai/src/index.ts`.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-score-components.test.ts` grün, 7 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/runner-wilson-run-action.test.ts src/simulation/benchmark-reports.test.ts -t "Semantic AI runtime cutover|Runner Wilson|action alternatives scoped"` grün, 61 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.

- `AI-COMPLETE-02`:
  - `packages/ai/src/index.ts` verschiebt Runner-/Corp-Baseline- und Legacy-Planberechnung hinter einen memoisierten Provider.
  - `packages/ai/src/runtime/semantic-runtime.ts` akzeptiert einen Legacy-Provider und fordert Legacy erst bei Forced-Legacy, No-Candidate-Fallback oder nach der semantischen Auswahl für Diagnose/Trace an.
  - Die direkte Runtime-Test-API bleibt kompatibel mit fertigen Legacy-Decisions, normalisiert intern aber ebenfalls auf einen Provider.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime.test.ts src/semantic-ai-runtime-cutover.test.ts` grün, 55 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.

- `AI-COMPLETE-03` erster Struktur-Schnitt:
  - `packages/ai/src/runtime/runner-goal-fit-score.ts` kapselt die in `AI-COMPLETE-01` eingeführten Runner-Goal-Fit-Score-Komponenten.
  - `packages/ai/src/index.ts` konsumiert die neue Runtime-Komponente nur noch mit lokalen Projection-Dependencies; die lokale Implementierung wurde entfernt.
  - `packages/ai/src/index.ts` sank im aktuellen Branch von 36.331 auf 36.252 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runner-wilson-run-action.test.ts` grün, 63 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` zweiter Struktur-Schnitt:
  - `packages/ai/src/runtime/legacy-decision-provider.ts` kapselt die memoisierten Legacy-Provider für den lazy Legacy-Pfad aus `AI-COMPLETE-02`.
  - `packages/ai/src/runtime/reactive-action.ts` kapselt die reaktive Action-Klassifikation für Semantic Runtime und Practical-Micro-Checks.
  - `packages/ai/src/index.ts` sank weiter von 36.252 auf 36.225 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime-score-components.test.ts` grün, 65 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` Boundary-Guard:
  - `packages/ai/src/public-export-contract.test.ts` verbietet öffentliche Re-Exports der neuen internen Runtime-Module `runner-goal-fit-score`, `legacy-decision-provider` und `reactive-action`.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts` grün, 3 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
- `AI-COMPLETE-03` dritter Struktur-Schnitt:
  - `packages/ai/src/diagnostics/coverage-selection-debug.ts` kapselt Coverage-Selection-Debug inklusive AnswerRole-/AnswerFit-/CapabilityLabel-Formatierung.
  - `packages/ai/src/index.ts` enthält nur noch einen Adapter mit explizitem sichtbaren Source-Card-Lookup.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Diagnostics-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 36.225 auf 36.107 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/diagnostics/semantic-runtime-debug.test.ts` grün, 64 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` vierter Struktur-Schnitt:
  - `packages/ai/src/diagnostics/semantic-runtime-debug.ts` baut nun auch den Plan-Selection-Display-Context.
  - `packages/ai/src/index.ts` übergibt CoverageSelection nur noch als vorbereitete Diagnose-Eingabe und enthält keine eigene Plan-Context-Zusammenstellung mehr.
  - `packages/ai/src/index.ts` sank weiter von 36.107 auf 36.087 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/diagnostics/semantic-runtime-debug.test.ts` grün, 64 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` fünfter Struktur-Schnitt:
  - `packages/ai/src/diagnostics/semantic-runtime-action-alternatives.ts` kapselt ActionAlternatives-Debugformatierung inklusive Display-Score-, Coverage- und Plan-ScoreBreakdown.
  - `packages/ai/src/index.ts` liefert nur noch ScoreBreakdown- und SourceTitle-Callbacks.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Diagnostics-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 36.087 auf 36.030 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/diagnostics/semantic-runtime-debug.test.ts` grün, 64 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` sechster Struktur-Schnitt:
  - `packages/ai/src/diagnostics/semantic-runtime-ranked-alternatives.ts` kapselt RankedAlternatives-Debugverdrahtung.
  - `packages/ai/src/index.ts` delegiert RankedAlternatives nur noch mit ScoreBreakdown-Callback.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Diagnostics-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 36.030 auf 36.029 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/diagnostics/semantic-runtime-debug.test.ts` grün, 64 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` siebter Struktur-Schnitt:
  - `packages/ai/src/diagnostics/semantic-runtime-decision-debug.ts` kapselt die Semantic-Runtime-DecisionDebug-Zusammenstellung inklusive Memory-, Trace-, Plan-, Doctrine-, Pilot-, Coverage- und Alternativenfeldern.
  - `packages/ai/src/index.ts` liefert nur noch CoverageSelection, ausgewählten ScoreBreakdown, RankedAlternatives und ActionAlternatives als vorbereitete Eingaben.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Diagnostics-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 36.029 auf 35.902 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/diagnostics/semantic-runtime-debug.test.ts src/diagnostics/decision-debug.test.ts src/diagnostics/semantic-runtime-memory-debug.test.ts` grün, 71 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` achter Struktur-Schnitt:
  - `packages/ai/src/runtime/semantic-runtime-score-breakdown.ts` kapselt die Semantic-Runtime-ScoreBreakdown-Zusammenstellung inklusive Typ-Tiebreaker, Exclusion-Hinweis, Kontextkomponenten, privatem Actor-Bonus und Credit-Kosten-Penalty.
  - `packages/ai/src/index.ts` delegiert die ScoreBreakdown-Komposition nur noch mit ContextComponents- und ActionCreditCost-Callbacks.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.902 auf 35.877 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/runtime/semantic-runtime-score-components.test.ts src/semantic-ai-runtime-cutover.test.ts` grün, 65 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` neunter Struktur-Schnitt:
  - `packages/ai/src/runtime/semantic-runtime-scope.ts` kapselt Semantic-Runtime-Scope-Resolution inklusive ActionSemanticCandidate-Fallback, Runner-Card-Display-Scope und `semanticRuntimeServerId`.
  - `packages/ai/src/index.ts` liefert nur noch explizite Scope-Dependencies für Remote-Server-Erkennung und Runner-SourceCard-AnswerRole.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.877 auf 35.748 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime-score-components.test.ts` grün, 65 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` zehnter Struktur-Schnitt:
  - `packages/ai/src/runtime/semantic-runtime-choice-builder.ts` kapselt Semantic-Runtime-Choice-Building, Candidate-Lookup, Score-Aggregation, Evidence-Basisfelder und Choice-Sortierung.
  - `packages/ai/src/index.ts` liefert nur noch explizite ChoiceBuilder-Dependencies für Scope, Exclusion, ScoreBreakdown, Kosten, Evidence, Explanation und Action-Vergleich.
  - `packages/ai/src/runtime/semantic-choice-ranking.ts` nutzt `semanticRuntimeServerId` aus dem neuen Scope-Modul statt einer lokalen Duplikation.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.748 auf 35.674 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runtime/semantic-runtime-score-components.test.ts` grün, 65 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` elfter Struktur-Schnitt:
  - `packages/ai/src/runtime/runner-run-only-action-adjustment.ts` kapselt Runner-Run-only-Action-Adjustment, Spending-Cap-Evidence, RankedChoice-Replacement und `runnerRunActionSpendingCapAssessment`.
  - `packages/ai/src/index.ts` liefert nur noch `compareAction` als explizite Dependency und nutzt den Spending-Cap-Assessment-Export weiter für Runner-Score-Komponenten.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.674 auf 35.556 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runner-wilson-run-action.test.ts` grün, 63 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` zwölfter Struktur-Schnitt:
  - `packages/ai/src/runtime/runner-self-damage-choice.ts` kapselt den Runner-Self-Damage-Immediate-Win-Selector inklusive Choice-Auswahl und Evidence-Anreicherung.
  - `packages/ai/src/index.ts` liefert nur noch die bestehende `runnerSelfDamageSurvivalAssessment` als explizite Dependency.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.556 auf 35.541 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runner-wilson-run-action.test.ts` grün, 63 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` dreizehnter Struktur-Schnitt:
  - `packages/ai/src/runtime/semantic-runtime-action-exclusion.ts` kapselt die Semantic-Runtime-Action-Exclusion-Orchestrierung inklusive Reihenfolge, Basic-Advance-Dominanz, Runner-Zielauflösung, Archives-/Remote-Sonderfällen und bekannter ICE-Path-No-Access-Exclusion.
  - `packages/ai/src/index.ts` liefert nur noch explizite Exclusion-Dependencies für die fachlichen Einzelprüfungen, Remote-Erkennung und Known-ICE-Path-Reason-Formatierung.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.541 auf 35.491 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runtime/semantic-runtime-score-components.test.ts src/runner-wilson-run-action.test.ts` grün, 70 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` vierzehnter Struktur-Schnitt:
  - `packages/ai/src/runtime/runner-self-damage-choice.ts` kapselt nun zusätzlich die Runner-Self-Damage-Survival-Exclusion inklusive Flatline-Risk-Reason.
  - `packages/ai/src/index.ts` liefert auch dafür nur noch die bestehende `runnerSelfDamageSurvivalAssessment` als explizite Dependency.
  - `packages/ai/src/index.ts` sank weiter von 35.491 auf 35.479 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runtime/semantic-runtime-score-components.test.ts src/runner-wilson-run-action.test.ts` grün, 70 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.
- `AI-COMPLETE-03` fünfzehnter Struktur-Schnitt:
  - `packages/ai/src/runtime/runner-program-sacrifice-exclusion.ts` kapselt die Runner-Program-Sacrifice-Exclusion inklusive Memory-Requirement-Gate, akzeptabler Opferprüfung und Penalty-Reason.
  - `packages/ai/src/index.ts` liefert nur noch ProgramInstallTrash-Assessment und Displacement-Penalty als explizite Dependencies.
  - `packages/ai/src/public-export-contract.test.ts` verbietet den öffentlichen Re-Export des neuen Runtime-Moduls.
  - `packages/ai/src/index.ts` sank weiter von 35.479 auf 35.467 Zeilen.
  - Status bleibt `IN_PROGRESS`, weil `index.ts` noch keine dünne Public-/Composition-Fassade ist.
  - Verifikation: `corepack pnpm --filter @netgrid/ai exec vitest run src/public-export-contract.test.ts src/semantic-ai-runtime-cutover.test.ts src/runtime/semantic-runtime.test.ts src/runtime/semantic-runtime-score-components.test.ts src/runner-wilson-run-action.test.ts` grün, 70 Tests.
  - Verifikation: `corepack pnpm --filter @netgrid/ai typecheck` grün.
  - Verifikation: `git diff --check` grün.
  - Verifikation: `corepack pnpm --filter @netgrid/ai test` grün, 134 Dateien, 1541 Tests.

Nächstes aktives Ziel: `AI-COMPLETE-03`.

## Audit-Ledger

| Audit | Status | Findings |
| --- | --- | --- |
| Audit 1 | `PENDING` | Noch nicht gestartet. |
| Audit 2 | `PENDING` | Noch nicht gestartet. |
