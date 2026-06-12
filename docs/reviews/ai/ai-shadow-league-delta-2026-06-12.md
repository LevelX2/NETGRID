# AI Shadow League Delta 2026-06-12

## Status

delta_report_added

## Scope

AI-MAT2-16 ergänzt einen typisierten Delta-Report für die Semantic Shadow League. Der Report vergleicht eine Baseline mit einem aktuellen Shadow-League-Report und bleibt strikt diagnostisch.

## Delta-Metriken

| Metrik | Vergleich |
| --- | --- |
| `agreementRateDelta` | Baseline gegen aktuellen `metrics.agreementRate`; höhere Werte gelten als Verbesserung. |
| `mistakeCountDelta` | Baseline gegen aktuellen `metrics.mistakeCount`; niedrigere Werte gelten als Verbesserung. |
| `pilotEligibilityDelta` | Baseline gegen aktuellen `metrics.pilotEligibilityRate`; höhere Werte gelten als breitere diagnostische Pilot-Abdeckung. |
| `scopeBreakdownDelta` | Pro Pilot-Scope: Eligible-/WouldOverride-Delta sowie hinzugekommene und entfernte Szenario-IDs. |
| `topDisagreementReasonDelta` | Hinzugekommene, entfernte und unveränderte Top-Disagreement-Gründe. |

## Sicherheitsstatus

- `scope`: `semantic_shadow_league_delta_report_only`
- `productiveUseAllowed`: `false`
- `semanticExecutionAllowed`: `false`
- `runtimeConsumerStatus`: `none`
- `noRuntimeEffect`: `true`
- `redactionStatus`: `passed`

## Einordnung

- Der Delta-Report ist eine Auswertungs- und Review-Hilfe. Er öffnet keine produktive KI-Ausführung und erzeugt keine Runtime-Entscheidung.
- Die Side-Safety-Prüfung läuft auf dem gesamten Delta-Objekt und blockiert verbotene Hidden-Info-Marker.
- Die Testabdeckung nutzt den realen Engine-Decision-Corpus als aktuellen Stand und eine kontrolliert reduzierte Baseline, damit Fortschrittsrichtung, Scope-Delta und Disagreement-Delta stabil geprüft werden.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league-delta.test.ts`: bestanden.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league.test.ts`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
