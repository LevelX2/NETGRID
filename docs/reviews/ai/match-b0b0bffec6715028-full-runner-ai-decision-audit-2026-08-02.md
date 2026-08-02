# Match B0B0BFFE: Vollständiger Entscheidungs-Audit der Runner-KI

Stand: 2026-08-02

Match: `match_b0b0bffec6715028`

Modus: `human_corp_vs_runner_ai`

Ergebnis: Corp-Sieg durch Flatline, StateVersion 118

Status: Analyse abgeschlossen; Paket B (City-Surveillance-Draw-Tax) umgesetzt,
Pakete A und C bleiben eigenständige Follow-ups

## Analyseabdeckung

Die Analyse umfasst alle 65 gespeicherten Entscheidungen der Runner-KI. Jede
Entscheidung wurde gegen die damaligen `LegalActions`, die private
Runner-`PlayerView`, den Plan-first-Debugtrace und die Folgeereignisse geprüft.
Die verdeckte Hand des menschlichen Corp-Spielers wurde dafür nicht verwendet.

- Erstellt: `2026-08-02T20:33:52.628Z`
- Beendet: `2026-08-02T20:43:54.449Z`
- Profil: `runner-ai-v0.9-normal`
- Seed: `match-msc9aop3-1s7gi5`
- StateHash: `fnv1a:98300cbc`
- Events/Snapshots: 119/119
- Erwartete Entscheidungen: 65
- Gefundene und eindeutig zugeordnete Traces: 65
- Fehlende, verwaiste, doppelte oder typfalsch zugeordnete Traces: 0
- AI-Trace-Modus: detailliert
- Ergebnis: vollständige und konsistente Match-Evidence

Die laufende lokale SQLite wurde mit ausdrücklicher Nutzerfreigabe nur
schreibgeschützt und sequenziell gelesen. Die anschließenden Reproduktionen
liefen aus lokalen, nicht versionierten Checkpoints unter `data/local/`.

## Deck und Spielanlage

Die Runner-KI spielte `Lucidrine Shell Traders` in Version 1.0.0 mit 45 Karten
und 20 eindeutigen Kartendefinitionen. Der Deck-Hint-/Consumer-Audit deckte alle
20 Definitionen beziehungsweise alle 45 Karten ab und meldete formal weder
Blocker noch Warnungen.

Die drei abgeleiteten Primärstrategien waren:

1. `runner.run_event_tempo`
2. `runner.rnd_pressure`
3. `runner.interface_closeout`

Sekundär wurden `runner.survival_defense` und `runner.rig_first` erkannt. Diese
Einordnung passt grundsätzlich zum Deck. Der Audit hat jedoch eine semantische
Lücke: `Lucidrine Booster Drug` wird trotz korrekt strukturierter
Run-Credit-Hints vom Consumer zusätzlich als allgemeines `bank_tool` erkannt.
Gerade diese Fehlklassifikation führte zur ersten bestätigten Fehlentscheidung.

## Gesamturteil

Der größte Teil des Spiels war plausibel. Die KI baute Breaker-Abdeckung auf,
prüfte mehrere Server, bezahlte bekannte ICE-Kosten korrekt und verwendete
`Fall Guy` einmal sinnvoll gegen einen Tag. Das Match kippte durch drei
reproduzierbare Entscheidungen:

1. `Lucidrine Booster Drug` wurde als generisches Economy-/Entwicklungswerkzeug
   auf ein öffentlich wertloses Archives-Ziel gespielt. Alle neun temporären
   Run-Credits verfielen; anschließend erlitt die Runnerin einen nicht
   verhinderbaren Core Damage.
2. Bei sichtbarer, gerezzter `City Surveillance` spielte die KI mit zwei
   Credits und dem letzten Klick `Bodyweight Synthetic Blood` für fünf Karten.
   Nach den Ziehsteuern blieb sie mit vier Tags zurück.
3. Im erzwungenen Abwurf danach warf die KI bei bestätigtem Flatline-Risiko
   `Arasaka Owns You` ab. Die Karte hätte die unmittelbar folgende tödliche
   Schadenslinie ersetzen können. Zwei `Scorched Earth` beendeten das Spiel.

Die Entscheidungen 2 und 3 bilden eine Kausalkette, sind aber eigenständige
Fehler: Der Massendraw erzeugte die Gefahr; der Abwurf entfernte anschließend
das bereits vorhandene Notfallwerkzeug.

## Bestätigte Befunde

