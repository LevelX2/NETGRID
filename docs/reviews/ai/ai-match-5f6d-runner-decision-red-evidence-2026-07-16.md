# Match 5F6D – Runner-Decision-Red-Evidence (2026-07-16)

Status: P1 abgeschlossen, Produktionscode unverändert

## Capture-Vertrag

Alle historischen Fixtures wurden aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` über den
produktiven Capture-Einstieg mit `--warmup-policy strict` erzeugt. Die
Captures verwenden den damaligen GameState, das öffentliche Eventpräfix,
Engine-generierte PlayerViews und LegalActions sowie den gespeicherten
Runtime-Zustand.

| Checkpoint                            | Decision / State | Warmup | Drift | Ziel                                        |
| ------------------------------------- | ---------------- | -----: | ----: | ------------------------------------------- |
| `cp-5f6d-01-trace-run-budget`         | D58 / v105       |     57 |     0 | `bid_0` erhält den bekannten Restpfad.      |
| `cp-5f6d-02-unwinnable-trace-control` | D87 / v156       |     86 |     0 | Nicht gewinnbarer Trace bleibt auf `bid_0`. |
| `cp-5f6d-03-newsgroup-dominance-d62`  | D62 / v109       |     61 |     0 | Newsgroup Gain 2 vor Basic Gain 1.          |
| `cp-5f6d-04-newsgroup-dominance-d74`  | D74 / v135       |     73 |     0 | Newsgroup Gain 2 vor Basic Gain 1.          |
| `cp-5f6d-05-newsgroup-dominance-d75`  | D75 / v136       |     74 |     0 | Newsgroup Gain 2 vor Basic Gain 1.          |
| `cp-5f6d-06-newsgroup-dominance-d83`  | D83 / v151       |     82 |     0 | Newsgroup Gain 2 vor Basic Gain 1.          |
| `cp-5f6d-07-newsgroup-dominance-d84`  | D84 / v152       |     83 |     0 | Newsgroup Gain 2 vor Basic Gain 1.          |
| `cp-5f6d-08-stack-search-first-pick`  | D72 / v127       |     71 |     0 | Executive Wiretaps ist die erste Entnahme.  |

Die Checkpoint-Erwartung unterstützt dafür zusätzlich einen geordneten
`selectedOptionIdsPrefix`. Das ist reine Testinfrastruktur und verändert
keine KI-Auswahl.

## Roter Nachweis vor dem ersten Produktionsfix

Direkter Lauf:

```text
corepack pnpm exec vitest run packages/ai/src/evaluation/decision-checkpoints/match-5f6d-runner-decision-checkpoints.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis auf unverändertem Produktionscode:

- 7 Zieltests rot, ausschließlich Code `behavior_regression`;
- D58 wählt weiterhin `bid_5`;
- D62, D74, D75, D83 und D84 wählen weiterhin `runner.gain_credit`;
- D72 wählt Executive Wiretaps weiterhin nicht als erstes Element;
- 3 Gegenproben grün:
  - D87 behält `bid_0` beim nicht gewinnbaren Trace;
  - ohne installierten Newsgroup Filter wird keine Ability erfunden;
  - ein finanzierter Cloak mit freier MU darf zuerst gewählt werden.

Damit liegen keine `engine_legality_drift`, `runtime_state_drift`, Fixture-
Migrationen oder Redaction-Verstöße vor.

## Infrastruktur- und Nachbarchecks

- `checkpoint-runner.test.ts`: 7 von 7 grün.
- `search-choice-option.test.ts`: 6 von 6 grün.
- `baseline-seed03-seed05-loop-decision-checkpoints.test.ts`:
  6 von 8 grün. Die für diesen Scope relevante Newsgroup-Unterreserve-
  Gegenprobe ist grün. Zwei Broker-Portfolio-Verträge waren bereits auf dem
  Ausgangs-`main` rot und gehören nicht zu diesem Prozess.

## Unveränderlicher Vertrag für die Fix-Pakete

- Die acht capturierten Fixtures bleiben unverändert.
- Die sieben roten historischen Erwartungen werden nicht abgeschwächt.
- D87 und die beiden synthetischen Gegenproben müssen grün bleiben.
- Ein Produktionsfix ist nur akzeptiert, wenn die jeweils betroffene
  historische Expectation grün wird und angrenzende Tests nicht regressieren.
