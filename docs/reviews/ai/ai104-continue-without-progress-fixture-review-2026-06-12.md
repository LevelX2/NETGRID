# AI104 Continue-without-progress Fixture Review

Datum: 2026-06-12

## Ziel

AI104 sollte den im Analyseanhang genannten einzelnen `continue_without_progress`-Restfall isolieren und als Fixture oder Fix behandeln.

## Befund auf aktuellem Stand

Der Restfall ist auf dem aktuellen Integrationsstand nicht mehr reproduzierbar:

- AI101 Baseline auf `f8ea7535`: `continue_without_progress = 0`
- AI103 Nachlauf nach Runner-Reserve-Classifier-Verengung: `continue_without_progress = 0`

Die Action-Limit-Spiele enthalten weiterhin Run-Microsteps, `continue_run`, `break_subroutine`, `pump_breaker` und Access-Folgen. Diese werden aber nicht mehr als Continue-ohne-Progress klassifiziert, wenn danach Access/Breach folgt.

## Bestehende Regression

`packages/ai/src/simulation/benchmark-reports.test.ts` deckt beide Seiten des Falls bereits ab:

- `does not treat run microsteps as stalls when access follows`
  - `start_run -> continue_run -> continue_run -> access_card`
  - Erwartung: `continue_chain_to_access = 1`, `late_run_step_stall = 0`
- `catches continue and jack-out loops without progress`
  - `start_run -> continue_run -> continue_run -> continue_run`
  - Erwartung: `continue_without_progress = 1`
  - Separat: echte `jack_out`-Loops bleiben `jackout_loop`.

Damit ist die relevante Barriere bereits explizit: Continue-Run ist nur dann ein Residual-Fall, wenn kein Access-/Breach-Fortschritt im engen Folgefenster sichtbar wird.

## Entscheidung

Kein Runtime-Fix und kein neues Fixture in AI104. Ein neues Fixture wuerde die bestehende Regression duplizieren. Die fachlich richtige Massnahme ist, den Nicht-Reproduktionsbefund gegen den aktuellen Trace festzuhalten und den bestehenden Test gezielt erneut auszufuehren.

## Verifikation

Auszufuehrender Paketcheck:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts -t "run microsteps|continue and jack-out"`
- `git diff --check`
