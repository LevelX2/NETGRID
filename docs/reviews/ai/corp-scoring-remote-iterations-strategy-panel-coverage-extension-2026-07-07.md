# Corp-Scoring-/Remote-Iteration: Strategy-Panel-Coverage-Erweiterung

Status: akzeptiert.

## Problem

Der Match-Progression-Suite-Benchmark hatte zwar eine Zielmatrix fuer mehrere Corp-Strategien, aber die reale runnable Abdeckung lag nur bei `remote_scoring`, `tag_punish` und `starter_scoreline`. Dadurch konnten Corp-Scoring-/Remote-Aenderungen weiterhin zu stark an wenigen Decktypen kalibriert werden.

## Änderung

Drei lokal validierte ONR-v1-Decks wurden als Frozen-Snapshots in die Strategie-Panel-Holdouts aufgenommen:

- `Chrome Rush Bureau` als `fast_advance`
- `Unused Corp Black ICE Ambush Lab` als `net_damage`
- `Cheap Bag of Tricks` als `hybrid_score_punish`

Die Slots sind `holdout_only` und werden nicht zur Progression-Tuningbasis gemacht. `virus_damage` bleibt pending, weil die vorhandenen echten Proteus-/Virus-Kandidaten vom aktuellen Benchmark-Formatprofil noch nicht stabil als runnable akzeptiert werden.

## Verifikation

Fokussierte Tests:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts src/simulation/benchmark-deck-strategy-panel.test.ts --maxWorkers=1 --testTimeout=120000
```

Ergebnis: 2 Dateien, 23 Tests gruen.

Suite-Smoke:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-match-progression-suite.ts --out-json $env:TEMP\netgrid-strategy-panel-coverage-smoke-2026-07-07.json --out-md $env:TEMP\netgrid-strategy-panel-coverage-smoke-2026-07-07.md --seeds strategy-panel-coverage-smoke-001 --max-actions 10 --comparison-profiles belief_ai_v1_4_2,current_candidate
```

Ergebnis:

- Slots: 12
- Runnable: 11
- Pending: 1
- Disabled: 0
- Runnable Corp-Archetypen: `starter_scoreline`, `remote_scoring`, `tag_punish`, `fast_advance`, `net_damage`, `hybrid_score_punish`
- Verbleibender Gap: `strategy_panel_gap_virus_damage`

## Bewertung

Das ist kein Gameplay-Fix und darf nicht als KI-Staerkegewinn bewertet werden. Es verbessert die Messbasis fuer weitere Iterationen, weil kuenftige Scoring-/Remote-Aenderungen nun gegen drei zusaetzliche Corp-Strategien sichtbar werden.