### F1: Run-only-Credits werden als generische Bank missverstanden

Entscheidung D9 bei StateVersion 20:

- Runner: 0 Credits, 4 Handkarten, 0 Tags;
- Archives: kein bekanntes Agenda-Payoff, kein ICE und keine sinnvolle
  Ausgabemöglichkeit für die temporären Credits;
- gewählte Aktion: `Lucidrine Booster Drug` auf Archives;
- Plan-Owner: `runner.develop_board_and_hand`;
- Route: Entwicklung für `bank_tool:acute`.

Das Ereignis erzeugte neun temporäre Run-Credits. Alle neun wurden am Runende
zurückgegeben. Anschließend verursachte die Karte einen nicht verhinderbaren
Core Damage. Die Runnerhand sank effektiv von vier auf zwei Karten und das
effektive Handkartenmaximum dauerhaft um eins.

Der aktuelle Code reproduziert die historische Aktion exakt. Entfernt man in
dem identischen Checkpoint nur die Lucidrine-Aktionen, wählt derselbe aktuelle
Planer `runner.draw_card` unter `runner.rig_and_coverage`. Es existierte also
eine produktive, nicht schädliche Fortsetzung.

Die Karten-Hints sind korrekt: Sie beschreiben einen Run, einen nur während des
Runs nutzbaren Credit-Pool und den anschließenden Schaden. Die semantische
Information geht im Consumer verloren. Textbasierte Bank-Signale lassen die
Karte als allgemeines Economy-Bankwerkzeug erscheinen, obwohl sie weder eine
Bank aufbaut noch später auszahlt.

Fachlicher Owner der Korrektur ist die konkrete Run-Route in
`runner.pressure_central` beziehungsweise `runner.contest_remote`, nicht ein
Choice-Resolver und nicht die allgemeine Handentwicklung.

### F2: Coverage-Draw ignoriert sichtbare Ziehsteuer und Tag-Kaskade

Entscheidung D57 bei StateVersion 106:

- Runner: 2 Credits, 1 Klick, 0 Tags, 7 Karten bei effektivem Handkartenmaximum
  7;
- `City Surveillance` lag sichtbar und gerezzed;
- Corp: 19 Credits und bereits gescortes `Corporate War`;
- gewählte Aktion: `Bodyweight Synthetic Blood`, Kosten 2 Credits, Ziehen 5;
- Plan-Owner: `runner.rig_and_coverage`;
- Step: `draw_for_answer_breaker_sentry`.

Der Action-Semantic-Adapter erfasst fünf gezogene Karten, eine verbrauchte
Karte, Netto-Handzuwachs vier sowie Klick- und Creditkosten korrekt. Er
projiziert aber nicht die fünf sichtbaren, engine-seitig ausgelösten
Ziehsteuern. Nach dem Bezahlen des Events blieben null Credits. `Fall Guy`
verhinderte den ersten Tag und wurde dafür abgeworfen; die vier weiteren
Ziehfenster erzeugten vier Tags.

Der aktuelle Code reproduziert die historische Aktion exakt. Entfernt man nur
die Bodyweight-Aktion aus demselben Checkpoint, wählt der Planer
`runner.gain_credit` unter `runner.economy`. Die schädliche Route war daher
nicht alternativlos.

Fachlicher Owner bleibt `runner.rig_and_coverage`: Vor der Materialisierung
einer Draw-for-answer-Route braucht der Plan eine side-sichere,
engine-autoritative Projektion sichtbarer Ziehkosten und ihrer Folgen. Die
Projektion muss vorhandene Credits, Prävention und die danach verbleibende
Tag-/Schadenslage berücksichtigen. Ein globaler Override oder ein
City-Surveillance-Sonderfall wäre architektonisch falsch.

### F3: Der Abwurf verliert den einzigen sichtbaren Flatline-Schutz

Entscheidung D65 bei StateVersion 114:

- Runner: 4 Tags, 11 Handkarten, effektives Handkartenmaximum 7;
- der vorherige Plantrace hatte `runner_flatline_risk:confirmed` erkannt;
- `runner.defense_and_recovery` war mangels klarer Tag-Entfernungsroute
  blockiert;
- der erzwungene Abwurf entfernte `R&D Interface`, `Arasaka Owns You`,
  `Tycho Mem Chip` und `The Shell Traders`.

