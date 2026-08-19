# KI-Selbstspielzyklus 009 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; ein generischer planübergreifender
Ownershipfehler in zwei Stufen behoben, fokussiert getestet und in zwei
vollständigen deterministisch identischen Realpfad-Replays verifiziert

## Reproduktionsvertrag

- Auswahlseed: `422509eecc6c66945c0f14fe281ffcd9`
- Spielseed: `selfplay-009-21da56ae2f888799758d45f51a286ada`
- Runner: **Skivviss Mill Pressure**, 45 Karten,
  `standard_standard_runner_skivviss_mill_pressure_1.0.0`,
  `fnv1a:4ff6aee1`
- Corp: **Siren Fortress**, 45 Karten und 25 Agendapunkte,
  `standard_standard_corp_siren_fortress_1.0.0`, `fnv1a:addfa55f`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad und dieselbe über
die Zyklen 005 bis 009 fortgeschriebene, isolierte Worktree-SQLite-Datenbank.
Die lokale read-only Maintenance-Analyse-API war der einzige Analysezugang;
Standardports und Main-Datenbank blieben unberührt. Ein beim API-Aufbau nach
40 Schritten bewusst stehen gelassener Smoke-Match gehört nicht zum
Ergebnisdenominator.

## Ergebnis und deterministische Gegenprobe

| Stand                                 | Ergebnis wie im Programm              | Entscheidungen | Kernaussage                                                                                                                    |
| ------------------------------------- | ------------------------------------- | -------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| Ausgangslauf `match_a944b3add18ccebb` | Runner 10 – Corp 0; Agendapunkte 8:0  |            231 | Handmanagement installiert ein Economy-Asset in die im selben Zug vorbereitete Score-Remote.                                   |
| Zwischenlauf `match_7d4876b58d2a3e13` | Runner 10 – Corp 0; Agendapunkte 9:0  |            385 | Die enge Letzter-Klick-Reservierung schützt D168, gibt dieselbe vorbereitete Remote im Folgezug aber wieder für Overflow frei. |
| final A `match_63ee0abf99b1725d`      | Runner 10 – Corp 0; Agendapunkte 10:0 |            264 | Referenzlauf; Ende durch Agendapunkte.                                                                                         |
| final B `match_c1484f4685ab273d`      | Runner 10 – Corp 0; Agendapunkte 10:0 |            264 | 264 von 264 Action-IDs, Actiontypen, Root-Pläne und Executor-Pläne identisch.                                                  |

Die finalen StateHashes unterscheiden sich wegen der Match-ID im Zustand
erwartungsgemäß (`fnv1a:79010748` und `fnv1a:31cacdf7`). Die vollständige
fachliche Entscheidungsfolge ist identisch.

## Vollständiger Decision-Denominator

Alle 264 Entscheidungen des finalen Referenzlaufs wurden über zwei begrenzte
Maintenance-Bundles genau einmal klassifiziert:

- 162 Runner- und 102 Corp-Entscheidungen;
- 264-mal persistierte historische LegalActions, Engine-Evidence,
  actor-private Analysesnapshots und Checkpoints;
- 264-mal Übereinstimmung zwischen Debugauswahl und angewandter Action;
- keine Fallbacks, Timeouts, ownerlosen Actions oder Auditlücken;
- 17 Runs, davon drei erfolgreich, vier gestohlene Agenden und keine
  gescorte Agenda;
- 70 Runfortsetzungen, 41 Basic-Credits, 24 Rez-Ablehnungen und 19
  Installationen wurden anhand ihrer Situation und ihres Owners geprüft.

## Bestätigtes Finding – Overflow belegt den vorbereiteten Score-Server

Im Ausgangslauf installiert `corp.defend_servers` D166 Wall of Static in
eine neue Remote. Root ist die exakt in HQ gebundene Tycho Extension; das ICE
ist ausdrücklich `develop_score_protection`. D167 versucht derselbe Parent
einmal gezielt nach weiterem Schutz zu ziehen. Mit dem letzten Klick sind
danach zwei relevante Installationen legal: Tycho Extension in Remote 1 oder
Corporate Negotiating Center als neue beziehungsweise bestehende Remote.
Der Scoreplan stellt die Agenda korrekt zurück, weil vier Advancements im
Folgezug mit nur drei garantierten flexiblen Klicks noch nicht vollständig
erreichbar sind.

