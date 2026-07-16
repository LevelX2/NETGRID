# Evidence: Match 36BA22D6 Runner-Remediation 2026-07-17

Status: Analyse abgeschlossen, Umsetzung freigegeben, Checkpoint-Capture folgt

## Match und Datenbasis

- Match: `match_36ba22d6a89b2ac4`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: schwer, Profil `runner-ai-v0.9-hard`
- Seed: `match-mro0dqof-18v0ha2`
- Zeitraum: 2026-07-16 23:27 bis 23:56 Uhr Europe/Berlin
- Endstand: StateVersion 179, StateHash `fnv1a:97bd32d1`
- Ergebnis: Korp gewinnt durch Flatline
- Runtime-SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Datenumfang: 180 Events, 180 StateSnapshots, 1 GameState und 98
  AI-Decision-Traces
- Coverage: 98 erwartete Runner-KI-Entscheidungen, 98 passende Traces, keine
  fehlenden, verwaisten, doppelten oder typabweichenden Zuordnungen

Die SQLite-Datei wurde ausschließlich read-only geöffnet. Historische
Bewertungen verwenden den damaligen Runner-PlayerView-, LegalAction-, Memory-,
Plan- und DecisionDebug-Kontext. Spätere öffentliche Ereignisse werden nur
als Folgebeobachtung verwendet.

## Deck- und Hint-Audit

Der Runner verwendete den unveränderlichen Snapshot
`local_runner_krashkurs_clown_kreditmaschine_2026_07_11_snapshot_v0_6` mit
45 Karten und 20 eindeutigen Definitionen. Der vollständige Deck-Audit ergab:

- 20/20 aktive Hints vorhanden;
- 20/20 kompilierte Hints vorhanden;
- 20/20 Inspector- und Derived-Facts-Einträge vorhanden;
- keine Ausschlüsse, Blocker oder Warnungen;
- Temple Microcode Outlet und The Short Circuit sind korrekt als
  Programmsuchwerkzeuge erkannt;
- Streetware Distributor ist korrekt als langsame Turn-Start-Auszahlung mit
  aufladbarem Counterpool beschrieben;
- Dedicated Response Team ist korrekt als `on_access`-Payoff mit 3 Meat
  Damage bei getaggtem Runner beschrieben.

Kartentext, Rules Engine und Hintdaten sind für die freigegebenen Findings
nicht die Fehlerquelle. Die Semantik geht in Opening-Hand-, Plan-, Bank-,
Trace- oder Access-Risk-Consumern verloren.

## Vollständige Decision-Coverage

