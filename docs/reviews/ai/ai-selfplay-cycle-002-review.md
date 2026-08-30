# KI-Selbstspielzyklus 002 – vollständige Matchanalyse

Stand: 2026-08-19
Status: vollständig analysiert; vier generische Fehler behoben und im
identischen Replay verifiziert

## Reproduktionsvertrag

- Seed: `ai-selfplay-cycle-002-3f175d362b4a429a98d7ba2072c060bb`
- Regelprofil: Originalset, `modern_open`, normale KI, Detailtrace
- Runner: `onr_origin_runner_ai_snapshot_v1`, `fnv1a:7a0470da`,
  Runner Origins AI – Probe Pressure
- Corp: `onr_origin_corp_ai_snapshot_v1`, `fnv1a:072da05f`,
  Corp Origins AI – Tax & Punish

Alle Läufe verwendeten den normalen Multiplayer-/KI-Pfad mit manueller
Einzelschrittsteuerung, einer frischen isolierten SQLite-Datenbank und der
lokalen read-only Maintenance-Analyse-API.

| Stand                                      | Match                    | Ergebnis                                        | Aktionen | finaler StateHash |
| ------------------------------------------ | ------------------------ | ----------------------------------------------- | -------: | ----------------- |
| Ausgangslauf                               | `match_0c33b84f66d564f9` | Runner, `corp_deck_empty`                       |      149 | `fnv1a:6e6123b2`  |
| nach erstem Score-Fix                      | `match_f605bd005514f20c` | Runner, `corp_deck_empty`                       |      152 | `fnv1a:a63f2c17`  |
| nach zweitem Score-Fix auf alter Basis     | `match_665f42d9261b3676` | Runner, `corp_deck_empty`, 2:2                  |      153 | `fnv1a:530f166a`  |
| nach Main-Abgleich, Workbranch             | `match_5d3fcc740a02c228` | Abbruch bei D23: `missing_plan_module_coverage` |       22 | nicht terminal    |
| identische aktuelle Main-Basis             | `match_1d9102cdac482cab` | identischer Abbruch bei D23                     |       22 | nicht terminal    |
| nach Coverage-Fix                          | `match_c7144122aaeafb8b` | Runner, `corp_deck_empty`, 2:1                  |      165 | `fnv1a:704ae165`  |
| nach Deckout-Fix                           | `match_161734b3d1cf1c33` | Runner, `corp_deck_empty`, 2:1                  |      176 | `fnv1a:63eda744`  |
| final nach enger terminaler Parent-Bindung | `match_e17749ea32acc45e` | Runner, `corp_deck_empty`, 2:1                  |      176 | `fnv1a:14153280`  |

Der finale Lauf endete regulär. Er enthält 176 Decisions, 176 vollständige
Detailtraces und 177 Events einschließlich des terminalen Events. Acht Runs,
zwei erfolgreiche Runs, zwei gestohlene und eine von Corp gescorte Agenda
sind im Ergebnis-Snapshot verankert. Es gab keine Fallbacks, Timeouts,
Debug-/Apply-Abweichungen, fehlenden Planabdeckungen, Maintenance-Warnungen
oder nicht verfügbaren Bundle-Abschnitte.

## Vollständiger Decision-Denominator des finalen Replays

Jede Decision ist genau einer Klasse zugeordnet:

- `plausibel`: 160, alle nicht nachfolgend aufgeführten Decisions;
- `prüfbedürftig`: 10, D29, D53, D74–D76, D95, D122, D131, D138 und D139;
- `Finding`: 0 im finalen Replay;
- `trace-limitiert`: 6, D1, D2, D17, D117, D130 und D174;
- Summe: 176 von 176.

Die drei frühen freiwilligen Draws D29, D53 und D95 sind einzeln außerhalb
des jetzt verbindlichen kurzen Deckout-Horizonts und besitzen einen
erkennbaren Economy- oder Defense-Nutzen. Kumulativ verbrauchen sie dennoch
fünf Karten und bleiben deshalb prüfbedürftig. D74–D76 und D139 exponieren
Agenden gegen öffentlich passende Breaker; D138 legt zuvor eine dritte
HQ-ICE-Schicht bei nur einer R&D-Schicht. D122 und D131 sind wiederholte
Archives-Runs ohne im Trace belegten unmittelbaren Payoff.

