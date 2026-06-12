# AI110 Corp No-Safe-Alternative Endwindow Audit

Datum: 2026-06-12

## Ziel

AI110 prüft den einzelnen `corp_late_gain_credit_no_safe_alternative`-Fall aus dem aktuellen A-D-x5-Trace. Der Fall wird nicht automatisch als Fehler behandelt.

## Fall

Detailartefakt:

- `docs/reviews/ai/ai110-corp-no-safe-alternative-endwindow-detail-2026-06-12.json`

Der Fall liegt in:

- Pair: D
- Seed: `ai-v143-tuning-004`
- Winner: `action_limit_reached`
- Actions: 160

## Endfenster

Im letzten 60-Action-Fenster nimmt die Corp nach einem Score in Turn 15 mehrfach Credits:

| Action-Index | Turn | Action | Plan | Relevante Signale |
| ---: | ---: | --- | --- | --- |
| 118 | 15 | `gain_credit` | `basic_economy_draw` | `own_credits:0`, `corp_safe_alternative:economy`, Rez-Signal |
| 131 | 17 | `gain_credit` | `basic_economy_draw` | `own_credits:1`, `corp_safe_alternative:economy`, Rez-Signal |
| 132 | 17 | `gain_credit` | `basic_economy_draw` | `own_credits:2`, `corp_safe_alternative:economy` |
| 133 | 17 | `gain_credit` | `basic_economy_draw` | `own_credits:3`, `corp_safe_alternative:economy` |
| 142 | 19 | `gain_credit` | `basic_economy_draw` | `own_credits:3`, `corp_safe_alternative:economy` |
| 143 | 19 | `gain_credit` | `basic_economy_draw` | `own_credits:4`, `corp_safe_alternative:economy` |
| 157 | 21 | `gain_credit` | `basic_economy_draw` | `own_credits:4`, `corp_safe_alternative:economy` |
| 158 | 21 | `gain_credit` | `basic_economy_draw` | `own_credits:5`, `corp_safe_alternative:economy` |

Die Trace-Facts markieren keine sichere Score-, Advance- oder Agenda-Install-Alternative. Die vorhandene sichere Alternative ist Economy. Der Legacy-Referenzpfad nennt `activated_card_ability`, aber ohne Scoreline-, Protection- oder Tempo-Evidence reicht das nicht für einen engen Runtime-Fix.

## Bewertung

Der Fall ist ein echter Tempo-/Planqualitätsrest, aber kein klarer Bug:

- Es gibt keine illegale Action.
- Replay und Redaction bleiben grün.
- `unsafeScoreChosen` bleibt im Zielkorridor.
- Eine pauschale Bestrafung von Corp-Credits würde die Score-/Rez-Reserve-Grenze gefährden.
- Ein Tie-Breaker auf `activated_card_ability` wäre nicht belastbar, solange der Trace keine sichere payoff-relevante Ability-Evidence trägt.

## Entscheidung

Kein Runtime-Fix in AI110.

Der Fall bleibt als `corp_late_gain_credit_no_safe_alternative` sichtbar. Ein späterer Fix braucht zusätzliche Evidence, die eine konkrete sichere Tempo-Aktion belegt, zum Beispiel:

- sichere Advance-/Score-Vorbereitung,
- sichere Remote-Protection,
- sichere install-/rez-relevante Aktion,
- oder eine Ability mit nachweisbarem Fortschritt statt bloß Legacy-Referenz.

## Checks

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Schlussfolgerung

AI110 liefert keinen sicheren `<= 8`-Kandidaten. Der Fall ist erklärter Rest, nicht diagnoseloser Mischfall.
