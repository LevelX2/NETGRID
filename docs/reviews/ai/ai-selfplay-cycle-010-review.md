# KI-Selbstspielzyklus 010 – gezielter SP-028-Folgezyklus

Stand: 2026-08-19
Status: SP-028 generisch behoben, fokussiert getestet und im vollständigen
Realpfad-Replay verifiziert; ein neuer strategischer Verdacht wurde getrennt
gespeichert

## Reproduktionsvertrag

- Auswahl- und Paarungsquelle: gezielte Wiederholung des in Zyklus 009
  verdichteten Falls SP-028
- Spielseed: `selfplay-009-21da56ae2f888799758d45f51a286ada`
- Runner: **Skivviss Mill Pressure**, 45 Karten,
  `standard_standard_runner_skivviss_mill_pressure_1.0.0`,
  `fnv1a:4ff6aee1`
- Corp: **Siren Fortress**, 45 Karten und 25 Agendapunkte,
  `standard_standard_corp_siren_fortress_1.0.0`, `fnv1a:addfa55f`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad auf einem eigenen
Worktree-Port und dieselbe über die vorherigen Zyklen fortgeschriebene,
isolierte SQLite-Datenbank. Die Analyse lief ausschließlich über die lokale
read-only Maintenance-API. Standardports und Main-Datenbank blieben
unberührt.

## Ergebnis wie im Programm

| Stand | Ergebnis | Agendapunkte | Entscheidungen | Remote-Verhalten |
| --- | ---: | ---: | ---: | --- |
| Referenz Zyklus 009, `match_c1484f4685ab273d` | Runner 10 – Corp 0 | 10:0 | 264 | D166 Remote 1, D185 Remote 2, D200 Remote 3 |
| erste unvollständige Gegenprobe, `match_e58f7c30dc9ee2f6` | Runner 10 – Corp 0 | 10:0 | 264 | unverändert drei Remotes; erster Fix traf den Realzustand noch nicht |
| finaler Fix, `match_7597acdd221583e2` | Runner 10 – Corp 0 | 8:0 | 183 | D166 Remote 1, D167 zweite ICE-Schicht auf Remote 1; keine weitere Remote |

Der finale Lauf endete regulär durch Agendapunkte. Er umfasste elf Runs, drei
erfolgreiche Runs, drei gestohlene und keine gescorte Agenda. Es gab keine
Fallbacks, Timeouts, Debug-/Action-Abweichungen oder Auditlücken.

## Warum Zyklus 009 den Fehler zunächst nicht als Finding erkannte

Die nötigen Daten waren bereits vorhanden. D185 und D200 zeigten jeweils
denselben Widerspruch: Das Defense-Modul hielt ein ICE auf einer neuen leeren
Remote für sinnvolle Scorevorbereitung, schloss dasselbe ICE auf der bereits
vorbereiteten Remote aber mit der Begründung aus, es senke die von der Engine
berechnete unmittelbare Zugriffswahrscheinlichkeit nicht. Die damalige
Analyse übernahm diesen lokalen `whyNot`-Code zu stark als fachliche
Rechtfertigung und verlangte zusätzliche Match-Evidence.

Das war ein Analysefehler. Eine Debug-Begründung beweist nur, welchen Pfad die
KI genommen hat. Sie beweist nicht, dass dieser Pfad fachlich richtig ist.
Spätestens der Sequenzwiderspruch „vorhandene Investition ablehnen, identische
Fähigkeit auf neuer leerer Remote zulassen“ hätte SP-028 direkt zum Finding
verdichten müssen.

Der dauerhafte Selbstspiel-Skill enthält deshalb jetzt ein verbindliches
Sequenz-Widerspruchs-Gate: wiederholte Neuerzeugung, Aufgabe oder Neustarts
werden über Entscheidungen hinweg verglichen; ein lokaler Trace- oder
`whyNot`-Code darf den Widerspruch nicht entkräften. Außerdem besteht eine
Paarung standardmäßig aus drei unterschiedlichen Seeds, damit Häufigkeit und
Varianz getrennt von der Fehlerklassifikation sichtbar werden.

## Bestätigtes Finding und Ursachen

SP-028 bestand aus drei gekoppelten generischen Fehlern im bestehenden Owner
`corp.defend_servers`:

