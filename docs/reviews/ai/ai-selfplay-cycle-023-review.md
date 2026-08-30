# KI-Selbstspielzyklus 023 – Score-Effekt-Zielvarianten bleiben beim Scoreowner

Stand: 2026-08-20
Status: generische Action-Disposition behoben und im Drei-Seed-Realpfad verifiziert

## Reproduktionsvertrag

- Auswahlseed: `6aab4d680be17586bd307a899ca65b95`
- Runner: **Last Call at R&D**, 45 Karten,
  `standard_standard_runner_last_call_at_rd_1.0.0`, `fnv1a:61769222`
- Corp: **The Korp Master**, 45 Karten,
  `standard_standard_corp_mp1ddh7c_1.0.0`, `fnv1a:0240cc26`
- Spielseeds:
  - `selfplay-023-b787d6dae2e6bf94da09316aa7236fdc`
  - `selfplay-023-37bd71ee580de0a06d4da18911f5c031`
  - `selfplay-023-d2bbe998f008731d60f52fb541a9c4e9`
- Ausgangsstand: `420ce723ae3cd4afdab937150c7991b00b2c55cc`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 und derselben fortgeschriebenen
SQLite-Evidence des parallelen Worktrees. Es wurde keine Datenbank gelöscht.

## Ergebnis wie im Programm

| Partie | Standarddecks                                  |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Last Call at R&D** gegen **The Korp Master** | Runner **10 – 6** Corp |      **9:6** | Agendapunkte |            309 |
| Seed 2 | **Last Call at R&D** gegen **The Korp Master** | Corp **10 – 6** Runner |      **8:6** | Agendapunkte |            412 |
| Seed 3 | **Last Call at R&D** gegen **The Korp Master** | Runner **10 – 0** Corp |      **7:0** | Agendapunkte |             29 |

Die finalen Match-IDs lauten `match_82b93c00da356d18`,
`match_306137f2b76a69f7` und `match_2d9a84992cb6622f`.

## Vollständiger Decision-Denominator

Alle 750 finalen Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 309;
- Seed 2: Indizes 1 bis 412;
- Seed 3: Indizes 1 bis 29;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 750/750 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, Unknown-Tag oder fehlende Auditsektion;
- 39 Runstarts, 24 erfolgreiche Runs, neun gestohlene und fünf von der Corp
  gescorte Agenden.

Der Ausgangslauf umfasst 556 Entscheidungen beziehungsweise Fehlversuche.
Seed 2 endet nach 217 regulären Traces mit einem privaten
`ai-decision-failure-attempt-v1` in D218. Die vollständigen LegalActions und
der Fehlversuch belegen die fehlende Disposition; der finale Nenner enthält
keinen Fehlversuch mehr.

## SP-063 – nicht gewählte Score-Effekt-Ziele bleiben produktiv ownerlos

Im Ausgangsspiel `match_d3d3678d6163c47a` avanciert die Corp in D217
Security Net Optimization auf Remote 2 zur Scorereife. Die Engine veröffentlicht
danach fünf legale `score_agenda`-Varianten derselben Agenda. Sie unterscheiden
sich ausschließlich im Ziel des When-Scored-Effekts: HQ, R&D, Archives,
Remote 1 oder Remote 2.

Der bestehende Plan `corp.score_agenda` wählt exakt die HQ-Variante und bindet
sie als aktuelle Same-Turn-Continuation. Die vier nicht gewählten Geschwister
blieben jedoch als produktive Actions ohne Owner stehen. Der vollständige
Turn-Planning-Cutover brach deshalb mit `missing_plan_module_coverage` ab,
obwohl Action-, Agenda- und Zielwahl bereits eindeutig beim Scoreplan lagen.

Die Corp-Disposition erkennt nun ausschließlich eine aktuelle, feasible
`score_agenda`-Projektion mit identischer Agenda-Instanz und mindestens einer
exakt gebundenen Action-ID. Weitere `score.agenda`-LegalActions derselben
Agenda werden explizit als nicht gewählte Effekt-Zielvarianten durch
`corp.score_agenda` dispositioniert. Der Scoreplan bleibt alleiniger Owner von
Agenda, Effektziel und Action; Resolver, Action-ID, Root, Leaf, Step und
Executor werden weder dupliziert noch neu gewählt.

