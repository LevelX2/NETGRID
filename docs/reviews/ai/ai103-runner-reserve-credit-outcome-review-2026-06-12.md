# AI103 Runner-Reserve-Credit Outcome Review

Datum: 2026-06-12

## Ziel

AI103 prueft die fuenf in AI101 gemeldeten `runner_late_gain_credit_real_reserve`-Faelle. Die Pruefung trennt echte Reserve-/Coverage-Faelle von zu breit klassifizierten Plausibilitaetssignalen, ohne die Runtime-Auswahl der KI zu veraendern.

## Ausgangsbefund aus AI101

AI101 meldete bei 20 Spielen:

- `actionLimitReached`: 9
- `runner_late_gain_credit_real_reserve`: 5
- `mixed_unknown`: 1
- `continue_without_progress`: 0
- Illegale Actions: 0
- Replay-Fehler: 0
- Redaction safe: ja

Die fuenf Runner-Reserve-Faelle lagen in:

- B / `ai-v143-tuning-003`
- B / `ai-v143-tuning-005`
- C / `ai-v143-tuning-001`
- C / `ai-v143-tuning-005`
- D / `ai-v143-tuning-004`

## Analyse

Die Detailpruefung der letzten 40 Actions der Action-Limit-Spiele zeigt:

- B003: alle 5 Runner-Credits tragen harte Reserve-/Coverage-Signale; fehlende Coverage `code_gate, wall`.
- B005: alle 12 Runner-Credits tragen harte Reserve-/Coverage-Signale; fehlende Coverage `wall`.
- C001: alle 8 Runner-Credits tragen harte Reserve-/Coverage-Signale; fehlende Coverage `wall`.
- C005: alle 8 Runner-Credits tragen harte Reserve-/Coverage-Signale; fehlende Coverage `code_gate, wall`.
- D004: 6 von 8 Runner-Credits tragen harte Reserve-/Safety-Signale, 2 beruhen nur auf `runnerEconomyChoicePlausible`.

`runnerEconomyChoicePlausible` ist als alleiniger Beleg zu weich: Es beschreibt eine plausible Economy-Entscheidung, aber keine harte Reserve-, Coverage- oder Safety-Notwendigkeit. Wenn es allein fuer `runner_late_gain_credit_real_reserve` reicht, verdeckt der Classifier gemischte Endfenster.

## Umsetzung

Der Trace-Classifier wurde verengt:

- `runnerEconomyChoicePlausible` allein klassifiziert einen späten Runner-Credit nicht mehr als echte Reserve.
- Harte Reserve-Belege bleiben unveraendert: `runnerEconomyTakenToReachRunReserve`, `runnerReservePreservingEconomy`, `runnerBelowReserveBefore`, `runnerCreditStarvedWithLegalEconomy`, fehlende Coverage und textuelle Safety-/Unpayable-Path-Signale.
- Die KI-Runtime, Scoring-Gewichte und LegalAction-Auswahl bleiben unveraendert.

Regression:

- `packages/ai/src/simulation/benchmark-reports.test.ts` enthaelt einen Plausible-only-Fall, der nun in `runner_late_gain_credit_without_funding_need` statt in `runner_late_gain_credit_real_reserve` faellt.

## Nachlauf

Nachweis: `docs/reviews/ai/ai103-runner-reserve-credit-review-a-d-5seed-2026-06-12.json`

- Spiele: 20
- Entscheidungen: 2498
- Illegale Actions: 0
- Replay-Fehler: 0
- Redaction safe: ja
- `actionLimitReached`: 9
- `runner_late_gain_credit_real_reserve`: 4
- `mixed_unknown`: 2
- `continue_without_progress`: 0

Der verschobene Fall ist D / `ai-v143-tuning-004`. Er ist nach der Verengung bewusst `mixed_unknown`, weil das Endfenster echte Reserve-/Safety-Signale und nur plausible Economy-Signale mischt.

## Schlussfolgerung

Vier Runner-Reserve-Faelle sind echte harte Reserve-/Coverage-Faelle und sollten ohne weiteres Spiellagenwissen nicht bestraft werden. Ein Fall war diagnostisch zu breit klassifiziert und ist jetzt fuer AI105 als gemischter Endfensterfall sichtbar.
