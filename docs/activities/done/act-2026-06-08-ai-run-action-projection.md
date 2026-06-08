---
activityId: act-2026-06-08-ai-run-action-projection
status: done
kind: enhancement
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-run-target-evaluation.ts
  - packages/ai/src/runner-run-target-evaluation.test.ts
  - packages/ai/src/index.ts
  - packages/ai/src/tactical-plans.test.ts
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/runner-wilson-run-action.test.ts
  - corepack pnpm --filter @netgrid/ai test
---

# Kartenbasierte Run-Actions in RunnerRunTargetEvaluation

## Ziel

Runrelevante Kartenaktionen sollen nicht an der normalen Runner-Run-Zielbewertung vorbeilaufen. Die KI soll direkte `start_run`-Aktionen, Wilson-Run-Abilities, Run-Events wie All-Hands und Rush Hour sowie konservativ projizierbare Follow-up-/Choice-Run-Kontexte über denselben side-sicheren Bewertungsweg behandeln.

## Ausgangslage

`evaluateRunnerRunTargets` wertete bisher nur `LegalAction`s mit `type === "start_run"` aus. Dadurch konnten `play_event`, `trigger_ability`, `resolve_choice` oder ähnliche Aktionen mit Run-Wirkung HQ-/R&D-/Remote-Payoff, Knownness, Pfadkosten, Creditreserve und TacticalPlan-Mapping umgehen oder nur über kartenindividuelle Sonderlogik erscheinen.

## Scope

- Eine redigierte `RunActionProjection` aus LegalAction, optionalem `ActionSemanticCandidate`, side-sicheren Card-Hints und sichtbarem Runner-Kontext ableiten.
- Nur konkrete, side-sichere Serverziele in `RunnerRunTargetEvaluation` bewerten.
- Run-Action-Quellen, Struktur, Constraints, Risiken, Payoff-Signale, Spend-Limits, Noisy-Restriktionen und Bypass-Hinweise als Evidence sichtbar machen.
- Cardbasierte Run-Payoffs getrennt von installierten Run-Payoffs führen und danach gemeinsam in Access-Payoff, Score und Recommendation einfließen lassen.
- Missing-target-Fälle konservativ als `missing_target_options` projizieren, aber nicht als Run-Ziel bewerten.

## Nicht im Scope

- Keine Engine-Änderung.
- Keine LegalAction-Erzeugung oder LegalAction-Änderung.
- Keine `applyAction`-, Replay-, StateHash- oder Zufallspfad-Änderung.
- Keine Hidden-Info-Ausweitung und keine vollständigen gegnerischen Hand-/Decklisten in Debug/Evidence.
- Keine neuen Strategie- oder Taktiksignal-IDs.
- Keine pauschale Run-Aufwertung und keine harte Sperre für HQ/R&D/Remote-Runs.

## Akzeptanzkriterien

- [x] Direkte `start_run`-Aktionen bleiben unverändert über `RunnerRunTargetEvaluation` bewertbar.
- [x] Wilsons eingeschränkte Run-Ability wird als HQ-Run projiziert und nutzt HQ-Knownness inklusive Spend-Limit-Evidence.
- [x] Eine bekannte HQ-Agenda bleibt auch über Wilson-Projektion ein starker Run-Payoff.
- [x] All-Hands wird als HQ-Multiaccess-Event projiziert und kann einen hohen Known-Low-Value-HQ-Malus teilweise ausgleichen.
- [x] Rush Hour wird als R&D-Multiaccess-Event projiziert und nutzt dieselbe Target-Evaluation.
- [x] Run-Events ohne side-sichere Zieloption bleiben `missing_target_options` und erzeugen keine RunTargetEvaluation.
- [x] Multiaccess macht blockierte Pfade nicht erreichbar; Coverage-/Pfad-Blocker bleiben führend.
- [x] TacticalPlan- und Runtime-Aufrufe erhalten die bestehenden `ActionSemanticCandidate`s, damit target options genutzt werden können.

## Ergebnisnotiz

Umgesetzt in `packages/ai/src/runner-run-target-evaluation.ts`: `evaluateRunnerRunTargets` läuft nun über `RunActionProjection`s. Projektionen nutzen nur LegalActions, optionale Semantic-Candidates, side-sichere Card-Hints und sichtbare Runner-Karten. Cardbasierte Payoffs stehen in `runActionPayoff`, installierte Payoffs bleiben in `installedRunPayoff`; der kombinierte Wert beeinflusst Recommendation und Score.

`packages/ai/src/index.ts` reicht die vorhandenen `actionSemanticCandidates` an die RunTargetEvaluation durch. Tests in `packages/ai/src/runner-run-target-evaluation.test.ts` decken Wilson, All-Hands, Rush Hour, missing target options und blockierte Pfade ab; `packages/ai/src/tactical-plans.test.ts` wurde an die erweiterten Evaluation-Typen angepasst.
