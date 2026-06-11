# AI093 Action Semantic TargetContext Coverage Review

Datum: 2026-06-11

Branch: `codex/ai088-ai094-post-stabilization-closure`

## Ergebnis

AI093 erweitert die Action-Semantic-Coverage-Auswertung um TargetContext-Status pro Coverage-Gruppe.

Neu im Summary-Objekt:

- `targetContextByGroup`

Neu im Report:

- `## Target Context By Group`

Die Erweiterung ändert kein Runtime-Verhalten. Sie macht sichtbar, ob Zielkontext-Lücken vor allem in `run_action`, `access_action`, `install_action`, `score_action` oder anderen Gruppen liegen.

## Motivation

Der bisherige Coverage-Report zeigte TargetContext global über `targetContextStatuses`. Für Paket- und Trace-Reviews reicht das nicht aus, wenn eine Lücke nur bestimmte Aktionsfamilien betrifft. Die neue Gruppentabelle erlaubt gezielte Nacharbeit, ohne hidden Payloads oder CardInstance-IDs offenzulegen.

## Verifikation

- `corepack pnpm exec prettier --write packages/ai/src/actions/action-semantic-coverage.ts packages/ai/src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

## Safety

- Keine Engine- oder Runtime-Entscheidungslogik geändert.
- Bericht bleibt redaction-safe.
- Test prüft exemplarisch `run_action.engine_provided = 1` und `install_action.missing = 1`.

