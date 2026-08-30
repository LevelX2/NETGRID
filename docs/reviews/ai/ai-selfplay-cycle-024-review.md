# KI-Selbstspielzyklus 024 – normale Runner-Restklicks bleiben produktiv

Stand: 2026-08-20
Status: zwei generische P6-Liquiditätsfehler behoben und im Drei-Seed-Realpfad verifiziert

## Reproduktionsvertrag

- Auswahlseed: `830efeb74bfbe91c185f071811089a93`
- Runner: **Ice Destruction Runner**, 45 Karten,
  `standard_standard_runner_ice_destruction_runner_1.0.0`, `fnv1a:698b9883`
- Corp: **Proteus Korp - Variable ICE Gauntlet**, 45 Karten,
  `standard_standard_proteus_corp_variable_ice_gauntlet_2026_05_25_1.0.0`,
  `fnv1a:ee4233bc`
- Spielseeds:
  - `selfplay-024-96f140c81804d50c4906b61e07dadfc2`
  - `selfplay-024-03b8b3c0a02a16ce60ae58f9b0149fcf`
  - `selfplay-024-944bc1dbda83375f3c448a90f7d5fd09`
- Ausgangsstand: `518c8b632f667baea2127208170dafad4e9860f4`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 und derselben fortgeschriebenen
SQLite-Evidence des parallelen Worktrees. Es wurde keine Datenbank gelöscht.

## Ergebnis wie im Programm

| Partie | Standarddecks                                                             |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ------------------------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Ice Destruction Runner** gegen **Proteus Korp - Variable ICE Gauntlet** | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            352 |
| Seed 2 | **Ice Destruction Runner** gegen **Proteus Korp - Variable ICE Gauntlet** | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            493 |
| Seed 3 | **Ice Destruction Runner** gegen **Proteus Korp - Variable ICE Gauntlet** | Runner **10 – 2** Corp |      **7:2** | Agendapunkte |            330 |

Die finalen Match-IDs lauten `match_4d09f57fa24da97d`,
`match_8a138d37d89521b2` und `match_013087ac5c907d00`. Ihre terminalen
StateHashes sind `fnv1a:537cdb92`, `fnv1a:8a0db1bc` und `fnv1a:b6aad6d7`.

## Vollständiger Decision-Denominator

Alle 1.175 finalen Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 352;
- Seed 2: Indizes 1 bis 493;
- Seed 3: Indizes 1 bis 330;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 1.175/1.175 persistiert;
- 0 Flags: keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, Unknown-Tag, fehlende Auditsektion oder nicht berichtete
  Engine-Quote;
- 70 Runstarts, 23 erfolgreiche Runs, 13 gestohlene und eine von der Corp
  gescorte Agenda;
- der separate unbeschränkte Eventpass enthält 353, 494 und 331 Events und
  jeweils den terminalen Zustand.

Der Ausgangslauf umfasst 788 Entscheidungen beziehungsweise Fehlversuche.
Seed 2 bricht nach 358 regulären Traces in D359 ab, Seed 3 nach 76 regulären
Traces in D77. Beide privaten Failure-Attempts belegen dieselbe unzulässige
Restklick-Aufgabe; der finale Nenner enthält keinen Fehlversuch mehr.

## SP-065 – Defense-Endturn erklärt normale Restklicks fälschlich für erschöpft

In den Ausgangsspielen `match_3a69693c29602c61` D359 und
`match_948160e7b8c9cd76` D77 hatte der Runner noch einen Klick, 27
beziehungsweise 34 Karten im Stack und eine legale Basiscredit-Action.
Trotzdem dispositionierte `runner.defense_and_recovery` die Kapazität als
`forgo_exhausted_options` und versuchte den Zug zu beenden. Der Scheduler
stoppte korrekt mit `end_turn_with_usable_capacity`.

Die Laufzeit darf erschöpfte Standardkapazität nun nur bei tatsächlich leerem
Stack und verbleibenden Klicks markieren. Bei nicht leerem Stack bleibt die
normale Restkapazität beim nachrangigen `runner.economy`-Owner. Der Fix wählt
weder Server noch Runziel und erweitert keine Defense-Autorität.

