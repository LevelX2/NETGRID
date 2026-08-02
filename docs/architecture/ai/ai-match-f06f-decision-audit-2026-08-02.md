# Match f06f – vollständiger Corp-KI-Entscheidungsaudit

Status: Remediation umgesetzt und voll verifiziert

## Match und Provenienz

- Match: `match_f06f0fe345a11e0f`
- Modus: `human_runner_vs_corp_ai`
- Corp-Controller: KI, Schwierigkeit `normal`
- Seed: `match-msbj4emp-1rwtrsw:series-game-2`
- Ende: StateVersion 283, StateHash `fnv1a:85935a00`
- Ergebnis: Runner gewinnt 8:2 durch Agendapunkte
- Runtime-SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Evidence: 284 Events, 284 State-Snapshots, ein finaler GameState und 123
  detaillierte AI-Decision-Traces
- Coverage: 123 erwartete Decisions, 123 Trace-Zeilen, 123 exakte
  Event-Zuordnungen; keine fehlenden, verwaisten, doppelten oder
  actiontypfremden Verknüpfungen

Die Analyse verwendet pro Decision ausschließlich den damaligen
Corp-PlayerView, die damaligen LegalActions, das öffentliche Eventpräfix und
den gespeicherten KI-Trace. Spätere Agenda-Steals belegen Folgen, dienen aber
nicht als vorweggenommenes Wissen der früheren KI-Entscheidung.

## Gesamturteil

Alle 123 gewählten Actions waren nach damaliger und aktueller Rekonstruktion
legal. Historisch waren vier Entscheidungen klare strategische Fehler;
Decision 37 ist ein begründeter Vorläufer derselben Score-Closeout-Ursache wie
Decision 41. Der Strict-Warmup-Checkpoint zeigt jedoch, dass Decision 41 auf
dem aktuellen Code bereits korrekt behandelt wird. Drei Findings bleiben als
aktuelle `behavior_regression` rot.
Die spätere Rez-Sequenz ist lokal plausibel und kein eigener Fixpunkt. Der
Deck-Hint-/Consumer-Audit ist `ok`: 34/34 unterschiedliche und 45/45 gesamte
Corp-Karten besitzen aktive, seiten- und typkorrekte, reviewte Hints sowie
Runtime-/Shared-Definition und Implementierung. Es gibt keine blockierenden
Hint-Findings und keine Kartendatenkorrektur.

## Vollständige Decision-Coverage

### Mechanisch erzwungen oder ohne produktive Alternative

`1, 2, 6, 7, 11, 12, 16, 18, 23, 24, 28, 29, 33, 34, 38, 39, 43,
46, 50, 51, 55, 58, 62, 63, 67, 68, 72, 78, 83, 84, 85, 89, 90, 94,
95, 96, 100, 101, 105`

Das umfasst 18 Mandatory Draws, 18 End-Turn-Actions ohne verbleibende
produktive Klickroute sowie drei regel- oder handkapazitätsgebundene Choices.
Die Mulligan-Entscheidung führte zu einer kohärenten frühen Hand; die Discards
von Team Restructuring und Management Shake-Up waren vertretbar.

### Rez- und Decline-Fenster

`17, 44, 45, 56, 57, 73, 74, 75, 76, 77, 106, 107, 108, 109, 110,
111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123`

Scramble im frühen Score-Run, Code Corpse im Remote-Run und Scramble, beide
Ball and Chains sowie Filter im finalen R&D-Run wurden sinnvoll gerezzt. Nach
dem Absinken auf einen Credit waren D'Arc Knight, Haunting Inquisition und
Fire Wall nicht mehr finanzierbar. Die lokalen Declines sind daher nicht die
Ursache; die Budgetfehlentscheidung liegt vor dem Run.

### Freiwillige Action-Phase-Entscheidungen

