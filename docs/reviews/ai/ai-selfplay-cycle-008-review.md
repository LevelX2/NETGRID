# KI-Selbstspielzyklus 008 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; zwei generische Runner-Planfehler behoben,
fokussiert getestet und in zwei vollständigen deterministisch identischen
Realpfad-Replays verifiziert

## Reproduktionsvertrag

- Auswahlseed: `c8d449f120fc55a5b7566e6044e584a4`
- Spielseed: `selfplay-008-55db67ce8f2128515b476c79acb0aced`
- Runner: **Proteus Runner – Breaker Lab & Virus Pressure**, 45 Karten,
  `standard_standard_proteus_runner_breaker_lab_2026_05_25_1.0.0`,
  `fnv1a:70ae3c9a`
- Corp: **Tycho Ice Stack**, 45 Karten und 12 Agendapunkte,
  `standard_standard_corp_tycho_ice_stack_1.0.0`, `fnv1a:32e3f739`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, normale KI,
  Detailtrace

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad und dieselbe über
die Zyklen 005 bis 009 fortgeschriebene, isolierte Worktree-SQLite-Datenbank.
Die lokale read-only Maintenance-Analyse-API war der einzige Analysezugang;
Standardports und Main-Datenbank blieben unberührt.

## Ergebnis und deterministische Gegenprobe

| Stand                                 | Ergebnis wie im Programm             |   Entscheidungen | Kernaussage                                                                                                           |
| ------------------------------------- | ------------------------------------ | ---------------: | --------------------------------------------------------------------------------------------------------------------- |
| Ausgangslauf `match_ebc151e8a1be1520` | Corp 10 – Runner 0; Agendapunkte 8:0 |              111 | Der Runner verbraucht fast jeden Klick für denselben ungebundenen Coverage-Draw und startet nur einen Run.            |
| Zwischenlauf `match_87856c3dcdca58ea` | Runner 10 – Corp 4; Agendapunkte 8:4 |              265 | Der erste enge Schutz begrenzt nur einen Coveragepfad; vier Coverage-Draws pro Zug bleiben in anderen Pfaden möglich. |
| Zwischenlauf `match_7949f3aff19b8b5a` | kein Endergebnis                     | Abbruch vor D134 | Morphing Tool bietet eine produktive, rungebundene Subtyp-Vorbereitung an, die noch keinen Planowner besitzt.         |
| final A `match_232bb3100f587eaa`      | Runner 10 – Corp 0; Agendapunkte 8:0 |              258 | Referenzlauf; Ende durch Agendapunkte.                                                                                |
| final B `match_49d866da5b4d3582`      | Runner 10 – Corp 0; Agendapunkte 8:0 |              258 | 258 von 258 Action-IDs, Actiontypen und Planowner identisch.                                                          |

Die finalen StateHashes unterscheiden sich wegen der Match-ID im Zustand
erwartungsgemäß (`fnv1a:3915ef0b` und `fnv1a:af444306`). Die vollständige
fachliche Entscheidungsfolge ist identisch.

## Vollständiger Decision-Denominator

Alle 258 Entscheidungen des finalen Referenzlaufs wurden über zwei begrenzte
Maintenance-Bundles genau einmal klassifiziert:

- 142 Runner- und 116 Corp-Entscheidungen;
- 258-mal persistierte historische LegalActions, Engine-Evidence,
  actor-private Analysesnapshots und Checkpoints;
- 258-mal Übereinstimmung zwischen Debugauswahl und angewandter Action;
- keine Fallbacks, Timeouts oder ungeklärten ownerlosen Actions;
- 13 Runs, davon drei erfolgreich, zwei gestohlene Agenden und keine
  gescorte Agenda;
- 29 Draw-Aktionen, 29 Installationen und 26 Basic-Credits wurden nicht nur
  gezählt, sondern anhand ihres jeweiligen Root-/Leaf-Owners und ihrer
  sichtbaren Situation geprüft.

Der einzige Maintenance-Hinweis entstand beim bewusst auf D1–D200 begrenzten
ersten Bundle, das den späteren Terminalzustand naturgemäß noch nicht
enthielt. Er ist kein Match- oder Auditfehler.

## Bestätigtes Finding 1 – Coverage-Ziehen besetzt einen ganzen Zug

Im Ausgangslauf erkennt `runner.rig_and_coverage` eine reale Lücke, behandelt
aber jeden neu entstandenen privaten Handzustand wieder als neue Erlaubnis
für denselben strategischen Basic Draw. Dadurch zieht der Runner in mehreren
Zügen viermal, verwirft die überzähligen Karten und konvertiert weder Rig noch
Druck. Die LegalActions und Draws sind einzeln korrekt; fehlerhaft ist der
planübergreifend fehlende endliche Zugvertrag.

