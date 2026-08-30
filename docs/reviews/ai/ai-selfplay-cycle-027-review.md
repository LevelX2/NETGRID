# KI-Selbstspielzyklus 027 – Chrome Rush zwischen Scoretempo und spätem Steal

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte KI-Entscheidungslücke

## Reproduktionsvertrag

- Auswahlseed: `f4a2c7e913b04af5aabb321af6e8d1c0`
- Runner: **Run til End**, 45 Karten,
  `standard_standard_runner_mp48400s_1.0.0`, `fnv1a:f89c68b9`
- Corp: **Chrome Rush Bureau**, 64 Karten,
  `standard_standard_corp_chrome_rush_bureau_1.0.0`, `fnv1a:2ebf0f5c`
- Spielseeds: `selfplay-027-18cfcb8c8b0c0c4c0cacbb00577ce903`,
  `selfplay-027-77126f0da3fcf0a54560c975225768fb` und
  `selfplay-027-cec9aa6b773720797f46e04dae180eb9`
- Ausgangsstand: `78a2ae576c8c2b006f4851607425a717b43ea895`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf Port 8912 und der fortgeschriebenen isolierten
SQLite-Evidence; keine Datenbank wurde gelöscht.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | Runner **10 – 4** Corp |      **7:4** | Agendapunkte |            388 |
| Seed 2 | Corp **10 – 2** Runner |      **7:2** | Agendapunkte |            207 |
| Seed 3 | Runner **10 – 4** Corp |      **7:4** | Agendapunkte |            472 |

Finale Match-IDs und StateHashes:
`match_bbac1caad7da65c7` / `fnv1a:52f4393c`,
`match_681ae3c152de645b` / `fnv1a:1b12a91e` und
`match_3a95a5a7f97c239d` / `fnv1a:13d6ed95`.

## Vollständiger Decision-Denominator

Alle 1.067 Entscheidungen wurden genau einmal klassifiziert: 388, 207 und
472 Traces, ausschließlich `ai-decision-trace-v2`. LegalActions,
Engine-Evidence, actor-private Analysesnapshots und Checkpoint-Capture sind
1.067/1.067 persistiert. `FLAGS=0`: keine Lücke, Duplikate, Fallbacks,
Timeouts, Auswahlmismatches, Engine-Rejections, Unknown-Assessments oder
fehlenden Auditsektionen. Der getrennte Eventpass enthält 389, 208 und 473
Events und jeweils den terminalen Zustand. Insgesamt: 49 Runstarts, 37
erfolgreiche Runs, zehn Steals und neun Corp-Scores.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner gewinnt 7:4 nach elf erfolgreichen von 15 Runs und vier
Steals. Die Corp schließt drei Scorelinien, kann den letzten Zentralzugriff in
D388 aber nicht verhindern.

**Seed 2:** Chrome Rush gewinnt 7:2 mit drei Scores. Der Runner erreicht zwar
13 erfolgreiche von 15 Runs, findet aber nur zwei Ein-Punkt-Agenden. Das ist
ein Zugriffsergebnis, kein ausgelassener legaler Matchpointpfad.

**Seed 3:** Der Runner gewinnt nach 62 Zügen 7:4. Die Corp hält im
Schlussfenster 47 Credits und hat drei Agenden gescoret; der vierte Runner-
Steal springt dennoch von 3 auf 7. Hohe Liquidität allein belegt keine sicher
bessere Defense- oder Scoresequenz, weil die vollständigen LegalActions keinen
dominanten alternativen Pfad zeigen.

Über die Serie konvertiert Chrome Rush in jedem Seed drei eigene Agenden.
Runner-Siege und Corp-Sieg unterscheiden sich vor allem in den Agenda-Treffern
bei ähnlich vielen erfolgreichen Runs. Das stärkt die Gegenindikation gegen
einen pauschalen Corp-Scorefix. Die hohe späte Liquidität in Seed 3 bleibt mit
SP-052 korrelierbar, trägt ohne exakt gequoteten Gegenpfad aber keine
Aufwertung des Verdachts. Kein neuer Fall und keine Codeänderung.

## Verifikation

- drei terminale Realpfad-Partien, 1.067/1.067, `FLAGS=0`;
- separate vollständige Eventhistorien mit Terminalzustand;
- Drilldown auf Score-/Steal-Timeline, letzte Verliererzustände und den
  47-Credit-Fall;
- keine Codeänderung, daher kein zusätzlicher Testlauf.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