`Arasaka Owns You` ist in den aktiven Hints korrekt als
`flatline_prevention`, `prevention_replacement`, `survival_payoff` und
`emergency_tool` beschrieben. Der generische Runner-Abwurf bewertet jedoch
primär Breaker, Economy, Aufbau, Draw und Run-Druck. Er erhält weder den
bestätigten Defense-Plan noch dessen Keep-Prioritäten. Dadurch wirft er bei
vier Tags ausgerechnet den einzigen unmittelbar relevanten Flatline-Schutz ab.

Die Corp spielte anschließend zwei `Scorched Earth`: Die erste reduzierte die
Hand von sieben auf drei Karten, die zweite verursachte die Flatline. Der
aktuelle Code reproduziert die vier historischen Abwurfoptionen einschließlich
`Arasaka Owns You` exakt.

Fachlicher Owner ist `runner.defense_and_recovery` beziehungsweise ein von
diesem Plan gebundener Cleanup-/Discard-Step. Der Choice-Resolver darf nur die
Payload der bereits gewählten `runner.resolve_choice`-Action vervollständigen;
er darf keine zweite strategische Autorität für Überleben und Handportfolio
werden. `actionId`, Executor und Choice-Fenster müssen unverändert bleiben.

## Nicht als Remediation freigegebene Auffälligkeiten

### D15 bis D18: Shell-Traders-Umweg ohne nachgewiesenen Nettoverlust

Die KI bereitete `MRAM Chip` über `The Shell Traders` vor und bezahlte danach
beide Counter unmittelbar. Das wirkt umständlicher als eine Direktinstallation,
führte in dieser Sequenz aber zum gleichen Credit- und Boardzustand. Ohne
strikt besseres Endergebnis ist daraus kein belastbarer Befund abzuleiten.

### D32: Historische Tycho-Counter-Entfernung driftet auf aktuellem Code

Historisch entfernte D32 einen Counter von `Tycho Shell`, nachdem D31 exakt die
Decoder-Installation für den Remote finanziert hatte. Dadurch war die
Direktinstallation nicht mehr bezahlbar. Der strikt rekonstruierte Checkpoint
mit 31 Warmup-Entscheidungen, unverändertem Eventpräfix und null Runtime-Drift
wählt auf aktuellem Code stattdessen eine Shell-Traders-Vorbereitung für
`Cyfermaster`. Der historische Fehler ist damit aus diesem Match nicht mehr
reproduzierbar und wird nicht in das Maßnahmenpaket aufgenommen.

## Vollständige Decision Coverage