Im finalen Seed 2 ist die Actionfolge bis D217 identisch. D218 scoret exakt die
schon zuvor gebundene HQ-Variante unter `corp.score_agenda`; D219 setzt der
gleiche Scoreparent mit der nächsten Agenda fort. Die Partie läuft ohne
Coverage- oder Apply-Abweichung bis zum Corp-Sieg in D412. Seeds 1 und 3
bleiben über 309 beziehungsweise 29 Entscheidungen vollständig
action-identisch.

## Gewinneranalyse

**Seed 1:** Der Runner gewinnt 9:6 nach 14 Runs, davon elf erfolgreich, und
vier gestohlenen Agenden. Die Corp konvertiert zwei eigene Scorelinien. Beim
6:6 in Zug 42 beendet der Runner die Partie über Remote 1. Der vollständig
action-identische Gegenlauf grenzt SP-063 von dieser Niederlage ab.

**Seed 2:** Nach dem reparierten Scorefenster erreicht die Corp 5:3 und
schließt in D412 Superior Net Barriers zum 8:6 ab. Der Runner startet 22 Runs,
aber nur zehn sind erfolgreich; ab Zug 34 ist der Stack leer. Die Corp
konvertiert drei Agenden, während der Runner zwei stiehlt. Der Fix beseitigt
den Laufzeitabbruch und erlaubt dem bereits gewählten Scorepfad seine
Fortsetzung, ohne den späteren Sieger strategisch vorzugeben.

**Seed 3:** Der Runner stiehlt in drei erfolgreichen Runs drei Agenden und
gewinnt bereits in D29 mit 7:0. Ein früher HQ-Zugriff sowie zwei Agenda-Treffer
in demselben R&D-Zug dominieren die Partie. Diese starke Agenda-Konzentration
ist Seedvarianz; die vollständige Actionfolge bleibt durch SP-063 unverändert.

## Verliereranalyse und Metaebene

1. Die Corp-Niederlagen unterscheiden sich deutlich: Seed 1 ist ein spätes
   enges 6:9 trotz zweier Scores, Seed 3 ein frühes 0:7 durch drei unmittelbar
   erfolgreiche Zentralzugriffe. Daraus folgt keine gemeinsame neue
   Defense-, Economy- oder Scoreheuristik.
2. Die Runner-Niederlage in Seed 2 entsteht bei leerem Stack und nur zehn
   erfolgreichen von 22 Runs. Die Corp erreicht drei belegte Scorelinien; ein
   sicher besserer Runnerpfad ist aus den LegalActions nicht nachgewiesen.
3. SP-063 korrigiert ausschließlich den vollständigen Decision-Denominator:
   Der Scoreowner muss seine nicht gewählten Geschwistervarianten selbst
   dispositionieren, nachdem er die exakte Effektziel-Action gewählt hat.
4. Zwei action-identische Gegenläufe und der identische Präfix bis D217 im
   betroffenen Seed grenzen die Wirkung auf das reproduzierte Fenster ein.
   Die Serie trägt keinen zweiten klaren Finding; SP-065 bleibt frei.

## Verifikation

- fokussierte Contributor-Datei 12/12 grün;
- Ownership-Test hält ausgewählte Action-ID und `corp.score_agenda`-Route
  unverändert und prüft die explizite Disposition einer Geschwistervariante;
- gespeicherter Read-only-Zustand D217 wählt und appliziert die HQ-Scoreaction
  erfolgreich zu StateVersion 218;
- drei finale Realpfad-Partien mit 750/750 fehlerfrei auditierten
  Entscheidungen;
- Seeds 1 und 3 action-identisch, Seed 2 identischer Präfix bis D217 und
  erwartete Fortsetzung in D218;
- keine Änderung des KI-Zielbilds erforderlich: Die bestehende
  Score-Ownership wird nur im Action-Disposition-Vertrag vervollständigt.

Verdichtete Evidence steht in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
