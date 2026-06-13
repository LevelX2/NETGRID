# AI178 One Proven Opportunity Candidate

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI178 sollte genau einen Runtime-Kandidaten testen, aber nur wenn AI170 bis AI177 ihn belegen. Erlaubt war nur ein konkreter same-state Kandidat mit LegalAction-, Target-, Kosten-, Timing-, HardGate-, Intent-Contract- und Redaction-Beweis.

## Entscheidung

No-Go. Kein Runtime-Eingriff.

| Voraussetzung | Befund | Entscheidung |
| --- | ---: | --- |
| AI177 geprüfte Shadow-Kandidaten | 3 | geprüft |
| Gate-positive Kandidaten | 0 | blockiert |
| stabile same-state `actionId` plus Zielidentität | 0 | blockiert |
| Runtime-Cutover | 0 | nicht umgesetzt |
| Default-off Flag | 0 | nicht umgesetzt |

## Begründung

AI170 hat den alten Snapshot-Blocker deutlich verbessert. AI173 und AI175 finden shadow-only Kandidaten. AI177 zeigt aber, dass diese Kandidaten noch nicht runtimefähig sind, weil die redigierte Evidence zwar Action-Typen und semantische Kandidaten enthält, aber keine stabile same-state `actionId` plus Zielidentität, die sicher in eine konkrete PlayerAction-Auswahl übersetzt werden dürfte.

Ein Runtime-Fix an dieser Stelle wäre ein heuristischer Cutover. Das ist nach den NETGRID-Prinzipien nicht zulässig: Die KI darf keine Legalität erzeugen, keine Hidden-Info-Grenzen berühren und keine generischen Credit-/Draw-/Run-/Corp-Economy-Mali einführen.

## Umgesetzter Umfang

- keine Änderung an `chooseRunnerAction`
- keine Änderung an `chooseCorpAction`
- kein neuer Runtime-Flag
- kein Scoring-Malus oder Bonus
- keine Änderung an Engine, LegalActions, Replay, StateHash oder Randomness

## Removal Condition

Ein späterer AI178-Nachfolger darf erst umgesetzt werden, wenn Opportunity-Snapshots pro Kandidat zusätzlich redaction-sicher enthalten:

- stabile `actionId`
- side-safe Zielidentität oder nachweislich zielirrelevante Aktion
- Kosten-/Timingprofil am selben Zustand
- HardGate-/RiskGate-Summary
- Intent-Contract-Match
- Wiederholung in mindestens zwei Fällen oder extrem klarer Fixture-Fall

## Verifikation

- AI177 `passedCandidates = 0`
- `git diff --check`
