# AI170 Opportunity-State Snapshot Instrumentation

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI170 ergänzt den Trace-Matrix-Flow um optionale Opportunity-Snapshot-Requests. Der Flow hält an explizit angeforderten Action-Indizes die bereits vorhandenen, redigierten Action-Alternativen fest. Es werden keine neuen LegalActions erzeugt und keine Runtime-Entscheidungen verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 17 |
| angeforderte Snapshots | 19 |
| verfügbare Snapshots | 17 |
| Alternativen mit SemanticActionSignature | 76 |
| AI159 TargetContext-missing-Fälle mit Snapshot | 2 |
| Fälle mit Progress-Alternative | 14 |
| Redaction safe | 1 |

## Fälle

| Case | AI159 Kategorie | Requests | Verfügbar | Snapshot Summary |
| --- | --- | ---: | ---: | --- |
| `A-ai-v143-tuning-006` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:1 legal/1 progress |
| `A-ai-v143-tuning-008` | `no_opportunity_state_found` | 1 | 0 | first_progress_action:missing |
| `A-ai-v143-tuning-009` | `opportunity_target_context_missing` | 2 | 2 | preceding_same_side_decision:1 legal/0 progress, first_progress_action:5 legal/1 progress |
| `B-ai-v143-tuning-001` | `opportunity_target_context_missing` | 2 | 2 | preceding_same_side_decision:4 legal/1 progress, first_progress_action:3 legal/0 progress |
| `B-ai-v143-tuning-003` | `no_opportunity_state_found` | 1 | 0 | first_progress_action:missing |
| `B-ai-v143-tuning-006` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/3 progress |
| `B-ai-v143-tuning-008` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/1 progress |
| `B-ai-v143-tuning-009` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/3 progress |
| `C-ai-v143-tuning-001` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/2 progress |
| `C-ai-v143-tuning-005` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/1 progress |
| `C-ai-v143-tuning-006` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:1 legal/0 progress |
| `C-ai-v143-tuning-007` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/1 progress |
| `C-ai-v143-tuning-008` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/4 progress |
| `D-ai-v143-tuning-003` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/3 progress |
| `D-ai-v143-tuning-004` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/3 progress |
| `D-ai-v143-tuning-008` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:6 legal/2 progress |
| `D-ai-v143-tuning-010` | `no_opportunity_state_found` | 1 | 1 | first_progress_action:1 legal/1 progress |

## Schluss

AI170 entfernt den wichtigsten technischen Blocker aus AI159 für die zwei TargetContext-missing-Fälle: A-ai-v143-tuning-009 und B-ai-v143-tuning-001 haben jetzt echte redigierte Opportunity-Snapshots. Die übrigen Fälle bleiben überwiegend ohne früheren Opportunity-State aus AI159 und damit weiterhin No-Go für Cutover. Folgepakete dürfen nur aus diesen Snapshots argumentieren, nicht aus Full-State- oder Hidden-Info-Daten.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai170-source-x10-alternatives-2026-06-13.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 50 --include-action-alternatives --max-alternatives-per-finding 6 --opportunity-snapshot-source docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.json`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai170-opportunity-state-snapshots.ts`
- `corepack pnpm --filter @netgrid/ai test -- selfplay-trace-mining`
- `git diff --check`
