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

| Cluster | Fähigkeit | Fälle | Verdacht | Bestätigt | Behoben/verifiziert | Nächste Verdichtung |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `corp-score-plan-conversion` | Vorbereiteten Score-Plan in Install-, Advance- und Score-Schritte überführen, ohne die exakte Agenda-Bindung zu verlieren | 3 | 1 | 0 | 2 | Weitere Schutz-Drawing-Fälle mit tatsächlich erreichbarer Folgelinie sammeln und mit den zwei Ownership-Fixes vergleichen |
| `corp-deck-exhaustion-horizon` | Freiwilligen Draw gegen Pflichtziehungen, R&D-Zugriffe und verbleibende Siegzeit bewerten | 1 | 1 | 0 | 0 | Vergleichsfälle mit kurzer R&D-Reichweite und unterschiedlich wertvollen Draw-Effekten sammeln |
| `corp-central-defense-allocation` | Öffentliche Multiaccess-Drohungen und zentrale ICE-Verteilung gegeneinander priorisieren | 1 | 1 | 0 | 0 | Prüfen, ob die HQ-Überdeckung trotz sichtbarer R&D-Bedrohung wiederkehrt und welche LegalAction besser wäre |
| `corp-score-exposure-risk` | Agenda nur in eine gegen öffentliche Rig-Abdeckung ausreichend finanzierbare Score-Remote überführen | 1 | 1 | 0 | 0 | Vergleichbare gestufte Score-Linien mit Rez-Budget, Runner-Credits und Breakerabdeckung sammeln |
| `runner-low-payoff-pressure` | Runs nach unmittelbarem und zukünftigem Informations-/Tempoertrag auswählen | 1 | 1 | 0 | 0 | Archives-Runs mit LegalActions, öffentlichem Informationsstand und Folgeplan vergleichen |

## Fallregister

| Fall | Cluster | Evidenzgrad | Seite | Match und Entscheidungen | Symptom | Zuständiger Pfad |
| --- | --- | --- | --- | --- | --- | --- |
| `SP-001` | `corp-score-plan-conversion` | Verdacht | Corp | `match_ce0f0272ed65d4f9`, 93 und 104 | Zweimal Schutz-Drawing ohne spätere Score-Konversion; ein besserer legaler Zug ist noch nicht belegt | `corp.defend_servers` als Support für `corp.score_agenda` |
| `SP-002` | `corp-score-plan-conversion` | Behoben/verifiziert | Corp | vor Fix `match_0c33b84f66d564f9`, 39–44, kritisch 42; Replays `match_f605bd005514f20c` und `match_665f42d9261b3676` | Sicher im selben Zug scorebare Agenda wurde zugunsten der Vorbereitung einer anderen Agenda unterbrochen | TurnPlanner-Continuation des exakten Owners `corp.score_agenda` |
| `SP-003` | `corp-score-plan-conversion` | Behoben/verifiziert | Corp | vor Fix `match_f605bd005514f20c`, 145–149, kritisch 146; nach Fix `match_665f42d9261b3676`, 145–150 | Exakt erreichbare Score-Linie verlor die gleichrangige Auswahl gegen Economy-Support einer anderen, in diesem Zug nicht scorebaren Agenda | Prioritätsobligation des exakten Owners `corp.score_agenda` |
| `SP-004` | `corp-deck-exhaustion-horizon` | Verdacht | Corp | `match_665f42d9261b3676`, 29, 53 und 134 | Fünf freiwillige Draws tragen bei kurzer R&D-Reichweite exakt zum späteren Deck-out bei; der Einzelzugnutzen bleibt jeweils plausibel | strategischer Corp-Draw-/Deck-out-Horizont, Owner noch nicht abschließend belegt |
| `SP-005` | `corp-central-defense-allocation` | Verdacht | Corp | `match_665f42d9261b3676`, 75 | Dritte HQ-ICE-Schicht bei nur einer R&D-Schicht; HQ Interface erklärt die Wahl teilweise, späterer R&D-Multiaccess bestraft sie | `corp.defend_servers`, genaue Root-/Threat-Zuordnung noch offen |
| `SP-006` | `corp-score-exposure-risk` | Verdacht | Corp | `match_665f42d9261b3676`, 85–88 | Gestufte Agenda-Linie in einer nicht vollständig rez-finanzierbaren Zwei-ICE-Remote gegen öffentlich passende Breaker | `corp.score_agenda` mit Defense-Support; belegter besserer LegalAction-Pfad fehlt |
| `SP-007` | `runner-low-payoff-pressure` | Verdacht | Runner | `match_665f42d9261b3676`, 113 und 121 | Wiederholte Archives-Runs ohne im Trace belegten unmittelbaren Payoff | Runner-Druck-/Run-Zielwahl; Vergleichswert der Alternativen fehlt |

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