Die Mulligan- und Discard-Choices sind legal, exakt gebunden und mit der
gewählten Option persistiert. Nur die vergleichende Option-für-Option-
Begründung fehlt, weshalb sie als trace-limitiert und nicht als Fehler gelten.
Die Decline-Rez-Fenster D79 und D99 boten dagegen jeweils ausschließlich
`decline_rez` als LegalAction; D142 rezzt die später finanzierbare Wall of
Static. Diese Fenster sind daher plausibel und keine KI-Versäumnisse.

## Behobene Fehler

### 1. Installierte, sicher scorebare Agenda durch Geschwisterplan unterbrochen

Im Ausgangsmatch wechselte D42 trotz einer legalen und im selben Zug
vollständig erreichbaren Advance-/Advance-/Score-Folge auf den Schutz einer
anderen Agenda. Der generische Fix bindet dringende exakte P1–P3-Score-Heads
an `same_root`.

### 2. Exakte Score-Linie nach gewonnener Action Capacity erneut verdrängt

Im ersten Replay verlor ein `executable_now`-Score-Root die gleichrangige
Auswahl gegen einen nur `executable_with_support` erreichbaren Economy-Support
für eine andere Agenda. Die zusätzliche Obligation
`urgent-exact-score-owner:<priority>` hält die Restplanung beim exakten
`corp.score_agenda`-Root.

Beide Score-Fixes sind im finalen Replay erneut sichtbar: D39–D44 bleiben
durchgehend beim identischen Root und Executor und führen über Overtime,
Install, drei Advances und Score. LegalAction- und Choice-Autorität bleiben
unverändert.

Regressionstest:
`packages/ai/src/plans/corp-turn-planner-selected-head.test.ts`.

### 3. Rig beansprucht Coverage-Aktionen, kann aber nur die erste Handantwort materialisieren

Der nach `main` integrierte Stand scheiterte reproduzierbar bei D23. In der
Hand lag zuerst ein vier Credits teurer Worm bei nur drei Credits, danach ein
kostenlos legal installierbarer Krash. `runner.rig_and_coverage` beanspruchte
alle rollenpassenden Installationen, veröffentlichte für die eigentliche Route
aber nur die Action-IDs des ersten Hand-Breakers. Der Development-Plan durfte
Krash wegen der Rig-Ownership ebenfalls nicht übernehmen. Das Ergebnis war
`missing_plan_module_coverage` trotz legaler, starker Coverage-Aktion.

Der Fehler trat sowohl im Workbranch als auch auf der identischen aktuellen
Main-Basis auf und wurde deshalb gemäß dem Prozess als reguläres
Integrations-Finding behandelt. Der generische Fix bewertet alle legalen
rollenpassenden Coverage-Installationen, sortiert sie deterministisch nach
ihrem Wert und veröffentlicht sie beim zuständigen Rig-Plan. Spezialisierte,
exakt gebundene Upgrade-/Kosten-Recovery-Routen behalten ihre engere Bindung.

Im finalen Replay installiert D23 Krash über
`runner.rig_and_coverage`, P4, mit 100 Prozent Planabdeckung und ohne
Fallback. Root, Executor und Action-ID gehören weiterhin demselben Rig-Plan.

Regressionstest:
`routes every legal coverage answer through Rig when the first hand answer is unaffordable`
in `packages/ai/src/runtime/plan-first-live-runtime.test.ts`.

### 4. Economy-Draw umgeht den bereits erkannten Deckout-Horizont

Im Replay `match_c7144122aaeafb8b` blockierte D126 den normalen Corp-Draw
ausdrücklich als `blocked_deckout_horizon`, wählte aber über `corp.economy`
Night Shift. Deren zertifizierte Projektion zieht ebenfalls eine Karte. Bei
drei Karten in R&D reduzierte die Aktion den verbleibenden Pflichtzieh-
Horizont auf zwei und trug direkt zum verlorenen Pflichtziehzug D165 bei.

