# AI106 Action-Limit Zielwert-Entscheidung

Datum: 2026-06-12

## Entscheidung

Fuer den aktuellen A-D-x5-Korpus wird der belastbare Zielwert auf `actionLimitReached <= 9` gesetzt. `<= 8` bleibt ein Folge-Ziel, ist aber nach AI101-AI105 nicht ohne zusaetzliches Runtime-Tuning sicher erreichbar.

## Vergleich

| Stand | `actionLimitReached` | `runner_late_gain_credit_real_reserve` | `mixed_unknown` | Bemerkung |
| --- | ---: | ---: | ---: | --- |
| AI100 Analyseanhang | 10 | 5 | 2 | Trace-HEAD war nicht finaler aktueller `main` |
| AI101 Rebaseline `f8ea7535` | 9 | 5 | 1 | Finaler aktueller `main` getraced |
| AI103 | 9 | 4 | 2 | Plausible-only Economy nicht mehr als harte Reserve |
| AI105 | 9 | 4 | 0 | Mixed-Endfenster terminal klassifiziert |

AI105-Endstand:

- `actionLimitReached`: 9
- `runner_late_gain_credit_real_reserve`: 4
- `corp_late_gain_credit_real_rez_or_protection_reserve`: 1
- `corp_late_gain_credit_no_safe_alternative`: 1
- `late_draw_without_coverage_or_hand_goal`: 1
- `run_microstep_required`: 1
- `break_pump_required`: 1
- `continue_without_progress`: 0
- `mixed_unknown`: 0

## Bewertung von `<= 8`

`<= 8` waere rechnerisch mit der Reduktion genau eines weiteren Action-Limit-Spiels erreichbar. Die verbliebenen Cluster erlauben aber keinen sicheren Einzeiler-Fix:

- Vier Runner-Faelle sind echte Reserve-/Coverage-Faelle. Eine pauschale Credit-Bestrafung wuerde Run-Reserve, Steal-/Trash-Faehigkeit oder Coverage-Aufbau riskieren.
- Der Corp-Reserve-Fall ist ebenfalls plausibel, solange Rez-/Protection-Reserve nicht genauer bewertet wird.
- Der Corp-No-Alternative-Fall ist diagnostisch sichtbar, aber kein klarer Fehler: Ohne sichere Score-/Install-Alternative darf Economy legaler Fallback bleiben.
- Der Late-Draw-Fall ist der beste Kandidat fuer kuenftiges Tuning, benoetigt aber Spiellagenlogik zu Handziel, Coverage-Suche und Remote-/Central-Pressure. Ein pauschaler Draw-Penalty waere zu breit.
- Run-Microstep und Break-/Pump-Pflicht sind notwendige Run-Aufloesung und duerfen nicht bestraft werden.

## Zielwert

Aktueller Gate-Zielwert:

- A-D-x5: `actionLimitReached <= 9`
- Safety-Gates bleiben unveraendert: 0 illegale Actions, 0 Replay-Fehler, Redaction safe.
- Diagnose-Gates: `mixed_unknown = 0`, `continue_without_progress = 0`.

Folgeziel:

- `actionLimitReached <= 8`, sobald ein dedizierter Runtime-Block den Late-Draw- oder Corp-No-Alternative-Fall mit konkreter Spiellagen-Evidence adressiert.

## Schluss

Der Zielwert wird nicht kosmetisch gelockert, sondern an den erklaerten Restzustand gebunden. AI101-AI105 haben den Korpus von 10 auf 9 Action-Limit-Spiele verbessert, die Diagnose von unklarem Mixed auf klare Restcluster umgestellt und keine Safety-Regressions erzeugt. Ein weiterer Runtime-Fix ist in diesem Block nicht klar genug, um den Testgegenstand stabil zu erhalten.
