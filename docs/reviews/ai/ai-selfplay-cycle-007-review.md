# KI-Selbstspielzyklus 007 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; zwei generische Planabdeckungsfehler behoben,
fokussiert getestet und in zwei vollständigen, deterministisch identischen
Realpfad-Replays verifiziert

## Reproduktionsvertrag

- Auswahlseed: `f63120f879a3d56d61329a653ba5f21d`
- Spielseed: `selfplay-007-1aad240bff9cc20537a132d45cf0aaa4`
- Runner: **Mit Ansage: Der perfekte Coup**, 45 Karten,
  `standard_standard_runner_mit_ansage_der_perfekte_coup_2026_07_09_1.0.0`,
  `fnv1a:40d73253`
- Corp: **Tycho Ice Stack**, 45 Karten und 12 Agendapunkte,
  `standard_standard_corp_tycho_ice_stack_1.0.0`, `fnv1a:32e3f739`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace

Alle Realpfad-Läufe verwendeten den normalen Multiplayer-/KI-Pfad, eine
isolierte SQLite-Datenbank und die lokale read-only Maintenance-Analyse-API.
Standardports und Main-Datenbank blieben unberührt.

## Ergebnis und deterministische Gegenprobe

| Stand                            | Ergebnis wie im Programm             |        Entscheidungen | Kernaussage                                                                                                             |
| -------------------------------- | ------------------------------------ | --------------------: | ----------------------------------------------------------------------------------------------------------------------- |
| Ausgangspfad vor Fix 1           | kein Endergebnis                     | Abbruch vor Runner-D8 | R&D Mole bleibt ohne Planowner, weil die side-sichere Actionsemantik den Zentralserver nicht mitliefert                 |
| Zwischenpfad vor Fix 2           | kein Endergebnis                     |  Abbruch vor Corp-D53 | ACME-Verpflichtung kann legal für 12 Credits entfernt und in einen Agendapunkt umgewandelt werden, bleibt aber ownerlos |
| final A `match_2c166dda041da6ff` | Corp 10 – Runner 4; Agendapunkte 8:4 |                   419 | Referenzlauf; Ende durch Agendapunkte                                                                                   |
| final B `match_fc3094aac35c9b54` | Corp 10 – Runner 4; Agendapunkte 8:4 |                   419 | 419 von 419 Action-IDs, Actiontypen und Planowner identisch                                                             |

Die finalen StateHashes unterscheiden sich erwartungsgemäß, weil die
Match-ID im Zustand erhalten bleibt (`fnv1a:6750bf81` und
`fnv1a:181dbdd5`). Die vollständige fachliche Entscheidungsfolge ist dagegen
identisch.

## Vollständiger Decision-Denominator

Alle 419 Entscheidungen des finalen Referenzlaufs wurden über drei begrenzte
Maintenance-Bundles genau einmal klassifiziert:

- 419 regulär angewandte Plan- oder Engine-Fortsetzungen;
- 419-mal persistierte historische LegalActions, Engine-Evidence,
  actor-private Analysesnapshots und Checkpoints;
- 419-mal Übereinstimmung zwischen Debugauswahl und angewandter Action;
- keine Fallbacks, Timeouts oder Maintenance-Warnungen;
- 0 ungeklärte ownerlose Actions im finalen Lauf.

Die 52 Rez-Ablehnungen gehören überwiegend zum einzigen Owner
`corp.defend_servers`; 25 Runner-Draws gehören zu
`runner.rig_and_coverage`. Diese Häufungen werden deshalb nicht isoliert als
Fehler gezählt, sondern in der strategischen Verlustanalyse eingeordnet.

## Bestätigtes Finding 1 – Zentral-Payoff-Installation verliert ihren Owner

Im Ausgangspfad bietet die Engine R&D Mole als produktive Installation an.
Der Plan kennt die Kartenfähigkeit, doch die side-sichere Actionsemantik
enthält weder `sourceDefinitionId` noch einen semantischen R&D-Targethinweis.
Die frühere Materialisierung verlangte genau diese angereicherten Felder und
ließ die reale LegalAction deshalb vor D8 ownerlos fail-closed.

Der generische Fix bindet die sichtbare Quellinstanz aus der Runnerhand an die
LegalAction zurück und verwendet die vorhandenen Definition-Hints nur zur
Einordnung des Zentral-Payoffs. Fehlt eine aktuell tragfähige Zentralroute,
wird die Installation ausdrücklich durch `runner.pressure_central`
zurückgestellt; es entsteht kein zweiter Installationsowner. Ein fokussierter
Test entfernt absichtlich alle angereicherten Server- und
Definitionsinformationen aus dem Kandidaten und sichert diesen Realpfad.

