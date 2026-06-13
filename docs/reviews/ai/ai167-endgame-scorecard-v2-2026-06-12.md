# AI167 Endgame Scorecard v2

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI167 konsolidiert die Endgame-Evidence aus AI132, AI158 und AI159 bis AI165 in einer wiederholbar erzeugten Scorecard. Die Scorecard ersetzt keinen Runtime-Test und führt keine neuen Heuristiken ein.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Interpretation |
| --- | ---: | ---: | --- |
| `action_limit_rate_x5` | 11/20 | 55.0% | Action-limit pressure in the compact final sweep. |
| `action_limit_rate_x10` | 23/40 | 57.5% | Action-limit pressure in the broader final sweep. |
| `progress_conversion_rate` | 670/1260 | 53.2% | Share of labelled endwindow actions with direct progress. |
| `stale_intent_rate` | 27/122 | 22.1% | Share of AI151 intent-memory records that remained stale without conversion. |
| `coverage_path_completion` | 10/15 | 66.7% | Coverage cases with concrete visible or searchable path candidates. |
| `corp_tempo_conversion` | 20/20 | 100.0% | Corp/mixed cases with a documented tempo-conversion path. |
| `same_state_opportunity_proof_rate` | 0/17 | 0.0% | Gate metric for any runtime cutover. |
| `lookahead_proxy_win_rate` | 7/10 | 70.0% | Static endwindow proxy wins without LegalAction proof. |

## Trace-Vergleich

| Sweep | Games | Action Limits | Repeated No Progress Run | Unsafe Score Chosen | Passive Scoreline | Corp Scores | Runner Steals | Flatlines | Avg Length |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| x5 | 20 | 11 | 33 | 4 | 7 | 13 | 28 | 5 | 124.6 |
| x10 | 40 | 23 | 56 | 7 | 14 | 23 | 49 | 10 | 129.45 |

## Schluss

Die Scorecard bestätigt zwei getrennte Aussagen. Erstens sind konkrete Progress-, Coverage- und Corp-Tempo-Pfade im Material sichtbar. Zweitens ist die Cutover-Voraussetzung weiterhin nicht erfüllt, weil die Same-State/Opportunity-Proof-Rate bei 0% liegt. Runtime-Optimierungen bleiben deshalb blockiert, bis redaction-sichere Opportunity-State-LegalAction-Snapshots instrumentiert sind.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai167-endgame-scorecard-v2.ts`
- `git diff --check`
