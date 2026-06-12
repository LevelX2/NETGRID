# AI116 Action Alternative Snapshot Framework

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI116 macht die für AI115 benötigten LegalAction-Alternativen zu einem kleinen wiederverwendbaren Diagnosewerkzeug im Selfplay-Trace-Mining.

## Umsetzung

Neue optionale Trace-Mining-Parameter:

- `includeActionAlternativesForFindings`
- `maxAlternativesPerFinding`

Default-Verhalten:

- Action-Alternativen bleiben aus dem Trace entfernt.
- Runtime-Entscheidungen bleiben unverändert.
- Bestehende Trace-Größe bleibt unverändert, solange der Parameter nicht aktiv ist.

Opt-in-Verhalten:

- Die Simulation übernimmt side-safe `decisionDebug.actionAlternatives` in die Action-Sequenz.
- Nach der Finding-Ermittlung bleiben Alternativen nur in einem engen Finding-Fenster erhalten.
- Die Anzahl wird über `maxAlternativesPerFinding` begrenzt.

## Redaction-Grenze

Das Framework nutzt die bereits sanitisierten `AiDecisionDebug.actionAlternatives`. Der Regressionstest scannt den Ergebnis-JSON-String gegen verbotene Marker wie `cardInstances`, `privatePayload`, Tokens, FullGameState, `AIInput` und `DecisionDebug`.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "action alternative snapshots"`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Schlussfolgerung

B005 kann jetzt reproduzierbar über das Framework ausgewertet werden, ohne die Standardtraces aufzublasen oder Runtime-Verhalten zu verändern.