Der Fehler liegt im nächsten Owner: Die endliche HQ-Overflow-Route schloss
neue Remotes grundsätzlich aus, ließ aber jede Nicht-Agenda-Installation in
einen bestehenden Server zu. Sie installierte deshalb Corporate Negotiating
Center genau in Remote 1. Im Folgezug war die Agenda dort nicht mehr legal
installierbar. Handmanagement hatte den Rootslot eines fremden, weiterhin
gebundenen Scoreplans umgewidmet.

Der erste Fix reservierte nur die exakt wegen des letzten Klicks verschobene
Remote. Der vollständige Zwischenreplay zeigte die nächste StateVersion:
D184 belegte Overflow dieselbe Remote erneut, nun während der Scoreplan wegen
Schutzreife und Matchpoint-Risiko blockiert war. Der endgültige generische
Vertrag reserviert deshalb eine Remote, wenn ein aktueller exakter
Agenda-Installationsparent sie adressiert und entweder die unmittelbare
Letzter-Klick-Fortsetzung besteht oder bereits ICE als Scorevorbereitung dort
liegt.

Eine konkurrierende Nicht-Agenda-Overflow-Installation wird ausdrücklich
durch `corp.hand_and_agenda_management` dispositioniert. Andere aktuelle
Overflow-Konversionen bleiben erhalten; im Replay installiert der bestehende
Handowner D168 Rio de Janeiro City Grid auf HQ. ICE-Allokation bleibt
ausschließlich `corp.defend_servers`, Agenda-Installation ausschließlich
`corp.score_agenda`. Der Fix erzeugt keine neue Serverentscheidung in einem
Choice-Resolver.

## Gewinneranalyse – warum Skivviss Mill Pressure gewann

Der Runner gewann durch dauerhaften HQ-Druck mit späterem Multiaccess:

1. Er installierte D8 Cyfermaster, erzwang D12 auf R&D das Rezzen von Data
   Wall und griff schon D20 erstmals HQ an. D25 trashte er dort Chester Mix.
2. The Short Circuit und Jackhammer ergänzten bis D68 die sichtbare
   Breakerabdeckung. Die Corp rezzte Ball and Chain, Neural Blade und
   Quandary, konnte den Runner aber vor allem verzögern, nicht dauerhaft von
   den Zentralservern ausschließen.
3. D93 stahl der Runner Black Ice Quality Assurance aus R&D für zwei Punkte.
   Viele spätere HQ-Runs endeten mit Jack-out oder ohne Agenda; die gewählte
   Strategie war deshalb kein glücklicher Einzelrun, sondern wiederholter
   Druck trotz Fehlschlägen.
4. D128 installierte er HQ Interface. Der zentrale Plan blieb danach auf HQ
   gebunden und nutzte die erhöhte Zugriffstiefe: D221 stahl er AI Chief
   Financial Officer, D262 ein zweites Exemplar und D264 Tycho Extension.
5. Drei erfolgreiche Runs reichten durch Multiaccess für vier Agenden und
   zehn Punkte. Das erklärt zugleich, warum die reine Anzahl erfolgreicher
   Runs die Stärke des Drucks unterschätzen würde.

## Verliereranalyse – warum Siren Fortress verlor

Die unmittelbare Verlustursache war `agenda_points`: Die Corp erzielte null
Punkte, während der Runner zehn Punkte stahl. Die strategische Kette verbindet
ein ungünstiges Druckprofil mit veränderbarem Score-Stau:

1. Die Corp investierte früh stark in Zentralverteidigung: bis D126 lagen
   mehrere ICE auf HQ und R&D. Vier ICE wurden tatsächlich gerezzt; 24
   Rez-Ablehnungen waren überwiegend bewusste Ressourcenschonung gegen bereits
   passende Breaker oder den gerade nicht entscheidenden Pfad.
2. Das Fortress-Deck verlangsamte viele Runs. Der Runner startete 17 Runs,
   aber nur drei wurden als erfolgreich gezählt. Dieser Teil des Matchups
   funktionierte; er genügte gegen HQ Interface und wiederholte Angriffe nicht.
3. Der bestätigte Overflowfehler sabotierte im Ausgangslauf die erste
   Score-Remote direkt. Nach dem Fix bleibt Remote 1 frei, und die Corp nutzt
   ihre nächsten gebundenen Score-Supportschritte tatsächlich für ICE statt
   fremde Assets.
4. Die Score-Unterstützung fragmentiert danach jedoch: D166 entsteht Remote 1
   mit Wall of Static, D185 Remote 2 mit Cinderella und D200 Remote 3 mit
   Haunting Inquisition. Weitere Score-Root-Schritte ziehen Karten oder nehmen
   Credits; keine Agenda wird installiert, avanciert oder gescort.