## SP-067 – erfülltes residentes Liquiditätsziel blockiert frische Restklickquote

Nach SP-065 wurden dieselben Zustände enger fail-closed als
`missing_plan_module_coverage`: Ein residentes P6-Liquiditätsziel blieb nach
einem externen Credit-Zufluss auf seinem alten `targetCredits` stehen. War
dieses Ziel bereits erreicht oder überschritten, durfte `runner.economy`
keine weitere Basiscredit-Action übernehmen, obwohl normale Klicks übrig
waren.

Der residente Zielwert bleibt während der eigenen gebundenen P6-Konversion
stabil. Erst wenn aktuelle Credits ihn durch einen externen Zufluss erreicht
oder überschritten haben, wird er verworfen und einmalig aus aktuellem
Creditstand plus verbleibenden Klicks neu begrenzt. So bleibt der endliche
Ownervertrag erhalten, ohne gewöhnliche Kapazität ownerlos zu lassen.

Seed 1 bleibt über alle 352 Entscheidungen action-identisch. Seed 2 bleibt bis
D358 identisch und setzt in D359 mit `runner.gain_credit` unter
`runner.economy` fort; Seed 3 bleibt bis D76 identisch und setzt entsprechend
in D77 fort. Beide Partien erreichen danach regulär ihren terminalen Zustand.

## Gewinneranalyse

Der Ice-Destruction-Runner gewinnt alle drei Partien über Agendapunkte. In
Seed 1 reichen sieben erfolgreiche von 16 Runs für vier gestohlene Agenden.
Seed 2 ist mit 40 Runs und nur neun Erfolgen deutlich widerstandsreicher,
liefert dem Runner aber fünf Agenda-Treffer. Seed 3 umfasst sieben erfolgreiche
von 14 Runs und vier Steals; nur hier konvertiert die Corp eine eigene Agenda.

Die gemeinsame Stärke liegt in wiederholtem Zentralzugriff gegen das variable
ICE-Portfolio. Die stark unterschiedliche Partielänge und Erfolgsquote zeigen
Varianz in ICE-, Agenda- und Zugriffslage, nicht eine einzelne deterministische
Gewinnsequenz.

## Verliereranalyse und Metaebene

1. Die Corp verliert terminal dreimal durch Runner-Agendapunkte und scoret
   insgesamt nur eine Agenda. Der Runner stiehlt dagegen 13 Agenden.
2. Seed 2 belegt mit 31 erfolglosen Runs erheblichen Corp-Widerstand; trotzdem
   verhindert die Defense die wiederholten Zentralzugriffe langfristig nicht.
   Aus den auditierten LegalActions folgt kein einzelner sicher besserer
   Corp-Pfad.
3. Die Ergebnisse tragen deshalb keine neue belastbare Corp-Heuristik. Der
   klare generische Fehler liegt in den beiden reproduzierten Runner-
   Laufzeitabbrüchen, nicht in einer nachträglichen Siegeroptimierung.
4. SP-067 ist die unabhängig sichtbar gewordene residente
   Ziel-Lifecycle-Ursache; SP-065 und SP-067 bleiben beim bestehenden
   P6-Economy-/Scheduler-Vertrag. Die zunächst als Bestätigung notierten
   Endturns aus Paarung 013 gehören nach finalem Detailaudit zu der anderen,
   zulässigen `forgo_terminal_deck_pressure`-Route und wurden aus der
   Evidence entfernt.

## Verifikation

- fokussierte Runtime-Datei 263/263 grün;
- Ownership-Regression hält normale Restklicks bei nicht leerem Stack auf
  `runner.economy` und lässt den Defense-Endturn fail-closed;
- Ziel-Lifecycle-Test hält die eigene Quote stabil und rebaset erst nach
  externem Credit-Zufluss;
- drei finale Realpfad-Partien mit 1.175/1.175 fehlerfrei auditierten
  Entscheidungen und vollständigem separatem Eventpass;
- exakte Präfixe bis D358 und D76, danach erwartete P6-Fortsetzung;
- keine Änderung des KI-Zielbilds erforderlich: Change Compass, README und
  Planning-Architektur beschreiben den bestehenden Ownervertrag bereits.

Verdichtete Evidence steht in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