| Decision | SV | Auswahl | Beste sichtbare Alternative | Status | Begründung |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 0 | Mulligan | Keep | Finding | Die Hand besitzt vier Economy-Karten und mit Temple eine ausführbare Programmsuche; ein pauschaler Pressure-ohne-Breaker-Cap ignoriert die Suchlinie. |
| 2 | 7 | Basis-Credit für Spin Chip | R&D-Run | plausibel | Initialer, noch unmittelbar konvertierbarer Setup-Schritt. |
| 3 | 8 | Spin Chip installieren | R&D-Run | plausibel | Install schließt den finanzierten Kurzplan und der freie Run folgt im selben Zug. |
| 4 | 9 | R&D-Run | gleich | plausibel | Freier Zentralpfad mit unbekanntem Access. |
| 5 | 10 | R&D accessen | keine | plausibel/erzwungen | Genau eine produktive Access-Aktion. |
| 6 | 11 | Basis-Credit | Draw | plausibel | Bei 0 Credits stellt der Credit die Mindestliquidität wieder her. |
| 7 | 12 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 8 | 18 | Draw | gleich | plausibel | Setup-Suche aus schwacher Hand. |
| 9 | 19 | Cruising for Netwatch | gleich | plausibel | Sofortiger Draw-/Economy-Ertrag. |
| 10 | 20 | Basis-Credit für Cybermodem | gleich | plausibel isoliert | Früher Funding-Start kann legitim sein. |
| 11 | 21 | Basis-Credit für Cybermodem | gleich | plausibel isoliert | Noch keine belegte Langzeitdominanz. |
| 12 | 22 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 13 | 23 | doppelten Clown abwerfen | andere Handkarte | plausibel | Eine zweite identische Utility-Kopie ist der schwächste aktuelle Keep. |
| 14 | 30 | Basis-Credit | R&D-Run, Raw 2263 | Finding | Langzeit-Funding verdrängt akuten freien Zentraldruck. |
| 15 | 31 | Basis-Credit | R&D-Run, Raw 2263 | Finding | Negativer Rohscore wird vom Plan erzwungen. |
| 16 | 32 | Basis-Credit | R&D-Run, Raw 2263 | Finding | Keine Konversion oder neue Evidence. |
| 17 | 33 | Basis-Credit | R&D-Run, Raw 2263 | Finding | Der ganze Zug wird ohne Planabschluss verbraucht. |
| 18 | 34 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 19 | 40 | Basis-Credit | R&D-Run, Raw 1913 | Finding | Derselbe Fundingplan verdrängt erneut den produktiven Run. |
| 20 | 41 | Basis-Credit | R&D-Run, Raw 1913 | Finding | Keine neue Planrevalidierung. |
| 21 | 42 | Basis-Credit, Raw -1421 | R&D-Run, Raw 1913 | Finding | Planbindung ist klar dominiert; Cybermodem wird anschließend nicht installiert. |
| 22 | 43 | R&D-Run | gleich | plausibel | Der Runner konvertiert den aufgebauten Pool wenigstens in Accessdruck. |
| 23 | 45 | Data-Raven-Trace auslösen | keine bezahlbare Break-Linie | plausibel | Keine günstigere legale Encounter-Linie. |
| 24 | 47 | Trace-Bid 5 | Bid 0 | plausibel | Eine einzelne Trace wird vollständig verhindert. |
| 25 | 48 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 26 | 49 | Run fortsetzen | gleich | plausibel | Erreichbarer Access. |
| 27 | 50 | Access | keine | plausibel/erzwungen | Genau eine Access-Aktion. |
| 28 | 51 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 29 | 57 | Basis-Credit | Streetware installieren, Raw 1792 | Finding | Cybermodem-Funding verdrängt eine sofort nutzbare Economy-Engine. |
| 30 | 58 | Basis-Credit | Streetware installieren, Raw 1792 | Finding | Plan bleibt trotz größerem Scoreabstand absolut. |
| 31 | 59 | Basis-Credit | Streetware installieren, Raw 1792 | Finding | Keine Planfortschrittsgrenze. |
| 32 | 60 | Basis-Credit | Draw, Raw 1123 | Finding | Der vierte Funding-Click erzeugt erneut keinen Planabschluss. |
| 33 | 61 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 34 | 67 | Basis-Credit, Raw -221 | Streetware installieren, Raw 1792 | Finding | Plan hält auch bei negativen Rohscores. |
| 35 | 68 | Streetware installieren | gleich | plausibel | Günstige verzögerte Economy mit verbleibenden Folgeclicks. |
| 36 | 69 | Basis-Credit, Raw -221 | Streetware aufladen, Raw 1407 | Finding | Der alte Handkartenplan verdrängt die gerade installierte produktive Folgeaction. |
| 37 | 70 | Streetware erstmals aufladen | gleich | plausibel | Erste Aufladung schafft einen realen künftigen Ertrag. |
| 38 | 71 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 39 | 77 | Streetware auf 5 Bits | Trace ebenfalls Aufladen | Finding | Direkter Bankbonus ignoriert die Background-Kadenz. |
| 40 | 78 | Streetware auf 8 Bits | Trace ebenfalls Aufladen | Finding | Wiederholter voller Bonus ohne Grenznutzenprüfung. |
| 41 | 79 | Streetware auf 11 Bits | Trace ebenfalls Aufladen | Finding | Dritter Click desselben Zuges bleibt ungedrosselt. |
| 42 | 80 | Streetware auf 14 Bits | Trace ebenfalls Aufladen | Finding | Vierter Click überschießt zusätzlich den Zielwert 12. |
| 43 | 81 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 44 | 87 | Probe-Run auf Remote 1 | Temple zuerst | plausibel | Unbekanntes ICE und sichtbare Score-Threat rechtfertigen einen Informationslauf. |
| 45 | 89 | Data-Wall-ETR auslösen | keine Break-Linie | plausibel/erzwungen | Krash war noch nicht installiert. |
| 46 | 90 | Temple spielen | gleich | plausibel | Reaktion auf die nun bekannte Breaker-Anforderung. |
| 47 | 91 | Krash suchen | andere Programme | plausibel | Universeller Breaker beantwortet den sichtbaren Pfad. |
| 48 | 92 | Krash installieren | gleich | plausibel | Schließt die Coverage-Lücke. |
| 49 | 93 | Remote-1-Run | gleich | plausibel | Akute Advanced-Root-Bedrohung und nun erreichbarer Pfad. |
| 50 | 94 | Data Wall brechen | gleich | plausibel | ETR muss für Access gebrochen werden. |
| 51 | 95 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 52 | 96 | Run fortsetzen | gleich | plausibel | Access bleibt erreichbar. |
| 53 | 98 | zweites Data Wall brechen | gleich | plausibel | ETR muss gebrochen werden. |
| 54 | 99 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 55 | 100 | Run fortsetzen | gleich | plausibel | Access bleibt erreichbar. |
| 56 | 102 | erste Hunting-Pack-Trace auslösen | Pump ausgeschlossen | plausibel | Krash kann keine bezahlbare Break-Linie herstellen. |
| 57 | 104 | Bid 5 von 8 Credits | Bid 0 als Sequenzalternative | prüfbedürftig | Zweite identische Trace bleibt unbezahlbar; der eine verbleibende Tag reicht für binäre Punish-Effekte. |
| 58 | 105 | zweite Hunting-Pack-Trace auslösen | Pump ausgeschlossen | plausibel | Keine Break-Linie. |
| 59 | 107 | Bid 0 | gleich | plausibel | Der Runner kann Trace 5 nicht mehr verhindern. |
| 60 | 108 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 61 | 109 | Run fortsetzen | gleich | plausibel | Erreichbarer Score-Threat-Access. |
| 62 | 110 | Access | keine | plausibel/erzwungen | Genau eine Access-Aktion. |
| 63 | 111 | Marked Accounts stehlen | keine sinnvolle | plausibel | Zwei Agenda-Punkte. |
| 64 | 112 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 65 | 118 | Tag entfernen | gleich | plausibel | Beseitigt die bekannte Punish-Voraussetzung. |
| 66 | 119 | Basis-Credit | gleich | plausibel | RunTarget fordert mehr Liquidität. |
| 67 | 120 | Basis-Credit | gleich | plausibel | Weiterhin konkrete Finanzierung. |
| 68 | 121 | Remote-1-Run, Score 951 | Credit, Raw 2619 | Finding | Eigene Evaluation sagt `gain_credits_first`; der Run wird nach erstem ICE mangels Restpfad abgebrochen. |
| 69 | 122 | Data Wall brechen | gleich | plausibel | Bereits begonnener Run, ETR muss gebrochen werden. |
| 70 | 123 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 71 | 124 | Jack-out | Continue, Raw 103 | plausibel | RunPlan-Revalidierung erkennt korrekt den nicht mehr erreichbaren Access. |
| 72 | 125 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 73 | 134 | Draw | Basis-Credit, Raw 2619 | plausibel | Sucht nach effizienterer Economy statt reinem Basis-Funding. |
| 74 | 135 | Draw | Basis-Credit, Raw 2619 | plausibel | Führt zur unmittelbar nutzbaren Panzer-Run-Linie. |
| 75 | 136 | Panzer Run | gleich | plausibel | Netto-Credits und Draw schließen die Economy-Suche produktiv ab. |
| 76 | 137 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 77 | 138 | Clown abwerfen | andere Handkarte | plausibel | Krash ist installiert; der Keep-Score schützt unmittelbare Economy und Suchoptionen. |
| 78 | 144 | Basis-Credit | gleich | plausibel | Bereitet Score vor. |
| 79 | 145 | Score spielen | gleich | plausibel | Sofortige Nettoökonomie. |
| 80 | 146 | Basis-Credit | gleich | plausibel | Noch kein klar dominierter Schritt. |
| 81 | 147 | letzter Credit für Cybermodem, Score 719 | freier Remote-3-Run, Raw 1459 | Finding | Funding ist im selben Zug nicht konvertierbar und wird im Folgezug verlassen. |
| 82 | 148 | Zug beenden | keine | plausibel/erzwungen | Keine Klicks. |
| 83 | 154 | Remote-1-Run | Remote 3, Raw 1459 | plausibel | Advanced Root ist die höhere sichtbare Score-Bedrohung. |
| 84 | 156 | Data Wall brechen | gleich | plausibel | ETR muss gebrochen werden. |
| 85 | 157 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 86 | 159 | Run fortsetzen | gleich | plausibel | Access bleibt erreichbar. |
| 87 | 161 | zweites Data Wall brechen | gleich | plausibel | ETR muss gebrochen werden. |
| 88 | 162 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 89 | 164 | Run fortsetzen | gleich | plausibel | Access bleibt erreichbar. |
| 90 | 166 | erste Hunting-Pack-Trace auslösen | Pump ausgeschlossen | plausibel | Keine bezahlbare Break-Linie. |
| 91 | 168 | Bid 5 von 7 Credits | Bid 0 als Sequenzalternative | prüfbedürftig | Zweite Trace bleibt unbezahlbar; Teil-Bid verhindert den entscheidenden Tag nicht. |
| 92 | 169 | zweite Hunting-Pack-Trace auslösen | Pump ausgeschlossen | plausibel | Keine Break-Linie. |
| 93 | 171 | Bid 0 | gleich | plausibel | Trace 5 kann nicht mehr verhindert werden. |
| 94 | 172 | ICE passieren | gleich | plausibel | Encounter abgeschlossen. |
| 95 | 175 | Run fortsetzen, Score 103 | Jack-out, Score -351 | Finding | Zwei bekannte DRTs verursachen kumulativ 6 Meat Damage gegen 4 Handkarten; Flatline ist garantiert. |
| 96 | 176 | erstes DRT accessen | keine | Folge/erzwungen | D95 hat das letzte sichere Exit-Fenster passiert. |
| 97 | 177 | erstes DRT trashen | Decline | Folge | Der zweite Access ist bereits tödlich; Trash ist nicht ursächlich. |
| 98 | 178 | zweites DRT accessen | keine | Folge/erzwungen | Flatline ist die erzwungene Folge von D95. |

