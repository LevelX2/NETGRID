# AI073-AI080 Selfplay Stabilization Final Review

Datum: 2026-06-10

## Umfang

Dieser Paketprozess hat AI073 bis AI080 sequenziell umgesetzt:

- AI073: A-D-x5 Selfplay-Regression-Baseline und Matrix-Runner.
- AI074: Recovery-loop False-Positive-Disambiguierung.
- AI075: Doctrine-Contest-Gate fuer bekannte No-Payoff-Remotes.
- AI076: Scoreline-Doctrine-Safety-Gate.
- AI077: ActionSemanticCandidate-Coverage-Report v1.
- AI078: Consumer-spezifische Doctrine-Runtime-Clamps und Gates.
- AI079: Action-Limit-Root-Cause-Cluster im Trace-Mining.
- AI080: Full-Sweep und finale Selfplay-Matrix.

## Code-/Artefaktentscheidungen

- Keine Engine-, LegalAction-, applyAction-, Replay-, StateHash- oder Randomness-Aenderungen.
- Keine Erweiterung verdeckter Informationen in AI-Input, Debug, Trace oder Reports.
- Keine card-/seed-spezifischen Heuristiken.
- Keine Proteus-Runtime-Aktivierung.
- AI079 blieb bewusst Diagnostic-only, weil der dominante Action-Limit-Cluster heterogene Low-Value-Repeats enthaelt und keine sichere Einzelfix-Klasse erkennbar war.

## Finale Selfplay-Lage

Quelle: `docs/reviews/ai/ai080-final-selfplay-trace-mining-a-d-2026-06-10.json`

| Metric | AI073 Baseline | Final AI080 |
| --- | ---: | ---: |
| games | 20 | 20 |
| decisions | 2571 | 2571 |
| findings | 833 | 829 |
| criticalFindings | 0 | 0 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| actionLimitReached | 11 | 11 |
| allRedactionSafe | 1 | 1 |
| repeated_known_no_payoff_remote | 0 | 0 |
| repeated_no_progress_run | 35 | 35 |
| recovery_low_value_loop | 98 | 2 |
| unsafeScoreChosen | 6 | 6 |
| passiveActionWithScoreLineAvailable | 6 | 6 |
| corp_never_scores_long_game | 3 | 3 |
| corpAgendaScores | 14 | 14 |

## Zielerreichung

Erreicht:

- Safety-Gates bleiben gruen: keine illegal actions, keine Replay-Failures, keine critical findings, Redaction safe.
- Recovery-False-Positive-Last ist von 98 auf 2 gefallen.
- Known-no-payoff Remote-Repeats bleiben bei 0.
- Doctrine-Gewichte sind consumer-spezifisch begrenzt und gate-first.
- Action-Limit-Root-Cause-Cluster sind im Trace-Mining sichtbar.

Nicht erreicht:

- `actionLimitReached` bleibt 11 statt Ziel `<= 8`.
- `repeated_no_progress_run` bleibt 35 statt Ziel `<= 33`.
- `unsafeScoreChosen` bleibt 6 statt Ziel `<= 3`.

## Teststatus

Gruen:

- `corepack pnpm --filter @netgrid/ai test`: 54 Testdateien, 1047 Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm typecheck`
- fokussierte Pakettests aus AI073-AI080
- `git diff --check`
- finale A-D-x5-Selfplay-Safety

Nicht gruen:

- `corepack pnpm test` scheitert in bestehenden `@netgrid/engine`-Tests, siehe `ai080-full-test-sweep-final-review-2026-06-10.md`. Diese Fehler liegen ausserhalb des AI073-AI080-Aenderungsbereichs und wurden nicht im Paket behoben.

## Folgepakete

- Action-Limit-Subcluster enger schneiden: Gain-Credit-Loops ohne Funding-Need, Draw-/Ability-Loops ohne Coverage-/Setup-Ziel, Run-step-Stalls separat.
- Unsafe Scoreline-Funde ohne Doctrine-Ursache als eigenes Scoreline-Safety-Paket untersuchen.
- Root-Engine-Testfehler separat im Engine-/Mechanik-Kontext bearbeiten, nicht als AI-Selfplay-Stabilisierung.
