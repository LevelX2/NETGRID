# AI088 Current-HEAD Full Sweep and Trace Rebaseline 2026-06-11

## Status

`done_with_reproducible_root_failures_for_ai089`

## Git-Stand

Funktionaler Ausgangsstand:

```text
ca40ebe075dde3335e734dc0cd8bdfa7fbb7e5ca
Hide Forged Activation Orders without unrezzed ICE
```

Trace-Stand:

```text
fd055529
docs(ai): define AI088-AI094 closure process
```

Der Trace-Hash enthält nur das vorgeschaltete Prozessartefakt zusätzlich zum aktuellen `main`-Code. Der funktionale Testgegenstand ist damit der aktuelle `main`-Stand nach AI080, Junkyard-BBS-Recovery-Fix und Forged-Activation-Orders-Fix.

## Ausgeführte Checks

| Check | Status | Befund |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | grün | Abhängigkeiten im neuen Worktree installiert. |
| `corepack pnpm test` | rot | Stoppt in `@netgrid/engine` mit 8 reproduzierbaren Fehlern. |
| `corepack pnpm -r --if-present run typecheck` | grün | Alle Workspace-Typechecks erfolgreich. |
| `corepack pnpm --filter @netgrid/ai test` | grün | 55 Dateien, 1057 Tests. |
| `corepack pnpm --filter @netgrid/server test` | grün | 6 Dateien, 125 Tests. |
| `corepack pnpm --filter @netgrid/engine test` | rot | Gleiche 8 Fehler wie im Root-Test. |
| `git diff --check` | grün | Keine Whitespace-Fehler. |
| A-D x 5 Trace | grün | 20 Spiele, Safety grün, JSON abgelegt. |

Nicht separat sinnvoll wiederholt: `corepack pnpm -r --if-present run test`, weil `corepack pnpm test` denselben rekursiven Paket-Testpfad startet und reproduzierbar in `@netgrid/engine` stoppt.

## Root-/Engine-Fehler für AI089

Der aktuelle HEAD reproduziert die aus der Ergebnisanalyse erwarteten Root-Test-Cluster:

| Cluster | Datei/Test | Befund |
| --- | --- | --- |
| Proteus-Manifestdrift | `packages/engine/src/card-implementations/coverage.test.ts` | `manifestAiSupportDrift` enthält 154 Proteus-Karten. |
| Corolla Speed Chip | `packages/engine/src/index-tests/originalset/agenda-scorearea-recurring.test.ts` | Erwarteter Runner-Credit nach Nutzung des restricted Killer recurring credit bleibt 0 statt 1. |
| Hidden/R&D/Archives LegalAction | `packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts` | Drei Tests scheitern mit `Missing legal action`. |
| V1.9.9 Access LegalAction | `packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts` | Bizarre Encryption Scheme und Chimera scheitern mit `Missing legal action`. |
| PlayerView remote root order | `packages/engine/src/game/view/player-view-projection.test.ts` | `state.run?.breach?.queue` ist `undefined`, erwartete Root-Reihenfolge fehlt. |

Schluss: AI089 ist erforderlich. Die Ursache ist nicht im AI-Paket sichtbar; Typecheck, AI-Test und Server-Test sind grün.

## A-D x 5 Rebaseline

Artefakt:

- `docs/reviews/ai/ai088-current-head-a-d-5seed-2026-06-11.json`

Aggregate:

| Metrik | AI080-Endanalyse | AI088 Current Head | Ziel |
| --- | ---: | ---: | ---: |
| Spiele | 20 | 20 | 20 |
| `illegalActions` | 0 | 0 | 0 |
| `replayFailures` | 0 | 0 | 0 |
| `criticalFindings` | 0 | 0 | 0 |
| `allRedactionSafe` | 1 | 1 | 1 |
| `actionLimitReached` | 11 | 10 | <= 8 |
| `repeated_no_progress_run` | 35 | 33 | <= 33 |
| `repeated_known_no_payoff_remote` | 0 | 0 | 0 |
| `recovery_low_value_loop` | 4 | 4 | <= 88 |
| `unsafeScoreChosen` | 6 | 3 | <= 3 |
| `passiveActionWithScoreLineAvailable` | 6 | 2 | <= 6 |
| `corp_never_scores_long_game` | 3 | 3 | <= 5 |
| `corpAgendaScores` | 14 | 12 | >= 13, außer Safety-Gewinn begründet |
| `runnerAgendaSteals` | 29 | 32 | nicht materiell schlechter |
| `corpFlatlines` | 4 | 5 | kein hartes Ziel |

Safety-Schluss:

- Illegal Actions: 0.
- Replay Failures: 0.
- Hidden-Info-Marker: 0.
- No-Legal-Action-Failures im Trace: 0.
- Redaction: sicher.

Qualitäts-Schluss:

- `unsafeScoreChosen` ist ohne neue AI091-Änderung bereits am Ziel.
- `repeated_no_progress_run` ist ohne neue AI092-Änderung bereits am Ziel.
- `actionLimitReached` ist verbessert, aber noch über Ziel; AI090 bleibt der primäre offene AI-Runtime-Scope.
- `corpAgendaScores` liegt mit 12 unter dem Zielwert 13. Das wird in AI091 weiter beobachtet, aber wegen gleichzeitig deutlich besserem Safety-Wert nicht isoliert als AI088-Blocker behandelt.

## Trace-Diagnostik

ActionLimit-Cluster:

| Cluster | Anzahl |
| --- | ---: |
| `action_limit_low_value_repeat` | 8 |
| `action_limit_mixed_or_unknown` | 2 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |
| `action_limit_setup_economy_loop` | 0 |

Unsafe-Score-Gründe:

| Grund | Anzahl |
| --- | ---: |
| `unsafe_score_missing_protected_remote_signal` | 3 |
| `unsafe_score_runner_access_threat_high` | 3 |
| `unsafe_score_unprotected_remote` | 3 |
| `unsafe_score_insufficient_rez_reserve` | 1 |
| `unsafe_score_cheap_contest_available` | 1 |

Die Unsafe-Score-Gründe können mehrfach pro gewählter Score-Action auftreten; die gewählten unsafe Score-Actions sind insgesamt 3.

## Schlussfolgerungen für Folgepakete

AI089:

- Reparatur ist nötig, weil Root und `@netgrid/engine` rot sind.
- Die bekannten Fehlercluster sind auf aktuellem HEAD reproduzierbar.

AI090:

- Nur `actionLimitReached` bleibt metrisch klar offen.
- Der häufigste Cluster ist `action_limit_low_value_repeat`; die zwei `mixed_or_unknown`-Fälle dürfen nicht durch generische No-Progress-Strafen kaschiert werden.

AI091:

- `unsafeScoreChosen` ist bereits am Ziel.
- Sinnvoll ist ein defensiver Review/Guard, keine riskante breite Runtime-Änderung, solange der Wert im weiteren Trace stabil bleibt.

AI092:

- `repeated_no_progress_run` ist bereits am Ziel.
- Sinnvoll ist ein defensiver Review/Guard gegen Rückfall, keine aggressive Central-Pressure-Unterdrückung, solange Runner-Steals nicht abfallen sollen.

AI093:

- Read-only TargetContext-Coverage bleibt unverändert sinnvoll und kann unabhängig von AI090-AI092 umgesetzt werden.