## Finding F1: Opening-Hand-Cap ignoriert ausführbare Breaker-Suche

Die Starthand enthielt Temple Microcode Outlet, Cruising for Netwatch,
zweimal Panzer Run und Cloak. Die aktuelle Bewertung erkennt 0 Breaker, 5
Economy-Signale, 1 Setup- und 4 Pressure-Karten. Wegen mindestens drei
Pressure-Karten ohne direkt gehaltenen Breaker deckelt sie den Score trotz
Economy auf 44; der Hard-Keep-Threshold ist 50.

Temple ist als `program_search` korrekt gehintet und die Deckstrategie
`runner.search.breaker` ist aktiv. Der Opening-Hand-Consumer übersetzt die
billige, sofort ausführbare Suchlinie aber nicht in Breaker-Zugriff. Das
Mulligan liefert anschließend Lockjaw, Spin Chip und zwei Clowns ohne
vergleichbare Sofortökonomie.

## Finding F2: Cybermodem-Funding besitzt keinen belastbaren Abschlussvertrag

Cortical Cybermodem kostet 11 Credits. Der Plan beginnt zunächst plausibel,
bleibt danach aber über mehrere Runner-Züge dominant:

- D14 bis D21 verdrängen freie R&D-Runs mit Raw Scores 1913 bis 2263;
- D29 bis D36 verdrängen Streetware-Install, Draw und erste Aufladung;
- D81 verdrängt mit dem letzten Click einen freien Remote-3-Run;
- beim Erreichen von 11 Credits wird Cybermodem nicht installiert;
- nach Runs oder anderen Spends wird derselbe Fundingwunsch wieder aufgebaut;
- Cybermodem wird im gesamten Spiel nie installiert.

