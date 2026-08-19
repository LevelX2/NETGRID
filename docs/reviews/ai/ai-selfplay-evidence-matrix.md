# KI-Selbstspiel-Indizienmatrix

Stand: 2026-08-19
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
5. Klare generische Fehler mit Ownership-Test beheben und denselben Seed aus
   einer frischen isolierten Datenbank erneut vollständig analysieren.
6. Erst schließen, wenn der letzte Lauf und die verdichtete Matrix keinen
   weiteren klaren Fix tragen.
7. Lokal nach `main` integrieren, danach den erneut aktuellen `main`-Stand in
   den dauerhaft weiterverwendeten Arbeitsbranch zurückmergen.

## Clustermatrix

| Cluster                                   | Fähigkeit                                                                                                                                      | Fälle | Verdacht | Bestätigt | Behoben/verifiziert | Nächste Verdichtung                                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----: | -------: | --------: | ------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corp-score-plan-conversion`              | Vorbereiteten Score-Plan in Install-, Advance- und Score-Schritte überführen, ohne die exakte Agenda-Bindung zu verlieren                      |     4 |        2 |         0 |                   2 | Score-Stau bei dauerhaft agenda-gesättigtem HQ gegen unzureichend geschützte Remotes abgrenzen und einen zustandsgenauen gestuften Alternativpfad belegen                    |
| `corp-deck-exhaustion-horizon`            | Freiwilligen Draw gegen Pflichtziehungen, R&D-Zugriffe und verbleibende Siegzeit bewerten                                                      |     2 |        1 |         0 |                   1 | Frühe einzeln sichere Draws weiter sammeln; der planübergreifende kurze Pflichtzieh-Horizont ist bereits abgesichert                                                         |
| `corp-central-defense-allocation`         | Öffentlichen Zentraldruck, vorhandene Breakerabdeckung und den tatsächlichen Grenznutzen zusätzlicher ICE-Schichten gemeinsam bewerten         |     2 |        2 |         0 |                   0 | Vergleichszustände sammeln, in denen eine konkrete alternative ICE-Platzierung oder Score-/Economy-Aktion nachweislich mehr Zugriffsschutz beziehungsweise Siegtempo erzeugt |
| `corp-score-exposure-risk`                | Agenda nur in eine gegen öffentliche Rig-Abdeckung ausreichend finanzierbare Score-Remote überführen                                           |     1 |        1 |         0 |                   0 | Vergleichbare gestufte Score-Linien mit Rez-Budget, Runner-Credits und Breakerabdeckung sammeln                                                                              |
| `runner-low-payoff-pressure`              | Runs nach unmittelbarem und zukünftigem Informations-/Tempoertrag auswählen                                                                    |     1 |        1 |         0 |                   0 | Archives-Runs mit LegalActions, öffentlichem Informationsstand und Folgeplan vergleichen                                                                                     |
| `runner-coverage-owner-materialization`   | Alle vom Rig-Plan beanspruchten legalen Coverage-Antworten auch als ausführbare Route materialisieren                                          |     1 |        0 |         0 |                   1 | Bei neuen Coverage-Fällen Owner, Rollenpassung, Kosten und tatsächlich veröffentlichte Action-IDs vergleichen                                                                |
| `runner-urgent-remote-support-conversion` | Einen dringenden Remote-Contest über Funding, Breaker-Installation und sichere Rückkehr zum Remote-Root im selben Zug vollständig konvertieren |     1 |        0 |         0 |                   1 | Weitere Karten- und Deckkombinationen prüfen; Projektion darf weder zukünftige Action-IDs noch unbekannte Kosten oder Gefahren annehmen                                      |
| `plan-support-readiness-consistency`      | Aktuellen ausführbaren Route-Head und noch offenen gebundenen Supportbedarf in jeder Planbewertung widerspruchsfrei klassifizieren             |     1 |        0 |         0 |                   1 | Weitere alternative Routen prüfen; `executable_now` darf nie gleichzeitig einen offenen `ResourceGap` tragen                                                                 |
| `runner-finite-coverage-lifecycle`        | Endliche Universal-Breaker über aktuelle Zugriffswerte und vorhersehbare spätere Matchpoint-Server hinweg einsetzen                            |     1 |        1 |         0 |                   0 | Wiederholungen sammeln, in denen ein früher Run messbar weniger wert ist und die spätere Serverrolle bereits sichtbar oder deckseitig vorhersehbar war                       |
| `runner-install-invocation-coverage`      | Alle aktuellen Zahlungs- und Trash-Varianten derselben planbewerteten Installation exakt routen oder dispositionieren                          |     1 |        0 |         0 |                   1 | Weitere Installationsquellen mit mehreren Zahlungswegen prüfen; unabhängige Coverage- oder Development-Owner dürfen nicht überschrieben werden                               |
| `structured-choice-origin-binding`        | Jedes planrelevante Engine-Choice strukturiert an Quellinstanz, Quelldefinition und ausgewählte Aktion zurückbinden                            |     1 |        0 |         0 |                   1 | Weitere Hidden-Zone- und Search-Choices auf vollständige strukturierte Herkunft prüfen; Source-Strings bleiben ungeparst                                                     |
| `corp-variable-rez-action-quote`          | Kosten und Runwirkung jeder aktuellen variablen ICE-Rez-LegalAction als exakt actiongebundene Engine-Quote bereitstellen                       |     1 |        0 |         0 |                   1 | Die actiongebundene Quote auf weitere variable Familien wie X-Stärke und alternative Subtypen ausdehnen, sobald ein reproduzierbarer Entscheidungsfall sie benötigt          |
| `deterministic-ai-replay-identity`        | Fachlich gleiche KI-Zustände über verschiedene Match-IDs in dieselbe RNG-, Plan- und Tie-Break-Folge überführen                                |     2 |        0 |         0 |                   2 | Weitere Engine-Randomisierungsfamilien und Planner-Fingerprints auf Transport-, Zeit- und Auditidentitäten prüfen                                                            |
| `corp-punish-route-quote-completeness`    | Mehrstufige Tag-/Trace-/Damage-Linien vollständig quoten und unvollständige Gründe side-sicher im Decision Trace erklären                      |     1 |        1 |         0 |                   0 | Chance-Observation/Scorched-Earth-Zustand erneut mit persistiertem strukturiertem Incomplete-Grund reproduzieren                                                             |
| `runner-matchpoint-coverage-horizon`      | Verbleibende reale Deckrollen gegen eine sichtbar entstehende Matchpoint-Remote bewerten und nur tatsächlich erreichbare Coverage suchen       |     1 |        1 |         0 |                   0 | Frühere Zustände mit noch vorhandener passender Coverage und belegter alternativer Funding-/Draw-/Install-Linie sammeln                                                      |

## Fallregister

| Fall     | Cluster                                   | Evidenzgrad         | Seite  | Match und Entscheidungen                                                                                                                     | Symptom                                                                                                                                                                                                                                           | Zuständiger Pfad                                                                                                                                                    |
| -------- | ----------------------------------------- | ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SP-001` | `corp-score-plan-conversion`              | Verdacht            | Corp   | `match_ce0f0272ed65d4f9`, 93 und 104                                                                                                         | Zweimal Schutz-Drawing ohne spätere Score-Konversion; ein besserer legaler Zug ist noch nicht belegt                                                                                                                                              | `corp.defend_servers` als Support für `corp.score_agenda`                                                                                                           |
| `SP-002` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_0c33b84f66d564f9`, 39–44, kritisch 42; Replays `match_f605bd005514f20c` und `match_665f42d9261b3676`                          | Sicher im selben Zug scorebare Agenda wurde zugunsten der Vorbereitung einer anderen Agenda unterbrochen                                                                                                                                          | TurnPlanner-Continuation des exakten Owners `corp.score_agenda`                                                                                                     |
| `SP-003` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_f605bd005514f20c`, 145–149, kritisch 146; nach Fix `match_665f42d9261b3676`, 145–150                                          | Exakt erreichbare Score-Linie verlor die gleichrangige Auswahl gegen Economy-Support einer anderen, in diesem Zug nicht scorebaren Agenda                                                                                                         | Prioritätsobligation des exakten Owners `corp.score_agenda`                                                                                                         |
| `SP-004` | `corp-deck-exhaustion-horizon`            | Verdacht            | Corp   | `match_e17749ea32acc45e`, 29, 53 und 95; Vorläufer `match_665f42d9261b3676`, 29, 53 und 134                                                  | Fünf frühe freiwillige Draws tragen kumuliert zum späteren Deck-out bei; jeder Einzelzug liegt noch außerhalb des kurzen Pflichtzieh-Horizonts                                                                                                    | strategischer Corp-Draw-/Deck-out-Horizont über mehrere Züge                                                                                                        |
| `SP-005` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_e17749ea32acc45e`, 138; Vorläufer `match_665f42d9261b3676`, 75                                                                        | Dritte HQ-ICE-Schicht bei nur einer R&D-Schicht; HQ Interface erklärt die Wahl teilweise                                                                                                                                                          | `corp.defend_servers`, genaue Root-/Threat-Zuordnung noch offen                                                                                                     |
| `SP-006` | `corp-score-exposure-risk`                | Verdacht            | Corp   | `match_e17749ea32acc45e`, 74–76 und 139; Vorläufer `match_665f42d9261b3676`, 85–88                                                           | Wiederholt gestufte beziehungsweise unentwickelte Agenda-Linien gegen öffentlich finanzierbare passende Breaker                                                                                                                                   | `corp.score_agenda` mit Defense-Support; belegter besserer LegalAction-Pfad fehlt                                                                                   |
| `SP-007` | `runner-low-payoff-pressure`              | Verdacht            | Runner | `match_e17749ea32acc45e`, 122 und 131; Vorläufer `match_665f42d9261b3676`, 113 und 121                                                       | Wiederholte Archives-Runs ohne im Trace belegten unmittelbaren Payoff                                                                                                                                                                             | Runner-Druck-/Run-Zielwahl; Vergleichswert der Alternativen fehlt                                                                                                   |
| `SP-008` | `runner-coverage-owner-materialization`   | Behoben/verifiziert | Runner | aktuelle Main-Basis `match_1d9102cdac482cab`, Workbranch `match_5d3fcc740a02c228`, D23; final `match_e17749ea32acc45e`, D23                  | Rig beanspruchte alle Coverage-Installationen, materialisierte aber nur die erste unbezahlbare Handantwort und ließ eine kostenlose legale Alternative ownerlos                                                                                   | `runner.rig_and_coverage`, Action-ID-Materialisierung innerhalb desselben Owners                                                                                    |
| `SP-009` | `corp-deck-exhaustion-horizon`            | Behoben/verifiziert | Corp   | vor Fix `match_c7144122aaeafb8b`, D126; final `match_e17749ea32acc45e`, D126–D128                                                            | Basic Draw war wegen kurzem Pflichtzieh-Horizont blockiert, Night Shift mit demselben Kartenverbrauch wurde über Economy dennoch gespielt                                                                                                         | planübergreifende Corp-Draw-Sicherheitsdisposition mit Economy-Owner                                                                                                |
| `SP-010` | `runner-urgent-remote-support-conversion` | Behoben/verifiziert | Runner | vor Fix `match_ddac385459428c34`, D54–D63; Zwischenlauf `match_7086b0128fda7eeb`, D57–D59; final `match_d1466637af6d0a60`, D54–D64           | Nach einem gescheiterten Remote-Probe lag eine vollständige Credit–Breaker–Rerun-Linie vor. Die KI lief stattdessen erst auf HQ und nach dem ersten Fix auf R&D, sodass die bedrohte Vier-Punkte-Agenda liegen blieb                              | `runner.contest_remote` als Root, `runner.rig_and_coverage` als exakt gebundener Support-Leaf und sichere Run-Reservefreigabe                                       |
| `SP-011` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_d1466637af6d0a60`, D149, D172, D191 und spätere Rezfenster D312, D314, D316                                                           | Corp legt drei zusätzliche Wall-/Code-Gate-Schichten auf das wiederholt angegriffene R&D. Gegen die öffentlich passenden kostenlosen Breaker erzeugen sie später keinen Access-Stop und werden trotz genügend Credits nicht gerezzt               | `corp.defend_servers`; offen ist, ob bei der Installation eine konkret bessere Platzierung oder eine schnellere Score-/Economy-Aktion legal und messbar stärker war |
| `SP-012` | `plan-support-readiness-consistency`      | Behoben/verifiziert | Runner | vor Fix `match_81da14276d2357ad`, D283–D284; final `match_5aba9d2141ec1d24`, D282–D300                                                       | Der dringende Remote-Plan hatte eine aktuelle ausführbare Route, führte aber gleichzeitig noch einen älteren Wall-Coverage-Bedarf und scheiterte deshalb vor der Auswahl fail-closed                                                              | gemeinsamer Assessment-Vertrag von `runner.contest_remote`, `runner.pressure_central` und `runner.develop_board_and_hand`                                           |
| `SP-013` | `runner-finite-coverage-lifecycle`        | Verdacht            | Runner | `match_5aba9d2141ec1d24`, frühe Zentralruns und D300–D327                                                                                    | Selbstzerstörende Rent-I-Con-Kopien tragen frühe Zugriffe, fehlen aber gegen die spätere Matchpoint-Remote; unklar ist, ob ein früher Einsatz mit damaliger Sicht tatsächlich weniger wert war                                                    | `runner.pressure_central` und `runner.contest_remote` benötigen eine gemeinsame endliche Coverage-Lebenszyklusbewertung                                             |
| `SP-014` | `runner-install-invocation-coverage`      | Behoben/verifiziert | Runner | vor Fix `match_b920d5897a7fa766`, D99; final `match_a827f500dc378815`                                                                        | Zentraldruck dispositionierte nur die kanonische Vienna-22-Installation; gleichwertige Bits- und Programm-Trash-Zahlungsvarianten derselben Quellinstanz blieben ownerlos                                                                         | Variantenpropagierung innerhalb `runner.pressure_central`, ohne bestehende Spezialowner zu überschreiben                                                            |
| `SP-015` | `structured-choice-origin-binding`        | Behoben/verifiziert | Runner | vor Fix `match_f96e7445261cab1a`, D154–D155; final `match_a827f500dc378815`                                                                  | Test Spin war als Coverage-Suche exakt gewählt, doch das Engine-Choice verlor strukturierte Quellinstanz und Quelldefinition und konnte nicht zur Suchaktion zurückgebunden werden                                                                | Engine-Choice-Erzeugung und bestehende Coverage-Continuation; kein Source-String-Parsing im Resolver                                                                |
| `SP-016` | `corp-variable-rez-action-quote`          | Behoben/verifiziert | Corp   | vor Fix `match_a989710008cbc543`, D11, D16, D59, D191, D228, D230 und D238; final `match_a827f500dc378815`, ab D11                           | Variable Rez-LegalActions nannten Kosten und Wirkung exakt, die Kartenquote blieb jedoch ohne Subroutinen unvollständig; bezahlbare stopping ICE wurden deshalb wiederholt abgelehnt                                                              | Engine-PlayerView liefert actiongebundene Variantenquote; `corp.defend_servers` liest nur die exakt ausgewählte aktuelle Action                                     |
| `SP-017` | `corp-score-plan-conversion`              | Verdacht            | Corp   | `match_a827f500dc378815`, Corp-Züge 0–44, Scorefortschritt erst D411–D412                                                                    | HQ enthält fast durchgehend drei bis fünf Agenden und die Corp erreicht bis zu 16 Credits, beginnt aber erst nach 44 Zügen eine Score-Remote und verliert 0:8                                                                                     | `corp.score_agenda` mit Agenda-Sättigungs-, Score-Stau- und gestuftem Schutzvertrag; Schwelle und besserer konkreter Pfad sind noch offen                           |
| `SP-018` | `deterministic-ai-replay-identity`        | Behoben/verifiziert | Beide  | vor Fix `match_9b559755a4a11a9c`/`match_506fac4c8636d28f`, D4; Zwischenreplays D123; final `match_e03400af85946596`/`match_ad6bdd795029066f` | Identischer Seed und identische Starthand erzeugten wegen Match-ID im RNG-Zweck und StateHash im Planungsfingerprint verschiedene ICE-Ziele, Breaker und Sieger                                                                                   | Engine-Randomisierungszweck sowie gemeinsamer `PlanningStateIdentity`-Vertrag                                                                                       |
| `SP-019` | `corp-punish-route-quote-completeness`    | Verdacht            | Corp   | `match_9b559755a4a11a9c`, D32–D48; Seed und Decks aus Zyklus 006                                                                             | Tag-&-Bag-Intent, Chance Observation und Scorched Earth sind sichtbar; die angefragte mehrstufige Engine-Quote bleibt unbekannt, ohne den konkreten Incomplete-Grund im persistierten Trace auszuweisen                                           | `corp.execute_punish_sequence`, Decision-local Engine-Quote und side-sichere Trace-Evidence                                                                         |
| `SP-020` | `runner-matchpoint-coverage-horizon`      | Verdacht            | Runner | `match_e03400af85946596`, D222–D224 und D334–D342                                                                                            | Beim Stand 6:6 ist die vierfach geschützte Matchpoint-Remote wegen fehlender Wall-Abdeckung nicht passierbar; im verbleibenden Stack existieren nur Sentry-Breaker, sodass Draw und Remote-Run aktuell keine belegte Siegroute bilden             | `runner.contest_remote`, `runner.rig_and_coverage` und Deckprofil-Lebenszyklus; ein früherer konkret besserer LegalAction-Pfad fehlt                                |
| `SP-021` | `runner-central-payoff-owner-binding`     | Behoben/verifiziert | Runner | Spielseed Zyklus 007; Abbruch vor D8, final `match_2c166dda041da6ff` und `match_fc3094aac35c9b54`                                            | R&D Mole war als sichtbare Handkarte und LegalAction vorhanden, verlor aber ohne angereicherte Kandidatenfelder seine R&D-Fähigkeitszuordnung und blieb ownerlos                                                                                  | Quellinstanzbindung und Definition-Hint innerhalb `runner.pressure_central`                                                                                         |
| `SP-022` | `corp-rule-score-conversion`              | Behoben/verifiziert | Corp   | Spielseed Zyklus 007; Abbruch vor D53, final beide Replays D53                                                                               | Eine exakt gequotete Aktion entfernte für einen Klick und 12 Credits eine aktive Verpflichtung und erzeugte einen Agendapunkt, doch der positive KI-Inputfilter entfernte die Quote und ließ die Aktion ownerlos                                  | `corp.score_agenda` als `convert_agenda`-Owner; exakte LegalAction-Quote                                                                                            |
| `SP-023` | `runner-terminal-contest-risk-contract`   | Verdacht            | Runner | `match_2c166dda041da6ff` und `match_fc3094aac35c9b54`, D404–D419, kritisch D410–D414                                                         | Runner erkennt eine zweifach avancierte Score-Remote, beginnt mit vollständiger Breakerabdeckung den Contest, behandelt ihn aber weiter als Probe und jackt nach einem Credit Reserveverschlechterung aus; die Corp scoret direkt danach zum Sieg | `runner.contest_remote`, öffentliche Next-Turn-Terminalhülle und während des Runs erhaltener Risikovertrag                                                          |
| `SP-024` | `match-result-successful-run-count`       | Verdacht            | Beide  | beide finalen Replays Zyklus 007; Result-Snapshot gegenüber `access_card`-Ereignissen D153, D186, D218 und D239                              | Ergebnis meldet null erfolgreiche Runs, obwohl vier Runs einen ersten Zugriff erzeugten und einer davon eine Agenda stahl; Match- und Agendapunkte sind korrekt                                                                                   | Server-Result-Snapshot und Action-Delta-Persistenz; konkrete Ursache noch nicht isoliert                                                                            |

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

Status: Verdacht außerhalb der eigentlichen KI-Auswahl. Matchpunkte,
Agendapunkte, Sieger und Actionfolge sind nicht betroffen. Vor einem Fix muss
geklärt werden, ob Snapshot-Erzeugung, Delta-Persistenz oder ein veralteter
Laufzeitpfad die Abweichung erzeugt; ein nachgelagerter Ersatzwert wäre kein
Ursachenfix.

Vollständige Entscheidungsklassifikation, Gewinneranalyse und Verlustursache:
[Review Selbstspielzyklus 002](ai-selfplay-cycle-002-review.md) und
[Review Selbstspielzyklus 003](ai-selfplay-cycle-003-review.md) sowie
[Review Selbstspielzyklus 004](ai-selfplay-cycle-004-review.md) und
[Review Selbstspielzyklus 005](ai-selfplay-cycle-005-review.md) sowie
[Review Selbstspielzyklus 006](ai-selfplay-cycle-006-review.md) sowie
[Review Selbstspielzyklus 007](ai-selfplay-cycle-007-review.md).
