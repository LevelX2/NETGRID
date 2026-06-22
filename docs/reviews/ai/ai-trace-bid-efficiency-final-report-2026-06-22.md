# AI Trace Bid Efficiency Final Report 2026-06-22

Status: `review_complete_pending_final_green`

Branch: `codex/ai-trace-bid-efficiency`

## Ergebnis

AI-TRACE-BID-0 bis AI-TRACE-BID-4 wurden sequenziell umgesetzt. Die Runner-KI nutzt jetzt eine generische Trace-Bid-Effizienzpolicy für `bid_amount`-Choices: Wenn side-safe sichtbare Trace-Felder zeigen, dass ein bezahlbares Runner-Gebot das Trace-Ergebnis nicht verbessern kann, wählt die KI den billigsten gleichwertigen Bid, im Screenshot-Fall also `bid_0`.

Der Fix ist kein `Chance Observation`-Sonderfall. Er wirkt auf Runner-Trace-Bids mit bekanntem `traceStrength`, `runnerLink` und sichtbarem `corpBid`. Bei unbekanntem Kontext bleibt die bisherige Auswahl erhalten.

## Umsetzung

- Neuer Helper: `packages/ai/src/trace-bid-efficiency.ts`.
- Neue fokussierte Tests: `packages/ai/src/trace-bid-efficiency.test.ts`.
- Runtime-Anbindung: `packages/ai/src/index.ts` bei `bid_amount`-Choice-Auflösung für Runner.
- Regression: `packages/ai/src/index.test.ts` deckt den Fall `Trace 5`, Korp-Bid 3, Runner 2 Credits ab und erwartet `bid_0`.

## Sicherheitsgrenzen

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung: Die Policy nutzt nur vorhandene LegalActions, `pendingChoice.options` und side-safe PublicEvent-Felder.
- Korp-Bids wurden nicht produktiv umgestellt, weil der Korp-Bid vor späteren Runner-Link-/Runner-Bid-Schritten liegt und ohne zusätzliche sichere Prognose nicht eindeutig gleichwertig optimiert werden kann.

## Bisherige Checks

Paketweise ausgeführt und grün:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/trace-bid-efficiency.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Der vollständige AI-Green-Lauf und der lokale Merge nach `main` folgen im Paket `FINAL-GREEN`.

