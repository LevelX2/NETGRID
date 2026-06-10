# AI075 Known Remote No-Payoff Guard v2 Review 2026-06-10

Status: abgeschlossen

Branch: `codex/ai073-ai080-selfplay-stabilization`

Vergleichsbasis: `docs/reviews/ai/ai074-runner-recovery-loop-disambiguation-a-d-5seed-2026-06-10.json`

AI075-Matrix: `docs/reviews/ai/ai075-known-remote-no-payoff-guard-v2-a-d-5seed-2026-06-10.json`

## Ziel

AI075 verhindert, dass positives `contest_remote`-Doctrine-Gewicht bekannte No-Payoff-Remotes überstimmt. Der Guard ist Regression-Schutz: `repeated_known_no_payoff_remote` stand in AI073/AI074 bereits bei 0, sollte aber durch Doctrine nicht wieder aufgehen.

## Umsetzung

Geändert wurden:

- `packages/ai/src/index.ts`
  - `semanticRuntimeRunnerDoctrineRunWeight` bekommt jetzt die konkrete `LegalAction`;
  - für `contest_remote` wird vor dem positiven Doctrine-Gewicht eine `RunnerRunTargetEvaluation` geprüft;
  - bekannte No-Payoff-/Low-Value-Remotes, blockierte oder unfinanzierbare Pfade und Remotes ohne plausiblen Payoff erhalten kein positives `deck_doctrine_runtime_weight`;
  - statt stiller Unterdrückung wird eine 0-Wert-Komponente `deck_doctrine_runtime_weight_suppressed` mit Evidence ausgegeben.
- `packages/ai/src/index.test.ts`
  - Test für Suppression bei memory-known No-Payoff-Remote;
  - Test für weiterhin positives Doctrine-Gewicht bei plausibler Remote.

Pflicht-Evidence im Suppressionsfall:

```text
runner_known_remote_no_payoff_guard:true
deck_doctrine_remote_contest_suppressed:true
```

## Ergebnis

| Metrik | AI074 | AI075 |
| --- | ---: | ---: |
| `repeated_known_no_payoff_remote` | 0 | 0 |
| `recovery_low_value_loop` | 2 | 2 |
| `repeated_no_progress_run` | 35 | 35 |
| `actionLimitReached` | 11 | 11 |
| `unsafeScoreChosen` | 6 | 6 |
| `passiveActionWithScoreLineAvailable` | 6 | 6 |
| `corpAgendaScores` | 14 | 14 |
| `runnerAgendaSteals` | 30 | 30 |
| `corpFlatlines` | 4 | 4 |
| `illegalActions` | 0 | 0 |
| `replayFailures` | 0 | 0 |
| `criticalFindings` | 0 | 0 |
| `allRedactionSafe` | true | true |

## Bewertung

Der A-D-Korpus zeigt keine neue Metrikbewegung, weil keine bekannte No-Payoff-Remote mehr durch `contest_remote`-Doctrine ausgewählt wurde. AI075 ist deshalb ein Guard-Paket: Es verhindert Regressionen genau an der Consumer-Stelle, an der positives Doctrine-Gewicht bisher blind addiert wurde.

Plausible Remotes bleiben erlaubt. Der Test `keeps remote contest doctrine on plausible scoring remotes` belegt, dass `deck_doctrine_runtime_weight` für `contest_remote` weiter angewendet wird, wenn die RunTarget-Evaluation einen plausiblen Payoff sieht.

## Verifikation

```text
corepack pnpm --filter @netgrid/ai typecheck
Ergebnis: grün

corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "known no-payoff remote|remote contest doctrine|plausible scoring remotes"
Ergebnis: grün, 2 Tests

git diff --check
Ergebnis: grün

A-D x 5 Trace-Matrix
Ergebnis: grün, harte Safety-Metriken unverändert 0/true
```

## Folgehinweise

AI076 und AI078 sollten denselben Gate-first-Grundsatz für `score_now` und weitere Doctrine-Verbraucher fortführen: Safety- und Payoff-Gates entscheiden vor positiven Doctrine-Gewichten.

