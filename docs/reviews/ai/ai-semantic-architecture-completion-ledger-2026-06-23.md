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
| AI-COMPLETE-01 | Produktive Action-Type-Priorität entfernen. | `PENDING` | `semanticRuntimeTypePriority` ist weiter produktiver Scorebestandteil. | Action-Type wirkt nur als letzter deterministischer Tie-Breaker; Pflichtszenarien beweisen, dass Goal-/Target-/Reachability-Fit gewinnt. |
| AI-COMPLETE-02 | Semantic Runtime von Legacy-Entscheidung entkoppeln. | `PENDING` | Runtime-Pfade enthalten `legacyDecision` und `legacy_reference_*`. | Normaler semantischer Pfad berechnet unabhängig; Legacy nur lazy Notaus, No-Candidate-Fallback oder Diagnose. |
| AI-COMPLETE-03 | `packages/ai/src/index.ts` entkernen. | `PENDING` | 35172 Zeilen, viele Runtime-/Scoring-/Debug-/Benchmark-Verantwortungen. | Dünne Public-/Composition-Fassade; Boundary-Test verhindert neue Fachlogik. |
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

Nächstes aktives Ziel: `AI-COMPLETE-01`.

## Audit-Ledger

| Audit | Status | Findings |
| --- | --- | --- |
| Audit 1 | `PENDING` | Noch nicht gestartet. |
| Audit 2 | `PENDING` | Noch nicht gestartet. |
