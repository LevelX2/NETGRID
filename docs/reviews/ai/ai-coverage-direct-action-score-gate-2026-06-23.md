# AI Coverage Direct Action Score Gate 2026-06-23

## Ergebnis

Der Ranking-Risikofall wurde bestätigt und minimal behoben. `runner.obtain_breaker_coverage` schützte direkt gemappte Coverage-Aktionen wie `trigger_ability`, `install_card` oder `play_event` bislang pauschal gegen einen besseren `start_run`, sobald die Aktion nicht `gain_credit` oder `draw_card` war. Dadurch konnte auch eine nichtpositiv bewertete direkte Coverage-Antwort einen klar positiven Run blockieren.

## Ursache

`tacticalPlanCoverageMappingBlocksRunOverride(...)` unterschied zwar generische Coverage-Fallbacks von direkten Coverage-Antworten, band den direkten Schutz aber nicht an den aktuellen Semantic-Score der gemappten Aktion. Die Plan-Mapping-Schicht belegt weiterhin, dass die LegalAction zum Coverage-Schritt passt und legal verfügbar ist; ohne positiven Score fehlte aber die fachliche Nutzenschwelle.

## Fix

Direkte Coverage-Antworten schützen den Plan-Mapping-Choice nur noch, wenn der gemappte Semantic-Choice positiv bewertet ist. Nichtpositive direkte Coverage-Antworten fallen dadurch in die bestehende Override-Logik zurück und können von einem klar positiven Run überstimmt werden.

Sinnvolle direkte Coverage-Antworten mit positivem Score bleiben geschützt. Generische Coverage-Fallbacks wie `gain_credit` und `draw_card` behalten die bestehende Score-Gap-Regel.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`

Der vollständige AI-Testlauf bestand mit 141 Testdateien und 1584 Tests.

## Vertragsgrenzen

Keine Engine-Änderung, keine neue LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash oder Randomness und keine Hidden-Info-Ausweitung. Die Entscheidung bleibt LegalActions-only.
