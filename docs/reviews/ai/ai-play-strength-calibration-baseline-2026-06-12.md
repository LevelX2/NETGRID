# AI Play-Strength Calibration Baseline 2026-06-12

Status: diagnostic-only baseline artifact.

This artifact locks the semantic shadow calibration profiles to explicit metadata:

- `version`: `2026-06-12`
- `baselineReference`: `ai-shadow-league-baseline-2026-06-12`
- `createdFromBenchmark`: `play-strength-calibration-baseline-2026-06-12`
- `lockedAgainstCorpus`: `real-engine-decision-corpus-v2-2026-06-13`
- `lockedCorpusScenarioCount`: `50`

The profiles remain report-only. They do not change runtime action selection,
legal action generation, engine state, planner weights, hidden-info projection,
or productive AI consumers.

The baseline exists to make future scoring-weight changes reviewable. Any
intentional profile update must update the profile metadata, this artifact, and
the calibration and benchmark tests in the same package.
