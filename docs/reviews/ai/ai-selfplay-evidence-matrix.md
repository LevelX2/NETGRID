# KI-Selbstspiel-Indizienmatrix

Stand: 2026-08-20
Status: laufendes, verdichtendes Arbeitsregister

## Zweck und Pflegevertrag

Dieses Register sammelt reproduzierbare Hinweise aus persistierten
KI-gegen-KI-Partien. Ein einzelner Verdacht löst noch keinen Fix aus. Erst
belastbare LegalAction-, Plan-, Zustands- und Vergleichsevidence stuft einen
Fall als bestätigt ein. Wiederkehrende Fälle werden über die gemeinsame
Cluster-ID verdichtet, auch wenn ihre konkrete Ursache später verschieden ist.

Die Matrix ist kein Archiv abgeschlossener Partien, sondern ein aktiver
Analyseinput. Vor jeder neuen Paarung wird sie vollständig gelesen. Nach jeder
neuen oder geänderten Beobachtung werden alle Fälle des betroffenen Clusters
gemeinsam neu bewertet. Wiederholung über Seeds, Decks und Spielsituationen
kann einen zuvor unzureichenden Einzelverdacht zu einem generisch behebbaren
Finding verdichten; widersprechende Evidence kann einen Cluster abwerten oder
in getrennte Ursachen aufteilen.

Jeder Eintrag hält mindestens Match-ID, Seed, Deck-Snapshot und Deck-Hash,
betroffene Seite und Entscheidungen, Symptom, vermuteten Owner, Evidenzgrad
und gegebenenfalls den identischen Replaylauf fest. Rohtraces, Datenbanken,
Kartenzonen mit verdeckten Informationen und Sessiondaten werden nicht
versioniert. Die lokale Maintenance-Analyse-API bleibt der einzige
Analysezugang.

Evidenzgrade:

- `Verdacht`: auffälliges Verhalten, aber kein belegter besserer legaler Pfad;
- `Bestätigt`: Ursache und besserer generischer Pfad sind belegt;
- `Behoben/verifiziert`: fokussierter Test und identischer Replaylauf belegen
  die Korrektur;
- `Widerlegt`: Zusatzdaten erklären das Verhalten ohne KI-Fehler.

Verbindliche Gates je Paarung:

1. Reproduktionsvertrag und vollständige persistierte Debugdaten sichern.
2. Jede Entscheidung beider Seiten genau einmal klassifizieren.
3. Gewinnerverhalten und Verlustursachen getrennt analysieren; beim Verlierer
   Terminalursache, quantitative Kette, Matchup/Deck, Varianz und veränderbare
   Verhaltensmuster unterscheiden.
4. Neue Evidence mit allen bestehenden Clustern korrelieren und betroffene
   ältere Fälle neu bewerten oder reproduzieren.
5. Klare generische Fehler mit Ownership-Test beheben und denselben Seed als
   frischen Matchlauf in der fortgeschriebenen isolierten Worktree-Datenbank
   erneut vollständig analysieren.
6. Erst schließen, wenn der letzte Lauf und die verdichtete Matrix keinen
   weiteren klaren Fix tragen.
7. Lokal nach `main` integrieren, danach den erneut aktuellen `main`-Stand in
   den dauerhaft weiterverwendeten Arbeitsbranch zurückmergen.

## Clustermatrix

