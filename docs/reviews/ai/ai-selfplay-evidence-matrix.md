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
| `corp-score-plan-conversion`              | Vorbereiteten Score-Plan in Install-, Advance- und Score-Schritte überführen, ohne die exakte Agenda-Bindung zu verlieren                      |     3 |        1 |         0 |                   2 | Weitere Schutz-Drawing-Fälle mit tatsächlich erreichbarer Folgelinie sammeln und mit den zwei Ownership-Fixes vergleichen                                                    |
| `corp-deck-exhaustion-horizon`            | Freiwilligen Draw gegen Pflichtziehungen, R&D-Zugriffe und verbleibende Siegzeit bewerten                                                      |     2 |        1 |         0 |                   1 | Frühe einzeln sichere Draws weiter sammeln; der planübergreifende kurze Pflichtzieh-Horizont ist bereits abgesichert                                                         |
| `corp-central-defense-allocation`         | Öffentlichen Zentraldruck, vorhandene Breakerabdeckung und den tatsächlichen Grenznutzen zusätzlicher ICE-Schichten gemeinsam bewerten         |     2 |        2 |         0 |                   0 | Vergleichszustände sammeln, in denen eine konkrete alternative ICE-Platzierung oder Score-/Economy-Aktion nachweislich mehr Zugriffsschutz beziehungsweise Siegtempo erzeugt |
| `corp-score-exposure-risk`                | Agenda nur in eine gegen öffentliche Rig-Abdeckung ausreichend finanzierbare Score-Remote überführen                                           |     1 |        1 |         0 |                   0 | Vergleichbare gestufte Score-Linien mit Rez-Budget, Runner-Credits und Breakerabdeckung sammeln                                                                              |
| `runner-low-payoff-pressure`              | Runs nach unmittelbarem und zukünftigem Informations-/Tempoertrag auswählen                                                                    |     1 |        1 |         0 |                   0 | Archives-Runs mit LegalActions, öffentlichem Informationsstand und Folgeplan vergleichen                                                                                     |
| `runner-coverage-owner-materialization`   | Alle vom Rig-Plan beanspruchten legalen Coverage-Antworten auch als ausführbare Route materialisieren                                          |     1 |        0 |         0 |                   1 | Bei neuen Coverage-Fällen Owner, Rollenpassung, Kosten und tatsächlich veröffentlichte Action-IDs vergleichen                                                                |
| `runner-urgent-remote-support-conversion` | Einen dringenden Remote-Contest über Funding, Breaker-Installation und sichere Rückkehr zum Remote-Root im selben Zug vollständig konvertieren |     1 |        0 |         0 |                   1 | Weitere Karten- und Deckkombinationen prüfen; Projektion darf weder zukünftige Action-IDs noch unbekannte Kosten oder Gefahren annehmen                                      |

## Fallregister

