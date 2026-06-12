# AI144 Endgame Intent Memory Shadow

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI144 diagnostiziert Endfenster-Schleifen über Absichten statt über pauschale Einzelaktions-Mali. Es trackt, ob ein Zielversuch konvertiert, stale wird oder mangels belegter LegalAction-Alternative blockiert bleibt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 21 |
| Intents | 96 |
| Redaction-safe | 1 |

## Status

| Status | Anzahl |
| --- | ---: |
| `intent_blocked_by_no_legal_alternative` | 35 |
| `intent_converted` | 56 |
| `intent_stale` | 5 |

## Intent-Typen

| Intent | Anzahl |
| --- | ---: |
| `corp_economy` | 20 |
| `corp_tempo` | 20 |
| `runner_coverage` | 15 |
| `runner_reachability` | 21 |
| `runner_reserve` | 20 |

## Fälle

| Case | Subcluster | Intents |
| --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | `runner_reachability:intent_converted:7`, `runner_coverage:intent_converted:3`, `runner_reserve:intent_blocked_by_no_legal_alternative:11`, `corp_tempo:intent_converted:1`, `corp_economy:intent_blocked_by_no_legal_alternative:7` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:6`, `corp_economy:intent_blocked_by_no_legal_alternative:7`, `runner_reachability:intent_converted:10`, `runner_coverage:intent_converted:8`, `corp_tempo:intent_converted:2` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:12`, `corp_tempo:intent_converted:2`, `runner_reachability:intent_converted:13`, `corp_economy:intent_blocked_by_no_legal_alternative:5` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp_economy:intent_stale:10`, `runner_reserve:intent_blocked_by_no_legal_alternative:14`, `corp_tempo:intent_converted:1`, `runner_reachability:intent_converted:14` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp_economy:intent_stale:12`, `runner_reachability:intent_converted:7`, `corp_tempo:intent_converted:3`, `runner_reserve:intent_blocked_by_no_legal_alternative:8`, `runner_coverage:intent_converted:6` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:20`, `corp_economy:intent_stale:11`, `runner_coverage:intent_converted:1`, `corp_tempo:intent_converted:1`, `runner_reachability:intent_converted:3` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `runner_reserve:intent_blocked_by_no_legal_alternative:9`, `corp_economy:intent_blocked_by_no_legal_alternative:7`, `runner_coverage:intent_converted:3`, `runner_reachability:intent_converted:16` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `runner_coverage:intent_converted:4`, `runner_reserve:intent_blocked_by_no_legal_alternative:15`, `corp_tempo:intent_converted:1`, `corp_economy:intent_blocked_by_no_legal_alternative:12`, `runner_reachability:intent_converted:6` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:16`, `corp_tempo:intent_converted:4`, `corp_economy:intent_stale:9`, `runner_reachability:intent_converted:8`, `runner_coverage:intent_converted:1` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | `runner_reachability:intent_converted:10`, `runner_reserve:intent_blocked_by_no_legal_alternative:15`, `corp_economy:intent_blocked_by_no_legal_alternative:1`, `runner_coverage:intent_converted:3`, `corp_tempo:intent_converted:1` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | `corp_economy:intent_blocked_by_no_legal_alternative:8`, `runner_reachability:intent_converted:22`, `corp_tempo:intent_converted:2`, `runner_reserve:intent_blocked_by_no_legal_alternative:6`, `runner_coverage:intent_converted:4` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp_economy:intent_blocked_by_no_legal_alternative:6`, `corp_tempo:intent_converted:3`, `runner_coverage:intent_converted:3`, `runner_reserve:intent_blocked_by_no_legal_alternative:11`, `runner_reachability:intent_converted:9` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:16`, `runner_coverage:intent_converted:6`, `corp_economy:intent_blocked_by_no_legal_alternative:3`, `corp_tempo:intent_converted:2`, `runner_reachability:intent_converted:3` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `corp_economy:intent_blocked_by_no_legal_alternative:4`, `runner_coverage:intent_converted:14`, `runner_reserve:intent_blocked_by_no_legal_alternative:5`, `runner_reachability:intent_converted:8`, `corp_tempo:intent_converted:2` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner_coverage:intent_converted:21`, `corp_tempo:intent_converted:3`, `corp_economy:intent_blocked_by_no_legal_alternative:7`, `runner_reachability:intent_converted:3` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | `corp_tempo:intent_converted:3`, `corp_economy:intent_blocked_by_no_legal_alternative:4`, `runner_reserve:intent_blocked_by_no_legal_alternative:7`, `runner_reachability:intent_converted:20`, `runner_coverage:intent_converted:2` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | `runner_reachability:intent_converted:35`, `runner_reserve:intent_blocked_by_no_legal_alternative:3`, `corp_tempo:intent_converted:2` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `runner_reserve:intent_blocked_by_no_legal_alternative:12`, `runner_reachability:intent_converted:18`, `corp_tempo:intent_converted:2`, `corp_economy:intent_blocked_by_no_legal_alternative:8` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | `runner_reserve:intent_blocked_by_no_legal_alternative:12`, `corp_economy:intent_stale:13`, `runner_coverage:intent_converted:6`, `runner_reachability:intent_converted:7`, `corp_tempo:intent_converted:2` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `runner_reachability:intent_converted:20`, `runner_reserve:intent_blocked_by_no_legal_alternative:11`, `corp_economy:intent_blocked_by_no_legal_alternative:3`, `corp_tempo:intent_converted:2` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `runner_reachability:intent_converted:20`, `corp_economy:intent_blocked_by_no_legal_alternative:8`, `corp_tempo:intent_converted:1`, `runner_reserve:intent_blocked_by_no_legal_alternative:9` |

## Schluss

Intent Memory ist als Shadow-Signal brauchbar: Es macht stale Zielversuche sichtbar, ohne Credit, Draw, Run oder Corp-Economy pauschal zu bestrafen. Ein späterer Runtime-Einsatz müsste auf Zielwechseln mit same-state LegalAction-Proof beruhen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai144-endgame-intent-memory-shadow.ts`
- `git diff --check`
