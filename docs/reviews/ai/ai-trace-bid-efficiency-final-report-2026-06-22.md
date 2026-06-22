# AI Trace Bid Efficiency Final Report 2026-06-22

Status: `completed_on_main_with_runtime_followup`

Branch: `codex/ai-trace-bid-efficiency`

## Ergebnis

AI-TRACE-BID-0 bis AI-TRACE-BID-4 wurden sequenziell umgesetzt. Die Runner-KI nutzt jetzt eine generische Trace-Bid-Effizienzpolicy für `bid_amount`-Choices: Wenn side-safe sichtbare Trace-Felder zeigen, dass ein bezahlbares Runner-Gebot das Trace-Ergebnis nicht verbessern kann, wählt die KI den billigsten gleichwertigen Bid, im Screenshot-Fall also `bid_0`.

Der Fix ist kein `Chance Observation`-Sonderfall. Er wirkt auf Runner-Trace-Bids mit bekannter öffentlicher `traceStrength` und `runnerLink`. Dabei ist `traceStrength` der Engine-Vertrag für die bereits berechnete Korp-Trace-Stärke nach Korp-Gebot; `corpBid` ist öffentliche Kontextinformation, wird aber nicht erneut addiert. Bei unbekanntem Kontext bleibt die bisherige Auswahl erhalten.

## Umsetzung

- Neuer Helper: `packages/ai/src/trace-bid-efficiency.ts`.
- Neue fokussierte Tests: `packages/ai/src/trace-bid-efficiency.test.ts`.
- Runtime-Anbindung: `packages/ai/src/index.ts` bei `bid_amount`-Choice-Auflösung für Runner.
- Regression: `packages/ai/src/index.test.ts` deckt den Fall `Trace 5`, Korp-Bid 3, Runner 2 Credits ab und erwartet `bid_0`.
- Runtime-Follow-up nach Playtest vom 2026-06-22: Der Regressionstest nutzt nun den echten AI-EventTail statt manuell injizierten Trace-Kontext; Engine-Trace-Events geben `corpBid` im öffentlichen Payload explizit weiter, und die DTO-Allowlist lässt dieses öffentliche Feld durch.

## Sicherheitsgrenzen

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung: Die Policy nutzt nur vorhandene LegalActions, `pendingChoice.options` und side-safe PublicEvent-Felder.
- Korp-Bids wurden nicht produktiv umgestellt, weil der Korp-Bid vor späteren Runner-Link-/Runner-Bid-Schritten liegt und ohne zusätzliche sichere Prognose nicht eindeutig gleichwertig optimiert werden kann.

## Paketchecks

Paketweise ausgeführt und grün:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/trace-bid-efficiency.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## FINAL-GREEN

Ausgeführt am 2026-06-22 im Worktree `C:\Projekte\NETGRID_AI_TRACE_BID_EFFICIENCY`:

```bash
corepack pnpm --filter @netgrid/ai test
# Ergebnis: 132 Test Files passed, 1512 Tests passed

corepack pnpm --filter @netgrid/ai typecheck
# Ergebnis: passed

git diff --check
# Ergebnis: passed

git status --short
# Ergebnis: clean
```

## Follow-up-Verifikation

Nach dem Fetch-4.0.1-Playtestbefund vom 2026-06-22 erneut ausgeführt und grün:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/trace-bid-efficiency.test.ts src/index.test.ts
# Ergebnis: 2 Test Files passed, 521 Tests passed

corepack pnpm --filter @netgrid/engine exec vitest run src/game/trace/trace-orchestration.test.ts
# Ergebnis: 1 Test File passed, 8 Tests passed

corepack pnpm --filter @netgrid/ai typecheck
# Ergebnis: passed

corepack pnpm --filter @netgrid/engine typecheck
# Ergebnis: passed

git diff --check
# Ergebnis: passed
```