Der erste Fix begrenzte nur den ursprünglichen strategischen Gap-Pfad. Der
Zwischenlauf bewies, dass andere Coverage-Erzeuger dieselbe Aktion weiterhin
viermal pro Zug materialisierten. Der endgültige Fix führt deshalb genau
einen gemeinsamen, aus der öffentlichen Aktionshistorie rekonstruierten
Coverage-Draw-Takt je Runnerzug ein. Exakt terminale Remote-Coverage darf den
Takt überstimmen; Suche, Installation, Funding und andere Planowner bleiben
unverändert. Im finalen Replay kommt höchstens ein Draw desselben
Coverage-Owners pro Zug vor.

## Bestätigtes Finding 2 – rungebundene Subtyp-Vorbereitung bleibt ownerlos

Der zweite Zwischenlauf erreicht D134 mit installiertem Morphing Tool und
einer aktuellen Runroute, die vor dem Run exakt einen sichtbaren Breaker-
Subtyp wählen muss. Die Runanalyse kann Credits, Klick und benötigten Subtyp
bereits korrekt quoten. Sie übergab diese Vorbereitung jedoch nur als
anonyme Kosten; die aktuelle `trigger_ability`-LegalAction ließ sich weder an
den Run-Parent noch an `runner.rig_and_coverage` binden und stoppte deshalb
fail-closed.

Der generische Fix erhält Quellinstanz, Quelldefinition und ausgewählten
Subtyp in der bestehenden Runroute. Der Run-Parent veröffentlicht daraus
einen exakten Coverage-Bedarf; ausschließlich `runner.rig_and_coverage`
materialisiert die aktuelle LegalAction als `prepare_coverage`-Step. Ohne
konkreten gebundenen Runbedarf werden alle Subtypwechsel ausdrücklich als
unproduktiv dispositioniert. Der Choice-/Action-Resolver trifft damit keine
eigene Server-, Karten- oder Strategieentscheidung.

## Gewinneranalyse – warum Breaker Lab & Virus Pressure gewann

Der Runner gewann nicht durch einen einzelnen Glückstreffer, sondern durch
frühe Zentralpression und spätere gezielte Remote-Kontrolle:

1. Schon in den ersten Zügen startete er mehrere R&D-Runs und installierte
   Bulldozer. Der neue Draw-Takt ließ zwischen Coverageentwicklung und Runs
   echte Zugkapazität frei.
2. Bei D70 stahl er Tycho Extension aus R&D für vier Agendapunkte. Weitere
   Zentralruns zwangen die Corp, Schutz und Credits ständig gegeneinander
   abzuwägen.
3. Danach griff `runner.contest_remote` wiederholt Remote 1 an und trashte
   dort Department of Truth Enhancement sowie zwei Roving Submarine. Der
   Runner entzog der Corp damit nicht nur Karten, sondern genau die
   Infrastruktur der geplanten Score-Remote.
4. Morphing Tool, Brokers und Skeleton Passkeys vervollständigten die
   sichtbare Coverage, ohne dass der Runner wieder in einen Draw-only-Zug
   zurückfiel.
5. Der letzte HQ-Run begann D241. Die Corp rezzte Keeper und Filter; nach der
   exakten Coverage-Konversion erreichte der Runner D257 den Zugriff und
   stahl D258 eine zweite Tycho Extension. Acht Agendapunkte ergaben Runner
   10 – Corp 0 Matchpunkte.

## Verliereranalyse – warum Tycho Ice Stack verlor

Die unmittelbare Verlustursache war `agenda_points`: Die Corp erzielte selbst
keinen Punkt, während zwei Vier-Punkte-Agenden aus R&D und HQ gestohlen
wurden. Dahinter liegt eine gemischte Kette aus gut erklärbarem Matchupdruck
und einem wiederkehrenden strategischen Stau:

1. Die Corp baute fünf Remotes und viele ICE auf. `corp.defend_servers`
   traf 46 Entscheidungen, darunter 19 Rez-Ablehnungen und fünf tatsächliche
   Rezzes. Das war nicht pauschal passiv: Viele Ablehnungen bewahrten Credits
   außerhalb des angegriffenen Pfades.
2. Der Runner machte diese breite Anlage jedoch teuer. Er griff R&D früh und
   Remote 1 wiederholt an; drei dortige Assets wurden getrasht. Die Corp
   musste daher Schutz ersetzen, statt denselben Server in Scoretempo zu
   überführen.
3. Gleichzeitig lagen zuletzt zwei Tycho Extensions in HQ. Der gebundene
   `corp.score_agenda`-Root war von D5 bis D237 insgesamt 28-mal
   Auswahlursprung, erzeugte aber ausschließlich zwölf Draws, zehn Credits
   und sechs ICE-Installationen – keine Agenda-Installation, kein Advance und
   keinen Score.