1. Eine unveränderte unmittelbare Zugriffswahrscheinlichkeit wurde mit
   „keine Verstärkung“ gleichgesetzt. Bekannter Breaker-Creditverbrauch,
   Stop-, Damage-/Tax- und Encounter-Störungswert blieben damit unberücksichtigt.
2. Bei einer weiteren Schicht wurden die Rez-Kosten aller bereits liegenden
   unrezzten ICE als gemeinsam zu finanzierende Pflichtschuld addiert, obwohl
   sie alternative Begegnungsantworten sind.
3. Eine erste langfristige Schutzschicht durfte unter engen
   makrostrategischen Bedingungen vor der vollständigen Rez-/Score-Finanzierung
   gelegt werden. Die genau zur üblichen Zwei-Schicht-Reife fehlende zweite
   Schicht erhielt dieselbe Ausnahme nicht. Dadurch gewann die neue leere
   Remote gegen die Fortsetzung der vorhandenen Remote.

Der Fix bleibt beim vorhandenen Planowner. Er erkennt bekannte direkte
Begegnungskosten und Störungen als Schutzfortschritt, finanziert nur die
tatsächlich gebundene neue Rez-Option und behandelt die zweite Reifeschicht
unter denselben Sicherungen wie die erste. Die Ausnahme endet bei zwei
Schichten; sie erlaubt kein blindes drittes ICE. Es entsteht auch kein festes
„Core Remote“: Nach Ende oder Änderung des konkreten Projekts bleiben alle
legal geeigneten Remotes für Agenda, Asset oder andere Root-Inhalte neu
bewertbar. Kein Choice-Resolver und keine zweite Entscheidungsautorität wurden
ergänzt.

## Vollständiger Decision-Denominator

Die 183 Entscheidungen des finalen Laufs wurden genau einmal klassifiziert:

- 107 Runner- und 76 Corp-Entscheidungen;
- 183-mal persistierte LegalActions, Engine-Evidence, actor-private
  Analysesnapshots und Checkpoints;
- 183-mal Übereinstimmung zwischen Debugauswahl und angewandter Action;
- 37 Basic-Credits, 27 Runfortsetzungen, 21 Zugenden, 16 Installationen,
  13 Rez-Ablehnungen und elf Runs;
- keine Fallbacks, Timeouts, ownerlosen Actions oder Auditlücken.

Die Entscheidungen D1 bis D166 sind action- und seitengleich mit der
unvollständigen Gegenprobe und damit durch die vollständige Analyse von
Zyklus 009 abgedeckt. Der neue Suffix D167 bis D183 wurde einzeln geprüft:

- D167 bleibt unter demselben Root `corp.score_agenda`, demselben Leaf
  `corp.defend_servers` und demselben Step `develop_score_protection`, bindet
  aber `Cinderella` jetzt an Remote 1 statt an eine neue Remote.
- D168 zieht derselbe Parent einmal nach weiterer Schutzentwicklung; D169
  beendet den Corpzug legal.
- D170 baut der Runner seinen Handpuffer, D171 startet der bestehende
  HQ-Druckplan den Run.
- D172 und D178 lehnt die Corp zwei aktuell unbezahlbare Rez-Optionen ab; die
  dazwischenliegenden Runfortsetzungen und gedruckten Subroutinen gehören
  jeweils dem gebundenen Run- beziehungsweise Engine-Window-Owner.
- D180 bis D183 wickelt derselbe Run-Owner zwei HQ-Zugriffe ab und stiehlt
  `Tycho Extension` sowie `AI Chief Financial Officer`.

Im letzten Analysesnapshot existieren HQ mit vier ICE, R&D mit drei ICE,
Archives ohne ICE und genau Remote 1 mit zwei ICE. Es gibt keine Remote 2 oder
Remote 3.

## Gewinneranalyse – warum Skivviss Mill Pressure gewann

Der Runner gewann erneut nicht durch einen einzelnen Glücksrun, sondern durch
die bereits im identischen Präfix aufgebaute zentrale Strategie. Seine
Breakerabdeckung, wiederholter HQ-Druck und HQ Interface machten selbst vier
HQ-ICE langfristig passierbar. Im letzten Run konnte die Corp die teuren
äußeren ICE nicht rezzen; die beiden rezzten inneren Schichten verursachten
Kosten und Effekte, verhinderten den Zugriff aber nicht. Der Multiaccess fand
zwei Agenden und erhöhte den Runner von zwei auf acht Agendapunkte.

