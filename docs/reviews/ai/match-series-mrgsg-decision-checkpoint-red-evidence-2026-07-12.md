# Matchserie MRGSG: Decision-Checkpoint Red Evidence

## Stand

Der spielgleiche Audit der vorletzten abgeschlossenen Matchserie ist auf dem
aktuellen Produktions-Chooser abgeschlossen. Vor jeder Verhaltenskorrektur ist
genau ein fachlich falscher Zieltest rot; seine positive Gegenprobe ist grün.

## Fixture-Herkunft

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  ausschließlich read-only geöffnet
- Serie: `match-mrgsg0px-vvhjh5`
- Zielmatch: `match_3bb2232dccc0a1da`
- Actor: Runner, Difficulty `hard`
- Ziel: Decision 32 / StateVersion 67
- Fixture: `data/scenarios/ai-decision-checkpoints/cp-mrgsg-01.json`
- Runtime-Warmup: 31 historische Runner-Entscheidungen mit explizitem
  `rebase`; fünf bereits korrigierte frühere Abweichungen, danach zwölf
  kompatible Entscheidungen am Stück
- Runtime-Restore: TacticalPlan, PlanPortfolio und StrategicIntent vorhanden;
  RunnerRunPlan war am Ziel nicht vorhanden
- Event-Prefix: 68 side-sichere Events bis einschließlich StateVersion 67
- PlayerView und LegalActions werden beim Test durch die Engine neu erzeugt

## Bestätigter roter Befund

Der Runner besitzt 3 Credits und die passenden installierten Breaker für die
beiden bekannten R&D-ICE. Der R&D-Pfad benötigt damit das vollständige
Creditbudget. Gleichzeitig ist Archives ohne ICE erreichbar und enthält zwei
aus Runner-Sicht unbekannte Ablagen. Die semantische Runtime bewertet den
Archives-Run mit 1.359, den R&D-Run nur mit 453. Trotzdem erzwingt der
TacticalPlan `runner.opportunistic_central_run:rd` den R&D-Run.

Der Checkpoint verlangt deshalb in genau diesem Zustand den Archives-Run und
verbietet den R&D-Run. Der unveränderte aktuelle Code liefert:

```text
Behavior expectation failed for runner.start_run.rd
code: behavior_regression
```

Es liegt kein Legality-, Fixture-, Runtime-, Redaction- oder Migrationsfehler
vor.

## Gleichzeitig grüne Gegenprobe

Die Gegenprobe verändert nur die sichtbare Entscheidungslage:

- Archives wird geleert;
- die beiden R&D-ICE werden aus dem Server entfernt;
- der Runner erhält 10 Credits.

Der wiederhergestellte R&D-Plan darf und soll in dieser Lage weiter den
R&D-Run auswählen. Diese Gegenprobe ist bereits vor dem Fix grün. Die
Korrektur darf somit weder zentrale Pläne pauschal sperren noch R&D gegenüber
Archives generell abwerten.

## Nicht als Fehler eingefrorene Fälle

| Match / Decision | Aktueller Nachweis | Einordnung |
| --- | --- | --- |
| A199 / 25 | Draw statt stark negativ bewerteter BBS-Installation | bereits grün |
| A199 / 88 und 93 | jeweils `Corporate War → Systematic Layoffs → Choice → Advance → Score` | damaliger Abbruch behoben; Einzelinstallation isoliert zu verbieten wäre falsch |
| 3BB / 27 | kostenlose verdeckte HQ-Mole-Vorbereitung bei einem verbleibenden Klick | vertretbare Strategieentscheidung, kein harter Fehler |
| 3BB / 44 und 63 | kein unfinanzierter Rush-Hour-Run mehr | bereits grün |
| 3BB / 50, 68 und 77 | bezahlter Draw statt historischer spekulativer Runs | bereits grün |

Die früher freigegebenen Broker- und Draw-Tax-Fehler sind im Warmup ebenfalls
nicht mehr reproduzierbar: Die aktuelle KI lädt Broker beziehungsweise wählt
die bezahlte Draw-Variante.

## Roter Testlauf

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-mrgsg-decision-checkpoints.test.ts `
  --reporter=verbose
```

Ergebnis vor dem Fix: zwei Tests, davon exakt der spielgleiche Zieltest rot
und die positive R&D-Gegenprobe grün. Dieser Lauf ist zugleich der Mutation
Witness: Die historische R&D-Auswahl verletzt die unveränderte Erwartung
unmittelbar.