| Decisions | Rekonstruierte Linie | Urteil |
| --- | --- | --- |
| 3–5 | Filter auf R&D, Accounts Receivable, Data Wall 2.0 auf HQ | sinnvoller Opening-Aufbau |
| 8–10 | Efficiency Experts, Day Shift, Scramble am Remote | kohärente Economy- und Remote-Vorbereitung |
| 13–15 | Corporate Coup installieren und zweimal advancen | richtige Rush-Linie |
| 19–22 | dreimal advancen und Corporate Coup scoren | richtiger, erfolgreicher Score |
| 25–27 | Coup-Auszahlung, Superior Net Barriers installieren, Coup-Auszahlung | Decision 26 falsch; 25 und 27 lokal vertretbar |
| 30–32 | Coup-Auszahlung, Chimera im Remote, Draw | plausible Stabilisierung |
| 35–37 | Accounts, GVA-Install, Coup-Auszahlung | 35/36 vertretbar; 37 schwächt den Scorehorizont |
| 40–42 | Advance, Coup-Auszahlung, Advance | 40/42 richtig; 41 verhindert sicheren Score |
| 47–49 | D'Arc Knight und Haunting Inquisition auf R&D, Draw | erste R&D-Verstärkung noch begründbar |
| 52–54 | Encryption Breakthrough installieren, Advance, Efficiency Experts | Decision 52 falsch; 53/54 können den exponierten Zustand nicht mehr retten |
| 59–61 | Code Corpse, Draw, Fire Wall auf R&D | 59/60 plausibel; 61 beginnt die Central-Überinvestition |
| 64–66 | Draw, Dr Dreff auf HQ, Basis-Credit | mit sichtbaren Ball-and-Chain-Folgen plausibel |
| 69–71 | Banpei auf HQ, Draw, BBS Whispering Campaign | plausibler Boardaufbau |
| 79–82 | Ball and Chain auf R&D, BBS-Rez, Draw, BBS-Auszahlung | isoliert vertretbar, kumulativ bereits zu central-lastig |
| 86–88 | BBS-Auszahlung, Omni Kismet auf HQ, BBS-Auszahlung | plausibel |
| 91–93 | zweites Ball and Chain auf R&D, Draw, BBS-Auszahlung | isoliert billig rezbar, kumulativ falsch priorisiert |
| 97–99 | BBS-Auszahlung, Twenty-Four-Hour Surveillance, Night Shift | vertretbare Hand-/Economy-Nutzung |
| 102–104 | weiteres Scramble auf R&D, zweimal BBS-Auszahlung | Decision 102 klar falsch; 103/104 richtig |

Damit sind alle 123 Entscheidungen genau einer Klasse zugeordnet.

## Freigegebene Findings

### F06F-01 – langfristige Agenda ohne tragfähigen Schutz- und Scorehorizont

- Zielcheckpoint: Decision 26, StateVersion 47
- Gewählt: Superior Net Barriers in einen nur einschichtig geschützten Remote
- Sichtbarer Zustand: sechs benötigte Advancement-Counter, mehrere zwingende
  Runnerfenster vor dem Score, finanzierter Runner und sichtbare
  Standard-Breaker-Coverage
- Historisches Trace-Ergebnis:
  `corp_funded_protected_score_install:remote_1`
- Fehler: die aktuelle Schutzwahrscheinlichkeit wird als ausreichendes
  Installationsfenster behandelt, obwohl die vollständige mehrzügige
  Konversionsroute nicht abgesichert ist
- Bessere sichtbare Alternative: Agenda in HQ halten; Corporate Coup oder
  Basic Economy nutzen und den vorhandenen Remote zuerst härten
- Owner: `corp.score_agenda`; konkreter Schutz bleibt typisierter Child-Need
  von `corp.defend_servers`

### F06F-02 – sicherer Same-Turn-Score verliert gegen freie Economy

- Zielcheckpoint: Decision 41, StateVersion 87
- Gewählt: Corporate Coup für drei Credits
- Sichtbarer Zustand: installierte Genetics-Visionary Acquisition, ein
  Advancement-Counter, zwei verbleibende Klicks und ausreichend Credits
- Vollständige bessere Linie: Advance, Advance, danach klickfreies Score
- Folge: die Agenda bleibt auf zwei von drei Countern und wird im nächsten
  Runnerzug gestohlen
- Decision 37 ist ein zugehöriger Schwachpunkt: Bei bereits hoher Liquidität
  wurde vor der Remote-Fortsetzung erneut freie Economy gewählt und damit ein
  Sicherheitspuffer aufgegeben.