## Bestätigtes Finding 2 – regelbasierte Agendakonversion bleibt ownerlos

Nach dem ersten Fix erreicht die Corp D53 mit einer aktiven Verpflichtung aus
ACME Savings and Loan, 14 Credits und einer exakten LegalAction: ein Klick
und 12 Credits entfernen die Verpflichtung und erzeugen einen Agendapunkt.
Die positive Quote erreichte den gespeicherten Engine-Audit, wurde aber vom
positiven Payload-Allowlist des KI-Inputs entfernt. Kein Plan durfte die
Action danach beanspruchen.

Der Fix lässt ausschließlich die drei öffentlichen, actiongebundenen
Quote-Felder passieren: Creditkosten, Punktgewinn und Zahl aktiver
Verpflichtungen. `corp.score_agenda` materialisiert daraus einen
`convert_agenda`-Step. Quellregel, StateVersion, Klick- und Creditkosten sowie
positive Punktwirkung müssen exakt zusammenpassen; Unvollständigkeit bleibt
fail-closed. Im finalen Replay wählt D53 denselben Owner und die Engine
wendet exakt `1 Klick + 12 Credits -> Verpflichtung entfernt + 1
Agendapunkt` an. Input-DTO-, Owner- und Realpfadtest sichern den Vertrag.

## Gewinneranalyse – warum Tycho Ice Stack gewann

Die Corp gewann über eine klar erkennbare Zwei-Remote-Konversion und nicht
durch bloßes Aussitzen:

1. Sie installierte und avancierte früh eine Tycho Extension und scorete sie
   D41 für vier Punkte.
2. ACME Savings and Loan tauschte beim Rezzen vorübergehend einen
   Agendapunkt gegen Liquidität. Der neue `convert_agenda`-Step zahlte D53 die
   Verpflichtung ab und stellte den Punkt wieder her. Damit war Economy
   Support der Scorestrategie, kein konkurrierender Endzweck.
3. Danach verstärkte `corp.defend_servers` HQ, R&D und die wiederverwendete
   Score-Remote. Die Corp rezzte nur sechs ICE und lehnte viele
   nicht erforderliche Rezfenster ab; sie bewahrte so Credits für die
   tatsächlich angegriffenen Pfade.
4. Im Endspiel lagen Roving Submarine und drei ICE an Remote 1. Die Corp
   installierte D404 eine zweite Tycho Extension, avancierte zweimal und
   zwang den Runner zum sofortigen Contest.
5. Nach dessen Jack-out avancierte und scorete `corp.score_agenda` D418–D419
   ohne Ownerwechsel. Zwei gescorte Vier-Punkte-Agenden ergaben acht Punkte
   und Corp 10 – Runner 4 Matchpunkte.

## Verliereranalyse – warum Mit Ansage verlor

Die unmittelbare Ursache war `agenda_points`: Der Runner hatte vier Punkte,
als die Corp ihre zweite Tycho Extension für insgesamt acht Punkte scorete.
Die veränderbare Verlustkette liegt auf einer längeren strategischen Ebene:

1. Der Runner begann mit zwei frühen Zentralruns, erzeugte aber vor D136
   keinen Kartenzugriff. Sein Deck ist auf HQ-/R&D-Multiaccess und
   Run-Events ausgerichtet; die Corp zwang ihn stattdessen in eine lange
   Aufbauphase.
2. D136, D174 und D198 griff er HQ an. Acht Zugriffe über das Match hinweg
   erzeugten genau einen Agendatreffer: D219 stahl er eine Tycho Extension
   für vier Punkte. Das ist teilweise Varianz, aber auch Folge der
   konzentrierten, lesbaren Zentralangriffe.
3. Insgesamt startete er nur acht Runs in 24 Runnerzügen, zog dagegen
   25-mal über `runner.rig_and_coverage` und nahm 33-mal einen Basic Credit.
   Diese Investition materialisierte bis D410 zwar Matador, Psychic Friend
   und Boring Bit – also vollständige Sentry-, Code-Gate- und
   Wall-Abdeckung –, konvertierte aber zu spät in wiederholten Druck.
4. Zwischen dem letzten produktiven R&D-Zugriff D239 und dem
   matchentscheidenden Remote-Run D410 liegen 170 Entscheidungen ohne neuen
   Run. Die Corp konnte in diesem Fenster Hand, Credits und Serverstruktur
   stabilisieren.