Die Ursache war ein Plangrenzenfehler: Die zentrale Draw-Arbitration kannte
den Horizont, ein offener Economy-Owner durfte die Ablehnung aber überstimmen.
Der Fix verwendet nun dieselbe generische Pflichtzieh-Horizontregel für jede
freiwillige Corp-Aktion mit zertifiziertem Kartenverbrauch. Solche Aktionen
werden weder als unmittelbare Economy-Konversion noch als Funding-Head
materialisiert und erhalten eine explizite nichtproduktive Disposition. Eine
Ausnahme bleibt nur für einen exakt gebundenen, noch vor der nächsten
Pflichtziehung terminalen Score-Bedarf.

Im finalen Replay weist D126 Night Shift owner-korrekt als
`corp.economy:explicitly_nonproductive` mit
`corp_voluntary_draw_blocked_deckout_horizon:remaining_after:2` aus. D126–D128
verwenden stattdessen drei Basic-Credit-Schritte desselben Score-Support-
Parents. Der Fix verzögert die Niederlage von D165 auf D176 um einen vollen
Corp-/Runner-Zyklus, ändert aber weder Gewinner noch Agenda-Stand.

Regressionen liegen in `corp-draw-admission.test.ts`,
`corp-action-disposition-contributors.test.ts` und
`plan-first-live-runtime.test.ts`. Der bestehende terminale Score-
Ausnahmetest bleibt grün.

## Analyse des Gewinners

Der Runner gewann erneut durch Corp-Deckout und nicht durch Agenda-Matchpoint.
Seine tragenden Verhaltensmuster waren:

- D8–D14 probten R&D und HQ, zwangen zwei ICE-Rezzes und lieferten frühe
  Pfadinformation;
- D23 schloss nach dem Coverage-Fix die fehlende Wall-Abdeckung mit Krash,
  während Codecracker die Code-Gate-Rolle bereits trug;
- D46–D49 entwickelten Hand und HQ Interface; Economy-Schritte hielten danach
  ausreichend Credits für tatsächliche Contest-Linien bereit;
- D78–D88 und D141–D154 contesteten zwei sichtbar vorbereitete Remotes. Alle
  Pump-, Break-, Continue-, Access- und Steal-Fenster waren finanziert und
  owner-konsistent;
- D98–D107 entfernten Data Masons aus der Remote;
- D175 erkannte bei leerem R&D den erzwungenen Sieg und beendete den Zug über
  `runner.secure_terminal_win`.

Prüfbedürftig bleiben die Archives-Runs D122 und D131. Der Trace priorisiert
jeweils `runner.pressure_central`, belegt aber gegenüber Draw oder Credit
keinen unmittelbaren Informations- oder Tempovorteil. Für einen Fix fehlt
weiterhin ein belastbarer Folgewertvergleich.

## Warum Corp verlor

Die unmittelbare Ursache ist exakt rekonstruierbar. Nach der Fünf-Karten-
Starthand lagen 18 Karten in R&D. Bis zum terminalen Pflichtziehzug wurden
verbraucht:

- 13 erfolgreiche Pflichtziehungen;
- fünf freiwillige Draws: zwei Karten durch Night Shift und Basic Draw sowie
  drei Karten durch Annual Reviews;
- keine aus R&D gestohlene Agenda; beide Steals kamen aus Remotes.

Damit gilt `18 - 13 - 5 = 0`; D176 kann die nächste Pflichtkarte nicht ziehen.
Der behobene D126-Draw gehört nicht mehr zu dieser Rechnung und schenkt Corp
einen zusätzlichen Zug, reicht aber allein nicht zum Sieg.

Die Niederlage ist eine Mischung aus Deck-/Matchup-Struktur und veränderbaren
Verhaltensmustern, nicht bloß Pech:

- Die 23-Karten-Corp-Liste ist kurz und enthält starke Draw-Effekte. Die drei
  früheren freiwilligen Draw-Aktionen sind einzeln noch sicher, verdichten aber
  den strategischen Deckout-Cluster.
