# KI-Selbstspielzyklus 002 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; zwei generische Fehler behoben und im
identischen Replay verifiziert

## Reproduktionsvertrag

- Seed: `ai-selfplay-cycle-002-3f175d362b4a429a98d7ba2072c060bb`
- Regelprofil: Originalset, `modern_open`, normale KI, Detailtrace
- Runner: `onr_origin_runner_ai_snapshot_v1`, `fnv1a:7a0470da`,
  Runner Origins AI – Probe Pressure
- Corp: `onr_origin_corp_ai_snapshot_v1`, `fnv1a:072da05f`,
  Corp Origins AI – Tax & Punish
- Ausgangsmatch: `match_0c33b84f66d564f9`, 149 Aktionen,
  StateHash `fnv1a:6e6123b2`
- erster Replaylauf: `match_f605bd005514f20c`, 152 Aktionen,
  StateHash `fnv1a:a63f2c17`
- abschließender Replaylauf: `match_665f42d9261b3676`, 153 Aktionen,
  StateHash `fnv1a:530f166a`

Der Abschlusslauf endete regulär: Runner gewinnt durch `corp_deck_empty`,
Agenda-Punkte 2:2, sechs Runs, zwei erfolgreiche Runs, zwei gestohlene und
zwei von Corp gescorte Agenden. Alle 153 Decisions besitzen genau einen
Detailtrace; 154 Events schließen den terminalen Zustand ein. Es gab keine
Fallbacks, Timeouts, Maintenance-Warnungen oder nicht verfügbare
Analyseabschnitte.

## Vollständiger Decision-Denominator

Jede Decision ist genau einer Klasse zugeordnet:

- `plausibel`: 137
- `prüfbedürftig`: 10
- `Finding`: 0 im abschließenden Replay
- `trace-limitiert`: 6
- Summe: 153 von 153

| Klasse | Decisions | Begründung |
| --- | --- | --- |
| plausibel | 3–16, 18–28, 30–52, 54–67, 69–74, 76–84, 89–108, 110–112, 114–119, 122–133 und 135–153 | Erzwungene Fenster, legal und owner-konform ausgeführte Planfortsetzungen, finanzierte Boardentwicklung, vollständig abgewickelte Runs sowie die beiden geschlossenen Score-Linien |
| prüfbedürftig | 29, 53 und 134 | Drei freiwillige Draw-Aktionen verbrauchen zusammen fünf Karten aus dem kurzen R&D; der Nutzen ist jeweils vorhanden, die gemeinsame Deck-out-Wirkung aber strategisch relevant |
| prüfbedürftig | 75 | Dritte HQ-ICE-Schicht bei nur einer R&D-Schicht; durch das öffentlich sichtbare HQ Interface erklärbar, später jedoch durch R&D-Multiaccess bestraft |
| prüfbedürftig | 85–88 | Gestufte Hostile-Takeover-Linie bei nicht vollständig finanzierbarer Zwei-ICE-Remote und öffentlich sichtbarer Runner-Breakerabdeckung |
| prüfbedürftig | 113 und 121 | Wiederholte Archives-Runs ohne im Trace belegten unmittelbaren Payoff |
| trace-limitiert | 1, 2, 17, 68, 109 und 120 | Mulligan- und Discard-Choices sind legal, exakt gebunden und mit der gewählten Option persistiert; eine vergleichende Option-für-Option-Begründung fehlt im Trace |

Die Parent-Child-Sequenzen sind geschlossen: Setup-Choices, Discards,
Rez-/Decline-Rez-Fenster, Pump/Break/Continue, Access/Steal und beide
Score-Folgen enden jeweils in einem unabhängigen Hauptaktions- oder
Zugabschlussfenster. Die Run-Kosten werden im gespeicherten Run-/Encounter-
Kontext fortlaufend getragen; es trat keine unfinanzierte oder illegale
Folgeaktion auf.

## Behobene Fehler

### 1. Installierte, sicher scorebare Agenda durch Geschwisterplan unterbrochen

Im Ausgangsmatch wechselte Entscheidung 42 trotz einer legalen und mit zwei
Klicks sowie drei Credits vollständig erreichbaren Advance-/Advance-/Score-
Folge auf den Schutz einer anderen Agenda. Der TurnPlanner behandelte die
grobe P3-Abdeckung als ausreichend und ließ einen fremden Score-Root in die
Restlinie eintreten.

Der generische Fix bindet dringende exakte P1–P3-Score-Heads an `same_root`.
Im ersten Replay folgen Entscheidungen 39–44 deshalb ohne Rootwechsel auf
Operation, Install, drei Advances und Score.

