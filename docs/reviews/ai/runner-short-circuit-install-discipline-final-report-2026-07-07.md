# Runner Short Circuit Install Discipline Final Report 2026-07-07

## Analysiertes Match

- Match: `match_23e71df59051a4ed`
- Modus: `human_corp_vs_runner_ai`
- Gewinner: Korp durch Agenda-Punkte
- Replay-Evidence: `docs/reviews/ai/runner-short-circuit-install-discipline-evidence-2026-07-07.md`

## Fehlergruppen

1. `coverage_search` erhielt pauschal `+1400`, sobald die Quellkarte als Search-Quelle erkannt wurde.
2. Search-Choice-Optionen wurden nur generisch als Programm, Icebreaker, Economy oder Memory bewertet, nicht gegen den aktuellen sichtbaren Coverage-Bedarf.
3. `coverageSearchActionFit` akzeptierte weitere Programmsuche weiter als Planfortschritt, obwohl schon ein sichtbarer Hand-Breaker die aktive Coverage-Anforderung erfüllen konnte.
4. Dadurch entstanden Suchketten mit `The Short Circuit`, gesuchten Programmen in der Hand und anschließenden Discards statt Credits/Installation/Run-Fortsetzung.

## Umgesetzte Anpassungen

- Neuer side-safe Runtime-Adapter `runner-search-coverage-need.ts`:
  - ermittelt aus sichtbaren known/rezzed ICE-Pfaden eine konkrete RequiredCoverage;
  - erkennt sichtbare Handkarten, die diese Coverage erfüllen;
  - matcht Search-Choice-Optionen gegen die RequiredCoverage.
- `selectedSearchChoiceOptionIds` priorisiert direkte RequiredCoverage-Antworten stark und wertet generische Nicht-Antwort-Programme ab, sobald ein direkter Answer in den Suchoptionen sichtbar ist.
- `runnerSemanticGoalFitScoreComponent` ersetzt den pauschalen `coverage_search`-Bonus durch `runner_goal_fit_coverage_search_saturated = -1200`, wenn ein sichtbarer Hand-Answer vorhanden ist.
- `coverageSearchActionFit` stuft weitere Suchaktionen als `not_coverage_answer` ein, wenn der aktuelle Plan stattdessen eine sichtbare Handantwort installieren oder finanzieren sollte.

## Grenzen

- Keine Kartennamen-Sonderregel für `The Short Circuit`.
- Keine Engine-, LegalAction-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.
- Der Adapter nutzt nur sichtbare PlayerView-Daten. Wenn kein konkreter sichtbarer known/rezzed ICE-Coverage-Bedarf existiert, bleibt die alte generische Search-Bewertung erhalten.
- Der volle `@netgrid/ai test`-Lauf überschritt lokal 5 Minuten ohne verwertbares Ergebnis und wurde beendet; fokussierte Regressionen und Typecheck waren grün.

## Checks

- `corepack pnpm exec vitest run src/runtime/search-choice-option.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm exec vitest run src/runtime/runner-goal-fit-score.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm exec vitest run src/plans/tactical-plan-coverage-search-fit.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm exec vitest run src/runtime/selected-choices-for-decision.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Merge-Status

Zum Zeitpunkt dieses Reports: umgesetzt und lokal committed auf `codex/ai-short-circuit-install-discipline`; finaler Merge nach `main` folgt nach Abschlussdokumentation.
