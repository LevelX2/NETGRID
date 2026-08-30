# KI-Selbstspielzyklus 035 – Planfortsetzung nach Zahlungsunterbrechung

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; SP-085 behoben und mit
identischem Seed verifiziert; SP-082 mit begrenzender Gegen-Evidence verdichtet

## Reproduktionsvertrag

- Auswahlseed: `cc92617dc780aeab2945e2ef7a237bf5`
- Runner: **Rent-I-Con: Das Shellspiel**, 45 Karten,
  `standard_standard_runner_rent_i_con_shellspiel_2026_07_17_1.0.0`,
  `fnv1a:518ccd75`
- Corp: **Proteus Korp - Variable ICE Gauntlet**, 45 Karten und
  18 Agendapunkte,
  `standard_standard_proteus_corp_variable_ice_gauntlet_2026_05_25_1.0.0`,
  `fnv1a:ee4233bc`
- Spielseeds: `selfplay-035-fe7cd775e11c34a148151a9bcafb31b2`,
  `selfplay-035-a0196dab00ce7b0d524181d17f54a731` und
  `selfplay-035-8af18b0043eca3e95d2d91ee630db10a`
- Ausgangsstand: `98598aab05f16a13a163fdf8af9e2cd2cf73ded8`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und der für den
Fünferblock gesetzten isolierten SQLite-Serie. Standardports und Datenbanken
des primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | Runner **10 – 0** Corp |      **7:0** | Agendapunkte |            329 |
| Seed 2 | Runner **10 – 2** Corp |      **8:2** | Agendapunkte |            151 |
| Seed 3 | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            452 |

Finale Match-IDs und StateHashes:
`match_5c5c7cefbf655e26` / `fnv1a:827fc3df`,
`match_015b492db5c083d2` / `fnv1a:3b9e1410` und
`match_ce9996d4fec2b083` / `fnv1a:dea3a6cb`.

## Vollständiger Decision-Denominator

932/932 Entscheidungen und Traces sind genau einmal vorhanden: 329, 151 und
452, ausschließlich `ai-decision-trace-v2`. Die getrennten Eventpässe
enthalten 330, 152 und 453 Events einschließlich Terminalzustand.
`FLAGS=0`: keine Lücken, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections oder fehlenden Auditsektionen.

876 Entscheidungen liegen im regulären Prüfpfad. Die 56 benannten
Ausnahmen umfassen Agenda-Steals, den einzigen Corp-Score, die jeweiligen
Terminalfenster sowie einen späten freiwilligen Corp-Draw und zwei
Runner-Zugenden mit Restklicks. Die beiden Zugenden gehören zu überfüllter
Hand beziehungsweise laufender Schadensrecovery und tragen keinen klar
dominanten Alternativpfad. Alle Ausnahmen wurden mit LegalActions,
Planbindung und Zustandsfolge geprüft.

Die Serie enthält 42 Runstarts, 31 erfolgreiche Runs, 13 Agenda-Steals und
einen Corp-Score.

## Findings und Clusterkorrelation

### SP-085 – KI-DTO verlor die exakte Zahlungsfortsetzung

Im ersten Lauf von Seed 1 wählte D90 der bestehende
`runner.rig_and_coverage`-Plan **Temple Microcode Outlet**. Die Engine öffnete
vor der Bezahlung ihr freiwilliges Kosten-/Strafzahlungsfenster. D91 nutzte
**Swiss Bank Account** über den bestehenden Economy-Support; D92 enthielt
danach nur noch die exakt ursprüngliche Event-Action als Engine-Fortsetzung.
Die Engine hatte Action-ID und Fenster-ID korrekt gebunden, doch die positive
Allowlist des KI-Eingabe-Datensatzes entfernte die vier side-sicheren
Support-/Fortsetzungsfelder. Dadurch blieb die einzige LegalAction
planseitig unsichtbar und der Lauf scheiterte fail-closed mit
`missing_plan_module_coverage`.

Der generische Fix bewahrt diese Bindungen im actor-privaten KI-Input und
hält die ursprüngliche `PlanExecutionOrigin` über die freiwillige
Supportaktion. Der Resolver wählt weder Karte noch Ziel, Server oder
Strategie; er setzt ausschließlich die einzige exakt gebundene ursprüngliche
Action fort. Fehlende oder abweichende Action- beziehungsweise Fensterbindung
scheitert weiter mit `window_origin_missing`.