| Cluster                                   | Fähigkeit                                                                                                                                                        | Fälle | Verdacht | Bestätigt | Behoben/verifiziert | Nächste Verdichtung                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | -------: | --------: | ------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corp-score-plan-conversion`              | Vorbereiteten Score-Plan in Install-, Advance- und Score-Schritte überführen, ohne die exakte Agenda-Bindung zu verlieren                                        |    14 |        3 |         0 |                  11 | Kumulierte Kosten des Wartens gegen einen konkreten gestuften Install-/Schutz-/Advance-Pfad quoten; reife Remotes dürfen nur mit aktueller Engine-Zertifizierung weitergenutzt werden |
| `corp-deck-exhaustion-horizon`            | Freiwilligen Draw gegen Pflichtziehungen, R&D-Zugriffe und verbleibende Siegzeit bewerten                                                                        |     4 |        2 |         0 |                   2 | Letzte Verteidigungs- und Scorefenster gemeinsam bewerten; ein belegter gewinnfähiger Alternativpfad fehlt für den neuen Ein-Karten-Fall                                              |
| `corp-central-defense-allocation`         | Öffentlichen Zentraldruck, vorhandene Breakerabdeckung und den tatsächlichen Grenznutzen von ICE und defensiven Server-Upgrades gemeinsam bewerten               |     5 |        4 |         0 |                   1 | Vergleichszustände mit exakt gequoteten Upgrade-Effekten, alternativen ICE-Platzierungen, Rezliquidität sowie Score-/Economy-Pfaden sammeln                                           |
| `engine-visible-break-resource-exchange`  | Sichtbare direkte Breakkosten samt optionalen Folgen nur bei vollständig beweisbarer Auswirkung exakt quoten                                                   |     1 |        0 |         0 |                   1 | Weitere optionale Folgewirkungen nur bei strukturiertem Quellmodus und exakt beweisbarem Nullfall zertifizieren; positive Ressourcen bleiben fail-closed                              |
| `corp-score-exposure-risk`                | Agenda nur in eine gegen öffentliche Rig-Abdeckung ausreichend finanzierbare Score-Remote überführen                                                             |     1 |        1 |         0 |                   0 | Vergleichbare gestufte Score-Linien mit Rez-Budget, Runner-Credits und Breakerabdeckung sammeln                                                                                       |
| `runner-low-payoff-pressure`              | Runs nach unmittelbarem und zukünftigem Informations-/Tempoertrag auswählen                                                                                      |     2 |        1 |         0 |                   1 | Archives-Runs mit LegalActions, öffentlichem Informationsstand und Folgeplan vergleichen; endliche R&D-Probes bleiben zweckgebunden                                                   |
| `runner-coverage-owner-materialization`   | Alle vom Rig-Plan beanspruchten legalen Coverage-Antworten auch als ausführbare Route materialisieren                                                            |     1 |        0 |         0 |                   1 | Bei neuen Coverage-Fällen Owner, Rollenpassung, Kosten und tatsächlich veröffentlichte Action-IDs vergleichen                                                                         |
| `runner-urgent-remote-support-conversion` | Einen dringenden Remote-Contest über Funding, Breaker-Installation und sichere Rückkehr zum Remote-Root im selben Zug vollständig konvertieren                   |     1 |        0 |         0 |                   1 | Weitere Karten- und Deckkombinationen prüfen; Projektion darf weder zukünftige Action-IDs noch unbekannte Kosten oder Gefahren annehmen                                               |
| `plan-support-readiness-consistency`      | Aktuellen ausführbaren Route-Head und noch offenen gebundenen Supportbedarf in jeder Planbewertung widerspruchsfrei klassifizieren                               |     1 |        0 |         0 |                   1 | Weitere alternative Routen prüfen; `executable_now` darf nie gleichzeitig einen offenen `ResourceGap` tragen                                                                          |
| `runner-finite-coverage-lifecycle`        | Endliche Universal-Breaker über aktuelle Zugriffswerte und vorhersehbare spätere Matchpoint-Server hinweg einsetzen                                              |     1 |        1 |         0 |                   0 | Wiederholungen sammeln, in denen ein früher Run messbar weniger wert ist und die spätere Serverrolle bereits sichtbar oder deckseitig vorhersehbar war                                |
| `runner-install-invocation-coverage`      | Alle aktuellen Zahlungs- und Trash-Varianten derselben planbewerteten Installation exakt routen oder dispositionieren                                            |     2 |        0 |         0 |                   2 | Weitere Installationsquellen mit mehreren Zahlungswegen prüfen; Programm-Trash verlangt weiterhin ein exakt vertretbares Opfer                                                        |
| `structured-choice-origin-binding`        | Jedes planrelevante Engine-Choice strukturiert an Quellinstanz, Quelldefinition und ausgewählte Aktion zurückbinden                                              |     2 |        0 |         0 |                   2 | Weitere Hidden-Zone- und Search-Choices auf vollständige strukturierte Herkunft prüfen; Source-Strings bleiben ungeparst                                                              |
| `corp-variable-rez-action-quote`          | Kosten und Runwirkung jeder aktuellen variablen ICE-Rez-LegalAction als exakt actiongebundene Engine-Quote bereitstellen                                         |     1 |        0 |         0 |                   1 | Die actiongebundene Quote auf weitere variable Familien wie X-Stärke und alternative Subtypen ausdehnen, sobald ein reproduzierbarer Entscheidungsfall sie benötigt                   |
| `deterministic-ai-replay-identity`        | Fachlich gleiche KI-Zustände über verschiedene Match-IDs in dieselbe RNG-, Plan- und Tie-Break-Folge überführen                                                  |     2 |        0 |         0 |                   2 | Weitere Engine-Randomisierungsfamilien und Planner-Fingerprints auf Transport-, Zeit- und Auditidentitäten prüfen                                                                     |
| `corp-punish-route-quote-completeness`    | Mehrstufige Tag-/Trace-/Damage-Linien vollständig quoten und unvollständige Gründe side-sicher im Decision Trace erklären                                        |     1 |        1 |         0 |                   0 | Chance-Observation/Scorched-Earth-Zustand erneut mit persistiertem strukturiertem Incomplete-Grund reproduzieren                                                                      |
| `runner-matchpoint-coverage-horizon`      | Verbleibende reale Deckrollen gegen eine sichtbar entstehende Matchpoint-Remote bewerten und nur tatsächlich erreichbare Coverage suchen                         |     2 |        1 |         0 |                   1 | Frühere Zustände mit noch vorhandener passender Coverage und belegter alternativer Funding-/Draw-/Install-Linie sammeln                                                               |
| `runner-coverage-draw-cadence`            | Einen strategischen Coverage-Draw als endliche Zugressource behandeln, auch wenn private Handänderungen denselben Gap neu bewerten                               |     1 |        0 |         0 |                   1 | Planübergreifende reine Draw-Züge beobachten; eine gemeinsame Zugquote erst bei wiederholter Evidence einführen                                                                       |
| `runner-run-preparation-binding`          | Eine vor dem Run exakt benötigte Breaker- oder ICE-Entfernungsroute an Run-Parent, Quellinstanz und aktuelle LegalAction binden                                   |     2 |        0 |         0 |                   2 | Weitere vorbereitende Fähigkeiten nur über exakte Runroute und denselben Run-/Coverage-Supportowner anbinden                                                                          |
| `corp-score-server-reservation`           | Eine bereits vom exakten Scoreplan adressierte und vorbereitete Remote vor konkurrierender Nicht-Agenda-Belegung durch Handmanagement schützen                   |     1 |        0 |         0 |                   1 | Weitere planübergreifende Serverkonflikte prüfen; Reservierung bleibt an aktuellen Agenda-Parent und konkrete Vorbereitung gebunden                                                   |
| `runner-terminal-contest-execution`       | Einen exakt ausführbaren Matchpoint-Contest samt Recovery, Funding und aktuellem Route-Head vor bloßen Metasignalen erhalten                                     |     1 |        0 |         0 |                   1 | Weitere terminale Remotes mit anderen Recovery-Quellen und Gegnerreaktionen prüfen                                                                                                    |
| `engine-run-start-eligibility`            | Jede Run-Start-LegalAction unabhängig von Quelle und Kartenfamilie durch dieselbe Engine-Zulässigkeit führen                                                     |     1 |        0 |         0 |                   1 | Weitere globale und serverspezifische Run-Sperren gegen Event-, Karten- und Basic-Run-Familien testen                                                                                 |
| `runner-turn-capacity-priority`           | Sichere Restklick-Liquidität endlich nutzen, ohne terminales Abwarten oder stärkere Pläne zu verdrängen                                                          |     4 |        0 |         0 |                   4 | Reiche Zustände mit echten P1–P5-Alternativen sammeln; P6 bleibt strikt nachrangig, zugbegrenzt und nach externem Zufluss frisch quotierbar                                            |
| `runner-visible-damage-survival`          | Öffentlich sichtbaren, nicht bezahlbar brechbaren ICE-Schaden einschließlich Cleanup-Flatline vor Runstart und im Jack-out-Fenster erkennen                      |     2 |        0 |         0 |                   2 | Weitere Damage-Typen, kombinierte Prävention und mehrere verbleibende ICE mit derselben Engine-Quote prüfen                                                                           |
| `runner-run-window-plan-coverage`         | Jede exakt admissible Encounter-/Runfensteraktion im zuständigen Runfensterplan halten, ohne Ziel- oder Aktionswahl an einen Resolver abzugeben                  |     2 |        0 |         0 |                   2 | Weitere Deflect-, Pump-/Break-, CardSpec- und Continue-Kombinationen mit unverändertem Root, Leaf, Step und Executor prüfen                                                            |
| `engine-resource-exchange-lower-bound`    | Eine bereits an den direkten Kosten sicher unbezahlbare Breakroute trotz noch nicht vollständig modellierter Folgeauswirkung exakt als unbezahlbar zertifizieren |     1 |        0 |         0 |                   1 | Weitere monotone Folgeauswirkungen prüfen; bei bezahlbarer direkter Route bleibt die Quote bis zur vollständigen Modellierung fail-closed                                             |
| `match-result-successful-run-count`       | Gestartete und erfolgreiche Runs aus der vollständigen öffentlichen Persistenzbasis zählen                                                                       |     2 |        0 |         0 |                   2 | Weitere lange SQLite-Partien gegen vollständige Eventhistorie vergleichen; kein Berichtsfallback                                                                                      |
| `runner-resource-lifecycle-disposition`   | Freiwillige Ressourcen-Self-Trash-Aktionen exakt beim Lebenszyklusowner halten                                                                                    |     1 |        0 |         0 |                   1 | Weitere freiwillige Self-Trash-Familien mit unverändertem Owner und exakter Quelle prüfen                                                                                             |
| `engine-start-window-ordering`            | Öffentliche Zufallseffekte in kanonischer Startfensterreihenfolge ohne Planner-RNG auflösen                                                                       |     1 |        0 |         0 |                   1 | Weitere gleichzeitige Startfenster über Engine-Reihenfolge und RandomDrawRecords prüfen                                                                                                |
| `engine-transient-memory-continuation`    | Temporäre MU-Überschreitung nur innerhalb exakt gebundener obligatorischer Continuations zulassen                                                                |     1 |        0 |         0 |                   1 | Weitere Such-/Install-Fortsetzungen auf transienten und finalen Invariantzustand prüfen                                                                                                |
| `corp-defense-disposition-arbitration`    | Exakt materialisierte Defense-Routen vor generischen Handmanagement-Dispositionsregeln schützen                                                                  |     1 |        0 |         0 |                   1 | Weitere planübergreifende Dispositionskonflikte nur über bestehende Owner-Arbitration lösen                                                                                            |
| `corp-run-defense-ability-coverage`       | Engine-zertifizierte Kartenfähigkeiten zum Beenden eines aktuellen Runs exakt beim bestehenden Defense-Owner materialisieren                                     |     1 |        0 |         0 |                   1 | Weitere direkte Run-End-Fähigkeiten nur über exakten Engine-Effekt, aktuelle LegalAction und unveränderten Defense-Owner anbinden                                                     |
| `runner-central-run-disposition`          | Bewusst auf Funding verschobene legale Zentralruns weiterhin exakt beim Zentraldruckowner dispositionieren                                                       |     1 |        0 |         0 |                   1 | Weitere Setup-/Funding-Empfehlungen auf vollständige LegalAction-Abdeckung und unveränderte Runownership prüfen                                                                        |
| `runner-terminal-deck-pressure`           | Matchpoint-Deckrennen einschließlich Corp-Pflichtzug und vollständiger Alternativablehnung bewerten                                                              |     1 |        0 |         0 |                   1 | Weitere Gleichstands- und Mehrfachpflichtzieh-Situationen prüfen; leerer Corp-Stack bleibt eigener Terminalzustand                                                                     |
| `ai-failure-attempt-observability`        | Fail-closed Choose-/Apply-Fehlversuche privat vollständig und öffentlich side-sicher persistieren                                                                |     1 |        0 |         0 |                   1 | Neue Laufzeitabbrüche müssen Phase, Checkpoint, Actionbindung und strukturierten Fehler ohne Stacktrace enthalten                                                                      |

## Fallregister

| Fall     | Cluster                                   | Evidenzgrad         | Seite  | Match und Entscheidungen                                                                                                                          | Symptom                                                                                                                                                                                                                                                                | Zuständiger Pfad                                                                                                                                                      |
| -------- | ----------------------------------------- | ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SP-001` | `corp-score-plan-conversion`              | Verdacht            | Corp   | `match_ce0f0272ed65d4f9`, 93 und 104                                                                                                              | Zweimal Schutz-Drawing ohne spätere Score-Konversion; ein besserer legaler Zug ist noch nicht belegt                                                                                                                                                                   | `corp.defend_servers` als Support für `corp.score_agenda`                                                                                                             |
| `SP-002` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_0c33b84f66d564f9`, 39–44, kritisch 42; Replays `match_f605bd005514f20c` und `match_665f42d9261b3676`                               | Sicher im selben Zug scorebare Agenda wurde zugunsten der Vorbereitung einer anderen Agenda unterbrochen                                                                                                                                                               | TurnPlanner-Continuation des exakten Owners `corp.score_agenda`                                                                                                       |
| `SP-003` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_f605bd005514f20c`, 145–149, kritisch 146; nach Fix `match_665f42d9261b3676`, 145–150                                               | Exakt erreichbare Score-Linie verlor die gleichrangige Auswahl gegen Economy-Support einer anderen, in diesem Zug nicht scorebaren Agenda                                                                                                                              | Prioritätsobligation des exakten Owners `corp.score_agenda`                                                                                                           |
| `SP-004` | `corp-deck-exhaustion-horizon`            | Verdacht            | Corp   | `match_e17749ea32acc45e`, 29, 53 und 95; Vorläufer `match_665f42d9261b3676`, 29, 53 und 134                                                       | Fünf frühe freiwillige Draws tragen kumuliert zum späteren Deck-out bei; jeder Einzelzug liegt noch außerhalb des kurzen Pflichtzieh-Horizonts                                                                                                                         | strategischer Corp-Draw-/Deck-out-Horizont über mehrere Züge                                                                                                          |
| `SP-005` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_e17749ea32acc45e`, 138; Vorläufer `match_665f42d9261b3676`, 75                                                                             | Dritte HQ-ICE-Schicht bei nur einer R&D-Schicht; HQ Interface erklärt die Wahl teilweise                                                                                                                                                                               | `corp.defend_servers`, genaue Root-/Threat-Zuordnung noch offen                                                                                                       |
| `SP-006` | `corp-score-exposure-risk`                | Verdacht            | Corp   | `match_e17749ea32acc45e`, 74–76 und 139; Vorläufer `match_665f42d9261b3676`, 85–88; Zyklus 013 `match_ec5b2d5b75e389b9`, D341/D453/D494/D552 | Wiederholt gestufte Agenda-Linien gegen öffentlich finanzierbare passende Breaker; Zyklus 013 belegt trotz erheblicher Zugriffsbindung wiederholte Runner-Rekapitalisierung, aber keinen sicher besseren Einzelpfad                                                     | `corp.score_agenda` mit Defense-Support; belegter besserer LegalAction-Pfad fehlt                                                                                     |
| `SP-007` | `runner-low-payoff-pressure`              | Verdacht            | Runner | `match_e17749ea32acc45e`, 122 und 131; Vorläufer `match_665f42d9261b3676`, 113 und 121                                                            | Wiederholte Archives-Runs ohne im Trace belegten unmittelbaren Payoff                                                                                                                                                                                                  | Runner-Druck-/Run-Zielwahl; Vergleichswert der Alternativen fehlt                                                                                                     |
| `SP-008` | `runner-coverage-owner-materialization`   | Behoben/verifiziert | Runner | aktuelle Main-Basis `match_1d9102cdac482cab`, Workbranch `match_5d3fcc740a02c228`, D23; final `match_e17749ea32acc45e`, D23                       | Rig beanspruchte alle Coverage-Installationen, materialisierte aber nur die erste unbezahlbare Handantwort und ließ eine kostenlose legale Alternative ownerlos                                                                                                        | `runner.rig_and_coverage`, Action-ID-Materialisierung innerhalb desselben Owners                                                                                      |
| `SP-009` | `corp-deck-exhaustion-horizon`            | Behoben/verifiziert | Corp   | vor Fix `match_c7144122aaeafb8b`, D126; final `match_e17749ea32acc45e`, D126–D128                                                                 | Basic Draw war wegen kurzem Pflichtzieh-Horizont blockiert, Night Shift mit demselben Kartenverbrauch wurde über Economy dennoch gespielt                                                                                                                              | planübergreifende Corp-Draw-Sicherheitsdisposition mit Economy-Owner                                                                                                  |
| `SP-010` | `runner-urgent-remote-support-conversion` | Behoben/verifiziert | Runner | vor Fix `match_ddac385459428c34`, D54–D63; Zwischenlauf `match_7086b0128fda7eeb`, D57–D59; final `match_d1466637af6d0a60`, D54–D64                | Nach einem gescheiterten Remote-Probe lag eine vollständige Credit–Breaker–Rerun-Linie vor. Die KI lief stattdessen erst auf HQ und nach dem ersten Fix auf R&D, sodass die bedrohte Vier-Punkte-Agenda liegen blieb                                                   | `runner.contest_remote` als Root, `runner.rig_and_coverage` als exakt gebundener Support-Leaf und sichere Run-Reservefreigabe                                         |
| `SP-011` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_d1466637af6d0a60`, D149, D172, D191 und spätere Rezfenster D312, D314, D316                                                                | Corp legt drei zusätzliche Wall-/Code-Gate-Schichten auf das wiederholt angegriffene R&D. Gegen die öffentlich passenden kostenlosen Breaker erzeugen sie später keinen Access-Stop und werden trotz genügend Credits nicht gerezzt                                    | `corp.defend_servers`; offen ist, ob bei der Installation eine konkret bessere Platzierung oder eine schnellere Score-/Economy-Aktion legal und messbar stärker war   |
| `SP-012` | `plan-support-readiness-consistency`      | Behoben/verifiziert | Runner | vor Fix `match_81da14276d2357ad`, D283–D284; final `match_5aba9d2141ec1d24`, D282–D300                                                            | Der dringende Remote-Plan hatte eine aktuelle ausführbare Route, führte aber gleichzeitig noch einen älteren Wall-Coverage-Bedarf und scheiterte deshalb vor der Auswahl fail-closed                                                                                   | gemeinsamer Assessment-Vertrag von `runner.contest_remote`, `runner.pressure_central` und `runner.develop_board_and_hand`                                             |
| `SP-013` | `runner-finite-coverage-lifecycle`        | Verdacht            | Runner | `match_5aba9d2141ec1d24`, frühe Zentralruns und D300–D327                                                                                         | Selbstzerstörende Rent-I-Con-Kopien tragen frühe Zugriffe, fehlen aber gegen die spätere Matchpoint-Remote; unklar ist, ob ein früher Einsatz mit damaliger Sicht tatsächlich weniger wert war                                                                         | `runner.pressure_central` und `runner.contest_remote` benötigen eine gemeinsame endliche Coverage-Lebenszyklusbewertung                                               |
| `SP-014` | `runner-install-invocation-coverage`      | Behoben/verifiziert | Runner | vor Fix `match_b920d5897a7fa766`, D99; final `match_a827f500dc378815`                                                                             | Zentraldruck dispositionierte nur die kanonische Vienna-22-Installation; gleichwertige Bits- und Programm-Trash-Zahlungsvarianten derselben Quellinstanz blieben ownerlos                                                                                              | Variantenpropagierung innerhalb `runner.pressure_central`, ohne bestehende Spezialowner zu überschreiben                                                              |
| `SP-015` | `structured-choice-origin-binding`        | Behoben/verifiziert | Runner | vor Fix `match_f96e7445261cab1a`, D154–D155; final `match_a827f500dc378815`                                                                       | Test Spin war als Coverage-Suche exakt gewählt, doch das Engine-Choice verlor strukturierte Quellinstanz und Quelldefinition und konnte nicht zur Suchaktion zurückgebunden werden                                                                                     | Engine-Choice-Erzeugung und bestehende Coverage-Continuation; kein Source-String-Parsing im Resolver                                                                  |
| `SP-016` | `corp-variable-rez-action-quote`          | Behoben/verifiziert | Corp   | vor Fix `match_a989710008cbc543`, D11, D16, D59, D191, D228, D230 und D238; final `match_a827f500dc378815`, ab D11                                | Variable Rez-LegalActions nannten Kosten und Wirkung exakt, die Kartenquote blieb jedoch ohne Subroutinen unvollständig; bezahlbare stopping ICE wurden deshalb wiederholt abgelehnt                                                                                   | Engine-PlayerView liefert actiongebundene Variantenquote; `corp.defend_servers` liest nur die exakt ausgewählte aktuelle Action                                       |
| `SP-017` | `corp-score-plan-conversion`              | Verdacht            | Corp   | `match_a827f500dc378815`, Corp-Züge 0–44, Scorefortschritt erst D411–D412                                                                         | HQ enthält fast durchgehend drei bis fünf Agenden und die Corp erreicht bis zu 16 Credits, beginnt aber erst nach 44 Zügen eine Score-Remote und verliert 0:8                                                                                                          | `corp.score_agenda` mit Agenda-Sättigungs-, Score-Stau- und gestuftem Schutzvertrag; Schwelle und besserer konkreter Pfad sind noch offen                             |
| `SP-018` | `deterministic-ai-replay-identity`        | Behoben/verifiziert | Beide  | vor Fix `match_9b559755a4a11a9c`/`match_506fac4c8636d28f`, D4; Zwischenreplays D123; final `match_e03400af85946596`/`match_ad6bdd795029066f`      | Identischer Seed und identische Starthand erzeugten wegen Match-ID im RNG-Zweck und StateHash im Planungsfingerprint verschiedene ICE-Ziele, Breaker und Sieger                                                                                                        | Engine-Randomisierungszweck sowie gemeinsamer `PlanningStateIdentity`-Vertrag                                                                                         |
| `SP-019` | `corp-punish-route-quote-completeness`    | Verdacht            | Corp   | `match_9b559755a4a11a9c`, D32–D48; Seed und Decks aus Zyklus 006                                                                                  | Tag-&-Bag-Intent, Chance Observation und Scorched Earth sind sichtbar; die angefragte mehrstufige Engine-Quote bleibt unbekannt, ohne den konkreten Incomplete-Grund im persistierten Trace auszuweisen                                                                | `corp.execute_punish_sequence`, Decision-local Engine-Quote und side-sichere Trace-Evidence                                                                           |
| `SP-020` | `runner-matchpoint-coverage-horizon`      | Verdacht            | Runner | `match_e03400af85946596`, D222–D224 und D334–D342                                                                                                 | Beim Stand 6:6 ist die vierfach geschützte Matchpoint-Remote wegen fehlender Wall-Abdeckung nicht passierbar; im verbleibenden Stack existieren nur Sentry-Breaker, sodass Draw und Remote-Run aktuell keine belegte Siegroute bilden                                  | `runner.contest_remote`, `runner.rig_and_coverage` und Deckprofil-Lebenszyklus; ein früherer konkret besserer LegalAction-Pfad fehlt                                  |
| `SP-021` | `runner-central-payoff-owner-binding`     | Behoben/verifiziert | Runner | Spielseed Zyklus 007; Abbruch vor D8, final `match_2c166dda041da6ff` und `match_fc3094aac35c9b54`                                                 | R&D Mole war als sichtbare Handkarte und LegalAction vorhanden, verlor aber ohne angereicherte Kandidatenfelder seine R&D-Fähigkeitszuordnung und blieb ownerlos                                                                                                       | Quellinstanzbindung und Definition-Hint innerhalb `runner.pressure_central`                                                                                           |
| `SP-022` | `corp-rule-score-conversion`              | Behoben/verifiziert | Corp   | Spielseed Zyklus 007; Abbruch vor D53, final beide Replays D53                                                                                    | Eine exakt gequotete Aktion entfernte für einen Klick und 12 Credits eine aktive Verpflichtung und erzeugte einen Agendapunkt, doch der positive KI-Inputfilter entfernte die Quote und ließ die Aktion ownerlos                                                       | `corp.score_agenda` als `convert_agenda`-Owner; exakte LegalAction-Quote                                                                                              |
| `SP-023` | `runner-terminal-contest-risk-contract`   | Verdacht            | Runner | `match_2c166dda041da6ff` und `match_fc3094aac35c9b54`, D404–D419, kritisch D410–D414                                                              | Runner erkennt eine zweifach avancierte Score-Remote, beginnt mit vollständiger Breakerabdeckung den Contest, behandelt ihn aber weiter als Probe und jackt nach einem Credit Reserveverschlechterung aus; die Corp scoret direkt danach zum Sieg                      | `runner.contest_remote`, öffentliche Next-Turn-Terminalhülle und während des Runs erhaltener Risikovertrag                                                            |
| `SP-024` | `match-result-successful-run-count`       | Behoben/verifiziert | Beide  | Zyklen 007, 017–019 und finale Drei-Seed-Serie Zyklus 012                                                                                         | Lange SQLite-Partien verloren für ältere kompakt geladene Access-Events den `accessIndex`; Result zählte deshalb nur jüngere Erstzugriffe                                                                                                                            | kompakte Action-Persistence bewahrt Result-Facts; `successfulRunCountForResult` liest die vollständige Eventbasis                                                     |
| `SP-025` | `runner-coverage-draw-cadence`            | Behoben/verifiziert | Runner | vor Fix `match_ebc151e8a1be1520`, Zwischenlauf `match_87856c3dcdca58ea`, final `match_232bb3100f587eaa`/`match_49d866da5b4d3582`                  | Derselbe Coverage-Bedarf materialisierte nach jeder privaten Handänderung erneut Basic Draw und verbrauchte bis zu vier Klicks desselben Zuges; der erste enge Fix ließ parallele Gap-Erzeuger offen                                                                   | gemeinsamer endlicher Draw-Takt aller Coverage-Gaps in `runner.rig_and_coverage`; terminaler Remote-Bedarf bleibt explizite Ausnahme                                  |
| `SP-026` | `runner-run-preparation-binding`          | Behoben/verifiziert | Runner | vor Fix `match_7949f3aff19b8b5a`, D134; final `match_232bb3100f587eaa`/`match_49d866da5b4d3582`                                                   | Morphing Tool konnte den für eine konkrete Runroute benötigten Breaker-Subtyp legal wählen, doch die Vorbereitung trug nur anonyme Kosten und blieb ohne Planowner                                                                                                     | Runanalyse erhält Quellinstanz, Definition und Subtyp; `runner.rig_and_coverage` führt die exakt gebundene aktuelle Action als Support des Run-Parents aus            |
| `SP-027` | `corp-score-server-reservation`           | Behoben/verifiziert | Corp   | vor Fix `match_a944b3add18ccebb`, D166–D168; Zwischenlauf `match_7d4876b58d2a3e13`, D184; final `match_63ee0abf99b1725d`/`match_c1484f4685ab273d` | Handmanagement installierte ein Economy-Asset in die Remote, die der exakte Scoreplan gerade mit ICE vorbereitet hatte. Der enge Letzter-Klick-Fix gab denselben Server im Folgezug erneut für Overflow frei.                                                          | `corp.hand_and_agenda_management` dispositioniert den Konflikt; Agenda- und ICE-Owner sowie der exakte Score-Parent bleiben unverändert                               |
| `SP-028` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_c1484f4685ab273d` und `match_e58f7c30dc9ee2f6`, D166/D185/D200; final `match_7597acdd221583e2`, D166–D167                          | Derselbe Schutzwert wurde auf einem neuen leeren Remote zugelassen, auf der bereits vorbereiteten Remote aber wegen unveränderter unmittelbarer Zugriffswahrscheinlichkeit und asymmetrischer Fundingregel abgelehnt. Final entsteht genau eine zweischichtige Remote. | `corp.defend_servers` bleibt Support-Leaf von `corp.score_agenda`; Schutzwirkung, optionale Rez-Routen und begrenzte zweite Reifeschicht werden gemeinsam bewertet    |
| `SP-029` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_7597acdd221583e2`, D167–D183; Gegenbild `match_c1484f4685ab273d`, D168 und späterer HQ-Run                                                 | Das bekannte defensive Upgrade Rio de Janeiro City Grid ist legal auf HQ, besitzt aber keinen Defense-Planpfad und wird nur zufällig durch Handdruck installiert. Im finalen Replay fehlt dieser Umweg vor dem terminalen HQ-Multiaccess.                              | `corp.defend_servers` und defensive Root-Upgrades; exakter Effekt-/Kostenvergleich gegen ICE, Credits und Scorefortschritt fehlt                                      |
| `SP-030` | `runner-terminal-contest-execution`       | Behoben/verifiziert | Runner | Zwischenläufe `match_5b864d710fb1189c` und `match_686fc85c6a64d256`; finale Drei-Seed-Serie Zyklus 010                                            | Ein bloßes Matchpoint-Fokussignal verdrängte einen konkret ausführbaren Remote-Run; bekannte trashbare Zugriffe und endliche R&D-Probes verloren dabei ihren eigentlichen Contest- oder Informationszweck.                                                             | Der bestehende Run-Parent behält den exakten Route Head; Meta-Signale, Recovery und Zugriffsvarianten ergänzen ihn, übernehmen aber weder Action noch Ziel            |
| `SP-031` | `runner-install-invocation-coverage`      | Behoben/verifiziert | Runner | Zwischenläufe Zyklus 010 und fokussierte Varianten-/Ownership-Regressionen                                                                        | Direkte, gehostete und Programm-Trash-Varianten derselben Installation konkurrierten ohne verlässliche Opferbindung; eine schwächere Variante konnte die direkte Installation verdrängen.                                                                              | `runner.develop_board_and_hand` beziehungsweise der gebundene Run-Support priorisiert direkte Routen und verlangt vor Programm-Trash ein exakt vertretbares Opfer     |
| `SP-032` | `engine-run-start-eligibility`            | Behoben/verifiziert | Runner | vor Fix `match_17fabf2b8c4f877c`, Zustand 212; finale Drei-Seed-Serie Zyklus 010                                                                  | Eine karten- oder servergebundene Run-LegalAction wurde veröffentlicht, obwohl die gemeinsame Engine-Zulässigkeit den Run-Start sperrte; `applyAction` lehnte die vermeintliche LegalAction anschließend korrekt ab.                                                   | Engine-Erzeugung aller Run-Start-Familien über `evaluateRunStartEligibility`; keine KI-Sonderregel                                                                    |
| `SP-033` | `runner-turn-capacity-priority`           | Behoben/verifiziert | Runner | vor Fix `match_5ea445b755c1a8c9`, Zustand 424; finale Drei-Seed-Serie und fokussierte Gegenfalltests                                              | Nach Abschluss stärkerer Pläne blieben drei sichere Klicks trotz exakter Basic-Credit-Aktion ownerlos; ein erster Fix hätte umgekehrt ein bereits belegtes terminales Deckout-Abwarten verdrängt.                                                                      | Endlicher P6-Liquiditätsplan nur für echte Restkapazität; terminale Siegroute und sämtliche stärkeren fachlichen Pläne behalten Vorrang                               |
| `SP-034` | `corp-deck-exhaustion-horizon`            | Behoben/verifiziert | Corp   | vor Fix `match_304b27a5c33b8bf4`, Schlussphase; final `match_8f7acfff2b3351cd`, Schlussphase                                                      | Die Engine kann pro Corp-Drawfenster mehr als eine Pflichtkarte ziehen, doch die positive KI-DTO-Allowlist entfernte diesen öffentlichen Zähler. Die Scoreline überschätzte dadurch die verbleibenden Züge und begann den letzten Siegversuch nicht.                   | Öffentlicher Engine-Zähler bleibt im positiven DTO; `corp.score_agenda` berechnet verbleibende Drawfenster und bindet im letzten belastbaren Fenster die Agenda exakt |
| `SP-035` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_01cb6b5f1f396064`; finale Drei-Seed-Serie Zyklus 011, insbesondere `match_9e30c4cdb0a1c082`                                        | Eine bereits zweischichtig geschützte Remote galt trotz zweier bezahlbarer, Engine-gequoteter Tax-/Damage-Layer erneut als unfertig; ein zweiter Protection-Scan überschrieb den Scorepfad und erzeugte weitere Defense- statt Agendaaktionen.                         | `corp.score_agenda` zertifiziert den aktuellen Scorehorizont; `corp.defend_servers` bewahrt dieses stateVersion-gebundene Zertifikat als Support-Leaf                 |
| `SP-036` | `runner-visible-damage-survival`          | Behoben/verifiziert | Runner | vor Fix `match_3210fb99405c84f1`; Zwischenlauf `match_8e105ab7b78843ee`; final `match_2caf6feef92a5fe7`                                           | Der Runner startete beziehungsweise setzte Runs in öffentlich sichtbaren, nicht finanzierbar brechbaren ICE-Schaden fort, obwohl Hand und Prävention eine unmittelbare Flatline nicht tragen konnten.                                                                  | Engine projiziert den Damage-Typ; Runziel und `runner.convert_run_window` verwenden dieselbe sichtbare Lethal-Damage-Bewertung                                        |
| `SP-037` | `runner-run-window-plan-coverage`         | Behoben/verifiziert | Runner | Zyklus 011, reproduzierter Encounter-Zustand aus Seed 3 und fokussierter Deflector-Gegenfall                                                      | Eine Engine-legale Continue-/Encounter-Aktion besaß eine exakte planlokale Bewertung, fiel aber ohne Server-ID aus der Kandidatenabdeckung; zugleich konnte eine ausgeschlossene Breakroute ein Continue fälschlich verdrängen.                                        | `runner.convert_run_window` erweitert nur seine Kandidatenabdeckung; Root, Leaf, Step, Action-ID und Executor bleiben unverändert                                     |
| `SP-038` | `runner-visible-damage-survival`          | Behoben/verifiziert | Runner | vor Fix `match_8e105ab7b78843ee`, D218; final `match_2caf6feef92a5fe7`, 281 Entscheidungen                                                        | Drei Core Damage waren bei drei Handkarten nicht sofort tödlich, senkten die effektive maximale Hand aber unter null und führten in der Cleanup-Phase zur Flatline. Die KI betrachtete nur den unmittelbaren Handverlust.                                              | gemeinsame sichtbare Lethal-Damage-Bewertung prüft unmittelbare und bereits determinierte Cleanup-Flatline                                                            |
| `SP-039` | `engine-resource-exchange-lower-bound`    | Behoben/verifiziert | Corp   | vor Fix Seed 1, Rezfenster vor D278; final `match_9e30c4cdb0a1c082`, D278                                                                         | Glacier wurde nicht gerezzt, weil eine spätere Stealth-Folgeauswirkung die gesamte Breakquote auf „unbekannt“ setzte, obwohl der Runner bereits die direkten Pump-/Break-Kosten nicht bezahlen konnte.                                                                 | Engine zertifiziert nur die monotone untere Kostenschranke; bei bezahlbarer direkter Route bleibt die unvollständige Folgeauswirkung fail-closed                      |
| `SP-040` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_8f9b0237ef657bab`, Corp-Zug 41 und Schlussfenster                                                                                          | HQ enthält sechs ICE, aber nur eine günstige Schicht ist aktiv; die Corp endet mit drei auf sechs Credits und kann die übrigen Schichten gegen den finanzierten Runner nicht rezzten. Unklar ist, welche frühere Platzierung oder Economy-Linie klar besser war.       | `corp.defend_servers` zusammen mit langfristiger Rezliquidität und Scoretempo; konkrete dominierende LegalAction im früheren Zustand noch nicht belegt                |
| `SP-041` | `corp-deck-exhaustion-horizon`            | Verdacht            | Corp   | `match_9e30c4cdb0a1c082`, Corp-Zug 39 bis Runner-Zug 40                                                                                           | Mit nur einer Karte in R&D scoret die Corp auf 3 Punkte; der nächste erfolgreiche R&D-Zugriff erzeugt einen zusätzlichen Pflichtzug und damit Deckout. Ein Zurückhalten der Agenda hätte Glacier später nach R&D bewegen können, belegt aber noch keinen Siegpfad.     | gemeinsamer letzter Score-, Verteidigungs- und Pflichtziehhorizont; Gegenpfad muss über mehrere Züge Engine-gequotet werden                                           |
| `SP-042` | `runner-resource-lifecycle-disposition`   | Behoben/verifiziert | Runner | Zyklus 016, Seed 2 vor Fix D150; finale Drei-Seed-Serie 016                                                                                        | Freiwilliger Self-Trash einer Resource war produktiv legal, aber keinem Planowner zugeordnet                                                                                                                                                                        | bestehender `runner.resource_lifecycle`-Owner mit generischer Resource-Self-Trash-Disposition                                                                         |
| `SP-043` | `engine-start-window-ordering`            | Behoben/verifiziert | Beide  | Zyklus 016, Seed 2 vor Fix D160; finale Drei-Seed-Serie 016                                                                                        | Omnitech-Zufallseffekt hatte keine kanonische Reihenfolge im Startfenster                                                                                                                                                                                            | Engine-Startfensterprofil und RandomDrawRecords; kein Planner-RNG                                                                                                     |
| `SP-044` | `engine-transient-memory-continuation`    | Behoben/verifiziert | Runner | Zyklus 016, Boostergang-/Wet-Drive-Zwischenlauf und finale Replays                                                                                 | Obligatorische Suchfortsetzung erzeugte kurzzeitig zu viel MU und scheiterte vor dem gebundenen Cleanup                                                                                                                                                             | Engine-Invariant erlaubt den Zwischenzustand nur für die exakte Choice-Continuation                                                                                   |
| `SP-045` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | Zyklus 016, Seed 2 und finale Replays                                                                                                               | Reife Agenda hinter zwei bezahlbaren Engine-gequoteten Layern blieb im allgemeinen Schutzloop                                                                                                                                                                       | `corp.score_agenda` zertifiziert den engen Zwei-Layer-Scorehorizont                                                                                                   |
| `SP-046` | `structured-choice-origin-binding`        | Behoben/verifiziert | Corp   | vor Fix `match_c9e4247a322efa9a`, D103; finale Drei-Seed-Serie 016                                                                                | Priority Requisition scorete, verlor aber die vor dem Score benötigte Free-Rez-Zielbindung                                                                                                                                                                          | Scoreowner bindet Quelle und ICE-Ziel vor; Resolver vervollständigt nur die Payload                                                                                   |
| `SP-047` | `match-result-successful-run-count`       | Behoben/verifiziert | Beide  | Zyklen 017–019; vor Resultfix Zyklus 012 `match_679b26b3b68b9a60`; final `match_7e537a30680ae0d0`                                               | Result meldete je nach Eventtail zu wenige erfolgreiche Runs und ließ Event-Runs aus der Gesamtzahl aus                                                                                                                                                              | Action-Persistence bewahrt `accessIndex`/`runnerEventRun`; Result zählt vollständige öffentliche Historie                                                             |
| `SP-048` | `runner-run-window-plan-coverage`         | Behoben/verifiziert | Runner | vor Fix `match_faafeff8bf960065`, D44; final `match_294cecc3d7918cea`, D44                                                                       | CardSpec-Erfolgsrun verlor Ability-/Effektidentität zwischen Engine, DTO und bestehendem Runfensterowner                                                                                                                                                             | kanonische CardSpec-Primitive und `runner.convert_run_window`                                                                                                         |
| `SP-049` | `corp-defense-disposition-arbitration`    | Behoben/verifiziert | Corp   | vor Fix `match_7288cb47af7f15c9`, D56; final `match_294cecc3d7918cea`, D56                                                                       | Materialisierte Defense-Installation wurde zugleich von HQ-Overflow als unproduktiv klassifiziert                                                                                                                                                                   | gemeinsame Disposition-Arbitration schützt exakte Defense-Action-ID                                                                                                  |
| `SP-050` | `corp-central-defense-allocation`         | Behoben/verifiziert | Corp   | vor Fix `match_3d52426f1bfec0ce`, D225; final `match_7e537a30680ae0d0`, Corp-Zug 31                                                            | Nacktes agendaexponiertes HQ verlor gegen eine dritte R&D-Schicht, weil der Allokator den Grenznutzen der ersten Schicht nicht kannte                                                                                                                                | `corp.defend_servers` mit symmetrischem installierten ICE-Bestand je Zentrale                                                                                         |
| `SP-051` | `runner-central-run-disposition`          | Behoben/verifiziert | Runner | Abbruch `match_d5f09452c77ff7cc`, D269; final `match_7e537a30680ae0d0`, D269                                                                    | Legal produktiver HQ-Basisrun wurde korrekt auf Funding verschoben, blieb dabei aber ownerlos                                                                                                                                                                       | `runner.pressure_central` dispositioniert die verschobene Run-Action; Economy besitzt nur Funding                                                                     |
| `SP-052` | `corp-score-plan-conversion`              | Verdacht            | Corp   | final `match_7e537a30680ae0d0`, Corp-Züge 17–49                                                                                                   | Corp hält Corporate Coup rund 14 Züge, steigt auf 45 bis über 70 Credits und baut erst spät eine scorebare Remote; ein sicher besserer konkreter Mehrzugpfad ist noch nicht belegt                                                                                   | `corp.score_agenda` plus `corp.defend_servers`; gestufte Schutz-/Advance-Linie gegen sichtbares Anti-ICE-Rig vergleichen                                              |
| `SP-053` | `runner-turn-capacity-priority`           | Behoben/verifiziert | Runner | vor Fix `match_1d2972c61a85c449`, ab D189; final `match_9fad13ecbda112d9`, D189                                                                 | Recurring-Economy-Hold verdrängte bei gegnerischem Matchpoint 72-mal Runs und baute 100 Credits auf                                                                                                                                                                  | Economy-Hold gibt nur Autorität frei; Runowner wählen weiterhin Server und Action                                                                                    |
| `SP-054` | `runner-run-preparation-binding`          | Behoben/verifiziert | Runner | Zyklus 012, finale Seeds 2 D48/D103 und 3 D102                                                                                                    | HQ-Erfolgsfenster, sichtbares ICE-Entfernungsziel und Jettison-Choice bildeten keine durchgehend gebundene Planroute; Breakactions ignorierten zudem den Run-Spending-Cap                                                                                            | `runner.pressure_central`, exakte Targeted-ICE-Continuation und Engine-Spending-Cap                                                                                  |
| `SP-055` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | Zyklus 012, final `match_7e537a30680ae0d0`, D254                                                                                                  | Gleichrangige generische Zentralverteidigung verdrängte die vom Scoreparent delegierte Staging-Schicht                                                                                                                                                              | `corp.defend_servers` priorisiert exakte `score_protection_staging_install`-Parentroute                                                                              |
| `SP-056` | `runner-matchpoint-coverage-horizon`      | Behoben/verifiziert | Runner | Zyklus 012, Seed 3 und fokussierter Parallel-Run-Regressionszustand                                                                                | Basic- und Event-Run auf dieselbe terminale Remote erzeugten denselben Agenda-Punkt-Coverage-Bedarf mehrfach                                                                                                                                                         | gemeinsamer Coverage-Need-Key bei getrennten Run-Actions und unverändertem Coverage-Owner                                                                             |
| `SP-057` | `runner-terminal-deck-pressure`           | Behoben/verifiziert | Runner | Zyklus 012, fokussierter Matchpoint-Gleichstandsfall und finale Drei-Seed-Serie                                                                    | Gleich große positive Deckreste galten fälschlich nicht als Runner-günstig, obwohl die Corp zuerst pflichtzieht                                                                                                                                                      | Scheduler-EndTurn-Gate mit vollständiger Owner-Ablehnung und `corpDeck <= runnerStack`                                                                               |
| `SP-058` | `ai-failure-attempt-observability`        | Behoben/verifiziert | Beide  | Zyklus 012, unter anderem `match_d5f09452c77ff7cc`, D269, sowie fokussierte Choose-/Apply-Tests                                                  | Fail-closed Choose-/Apply-Abbruch verlor Phase, Actionbindung oder privaten strukturierten Fehler und war danach nicht vollständig analysierbar                                                                                                                      | private Maintenance-Failure-Attempts; öffentliche Antwort bleibt side-sicher und opak                                                                                |
| `SP-059` | `engine-visible-break-resource-exchange`  | Behoben/verifiziert | Corp   | vor Fix `match_f14abdef714aee29`, D66/D185/D188/D199/D207/D227/D230; final `match_ab8e254f6364e919`, D66                                      | Bezahlbare Pile-Driver-Wall-Route blieb wegen optionaler Stealth-Folge unbekannt, obwohl exakt keine installierte Stealth-Quelle verfügbar war                                                                                                                       | Engine zertifiziert nur strukturierten optionalen Nullfall; positiver oder unvollständiger Stealth-Pool bleibt fail-closed                                            |
| `SP-060` | `corp-run-defense-ability-coverage`       | Behoben/verifiziert | Corp   | vor Fix `match_103f7ed6b71e9afa`, D156; final `match_b153b34d263aeb09`, D157                                                               | Exakte Data-Fort-Remapping-Action zum Beenden des aktuellen Runs blieb trotz vollständiger LegalAction ownerlos und löste fail-closed `missing_plan_module_coverage` aus                                                                                            | Engine-Effekt `end_run` wird exakt projiziert und durch den bestehenden `corp.defend_servers`-Owner materialisiert; kein neuer Resolver oder Plan                   |
| `SP-061` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | Ausgang `match_c64a44a2ac44c28e`; final Zyklus 013, insbesondere Seed 3 D321/D418                                                           | Gebundener Score-Schutz verlor am `new_remote`-Lebenszyklus seine LegalAction oder wurde von immer weiteren nichtterminalen Zentralschichten verdrängt                                                                                                               | Scoreparent bindet `new_remote` und konkrete ICE-Action; `corp.defend_servers` priorisiert die erste gebundene Staging-Schicht                                       |
| `SP-062` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | Zwischenlauf `match_47a9ede2d986e895`; final `match_ec5b2d5b75e389b9`, D341/D453/D494/D552                                               | Zwei bezahlbare Corp-Rez-Schichten galten ohne Prüfung des tatsächlichen sichtbaren Runnerpfads pauschal als reife Score-Remote                                                                                                                                       | `corp.score_agenda` prüft den Engine-zertifizierten Post-Rez-Pfad auf Blockade, erhebliche Liquiditätsbindung oder unvermeidbare strukturierte Gefahr                |
| `SP-063` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_d3d3678d6163c47a`, D218; final `match_306137f2b76a69f7`, D218                                                              | Vier nicht gewählte Effekt-Zielvarianten derselben scorebereiten Agenda blieben produktiv ownerlos, obwohl `corp.score_agenda` die exakte HQ-Variante bereits gebunden hatte                                                                                         | `corp.score_agenda` dispositioniert Geschwistervarianten derselben Agenda nach seiner exakten Effektzielwahl; kein neuer Action-, Target- oder Resolverowner          |
| `SP-064` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_a48ad219c3173450`, D483; final `match_df1e2cd6549ea67d`, D481–D486                                                        | Exakt im selben Zug fertigstellbarer Score gegen terminalen Runner-Steal verlor den letzten benötigten Klick an einen spekulativen Defense-Draw                                                                                                                       | `corp.score_agenda` veröffentlicht die gebundene P2-Konversion als `preventsTerminalSteal`; Defense-Draw bleibt nachrangig                                           |
| `SP-065` | `runner-turn-capacity-priority`           | Behoben/verifiziert | Runner | vor Fix `match_3a69693c29602c61`, D359 und `match_948160e7b8c9cd76`, D77; final `match_8a138d37d89521b2`, D359 und `match_013087ac5c907d00`, D77 | Defense deklarierte normale Restklicks trotz nicht leerem Stack als erschöpft und versuchte den Zug mit legaler Basiscredit-Action zu beenden                                                                                                                         | Erschöpfungsdisposition nur bei leerem Stack; normale Kapazität bleibt beim nachrangigen `runner.economy`-Owner                                                       |
| `SP-066` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_78be06130554dfa0`, D578; final `match_df1e2cd6549ea67d`, D577–D579                                                        | Nach Agenda-Installation im letzten Drawfenster verlor dieselbe residente Scoreinstanz ihre Frist und wollte vor sicherem Pflichtzieh-Deckout auf Economy zurückfallen                                                                                               | Dieselbe `corp.score_agenda`-Instanz behält `last_draw_window` über gebundene Install-/Advance-/Score-Continuation                                                   |
| `SP-067` | `runner-turn-capacity-priority`           | Behoben/verifiziert | Runner | Zwischenreplay `match_12e9760f9096c92e`, D359 und `match_9872a6714cdc3585`, D77; final `match_8a138d37d89521b2`, D359 und `match_013087ac5c907d00`, D77 | Ein durch externen Zufluss bereits erfülltes residentes P6-Liquiditätsziel blockierte eine frische endliche Restklickquote und ließ `gain_credit` ownerlos                                                                                                             | Residentes Ziel bleibt während eigener Konversion stabil und wird erst nach externer Zielerfüllung aus aktuellem Stand plus Restklicks neu begrenzt                   |

## SP-001 – Score-Schutz-Drawing ohne belegte Konversion

- Seed: `ai-selfplay-pilot-001-game-v2`
- Regelprofil: Originalset, `modern_open`
- Runner: `onr_origin_runner_ai_snapshot_v1`,
  `fnv1a:7a0470da`, Runner Origins AI – Probe Pressure
- Corp: `demo_corp_008_snapshot_v0_8`, `fnv1a:29b7fc41`,
  Corp Demo Deck 08 – Starter Score Grid
- Ergebnis: reguläres Ende nach 152 Aktionen, Runner gewinnt durch
  `corp_deck_empty`; keine Fallbacks, Timeouts oder Runtimefehler
- Evidence: Entscheidungen 93 und 104 verwenden
  `develop_score_protection`, danach entsteht in dieser Partie keine
  Score-Konversion. Die Daten beweisen noch nicht, dass zu diesen Zeitpunkten
  ein besserer legaler Pfad bestand.
- Vertiefung: [Activity Score-Schutz-Drawing](../../activities/inbox/act-2026-08-19-corp-score-protection-draw-conversion.md)

Status: offen. Ein weiterer gleichartiger Fall soll insbesondere LegalActions,
Ressourcenreichweite, gebundenen Score-Parent und die Folgedispositionen
vergleichen.

## SP-002 – exakter Score-Root durch Geschwisterplan unterbrochen

Gemeinsamer Reproduktionsvertrag:

- Seed: `ai-selfplay-cycle-002-3f175d362b4a429a98d7ba2072c060bb`
- Regelprofil: Originalset, `modern_open`
- Runner: `onr_origin_runner_ai_snapshot_v1`,
  `fnv1a:7a0470da`, Runner Origins AI – Probe Pressure
- Corp: `onr_origin_corp_ai_snapshot_v1`, `fnv1a:072da05f`,
  Corp Origins AI – Tax & Punish
- Ausgangsstand: Git `00c58a54f`

Vor dem Fix:

- Match `match_0c33b84f66d564f9`, reguläres Ende nach 149 Aktionen,
  finaler StateHash `fnv1a:6e6123b2`
- In Entscheidung 42 lagen zwei Klicks und drei Credits vor. Die installierte
  Agenda in `remote_1` hatte einen von drei Advancement-Countern; zweimal
  `advance_card` und danach das kostenlose `score_agenda` waren legal und im
  selben Zug erreichbar.
- Stattdessen installierte der TurnPlanner Schutz für eine zweite Agenda in
  einem neuen Remote. Der Schritt gehörte zu einem anderen
  `corp.score_agenda`-Root und unterbrach damit die bereits laufende exakte
  Score-Linie.

Generischer Ursachen-Fix:

- Ein dringender exakter `corp.score_agenda`-Head der Klassen P1 bis P3 bindet
  die Turn-Restplanung an `same_root`.
- Supportschritte für denselben Root bleiben zulässig; eine zweite Agenda darf
  die sichere aktuelle Score-Linie nicht als Geschwisterroute übernehmen.
- Engine, Choice-Resolver, LegalAction-ID, Executor und Planowner bleiben
  unverändert. Die Regel ist nicht an eine bestimmte Karte gebunden.
- Regressionstest:
  `packages/ai/src/plans/corp-turn-planner-selected-head.test.ts`

Identischer Lauf nach dem Fix:

- Match `match_f605bd005514f20c`, reguläres Ende nach 152 Aktionen,
  finaler StateHash `fnv1a:a63f2c17`
- Entscheidungen 39 bis 44 bleiben durchgehend beim exakten Root
  `plan:corp.score_agenda:agenda%3Acorp_onr_v1_203_hostile-takeover_2%3Aremote_1`.
- Die Aktionsfolge lautet Operation, Agenda installieren, dreimal
  `advance_card`, `score_agenda`; erst danach folgt `end_turn`.
- Ergebnis: Runner gewinnt durch `corp_deck_empty`; Corp erzielt eine Agenda.
- 152 gespeicherte Entscheidungen, keine Fallbacks, keine Timeouts und keine
  Maintenance-Diagnosewarnung.

Status: behoben und in beiden identischen Seed-/Deck-Replays verifiziert.

## SP-003 – gleichrangiger Support verdrängt exakte Score-Linie

Der Reproduktionsvertrag entspricht SP-002.

Vor dem ergänzenden Fix:

- Match `match_f605bd005514f20c`, Entscheidungen 145–149,
  StateHash `fnv1a:a63f2c17`
- Vor Entscheidung 145 waren R&D leer, 8 Credits und 3 Klicks vorhanden.
  `Overtime Incentives` ließ 4 Credits und 4 Klicks zurück. Damit waren
  Hostile Takeover installieren, dreimal advancen und kostenlos scoren exakt
  erreichbar.
- Entscheidung 146 wählte dennoch P3-Economy-Support für eine Tycho Extension,
  die nur `executable_with_support` war. Die anschließenden vier
  Basic-Credit-Aktionen verbrauchten die gesamte zusätzliche Action Capacity.
- Die grobe Obligation `priority-band:P3` ließ den unmittelbaren
  Economy-Scalar 210 gegen den Score-Scalar 155 gewinnen, obwohl der exakte
  Hostile-Root `executable_now` war.

Generischer Ursachen-Fix:

- Bei einer dringenden exakten Score-Linie veröffentlicht der TurnPlanner
  zusätzlich `urgent-exact-score-owner:<priority>`.
- Nur der exakte `corp.score_agenda`-Root erfüllt die Obligation; ein
  gleichrangiger Geschwister-Support verletzt sie.
- Planowner, Root, Executor, LegalAction-ID und Choice-Autorität bleiben
  unverändert.

Identischer Lauf nach dem Fix:

- Match `match_665f42d9261b3676`, reguläres Ende nach 153 Aktionen,
  finaler StateHash `fnv1a:530f166a`
- Entscheidungen 145–150 bleiben beim exakten Root und führen über Overtime,
  Install, drei Advances und Score.
- Runner gewinnt weiterhin durch `corp_deck_empty`; Agenda-Punkte 2:2. Es gab
  keine Fallbacks, Timeouts oder Maintenance-Warnungen.

Status: behoben und im identischen Seed-/Deck-Replay verifiziert.

## Zyklusübergreifende Neubewertung des Score-Clusters

SP-002 und SP-003 zeigen zwei verschiedene technische Ausprägungen desselben
generischen Fähigkeitsproblems: Eine vollständig erreichbare Score-Linie darf
weder nach ihrer Auswahl noch in der gleichrangigen Head-Auswahl den exakten
Agenda-Owner verlieren. Der kombinierte Befund trägt deshalb die zwei
Ownership-Sicherungen und den gemeinsamen Regressionstest.

SP-001 bleibt trotz der Clusterverdichtung ein Verdacht. Dort ist eine
ausbleibende Konversion nach Schutz-Drawing sichtbar, aber noch keine zu den
Entscheidungen 93 und 104 erreichbare, eindeutig bessere LegalAction-Linie.
Die beiden behobenen Ownership-Fehler dürfen nicht ohne diese Gegenprobe auf
den älteren Fall übertragen werden.

## SP-004 – kumulierter Deck-out-Horizont

- Finales Match `match_e17749ea32acc45e`, Entscheidungen 29, 53 und 95;
  Vorläufer `match_665f42d9261b3676`, Entscheidungen 29, 53 und 134
- Im finalen Lauf leeren 13 erfolgreiche Pflichtziehungen und fünf frühe
  freiwillige Draws das R&D exakt: `18 - 13 - 5 = 0`. Beide gestohlenen
  Agenden stammen aus Remotes.
- Night Shift bei D29, Annual Reviews bei D53 und Basic Draw bei D95 liegen
  einzeln noch außerhalb des kurzen Pflichtzieh-Horizonts. Ihr unmittelbarer
  Economy-/Defense-Nutzen ist erkennbar; der langfristige gemeinsame Preis
  bleibt prüfbedürftig.

Status: Verdacht. SP-009 schließt nur die eindeutig unsafe späte
Plangrenzenumgehung. Neue Fälle für SP-004 müssen weiterhin Pflichtzüge,
Siegzeit und konkreten Draw-Nutzen über mehrere Züge vergleichbar machen.

## SP-005 – zentrale Defense-Verteilung

- Finales Match `match_e17749ea32acc45e`, Entscheidung 138; Vorläufer
  `match_665f42d9261b3676`, Entscheidung 75
- Corp legte eine dritte ICE-Schicht auf HQ, während R&D nur einfach geschützt
  blieb. Das öffentlich sichtbare HQ Interface begründet zusätzliche
  HQ-Abwehr; der wiederholte Befund zeigt zugleich den Preis für andere
  Server.

Status: Verdacht. Es fehlt ein zustandsgenauer Vergleich der legalen
Installationsziele und ihres Threat-Werts ohne nachträgliches Wissen über den
R&D-Zugriff.

## SP-006 – nicht voll finanzierbare Score-Remote

- Finales Match `match_e17749ea32acc45e`, Entscheidungen 74–76 und 139;
  Vorläufer `match_665f42d9261b3676`, Entscheidungen 85–88
- Corp bereitet zunächst Hostile Takeover mit zwei Advances und später eine
  weitere Hostile Takeover ohne Advance vor. Der Runner besitzt in beiden
  Situationen öffentlich passende Wall-/Code-Gate-Breaker und genügend
  Credits; beide Agenden werden aus der Remote gestohlen.
- Zyklus 013 ergänzt vier weitere Scorefenster in
  `match_ec5b2d5b75e389b9` (D341, D453, D494 und D552). Die Engine-Routen
  binden jeweils mindestens die Hälfte der allgemeinen Runner-Liquidität;
  der Runner rekapitalisiert sich danach trotzdem und stiehlt. Das erhöht
  die strategische Evidence, belegt aber weiterhin keine einzelne sicher
  bessere Corp-LegalAction.

Status: Verdacht. Die Risikoanzeichen sind stark, doch für einen Fix fehlen
eine belegte bessere LegalAction-Linie und die genaue Zuordnung zwischen
Score-Owner, Defense-Support und Rez-Budget-Prognose.

## SP-007 – wiederholte Archives-Runs ohne belegten Payoff

- Finales Match `match_e17749ea32acc45e`, Entscheidungen 122 und 131;
  Vorläufer `match_665f42d9261b3676`, Entscheidungen 113 und 121
- Die wiederholten Runs waren legal und billig, der Detailtrace weist aber
  gegenüber Draw oder Credit keinen unmittelbaren Informations-, Karten- oder
  Tempoertrag aus.

Status: Verdacht. Erst weitere Fälle mit vollständigem Alternativenvergleich
können zeigen, ob ein generisches Run-Ziel- oder Low-Payoff-Muster vorliegt.

## SP-008 – Coverage-Owner materialisiert nicht alle beanspruchten Antworten

Gemeinsamer Reproduktionsvertrag ist der Seed und die Deckpaarung dieses
Zyklus. Nach dem Main-Abgleich scheiterten sowohl der Workbranch
`match_5d3fcc740a02c228` als auch die identische aktuelle Main-Basis
`match_1d9102cdac482cab` bei D23 mit `missing_plan_module_coverage`.

- In der Runner-Hand lag zuerst der bei drei Credits unbezahlbare Worm mit
  Installationskosten vier, danach der kostenlos legal installierbare Krash.
- `runner.rig_and_coverage` beanspruchte beide rollenpassenden
  Installationsaktionen, materialisierte aber nur Action-IDs der ersten
  Handantwort. `runner.develop_board_and_hand` durfte den bereits beanspruchten
  Krash nicht übernehmen.
- Der generische Fix sortiert alle legalen Coverage-Antworten deterministisch
  nach ihrem Wert und veröffentlicht ihre Action-IDs beim Rig-Plan.
  Spezialisierte exakt gebundene Recovery-Routen bleiben eng gebunden.
- Im finalen Match `match_e17749ea32acc45e` installiert D23 Krash über
  `runner.rig_and_coverage` mit 100 Prozent Abdeckung, identischem Root und
  Executor sowie ohne Fallback.

Status: behoben/verifiziert. Das nach Main-Abgleich sichtbare Problem wurde
mit dokumentierter Provenienz als reguläres Finding behandelt.

## SP-009 – Economy umgeht kurzen Pflichtzieh-Horizont

- Vor Fix: `match_c7144122aaeafb8b`, D126, drei Karten in R&D
- Basic Draw war bereits mit
  `corp_draw_admission:blocked_deckout_horizon` abgelehnt. Night Shift zog
  ebenfalls eine Karte, wurde aber über einen offenen `corp.economy`-Plan
  ausgewählt und reduzierte den Horizont auf zwei Pflichtziehungen.
- Der generische Fix wendet dieselbe Draw-Sicherheitsregel auf alle
  freiwilligen Corp-Aktionen mit zertifiziertem Kartenverbrauch an. Ein
  Economy-Owner darf die Ablehnung nicht überstimmen; nur ein exakt gebundener
  terminaler Score vor der nächsten Pflichtziehung ist ausgenommen.
- Im finalen Match `match_e17749ea32acc45e` weist D126 Night Shift als
  `corp.economy:explicitly_nonproductive` mit
  `remaining_after:2` aus. D126–D128 verwenden stattdessen drei Basic Credits
  desselben Score-Support-Parents. Die Niederlage verschiebt sich von D165 auf
  D176.

Status: behoben/verifiziert. Der spezifische sichere Horizont ist geschlossen;
die früheren kumulierten Draws bleiben getrennt als SP-004 offen.

## SP-010 – dringender Remote-Contest verliert seine Support-Fortsetzung

- Auswahlseed: `f2ed3237144d48778a6aaa69c14b6ddf`
- Spielseed: `selfplay-003-ea49c37c2f354872a7076d853d695814`
- Runner: Run til End, 45 Karten, `fnv1a:f89c68b9`
- Corp: Chrome Rush Bureau, 64 Karten, `fnv1a:2ebf0f5c`
- Ausgangslauf: Corp 10 – Runner 4, Agendapunkte 7:4
- Finales Replay: Runner 10 – Corp 4, Agendapunkte 7:4

Im Ausgangslauf kennt der Runner nach D54–D56 die rezzte Quandary vor einer
einmal entwickelten verdeckten Remote-Karte. Mit vier Credits, drei Klicks
und Wizard’s Book in der Hand ist Credit, Breaker installieren und Remote
erneut angreifen vollständig erreichbar. D57 wählt trotzdem HQ; der später
genommene Credit und die Breaker-Installation mit dem letzten Klick belegen
die versäumte Linie. Corp scoret anschließend Tycho Extension für vier Punkte.

Die Ursache hatte zwei gekoppelte Teile. Erstens verlangte die
Same-Turn-Coverage-Vorschau eine bereits aktuelle Installations-Action-ID,
obwohl die Engine sie vor dem Funding wegen eines fehlenden Credits noch nicht
legal veröffentlichen durfte. Zweitens blockierte nach der Installation die
allgemeine Credit-Reserve die Rückkehr zum Remote-Parent, obwohl der vollständig
bekannte Pfad garantiert, gefahrenfrei und kostenlos passierbar war.

Der Fix projiziert nur CardSpec-Kosten, Action Capacity und sichtbaren freien
Speicher; die konkrete Installation wird nach dem Funding als aktuelle
LegalAction rematerialisiert. Eine Null-Credit-Fortsetzung ist ausschließlich
für einen garantiert passierbaren Score-Threat-Pfad ohne unbekannte ICE,
Funding-Gap, konditionale Effekte, sichtbare Gefahren oder Trace-Risiko
zulässig. Im finalen Replay bleibt D57–D64 beim Remote-Root und stiehlt die
Vier-Punkte-Agenda. Ein fokussierter Ownership-Test sichert Credit,
Rematerialisierung, Installation, Root/Leaf und Rerun.

Status: behoben/verifiziert. Der identische Seed ändert den Sieger; aus Corp
10 – Runner 4 wird Runner 10 – Corp 4.

## SP-011 – zusätzliche R&D-Schichten ohne späteren Rez-Nutzen

Im finalen Replay des Zyklus 003 greift der Runner R&D wiederholt an. Corp
reagiert mit Sleeper, Data Wall 2.0 und Wall of Static als drei zusätzlichen
Schichten. Das sichtbare Runner-Rig besitzt zu diesem Zeitpunkt mit Wizard’s
Book und Worm genau die kostenlose Code-Gate-/Wall-Abdeckung. In den späteren
Rezfenstern lehnt Corp die drei ICE trotz ausreichender Credits als
unproduktiven Ressourcentausch ab; Runner stiehlt drei Agendapunkte aus R&D.

Der Verdacht lautet nicht, dass jedes Decline-Rez falsch war. Diese
Einzelentscheidungen sind gegen die kostenlose Breakerabdeckung plausibel.
Prüfbedürftig ist, ob `corp.defend_servers` bereits bei der vorherigen
Installation den geringen Grenznutzen derselben ICE-Typen ausreichend gegen
andere Server, Scoretempo und Economy abwägt. Für einen Fix fehlt noch der
zustandsgenaue Beweis einer konkret legalen, messbar besseren Alternative.

Status: Verdacht. Der Fall verdichtet SP-005 vom reinen Serververhältnis hin
zur allgemeinen Frage, ob zusätzliche zentrale ICE-Schichten gegen bekannte
passende Breaker tatsächlich Zugriffsschutz erzeugen.

Zyklus 004 liefert die notwendige Gegenprobe: Shadoe Tag & Bag legt ebenfalls
zusätzliche zentrale ICE-Schichten, doch das sichtbare Rent-I-Con ist nur ein
selbstzerstörender Universal-Breaker. Jede weitere Schicht verbraucht reale
Credits oder eine weitere Breaker-Kopie und trägt zum späteren
Coverage-Ausfall des Runners bei. Das widerlegt SP-011 nicht, schränkt den
Verdacht aber menschenverständlich ein: Prüfbedürftig ist nicht „zusätzliches
ICE gegen irgendeinen sichtbaren Breaker“, sondern nur eine Schicht, deren
Grenznutzen gegen dauerhaft verfügbare, passende und nahezu kostenlose
Abdeckung nicht belegt ist.

## SP-012 – ausführbarer Plan und offener Supportbedarf widersprechen sich

- Auswahlseed: `ced7adaf85f1c327099d7b7bc9535f26`
- Spielseed: `selfplay-004-492b88128585eaac4fe73d7bff7d456d`
- Runner: Rent-I-Con: Das Shellspiel, 45 Karten, `fnv1a:518ccd75`
- Corp: Shadoe Tag & Bag, 48 Karten, `fnv1a:f0c0544f`
- Ausgangslauf: kein Endergebnis; KI-Abbruch beim Zwischenstand 2:6
- Finales Replay: Corp 10 – Runner 3, Agendapunkte 7:3

Der konkrete Verdacht war eindeutig reproduzierbar: Nach der Installation und
dem ersten Advance von Project Babylon bei sechs Corp-Agendapunkten nahm der
Runner D282 einen Credit. D283 und der wiederholte D284 scheiterten, obwohl
weiterhin legale Runner-Aktionen existierten. Die Diagnose erklärte den
Widerspruch exakt: `runner.contest_remote` meldete eine jetzt ausführbare
Route und gleichzeitig den älteren offenen Bedarf nach Wall-Abdeckung.

Das ist kein Kartenbewertungsproblem. Eine Planbewertung kann entweder ihren
aktuellen Route-Head ausführen oder zuerst gebundene Unterstützung benötigen;
beides zugleich ist unzulässig. Der Prioritätsvalidator stoppte deshalb
korrekt fail-closed. Der Fehler lag im gemeinsamen Assessment-Zulieferer der
Runner-Pläne.

Der generische Fix übernimmt einen gebundenen Support-`ResourceGap` nur noch,
solange der Parent keinen aktuellen Route-Head besitzt. Im identischen Replay
finanziert der Runner D282–D283, spielt D284 Social Engineering unter dem
bestehenden Remote-Owner, löst die Engine-Choices aus und stiehlt D300 Project
Babylon. Alle 327 Entscheidungen des fertigen Replays sind legal,
owner-konsistent und ohne Fallback oder Timeout.

Status: behoben/verifiziert. Der Fix verhindert den Runtimeabbruch und lässt
den bestehenden Remote-Plan seine alternative aktuelle Route ausführen. Der
spätere Runner-Verlust ist ein getrennt analysiertes Coverage-/Attritions-
Matchup: Im verbleibenden Deck existiert kein Wall-Breaker mehr, sodass die
letzte Subsidiary-Branch-Linie nicht legal passierbar ist.

## SP-013 – endliche Breaker zwischen frühem Payoff und spätem Matchpoint

Der finale Replay aus Zyklus 004 zeigt ein strategisches Lebenszyklusproblem,
aber noch keinen belegten Fehlzug. Rent-I-Con ist universell, zerstört sich
jedoch nach dem Run. Mehrere Kopien ermöglichen frühe zentrale Zugriffe; vor
der späteren dreifach geschützten Matchpoint-Remote ist keine Wall-Abdeckung
mehr vorhanden.

Der Verdacht lautet: Ein Planportfolio könnte endliche Coverage nicht nur je
aktuellem Run, sondern gegen vorhersehbare spätere Serverrollen reservieren.
Für einen Fix fehlt der Gegenbeweis, dass ein konkreter früher Verbrauch bei
damaliger Sicht weniger wertvoll war. Auch darf die KI keine unbekannte
spätere ICE-Zusammensetzung vorwegnehmen.

Status: Verdacht. Neue Fälle müssen frühen Zugriffswert, verbleibende Kopien,
sichtbare gegnerische Scorestrategie und spätere konkrete Coverage-Lücke
gemeinsam ausweisen.

## SP-014 – gleichwertige Installationsvarianten ohne Planabdeckung

- Auswahlseed: `fb0f32492012bf9d4cec7495cf187ec7`
- Spielseed: `selfplay-005-d0e715c051817d8f50363e8ccb5afafd`
- Ausgangslauf: `match_b920d5897a7fa766`, D99
- Finaler Replay: `match_a827f500dc378815`

Vienna 22 besitzt mehrere gleichzeitig legale Zahlungs- und
Programm-Trash-Varianten. `runner.pressure_central` dispositionierte nur die
kanonische Installation, obwohl alle Varianten dieselbe aktuelle
Quellinstanz und denselben strategischen Zweck besaßen. Die übrigen
LegalActions blieben ownerlos und lösten korrekt
`missing_plan_module_coverage` aus.

Der Fix überträgt die Zweckdisposition auf aktuelle semantische
Geschwistervarianten derselben Quellinstanz. Varianten mit bereits vorhandenem
Coverage-, Development- oder Spezialowner bleiben unberührt.

Status: behoben/verifiziert. Der identische Replay überschreitet D99; ein
fokussierter Ownership-Test sichert auch Bits- und Programm-Trash-Varianten.

## SP-015 – strukturiertes Suchfenster ohne Herkunftsbindung

Im ersten Replay nach SP-014 wählt der Coverage-Plan D154 Test Spin für eine
Code-Gate-Antwort. D155 kann die Choice nicht zurückbinden, weil die Engine nur
eine textuelle Source, aber keine strukturierten Quellfelder projiziert.

Der Fix ergänzt Quellinstanz und Quelldefinition im bestehenden
Choice-Vertrag. Der Resolver parst keinen Source-String und wählt weiterhin
nur die Payload der bereits vom Coverage-Plan gewählten Action.

Status: behoben/verifiziert. Der finale Replay führt die gebundene
Test-Spin-Suche aus und endet regulär.

## SP-016 – variable Rez-Variante ohne exakte Ressourcenaustausch-Quote

Im Zwischenreplay `match_a989710008cbc543` veröffentlicht die Engine für
Gatekeeper, Sandstorm und weitere variable ICE mehrere genaue Rez-LegalActions.
Die einzelne Kartenquote kennt vor dem Rez jedoch noch keine erzeugte
End-the-run-Subroutine. Dadurch lehnt `corp.defend_servers` sieben bezahlbare
Varianten als unbekannt ab. Nach D11 wird Project Venice aus HQ gestohlen.

Der Fix veröffentlicht die Ressourcenaustausch-Quote je aktueller Action-ID,
erhält die zertifizierten Variantenfelder in der AI-Eingabe und validiert
Kosten und Wirkung ohne Kartentext-Fallback. Im finalen Replay rezzt die Corp
D11 Gatekeeper mit einer End-the-run-Subroutine.

Status: behoben/verifiziert. Der letzte identische Lauf endet nach 440
Entscheidungen ohne Entscheidungsfehler; alle 39 angrenzenden
Corp-Rez-Routentests sind grün.

## SP-017 – Score-Stau bei dauerhaft agenda-gesättigtem HQ

Im finalen Zyklus-005-Replay liegen schon nach der ersten Pflichtziehung zwei,
ab dem zweiten Corp-Zug drei und später fünf Agenden in HQ. Die Corp erreicht
mehrfach neun bis sechzehn Credits, beginnt aber erst D411 eine Score-Remote
und erzielt keinen Punkt. Economy und Defense verlängern die Partie, während
der Runner 15-mal R&D angreift und vier Agenden für acht Punkte stiehlt.

Der Verdacht ist menschenverständlich zweischneidig: Zu frühe, unterfinanzierte
Remote-Installationen bleiben nach SP-006 riskant; dauerhaftes Warten auf eine
statische Vollschutzschwelle lässt zugleich HQ- und R&D-Exposition sowie das
gegnerische Rig wachsen. Benötigt wird deshalb ein gestufter, zustandsgenauer
Score-Stau-Vertrag statt einer pauschal niedrigeren Schutzschwelle.

Status: Verdacht. Vor einem Fix müssen ein konkreter früherer Installations-,
Schutz- und Advance-Pfad sowie sein Risiko gegenüber dem tatsächlich
gewählten Warten belegt werden.

Zyklus 006 liefert eine wichtige Gegenprobe. Nach deterministischer
Stabilisierung konvertiert Shadoe Tag & Bag vier Agenden sauber über denselben
`corp.score_agenda`-Owner und gewinnt 7:6. Das widerlegt SP-017 nicht: Die
Corp findet dort früh eine gestuft verstärkte Remote und konkrete
Overtime-Linien. Es zeigt aber, dass keine allgemeine niedrigere
Schutzschwelle nötig ist; gesucht wird weiterhin nur der Stauzustand, in dem
langes Warten selbst mehr Agendaexposition erzeugt als ein konkreter
gestufter Scorepfad.

Zyklus 008 verdichtet den Verdacht deckübergreifend. Tycho Ice Stack hält am
Ende zwei Vier-Punkte-Agenden in HQ. Von D5 bis D237 ist ein exakt gebundener
Score-Root 28-mal Auswahlursprung, erzeugt aber nur zwölf Draws, zehn Credits
und sechs ICE-Installationen. Keine Agenda wird installiert oder avanciert.
Der Runner zerstört währenddessen wiederholt die Infrastruktur von Remote 1
und stiehlt die zweite Agenda schließlich aus HQ. Der nächste Schritt ist nun
präziser: Die kumulierten Kosten des Wartens müssen gegen einen konkreten
gestuften Scorepfad quotiert werden; eine pauschale Schutzschwellen-Senkung
bleibt unzulässig.

Zyklus 009 liefert ein drittes, strategisch anderes Muster. Siren Fortress
bindet Score-Support an Wall of Static in Remote 1, beginnt danach aber mit
Cinderella in Remote 2 und Haunting Inquisition in Remote 3 zwei weitere
leere Schutzprojekte. In 14 Corpzügen wird keine Agenda installiert,
avanciert oder gescort; HQ Interface stiehlt am Ende zwei Agenden im selben
Run. Das verdichtet den Score-Stau, belegt aber noch nicht, dass die zweite
ICE-Schicht auf Remote 1 besser gewesen wäre: Ihre gemeinsame Rez-Finanzierung
war teurer, und die Engine zertifizierte für diese Alternative keine
unmittelbare zusätzliche Zugriffssenkung. Benötigt wird eine vergleichende
Quote aus vorhandener Investition, Anzahl unfertiger Score-Remotes,
Rez-Budget, öffentlicher Runner-Coverage und tatsächlich früher erreichbarer
Agenda-Konversion.

## SP-018 – Match-Identität verändert fachlich gleichen KI-Zufall

- Auswahlseed: `2a2ae05031d207c0a8b0f85df8161fbb`
- Spielseed: `selfplay-006-f5225f80419cf17644a329406d500a17`
- Runner: King of the Road, 45 Karten, `fnv1a:db67cbcc`
- Corp: Shadoe Tag & Bag, 48 Karten, `fnv1a:f0c0544f`

Die Ausgangsläufe hatten dieselben Starthände, divergierten aber D4: Data Wall
wurde einmal vor R&D, einmal vor HQ installiert. Die Match-ID war Teil des
Engine-Randomisierungszwecks und damit der Seedableitung. Nach dem ersten Fix
divergierten zwei Replays noch D123 zwischen zwei fachlich gleichwertigen
Breakern. Öffentliche StateHashes – ihrerseits matchabhängig – flossen in den
side-sicheren Planungsfingerprint und damit in stabile Line-Tie-Breaks ein.

Der Fix entfernt Transport- und Auditidentitäten nur aus fachlicher
Randomisierung und Planbewertung. Quote-Zuordnung, Matchvalidierung, Receipts,
StateVersion und Replay-Hashprüfung bleiben unverändert. Zwei finale
Realpfad-Replays stimmen über 342 von 342 Action-IDs, Actiontypen und Planowner
überein und enden beide Corp 10 – Runner 6 bei Agendapunkten 7:6.

Status: behoben/verifiziert. Fokussierte Tests sichern ICE- und
Trace-Randomisierung über verschiedene Match-IDs sowie den gemeinsamen
Planner-Identity-Vertrag.

## SP-019 – angefragte Tag-&-Bag-Quote bleibt ohne erklärten Grund unbekannt

Im kurzen Ausgangslauf `match_9b559755a4a11a9c` erkennt die Corp das
Deckziel `corp.tag_trace_punish`. Zwischen D32 und D48 liegen Chance
Observation, mehrere Scorched Earth und ausreichend werdende Credits vor.
Eine Punish-Route-Quote wird angefragt, bleibt aber unvollständig; die
Disposition nennt nur `corp_conditional_punish_action_quote_unknown`.

Der Trace belegt weder, dass eine Killlinie garantiert war, noch warum die
Engine-Quote unvollständig blieb. Ein Karten- oder Creditschwellen-Fix wäre
daher voreilig. Als nächste Verdichtung müssen die strukturierten
side-sicheren Incomplete-Gründe der Decision-local Quote persistiert und der
Zustand mit demselben Seed erneut ausgewertet werden.

Status: Verdacht. Der fachliche Owner ist bereits
`corp.execute_punish_sequence`; offen ist Quote-Evidence, nicht eine neue
Entscheidungsautorität.

## SP-020 – Matchpoint-Remote ohne verbleibende Wall-Abdeckung

Im finalen Zyklus-006-Replay stiehlt der Runner drei Agenden und erreicht sechs
Punkte. D222 scheitert ein Remote-Contest an einer erst im Run gerezzten Wall
of Static. Beim Stand 6:6 zeigt D334 eine vierfach geschützte Remote mit vier
Advancement-Countern. Der Runner besitzt 14 Credits, aber keine Wall-Abdeckung
in Hand; die eigene Deckrekonstruktion weist im Stack nur Raptor und Shaka als
verbleibende Sentry-Breaker aus.

Der Archives-Run ist deshalb kein bestätigter lokaler Fehlzug: Die
Matchpoint-Remote ist nicht passierbar und ein Draw kann keine passende
Deckrolle finden. Prüfbedürftig bleibt die frühere Metaebene: Hätte der Runner
vor der vollständigen Remote-Schichtung eine konkrete Coverage-, Funding-
oder Scoretempo-Linie wählen können? Erst ein solcher früherer
LegalAction-Beleg trägt einen generischen Fix.

Status: Verdacht und zugleich Matchup-Evidence. Die KI darf aus dem späteren
Verlust keine nicht vorhandene Coverage erfinden.

## SP-021 – Zentral-Payoff verliert ohne angereicherte Semantik seinen Owner

- Auswahlseed: `f63120f879a3d56d61329a653ba5f21d`
- Spielseed: `selfplay-007-1aad240bff9cc20537a132d45cf0aaa4`
- Runner: Mit Ansage: Der perfekte Coup, 45 Karten, `fnv1a:40d73253`
- Corp: Tycho Ice Stack, 45 Karten, 12 Agendapunkte, `fnv1a:32e3f739`

Vor Runner-D8 war R&D Mole eine sichtbare Handkarte mit legaler
Installationsaction. Die produktive Klassifikation verlangte jedoch
`sourceDefinitionId` oder den R&D-Targethinweis aus einer angereicherten
Kandidatenschicht. Der reale side-sichere KI-Input enthielt nur die
Quellinstanz; dadurch blieb die Action ownerlos und die KI stoppte
fail-closed.

Der Fix bindet die Quellinstanz an die sichtbare Handdefinition zurück und
nutzt den bestehenden generischen Kartenfähigkeits-Hint. Ist die passende
Zentralroute noch nicht tragfähig, disponiert `runner.pressure_central` die
Installation ausdrücklich als wartend. Es entsteht kein paralleler
Installationsowner.

Status: behoben/verifiziert. Zwei finale Replays durchlaufen die Fundstelle
und bleiben über 419 Entscheidungen vollständig identisch.

## SP-022 – regelbasierter Agendapunkt ohne Score-Owner

Vor Corp-D53 bot die Engine eine vollständige LegalAction: ein Klick und 12
Credits entfernen die aktive ACME-Verpflichtung und erzeugen einen
Agendapunkt. Die actiongebundenen Quote-Felder erreichten wegen des positiven
DTO-Allowlist-Vertrags die KI nicht; Economy, Handmanagement und Scoreplan
durften die Action daher zu Recht nicht erraten.

Der Input lässt nun ausschließlich Kosten, positiven Punktgewinn und aktive
Verpflichtungszahl passieren. `corp.score_agenda` revalidiert Quellregel,
StateVersion, Klicks, Credits und Wirkung und materialisiert daraus einen
`convert_agenda`-Step. Im finalen D53 bleibt Planowner und Executor exakt der
Scoreplan.

Status: behoben/verifiziert. DTO-, Owner- und ausgewählter Realpfadtest sind
grün; zwei finale Replays bestätigen dieselbe Actionfolge.

## SP-023 – matchentscheidender Remote-Contest bleibt nur eine Probe

In beiden finalen Replays besitzt der Runner D410 sechs Credits sowie
Matador, Psychic Friend und Boring Bit. Remote 1 enthält eine zweifach
avancierte verdeckte Karte hinter drei ICE; dieselbe Remote hatte schon eine
öffentlich gescorte Vier-Punkte-Agenda hervorgebracht. Der Runner erkennt
`score_threat` und startet den Contest. Nach Rez und Break von Filter liegt
noch ein unbekanntes ICE sowie die bekannte Data Wall vor. Die neu berechnete
Risikoreserve verschlechtert sich um einen Credit, der gebundene Vertrag ist
`probe_only`, und D414 jackt der Runner aus. D418–D419 avanciert und scoret die
Corp zum Sieg.

Menschenverständlich ist der Verdacht: Wenn Abbruch den sicheren Matchverlust
im direkt folgenden Corp-Zug bedeutet, muss der Plan dieses Risiko gegen die
unsichere Fortsetzung stellen. Die aktuelle Terminalerkennung kennt aber
nur einen fehlenden Punkt oder die generische Zwei-Punkte-Remote. Drei
fehlende Punkte plus eine öffentlich bereits gescorte Vier-Punkte-Agenda
werden noch nicht verbunden.

Status: hoch priorisierter Verdacht. Ein Fix benötigt eine side-sichere,
generische Next-Turn-Scorequote oder weitere Fälle. Eine Sonderregel für
Tycho Extension wäre unzulässig.

## SP-024 – Ergebnis meldet trotz Zugriffs null erfolgreiche Runs

Die Result-Snapshots beider finalen Replays melden acht gestartete, aber null
erfolgreiche Runs. Persistiert sind vier `access_card`-Ereignisse mit
`accessIndex: 0`; bei D219 folgt sogar ein Agendadiebstahl. Der vorhandene
reine Zählertest erwartet dieselbe Semantik, die gespeicherte
Result-Snapshot-Zahl widerspricht ihr jedoch.

Zwischenstatus nach Zyklus 007: Verdacht außerhalb der eigentlichen KI-Auswahl. Matchpunkte,
Agendapunkte, Sieger und Actionfolge sind nicht betroffen. Vor einem Fix muss
geklärt werden, ob Snapshot-Erzeugung, Delta-Persistenz oder ein veralteter
Laufzeitpfad die Abweichung erzeugt; ein nachgelagerter Ersatzwert wäre kein
Ursachenfix.

Zyklus 008 ist eine Gegenprobe: Der Result-Snapshot zählt 13 gestartete und
drei erfolgreiche Runs korrekt. Damit war ein allgemeines Fehlen der Zählung
widerlegt; der konkrete laufzeitabhängige Pfad wurde später als SP-047 über
weitere Zyklen verdichtet.

Status: behoben/verifiziert durch SP-047. Ursache war die kompakte
Action-Persistence, die bei langen Partien den `accessIndex` älterer Events
verlor; der Resultpfad ist nun auf identischen Seeds vollständig belegt.

## SP-025 – Coverage-Draw wird innerhalb desselben Zuges neu zugelassen

- Auswahlseed: `c8d449f120fc55a5b7566e6044e584a4`
- Spielseed: `selfplay-008-55db67ce8f2128515b476c79acb0aced`
- Runner: Proteus Runner – Breaker Lab & Virus Pressure, 45 Karten,
  `fnv1a:70ae3c9a`
- Corp: Tycho Ice Stack, 45 Karten, `fnv1a:32e3f739`

Im Ausgangslauf `match_ebc151e8a1be1520` zieht der Runner in mehreren Zügen
mit allen vier Klicks. Jeder Draw verändert die private Hand und lässt
denselben Coverage-Bedarf wieder wie eine neue strategische Gelegenheit
erscheinen. Der Runner verwirft überzählige Karten, startet nur einen Run und
verliert Corp 10 – Runner 0.

Ein erster enger Fix begrenzte nur einen Gap-Erzeuger; der Zwischenlauf
`match_87856c3dcdca58ea` zeigte weiterhin bis zu vier Coverage-Draws pro Zug.
Der endgültige Vertrag rekonstruiert aus der öffentlichen Aktionshistorie
einen gemeinsamen endlichen Coverage-Draw-Takt. Suche, Installation und
Funding bleiben verfügbar; nur ein exakt terminaler Remote-Bedarf darf die
Cadence überstimmen.

Status: behoben/verifiziert. Zwei finale Replays enden nach je 258
Entscheidungen Runner 10 – Corp 0 und stimmen in allen Action-IDs,
Actiontypen und Planownern überein.

## SP-026 – exakte Breaker-Vorbereitung hat keinen Run-Owner

Im Zwischenlauf `match_7949f3aff19b8b5a` erkennt die Runanalyse vor D134,
dass Morphing Tool für einen konkreten Pfad genau einen sichtbaren Subtyp
wählen muss. Credits und Klick sind quotiert, aber Quellinstanz, Definition
und Subtyp fehlen im Route-Vertrag. Die aktuelle LegalAction bleibt deshalb
ownerlos und die Runtime stoppt korrekt fail-closed.

Der Fix erhält diese drei Bindungen in der bestehenden Runroute. Der
Run-Parent veröffentlicht einen exakten Coverage-Bedarf, den ausschließlich
`runner.rig_and_coverage` mit `prepare_coverage` ausführt. Subtypwechsel ohne
gebundenen Runbedarf werden ausdrücklich abgelehnt; der Resolver erhält keine
zweite Entscheidungsautorität.

Status: behoben/verifiziert. Positive und negative Ownership-Tests sowie
beide vollständigen finalen Replays sind grün.

## SP-027 – Handüberlauf belegt den vorbereiteten Score-Server

- Auswahlseed: `422509eecc6c66945c0f14fe281ffcd9`
- Spielseed: `selfplay-009-21da56ae2f888799758d45f51a286ada`
- Runner: Skivviss Mill Pressure, 45 Karten, `fnv1a:4ff6aee1`
- Corp: Siren Fortress, 45 Karten und 25 Agendapunkte,
  `fnv1a:addfa55f`

Im Ausgangslauf installiert der exakte Tycho-Scoreparent D166 Wall of Static
als Schutz in eine neue Remote und zieht D167 nach weiterer Vorbereitung.
Handmanagement verwendet D168 dieselbe Remote für Corporate Negotiating
Center. Die dort weiterhin gebundene Agenda kann anschließend nicht mehr
installiert werden. Ein enger Fix schützte nur die unmittelbare
Letzter-Klick-Fortsetzung; der vollständige Zwischenreplay zeigte denselben
Konflikt D184 im Folgezug erneut.

Der endgültige generische Vertrag reserviert die Remote für
Nicht-Agenda-Overflow, solange ein aktueller exakter Agenda-Parent sie
adressiert und entweder die Letzter-Klick-Fortsetzung besteht oder dort
bereits ICE als Scorevorbereitung liegt. Handmanagement dispositioniert nur
die konkurrierende Installation; Score-, Agenda- und ICE-Ownership ändern
sich nicht.

Status: behoben/verifiziert. Sechs fokussierte HQ-Overflow-Tests und zehn
angrenzende Disposition-Contributor-Tests sind grün. Zwei finale
Realpfad-Replays stimmen über 264 von 264 Action-IDs, Actiontypen, Root- und
Executor-Plänen überein.

## SP-028 – Schutzaufbau verteilt sich auf mehrere leere Score-Remotes

Nach der Serverreservierung bleibt Remote 1 frei und enthält Wall of Static.
Der Score-Support installiert D185 Cinderella dennoch in eine neue Remote 2
und D200 Haunting Inquisition in eine neue Remote 3. Eine Agenda gelangt nie
in eine Remote. Der Runner gewinnt 10:0 bei Agendapunkten 10:0 durch
wiederholten HQ-Druck und HQ Interface.

Menschenverständlich lautet der Verdacht: Die Corp kauft mit drei
angefangenen Servern Zeit, führt aber keinen davon zu einem tatsächlich
scorebaren Projekt. Eine pauschale Regel „immer den bestehenden Server
verstärken“ wäre trotzdem nicht belastbar, weil die zweite Schicht teurer zu
rezzen war und keine zertifizierte unmittelbare Zugriffssenkung besaß.

Die erste Gegenprobe nach einem engen Fundingfix blieb über 264
Entscheidungen vollständig unverändert. Sie zeigte, dass nicht die Summe der
bereits liegenden Rez-Kosten allein, sondern zusätzlich eine asymmetrische
Vorfinanzierungsregel wirkte: Eine neue erste Schutzschicht durfte langfristig
vorbereitet werden, die genau zur üblichen Remote-Reife fehlende zweite
Schicht nicht. Außerdem hatte der lokale Trace Breaker-Creditverbrauch,
Stop-, Tax-/Damage- und Encounter-Störungswert fälschlich mit „keine
Zugriffswahrscheinlichkeitsreduktion“ gleichgesetzt.

Der generische Fix erkennt diese bekannten Effekte als Schutzfortschritt,
behandelt vorhandene unrezzte ICE als alternative und nicht zwingend gemeinsam
zu finanzierende Rez-Routen und erlaubt unter denselben engen Sicherungen die
zweite Reifeschicht. Die Ausnahme endet bei zwei Schichten und erzeugt weder
blindes Layern noch ein dauerhaft festgelegtes Score-Remote.

Status: behoben/verifiziert. Im finalen Realpfad-Replay
`match_7597acdd221583e2` installiert derselbe Defense-Leaf D166 Wall of Static
in Remote 1 und D167 Cinderella als zweite Schicht genau dort. Bis D166 ist
die Actionfolge identisch; bis zum regulären Ende D183 existiert keine weitere
Remote. Zwei fokussierte Ownership-Regressionen und 69 angrenzende Tests sind
grün.

## SP-029 – Defensive Server-Upgrades besitzen keinen Defense-Planpfad

Im finalen SP-028-Replay hält HQ sechs später stehlbare Agendapunkte und wird
vom sichtbaren HQ-Interface-Plan bedroht. Rio de Janeiro City Grid ist D167
legal auf HQ installierbar und besitzt einen bekannten wiederholten
End-the-run-Effekt, wird aber ausschließlich vom Handmanagement betrachtet und
dort mangels Hand- oder Parentbedarf ausgeschlossen. Im Referenzlauf gelangt
Rio erst einen Klick später wegen HQ-Overflow auf HQ; im finalen Lauf fehlt
dieser zufällige Umweg, und der Runner beendet das Match im nächsten HQ-
Multiaccess.

Menschenverständlich lautet der Verdacht: Defensive Root-Upgrades können
aktuell nicht gemeinsam mit ICE, zentralem Agenda-Risiko und Scoretempo
bewertet werden. Der einzelne Seed belegt Relevanz, aber noch nicht, wann die
Upgrade-Route ICE, Credit-Aufbau oder Scorefortschritt generisch verdrängen
soll.

Status: Verdacht. Weitere Fälle müssen LegalAction, exakten Kosten-/Effektwert,
Zentraldruck und Alternativpfade gemeinsam liefern; die Evidence wird mit
SP-005 und SP-011 verdichtet.

## SP-030 – terminale Runner-Route verliert ihren ausführbaren Kopf

In zwei Zwischenläufen war ein konkreter Remote-Contest bereits als aktuelle
LegalAction gebunden. Ein allgemeines Matchpoint-Fokussignal ersetzte danach
den Route Head durch einen nicht ausführbaren Platzhalter. Derselbe
Vertragsbruch zeigte sich bei einer exakt benötigten Top-of-Heap-Recovery und
bei Zugriffsvarianten: Metadaten über Dringlichkeit oder möglichen Payoff
blieben erhalten, die gegenwärtig ausführbare Aktion aber nicht.

Der generische Fix lässt Ziel, Action-ID und Executor beim vorhandenen
Run-Parent. Ein Matchpoint-Signal erhöht nur dessen Priorität. Recovery wird
bei exakt belegtem Coverage-Bedarf als Support desselben Parents gebunden.
Ein bekannter bezahlbarer Trash-Zugriff bleibt Contest; eine wiederholte
R&D-Probe trägt einen endlichen Informationszweck statt unbeschränktem
Run-Spam.

Status: behoben/verifiziert. Die finalen drei Seeds enden ohne ownerlosen
terminalen Runpfad oder Platzhalterübernahme. Ownership-Tests sichern, dass
weder Action-ID noch Executor oder Planowner wechseln.

## SP-031 – Programm-Trash-Installation ohne vertretbares Opfer

Mehrere LegalActions konnten dieselbe Karte direkt, gehostet oder durch das
Trashen eines installierten Programms ins Spiel bringen. Die bisherige
Variantenbehandlung konnte die aufwendigere Programm-Trash-Route vorziehen,
ohne ein konkretes Opfer als strategisch vertretbar zu belegen. Damit war die
Installation formal legal, aber die eigentliche Ressourcenentscheidung nicht
vom zuständigen Plan getroffen.

Der Development- beziehungsweise Run-Support-Owner ordnet direkte vor
gehosteten und Programm-Trash-Varianten. Letztere ist nur ausführbar, wenn ein
exakt benanntes installiertes Programm den aktuellen Coverage-, Run- und
Entwicklungsbedarf nicht untergräbt. Fehlt dieser Nachweis, bleibt die Route
fail-closed statt ein beliebiges Opfer zu wählen.

Status: behoben/verifiziert. Positive und negative Variantenregressionen
sichern Quellinstanz, Opfer, Plan, Step und unveränderte Choice-Autorität.

## SP-032 – Engine veröffentlicht einen später abgelehnten Run-Start

Im Zwischenlauf `match_17fabf2b8c4f877c` erschien in Zustand 212 eine
karten- oder servergebundene Run-Aktion in `LegalActions`, obwohl die
gemeinsame Run-Start-Zulässigkeit den Server sperrte. `applyAction` prüfte
korrekt erneut und lehnte die Aktion ab. Der Fehler lag damit nicht in der
KI-Auswahl, sondern in einer unvollständig gefilterten Engine-Aktionsfamilie.

Der Ursachenfix führt jede Basic-, Karten- und servergebundene
Run-Start-Aktion durch `evaluateRunStartEligibility`. Die KI erhält keine
Sonderbehandlung und rekonstruiert keine Regel.

Status: behoben/verifiziert. Der fokussierte Roving-Submarine-Gegenfall und
die drei finalen Realpfadpartien sind grün; kein `applyAction`-Widerspruch
tritt erneut auf.

## SP-033 – sichere Restklicks oder terminales Abwarten

Im Zwischenlauf `match_5ea445b755c1a8c9` hatte der Runner drei Klicks und
eine exakte Basic-Credit-LegalAction, nachdem alle stärkeren Pläne beendet
oder korrekt verworfen waren. Die bereits erfüllte allgemeine Creditreserve
ließ dennoch keinen Owner zu. Ein erster Restkapazitätsfix zeigte im breiten
Test den Gegenfehler: Er hätte am Matchpoint ein regelbewiesenes günstiges
Corp-Deckout-Abwarten verdrängt.

Der enge P6-Vertrag setzt höchstens die beim Erkennen verbleibenden Klicks in
Credits um und verschiebt sein Ziel nicht nach jeder Ausführung. Er gilt nur,
wenn kein stärkerer Plan handelt, und wird bei belegtem terminalem Abwarten
vollständig unterdrückt.

Status: behoben/verifiziert. Regressionen decken die positive Restkapazität,
den Fall unterhalb des Matchpoints und die terminale Deckout-Priorität ab.

## SP-034 – zusätzliche Pflichtziehung verkürzt die Scoredeadline

Im langen dritten Seed stand die Corp bei sechs Agendapunkten und hatte eine
gewinnbringende Agenda in HQ. Wegen eines öffentlichen Skivviss-Counters zog
sie pro Corp-Drawfenster zwei Pflichtkarten. Die Engine lieferte den korrekten
Zähler, die positive AI-DTO-Allowlist entfernte ihn jedoch. Die Scoreline
teilte deshalb nicht durch die tatsächlichen Pflichtkarten je Fenster und
bewertete den letzten belastbaren Install-/Advance-Horizont als später.

Der DTO-Vertrag bewahrt die Engine-Zähler. Der Scoreplan berechnet die
verbleibenden vollständigen Drawfenster und darf im letzten belastbaren
Matchpointfenster die exakt gebundene Agenda installieren, auch wenn die
gewöhnliche volle Schutzreserve nicht mehr erreichbar ist. Die spätere
Gegnerantwort bleibt bewusst ungeplant.

Status: behoben/verifiziert. Vor dem Fix endete der vergleichbare Lauf trotz
sechs Corp-Punkten durch leeres Corp-Deck. Im finalen
`match_8f7acfff2b3351cd` installiert und avanciert die Corp im letzten
Fenster; der Runner muss reagieren und gewinnt erst danach durch
Agendapunkte 7:6.

## SP-035 – reife Remote wird trotz zweier bezahlbarer Layer erneut geschützt

Im ersten Seed von Zyklus 011 hatte der exakte Scoreplan eine bereits mit zwei
ICE geschützte Remote. Deren öffentliche Engine-Quotes belegten Tax- oder
Damagewirkung und vollständige Bezahlbarkeit einschließlich Rez-Nebenkosten.
Die bisherige Scorebewertung verlangte dennoch erneut denselben allgemeinen
Protection-Vertrag. Der nachgelagerte Defense-Scan bewertete den Zustand ein
zweites Mal und ersetzte die Agenda-Konversion durch weiteres Layering.

`corp.score_agenda` darf den längeren Scorehorizont jetzt nur mit einem
aktuellen, server- und `stateVersion`-gebundenen Zertifikat über genau zwei
bezahlbare Engine-gequotete Layer annehmen. `corp.defend_servers` erhält
dadurch keine neue Scoreautorität; es erkennt lediglich, dass der zuständige
Parent die Schutzfrage bereits exakt beantwortet hat. Eine feste Core-Remote
oder ein pauschales Zwei-Layer-Limit entsteht nicht.

Status: behoben/verifiziert. Der Planowner bleibt `corp.score_agenda`; der
Regressionstest verbietet zusätzliche Defense- und Fundingrouten. In den drei
finalen Replays entstehen keine parallelen leeren Score-Remotes aus diesem
Fehlerbild.

## SP-036 – sichtbarer unbezahlbarer ICE-Schaden wird vor dem Run ignoriert

Seed 3 zeigte früh öffentlich sichtbaren ICE-Schaden, dessen Breakkosten die
aktuellen Runner-Credits überstiegen. Runzielbewertung und Jack-out-Fenster
kannten weder den Damage-Typ der effektiven Subroutine noch eine gemeinsame
Lethalitätsbewertung. Dadurch begann oder setzte der Runner einen Run fort,
obwohl Hand und aktuelle Prävention den Schaden nicht tragen konnten.

Die Engine projiziert den öffentlichen Damage-Typ nun zusammen mit der
effektiven Subroutine. Eine gemeinsame Runner-Bewertung zieht aktuelle
Run- und Net/Core-Prävention ab und prüft nur sichtbare, exakt gebundene
Quotes. Sie blockiert den Runstart oder wählt im bestehenden
`runner.convert_run_window`-Leaf Jack-out; sie errät keine verdeckte ICE.

Status: behoben/verifiziert. DTO-, Projektions-, Runziel- und
Plan-Ownership-Regressionen sichern den Vertrag.

## SP-037 – exakte Encounter-Aktion fällt aus dem Runfensterplan

Ein Continue-/Encounter-Kandidat konnte planlokal exakt admissible sein, aber
ohne Server-ID aus der generischen Runfenster-Kandidatenliste fallen. Im
Deflector-Fall genügte außerdem eine formal vorhandene Pump-/Breakroute, um
Continue auszuschließen, selbst wenn genau diese Route durch den bestehenden
Planstep-Vertrag verworfen werden musste.

Die Kandidatenliste akzeptiert jetzt die bereits vom Runfensterowner
erzeugten exakten Encounter- und Runfenster-Evidencecodes. Bei der
Deflector-Abgrenzung zählt eine Breakroute nur, wenn sowohl Encounter- als
auch Planstep-Ausschluss fehlen. Es entsteht kein zweiter Resolver und keine
neue Zielwahl.

Status: behoben/verifiziert. Der fokussierte Laufzeitgegenfall sichert Root,
Leaf, Step, Action-ID und Executor.

## SP-038 – Core Damage ist erst in der Cleanup-Phase tödlich

Nach dem ersten sichtbaren Schadensfix absorbierte der Runner in Seed 3 drei
Core Damage mit genau drei Handkarten. Das war unmittelbar legal, senkte aber
seine effektive maximale Handgröße unter null; die determinierte
Cleanup-Flatline blieb in der Gefahrenbewertung unberücksichtigt. Der
Zwischenlauf endete deshalb in Entscheidung 218 weiterhin durch Flatline.

Die gemeinsame sichtbare Schadensbewertung trennt nun unmittelbare Flatline
von der bereits feststehenden Cleanup-Flatline und schreibt beide Gründe in
die Evidence. Prävention und bezahlbare Breakrouten werden unverändert vorher
abgezogen.

Status: behoben/verifiziert. Mit demselben Seed endet der finale Lauf erst
nach 281 Entscheidungen durch Agendapunkte 7:3 für die Corp statt durch
Flatline 0:0.

## SP-039 – unbekannte Folgeauswirkung verdeckt sichere Unbezahlbarkeit

Im ersten Seed lehnte die Corp das Rezzen von Glacier ab. Die öffentliche
Ressourcenaustauschquote wurde vollständig unbekannt, weil der verwendbare
Breaker nach erfolgreichem Brechen noch Stealth verlieren würde. Der Runner
konnte jedoch bereits die direkten Pump-/Breakkosten nicht bezahlen; die
Folgewirkung konnte diese Route daher logisch nicht wieder ausführbar machen.

Die Engine zertifiziert nun ausschließlich diese monotone Untergrenze:
Ist die direkte Route unbezahlbar, bleibt `runnerBreak.canPay = false` trotz
noch nicht modellierter nachgelagerter Verschlechterung exakt. Kann der Runner
die direkte Route bezahlen, bleibt die Quote bis zur vollständigen Abbildung
der Folgeauswirkung weiterhin fail-closed unbekannt.

Status: behoben/verifiziert. Im finalen Seed 1 rezzt
`corp.defend_servers` Glacier in D278 bei unveränderter Ownership. Der Runner
stiehlt die Agenda nicht; die Corp scoret später einen weiteren Punkt.

## SP-040 – viele HQ-ICE, aber keine bezahlbare Verteidigungsbreite

Im zweiten finalen Seed liegen sechs ICE auf HQ, doch nur die günstige
Brain-Drain-Schicht ist aktiv. Im letzten Corpzug werden alle drei Klicks in
Credits umgewandelt; sechs Credits reichen gegen den Runner nur für diese
eine bereits bekannte Schicht, während die übrigen Rezpfade zwei bis zehn
Credits kosten und teilweise zusätzliche Anforderungen tragen. Der Runner
bezahlt die bekannte Schicht und stiehlt die letzte Agenda.

Status: Verdacht. Das Muster verdichtet SP-005, SP-011 und SP-029 zu einer
langfristigen Liquiditätsfrage: nominelle Layerzahl ist kein Schutz, wenn das
Portfolio nicht rechtzeitig finanzierbar wird. Noch fehlt ein früher
gespeicherter Zustand, in dem eine konkrete alternative ICE-Platzierung,
Economy- oder Score-LegalAction nachweislich dominiert.

Zyklus 017 verdichtet die Frage mit **Original Speed v1.0** in drei weiteren
Seeds. Die Corp scoret 3, 3 und 4 Punkte, verliert aber entwickelte Remotes
und im zweiten Seed einen R&D-Mehrfachzugriff bei einem ausgewiesenen
Protection-Funding-Gap von sechs bis sieben Credits. Die Angriffsziele
wechseln zwischen HQ, R&D, Archives und Remote; weiterhin ist keine einzelne
frühere Economy-, Placement- oder Score-LegalAction als dominierend belegt.

## SP-041 – letzter Score verbraucht mögliches Deckout-Verteidigungsfenster

Im ersten finalen Seed startet die Corp ihren 39. Zug mit einer Karte in R&D
und ohne Skivviss-Counter. Sie scoret auf drei Agendapunkte. Der nächste
erfolgreiche R&D-Run erzeugt den Counter; das folgende Corp-Drawfenster leert
das Deck. Hätte die Corp den Score verschoben, hätte sie einen Agendapunkt
behalten und Glacier zu Beginn eines späteren Runs nach R&D bewegen können.

Status: Verdacht. Diese Linie beweist noch keinen besseren Ausgang: Die Corp
lag nur 1:5 zurück und ein gewinnfähiger Mehrzugpfad ist nicht gequotet. Der
Fall verbindet aber Deckout-, Score- und Defense-Horizont und bleibt mit Seed,
Match und Schlusszustand reproduzierbar.

## SP-042 – freiwilliger Ressourcen-Self-Trash ohne Owner

Seed `selfplay-016-30432ef7f68144d18d945dc6ca1aa134` reproduzierte in
`match_195e8201e42429f7` D150 eine Engine-legale, strukturierte
`trash_source_action` von Crash Space, die keine Runner-Domäne klassifizierte.
Der Plan-Kernel brach korrekt fail-closed mit `missing_plan_module_coverage`
ab.

`runner.resource_lifecycle` klassifiziert nun generisch genau den
quelltrashenden Capability-Vertrag `trash_source_action` und hält ihn ohne
bewerteten Nutzen `assessment_unknown`. Produktive Aktionen anderer Owner
bleiben unberührt; es gibt keinen Kartennamen-Sonderfall.

Status: behoben/verifiziert. Der fokussierte Ownership-Gegenfall und alle drei
finalen Replays sind grün.

## SP-043 – öffentlicher Zufallseffekt ohne Startfenster-Reihenfolge

Die kanonische Omnitech-Würfeltabelle war öffentlich vorhanden, wurde aber
nicht als `random_effect` in die Runner-Start-of-turn-Reihenfolge übersetzt.
Dadurch fehlte ein belastbarer Vorrang gegenüber Credit-Verlust und
Credit-Gewinn.

Kanonische Card-Facts validieren die vollständige Tabelle und ordnen
`random_effect > credit_loss > credit_gain`. Die KI zieht kein Ergebnis und
verbraucht keinen RNG; Zufall bleibt ausschließlich bei der Engine.

Status: behoben/verifiziert. Realdefinition, generischer Tabellengegenfall
und finale Replays sind grün.

## SP-044 – obligatorische Grip-Suche erzeugt transient zu viel MU

`match_fb43c71debcf0637` erreichte State 186 mit Boostergang und Wet Drive:
Der Effekt trashte Gripkarten, die dynamische MU sank, und vor Abschluss der
noch offenen obligatorischen Stack-zu-Grip-Auswahl war der Runner vorübergehend
über der Grenze.

Die Engine akzeptiert den Zwischenzustand ausschließlich beim exakt
gebundenen obligatorischen Grip-Such-Choice; nach Auflösung gilt wieder das
normale Memory-Invariant. Andere Choices und dauerhafte Überbelegung bleiben
fail-closed.

Status: behoben/verifiziert. Der Mechaniktest prüft Zwischen- und Endzustand;
die drei finalen Replays enden regulär.

## SP-045 – reife Zwei-Layer-Remote bleibt im Schutzloop

Im zweiten Seed lag Polymer Breakthrough bereits hinter zwei aktuellen,
bezahlbaren Engine-gequoteten Damage-Layern. `corp.score_agenda` blockierte
die Advance-Aktion dennoch am allgemeinen Schutzvertrag und wich auf Economy
aus.

Der bestehende Scoreowner darf für die installierte Agenda ein enges,
state- und servergebundenes Zertifikat über genau zwei bezahlbare Layer
verwenden. Mit nur einem Layer bleibt Advance blockiert; eine neue
Protection- oder Scoreautorität entsteht nicht.

Status: behoben/verifiziert. Ownership-Test und finale Replays sind grün;
Seed 1 erreicht anschließend ein knappes Corp-Scoretempo von 6 Punkten.

## SP-046 – gescorte Agenda verliert gebundene Free-Rez-Continuation

`match_c9e4247a322efa9a` scorete Priority Requisition korrekt unter
`corp.score_agenda`, scheiterte aber in D103 am nachfolgenden Enginefenster
mit `window_origin_missing`. Der zuständige Plan hatte das ICE-Ziel vor dem
zustandsändernden Score nicht gespeichert.

Kanonische Agenda-Facts lassen den Scoreowner ein bekanntes unrezztes Ziel
nach öffentlichem Rezpreis vorbinden. Der Resolver validiert nur die exakte
Quelle, Capability, Vorgängeraktion, Stateversion, LegalAction und Zielkarte
und vervollständigt die bereits gewählte Payload; er trifft keine neue
Server-, Karten- oder Strategieentscheidung.

Status: behoben/verifiziert. Der fokussierte Test sichert Root, Owner,
Action-ID, Executor und exaktes Ziel; der finale Seed 1 läuft über das Fenster
hinaus bis zum regulären 7:6-Agendaende.

## SP-047 – terminaler Erfolgsrun-Zähler widerspricht vollständigem Replay

Die Result-Snapshots von `match_3b813bf3dade0d63`,
`match_8a446ad66e82710e` und `match_04886d690d3ff917` melden 1, 5 und 3
erfolgreiche Runs. Die 771/771 vollständigen actor-private Snapshots enthalten
für dieselben Spiele zehn, elf und acht unterschiedliche Run-IDs mit
`successful: true` und Accessphase. Auch die persistierten Access-Events
enthalten deutlich mehr erste Zugriffe.

Zwischenstatus nach Zyklus 017: reproduzierbarer Infrastrukturverdacht. Die vorhandene
`successfulRunCountForResult`-Unit deckt nur synthetische Eventlisten ab. Vor
einem Fix muss die terminale Eventbasis des Result-Snapshots gegen Persistenz
und Zeitpunkt der Snapshot-Erzeugung abgegrenzt werden. Bericht oder UI
dürfen keinen stillen Ersatzwert berechnen.

Zyklus 018 liefert eine Gegenindikation und eine Bestätigung: Seed 1 und 2
stimmen mit einem beziehungsweise sieben erfolgreichen Runs zwischen Result
und vollständigen Run-Snapshots überein. In `match_8e8d8fa7b8772b55` meldet
das Result dagegen drei, während acht verschiedene Run-IDs die Accessphase
mit `successful: true` erreichen. Der Fehler ist damit nicht pauschal, aber
erneut real und wahrscheinlich zustands- oder zeitpunktabhängig.

Zyklus 019 bestätigt die Abweichung in allen drei Partien. Die Result-
Snapshots von `match_8f653fd3c48a0526`, `match_294cecc3d7918cea` und
`match_387c645a776a834b` melden 9/4/0 erfolgreiche Runs; die vollständigen
actor-private Snapshots enthalten 14/11/8 unterschiedliche erfolgreiche
Access-Run-IDs.

Zyklus 012 isoliert die gemeinsame Ursache. Beim actionweisen SQLite-Laden
blieben ältere Events als kompakter Kontext erhalten, ihr `accessIndex` ging
außerhalb des 80-Event-Tails jedoch verloren. Der terminale Result-Snapshot
zählte dadurch nur jüngere Erstzugriffe. `runCount` ließ zusätzlich
Event-Runs aus, obwohl deren öffentliche Events `runnerEventRun: true`
tragen.

Die kompakte Action-Persistence bewahrt nun genau `accessIndex` und
`runnerEventRun`. Der identische Drei-Seed-Vergleich ändert keine der 853
Action-/Planfolgen, aber korrigiert die Resultwerte von 6/3, 25/3 und 15/6
auf 8/8, 27/27 und 17/11 gestartete/erfolgreiche Runs.

Status: behoben/verifiziert. Die Lösung repariert die verursachende
Persistenzprojektion; Bericht und UI verwenden keinen Ersatzwert.

## SP-048 – CardSpec-Erfolgsrun verliert kanonische Identität und Planroute

Seed `selfplay-019-5aa0c35827a0408fb0fbd5cde498da3a` reproduzierte in
`match_faafeff8bf960065` D44 eine Credit-Subversion-Folgeaktion ohne
vollständigen Planvertrag. Die Engine ließ `abilityRef` und `effectRef` aus,
das AI-DTO entfernte Primitive und Effektmenge, und
`runner.convert_run_window` konnte die Action deshalb nicht exakt binden.

Die Engine bindet kanonische CardSpec-Primitives jetzt vollständig, die
positive DTO-Allowlist projiziert die notwendigen side-sicheren Felder, und
der bestehende Runfensterowner validiert Quelle, Capability, Run, Server,
Timingpunkt, Effektfamilie und positive Menge fail-closed.

Status: behoben/verifiziert. `match_294cecc3d7918cea` wählt dieselbe
Credit-Subversion-Action in D44 unter Root `runner.pressure_central` und Leaf
`runner.convert_run_window`; Action-ID, Executor und 100-Prozent-Coverage
bleiben erhalten.

## SP-049 – materialisierte Defense-Route kollidiert mit HQ-Overflow

Der Zwischenlauf `match_7288cb47af7f15c9` erreichte nach SP-048 D56. Dort
materialisierte `corp.defend_servers` die Installation von Olivia Salazar auf
Remote 1, während die generische HQ-Overflow-Logik dieselbe Action wegen des
reservierten Score-Servers als nicht produktiv klassifizierte.

Die gemeinsame Disposition-Arbitration prüft nun zuerst die exakt
materialisierten Defense-Action-IDs und wendet die Overflow-Ablehnung nur auf
die verbleibenden Kandidaten an. Andere reservierte Score-Server bleiben
weiterhin geschützt.

Status: behoben/verifiziert. In `match_294cecc3d7918cea` wählt D56 dieselbe
Olivia-Salazar-Installation unter `corp.defend_servers`; alle 15 LegalActions
sind konfliktfrei klassifiziert.

## SP-050 – nackte agendaexponierte Zentrale verliert gegen weitere Schicht

Seed `selfplay-012-4a042e9b889ce977981b8792b9b80355` zeigte in
`match_3d52426f1bfec0ce` D225 ein nacktes HQ mit Corporate Coup, 45 Corp-
Credits und einer legalen Quandary-Installation. `corp.defend_servers` legte
Quandary trotzdem als dritte Schicht auf R&D; der Runner lief unmittelbar auf
HQ und stahl die Agenda.

Der globale Zentralallokator erhält nun den vorhandenen ICE-Bestand je
Zentrale. Außerhalb terminaler Gefahr bekommt eine agendaexponierte völlig
offene Zentrale ihre erste wirksame Schicht, bevor die andere weiter
gestaffelt wird. Die Regel ist symmetrisch, ignoriert agenda-freie Zentralen
und weist keinem Server eine feste Rolle zu.

Status: behoben/verifiziert. Im finalen `match_7e537a30680ae0d0` ist HQ vor
dem kritischen Corp-Zug durch Hunter geschützt. Der Runner muss den späteren
Zugriff finanzieren; die Corp überlebt 420 statt 296 Entscheidungen und
scoret zwei statt null Agendapunkte.

## SP-051 – auf Funding verschobener Basisrun verliert Ownership

Der erste Replay nach SP-050, `match_d5f09452c77ff7cc`, erreichte D269. Ein
legaler HQ-Run war fachlich produktiv, sollte wegen der vollständigen
Jettison-/Trace-Kosten aber erst nach Funding erfolgen. Der Run blieb dabei
ohne ausdrückliche Disposition und der Plan-first-Pfad brach korrekt
fail-closed ab.

Basisruns auf HQ, R&D und Archives bleiben jetzt auch dann beim jeweiligen
`runner.pressure_central`-Owner, wenn dessen exakte Bewertung zunächst
Funding oder Vorbereitung empfiehlt. Economy darf nur diesen Support-Step
besitzen und weder Server noch Run-Action übernehmen.

Status: behoben/verifiziert. Der Regressionstest sichert Runowner,
Economy-Executor, Action-ID und vollständige LegalAction-Abdeckung; alle drei
finalen Seeds laufen ohne Coverage-Lücke durch.

## SP-052 – hohe Corp-Liquidität wird erst spät zur Scorelinie

Im finalen `match_7e537a30680ae0d0` hält Shadoe Tag & Bag Corporate Coup
ungefähr von Corp-Zug 17 bis zum Verlust in Zug 32. Die Corp erreicht 45 bis
über 70 Credits und verwendet viele Klicks auf Basiscredits, bevor sie ab Zug
45 eine belastbare Score-Remote baut und in Zug 49 zwei Punkte scoret.

Menschenverständlich lautet der Verdacht: Die Corp weiß zwar, dass einzelne
offene oder einschichtige Remotes gegen das sichtbare Anti-ICE-Rig zu schwach
sind, beziffert aber möglicherweise die kumulierten Kosten des langen
Wartens zu niedrig. Die gespeicherten Zustände beweisen noch keine einzelne
sicher bessere Install-/Schutz-/Advance-Sequenz; eine frühe Quandary-Remote
hätte unmittelbar fallen können.

Status: Verdacht. Weitere Seeds müssen bei sehr hoher Liquidität einen
konkreten mehrzügig gequoteten Gegenpfad zeigen, bevor Score- oder
Schutzschwellen geändert werden.

## SP-053 – No-Run-Economy-Hold verdrängt gegnerischen Matchpoint-Contest

Seed `selfplay-020-11dde778b49a45d0a0a160ddca15d572` reproduzierte in
`match_1d2972c61a85c449` nach dem Corp-Stand von 5:2 einen endlosen
`runner.recurring_economy`-Hold. Trotz legaler HQ- und Remote-Runs wählte der
Runner 72 Basiscredits, stieg bis 100 Credits und verlor mit nur sieben Runs
7:2. Der P3-Investmenthold verdrängte die bestehenden P4-Runowner.

Der Recurring-Economy-Owner gibt seinen Hold nun bei gegnerischem Matchpoint
und legaler Runoberfläche frei. Er wählt weder Server noch Action;
`runner.pressure_central`, `runner.contest_remote` und die Run-Target-
Evaluation bleiben alleinige Entscheidungsautoritäten.

Status: behoben/verifiziert. In `match_9fad13ecbda112d9` blockiert D189 den
Hold bei 2:5 und 55 Credits; `runner.pressure_central` wählt den HQ-Run. Der
Seed enthält danach 24 statt sieben Runs und endet 9:5 für den Runner. Der
schwache Hold ohne gegnerischen Matchpoint bleibt im Gegenfall erhalten.

## SP-054 – gezielte ICE-Entfernung besitzt keine durchgehende Runroute

In Zyklus 012 war eine erfolgreiche HQ-Vorbereitung für Core Command:
Jettison Ice isoliert wenig wertvoll. Ohne den späteren Payoff konnte
`runner.pressure_central` weder Run, öffentlich sichtbaren ICE-Slot,
Entfernungskosten noch Choice als eine Route bewerten. Zusätzlich ignorierte
die Engine bei Breaker-Actions einen aktiven Run-Spending-Cap.

Der Runowner preflightet jetzt die vollständige HQ-Erfolg-zu-ICE-Entfernung-
Linie und bindet Quelle, Server, exakten ICE-Slot und Kosten. Der Resolver
setzt nur das vorgebundene Ziel ein. Die Engine veröffentlicht Pump-/Break-
Actions nur innerhalb der verbleibenden Run-Ausgabegrenze.

Status: behoben/verifiziert. `match_7e537a30680ae0d0` führt die gebundene
Route in D48 und D103 aus; `match_f27f675ebd34e4d5` belegt sie in D102.
Ownership-, Choice- und Spending-Cap-Tests sind grün.

## SP-055 – Score-Staging verliert gegen gleichrangige Zentralverteidigung

Ein vorbereiteter P3-Scoreparent delegierte seine nächste Schutzschicht
korrekt. Bei gleicher Prioritätsklasse gewann dennoch eine generische
Zentralschicht, weil nur die unmittelbare Score-Schutzinstallation, nicht die
vorbereitende Staging-Variante parent-first behandelt wurde.

`corp.defend_servers` priorisiert nun auch die exakt delegierte
`score_protection_staging_install`-Route. Eine belastbar angegriffene
agendaexponierte HQ bleibt zugleich als Deadline-Fact erhalten, selbst wenn
R&D die aktuelle globale Zentralallokation gewinnt.

Status: behoben/verifiziert. In `match_7e537a30680ae0d0` materialisiert D254
die gebundene Schutzschicht vor dem neuen Score-Remote.

## SP-056 – parallele Runvarianten duplizieren terminalen Coverage-Bedarf

Basic- und Event-Run auf dieselbe Matchpoint-Remote erzeugten denselben
fehlenden Agenda-Punkt-Coverage-Bedarf mehrfach. Dadurch konnte ein einzelner
fachlicher Gap wie mehrere Supportpflichten wirken.

Die Runtime dedupliziert den Need über Remote, Capability und Parent. Die
konkreten Run-Actions bleiben getrennt und der bestehende
`runner.rig_and_coverage`-Owner allein zuständig.

Status: behoben/verifiziert. Der fokussierte Test sichert einen Need bei zwei
weiterhin getrennten Runvarianten; die finale Seed-3-Partie besitzt
vollständige Planabdeckung.

## SP-057 – Deckrest-Gleichstand wird nicht als Runner-günstig erkannt

Am Runner-Matchpoint akzeptierte der EndTurn-Vertrag ein Deckrennen nur, wenn
der positive Corp-Deckrest strikt kleiner als der Runner-Stack war. Wegen des
Pflichtzugs der Corp ist bereits Gleichstand Runner-günstig.

Das Gate verwendet nun `corpDeck <= runnerStack`, weiterhin nur nach
vollständiger expliziter Ablehnung sämtlicher freiwilliger Actions. Fehlender
Matchpoint, ein größerer Corp-Deckrest, unbekannte Alternativen oder ein
bereits leeres Corp-Deck bleiben gesperrt.

Status: behoben/verifiziert. Gleichstands- und Gegenfalltests sichern den
engen terminalen Vertrag.

## SP-058 – fail-closed KI-Fehlversuch ist nachträglich unvollständig

Ein Abbruch während Planwahl oder Engine-Anwendung ließ zuvor nicht in jedem
Fall erkennen, welche Phase, LegalActions, Action-ID und strukturierte Ursache
betroffen waren. Damit konnte ein klarer Selbstspielfehler zwar stoppen, aber
nicht immer als vollständiges Finding analysiert werden.

Die lokale Maintenance-Evidence speichert private
`ai-decision-failure-attempt-v1`-Einträge mit Phase, Checkpoint, Planfehler und
bei Apply-Fehlern exakter Actionbindung. Normale Antworten enthalten nur den
side-sicheren Fehlercode und eine opake Diagnosekennung.

Status: behoben/verifiziert. Choose- und Apply-Regressionen sowie der später
analysierte D269-Abbruch aus `match_d5f09452c77ff7cc` belegen den Vertrag;
öffentliche Payloads enthalten weder Stacktrace noch private Actiondetails.

## SP-059 – optionale Stealth-Folge verliert ihre sichere Null-Evidence

Im ersten Seed von Zyklus 021 lehnte `corp.defend_servers` sieben bezahlbare
Wall-Rez-Routen ab, weil die Engine eine bezahlbare Pile-Driver-Route mit
`postBreakStealthLoss` pauschal als unbekannt markierte. Der sichtbare
Runner-Zustand enthielt jedoch keine installierte Stealth-Karte und exakt null
gehostete Stealth-Credits; die ausdrücklich optionale Folge konnte daher
deterministisch nichts verändern.

Die Engine zertifiziert diesen engen strukturierten Nullfall. Fehlt der
Quellmodus, ist die Folge nicht optional oder ist mindestens ein Stealth-
Credit vorhanden, bleibt die Quote unbekannt. Plan-, Step-, Executor- und
Actionautorität bleiben vollständig bei `corp.defend_servers`.

Status: behoben/verifiziert. Im finalen `match_ab8e254f6364e919` bleibt die
Auswahlfolge bis D65 identisch und D66 rezzed Data Wall statt zu passen. Der
positive Stealth-Gegenfall bleibt fail-closed; Seeds 2 und 3 sind über 92 und
334 Entscheidungen auswahlidentisch.

## SP-060 – exakte Run-End-Fähigkeit fehlt im Defense-Owner

Im dritten Seed von Zyklus 022 scoret die Corp Data Fort Remapping und erhält
beim anschließenden Angriff auf Remote 1 eine kostenlose, exakt gebundene
LegalAction zum Ausgeben eines Remap-Counters und Beenden des Runs. Die Engine
hatte den Effekt jedoch nicht als strukturiertes Fakt veröffentlicht; die AI
sah nur eine ungelöste Kartenfähigkeit und brach in D156 mit
`missing_plan_module_coverage` fail-closed ab.

Ein exakter einzelner CardSpec-`end_run`-Effekt wird nun durch die Engine
zertifiziert und als `run.end_by_corp` projiziert. Der vorhandene
`corp.defend_servers`-Plan materialisiert ausschließlich die aktuelle,
ziel- und choicefreie LegalAction. Root, Leaf, Step, Executor und Action-ID
bleiben beim Defense-Portfolio; ein Resolver oder zweiter Planowner entsteht
nicht.

Status: behoben/verifiziert. `match_b153b34d263aeb09` ist bis D155
action-identisch, rezzed in D156 Glacier und beendet in D157 den Run über die
Remapping-Fähigkeit. Danach endet die Partie regulär in D226. Die beiden
anderen Seeds bleiben über 163 und 188 Entscheidungen vollständig
action-identisch.

## SP-061 – Score-Schutz verliert `new_remote`-Bindung und Vorrang

In Zyklus 013 bezeichnet `new_remote` zunächst den legalen
Installationsplatzhalter und nach Ausführung die projizierte neue Remote. Der
gebundene Score-Schutz verlangte zusätzlich semantische Zielgleichheit und
verlor dadurch seine konkrete ICE-LegalAction. Nach der ersten Reparatur
konnte dieselbe erste Staging-Schicht noch von immer weiteren
nichtterminalen Zentralschichten verdrängt werden.

Der Scoreparent bindet Quellkarte, LegalAction und den Remote-Lebenszyklus
jetzt genau einmal. Bereits ausreichend geschichtete Zentralen dürfen die
erste gebundene Score-Schicht außerhalb terminaler Gefahr nicht weiter
verdrängen. `corp.score_agenda` bleibt Parent, `corp.defend_servers` einziger
ICE-Allokator; die Remote erhält keine feste Core-Rolle.

Status: behoben/verifiziert. Die fokussierten Regressionen sichern Parent,
Defense-Executor, Step und Action-ID. Die finalen Replays materialisieren die
Staging-Route unter anderem in `match_df1e2cd6549ea67d` an D321 und D418.

## SP-062 – Zwei-Layer-Reife prüft den Runnerpfad nicht

Die enge Zwei-Layer-Ausnahme aus SP-045 betrachtete nur die bezahlbaren
Corp-Rez-Kosten. Sie konnte deshalb eine Score-Remote als reif behandeln,
obwohl der sichtbare Runner beide Schichten billig und folgenlos passieren
konnte.

Die Reifeprüfung verwendet nun die aktuelle Engine-zertifizierte
Post-Rez-Route des sichtbaren Runner-Rigs. Zwei Schichten genügen nur bei
blockiertem Zugriff, Bindung mindestens der Hälfte allgemeiner
Runner-Liquidität oder unvermeidbarer strukturierter Damage-, Tag- oder
Action-Gefahr. Legacy- und unbekannte Risikofelder werden nicht als sichere
Gefahr umgedeutet.

Status: behoben/verifiziert. Im finalen `match_ec5b2d5b75e389b9` bleiben die
D341-, D453-, D494- und D552-Scorefenster legitim: Die sichtbaren Wege kosten
8 von 8, 8 von 14, 12 von 19 und 14 von 22 allgemeinen Credits. Der
Ownership-Test hält Install, Advance und Score beim bestehenden Scoreplan.

## SP-063 – Score-Effekt-Zielvarianten bleiben beim Scoreowner

Im zweiten Seed von Zyklus 023 avanciert `corp.score_agenda` Security Net
Optimization zur Scorereife und bindet exakt die HQ-Variante des
When-Scored-Effekts. Vier legale Geschwistervarianten derselben Agenda blieben
dennoch produktiv ohne Owner; D218 brach mit `missing_plan_module_coverage`
fail-closed ab.

Die Corp-Disposition hält nicht gewählte Effekt-Zielvarianten bei
`corp.score_agenda`, sobald der Scoreplan eine aktuelle feasible Projektion
derselben Agenda und mindestens eine exakte Action-ID besitzt. Der Plan bleibt
alleiniger Owner von Agenda, Ziel und Action; ein Resolver oder zweiter
Strategieowner entsteht nicht.

Status: behoben/verifiziert. `match_306137f2b76a69f7` bleibt bis D217
action-identisch, scoret in D218 die zuvor gebundene HQ-Variante und endet
regulär in D412 mit 8:6 für die Corp. Die beiden anderen Seeds bleiben über
309 und 29 Entscheidungen vollständig action-identisch.

## SP-064 – sicherer Matchpoint-Score verliert gegen Defense-Draw

Im Zwischenlauf `match_a48ad219c3173450` war eine installierte Agenda im
selben Zug exakt fertigstellbar; ihr Diebstahl hätte dem Runner sofort den
Sieg gegeben. Trotzdem durfte ein spekulatives Defense-Draw den letzten
benötigten Klick verbrauchen.

`corp.score_agenda` veröffentlicht genau diese gebundene P2-Konversion nun
als `preventsTerminalSteal`. Ein ungebundener Defense-Draw bleibt dahinter,
ohne allgemeines Draw oder Defense abzuwerten. Agenda, Server und Action
bleiben beim bestehenden Scoreowner.

Status: behoben/verifiziert. Der persistierte Checkpoint
`cp-selfplay-013-03-score-before-defense-draw-d483` reproduziert den Zustand;
`match_df1e2cd6549ea67d` führt D481 bis D486 als gebundene Operation-,
Install-, Advance- und Scorefolge aus.

## SP-065 – Defense-Endturn erklärt normale Restklicks für erschöpft

In Zyklus 024 versuchte der Runner in zwei Seeds mit einem Klick und 27
beziehungsweise 34 Karten im Stack unter `runner.defense_and_recovery` den Zug
zu beenden. Eine legale Basiscredit-Action blieb verfügbar; der Scheduler
stoppte korrekt mit `end_turn_with_usable_capacity`.

Die Laufzeit markiert Standardkapazität nur bei tatsächlich leerem Stack als
erschöpft. Normale Restklicks bleiben beim nachrangigen P6-Economy-Owner;
Defense erhält keine zusätzliche Entscheidungsautorität.

Status: behoben/verifiziert. Die finalen Seeds setzen an D359 und D77 mit
`runner.gain_credit` unter `runner.economy` fort und enden regulär.

Die zunächst als Cross-Pairing-Evidence notierten Endturns aus Paarung 013
gehören nicht zu SP-065: Sie verwenden `forgo_terminal_deck_pressure` am
Runner-Matchpoint bei günstigem Deckrennen und vollständig abgelehnten
produktiven Alternativen, nicht `forgo_exhausted_options`. Der finale
Realpfad-Audit hat diese Kreuzreferenz deshalb entfernt.

## SP-066 – letztes Drawfenster verliert nach Installation seine Frist

Nach SP-064 installierte die Corp in `match_78be06130554dfa0` Tycho Extension
im letzten sicheren Drawfenster. Danach fiel dieselbe residente Scoreinstanz
auf die gewöhnliche Schutzprüfung zurück und wählte in D578 Credit, obwohl
ohne Abschluss vor der nächsten Pflichtziehung der Deckout sicher war.

Ein im `last_draw_window` zugelassener Scoreplan behält seine Frist über
Install, Advance und Score, solange Planinstanz, Agenda und Remote gebunden
bleiben. Die Regel erfindet keine neue Scorelinie und umgeht keinen
Schutzbedarf; sie erhält die bereits gewählte Überlebenslinie.

Status: behoben/verifiziert. Der persistierte Checkpoint
`cp-selfplay-013-04-last-draw-score-continuation-d578` hält den Vorzustand.
Im finalen `match_df1e2cd6549ea67d` installiert D577 Tycho Extension und
D578/D579 setzen die Advance-Continuation fort. Der Runner contestet danach
legal; die Corp wartet nicht mehr freiwillig auf sicheren Deckout.

## SP-067 – erfülltes residentes P6-Ziel blockiert frische Liquiditätsquote

Nach SP-065 blieben dieselben Basiscredit-Actions ownerlos, weil ein
residentes Liquiditätsziel nach externem Credit-Zufluss bereits erreicht war.
Die alte Zielzahl verhinderte eine neue, aus aktuellem Stand und Restklicks
endlich begrenzte Quote.

Das residente Ziel bleibt während der eigenen P6-Konversion stabil und wird
nur nach externer Zielerfüllung neu begrenzt. Der bestehende Economy-Owner
bleibt allein zuständig; es entsteht kein paralleler Resolver oder Fallback.

Status: behoben/verifiziert. `match_8a138d37d89521b2` und
`match_013087ac5c907d00` passieren die zuvor abbrechenden Zustände und laufen
bis D493 beziehungsweise D330 terminal durch.

Vollständige Entscheidungsklassifikation, Gewinneranalyse und Verlustursache:
[Review Selbstspielzyklus 002](ai-selfplay-cycle-002-review.md) und
[Review Selbstspielzyklus 003](ai-selfplay-cycle-003-review.md) sowie
[Review Selbstspielzyklus 004](ai-selfplay-cycle-004-review.md) und
[Review Selbstspielzyklus 005](ai-selfplay-cycle-005-review.md) sowie
[Review Selbstspielzyklus 006](ai-selfplay-cycle-006-review.md) sowie
[Review Selbstspielzyklus 007](ai-selfplay-cycle-007-review.md) sowie
[Review Selbstspielzyklus 008](ai-selfplay-cycle-008-review.md) sowie
[Review Selbstspielzyklus 009](ai-selfplay-cycle-009-review.md) sowie
[Review Selbstspielzyklus 010](ai-selfplay-cycle-010-review.md) sowie
[Review Selbstspielzyklus 011](ai-selfplay-cycle-011-review.md) sowie
[Review Selbstspielzyklus 012](ai-selfplay-cycle-012-review.md) sowie
[Review Selbstspielzyklus 016](ai-selfplay-cycle-016-review.md) sowie
[Review Selbstspielzyklus 017](ai-selfplay-cycle-017-review.md) sowie
[Review Selbstspielzyklus 018](ai-selfplay-cycle-018-review.md) sowie
[Review Selbstspielzyklus 019](ai-selfplay-cycle-019-review.md) sowie
[Review Selbstspielzyklus 020](ai-selfplay-cycle-020-review.md) sowie
[Review Selbstspielzyklus 021](ai-selfplay-cycle-021-review.md) sowie
[Review Selbstspielzyklus 022](ai-selfplay-cycle-022-review.md) sowie
[Review Selbstspielzyklus 023](ai-selfplay-cycle-023-review.md).
[Review Selbstspielzyklus 024](ai-selfplay-cycle-024-review.md).
[Review Selbstspielzyklus 025](ai-selfplay-cycle-025-review.md).
[Review Selbstspielzyklus 026](ai-selfplay-cycle-026-review.md).
