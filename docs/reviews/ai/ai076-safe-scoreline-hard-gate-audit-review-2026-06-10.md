# AI076 Safe Scoreline Hard-Gate Audit Review 2026-06-10

Status: abgeschlossen mit verbleibendem Metrikbefund

Branch: `codex/ai073-ai080-selfplay-stabilization`

Vergleichsbasis: `docs/reviews/ai/ai075-known-remote-no-payoff-guard-v2-a-d-5seed-2026-06-10.json`

AI076-Matrix: `docs/reviews/ai/ai076-safe-scoreline-hard-gate-audit-a-d-5seed-2026-06-10.json`

## Ziel

AI076 sollte positives `score_now`-Doctrine-Gewicht hinter Scoreline-Safety-Gates legen und `unsafeScoreChosen` transparenter machen. Legal scoring bleibt legal; die KI darf nur Ranking-Komponenten ändern.

## Umsetzung

Geändert wurden:

- `packages/ai/src/index.ts`
  - `score_now`-Doctrine läuft jetzt über `semanticRuntimeCorpScoreNowDoctrineWeight`;
  - positives `deck_doctrine_runtime_weight` wird bei riskanter Scoreline durch `deck_doctrine_runtime_weight_suppressed` ersetzt;
  - Evidence enthält `corp_scoreline_safety_gate_blocks_doctrine:true` und `score_now_doctrine_suppressed:true`;
  - riskantes `score_agenda` erhält zusätzlich `corp_scoreline_safety_gate_blocks_doctrine` als negative Safety-Komponente.
- `scripts/run-ai-selfplay-trace-matrix.ts`
  - Matrix-JSON enthält `diagnostics.unsafeScoreChosenByReason`.
- `packages/ai/src/index.test.ts`
  - sicherer Scoreline-Fall behält positives `score_now`-Doctrine;
  - unsicherer Scoreline-Fall unterdrückt positives Doctrine und zeigt Safety-Komponente.

## Ergebnis

| Metrik | AI075 | AI076 |
| --- | ---: | ---: |
| `unsafeScoreChosen` | 6 | 6 |
| `passiveActionWithScoreLineAvailable` | 6 | 6 |
| `corpAgendaScores` | 14 | 14 |
| `corp_never_scores_long_game` | 3 | 3 |
| `actionLimitReached` | 11 | 11 |
| `repeated_no_progress_run` | 35 | 35 |
| `recovery_low_value_loop` | 2 | 2 |
| `illegalActions` | 0 | 0 |
| `replayFailures` | 0 | 0 |
| `criticalFindings` | 0 | 0 |
| `allRedactionSafe` | true | true |

## Unsafe-Score-Subgründe

| Subgrund | Anzahl |
| --- | ---: |
| `unsafe_score_unprotected_remote` | 6 |
| `unsafe_score_missing_protected_remote_signal` | 6 |
| `unsafe_score_runner_access_threat_high` | 6 |
| `unsafe_score_insufficient_rez_reserve` | 3 |
| `unsafe_score_cheap_contest_available` | 1 |

Pair-Verteilung:

| Pair | `unsafeScoreChosen` | Subgründe |
| --- | ---: | --- |
| A | 1 | insufficient reserve, missing protected remote, high access threat, unprotected remote |
| B | 0 | none |
| C | 1 | cheap contest, missing protected remote, high access threat, unprotected remote |
| D | 4 | missing protected remote, high access threat, unprotected remote, teilweise insufficient reserve |

## Bewertung

Der Hard-Gate ist umgesetzt und testgedeckt. Positives `score_now`-Doctrine kann einen sichtbar riskanten Score nicht mehr anheben.

Der A-D-Lauf senkt `unsafeScoreChosen` noch nicht. Das ist ein echter verbleibender Befund: Die sechs unsafe Scores werden durch ungeschützte Remotes mit hoher Runner-Access-Threat erklärt, nicht durch positives `score_now`-Doctrine. AI076 hat daher die klare Doctrine-Ursache geschlossen, aber nicht die gesamte Scoreline-Safety-Metrik beseitigt.

Safety bleibt grün: keine illegalen Actions, keine Replay-Fehler, keine Critical Findings, Redaction-Safety true. Corp-Scoreleistung bleibt mit 14 Scores stabil.

## Verifikation

```text
corepack pnpm --filter @netgrid/ai typecheck
Ergebnis: grün

corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "scoreline|unsafe score|doctrine score"
Ergebnis: grün, 2 Tests

corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
Ergebnis: grün, 7 Tests

git diff --check
Ergebnis: grün

A-D x 5 Trace-Matrix
Ergebnis: grün, harte Safety-Metriken unverändert 0/true
```

## Folgehinweise

AI078 sollte die neue Gate-first-Logik in die allgemeine Doctrine-Clamp-Struktur übernehmen. Eine weitere Senkung von `unsafeScoreChosen` braucht voraussichtlich eine separate Scoreline-Alternative-Präferenz oder Root-Cause-Arbeit an ungeschützten Remotes, nicht nur Doctrine-Suppression.

