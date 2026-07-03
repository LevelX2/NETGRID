# Corp Scoreline Runtime Assessment Review 2026-07-03

## Status

`ready_for_main_integration`

## Ergebnis

`assessCorpScoreTerminalWindow(input)` ist fachlich aus dem Legacy-Korp-Planer herausgelöst. Die neue Runtime-Quelle ist `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.ts`.

Der alte Export in `packages/ai/src/legacy/corp-plans.ts` bleibt als Kompatibilitätsadapter bestehen. Er baut aus vorhandenen Legacy-Helfern nur noch die Abhängigkeits-Callbacks und gibt `scorelineAssessmentToTerminalWindowLike(...)` zurück. Bestehende Diagnose-/Benchmark-Aufrufer brechen dadurch nicht.

## Ersetzte Legacy-Abhängigkeit

- Die produktive Scoreline-Safety und Passive-Scoreline-Bewertung muss nicht mehr direkt auf die groben globalen Legacy-Booleans vertrauen.
- `semantic-runtime-corp-score-safety.ts` prüft eine konkrete `score_agenda`-Action gegen ihren `CorpScorelinePathAssessment`.
- `semantic-runtime-corp-passive-scoreline.ts` bestraft passive Aktionen nur noch bei einem unblocked `score_now`- oder `advance_agenda`-Bestpfad; `fund_scoreline`-Economy wird nicht als passive Abweichung bestraft.
- Corp-Scoreline-Micro-Kandidaten nutzen bevorzugt das neue Bestpath-Assessment.

## Neues Modell

Das neue Modul bewertet vorhandene `LegalActions` pfadbezogen:

- `CorpScorelineWindowAssessment`
- `CorpScorelinePathAssessment`
- `CorpScorelineWindowKind`
- `CorpScorelineRecommendedNextStep`
- `CorpScorelineActionRole`
- `CorpScorelineBlockerKind`

Es erzeugt keine LegalActions, liest keine verdeckten Karten und baut keinen neuen globalen Planner. Die Bewertung stützt sich auf sichtbare PlayerView-Daten, Action-Payloads, vorhandene Board-/ScoringWindow-/Contestability-Callbacks und Action-Kosten.

## Bewusst verbleibende Legacy-Grenze

Der alte Public-/Legacy-Export `assessCorpScoreTerminalWindow` bleibt zunächst erhalten, weil Simulation, ältere Tests und Public-Compatibility noch diesen Terminal-Window-Like-Typ verwenden. Das ist jetzt eine Adapterfläche, nicht mehr der fachliche Owner der Scoreline-Bewertung.

Nicht entfernt in diesem Slice:

- globaler `NETGRID_SEMANTIC_AI_RUNTIME=legacy`-Notaus;
- Legacy-Korp-/Runner-Planer insgesamt;
- Diagnose-/Benchmark-Pfade, die weiterhin Legacy als Vergleichsreferenz nutzen.

## Sicherheitsgrenzen

- Keine Engine-, `applyAction`-, LegalAction-, Replay-, StateHash-, Randomness-, Server- oder UI-Änderung.
- Keine Hidden-Info-Ausweitung.
- Keine LegalAction-Erzeugung.
- Evidence verwendet `corp_scoreline_terminal_window:false/true`; der alte irreführende fixe String `corp_score_terminal_window:true` wird vom neuen Assessment nicht erzeugt.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.test.ts src/runtime/semantic-runtime-corp-score-safety.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts src/runtime/practical-micro-candidates-context.test.ts --reporter=dot`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Restpunkte

- Der alte Adapter kann entfernt werden, sobald Public-Compatibility, Simulation und Diagnose keine `CorpScoreTerminalWindowAssessment`-Form mehr erwarten.
- Der globale Legacy-Notaus bleibt ein separater Cutover-Entscheid.