4. Am Ende existierten Score-Support-Kinder für beide Agenden an mehreren
   Remotes. Remote 1 wurde bei letztem Klick korrekt zurückgestellt; andere
   Remotes meldeten Schutz-Funding-Gaps von fünf bis sechs Credits. Der Plan
   sparte weiter, während die gebundene Agenda in HQ blieb und dort D258
   gestohlen wurde.
5. Varianz spielte mit: Zwei R&D-/HQ-Treffer auf genau die wertvollen
   Vier-Punkte-Agenden beendeten das Match schnell. Ein reines Anti-Deck-
   Ergebnis ist es trotzdem nicht, weil die Corp über 17 eigene Züge keinen
   einzigen Scoreversuch konvertierte und der Runner die vorgesehene
   Remote-Infrastruktur wiederholt sichtbar zerstörte.

## Neue Ideen und verdichtete Verdachtsmuster

### Gestufter Score-Stau-Vertrag statt statischer Vollschutzschwelle

Dieser Lauf verdichtet SP-017 aus Zyklus 005. Dort wartete eine
agenda-gesättigte Corp bis sehr spät auf den ersten Scoreversuch; hier
erzeugte derselbe Score-Owner 28 gebundene Supportentscheidungen, ohne jemals
die Agenda zu installieren. Zyklus 006 bleibt die wichtige Gegenprobe: Mit
einer früh aufgebauten Remote konvertierte derselbe Owner vier Agenden und
gewann.

Die neue generische Idee ist deshalb keine niedrigere Schutzschwelle. Der
Scoreplan sollte die kumulierten Kosten des Wartens – Agendaanzahl in HQ,
öffentlichen Zentraldruck, bereits verbrauchte Supportzüge und wachsende
Runner-Coverage – gegen eine konkrete gestufte Install-/Schutz-/Advance-Linie
stellen. Für einen Fix fehlt noch die Engine- oder Planquote, die einen
bestimmten früheren Installationszeitpunkt im damaligen Sichtzustand
risikobereinigt als besser ausweist. Der Fall bleibt hoch priorisierter
Verdacht.

### Zwei Draw-Owner im selben Zug

In einzelnen finalen Runnerzügen folgte auf den einen zulässigen
Coverage-Draw noch ein Draw von `runner.develop_board_and_hand`. Das ist kein
Wiederauftreten des vierfachen Coverage-Loops und kann als Handentwicklung
sinnvoll sein. Es zeigt aber eine mögliche nächste Metaebene: Falls weitere
Matches wieder reine Draw-Züge über verschiedene Owner erzeugen, braucht die
Zugplanung einen gemeinsamen Draw-Budgetvertrag statt weiterer lokaler
Cadence-Schranken. Ein Einzelfall trägt noch keinen Fix.

### Ergebniszählung erfolgreiche Runs

SP-024 reproduziert sich hier nicht: Der gespeicherte Result-Snapshot meldet
13 gestartete und drei erfolgreiche Runs, passend zu den Terminaldaten. Das
widerlegt die früheren Nullwerte nicht, grenzt den Verdacht aber auf einen
situations- oder laufzeitspezifischen Pfad ein; eine allgemeine fehlende
Zählung ist ausgeschlossen.

## Prozessoptimierung aus diesem Zyklus

- Eine isolierte SQLite-Datenbank wird über den gesamten Mehrzykluslauf
  fortgeschrieben. Dadurch bleiben Matches, Seeds und Indizien gemeinsam
  analysierbar; nur die Main-Datenbank bleibt aus Isolationsgründen tabu.
- Der normale 40-Schritt-Batch bleibt für die Spielausführung erhalten. Für
  die Auswertung genügen danach Maintenance-Bundles von höchstens 200
  Entscheidungen statt Einzelabrufen.
- Unveränderte frühe Phasen werden im Replay über die vollständige
  Action-/Owner-Sequenz verglichen. Tiefanalysen konzentrieren sich auf die
  erste Divergenz, das behobene Fenster und die neue Verlustkette.
- Der enge erste Draw-Fix war nützliche Evidence, aber kein Abschluss. Die
  sofortige vollständige Gegenprobe verhinderte, dass ein lokaler Pfadfix als
  generische Lösung durchging.

## Verifikation

- sechs fokussierte Runanalyse-, Cadence-, Owner- und Negativtests: grün;
- zwei finale Realpfad-Replays mit 258/258 identischen Action-IDs,
  Actiontypen und Planownern;
- keine Fallbacks, Timeouts, Debugabweichungen oder fehlenden Auditsektionen;
- KI-Paket-Typecheck enthält nur sechs bereits auf `main` vorhandene
  Baselinefehler: vier fehlende Golden-JSONs sowie zwei bestehende
  Optionalitätsfehler außerhalb dieses Changesets.

Verdichtete Fälle und Reproduktionsdaten stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
