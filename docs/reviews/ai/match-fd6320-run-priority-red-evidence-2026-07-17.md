# Match FD6320: Run-Prioritäts-Red-Evidence 2026-07-17

## Ergebnis

Beide freigegebenen Runner-KI-Findings aus `match_fd63201b6a7fa27a` sind auf
unverändertem aktuellem Code spielgleich als `behavior_regression` rot
reproduziert. Die Capture-Warmups sind driftfrei, die Fixtures enthalten das
historische öffentliche Eventpräfix und den verfügbaren Runtime-Zustand. Zwei
enge Gegenproben bleiben grün.

Damit sind beide Punkte für eine generische Plan-/Arbitration-Korrektur
freigegeben. Es liegt weder Engine-/LegalAction- noch Runtime-/Fixture-Drift
vor.

## Quelle und Capture-Vertrag

- Runtime-SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: `DatabaseSync`, ausschließlich `readOnly: true`
- Match: `match_fd63201b6a7fa27a`
- Modus: `human_corp_vs_runner_ai`, Runner-KI `hard`
- Finale StateVersion: 146
- Finaler StateHash: `fnv1a:784e6325`
- Runner-Deck-Snapshot: `fnv1a:776713cf`
- Capture-Policy: `strict`, kein Rebase

## FD6320-F01 – Relative Zentral-Run-Qualität

### Historischer Zustand

- DecisionIndex: 11
- StateVersion: 21
- StateHash: `fnv1a:8ec727ff`
- Öffentliche Events im Präfix: 22
- Warmup-Decisions: 10
- Warmup-Drift: 0
- Runtime: TacticalPlan, PlanPortfolio und StrategicIntent vorhanden;
  RunnerRunPlan in diesem Vor-Run-Fenster nicht relevant.

### Side-sichere Bewertung

| Ziel | RunTarget-Score | Empfehlung | Pfad | Pfadkosten | Credits danach | Access-Payoff |
| --- | ---: | --- | --- | ---: | ---: | --- |
| HQ | 300 | `run_now` | `reachable` | 0 | 8 | `trash_affordable` |
| R&D | 180 | `run_now` | `reachable` | 0 | 8 | `unknown` |

Der Raw-Score-Winner ist korrekt `runner.start_run.hq` mit 1878 Punkten. Der
Plan-Controller mappt dennoch ausschließlich
`runner.opportunistic_central_run:rd`, blockiert HQ mit absoluter
Plan-Arbitration und wählt `runner.start_run.rd`; der ausgewiesene Score-Gap
beträgt 665.

Die Consumer-Kette verliert die relative Zielqualität nach der korrekten
RunTarget-Evaluation: Beide Ziele werden auf dieselbe Empfehlung `run_now`
und damit denselben Plan-Delta-Wert reduziert. Die feste R&D-Basis kann danach
den materiell besseren HQ-Wert überschreiben.

### Checkpoint und Gegenprobe

- Fixture:
  `data/scenarios/ai-decision-checkpoints/cp-fd6320-01-central-target-quality.json`
- Unveränderte Erwartung: HQ ist akzeptabel, R&D verboten; Raw-Score-Winner und
  Plan-Mapping müssen beide HQ referenzieren.
- Ergebnis vor Fix: `behavior_regression`, tatsächlich
  `runner.start_run.rd`.
- Gegenprobe `FD6320-C01-FRESH-RD-REMAINS-PREFERRED`: Entfernt ausschließlich
  das öffentliche Präfix des früheren R&D-Runs samt Access-Folgeereignissen.
  Dadurch wird R&D gegenüber HQ wieder das bessere aktuelle Zentralziel und
  bleibt korrekt ausgewählt.

## FD6320-F02 – Erreichbarer HQ-Matchpoint

### Historischer Zustand

- DecisionIndex: 69
- StateVersion: 120
- StateHash: `fnv1a:6fb301a9`
- Öffentliche Events im Präfix: 121
- Warmup-Decisions: 68
- Warmup-Drift: 0
- Runtime: TacticalPlan, PlanPortfolio und StrategicIntent vorhanden;
  RunnerRunPlan in diesem Vor-Run-Fenster nicht relevant.