### 2. Exakte Score-Linie nach gewonnener Action Capacity erneut verdrängt

Die vollständige Analyse des ersten Replays zeigte einen zweiten Fall. Vor
Entscheidung 145 waren R&D leer, 8 Credits und 3 Klicks vorhanden. Nach
`Overtime Incentives` blieben 4 Credits und 4 Klicks – exakt genug für
Hostile Takeover installieren, dreimal advancen und scoren. Entscheidung 146
wählte trotzdem einen P3-Funding-Support für eine in diesem Zug nicht
scorebare Tycho Extension; vier Basic-Credit-Aktionen verbrauchten danach die
gesamte Action Capacity.

Im Trace standen sich zwei P3-Linien gegenüber: der exakte Hostile-Root war
`executable_now`, der Tycho-Root nur `executable_with_support`. Die grobe
Obligation `priority-band:P3` ließ den höheren unmittelbaren Economy-Scalar
210 gegen den Score-Scalar 155 gewinnen.

Der ergänzte generische Fix veröffentlicht bei vorhandener dringender exakter
Score-Linie zusätzlich `urgent-exact-score-owner:<priority>`. Nur der exakte
`corp.score_agenda`-Root erfüllt diese Obligation; ein gleichrangiger
Geschwister-Support verletzt sie. Im Abschlussreplay führen Entscheidungen
145–150 unter unverändertem Root über Overtime, Install, drei Advances und
Score. LegalAction-ID, Executor, Planowner und Choice-Autorität bleiben
unverändert.

Regressionstest beider Ursachen:
`packages/ai/src/plans/corp-turn-planner-selected-head.test.ts`.

## Analyse des Gewinners

Der Runner gewann nicht durch Agenda-Punkte, sondern durch das Erzwingen des
leeren Corp-Decks.

Seine tragenden Verhaltensmuster waren:

- frühe R&D- und HQ-Probes zwangen zwei ICE-Rezzes und lieferten Information;
- danach baute er passende Wall- und Code-Gate-Abdeckung sowie eine große
  Creditreserve auf;
- Entscheidung 89 contestete die sichtbar vorbereitete Remote rechtzeitig;
  Pump-, Break-, Continue-, Access- und Steal-Fenster 91–99 waren vollständig
  finanziert und konsistent gebunden;
- der R&D-Run 123–130 nutzte eine Multiaccess-Route gegen die einzelne
  R&D-ICE-Schicht und stahl eine Agenda;
- Entscheidung 152 erkannte den erzwungenen Sieg bei leerem R&D und beendete
  den Runner-Zug mit allen vier verbleibenden Klicks über
  `runner.secure_terminal_win`.

Prüfbedürftig bleiben nur die Archives-Runs 113 und 121. Der Trace belegt
keinen unmittelbaren Payoff; für einen Fix fehlt aber ein beweisbar besserer
legaler Zug samt Folgewert. Die langen Economy-Phasen waren in dieser Partie
nicht bloß passiv: Sie finanzierten den erfolgreichen Remote-Contest und die
spätere R&D-Route.

## Warum Corp verlor

Die unmittelbare Ursache ist exakt rekonstruierbar. Nach der Starthand lagen
18 Karten in R&D. Bis zum Ende wurden verbraucht:

- 12 erfolgreiche Pflichtziehungen;
- 5 freiwillige Draws durch zwei Night Shifts und eine Annual Reviews;
- 1 aus R&D gestohlene Agenda.

Damit war R&D vor dem letzten Runner-Zug exakt leer. Der abschließende
Score-Fix erhöhte Corp von einem auf zwei Agenda-Punkte, änderte aber den
Deck-out-Sieg nicht.

Die Niederlage war weder reines Pech noch ausschließlich ein KI-Fehler:

- Das Matchup war für Runner günstig. Seine öffentlich entwickelte Rig-
  Abdeckung traf die ausschließlich aus Walls und Code Gates bestehende
  Corp-ICE-Auswahl. HQ Interface und der spätere R&D-Multiaccess bedrohten
  beide Hauptzentralen.
- Der Corp-Punish-Anteil enthielt Punitive Counterstrike und Closed Accounts,
  während in diesem Snapshot kein eigener verlässlicher Tag-Lieferant lag.
  Gegen den ungetaggten Runner blieben beide Karten tote oder sehr schwache
  Ressourcen.
