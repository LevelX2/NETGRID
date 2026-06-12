# AI112 Action-Limit <=8 Experiment Decision

Datum: 2026-06-12

## Ziel

AI112 sollte nur dann einen engen Runtime-Fix testen, wenn AI109 bis AI111 einen klaren Kandidaten liefern, der `actionLimitReached <= 8` ohne Nebenwirkungen plausibel erreichbar macht.

## Eingangslage

AI108 bestätigte den A-D-x5-Gatewert:

- `actionLimitReached`: 9
- `mixed_unknown`: 0
- `continue_without_progress`: 0
- Illegale Actions: 0
- Replay-Fehler: 0
- Redaction safe: ja

AI109 korrigierte die Late-Draw-Diagnose:

- `late_draw_without_coverage_or_hand_goal`: 0
- neuer Rest: `late_draw_for_coverage_or_hand_goal`: 1
- kein Runtime-Fix, weil die Draws eine Wall-Coverage-Lücke tragen.

AI110 auditierte den Corp-No-Safe-Alternative-Fall:

- keine sichere Score-/Advance-/Agenda-Install-Alternative im Trace,
- `corp_safe_alternative:economy`,
- kein belastbarer enger Fix.

AI111 auditierte Runner-Reserve-Outcomes:

- 3 von 4 harten Runner-Reserve-Fällen konvertieren oder erhalten Run-/Coverage-Reichweite.
- 1 Fall bleibt `reserve_no_conversion`: B / `ai-v143-tuning-005`.

## No-Go-Entscheidung

Es wird in AI112 kein Runtime-Fix umgesetzt.

Begründung:

1. Der Late-Draw-Fall ist kein No-Goal-Draw, sondern ein Draw mit Wall-Coverage-Lücke.
2. Der Corp-Fall hat keine sichere Score-/Advance-/Install-Alternative im Trace.
3. Der einzige Runner-Reserve-No-Conversion-Fall zeigt zwar ein echtes Muster, aber keine konkrete sichere alternative LegalAction im selben Entscheidungsfenster.
4. Ein pauschaler Malus gegen Credits bei Coverage-Lücke würde genau die drei Runner-Reserve-Fälle gefährden, die später in Fortschritt oder Reachability konvertieren.
5. Ein pauschaler Draw- oder Corp-Economy-Malus könnte `unsafeScoreChosen`, `repeated_no_progress_run` oder passive Scoreline-Metriken verschlechtern.

## Zielwert

Der aktuelle belastbare Zielwert bleibt:

- A-D-x5: `actionLimitReached <= 9`
- `mixed_unknown = 0`
- `continue_without_progress = 0`
- Safety-Gates grün

`<= 8` bleibt ein Folge-Ziel, aber erst nach zusätzlicher Evidence:

- LegalAction-Snapshot für B / `ai-v143-tuning-005`,
- klare Search-/Draw-/Install-Alternative,
- oder ein neues Trace-Feld, das wiederholte Coverage-Lücke ohne Fortschrittskonversion direkt markiert.

## Checks

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Schlussfolgerung

AI112 verhindert bewusst kosmetisches Tuning. Der Block bleibt bei Diagnoseverbesserung und belastbarer Restklassifikation, statt eine breite Heuristik einzubauen, die den Testgegenstand verfälschen könnte.