|   D | StateVersion | Urteil                            | Kurzbegründung                                                                         |
| --: | -----------: | --------------------------------- | -------------------------------------------------------------------------------------- |
|   1 |            0 | plausibel                         | Starthand behalten; tragfähiger Economy-/Rig-Start.                                    |
|   2 |            8 | plausibel                         | Dringenden ungeschützten Remote prüfen.                                                |
|   3 |            9 | plausibel                         | Run-Zugriff fortsetzen.                                                                |
|   4 |           10 | plausibel                         | `BBS Whispering Campaign` mit klarem Economy-Payoff trashen.                           |
|   5 |           11 | plausibel                         | `The Shell Traders` als Deckengine installieren.                                       |
|   6 |           12 | plausibel                         | `Pile Driver` für vorhandene Barrier-Abdeckung installieren.                           |
|   7 |           13 | plausibel                         | Nach fehlender Code-Gate-Abdeckung ziehen.                                             |
|   8 |           14 | plausibel                         | Keine Klicks mehr; Zugende.                                                            |
|   9 |           20 | **Finding F1**                    | Lucidrine auf wertlose Archives-Route; 9 Credits verfallen, Core Damage folgt.         |
|  10 |           21 | plausibel                         | Nach dem Fehlspiel Credits zurückgewinnen.                                             |
|  11 |           22 | plausibel                         | Handpuffer wieder aufbauen.                                                            |
|  12 |           23 | plausibel                         | Nach fehlender Sentry-Abdeckung ziehen.                                                |
|  13 |           24 | plausibel                         | Keine produktive Klickfortsetzung; Zugende.                                            |
|  14 |           30 | plausibel                         | Code-Gate-Coverage finanzieren.                                                        |
|  15 |           31 | plausibel, aber beobachten        | Shell-Vorbereitung für MRAM; umständlich, aber kein belegter Nettoverlust.             |
|  16 |           32 | plausibel                         | Gebundene Finanzierung fortsetzen.                                                     |
|  17 |           33 | plausibel, aber beobachten        | MRAM-Counter über Shell Traders fortführen.                                            |
|  18 |           34 | plausibel, aber beobachten        | MRAM-Installation abschließen; Endzustand entspricht Direktlinie.                      |
|  19 |           35 | plausibel                         | Weiter nach Sentry-Abdeckung suchen.                                                   |
|  20 |           36 | plausibel                         | Zugende.                                                                               |
|  21 |           42 | plausibel                         | Code-Gate-Route weiter finanzieren.                                                    |
|  22 |           43 | plausibel                         | Coverage-Draw.                                                                         |
|  23 |           44 | plausibel                         | Finanzierung fortsetzen.                                                               |
|  24 |           45 | plausibel                         | `Tycho Shell` über vorhandene Shell-Engine vorbereiten.                                |
|  25 |           46 | plausibel                         | Zugende.                                                                               |
|  26 |           53 | plausibel                         | R&D-Facecheck mit tragbarer öffentlicher Risikolage.                                   |
|  27 |           55 | plausibel                         | Nach Corp-Rez-Verzicht Run fortsetzen.                                                 |
|  28 |           56 | plausibel                         | R&D-Zugriff ausführen.                                                                 |
|  29 |           57 | plausibel                         | Neuen Remote unter Dringlichkeitsannahme prüfen.                                       |
|  30 |           59 | plausibel/erzwungen               | Gerezzter `Filter` beendet den nicht brechbaren Run.                                   |
|  31 |           60 | plausibel                         | Exakte Decoder-Liquidität für den Remote aufbauen.                                     |
|  32 |           61 | aktuell nicht reproduzierbar      | Historisch Tycho-Counter entfernt; aktueller Code wählt Cyfermaster-Vorbereitung.      |
|  33 |           62 | plausibel im historischen Zustand | HQ-Druck nach der damaligen D32-Fortsetzung.                                           |
|  34 |           64 | plausibel                         | Run fortsetzen.                                                                        |
|  35 |           65 | plausibel                         | HQ-Zugriff ausführen.                                                                  |
|  36 |           66 | plausibel                         | Zugende.                                                                               |
|  37 |           74 | plausibel                         | R&D-Druck bei vorhandener Barrier-Abdeckung.                                           |
|  38 |           76 | plausibel                         | `Wall of Static` für exakt drei Credits brechen.                                       |
|  39 |           77 | plausibel/erzwungen               | ICE-Pass nach erfolgreichem Break.                                                     |
|  40 |           78 | plausibel                         | Run fortsetzen.                                                                        |
|  41 |           79 | plausibel                         | R&D-Zugriff ausführen.                                                                 |
|  42 |           80 | plausibel                         | Economy-Fortsetzung.                                                                   |
|  43 |           81 | plausibel                         | Coverage-Draw vor aktivem Surveillance-Fenster.                                        |
|  44 |           82 | plausibel                         | Shell-Counter sinnvoll weiterentwickeln.                                               |
|  45 |           83 | plausibel                         | Weiterer Coverage-Draw bei tragbarer Handlage.                                         |
|  46 |           84 | plausibel                         | Zugende.                                                                               |
|  47 |           91 | plausibel                         | Credits für Defense-/Draw-Folge aufbauen.                                              |
|  48 |           92 | plausibel                         | `Fall Guy` als sichtbare Prävention installieren.                                      |
|  49 |           93 | plausibel                         | Credit aufbauen.                                                                       |
|  50 |           94 | plausibel                         | Einzelner Coverage-Draw bei bezahlbarer Ziehsteuer.                                    |
|  51 |           95 | plausibel                         | `City Surveillance` mit einem Credit bezahlen.                                         |
|  52 |           96 | plausibel                         | Zugende.                                                                               |
|  53 |          102 | plausibel                         | Credit vor Einzel-Draw aufbauen.                                                       |
|  54 |          103 | plausibel                         | Einzelner Basis-Draw bei finanzierter Steuer.                                          |
|  55 |          104 | plausibel                         | Surveillance-Steuer bezahlen.                                                          |
|  56 |          105 | plausibel                         | Credit aufbauen; null Tags bleiben erhalten.                                           |
|  57 |          106 | **Finding F2**                    | Bodyweight zieht fünfmal durch sichtbare Steuer und erzeugt die Tag-Kaskade.           |
|  58 |          107 | Folgefenster von F2               | Erste Ziehsteuer kann bei null Credits nicht bezahlt werden.                           |
|  59 |          108 | plausibel/erzwungen               | `Fall Guy` verhindert einen Tag und wird dafür getrasht.                               |
|  60 |          109 | Folgefenster von F2               | Zweite unbezahlbare Ziehsteuer erzeugt einen Tag.                                      |
|  61 |          110 | Folgefenster von F2               | Dritte unbezahlbare Ziehsteuer erzeugt einen Tag.                                      |
|  62 |          111 | Folgefenster von F2               | Vierte unbezahlbare Ziehsteuer erzeugt einen Tag.                                      |
|  63 |          112 | Folgefenster von F2               | Fünfte unbezahlbare Ziehsteuer erzeugt den vierten Tag.                                |
|  64 |          113 | erzwungen                         | Nur `end_turn` legal; Flatline-Risiko erkannt, aber keine Tag-Clear-Route vorhanden.   |
|  65 |          114 | **Finding F3**                    | Erzwungener Abwurf entfernt `Arasaka Owns You` trotz vier Tags und bestätigtem Risiko. |

