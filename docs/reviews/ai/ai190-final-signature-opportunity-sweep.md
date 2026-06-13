# AI190 Final Signature Opportunity Sweep

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI190 schließt AI181 bis AI190 mit finalen x5-/x10-Traces und vollständigen lokalen Gates ab. Da AI183, AI184, AI186 und AI187 keinen proof-fähigen Kandidaten liefern, bleibt der Runtime-Pfad unverändert.

## Sweep-Ergebnis

| Sweep | Games | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | Redaction Safe | Avg Length | Corp Scores | Runner Steals | Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| x5 | 20 | 11 | 0 | 0 | 0 | ja | 124.6 | 13 | 28 | 5 |
| x10 | 40 | 23 | 0 | 0 | 0 | ja | 129.45 | 23 | 49 | 10 |

## Blockabschluss

| Paket | Ergebnis |
| --- | --- |
| AI181 | 76/76 Opportunity-Alternativen tragen `SemanticActionSignature` |
| AI182 | 0 Candidate-Path-TargetIdentities vollständig, präzise Blocker für alle 3 AI177-Kandidaten |
| AI183 | 35 Signaturfamilien, 15 wiederholt, 3 Kandidaten geprüft, 0 Gate-pass |
| AI184 | 3 Kandidaten geprüft, 0 replay-probed, 3 nicht probbar |
| AI185 | 20 Punish-Stale-Fälle zerlegt: 6 missing tag, 11 missing payoff, 2 scoreline, 1 protection |
| AI186 | 13 Coverage-Fälle geprüft, 9 mit Signatur, 0 TargetIdentity-pass, 0 Gate-positive |
| AI187 | No-Go, kein signature-proven Micro Candidate |
| AI188 | Scorecard v4: Signatur vollständig, TargetIdentity/Replay/Cutover weiter 0 |
| AI189 | Catalog-Data-Test dreimal fokussiert grün, Timeout eng begrenzt |

## Schluss

Der Folgeblock hat die Beweiskette präzisiert, aber keinen Runtime-Cutover gerechtfertigt. Der neue Stand ist:

```text
Opportunity Snapshot
→ SemanticActionSignature vorhanden
→ TargetIdentity für Candidate-Pfad fehlt
→ PlayerAction-Replay nicht probbar
→ Runtime-Cutover bleibt No-Go
```

Der nächste sinnvolle Engpass ist nicht Scoring, sondern eine engere Snapshot-Instrumentierung der candidate-path LegalAction-Daten: stabile redigierte `actionId`, side-safe TargetIdentity und daraus baubare PlayerAction.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai190-final-a-d-5seed-2026-06-13.json --max-actions 160 --max-findings 50`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai190-final-a-d-10seed-2026-06-13.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 50`
- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`
