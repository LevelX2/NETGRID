# AI077 ActionSemanticCandidate Coverage Report v1

Datum: 2026-06-10

## Ergebnis

AI077 ist als read-only Reporting-Baustein umgesetzt. Die neue Aggregation `summarizeActionSemanticCandidateCoverage` und der Formatter `formatActionSemanticCandidateCoverageReport` lesen ausschließlich vorhandene `ActionSemanticCandidate`-Objekte und liefern Coverage-Buckets fuer Review, ohne Runtime-Entscheidungsverhalten zu veraendern.

## Abgedeckte Felder

- `actionType`
- `semanticActionType`
- `primaryProjectionStatus`
- `sourceKind`
- `hasSourceCardId`
- `hasAbilityId`
- `hasCostProfile`
- `hasTimingProfile`
- `hasTargetContext`
- `targetContextStatus`
- `usesNeutralFallback`
- `redactionSafe`

## Abgedeckte Gruppen

- `basic_action`
- `game_rule`
- `runner_card_action`
- `corp_card_action`
- `choice_resolution`
- `run_action`
- `access_action`
- `corp_window_action`
- `score_action`
- `install_action`
- `advance_action`
- `rez_action`

## Redaction-Kontrakt

Der Report gibt keine Aktions-IDs, CardInstance-IDs, Payload-Werte oder Source-/Ability-IDs aus. Er aggregiert nur Typen, Statuswerte, Booleans und Gruppenzaehler. Ein expliziter Marker-Check blockiert bekannte verbotene Report-Marker wie `privatePayload`, `sessionToken`, `reconnectToken`, `joinToken`, `fullGameState`, `AIInput`, `DecisionDebug`, `sourceCardInstanceId` und Hidden-Zone-Marker.

## Testnachweis

- `corepack pnpm --filter @netgrid/ai typecheck`: PASS
- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts src/action-semantic-candidate.test.ts src/simulation/benchmark-reports.test.ts`: PASS, 20 Tests
- `git diff --check`: PASS

## Selfplay

Kein A-D-x5-Selfplay-Lauf fuer AI077. Das Paket ist diagnose-only und nicht in die Auswahl- oder Scoring-Runtime verdrahtet.