5. Gleichzeitig bleibt HQ agenda-gesättigt. Im letzten erfolgreichen
   Multiaccess stiehlt der Runner zwei Agenden im selben Run und beendet das
   Match. Die Corp hatte Schutzzeit gekauft, aber nie in eigenes Siegtempo
   konvertiert.

Das ist kein reines Anti-Deck-Matchup. HQ-Multiaccess gegen ein
agenda-gesättigtes Glacier-/Fortress-Deck ist ungünstig, und mehrere frühe
Zugriffe trafen nichts. Veränderbar ist aber, dass die Corp selbst nach
14 Corpzügen und mehreren gebundenen Schutzprojekten keinen einzigen
Scoreversuch begann.

## Neue Idee und verdichteter Verdacht – Score-Schutz nicht fragmentieren

Zyklus 009 verdichtet SP-017 zum dritten unterschiedlichen Matchbild: In
Zyklus 005 wartete die Corp fast das ganze Match auf einen Scoreversuch; in
Zyklus 008 erzeugte derselbe Owner 28 Supportentscheidungen ohne
Agenda-Installation; nun verteilt er Schutz auf drei leere Remotes.

Am ersten Fragmentierungsfenster D185 ist Cinderella sowohl für eine neue
Remote als auch als zweite Schicht auf Remote 1 legal. Die zweite Schicht
würde die formale Matchpoint-Mindestzahl erfüllen. Die aktuelle Engine-
Evidence zertifiziert dort aber keine unmittelbare
Zugriffswahrscheinlichkeitsreduktion, und der gemeinsame Rezbedarf der alten
und neuen Schicht ist höher als bei der neuen Einzelschicht. Ein generisches
„immer bestehende Remote fortsetzen“ wäre daher noch unbelegt.

Die nächste belastbare Idee ist ein vergleichender Score-Schutz-Vertrag:
Bestehende Schutzinvestition, Zahl unvollständiger Score-Remotes,
Rez-Finanzierung, öffentliche Runner-Coverage und die dadurch konkret
erreichbare Agenda-Installation müssen in derselben Quote stehen. Erst wenn
dieser Vertrag belegt, dass Konsolidierung die frühere Scorekonversion
ermöglicht, darf er die neue Remote verdrängen. Der Verdacht ist hoch
priorisiert, aber kein weiterer Fix dieses Zyklus.

## Prozessoptimierung aus dem Fünferlauf

- Alle fünf Zyklen und ihre Vorher-/Nachher-Matches liegen in einer
  fortgeschriebenen isolierten Worktree-Datenbank. Es gab keinen
  Datenbankreset; Serverneustarts erfolgten nur nach Codeänderungen.
- Erstellung, Sessiontoken und 40-Schritt-Batches werden in einem
  Ausführungsskript zusammengehalten. So entstehen keine verlorenen Tokens
  und keine unnötigen Teilmatches; der einmalige Smoke-Match bleibt als klar
  ausgeschlossener Aufbauhinweis dokumentiert.
- Die vollständige Analyse erfolgt in 200er-Bundles. Einzelabrufe werden nur
  für die erste Divergenz oder einen konkreten Plan-/LegalAction-Beweis
  verwendet.
- Replays vergleichen zunächst die komplette Action-, Root- und
  Executorsequenz. Identische Präfixe werden nicht erneut einzeln
  tiefanalysiert; hier lag die erste Divergenz des finalen Fixes exakt D184.
- Ein enger erster Fix gilt nicht als Zyklusabschluss. Erst der vollständige
  Replay machte sichtbar, dass die Reservierung auch über die
  Letzter-Klick-StateVersion hinaus gelten muss.

## Verifikation

- sechs fokussierte HQ-Overflow-Tests und zehn angrenzende
  Disposition-Contributor-Tests: grün;
- zwei finale Realpfad-Replays mit 264/264 identischen Action-IDs,
  Actiontypen, Root-Plänen und Executor-Plänen;
- keine Fallbacks, Timeouts, Debugabweichungen oder fehlenden Auditsektionen;
- KI-Paket-Typecheck enthält nach Ergänzung des neuen Contributor-Vertrags
  nur die sechs bereits auf `main` vorhandenen Baselinefehler: vier fehlende
  Golden-JSONs sowie zwei bestehende Optionalitätsfehler außerhalb dieses
  Changesets.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