Der Runner steht bei 6 von 7 Agenda-Punkten, besitzt 1 Credit und 3 Klicks.
HQ ist offen und ohne Pfadkosten erreichbar. Die side-sichere RunTarget-
Bewertung ergibt:

| Ziel | RunTarget-Score | Empfehlung | Pfad | Pfadkosten | Credits danach | Access-Payoff |
| --- | ---: | --- | --- | ---: | ---: | --- |
| HQ | -40 | `gain_credits_first` | `reachable` | 0 | 1 | `unknown` |
| R&D | -500 | `do_not_run_now` | `blocked_unpayable` | 8 | -7 | `unknown` |

Der Raw-Score-Winner ist `runner.gain_credit` mit 1679 Punkten. Dahinter liegen
`runner.draw_card` mit 898 und der kostenlose HQ-Run mit 881. Der
Plan-Controller mappt langsame Handentwicklung auf `runner.draw_card`,
blockiert den Raw-Winner mit einem Gap von 781 und wählt Draw. Der vorhandene
Matchpoint-Planbonus greift nur für `gain_credits_first` zusammen mit
`blocked_unpayable`; der bereits erreichbare HQ-Run erhält daher keinen
terminalen Konvertierungswert.

Der spielgleiche Checkpoint zeigte zusätzlich die nachgelagerte Portfolio-
Grenze: Sobald der HQ-Plan den terminalen Bonus erhält und Planrang 1 erreicht,
suspendiert ein aktiver Tag-Cleanup-Interrupt weiterhin das Foreground. Bei nur
1 Credit existiert jedoch keine legale Tag-Entfernung; der Interrupt kann auf
keine LegalAction gemappt werden. Ohne Revalidation fällt die Auswahl deshalb
auf Handkarten-Funding zurück. Die generische Korrektur muss daher sowohl den
erreichbaren Matchpoint-Run bewerten als auch ausschließlich dieses terminale
Foreground freigeben, wenn der reaktive Interrupt aktuell nicht ausführbar ist.

### Checkpoint und Gegenprobe

- Fixture:
  `data/scenarios/ai-decision-checkpoints/cp-fd6320-02-reachable-hq-matchpoint.json`
- Unveränderte Erwartung: HQ ist akzeptabel, Draw verboten; der Raw-Score-
  Winner darf Gain Credit bleiben, aber das Plan-Mapping muss HQ referenzieren.
- Ergebnis vor Fix: `behavior_regression`, tatsächlich `runner.draw_card`.
- Gegenprobe `FD6320-C02-NO-MATCHPOINT-FORCE`: Entfernt eine bereits gestohlene
  Agenda aus der Runner-ScoreArea. Unterhalb des Matchpoints bleibt Draw auf
  unverändertem Code korrekt ausgewählt.

## Reproduktionslauf

Ausgeführt wurde:

```text
corepack pnpm exec vitest run packages/ai/src/evaluation/decision-checkpoints/match-fd6320-runner-decision-checkpoints.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Erwartetes Red-Evidence-Ergebnis:

- 2 Zieltests rot, jeweils ausschließlich `behavior_regression`;
- 2 Gegenproben grün;
- keine `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Redaction- oder Fixture-Fehler.

## Umsetzungsgrenzen

- F01 wird im TacticalPlan-Consumer gelöst, nicht durch R&D- oder HQ-
  Sonderregeln.
- F02 erweitert die terminale Zentral-Run-Konvertierung nur für tatsächlich
  erreichbare produktive Matchpoint-Pfade.
- Beide Änderungen bleiben side-safe und verwenden ausschließlich bestehende
  RunTarget-Evaluation, PlayerView, LegalActions und erlaubten Runtime-Kontext.
- Der Deck-Hint-Vertrag bleibt unverändert; der vollständige Deck-Audit war
  grün.