| Fall     | Cluster                                   | Evidenzgrad         | Seite  | Match und Entscheidungen                                                                                                           | Symptom                                                                                                                                                                                                                             | Zuständiger Pfad                                                                                                                                                    |
| -------- | ----------------------------------------- | ------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SP-001` | `corp-score-plan-conversion`              | Verdacht            | Corp   | `match_ce0f0272ed65d4f9`, 93 und 104                                                                                               | Zweimal Schutz-Drawing ohne spätere Score-Konversion; ein besserer legaler Zug ist noch nicht belegt                                                                                                                                | `corp.defend_servers` als Support für `corp.score_agenda`                                                                                                           |
| `SP-002` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_0c33b84f66d564f9`, 39–44, kritisch 42; Replays `match_f605bd005514f20c` und `match_665f42d9261b3676`                | Sicher im selben Zug scorebare Agenda wurde zugunsten der Vorbereitung einer anderen Agenda unterbrochen                                                                                                                            | TurnPlanner-Continuation des exakten Owners `corp.score_agenda`                                                                                                     |
| `SP-003` | `corp-score-plan-conversion`              | Behoben/verifiziert | Corp   | vor Fix `match_f605bd005514f20c`, 145–149, kritisch 146; nach Fix `match_665f42d9261b3676`, 145–150                                | Exakt erreichbare Score-Linie verlor die gleichrangige Auswahl gegen Economy-Support einer anderen, in diesem Zug nicht scorebaren Agenda                                                                                           | Prioritätsobligation des exakten Owners `corp.score_agenda`                                                                                                         |
| `SP-004` | `corp-deck-exhaustion-horizon`            | Verdacht            | Corp   | `match_e17749ea32acc45e`, 29, 53 und 95; Vorläufer `match_665f42d9261b3676`, 29, 53 und 134                                        | Fünf frühe freiwillige Draws tragen kumuliert zum späteren Deck-out bei; jeder Einzelzug liegt noch außerhalb des kurzen Pflichtzieh-Horizonts                                                                                      | strategischer Corp-Draw-/Deck-out-Horizont über mehrere Züge                                                                                                        |
| `SP-005` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_e17749ea32acc45e`, 138; Vorläufer `match_665f42d9261b3676`, 75                                                              | Dritte HQ-ICE-Schicht bei nur einer R&D-Schicht; HQ Interface erklärt die Wahl teilweise                                                                                                                                            | `corp.defend_servers`, genaue Root-/Threat-Zuordnung noch offen                                                                                                     |
| `SP-006` | `corp-score-exposure-risk`                | Verdacht            | Corp   | `match_e17749ea32acc45e`, 74–76 und 139; Vorläufer `match_665f42d9261b3676`, 85–88                                                 | Wiederholt gestufte beziehungsweise unentwickelte Agenda-Linien gegen öffentlich finanzierbare passende Breaker                                                                                                                     | `corp.score_agenda` mit Defense-Support; belegter besserer LegalAction-Pfad fehlt                                                                                   |
| `SP-007` | `runner-low-payoff-pressure`              | Verdacht            | Runner | `match_e17749ea32acc45e`, 122 und 131; Vorläufer `match_665f42d9261b3676`, 113 und 121                                             | Wiederholte Archives-Runs ohne im Trace belegten unmittelbaren Payoff                                                                                                                                                               | Runner-Druck-/Run-Zielwahl; Vergleichswert der Alternativen fehlt                                                                                                   |
| `SP-008` | `runner-coverage-owner-materialization`   | Behoben/verifiziert | Runner | aktuelle Main-Basis `match_1d9102cdac482cab`, Workbranch `match_5d3fcc740a02c228`, D23; final `match_e17749ea32acc45e`, D23        | Rig beanspruchte alle Coverage-Installationen, materialisierte aber nur die erste unbezahlbare Handantwort und ließ eine kostenlose legale Alternative ownerlos                                                                     | `runner.rig_and_coverage`, Action-ID-Materialisierung innerhalb desselben Owners                                                                                    |
| `SP-009` | `corp-deck-exhaustion-horizon`            | Behoben/verifiziert | Corp   | vor Fix `match_c7144122aaeafb8b`, D126; final `match_e17749ea32acc45e`, D126–D128                                                  | Basic Draw war wegen kurzem Pflichtzieh-Horizont blockiert, Night Shift mit demselben Kartenverbrauch wurde über Economy dennoch gespielt                                                                                           | planübergreifende Corp-Draw-Sicherheitsdisposition mit Economy-Owner                                                                                                |
| `SP-010` | `runner-urgent-remote-support-conversion` | Behoben/verifiziert | Runner | vor Fix `match_ddac385459428c34`, D54–D63; Zwischenlauf `match_7086b0128fda7eeb`, D57–D59; final `match_d1466637af6d0a60`, D54–D64 | Nach einem gescheiterten Remote-Probe lag eine vollständige Credit–Breaker–Rerun-Linie vor. Die KI lief stattdessen erst auf HQ und nach dem ersten Fix auf R&D, sodass die bedrohte Vier-Punkte-Agenda liegen blieb                | `runner.contest_remote` als Root, `runner.rig_and_coverage` als exakt gebundener Support-Leaf und sichere Run-Reservefreigabe                                       |
| `SP-011` | `corp-central-defense-allocation`         | Verdacht            | Corp   | `match_d1466637af6d0a60`, D149, D172, D191 und spätere Rezfenster D312, D314, D316                                                 | Corp legt drei zusätzliche Wall-/Code-Gate-Schichten auf das wiederholt angegriffene R&D. Gegen die öffentlich passenden kostenlosen Breaker erzeugen sie später keinen Access-Stop und werden trotz genügend Credits nicht gerezzt | `corp.defend_servers`; offen ist, ob bei der Installation eine konkret bessere Platzierung oder eine schnellere Score-/Economy-Aktion legal und messbar stärker war |

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

Vollständige Entscheidungsklassifikation, Gewinneranalyse und Verlustursache:
[Review Selbstspielzyklus 002](ai-selfplay-cycle-002-review.md) und
[Review Selbstspielzyklus 003](ai-selfplay-cycle-003-review.md).