- Match `match_665f42d9261b3676`, Entscheidungen 29, 53 und 134
- Nach der 5-Karten-Starthand lagen 18 Karten in R&D. Zwölf erfolgreiche
  Pflichtziehungen, fünf freiwillige Draws und eine aus R&D gestohlene Agenda
  leerten den Stapel exakt: `18 - 12 - 5 - 1 = 0`.
- Die fünf freiwilligen Draws stammen aus zwei Night Shifts und einer Annual
  Reviews. Jeder Einzelzug hatte plausiblen Kartenwert; der Trace belegt noch
  nicht, welcher alternative Zug unter Einbezug der gesamten Restreichweite
  überlegen gewesen wäre.

Status: Verdacht. Neue Fälle müssen insbesondere verbleibende Pflichtzüge,
gegnerischen R&D-Zugriff, Siegzeit und Wert der konkret gezogenen Karten
vergleichbar machen.

## SP-005 – zentrale Defense-Verteilung

- Match `match_665f42d9261b3676`, Entscheidung 75
- Corp legte eine dritte ICE-Schicht auf HQ, während R&D nur einfach geschützt
  blieb. Das öffentlich sichtbare HQ Interface begründet zusätzliche
  HQ-Abwehr; der spätere erfolgreiche R&D-Multiaccess zeigt zugleich den Preis
  der Verteilung.

Status: Verdacht. Es fehlt ein zustandsgenauer Vergleich der legalen
Installationsziele und ihres Threat-Werts ohne nachträgliches Wissen über den
R&D-Zugriff.

## SP-006 – nicht voll finanzierbare Score-Remote

- Match `match_665f42d9261b3676`, Entscheidungen 85–88
- Corp bereitete Hostile Takeover in einer Zwei-ICE-Remote vor, besaß nach zwei
  Advances aber nur drei Credits und konnte nicht beide ICE rezzen. Der Runner
  hatte zehn Credits und öffentlich passende Wall-/Code-Gate-Breaker; die
  Agenda wurde in Entscheidungen 89–99 gestohlen.

Status: Verdacht. Die Risikoanzeichen sind stark, doch für einen Fix fehlen
eine belegte bessere LegalAction-Linie und die genaue Zuordnung zwischen
Score-Owner, Defense-Support und Rez-Budget-Prognose.

## SP-007 – wiederholte Archives-Runs ohne belegten Payoff

- Match `match_665f42d9261b3676`, Entscheidungen 113 und 121
- Beide Runs waren legal und billig, der Detailtrace weist aber keinen
  unmittelbaren Informations-, Karten- oder Tempoertrag aus.

Status: Verdacht. Erst weitere Fälle mit vollständigem Alternativenvergleich
können zeigen, ob ein generisches Run-Ziel- oder Low-Payoff-Muster vorliegt.

Vollständige Entscheidungsklassifikation, Gewinneranalyse und Verlustursache:
[Review Selbstspielzyklus 002](ai-selfplay-cycle-002-review.md).
