# AI TacticalPlan Layer Implementation Review

Datum: 2026-06-05

## Ergebnis

AI-PLAN-1 zieht eine schlanke TacticalPlan-Zwischenebene in den Semantic-Runtime-Livepfad ein. `chooseSemanticRuntimeAction` baut jetzt `ActionSemanticCandidate`-Projektionen aus den Engine-`LegalActions`, bewertet TacticalPlans, mappt den aktuellen PlanStep zurück auf LegalActions und wählt daraus die beste vorhandene Semantic-Runtime-Action. Wenn kein Plan passt, bleibt das bisherige direkte Semantic-Ranking der Fallback.

## Umgesetzt

- Neues Modul `packages/ai/src/tactical-plans.ts` mit `TacticalPlan`, `PlanStep`, `PlanBlocker`, `RequiredCapability`, `PlanLifecycle`, `PlanScoreBreakdown`, Mapping-Status und Runtime-Result.
- PlanStep-Mapping über `ActionSemanticCandidate` und vorhandene Engine-`LegalActions`.
- Debug-Erweiterung: echte Plan-/Step-Informationen erscheinen in `planId`, `planKind`, `longTermPlan`, Evidence und einer `tactical_plan`-Detailsection.
- Erste Plantypen:
  - `runner.obtain_breaker_coverage`
  - `runner.contest_remote`
  - `runner.opportunistic_central_run`
  - `runner.build_credit_bank`
  - `runner.cash_out_credit_bank`
  - `corp.create_score_window`
  - `corp.build_credit_bank`
  - `corp.rez_defense`

## Safety

- Die finale Entscheidung bleibt immer eine vorhandene Engine-`LegalAction`.
- `applyAction` und LegalAction-Erzeugung bleiben unverändert.
- Die Planebene liest nur `AiDecisionInput`, PlayerView, PublicEvent-Tail, LegalActions und bereits side-safe `ActionSemanticCandidate`-Projektionen.
- Keine neue Kartensemantik, keine Hidden-Info-Projektion und keine Engine-Regeländerung.
- Nacktes Remote-Advancen wird nicht durch `corp.create_score_window` über bestehende Safety-Alternativen gehoben.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`

## Grenzen

- PlanState wird noch deterministisch pro Entscheidung rekonstruiert; persistente Planfortschreibung bleibt ein späterer Schritt.
- Broker-/Bank-Erkennung nutzt zunächst vorhandene LegalAction-Labels und Semantiksignale.
- Breaker-Coverage-Blocker ist absichtlich konservativ und verwendet nur sichtbare rezzte ICE sowie sichtbare Runner-Rig-/Install-Informationen.
