# Letzte zwei Spiele: Decision-Checkpoint Red Evidence

## Stand

Die historischen Zielzustände aus `match_543e35cbdf91cee3` und
`match_1d63717d70fc81ef` sind side-safe eingefroren. Fünf Zielentscheidungen
für vier Fehlergruppen reproduzieren vor den jeweiligen Fixes eine
`behavior_regression`; drei neue synthetische Gegenproben und 31 vorhandene
Checkpoint-/RunPlan-Gegenverträge sind grün.

CP01, CP02, CP03 und CP05 sind auf dem Ausgangsstand `5c3884a633` rot. CP04
wurde zusätzlich auf `a16c71eb9` geprüft: Dieser Commit enthält bereits die
produktive Choice-Erwartungsinfrastruktur, liegt aber unmittelbar vor dem
Trace-Fix `13a7f549a`. Damit ist auch die exakte Trace-Choice spielgleich rot
belegt. Seit der regulären Integration des Parallelstrangs über `main`
(`ea4ceb2b7`) ist CP04 ohne lokalen Doppel-Fix grün.

## Fixture-Herkunft

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only geöffnet
- CP01: Kurzspiel, Runner, SV12 / DI6, fünf Warmup-Entscheidungen, streng,
  null Drift, 13 öffentliche Events
- CP02: KI-Spiel, Runner, SV141 / DI142, 76 Warmup-Entscheidungen, streng,
  null Drift, 142 öffentliche Events
- CP03: KI-Spiel, Runner, SV209 / DI210, 116 Warmup-Entscheidungen, streng,
  null Drift, 210 öffentliche Events
- CP04: KI-Spiel, Corp, SV529 / DI530, Rebase-Warmup, sechs frühere
  Platzierungs-/Aktionsabweichungen, 118 kompatible Entscheidungen am Stück,
  530 öffentliche Events
- CP05: KI-Spiel, Runner, SV558 / DI559, 350 Warmup-Entscheidungen, streng,
  null Drift, 559 öffentliche Events
- Engine-PlayerView und LegalActions werden bei jedem Lauf aus dem exakten
  historischen GameState und dem öffentlichen Eventpräfix neu erzeugt.
- Runtime-Restore enthält TacticalPlan, PlanPortfolio und StrategicIntent;
  CP03 enthält zusätzlich den damaligen RunnerRunPlan.

Die sechs CP04-Warmup-Abweichungen liegen bei DI16, DI36, DI83, DI84, DI137
und DI155. Sie betreffen frühere ICE-Platzierungen, Draw/Economy und ein Remote,
nicht die Trace-Choice bei DI530. Der exakte Zielzustand wurde nicht verändert.

## Bestätigte rote Zielzustände

| Checkpoint | Zustand | Unveränderte Erwartung | Ausgangsbefund |
| --- | --- | --- | --- |
| CP01 | Kurzspiel SV12 / DI6 | `Prearranged Drop` mit letztem Click nicht spielen | Karte wird gespielt; `behavior_regression` |
| CP02 | KI-Spiel SV141 / DI142 | `Prearranged Drop` mit letztem Click nicht spielen | Karte wird gespielt; `behavior_regression` |
| CP03 | KI-Spiel SV209 / DI210 | in Movement mit erreichbarem Restpfad `continue_run` | `jack_out`; `behavior_regression` |
| CP04 | KI-Spiel SV529 / DI530 | Trace-Choice muss den garantierenden Mindestwert `5` wählen | anderes Gebot; `behavior_regression` |
| CP05 | KI-Spiel SV558 / DI559 | bei leerem Corp-R&D `end_turn` | Broker-Aktivierung; `behavior_regression` |

Die CP03-Fehlersignatur wiederholt sich im Match bei SV271, SV334, SV378,
SV412, SV523 und SV571. CP02 konserviert den eindeutigen letzten-Click-Fall;
SV74 bleibt als separater Folgeplan-Befund dokumentiert, weil dort noch vier
Clicks und ein legaler Zugriffspfad vorhanden waren.

## Koordinierter Trace-Vertrag

CP04 fordert für SV529:

```json
{
  "acceptableActions": [{ "type": "resolve_choice" }],
  "choice": { "mustSelectValues": [5] }
}
```

Die Corp sieht Basisstärke 5, Runner-Link 0 und neun Runner-Credits. Gebot 5
garantiert den Tag und lässt zehn Corp-Credits sowie zwei Clicks für die
sichtbare `Scorched Earth`-/`Urban Renewal`-Konvertierung. Ein früherer Trace
darf diese Basisstärke nicht ersetzen.

Auf `a16c71eb9` wählt der produktive Chooser nicht `5`; der Checkpoint meldet
`behavior_regression`. Auf dem integrierten Main-Stand `1f2a66b91` wählt er
unverändert zur Fixture-Erwartung exakt `5`. Der zugrunde liegende generische
Trace-Kontext- und Mindestgebotsvertrag stammt ausschließlich aus dem bereits
integrierten Manhunt-Strang.

## Grüne Gegenproben vor dem Fix

1. Mit zwei statt einem verbleibenden Click bleibt `Prearranged Drop` in CP01
   zulässig und wird vom produktiven Chooser gewählt.
2. Mit einer Karte in Corp-R&D greift der Deckout-Lock in CP05 nicht; die
   vorhandene Broker-Aktivierung bleibt zulässig.
3. Ohne sichtbare `Scorched Earth` oder `Urban Renewal` in HQ erzwingt CP04
   das Kill-Gebot `5` nicht. Diese Probe ist sowohl vor als auch nach dem
   integrierten Trace-Fix grün.
4. Die bestehenden RunPlan-Tests sichern weiterhin echte Encounter-
   Sicherheitsbrüche, unbezwingbare bekannte ICE, bereits bezahltes ICE und
   Server-Movement ab.
5. Checkpoint-Validierung, Runtime-Restore, LegalAction-Auswahl und
   Redaction-Guard bleiben vollständig grün.

## Roter Testlauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/last-two-matches-decision-checkpoints.test.ts `
  --reporter=verbose
```

Ergebnis auf `a16c71eb9`, mit produktiver Choice-Auswertung und vor dem
Trace-Fix:

```text
Test Files  1 failed (1)
Tests       5 failed | 3 passed (8)
```

Alle fünf Fehlschläge stammen aus unveränderten fachlichen Erwartungen und
melden `behavior_regression`. Es liegt kein Legality-, Runtime-, Fixture- oder
Redaction-Fehler vor.

Nach Integration von `main` bei `1f2a66b91` ergibt derselbe Test vor den drei
noch ausstehenden lokalen Fixes:

```text
Test Files  1 failed (1)
Tests       4 failed | 4 passed (8)
```

CP04 und alle drei Gegenproben sind grün; rot bleiben CP01, CP02, CP03 und
CP05. Damit wird der bereits integrierte Trace-Fix nicht dupliziert.

## Gleichzeitig grüne Infrastrukturchecks

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/checkpoint-runner.test.ts `
  src/runtime/runner-run-plan-path-quote.test.ts `
  src/runtime/runner-run-plan-policy.test.ts --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Ergebnis: drei Testdateien und 31 Tests grün; Typecheck und Diff-Hygiene grün.