Die Plan-Arbitration schützt den gemappten Credit-Schritt trotz negativem
Rohscore und großen Scoreabständen. Der aktuelle `urgent run now`-Ausweg
greift bei einem Basis-Credit mit nur einem verbleibenden Click nicht. Der
Plan benötigt einen bounded Horizon-, Konversions- und
Abbruch-/Revalidierungsvertrag.

## Finding F3: Bank-Commitment umgeht die Portfolio-Kadenz

Streetware wird bei D37 sinnvoll erstmals auf drei Bits geladen. Zu Beginn
des nächsten Runner-Zugs sind nach der ersten Auszahlung zwei Bits vorhanden.
D39 bis D42 laden in einem Zug viermal:

`2 -> 5 -> 8 -> 11 -> 14`

Jede Action erhält erneut `build_second_load` und einen Bonus von 1100. Die
Trace-Evidence meldet für jede Wiederholung
`bankPortfolioActionsThisTurn:0`, obwohl der PlanPortfolio-Vertrag für einen
Background-Plan höchstens eine Action pro Zug vorsieht. Der direkte
Bank-Score konsumiert die Kadenz nicht.

Über das gesamte Spiel werden mit fünf Actions 15 Bits aufgeladen. Nur zwei
Credits werden ausgezahlt; nach dem Tag trashte die Korp Streetware mit 13
verbleibenden Bits. Der Fix muss Auszahlungsdauer und Grenznutzen beachten,
darf aber erste Aufladungen und echten akuten Cashout-/Fundingbedarf nicht
pauschal blockieren.

## Finding F4: Remote-Contest-Mapping widerspricht seiner Evaluation

Bei D68 besitzt der Runner 3 Credits. Die konkrete Remote-1-Evaluation nennt:

- sichtbare Breakkosten: 4;
- projizierte Credits nach dem Pfad: 1;
- Empfehlung: `gain_credits_first`;
- Raw-Sieger: Basis-Credit mit 2619;
- gemappter Run: 951.

