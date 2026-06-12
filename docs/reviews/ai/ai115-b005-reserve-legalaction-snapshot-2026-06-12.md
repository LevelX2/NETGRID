# AI115 B005 Reserve LegalAction Snapshot

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI115 macht den harten Restkandidaten B / `ai-v143-tuning-005` side-safe sichtbar: wiederholte Runner-Reserve-Credits mit Wall-Coverage-Lücke und ohne stabile Folgekonversion.

## Artefakt

Snapshot:

- `docs/reviews/ai/ai115-b005-reserve-legalaction-snapshot-2026-06-12.json`

Kontext:

- Pair: B, `Stealth Interface Starter vs Manhunt Pressure Bureau`
- Seed: `ai-v143-tuning-005`
- Ergebnis: `action_limit_reached`
- Actions: 160
- Replay: grün
- Redaction safe: grün

## Befund

Der Snapshot enthält 37 Runner-Reserve-/Coverage-Credit-Fenster. Der harte Rest beginnt bei Action-Index 100 und bleibt bis ins Endfenster sichtbar.

Wichtige Fakten:

- Die Runner-Credit-Actions tragen durchgehend `runnerSetupMissingCoverageTypes: ["wall"]`.
- `start_run`-Alternativen auf R&D und HQ sind nicht sichere Alternativen, weil sie durch `semantic_excluded:known_ice_path_no_access` und `reason:missing_breaker_coverage` blockiert sind.
- `draw_card` ist in den relevanten Fenstern die beste nicht ausgeschlossene Alternative, wird aber mit `plan_mismatch` und `excluded_by_current_plan` gegen den aktuellen `runner.build_credit_base`-Plan zurückgestellt.
- Später erscheint punktuell eine `install_card`-Alternative, aber im Endfenster ist sie nicht als Wall-Coverage-Fix belegt. Bei Action-Index 158 ist sie nur Rank 3 mit deutlich niedrigerem Score.

## Relevante Decision Windows

| Action | Turn | Credits vorher | Gewählt | Beste nicht ausgeschlossene Alternative | Bewertung |
| ---: | ---: | ---: | --- | --- | --- |
| 100 | 16 | 0 | `gain_credit` | `draw_card` | Run-Alternativen wegen fehlender Wall-Coverage ausgeschlossen |
| 101 | 16 | 1 | `gain_credit` | `draw_card` | später folgt Draw, aber erst nach weiteren Credits und Tag-Removal |
| 103 | 16 | 0 | `gain_credit` | `draw_card` | im Folgefenster folgen später Draw und Install, aber Credit wurde vorher weiter bevorzugt |
| 110 | 18 | 1 | `gain_credit` | `draw_card` | gleicher Plan-Mismatch gegen Coverage-Draw |
| 155-158 | 26 | 1-4 | `gain_credit` | `draw_card` | Endfenster ohne Folgekonversion |

## Schlussfolgerung

AI115 belegt erstmals eine konkrete bessere legale Alternative für den B005-Resttyp: `draw_card` ist legal, nicht per Safety-Gate ausgeschlossen und direkt passend zur sichtbaren Wall-Coverage-Lücke. Gleichzeitig ist `start_run` gerade keine sichere Alternative, weil die bekannten Pfade an fehlender Wall-Coverage scheitern.

Das ist noch kein Runtime-Fix. Es ist aber eine belastbare Grundlage für AI117/AI121: Ein enger Kandidat darf nur den Fall adressieren, in dem wiederholte späte Reserve-Credits trotz sichtbarer Coverage-Lücke eine legale Coverage-/Draw-Alternative verdrängen und keine sichere Run-Alternative existiert.

## Redaction-Grenze

Der Snapshot enthält keine `cardInstances`, kein `privatePayload`, keinen FullGameState und keine gegnerischen Hidden-Zonen. Enthalten sind nur side-safe Decision-Debug-Felder, Actiontypen, safe ActionIds, Scores, öffentliche Kosten-/Gate-Evidence und Runner-eigene Diagnosekontexte.

## Verifikation

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/ai115-generate-b005-snapshot.test.ts` temporär zur Artefakterzeugung
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
