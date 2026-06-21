# AI214-AI217 Practical Micro Runtime Rules

Datum: 2026-06-21

## Ergebnis

Der geflaggte Practical-Micro-Comparator aus AI213 ist jetzt mit vier engen Kandidatenquellen verdrahtet:

- AI214 `runner_visible_coverage_install`: bevorzugt eine legale sichtbare Breaker-Installation, wenn ein bekannter rezzed ICE-Pfad blockiert ist und der installierbare Breaker diese ICE-Abdeckung leisten kann.
- AI215 `corp_stale_punish_deactivation`: ersetzt einen erkennbaren stale Punish ohne Runner-Tags nur durch eine konkrete Board- oder Scoreline-Aktion, nicht durch generische Credit-/Draw-Heuristik.
- AI216 `corp_safe_scoreline`: bevorzugt legale Score-, Advance- oder Agenda-Install-Aktionen nur, wenn `assessCorpScoreTerminalWindow` keine Safety-Blocker meldet.
- AI217 `runner_run_payoff_completion`: bevorzugt eine legale Run-Aktion nur, wenn die vorhandene Run-Target-Evaluation den Pfad als plausibel und den Payoff als hoch einstuft.

## Grenzen

- Alle Regeln geben nur `actionId`s aus `input.legalActions` weiter.
- Der Comparator prueft die LegalAction-Mitgliedschaft vor Apply nochmals.
- Ohne `practicalMicroRuntime.mode: "apply"` bleibt das Auswahlverhalten unveraendert.
- Einzelregeln greifen nur, wenn sie in `enabledRules` genannt sind.
- Die Regeln erzeugen keine LegalActions, keine Choices und keine neuen AI-Input-Felder.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "practical micro"`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-micro-runtime.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