## Verliereranalyse – warum Siren Fortress verlor

Die unmittelbare Ursache war `agenda_points`: Runner 8, Corp 0. Das Matchup ist
für ein agenda-gesättigtes Fortress-Deck gegen HQ Interface ungünstig, doch die
veränderbare strategische Kette bleibt deutlich:

1. Die Corp investierte bis D166 stark in Zentralverteidigung, hatte beim
   letzten Run aber nur vier freie Credits. Haunting Inquisition und Wall of
   Ice auf HQ kosteten acht beziehungsweise dreizehn Credits und waren damit
   keine aktuellen Antworten.
2. Gleichzeitig hielt HQ mindestens die beiden später gestohlenen Agenden mit
   zusammen sechs Punkten. Die Corp hatte damit ein hohes zentrales
   Verlustpotenzial, erzielte aber weiterhin keinen eigenen Scorefortschritt.
3. Die korrigierte D167-Entscheidung konsolidiert den Score-Schutz fachlich
   richtig auf Remote 1. Sie verbraucht jedoch den Klick, der im Referenzlauf
   nur aufgrund von Handdruck `Rio de Janeiro City Grid` auf HQ installierte.
   Der finale Lauf endet deshalb früher; ein schlechteres Endergebnis widerlegt
   die beseitigte Remote-Fragmentierung nicht, zeigt aber einen neuen
   strategischen Anschlussverdacht.
4. D168 zieht der Score-Support trotz zweier vorbereiteter ICE noch einmal,
   weil die vollständig finanzierte Zugriffsschutzquote beide unrezzten
   Schichten bei erhaltener Score-Reserve nicht als aktuelle Schutzlösung
   anerkennt. Ob hier Credit-Aufbau oder ein anderer Parent besser ist, ist
   ohne weiteren Vergleich noch nicht belegt.

Die Niederlage ist daher weder reine Varianz noch allein ein Anti-Deck-Fall.
Der konkrete Remote-Fehler ist beseitigt; offen bleibt die übergreifende
Priorisierung zwischen zentralem Agenda-Risiko, defensiven Upgrades,
Score-Finanzierung und weiterem Schutz-Drawing.

## Neue Idee und Verdacht SP-029 – defensive Upgrades als Defense-Route

`Rio de Janeiro City Grid` war D167 legal auf HQ installierbar und besitzt
einen bekannten, wiederholten End-the-run-Effekt beim Passieren von rezztem
ICE. Die aktuelle KI weist diese Aktion aber ausschließlich dem
Handmanagement zu und verwirft sie dort mangels Hand- oder Parentbedarf. Im
Referenzlauf gelangte Rio nur durch späteren HQ-Overflow auf HQ und trug dazu
bei, den entsprechenden Run zu überleben; im finalen Lauf fehlt dieser
zufällige Umweg.

Menschenverständlich lautet der Verdacht: Die Corp kann defensive
Server-Upgrades derzeit nicht als eigene, mit ICE, Agenda-Risiko und
Zentraldruck vergleichbare Defense-Option planen. Ein Fix wäre erst dann
belastbar, wenn weitere Zustände den exakten legalen Upgradepfad, Kosten,
Engine-/Hint-Effekt und seinen Grenznutzen gegenüber ICE, Credits und
Scorefortschritt bestätigen. SP-029 bleibt deshalb Verdacht und wird mit
SP-005/SP-011 im Cluster `corp-central-defense-allocation` weiter verdichtet.

## Verifikation

- zwei fokussierte Plan-Ownership-Regressionen: grün;
- 69 angrenzende Tests aus Score-Schutz, Defense-Turn-Planung,
  Score-/Defense-Kontinuität und effektiver ICE-Wirkung: grün;
- AI-Typecheck: keine neue Abweichung; dieselben sechs Fehler wie auf `main`
  (vier fehlende Golden-JSONs und zwei bestehende Optionalitätsfehler);
- vollständiger Realpfad-Replay: 183 Entscheidungen, keine Fallbacks,
  Timeouts, Debugabweichungen oder Auditlücken; Remote-Fragmentierung
  vollständig verschwunden.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
