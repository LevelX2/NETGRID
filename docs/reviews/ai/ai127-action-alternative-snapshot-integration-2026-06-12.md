# AI127 Action Alternative Snapshot Integration

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI127 integriert Action-Alternative-Snapshots in den normalen Trace-Mining-Reviewfluss, damit Restcluster künftig nicht mehr ad hoc ohne LegalAction-Alternativen geprüft werden müssen.

## Umsetzung

Geändert:

- `packages/ai/src/index.ts`
- `packages/ai/src/simulation/benchmark-reports.test.ts`
- `scripts/run-ai-selfplay-trace-matrix.ts`

Bestehende AI116-Flags bleiben der API-Vertrag:

- `includeActionAlternativesForFindings`
- `maxAlternativesPerFinding`

Neu beziehungsweise gehärtet:

- Retention bleibt opt-in.
- Ohne Opt-in werden Alternativen weiterhin aus `summaries` entfernt.
- Mit Opt-in bleiben Alternativen nur an `action_limit_reached`-Finding-Fenstern erhalten.
- Wenn kein passendes Action-Limit-Finding existiert, wird kein Fallback-Snapshot behalten.
- Das Matrix-Skript unterstützt:
  - `--include-action-alternatives`
  - `--max-alternatives-per-finding <n>`
- Das Matrix-Skript gibt nur kompakte `actionAlternativeSnapshots` aus, nicht die volle Action-Sequenz.

## Finding-Scope

Die Vorgabe nennt:

- `action_limit_reached`
- `late_draw_without_coverage_or_hand_goal`
- `runner_late_gain_credit_real_reserve`
- `corp_late_gain_credit_no_safe_alternative`

Die drei letzten IDs sind im aktuellen Code Subcluster von `action_limit_reached`, keine eigenständigen Detector-IDs. Deshalb ist die Retention auf `action_limit_reached` beschränkt. Dadurch werden die genannten Residual-Subcluster erfasst, ohne alle übrigen Findings mit Alternativen anzureichern.

## Redaction-safe Summary

Das Matrix-Skript schreibt pro retained Entry:

- `actionIndex`
- `side`
- `stateVersionBefore`
- `selectedActionType`
- pro Alternative:
  - `rank`
  - `actionType`
  - `selected`
  - `sourceKind`
  - optionaler öffentlicher `sourceDefinitionId`
  - `scoreKeys`
  - `whyChosen`
  - `whyNot`
  - `economy`

Bewusst nicht im Matrix-Output:

- rohe Action-IDs,
- rohe Source-IDs,
- `cardInstances`,
- `privatePayload`,
- `FullGameState`,
- gegnerische Hidden-Zonen,
- private Kartenlisten.

## Probe

Probe-Befehl:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/.tmp-ai127-alternatives-probe.json --pairs d --seeds ai-v143-tuning-006 --max-actions 160 --max-findings 20 --include-action-alternatives --max-alternatives-per-finding 3
```

Ergebnis:

| Metrik | Wert |
| --- | ---: |
| Spiele | 1 |
| Action-Limit | 1 |
| Subcluster | `corp_late_gain_credit_no_safe_alternative` |
| retained Alternative-Snapshot-Entries | 6 |
| max Alternativen je Entry | 3 |
| Forbidden-Marker-Scan | grün |

Beispiel aus der Probe:

- ausgewählt: `gain_credit`
- Alternativen: `draw_card`, `install_card`
- Score-Keys: unter anderem `semantic_type_priority`, `corp_install_score_line`, `corp_install_protection`, `semantic_credit_cost_penalty`
- kein roher `actionId` im Matrix-Summary.

## Tests

Ergänzt:

- `keeps action alternatives scoped to action-limit finding windows`

Geprüft:

- Opt-in erzeugt weiterhin Snapshots für Action-Limit-Fenster.
- Kein Opt-in erzeugt keine Snapshots.
- Opt-in ohne Action-Limit-Finding behält keine Alternativen.
- Redaction-Scan bleibt grün.

## Entscheidung

AI127 nimmt keine Runtime-Änderung vor. Die Änderung betrifft Diagnose- und Review-Artefakte. Künftige x10-Restcluster können mit side-safe LegalAction-Alternativen geprüft werden, ohne Hidden-Info-Grenzen auszuweiten.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "action alternatives"`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "scoped to action-limit"`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/.tmp-ai127-alternatives-probe.json --pairs d --seeds ai-v143-tuning-006 --max-actions 160 --max-findings 20 --include-action-alternatives --max-alternatives-per-finding 3`
- `git diff --check`
