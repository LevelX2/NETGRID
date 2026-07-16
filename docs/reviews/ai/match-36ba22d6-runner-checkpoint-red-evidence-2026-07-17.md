# Match 36BA22D6: Decision-Checkpoint-Red-Evidence

Datum: 2026-07-17

Match: `match_36ba22d6a89b2ac4`

Arbeitsstand vor Produktionsänderung: `1bba77c89`

## Ergebnis

Nur F1 ist auf dem unveränderten aktuellen KI-Code als spielgleiche
`behavior_regression` bestätigt. Die späteren Findings werden nicht durch
einen `rebase` künstlich reproduziert und autorisieren in diesem Prozess
keinen Verhaltensfix.

| Finding | Zieldecision | Strict-Capture | Aktuelle Klassifikation | Umsetzung |
| --- | ---: | --- | --- | --- |
| F1 Opening Search | D01 / SV0 | gültig, 0 Warmup-Decisions, 0 Drift | `behavior_regression` | ja |
| F3 Streetware-Kadenz | D40 / SV69 | stoppt an D02 | Warmup-Drift, kein valider Checkpoint | nein |
| F4 unterfinanzierter Remote | D68 / SV121 | stoppt an D02 | Warmup-Drift, kein valider Checkpoint | nein |
| F2 letzter Funding-Klick | D81 / SV144 | stoppt an D02 | Warmup-Drift, kein valider Checkpoint | nein |
| F5 zweiter Trace | D91 / SV167 | stoppt an D02 | Warmup-Drift; direkte Prüfung bereits `bid_0` | nein |
| F6 tödlicher Access | D95 / SV175 | stoppt an D02 | zusätzlich `engine_legality_drift` ohne LegalActions | nein |

Der erste verbindliche Strict-Versuch für D40 brach mit folgendem Befund ab:

```text
warmup_behavior_drift:decision=2:expected=runner.gain_credit:actual=runner.start_run.rd
```

Damit kann der aktuelle Runtime-Speicher ab D02 nicht mehr als historisch
spielgleich gelten. `warmup-policy rebase` wurde nicht eingesetzt, weil er
genau diesen Drift verwerfen und die nachfolgenden Tactical-/Portfolio-/Run-
Plan-Zustände aus einem anderen Entscheidungsverlauf ableiten würde.

## Gültiger F1-Checkpoint

Fixture:
`data/scenarios/ai-decision-checkpoints/match-36ba22d6-01-opening-search-keep.json`

Der Capture enthält:

- den historischen `GameState` an SV0;
- ausschließlich das öffentliche Eventpräfix bis SV0;
- Runner, Hard-Profil und den eigenen Deck-Snapshot;
- die unveränderte Starthand aus Temple Microcode Outlet, Cruising for
  Netwatch, zwei Panzer Runs und Cloak;
- die unveränderte Erwartung `keep` und das Verbot `mulligan`.

Capture-Ergebnis:

```json
{"warmupDecisions":0,"warmupPolicy":"strict","warmupDriftCount":0,"eventPrefix":1,"runtime":{"tacticalPlan":false,"planPortfolio":false,"strategicIntent":false,"runnerRunPlan":false}}
```

Der fehlende Runtime-Speicher ist an der ersten Matchentscheidung korrekt:
vor D01 kann es noch keinen historischen Tactical-, Portfolio-, Intent- oder
Run-Plan geben.

## Roter Zieltest und grüne Gegenprobe

Test:
`packages/ai/src/evaluation/decision-checkpoints/match-36ba22d6-runner-decision-checkpoints.test.ts`

Ausgeführt wurde:

```powershell
C:\Projekte\NETGRID\node_modules\.bin\vitest.CMD run `
  packages/ai/src/evaluation/decision-checkpoints/match-36ba22d6-runner-decision-checkpoints.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=verbose
```

Ergebnis vor dem Fix:

```text
1 failed | 1 passed
behavior_regression: Behavior expectation failed for runner.resolve_choice
```

Der rote Zieltest belegt, dass die KI `mulligan` auswählt, obwohl Temple
Microcode Outlet aus der Hand für einen Credit ein im Deck bekanntes Programm
und damit Krash als vollständige Breaker-Abdeckung suchen kann. Die Hand hat
gleichzeitig sofortige Ökonomie und mehrere Folgeaktionen.

Die Gegenprobe tauscht im identischen Zustand nur Temple Microcode Outlet aus
der Hand gegen die dritte Kopie Panzer Run aus dem Stack. Ohne in der Hand
ausführbare Suchlinie bleibt `mulligan` grün. Der Fix darf deshalb weder die
allgemeine Schwelle senken noch jede druck- oder ökonomiereiche Hand ohne
Breaker behalten.

## Freigabe für P3

P3 darf ausschließlich die generische Opening-Hand-Erkennung einer
ausführbaren Programmsuche als Breaker-Zugriff ändern. Karten-ID-, Match-ID-,
Seed- oder Instanzsonderregeln sowie Änderungen an späteren Plan-, Bank-,
Remote-, Trace- oder Access-Consumern sind durch diese Red-Evidence nicht
autorisiert.
