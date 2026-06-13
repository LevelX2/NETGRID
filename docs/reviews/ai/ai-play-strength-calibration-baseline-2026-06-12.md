# AI Play-Strength Calibration Baseline 2026-06-12

Status: diagnostic-only baseline artifact.

This artifact locks the semantic shadow calibration profiles to explicit metadata:

- `version`: `2026-06-12`
- `baselineReference`: `ai-shadow-league-baseline-2026-06-12`
- `baselineReportScenarioCount`: `18`
- `calibrationSourceScenarioCount`: `18`
- `createdFromBenchmark`: `play-strength-calibration-baseline-2026-06-12`
- `benchmarkSampleCount`: `50`
- `lockedAgainstCorpus`: `real-engine-decision-corpus-v2-2026-06-13`
- `lockedCorpusScenarioCount`: `50`

The 18-count and 50-count values intentionally describe different evidence
layers. The 18-count baseline is the historical score-reference report used to
keep profile changes reviewable. The 50-count locked corpus is the current
real-engine decision corpus used by benchmark and shadow-league tests. A profile
update must not treat the 18-count baseline as the full corpus, and it must not
silently replace the 18-count baseline reference with the 50-count corpus lock.

The profiles remain report-only. They do not change runtime action selection,
legal action generation, engine state, planner weights, hidden-info projection,
or productive AI consumers.

The baseline exists to make future scoring-weight changes reviewable. Any
intentional profile update must update the profile metadata, this artifact, and
the calibration and benchmark tests in the same package.
