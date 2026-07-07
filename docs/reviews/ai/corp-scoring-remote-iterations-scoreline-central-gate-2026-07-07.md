# Corp Scoreline Central Gate

## Befund

Hybrid Seed `ai-v143-tuning-004` zeigte nach dem Remote-/Scoreline-Scope-Sync weiter eine inkonsistente Scoreline-Diagnose:

- `corp_scoreline_runner_access_threat_high:false`
- `corp_scoreline_blocked_by_central_threat:false`
- aber trotzdem `corp_scoreline_best_action:install_card:central_protection:hq`

Das war kein sinnvoller Scoreline-Pfad. Central-ICE darf in der Scoreline-Assessment-Schicht nur dann als `central_protection`-Pfad konkurrieren, wenn die Central-Gefahr dort auch wirklich hoch ist. Andernfalls verzerrt der Befund die nachgelagerten Scoreline- und Economy-Diagnosen.

## Änderung

`assessCorpScorelineWindow` klassifiziert HQ-/R&D-ICE-Installationen nur noch dann als Scoreline-`central_protection`, wenn `centralThreatHigh` wahr ist. Die Central-ICE-Aktion bleibt weiterhin legal und kann über normale Central-Schutz-/ICE-Scorer gewinnen; sie wird nur nicht mehr als Scoreline-Best-Action ausgegeben, wenn die Scoreline-Evidence selbst keine Central-Gefahr sieht.

Zusätzlich wurde die Scoreline-Test-Fixture für ICE auf das strukturierte `effectiveRunQuote.subroutines`-Format gebracht, das der Scoring-Window-Evaluator tatsächlich konsumiert.

## Seed-Evidence

Hybrid Seed `ai-v143-tuning-004`, `current_candidate`, 480 Actions:

Vor dem Fix:

- Scoreline-Evidence bei State 154/155/156: `recommended_next_step:protect_central`
- Best Action: `install_card:central_protection:hq`
- `corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough`: 18
- `corpEconomyBeforeScoreSuspiciousRemoteStillSafe`: 18

Nach dem Fix:

- Scoreline-Evidence bei State 154/155/156: `recommended_next_step:protect_remote`
- Best Action: `install_card:remote_protection:remote_1`
- `corpEconomyBeforeScoreSuspiciousCreditsAlreadyEnough`: 11
- `corpEconomyBeforeScoreSuspiciousRemoteStillSafe`: 11
- Spielausgang unverändert: Corp gewinnt 7:6 nach 198 Actions.

## Hybrid 5-Seed Smoke

Slot `strategy_panel_hybrid_score_punish_cheap_bag`, Seeds `ai-v143-tuning-001` bis `ai-v143-tuning-005`, 480 Actions, nur `current_candidate`:

| Metrik | Wert |
| --- | ---: |
| Spiele | 5 |
| Action-Limit-Rate | 0 |
| Average Actions | 247.6 |
| Runner Agenda Points | 20 |
| Corp Agenda Points | 37 |
| Runner Steals | 8 |
| Corp Scores | 13 |
| Extra Central over Ready Remote Build | 1 |
| Extra Central over Agenda Install | 0 |
| Central ICE without Rez Reserve | 7 |
| Central over-iced without pressure | 189 |

## Validierung

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.test.ts --maxWorkers=1 --testTimeout=120000
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-match-progression-suite.ts --out-json %TEMP%\netgrid-scoreline-central-gate-hybrid-5x480-2026-07-07.json --max-actions 480 --slot-ids strategy_panel_hybrid_score_punish_cheap_bag --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005 --baseline-profile current_candidate --candidate-profile current_candidate --comparison-profiles current_candidate
```

Alle fokussierten Checks waren grün. Die Änderung ist ein Diagnose-/Alignment-Fix; sie löst die verbleibende konkrete Action-Auswahl bei State 155 noch nicht vollständig, weil dort weiterhin Central-ICE über die normalen Install-/ICE-Scorer gewinnt.