Der fortgeschriebene `runner.contest_remote`-Plan blockiert den Raw-Sieger
trotz Scoreabstand 1668. Nach dem ersten Data Wall sind nur noch 1 Credit und
ein bekannter unpassierbarer Restpfad vorhanden. Die RunPlan-Revalidierung
empfiehlt bei D71 korrekt den Jack-out. Der Fehler liegt im Start-Run bei D68,
nicht im späteren Abbruch.

## Finding F5: Trace-Choice bewertet die einzelne Trace statt der Sequenz

Hunting Pack besitzt in beiden Runs zwei sichtbare Trace-5-Subroutinen. Bei
D57 und D91 zahlt der Runner jeweils 5 Credits für die erste Trace und 0 für
die zweite. Ein zusätzlicher Tag wird verhindert, der binäre Zustand
`Runner tagged` aber nicht.

Der aktuelle Trace-Consumer ermittelt den Tagbetrag nur, wenn genau ein
Tag-Trace-Effekt im Encounter vorhanden ist. Bei mehreren Subroutinen fällt
die Sequenzinformation aus der Budgetprüfung. Die historische Schwäche ist
fachlich plausibel, aber noch nicht freigabefähig für einen Fix: Eine
aktuelle Einzelrekonstruktion ohne wiederhergestelltes RunPlan-Memory wählt
bei D91 bereits `bid_0`, und ein fremder Branch verändert denselben Consumer.
Der strikte Checkpoint entscheidet.

## Finding F6: Sichtbarer kumulativer Access-Schaden erreicht den Runner nicht

Am D95-Jack-out-Fenster sind beide Dedicated Response Teams rezzed, bekannt
und im Runner-PlayerView sichtbar. Der Runner besitzt:

- 1 Tag;
- 4 Handkarten;
- 2 Credits;
- LegalActions `continue_run` und `jack_out` im historischen Trace.

Jedes DRT verursacht beim eigenen Access 3 Meat Damage, wenn der Runner
getaggt ist. Continue garantiert damit 6 Damage und Flatline. Die Runtime
bewertet Continue nur mit Typbonus 78 und Actorbonus 25. Jack-out erhält den
Typbonus 74, Actorbonus 25 und die generische Pressure-Loss-Strafe -450.

Der RunPlan meldet noch ein Budget von 11, obwohl nach Breaks und Trace-Bid nur
2 Credits vorhanden sind. Entscheidend ist jedoch die fehlende sichtbare
Access-Risk-Projektion: Weder die beiden bekannten `on_access`-Damage-Payoffs
noch ihre kumulative Tödlichkeit erreichen die finale Choice.

## Aktuelle read-only Einzelgegenprüfung vor Checkpoint-Capture

Auf Ausgangs-`main` `abe7a2970` wurden die historischen Snapshots ohne
Wiederherstellung des damaligen Runtime-Memory produktiv neu bewertet:

| Decision | aktuelles Einzelresultat | Einordnung |
| --- | --- | --- |
| D01 | weiterhin Mulligan | aktuelle Reproduktion wahrscheinlich |
| D39-D42 | weiterhin viermal Streetware aufladen | aktuelle Reproduktion wahrscheinlich |
| D68 | weiterhin Remote-1-Run | aktuelle Reproduktion wahrscheinlich |
| D81 | weiterhin Basis-Credit | aktuelle Reproduktion wahrscheinlich |
| D91 | `bid_0` | möglicherweise bereits behoben; Memory-Checkpoint nötig |
| D95 | keine aktuellen LegalActions aus rohem Snapshot | Engine-/Rez-Fenster-Drift; valider Checkpoint oder Migration nötig |

Diese Einzelgegenprüfung ist kein Ersatz für die Checkpoint-Runtime. Nur der
strikte Capture mit TacticalPlan, PlanPortfolio, StrategicIntent und
RunnerRunPlan kann einen roten Verhaltensnachweis liefern.

## Akzeptanzkriterien vor Produktionsänderung

- D01, ein später Streetware-Schritt, D68, D81, D91 und D95 werden strikt
  capturt.
- Warmup-Drift ist null oder als Infrastrukturproblem dokumentiert.
- Nur `behavior_regression` wird als rote Behavior-Evidence akzeptiert.
- Jede rote Regel besitzt mindestens eine enge Gegenprobe, in der die neue
  Priorität bewusst nicht greift.
- Checkpoint-Expectations werden nach dem Red-Evidence-Commit nicht geändert.
- Keine zukünftige Root-, HQ-, Hand- oder Stack-Information gelangt in
  Fixture, Test oder produktiven Consumer.
