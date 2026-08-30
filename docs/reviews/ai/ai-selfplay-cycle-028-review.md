# KI-Selbstspielzyklus 028 – Tycho-Doppelscore gegen fehlende Runner-Abdeckung

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte KI-Entscheidungslücke

## Reproduktionsvertrag

- Auswahlseed: `2c4e8b91d75046e7a62d93e104d865cf`
- Runner: **Deep Market Engine**, 45 Karten,
  `standard_standard_runner_deep_market_engine_1.0.0`, `fnv1a:04a0b2b8`
- Corp: **Tycho Ice Stack**, 45 Karten,
  `standard_standard_corp_tycho_ice_stack_1.0.0`, `fnv1a:32e3f739`
- Spielseeds: `selfplay-028-d2c376b92b21d82b60f86e15f82d0c32`,
  `selfplay-028-80205709ddfce96f44629672d0c94bd3` und
  `selfplay-028-34a752d8a94e422eebb0138ee9151bf4`
- Ausgangsstand: `4ae2e77639402c1d97b294be380c80eb7f932bd0`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf Port 8912 und der fortgeschriebenen isolierten
SQLite-Evidence; keine Datenbank wurde gelöscht.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | Corp **10 – 0** Runner |      **8:0** | Agendapunkte |            118 |
| Seed 2 | Corp **10 – 0** Runner |      **8:0** | Agendapunkte |            251 |
| Seed 3 | Corp **10 – 0** Runner |      **8:0** | Agendapunkte |            295 |

Finale Match-IDs und StateHashes:
`match_5eac3add10ec1422` / `fnv1a:0f3658da`,
`match_d1da4d8cd6c5c1c2` / `fnv1a:ab42d071` und
`match_91db56644f851551` / `fnv1a:322672db`.

## Vollständiger Decision-Denominator

Alle 664 Entscheidungen wurden genau einmal klassifiziert: 118, 251 und 295
Traces, ausschließlich `ai-decision-trace-v2`. LegalActions,
Engine-Evidence, actor-private Analysesnapshots und Checkpoint-Capture sind
664/664 persistiert. `FLAGS=0`: keine Lücke, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections, Unknown-Assessments oder fehlenden
Auditsektionen. Der getrennte, unscoped Eventpass enthält 119, 252 und 296
Events und jeweils den terminalen Zustand. Insgesamt: 18 Runstarts, vier
erfolgreiche Runs, kein Steal und sechs Corp-Scores.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner contestet die erste Tycho-Remote sofort, kann die
rezzte Fire Wall aber nicht wirtschaftlich überwinden. Vor dem zweiten Score
wechselt der Remote-Owner nachvollziehbar zwischen `blocked_unpayable` und
einem noch nicht erreichten Credit-Reserve-Ziel. Die Corp gewinnt nach zwei
Vier-Punkte-Scores in D118.

**Seed 2:** Der Runner erreicht 35 Credits und startet sieben Runs, besitzt im
Schlussfenster aber nur Self-Modifying Code, Krash und Afreet. Der Remote-
Contest ist durchgehend `blocked_unbreakable`; zusätzliche Basiscredits
ändern diesen fehlenden Breakertyp nicht. Tycho gewinnt in D251.

**Seed 3:** Dasselbe Strukturproblem ist noch deutlicher: Krash und Afreet
decken die bekannte Remote-ICE nicht ab. `runner.contest_remote` lehnt die
legalen Start-Run-Actions mit `blocked_unbreakable` ab, während der Runner
seine sonst nicht konvertierbare Liquidität bis 52 Credits erhöht. Auch hier
schließt die Corp den zweiten Tycho-Score korrekt ab.

Über alle drei Seeds ist das 0:8 weder ein ausgelassener legaler Matchpoint-
Contest noch eine Wiederholung von SP-053: Die Remote-Action existiert, aber
der fachliche Owner weist eine konkrete, zustandsabhängige Unausführbarkeit
aus. Liquidität allein macht einen unbrechbaren Pfad nicht dominant. Die Serie
liefert damit Gegenindikation gegen einen pauschalen Credit- oder Matchpoint-
Override. Kein neuer Fall und keine Codeänderung; SP-068 und SP-069 bleiben
unberührt für Paarung 014 reserviert.

## Verifikation

- drei terminale Realpfad-Partien, 664/664, `FLAGS=0`;
- separate vollständige Eventhistorien mit Terminalzustand;
- Drilldown aller Runner-Hauptfenster nach dem ersten Vier-Punkte-Score auf
  LegalActions, Plan-Disposition, installierte Programme und Liquidität;
- keine Codeänderung, daher kein zusätzlicher Testlauf.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
