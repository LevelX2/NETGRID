# AI125 x10 Runner Reserve Outcome Review

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI125 prüft die neun offiziellen `runner_late_gain_credit_real_reserve`-Fälle aus A-D-x10 outcome-basiert. B005 wird nicht mehr als Sonderfall behandelt, sondern als einer von mehreren Reserve-Fällen.

## Quelle

- Offizielle x10-Subcluster: `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- Einzelinventar und letzte 60 Actions: `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`

Offizieller Umfang:

| Pair | Runner-Reserve-Fälle |
| --- | ---: |
| A | 1 |
| B | 4 |
| C | 3 |
| D | 1 |
| Gesamt | 9 |

## Falltabelle

| Pair | Seed | Punkte R/C | Reserve-Credits im Endfenster | Coverage-Lücken | Folgeprogress im 20er-Fenster | Kategorie |
| --- | --- | ---: | ---: | --- | --- | --- |
| A | `ai-v143-tuning-009` | 0/3 | 12 | keine strukturierte Lücke | `install_card`, Remote-Run, `access_card`, `trash_accessed_card`; spätere Trash-Progression bei 157 | `reserve_converted_to_progress` |
| B | `ai-v143-tuning-003` | 6/3 | 5 | `code_gate`, `wall` | Run, Draw, Install, Ability; letzte Progress-Aktion `install_card` bei 155 | `reserve_preserved_reachability` |
| B | `ai-v143-tuning-005` | 0/0 | 19 | `wall` | Tag-Removal, spätere Access-/Trash-Progression bei 134 | `reserve_preserved_reachability` |
| B | `ai-v143-tuning-008` | 3/0 | 15 | `wall` | Run, `access_card`, `trash_accessed_card`; spätere Trash-Progression bei 128 | `reserve_converted_to_progress` |
| B | `ai-v143-tuning-009` | 0/6 | 16 | `sentry` | Install, Run, `access_card`, `trash_accessed_card`; spätere Trash-Progression bei 143 | `reserve_converted_to_progress` |
| C | `ai-v143-tuning-001` | 5/3 | 13 | `wall` | Install, Draw, Event; letzte Progress-Aktion ist Corp `advance_card` bei 159 | `reserve_preserved_reachability` |
| C | `ai-v143-tuning-005` | 3/0 | 14 | `code_gate`, `wall` | Event, Install, spätere Trash-Progression bei 155 | `reserve_converted_to_progress` |
| C | `ai-v143-tuning-006` | 6/4 | 5 | `code_gate` | Ability, Run, `break_subroutine`, spätere `steal_agenda` bei 156 | `reserve_converted_to_progress` |
| D | `ai-v143-tuning-004` | 6/3 | 11 | keine strukturierte Lücke | Run, `break_subroutine`, `access_card`; Corp `score_agenda` bei 117 | `reserve_preserved_reachability` |

## Kategorien

| Kategorie | Spiele | Fälle |
| --- | ---: | --- |
| `reserve_converted_to_progress` | 5 | A009, B008, B009, C005, C006 |
| `reserve_preserved_reachability` | 4 | B003, B005, C001, D004 |
| `reserve_no_conversion_with_no_alternative` | 0 | keine |
| `reserve_no_conversion_with_draw_alternative` | 0 | keine belegte wiederholte bessere Draw-Alternative |
| `reserve_no_conversion_with_install_or_search_alternative` | 0 | keine belegte wiederholte bessere Install-/Search-Alternative |

## LegalAction-Alternativen

AI125 kann noch keinen belastbaren LegalAction-Alternativenvergleich abschließen:

- AI123 enthält letzte 60 Actions, aber noch keine integrierten Action-Alternative-Snapshots für diese Finding-Familie.
- Einzelne Endfenster zeigen Draw, Install, Run, Break/Pump oder Access-Progress nach Reserve-Credits.
- Kein Fall belegt wiederholt dieselbe bessere side-safe Alternative gegenüber Reserve-Credit.

Diese Lücke wird in AI127 adressiert.

## Bewertung

Runner-Reserve ist im x10-Korpus real, aber nicht automatisch Fehlverhalten:

- In 5/9 Fällen folgt echte Progress-Konversion.
- In 4/9 Fällen erhält Reserve plausibel Reichweite, Coverage oder Run-Fähigkeit.
- B005 bleibt sichtbar, ist aber kein alleiniger Fixanker mehr.
- Der verworfene AI121-B005-Draw-Malus darf nicht erneut getestet werden.

## Entscheidung

AI125 bereitet keinen Runtime-Fix vor.

Removal Condition für diese No-Go-Entscheidung:

- Mehrere Fälle zeigen nach AI127 dieselbe klare bessere LegalAction-Alternative, etwa Search/Install/Draw, und
- die Alternative ist side-safe, nicht nur kosmetisch, und
- x5 und x10 verbessern sich ohne schlechtere `actionLimitReached`, `unsafeScoreChosen` oder `repeated_no_progress_run`.

## Verifikation

- Analyse aus `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`
- `git diff --check`
