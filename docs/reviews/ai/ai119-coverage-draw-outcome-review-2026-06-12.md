# AI119 Coverage Draw Outcome Review

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI119 prüft den neuen `late_draw_for_coverage_or_hand_goal`-Fall aus Pair C / `ai-v143-tuning-004` outcome-basiert: Führt das Drawen später zu Coverage oder Fortschritt?

## Grundlage

Quelle:

- `docs/reviews/ai/ai109-late-draw-action-limit-case-detail-2026-06-12.json`

Fall:

- Pair: C, `Blink Pressure Rig vs Ivory Bastion`
- Seed: `ai-v143-tuning-004`
- Winner: `action_limit_reached`
- Late Draws: 111, 130, 152, 153, 154
- Sichtbare Lücke: `runnerSetupMissingCoverageTypes: ["wall"]`

## Outcome-Klassifikation

| Draw | Turn | Credits | Folgefenster | Kategorie |
| ---: | ---: | ---: | --- | --- |
| 111 | 16 | 10 | Danach `install_card`, später weiter Economy und Draw | `coverage_draw_preserved_option` |
| 130 | 20 | 10 | Danach `play_event`, `start_run` auf R&D, Run-Microflow bis Break/Continue | `coverage_draw_converted` |
| 152 | 22 | 7 | Danach zwei weitere Draws, dann End Turn, kein Runner-Fortschritt vor Limit | `coverage_draw_no_conversion` |
| 153 | 22 | 7 | Danach ein weiterer Draw, dann End Turn, kein Runner-Fortschritt vor Limit | `coverage_draw_no_conversion` |
| 154 | 22 | 7 | Danach End Turn, kein Runner-Fortschritt vor Limit | `coverage_draw_no_conversion` |

## Bewertung

Die Coverage-Draw-Klasse ist nicht grundsätzlich falsch:

- Draw 111 erhält eine Option und geht in einen späteren Entwicklungs-/Pressure-Pfad über.
- Draw 130 konvertiert in einen konkreten R&D-Run-Microflow.

Die finalen Draws 152-154 bleiben aber ein echter Endfenster-Rest:

- keine sichtbare Coverage-Installation,
- keine Search-Folge,
- kein Access/Trash/Steal,
- keine belegte bessere LegalAction im gleichen Entscheidungsfenster.

## Schlussfolgerung

AI119 liefert keinen eigenständigen Runtime-Fix. Der Fall bleibt für AI121 nur dann relevant, wenn eine bessere legale Alternative im gleichen Fenster belegt wird. Ohne diese Alternative wäre eine pauschale späte Draw-Strafe zu breit, weil derselbe Falltyp vorher bereits Fortschritt oder Optionserhalt zeigt.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