- Owner: `corp.score_agenda`; Same-Turn-Erkennung, Prioritätsklasse,
  TurnPlanCommitment und Execution Lease müssen dieselbe residente
  Planinstanz erhalten
- Aktueller Reproduktionsstatus: bereits grün. Der unveränderte aktuelle
  Chooser wählt `advance_card` mit `corp.score_agenda`, Capability
  `advance_score_agenda` und derselben residenten Planinstanz. Kein weiterer
  Verhaltensfix ist zulässig; der Checkpoint bleibt als Regression erhalten.

### F06F-03 – Matchpoint-Agenda ohne rechtzeitigen Abschluss exponiert

- Zielcheckpoint: Decision 52, StateVersion 118
- Gewählt: Encryption Breakthrough in den Remote
- Sichtbarer Zustand: Runner bereits auf vier Punkten, sechs Credits,
  sichtbarer Krash und fünf verbleibende Advancement-Counter; ein Score im
  selben Corp-Zug ist unmöglich
- Historisches Trace-Ergebnis:
  `corp_funded_protected_score_install:remote_1`
- Bessere sichtbare Alternative: Agenda in HQ halten; Remote verteidigen oder
  Liquidität/Rezreserve aufbauen
- Folge: unmittelbarer Steal auf sechs Runnerpunkte
- Owner: `corp.score_agenda` mit exakter Protection-Delegation

### F06F-04 – Central-Layering ohne Druck- und Rezbudgetdisziplin

- Zielcheckpoint: Decision 102, StateVersion 240
- Gewählt: siebtes R&D-ICE Scramble für sechs Installationscredits
- Sichtbarer Zustand: mehrere innere ungerezzte ICE; keine belegte akute oder
  terminale R&D-Druckausnahme; zehn Corp-Credits vor der Installation
- Folge: nach zwei BBS-Auszahlungen acht Credits; im finalen Run bleiben die
  teuren inneren ICE unrezbar
- Bessere sichtbare Linie: BBS, BBS und Basic Credit; ungefähr 15 Credits zur
  Finanzierung der vorhandenen stärkeren ICE
- Kumulative Vorläufer: Fire Wall bei Decision 61 sowie Ball and Chain bei 79
  und 91. Die beiden Ball-and-Chain-Entscheidungen sind isoliert nicht klar
  falsch, zeigen gemeinsam aber dieselbe Central-Überinvestition.
- Zulässige Ausnahme: sichtbarer Multiaccess, wiederholte erfolgreiche
  Zentralruns oder terminale Zentralgefahr dürfen weitere Layer begründen,
  sofern Install-/Rezroute und Parentreserven vollständig finanziert bleiben.
- Owner: `corp.defend_servers`; bestehende globale Allokations- und
  Installroute, kein zweiter Central-Plan

## Consumer- und Architekturdiagnose

Die aktiven Kartenhints sind vollständig. Die Fehler liegen in vorhandenen
Consumern:

1. `scoreProjectForCandidate` lässt eine Agenda bei aktuell erfülltem
   Schutzthreshold zu, ohne den vollständigen Advancement-Horizont und alle
   gegnerischen Zugfenster ausreichend zu binden.
2. `visibleAgendaAdvanceCanCloseThisTurn`, Score-Priorität und Commitment
   müssen am historischen GVA-Zustand als eine durchgehende Owner-Kette
   geprüft werden.
3. `corpGlobalDefenseInstallRouteAssessment` akzeptiert im Hauptpfad jede
   Engine-zertifizierte Verringerung der Zugriffswahrscheinlichkeit als
   produktiv. Die vorhandenen Sättigungs-/Opportunity-Cost-Grenzen erreichen
   diesen Pfad nicht vollständig.
4. Der allgemeine Central-Pfad verwendet eine leere Score-Reserve; gebundene
   Score-/Remote-Parentreserven wirken deshalb nicht überall.
5. `corp.establish_scoring_remote` existiert als Modulrahmen, sein
   Live-Producer liefert aktuell jedoch keine `remoteProjects`. Die
   dokumentierte langfristige Remote-Nutzbarkeit ist damit nicht als
   residentes Projekt angeschlossen.

## Nicht freigabereif als eigener Fix

- Keine pauschale Sofort-Rez-Pflicht: das Match belegt korrekte
  Rezentscheidungen und die zulässige Ausnahme einer exakten Agendareserve.