- Die kurze 23-Karten-Corp-Liste und fünf freiwillige Draws machten Deck-out
  zu einer realen strategischen Uhr. Der bestehende leere-R&D-Guard verhinderte
  zwar die letzte Annual Reviews, bewertete die kumulierte Restreichweite aber
  noch nicht als eigenen Planhorizont.
- Die Score-Linie 85–88 exponierte eine Agenda, obwohl Corp nach zwei Advances
  nur drei Credits besaß und damit nicht beide ICE der Remote rezzen konnte.
  Der Runner hatte zehn Credits und passende Breaker; die Agenda wurde
  folgerichtig gestohlen.
- Der klare Rootwechsel-Fehler 146 wurde behoben. Er war ein echter
  Verhaltensfehler, aber nicht allein siegentscheidend, weil Corp auch nach dem
  zusätzlichen Score beim nächsten Pflichtzug deckte.

Gesamturteil: Die Niederlage entstand aus einem ungünstigen Deck-/Rig-Matchup,
einer sehr kurzen und draw-intensiven Corp-Reichweite sowie zwei
veränderbaren Verhaltensmustern. Das eindeutige Score-Ownership-Muster ist
behoben. Deck-out-Horizont, Remote-Exposition und wiederholte Low-Payoff-Runs
bleiben als verdichtbare Verdachtsfälle offen; die aktuelle Evidence reicht
noch nicht für einen weiteren generischen Fix.

## Zyklusübergreifende Matrixauswertung

Die neue Evidence wurde nicht als isolierter Matchbericht behandelt. Die
Fälle SP-002 und SP-003 verdichten gemeinsam den bereits aus dem Pilotzyklus
bekannten Cluster `corp-score-plan-conversion`: Beide neuen Fälle belegen
konkret, dass eine vollständig erreichbare Score-Linie ihren exakten
Agenda-Owner weder nach Auswahl noch in der gleichrangigen Head-Auswahl
verlieren darf. Sie tragen deshalb zwei generische Ownership-Sicherungen.

SP-001 bleibt im selben Cluster dennoch Verdacht. Für das dort beobachtete
Schutz-Drawing fehlt weiterhin der Beleg, dass zu den konkreten Entscheidungen
eine bessere Score-Konversion legal und erreichbar war. Der neue Fix wird
nicht allein aufgrund eines ähnlichen Symptoms auf diesen Fall übertragen.

Deck-out-Horizont, zentrale Defense-Verteilung, Score-Exposition und
wiederholte Low-Payoff-Runs beginnen vier eigene Cluster. Bei jedem weiteren
Fall werden nicht nur die Zähler erhöht, sondern alle vorhandenen Seeds,
LegalActions, Owner und Gegenfakten des Clusters erneut bewertet. Sobald die
gemeinsame Evidence den klaren Fixschwellenwert erreicht, werden auch ältere
repräsentative Seeds nach dem generischen Fix wiederholt.

## Verifikation

- Fokussierte AI-Tests:
  `corp-turn-planner-selected-head.test.ts`,
  `turn-remainder-search.test.ts` und
  `corp-agenda-turn-planning.test.ts`: 3 Dateien, 23 von 23 Tests bestanden.
- Der AI-Typecheck enthält nach Beseitigung eines neuen Fixture-Typfehlers nur
  sechs vorbestehende Baselinefehler: zwei unabhängige
  `possibly undefined`-Diagnosen und vier fehlende
  `*-card-spec-migration-report.json`-Artefakte. Keine Diagnose betrifft die
  geänderten TurnPlanner-Dateien.
- Ein durch fehlerhafte Argumentweitergabe zusätzlich gestarteter breiter
  AI-Testlauf wurde vollständig beendet: 381 Dateien beziehungsweise 3859
  Tests bestanden; 131 Dateien beziehungsweise 479 Tests scheiterten an der
  bereits inkonsistenten breiten Fixture-/CardSpec-Baseline. Dieser Lauf ist
  kein Akzeptanzgate für den fokussierten Fix und führte zu keiner fremden
  Reparatur.

## Dokumentationsprüfung

`change-compass.md`, `README.md`, `planning-architecture.md` und
`turn-campaign-planner.md` beschreiben bereits die nun hergestellte
Ownership-Regel: eine dringende exakte Score-Fortsetzung darf nur durch eine
zulässige höherklassige Unterbrechung, Invalidierung oder Revalidation
verlassen werden. Der Fix ändert diesen Architekturvertrag nicht; eine
Architekturtextänderung ist daher nicht erforderlich. Die neue
Indizienmatrix und dieser Review dokumentieren den erweiterten,
zyklusübergreifenden Analyseprozess und die Match-Evidence.