- Die Corp-ICE besteht aus Walls und Code Gates. Das öffentlich entwickelte
  Duo Krash/Codecracker trifft diese Auswahl genau; es gibt keine Sentry-
  Abdeckung, die das Rig-Matchup brechen würde.
- Punitive Counterstrike und Closed Accounts blieben ohne verlässlichen
  Tag-Lieferanten tote beziehungsweise sehr schwache Karten. Corp verwirft
  beide später trace-limitiert.
- Corp scoret die durch die zwei Ownership-Fixes geschlossene erste Hostile-
  Linie. Die späteren Projekte D74–D76 und D139 überleben dagegen den
  öffentlich bezahlbaren Remote-Contest nicht und werden gestohlen.
- D138 verstärkt HQ trotz bereits sichtbarer HQ-Abwehr nochmals, während R&D
  einfach geschützt bleibt. HQ Interface erklärt die Wahl teilweise; der
  Preis für andere Server bleibt dennoch prüfbedürftig.

Gesamturteil: Der klare Plangrenzenfehler im späten Draw ist behoben und hat
einen messbaren Spieleffekt. Die verbleibenden Draw-, Defense-, Score-
Expositions- und Archives-Muster sind ausreichend auffällig für die
Indizienmatrix, tragen aber noch keinen eindeutig besseren generischen
LegalAction-Pfad. Deshalb entsteht aus dem letzten Replay kein weiterer Fix.

## Zyklusübergreifende Matrixauswertung

SP-002 und SP-003 bleiben als zwei technische Ausprägungen des gemeinsamen
Clusters `corp-score-plan-conversion` behoben. SP-008 bildet einen neuen
Coverage-Ownership-Cluster und ist durch aktuelle Main-Basis, Workbranch,
Regression und vollständiges Replay vierfach belegt.

Der bisherige Verdachtscluster `corp-deck-exhaustion-horizon` wurde nicht
pauschal geschlossen. SP-009 isoliert nur den eindeutig widersprüchlichen
späten Economy-Draw und ist behoben. SP-004 bleibt für die früheren, einzeln
noch sicheren Draws offen. So wird die verdichtete Matrix weder ignoriert noch
über einen zu breiten Fix verallgemeinert.

SP-005 bis SP-007 erhalten zusätzliche Evidence aus dem finalen Replay. Die
zweite gestufte Agenda-Exposition und der zweite Archives-Run erhöhen die
Dringlichkeit, ersetzen aber noch nicht den fehlenden Zustandsvergleich mit
einer belegbar besseren Alternative.

## Verifikation und Dokumentationsprüfung

Die fokussierten Regressionen für beide neuen Fehler sowie die angrenzenden
Score-, Coverage-, Draw- und Plannerpfade sind grün:

- vier Runtime-Regressionen zu Coverage, günstiger Breaker-Auswahl, dringender
  Remote-Konversion und Night Shift;
- 23 Tests in `corp-draw-admission.test.ts` und
  `corp-action-disposition-contributors.test.ts`;
- der terminale Score-Ausnahmetest;
- 25 Tests in den vier fokussierten Corp-/Runner-TurnPlanner-Dateien.

Der AI-Typecheck zeigt ausschließlich sechs vorbestehende Baselinefehler: zwei
`possibly undefined`-Diagnosen außerhalb der geänderten Pfade und vier
fehlende CardSpec-Migrationsreports. Keine Diagnose betrifft eine Zyklusdatei.
Zwei ältere Decision-Checkpoint-Dateien besitzen zusätzlich bereits
inkonsistente Fixture-StateHashes; der gezielt neu gehashte terminale
Ausnahmetest besteht.

`change-compass.md`, `README.md`, `planning-architecture.md` und
`turn-campaign-planner.md` beschreiben bereits die hergestellten
Ownership-Regeln: Coverage gehört dem Rig-Plan, und Support darf die
Entscheidungsautorität seines Parents nicht umgehen. Der Deckout-Fix erweitert
keinen Architekturvertrag, sondern wendet eine bestehende Draw-Sicherheitsregel
planübergreifend an. Eine Architekturtextänderung ist deshalb nicht nötig;
Review, Indizienmatrix und der wiederverwendbare Selbstspiel-Skill tragen die
neue Prozessevidence.
