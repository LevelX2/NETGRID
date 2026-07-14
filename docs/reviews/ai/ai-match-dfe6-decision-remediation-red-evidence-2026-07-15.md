# Match DFE6: roter Decision-Checkpoint-Nachweis

Stand: 2026-07-15

Quelle: `match_dfe6223d817c646d`

Arbeitszweig: `codex/ai-dfe6-decision-remediation`

## Zweck

Die freigegebenen Findings werden vor jeder Änderung an der Bewertungslogik als spielgleiche Decision-Checkpoints gesichert. Alle sechs Match-Zustände wurden mit `warmup-policy=strict` rekonstruiert. Bei 27 bis 93 vorgelagerten Entscheidungen gab es jeweils null Warmup-Abweichungen.

Es wurden keine Behavior-Baseline, keine Benchmarks, keine Selfplays und keine zusätzlichen Simulationsspiele ausgeführt.

## Spielgleiche Checkpoints

| Checkpoint | Entscheidung | StateVersion | StateHash | Vertrag vor dem Fix |
| --- | ---: | ---: | --- | --- |
| `cp-dfe6-01-archives-matchpoint-first` | 47 | 82 | `fnv1a:9c035b75` | Archives ohne Corp-Deckdruck oder Zufallsabwurf nicht wählen |
| `cp-dfe6-02-archives-matchpoint-repeat` | 72 | 133 | `fnv1a:079a4cfe` | denselben unbegründeten Archives-Lauf nicht wiederholen |
| `cp-dfe6-03-archives-before-winning-rd` | 94 | 172 | `fnv1a:a4f593be` | R&D statt Archives wählen |
| `cp-dfe6-04-survival-draw-over-fall-guy` | 53 | 94 | `fnv1a:4da5fa8f` | bei Grip 1 nach Core Damage ziehen statt redundanten Fall Guy installieren |
| `cp-dfe6-05-first-fall-guy-control` | 28 | 52 | `fnv1a:14a35524` | den ersten sinnvollen Fall Guy weiterhin installieren dürfen |
| `cp-dfe6-06-unaffordable-liche-control` | 51 | 92 | `fnv1a:f6e9c01b` | bei 6 Credits weiterlaufen, aber ohne falsche Breaker-verfügbar-Strafe |

## Roter Lauf

Ausgeführt wurde ausschließlich:

```text
vitest run
  packages/ai/src/evaluation/decision-checkpoints/match-dfe6-decision-checkpoints.test.ts
  packages/ai/src/evaluation/decision-checkpoints/checkpoint-runner.test.ts
```

Ergebnis: fünf erwartete rote Verträge und zehn grüne Tests.

- Die drei Archives-Zustände scheitern als `behavior_regression`, weil jeweils `runner.start_run.archives` gewählt wird.
- Der Survival-Zustand scheitert als `behavior_regression`, weil ein weiterer Fall Guy installiert wird.
- Der Liche-Zustand scheitert als `behavior_regression`, weil die richtige Continue-Aktion intern weiterhin `runner_continue_run_ends_run_with_break_available` trägt.
- Der historische erste Fall-Guy-Einsatz bleibt grün.
- Der spielgleiche Archives-Gegenfall mit auf sechs Karten reduziertem Corp-R&D bleibt grün.
- Der spielgleiche Liche-Gegenfall mit 20 Credits bleibt grün und beginnt die bezahlbare Sequenz mit `pump_breaker`.
- Alle sieben Checkpoint-Infrastrukturtests bleiben grün; darunter der neue wertneutrale Vertrag über vorhandene oder verbotene Score-Komponenten.

Damit sind alle drei Findings reproduzierbar von ihren positiven Gegenfällen getrennt. Erst der nachfolgende Stand darf die Bewertungslogik ändern.