Im frischen identischen Replay bleibt D90 beim Root und Executor
`plan:runner.rig_and_coverage:coverage%3Abreaker_ap`. D91 ist die separate
Swiss-Bank-Supportaktion. D92 kehrt mit identischer Event-Action-ID und
Fenster `runner_cost_penalty_support.90` zum ursprünglichen Rig-Root zurück.
Die Partie läuft anschließend regulär bis D329.

### SP-082 – zwei Stauverläufe, aber ein funktionierender Scorepfad

Seed 1 erzielt in 26 Corp-Zügen trotz 58 Economy-Aktionen keinen
Agendapunkt; der Runner beendet die Partie unter anderem mit zwei Steals aus
Archives. Seed 3 bleibt in 30 Corp-Zügen und 66 Economy-Aktionen ebenfalls
ohne Score und verliert fünf Agenden über zentrale Zugriffe. Beide Verläufe
verstärken das Muster aus hoher Entwicklungs-/Liquiditätsaktivität ohne
belastbare langsame Scorekonversion. Sie beweisen weiterhin keinen
zustandsgenau dominanten früheren Install-/Schutz-/Advance-Pfad.

Seed 2 ist die entscheidende Gegenprobe. D93–D95 installiert und avanciert
die Corp **Please Don't Choke Anyone** hinter `remote_1`. Der Runner greift
in D99 an; die Corp rezzt Gatekeeper mit zwei End-the-run-Subroutinen und
stoppt den Contest. D104–D106 setzt derselbe `corp.score_agenda`-Owner die
Agenda fort und scoret sie korrekt. Eine zweite Agenda wird D142 in denselben
Server installiert und bleibt dort, während der Runner das Match durch einen
R&D-Steal beendet. Eine pauschal aggressivere Scorefreigabe ist daher nicht
gerechtfertigt.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner gewinnt nach neun Runs und fünf erfolgreichen Runs.
Die Corp baut lange variable Zentral- und Remote-Defense auf, verwertet aber
keine Agenda. Zwei späte Archives-Steals liefern die letzten vier Punkte.
Der veränderbare Verdacht liegt in der Mehrzug-Konversion, nicht in einer
einzelnen klar falschen LegalAction.

**Seed 2:** Der Runner gewinnt nach 14 Runs und zwölf erfolgreichen Runs.
Die Corp demonstriert zugleich die gesuchte positive Score-Evidence: Der
Remote-Contest wird durch bezahlte variable ICE gestoppt, anschließend wird
die Agenda ownership-konform gescort. Drei spätere R&D-Runs und zwei direkte
Agenda-Treffer bestimmen den Verlust stärker als die Remote-Linie.

**Seed 3:** Der Runner gewinnt nach 19 Runs und 14 erfolgreichen Runs. Vier
frühe beziehungsweise mittlere Zentral-Steals bringen sechs Punkte; der
letzte R&D-Zugriff beendet die Partie. Die Corp investiert und finanziert
Defense, erzeugt aber keinen scorebaren Parent. Das ist neue Stau-Evidence,
aber ohne belegten besseren früheren Gesamtpfad noch kein Fixauftrag.

Über die Serie gewinnt der Runner 3:0. Die Paarung zeigt sowohl den offenen
Score-Stau als auch einen erfolgreichen geschützten Score. Deckmatchup,
Zentralvarianz und die hohe Runner-Runfrequenz begrenzen deshalb jede
rein ergebnisbasierte Schlussfolgerung.

## Verifikation und Abschlussentscheidung

- 932/932 Entscheidungen und 935 Events vollständig analysiert;
- alle drei Terminalzustände und StateHashes persistiert;
- DTO- und Ownership-Regression: 40/40 fokussierte Tests grün;
- identischer Seed 1 nach dem Fix als frisches Match vollständig grün;
- SP-085 ursachenorientiert behoben, ohne zweite Entscheidungsautorität;
- SP-082 mit zwei Verdachtsverläufen und einer positiven Gegenprobe
  verdichtet;
- kein weiterer generischer Fix: Die strategischen Alternativen sind noch
  nicht vollständig und side-sicher dominiert.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