- Kein hartes Drei-ICE-Limit: Multiaccess, wiederholter Druck und terminale
  Gefahr benötigen belegte Übersteuerungen.
- Keine separate Korrektur für Decisions 53/54: Sie sind Folgen der bereits
  falschen Agenda-Exposition bei Decision 52.
- Keine Hint-, Karten-ID-, Choice-Resolver- oder Spielregeländerung.

## Checkpoint-Ziele

P3 capturete Decisions 26, 41, 52 und 102 mit `strict`-Warmup und jeweils null
Warmup-Drifts. Decisions 26, 52 und 102 reproduzieren ausschließlich als
`behavior_regression`; Decision 41 ist bereits grün. Die Gegenproben für
verantwortbares Same-Turn-Rush-Scoring und eine vollständig finanzierte
zusätzliche R&D-Schicht sind vor dem Fix grün.

## Umgesetzte Korrektur

### Score-Owner und Engine-Horizont

Die Engine ergänzt jede exakte Agenda-Install-LegalAction um einen
actor-privaten, StateVersion-gebundenen Quote. Er enthält ausschließlich den
regelkorrekt berechneten Fortschritt bis zum Ende des aktuellen Corp-Zugs und
die garantiert flexiblen Klicks des nächsten Corp-Zugs. `corp.score_agenda`
verwendet diesen Quote fail-closed; die KI rechnet keine zukünftigen Klicks
parallel nach.

Ein längerer Scorehorizont ist nur zulässig, wenn ein bestehender Remote eine
exakt finanzierte Schutzroute mit Score-/Klickreserve besitzt. Zwei
unabhängig finanzierte beziehungsweise bereits gerezzte Schutzschichten
tragen die reguläre längere Linie. Eine einzelne Schicht reicht nur bei
höchstens einem fehlenden Horizontklick und Engine-zertifizierter
Zugriffswahrscheinlichkeit null. Nahe am Runner-Matchpoint verlangt ein
dünner Remote vor der Agenda-Installation zusätzliche Reife.

Damit bleiben Decisions 26 und 52 in HQ. Decision 41 behält denselben
residenten `corp.score_agenda`-Owner und avanciert weiter statt freie Credits
zu nehmen. Frühes, im selben Zug vollständig ausführbares Rush-Scoring bleibt
als grüne Gegenprobe erhalten.

### Bestehender Defend-Owner

`corp.defend_servers` wurde in seiner vorhandenen globalen
Allokations-/Installroute angepasst. Eine weitere Central-Schicht wird
abgelehnt, wenn bereits mindestens drei ICE liegen, alle ungerezzed sind und
keine der vorhandenen Druckevidenzen greift:

- sichtbarer Multiaccess,
- aktuelle oder wiederholte Runs/Accesses auf den Server,
- jüngste erfolgreiche Zugriffe oder
- servergebundene Effekte, die zusätzliche Verteidigung begründen.

Das ist kein hartes Drei-ICE-Maximum. Die vorhandene Multiaccess-Gegenprobe
mit sichtbarem R&D Interface und vollständig finanzierter zusätzlicher
Schicht bleibt grün. Decision 102 nimmt deshalb BBS-/Basis-Economy und kauft
nicht die siebte R&D-Schicht.

Der Score-Parent darf bei fehlender Remote-Reife weiterhin den vorhandenen
Protection-Need veröffentlichen; nur `corp.defend_servers` wählt daraus die
konkrete ICE-/Rezroute. `corp.establish_scoring_remote` wurde nicht als
zusätzlicher Live-Action-Chooser aktiviert. Choice-Resolver, Rez-Chooser,
Kartenhints und Spielregeln blieben unverändert.

## Verifikationsurteil

Alle vier F06F-Checkpoints sowie Rush- und Multiaccess-Gegenproben sind grün.
Die fokussierte Regression umfasst 361 AI-Tests; der vollständige Lauf umfasst
4563 AI-Tests in drei grünen Shards. Engine-Quote-Test, AI-/Engine-Typechecks,
AI-Strukturgates, Proteus-Readiness und Deck-Doctrine-Strategie-Gate sind
ebenfalls grün. Es verbleibt aus diesem Match kein freigegebenes rotes
Finding.