5. D410 erkannte `runner.contest_remote` die verdeckte, zweifach avancierte
   Karte als `score_threat` und begann den richtigen Contest mit sechs
   Credits und vollständiger Breakerabdeckung. Nach dem Rez von Filter und
   dessen Break sank die Risikoreserve jedoch um einen Credit. Der
   ursprüngliche Vertrag blieb `probe_only`; D414 bevorzugte daher Jack-out
   vor einem unbekannten mittleren ICE, obwohl die Corp anschließend mit
   Advance plus Score das Match beendete.

Das ist kein reines Anti-Deck-Matchup: Der Runner besaß am Ende die passende
Coverage und eine bekannte Restpfadquote von zwei Credits zuzüglich eines
unbekannten ICE. Varianz und das starke ICE-Deck erklären die Kosten, aber
der entscheidende strategische Verdacht ist die fehlende Verbindung zwischen
unmittelbarer Matchpoint-Gefahr und der während des Runs geltenden
Risikotoleranz. Ein kartenspezifischer „Tycho erkennen“-Fix wäre unzulässig.

## Neue Ideen und offene Verdachtsmuster

### Terminaler Score-Contest über öffentlich bekannte Agendaformen

Die bestehende Terminalerkennung behandelt einen fehlenden Punkt sowie eine
sichtbar zweifach avancierte mögliche Zwei-Punkte-Agenda. Hier fehlten der
Corp drei Punkte; öffentlich bekannt waren aber bereits eine gescorte
Vier-Punkte-Agenda desselben Decks, dieselbe zuvor genutzte Remote und eine
zweifach avancierte neue Karte. Mit den drei Corp-Aktionen des Folgezuges war
Advance, Advance, Score möglich.

Neue generische Idee: Aus öffentlich bereits gescorten Agendaformen,
sichtbaren Advancement-Countern, verbleibender Action Capacity und dem
besetzten Score-Server eine side-sichere „kann im nächsten Zug das Match
beenden“-Hülle bilden. Wird ein solcher Contest begonnen, muss sein
Run-Risikovertrag zwischen „sicherer Verlust durch Abbruch“ und
„unsicherer Verlust durch Fortsetzung“ unterscheiden. Vor einem Fix braucht
es mindestens einen zweiten Fall oder einen exakt Engine-gequoteten
Next-Turn-Scorevertrag.

### Ergebniszähler für erfolgreiche Runs

Beide gespeicherten Result-Snapshots melden `successfulRunCount: 0`, obwohl
vier `access_card`-Ereignisse mit `accessIndex: 0` persistiert sind und der
Runner eine Agenda stahl. Die eigentliche Zugfolge, Matchpunkte und
Agendapunkte sind korrekt. Der vorhandene reine Zählertest beschreibt bereits
die erwartete Semantik; die Abweichung konnte in diesem Zyklus nicht auf eine
konkrete Snapshot-, Delta-Persistenz- oder Laufzeitursache eingegrenzt werden.
Sie bleibt deshalb als Reporting-Indiz erhalten und wird nicht durch eine
Zahlkonvertierung oder nachgelagerte Korrektur kaschiert.

## Prozessoptimierung aus diesem Zyklus

- Ein Batch-Aufruf verarbeitet weiterhin höchstens 40 vollständig
  persistierte KI-Schritte. Die beiden finalen 419-Entscheidungs-Matches
  benötigten je elf Aufrufe und rund 39 Sekunden Serverlaufzeit.
- Die vollständige Trace-Klassifikation benötigt nicht 419 einzelne
  Detailabrufe. Drei Maintenance-Bundles mit den Bereichen 1–200, 201–400 und
  401–419 lieferten denselben Denominator einschließlich Detailtrace und
  Auditverfügbarkeit in weniger als sieben Sekunden.
- Der Versuch, den ganzen 419-Action-Match zusätzlich als dauerhaften
  In-memory-Unit-Test abzubilden, war redundant und zu teuer. Der bleibende
  Servertest endet direkt hinter beiden behobenen Planfenstern; das
  vollständige Ende wird durch die zwei Realpfad-Replays belegt.
- Vollständige Replays bleiben nach Verhaltensänderungen unverzichtbar.
  Wiederholte Einzelabrufe, Vollmatch-Unit-Tests und erneute Analyse
  unveränderter frühe Phasen sind dagegen vermeidbar.

## Verifikation

- zwei Planowner-Regressionen in `plan-first-live-runtime.test.ts`: grün;
- Input-DTO-Scorekonversion: 23/23 grün;
- ausgewählte Paarung über beide früheren Abbruchfenster: grün;
- zwei finale Realpfad-Replays mit 419/419 identischen Action-IDs,
  Actiontypen und Planownern;
- keine Fallbacks, Timeouts, Debugabweichungen oder fehlenden
  historischen Auditsektionen.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