Die StateVersions folgen den gespeicherten Entscheidungsfenstern. Mehrere
Choice-/Engine-Fenster teilen sich naturgemäß denselben oder unmittelbar
anschließende Zustände; die D-Nummer ist die eindeutige Audit-Reihenfolge.

## Vorgeschlagenes Maßnahmenpaket nach Freigabe

### Paket A: Run-only-Economy korrekt routen

- einen strikten roten Checkpoint für D9 versionieren;
- `Lucidrine Booster Drug` aus generischen Economy-/Bank- und
  Handentwicklungsrouten entfernen;
- Run-only-Credit-Pools nur durch eine konkrete, zielgebundene Run-Route mit
  realisierbarer Ausgabemöglichkeit und vollständiger Nachteilbewertung
  materialisieren lassen;
- den Deck-Hint-/Consumer-Audit um die Invariante ergänzen, dass ein reiner
  `during_run`-Pool ohne Build-/Cashout-Semantik kein allgemeines Banktool ist;
- Gegenprobe: eine konkret profitable, finanzierbare Lucidrine-Runlinie muss
  weiterhin gewählt werden können.

### Paket B: Sichtbare Folgeeffekte von Draw-Aktionen projizieren

- einen strikten roten Checkpoint für D57 versionieren;
- in `runner.rig_and_coverage` vor der Draw-Materialisierung eine strukturierte,
  side-sichere Engine-Projektion sichtbarer Ziehkosten und Tag-/Schadensfolgen
  konsumieren;
- bestehende Credits und Prävention in die Projektion einbeziehen;
- sicherstellen, dass der Parent/Step `runner.rig_and_coverage` bleibt und kein
  globaler Override entsteht;
- Gegenproben: Bodyweight ohne Ziehsteuer, mit vollständig bezahlbarer Steuer
  und in nachweislich ungefährlicher Lage muss legal nutzbar bleiben.

### Paket C: Plan-owned Emergency-Keep beim Abwurf

- einen strikten Choice-Checkpoint für D65 versionieren;
- `runner.defense_and_recovery` beziehungsweise einen gebundenen Cleanup-Step
  die Keep-Prioritäten für den Abwurf festlegen lassen;
- der Resolver vervollständigt ausschließlich die Payload der exakt gebundenen
  `runner.resolve_choice`-Action; `actionId` und Executor bleiben unverändert;
- bei bestätigtem Flatline-Risiko sichtbare Prävention vor redundanten
  Entwicklungs-, Draw- oder Setupkarten behalten;
- Gegenprobe: Ohne Tag-/Schadensgefahr darf die situative und teure
  Präventionskarte weiterhin abgeworfen werden.

### Gemeinsame Gates

- fokussierte rote und grüne Decision-Checkpoint-Tests;
- Ownership-Assertions für Plan, Step, Route, `PlanExecutionOrigin`, Action-ID
  und Executor;
- Deck-Hint-/Consumer-Audit für alle 20 eindeutigen Karten;
- vollständiger Paket-Test und danach `corepack pnpm test:ai:shards`;
- ein reproduzierbarer Selfplay-/Szenariolauf, der produktive Alternativen und
  die positiven Gegenproben belegt.

Paket B wurde im separaten Prozess
`docs/architecture/ai/city-surveillance-chronicle-ai-remediation-process-2026-08-02.md`
freigegeben, umgesetzt und durch den historischen Checkpoint D57 abgesichert.
Pakete A und C sind nicht Teil dieses City-Surveillance-Auftrags und bleiben
bis zu einer eigenen Freigabe unverändert offen.
