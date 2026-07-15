# Match ECFE3CE: vollständiger Runner-KI-Decision-Audit 2026-07-15

## Ergebnis vorweg

`match_ecfe3ce373a56823` ist vollständig ausgewertet: 208 erwartete
Runner-Entscheidungsfenster stehen 208 eindeutigen AI-Traces gegenüber. Es
gibt keine fehlenden, doppelten oder einer falschen Seite zugeordneten Traces.

Die Runner-KI gewinnt das gespeicherte Spiel, der Sieg ist aber kein valider
Beleg für regelkonformes starkes Spiel. Nach einem erfolgreichen Fang-Trace
bleibt die 2-Credit-Run-Sperre aktiv. Die Engine unterdrückt danach normale
`start_run`-Aktionen, bietet aber weiterhin Run-Events und Bonus-Runs als
`LegalActions` an. Die KI nutzt diese angebotenen Aktionen in D115, D134,
D150, D175, D189 und D192. Der spielentscheidende zweite All-Nighter-Run auf
R&D und der Steal in D208 hängen von dieser illegalen Elternsequenz ab.

Daneben liegt ein echter Runner-Evaluationsfehler in D59 vor: Der bekannte
Remote-Pfad wird als erreichbar bewertet, obwohl der einzige Wall-Breaker
Dwarf seit D27 im Heap liegt. Der spätere Jack-out D63 ist deshalb korrekt;
der Fehler entsteht bereits beim Start des aussichtslosen Runs.

## Match- und Evidence-Anker

- Match: `match_ecfe3ce373a56823`
- Modus: `human_corp_vs_runner_ai`
- analysierte Seite: Runner-KI, Schwierigkeit Hard, detaillierter Trace
- erstellt: `2026-07-15T20:04:49.874Z`
- abgeschlossen: `2026-07-15T20:23:39.561Z`
- Seed: `match-mrmf80xw-1tjap2k`
- End-StateVersion: 350; MatchVersion: 351
- End-StateHash: `fnv1a:a838e794`
- Gewinner/Endgrund: Runner / `agenda_points`
- Umfang: 351 Events, 351 State-Snapshots, 208 AI-Decision-Traces
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Auswahl: neuestes abgeschlossenes Match nach `updated_at desc`
- Zugriff: ausschließlich read-only über Node 24 `node:sqlite`

Die 208 Trace-IDs sind lückenlos D1 bis D208. Alle 208 zugehörigen Events
tragen im verschachtelten PublicPayload `actor = runner`; umgekehrt besitzt
jedes Runner-Action-/Choice-Event genau einen dieser Traces.

## Decision-Denominator

| Action-Typ | Anzahl |
| --- | ---: |
| `continue_run` | 37 |
| `gain_credit` | 24 |
| `end_turn` | 23 |
| `activated_card_ability` | 20 |
| `play_event` | 17 |
| `draw_card` | 16 |
| `access_card` | 14 |
| `pump_breaker` | 14 |
| `break_subroutine` | 10 |
| `install_card` | 10 |
| `start_run` | 9 |
| `resolve_choice` | 8 |
| `steal_agenda` | 3 |
| `trash_accessed_card` | 2 |
| `jack_out` | 1 |

62 Decisions hatten genau eine LegalAction, 146 mehrere. 95 Decisions
enthielten ein Plan-Mapping. Die Arbitration endete 45-mal in
`plan_mapping_selected`, 20-mal in `semantic_choice_blocked`, 11-mal in
`semantic_choice_selected` und 132-mal ohne Plan-Arbitration. Bei 33 Decisions
wich die produktive Auswahl vom Raw-Score-Winner ab; jede dieser Abweichungen
wurde einzeln geprüft.

## Vollständige Decision-Coverage

Codes:

- `P`: lokal und kausal plausibel;
- `B1`: sauber klassifizierte, aber aus diesem Replay nicht freigabereife
  Facecheck-Risikobeobachtung;
- `F1`: bestätigter Runner-Evaluationsfehler;
- `F2`: bestätigte Engine-/LegalActions-Lücke am Elternfenster;
- `P/F2F`: lokal plausible Folgeentscheidung, deren Elternzustand wegen F2
  regelwidrig ist;
- `P/Hx`: plausible Auswahl mit dokumentierter Hint-/Consumer-Lücke.

Damit sind 148 Decisions uneingeschränkt plausibel, 52 lokal plausible
Folgeentscheidungen von F2, sieben Finding-Entscheidungen aus zwei
Fehlergruppen und eine nicht freigabereife Beobachtung klassifiziert.

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 P | D2 P | D3 P | D4 P | D5 P | D6 P | D7 P | D8 P |
| D9 P | D10 P | D11 P | D12 P | D13 P | D14 P | D15 P | D16 P |
| D17 P | D18 P | D19 P | D20 P | D21 P | D22 P | D23 P | D24 P |
| D25 P | D26 B1 | D27 P | D28 P | D29 P | D30 P | D31 P | D32 P |
| D33 P | D34 P | D35 P | D36 P | D37 P | D38 P | D39 P | D40 P |
| D41 P | D42 P | D43 P | D44 P | D45 P | D46 P | D47 P | D48 P |
| D49 P | D50 P | D51 P | D52 P | D53 P | D54 P | D55 P | D56 P |
| D57 P | D58 P | D59 F1 | D60 P | D61 P | D62 P | D63 P | D64 P |
| D65 P | D66 P | D67 P | D68 P | D69 P | D70 P | D71 P | D72 P |
| D73 P | D74 P | D75 P | D76 P | D77 P | D78 P | D79 P | D80 P |
| D81 P | D82 P | D83 P | D84 P | D85 P | D86 P | D87 P | D88 P |
| D89 P | D90 P | D91 P | D92 P | D93 P | D94 P | D95 P | D96 P |
| D97 P | D98 P | D99 P/H1 | D100 P | D101 P | D102 P | D103 P | D104 P |
| D105 P | D106 P | D107 P | D108 P | D109 P | D110 P | D111 P | D112 P |
| D113 P | D114 P | D115 F2 | D116 P/F2F | D117 P/F2F | D118 P/F2F | D119 P/F2F | D120 P/F2F |
| D121 P/F2F | D122 P/F2F | D123 P/F2F | D124 P/F2F | D125 P/F2F | D126 P/F2F | D127 P/F2F | D128 P/F2F |
| D129 P/F2F | D130 P/F2F | D131 P/F2F | D132 P | D133 P | D134 F2 | D135 P/F2F | D136 P/F2F |
| D137 P/F2F | D138 P/F2F | D139 P/F2F | D140 P/F2F | D141 P/F2F | D142 P/F2F | D143 P/F2F | D144 P/F2F |
| D145 P/F2F | D146 P/F2F | D147 P/F2F | D148 P/F2F | D149 P | D150 F2/H3 | D151 P/F2F | D152 P |
| D153 P | D154 P/H4 | D155 P | D156 P | D157 P | D158 P | D159 P | D160 P |
| D161 P | D162 P | D163 P | D164 P | D165 P | D166 P | D167 P | D168 P |
| D169 P | D170 P | D171 P | D172 P | D173 P | D174 P | D175 F2 | D176 P/F2F |
| D177 P/F2F | D178 P/F2F | D179 P | D180 P | D181 P | D182 P | D183 P | D184 P |
| D185 P | D186 P | D187 P | D188 P | D189 F2/H2 | D190 P/H5/F2F | D191 P/F2F | D192 F2 |
| D193 P/F2F | D194 P/F2F | D195 P/F2F | D196 P/F2F | D197 P/F2F | D198 P/F2F | D199 P/F2F | D200 P/F2F |
| D201 P/F2F | D202 P/F2F | D203 P/F2F | D204 P/F2F | D205 P/F2F | D206 P/F2F | D207 P/F2F | D208 P/F2F |

Die `P`-Entscheidungen sind nicht nur durch unauffällige Traces begründet:
Economy-Aktionen besitzen konkrete Funding-, Hand- oder Broker-Ziele;
Installationen schließen sichtbare Coverage-/MU-Lücken oder bereiten die
später verwendete R&D-Linie vor; Run-Kinder setzen legale Pump-/Break-/Access-
Sequenzen fort; Steals sind zwingend; End-turn kommt ausschließlich bei null
Klicks. Die fünf abweichenden Fälle H1 bis H5 sind unten bis zum Consumer
aufgeschlüsselt.

## Parent-Child- und Run-Sequenzen

| Eltern-Decision | Kinder | Ergebnis | Bewertung |
| --- | --- | --- | --- |
| D2 R&D | D3 | freier Access | plausibler Eröffnungsdruck |
| D4 Remote 1 | D5–D8 | Ball and Chain aufgedeckt, Rockerboy für 3 getrasht | guter früher Check-Run ohne Breaker; keine spätere ICE-Tax hinter Ball and Chain |
| D12 R&D | D13 | Data Wall aufgedeckt, Run endet | günstiger Informationsrun; Corp-Rez erzwungen, kein Programm exponiert |
| D26 R&D | D27 | unbekanntes D'Arc Knight rezzt, Dwarf wird getrasht, Run endet | B1: Ergebnis nicht rückwirkend als Wissen verwenden; fehlende sichtbare Risikokomponente für das einzige teure installierte Programm prüfen |
| D46 Remote 1 | D47–D51 | Rex-Trace mit Bid 3 verhindert, Data Wall 2.0 beendet Run | sinnvoller Check eines neu verstärkten Servers; zwei Rez-Kosten erzwungen, kein Programmverlust |
| D59 Remote 1 | D60–D63 | Rex-Trace verhindert, dann Jack-out vor bekannter Wall | F1 beginnt in D59; D60–D63 reagieren korrekt auf den tatsächlich unpassierbaren Restpfad |
| D67 Romp through HQ | D68–D69 | Shattered Remains kostenlos getrasht | plausibel; `-575` ist absolut negativ, aber besser als Decline `-1745` |
| D75 Remote 1 | D76–D88 | Rex gebrochen, Data Wall 2.0 gebrochen, Corporate Retreat gestohlen | vollständige, finanzierte Erfolgssequenz nach erneuter Dwarf-Installation |
| D98 Remote 1 | D99–D100 | unbekanntes Fang rezzt; Corp investiert 4 in Trace 8, Runner bietet korrekt 0 | guter Score-Threat-Facecheck; Break plus Restpfad war mit 7 nicht finanzierbar |
| D115 Custodial Position | D116–D131 | drei R&D-Accesses | Elternaktion F2-illegal unter aktiver Run-Sperre; Kinder lokal korrekt |
| D134 Inside Job | D135–D148 | Remote-Bypass, Main-Office Relocation gestohlen | Elternaktion F2-illegal; nach vorherigem Bezahlen der Sperre wäre dieselbe Linie grundsätzlich möglich |
| D150 Private LDL Access | D151 | HQ-Run wird korrekt in R&D-Access ersetzt | Elternaktion F2-illegal; H3 zeigt zusätzlich verlorene Action-Semantik |
| D175 Executive Wiretaps | D176–D178 | drei HQ-Accesses | Elternaktion F2-illegal; Kinder zwingend |
| D189 All-Nighter, erster Run | D190 | unbekanntes TKO 2.0 beendet den Run und kostet die nächste Aktion | Elternaktion F2-illegal; lokal ist Nichtbrechen korrekt, weil der bekannte Remote-Restpfad unbezahlbar und ein zweiter Run vorgesehen ist |
| D192 All-Nighter-Bonusrun | D193–D208 | R&D-Pfad gebrochen, zwei Accesses, Project Babylon gestohlen | Bonus-Run selbst F2-illegal; Kinder lokal sauber, Matchsieg kausal nicht regelkonform |

## Choice-, Access- und Discard-Fenster

- D1 behält eine Hand, die sofortigen Zentraldruck, Economy und späteres
  Coverage-Setup ermöglicht.
- D18 verwirft nach drei Jack-'n'-Joe-Nutzungen sechs Karten und behält zwei
  Dwarfs, Loony Goon, Broker und Temple Microcode Outlet. Angesichts der
  sichtbaren Data-Wall-Lücke ist das konsistent.
- D32 sucht Krash nach dem aufgedeckten AP-/Sentry-Problem.
- D48 und D61 bieten gegen Rex exakt 3 und verhindern den Trace ohne den
  teureren Break-Pfad. D100 bietet gegen sichtbare Trace-Stärke 8 bei nur
  7 Credits korrekt 0.
- D158 verwirft eine von zwei R&D-Interface-Kopien; D174 den zweiten Loony
  Goon bei bereits installiertem Loony. Beide Discards bewahren die
  produktivere Einzelkopie beziehungsweise neue Werkzeuge.
- D8 trasht Rockerboy bezahlbar; D69 trasht Shattered Remains kostenlos. Die
  gewählte Alternative ist jeweils auch im Access-Consumer besser als
  `decline_trash`.

## F1 – Vorab-Pfadprüfung erfindet fehlende Wall-Coverage

### Historischer Zustand

- D59 / StateVersion 113 / Turn 18 / letzter Klick
- Runner: 8 Credits; Rig enthält Krash und Loony Goon
- Dwarf liegt seit der D'Arc-Knight-Auflösung in D27 im Heap
- Remote 1 ist vollständig bekannt: außen Rex, danach Data Wall 2.0 und Ball
  and Chain; Root ist rezzed BBS Whispering Campaign
- Raw-Score-Winner: freier HQ-Run mit 1889
- gewählt: Remote-Run mit 763
- Arbitration: `semantic_choice_blocked`, ScoreGap 1126

Die Score-Komponente behauptet dennoch
`known_ice:3;can_reach_access:true;break_cost:4;credits_after:4`. Sie zählt den
Rex-Pfad, prüft aber die aktuelle Barrier-Coverage nicht zuverlässig. Nach dem
gewonnenen Rex-Trace revalidiert der RunnerRunPlan korrekt, dass Data Wall 2.0
ohne Dwarf nicht passierbar ist, und jackt in D63 aus.

### Bessere legale Folge

Der freie HQ-Run ist bereits historisch legal, raw besser und frei von
sichtbaren ICE-Risiken. Alternativ wäre Setup/Funding vertretbar; der bekannte
Remote-Run darf ohne Wall-Coverage nicht als erreichbarer Trash-Pfad den Plan
absolut binden.

### Generische Maßnahme nach Freigabe

- denselben aktuellen Rig-/Coverage-Vertrag in Vorab-RunTarget, Action-
  Projektion und RunnerRunPlan-Revalidation verwenden;
- sichtbare ICE-Reihenfolge, aktuell installierte Breaker, Break-Limits und
  Restkosten aus einer gemeinsamen Quote ableiten;
- historischer D59-Checkpoint muss den Remote-Run rot und HQ beziehungsweise
  eine positive Setup-Aktion als akzeptabel ausweisen;
- Gegenprobe: mit installiertem Dwarf bleibt derselbe Remote-Pfad erreichbar.

## F2 – Run-Sperre gilt nicht für alle Run-Quellen

Fang setzt nach D100 korrekt `runnerRunLockCreditCost = 2`. Von StateVersion
179 bis zum Spielende bleibt dieser Wert unverändert 2. Normale Basic-Runs
fehlen deshalb zu Recht. Trotzdem erscheinen folgende Run-Quellen als legal:

| Decision | StateVersion | Action | Credits/Klicks vor Action | StateHash |
| --- | ---: | --- | --- | --- |
| D115 | 210 | Custodial Position auf R&D | 10 / 1 | `fnv1a:3538e8d5` |
| D134 | 235 | Inside Job auf Remote 1 | 10 / 3 | `fnv1a:e499f5fd` |
| D150 | 251 | Private LDL Access auf HQ | 3 / 1 | `fnv1a:3ba71fdc` |
| D175 | 303 | Executive Wiretaps auf HQ | 12 / 4 | `fnv1a:8a0f01cc` |
| D189 | 328 | All-Nighter auf Remote 1 | 11 / 3 | `fnv1a:78b9718f` |
| D192 | 333 | All-Nighter-Bonus-Run auf R&D | 11 / 0 | `fnv1a:19341a5b` |

Die Regelautorität ist damit inkonsistent nach Action-Quelle. Der Basic-
`start_run`-Builder prüft beide Run-Lock-Zähler. Run-Events, restricted
run-only Actions und der Bonus-Run-Zweig teilen diesen Guard nicht. Die KI
verhält sich formal LegalActions-konform, aber die LegalActions sind fachlich
falsch. Das ist keine per Score lösbare KI-Schwäche.

### Bessere regelkonforme Folge

Bei ausreichenden Credits und mindestens einem Klick muss zuerst die bereits
angebotene Action `Run-Sperre für 2 Credits entfernen` gewählt werden. Danach
darf ein Run-Event nur mit verbleibendem Klick beziehungsweise ein legitimer
No-click-Bonus gestartet werden. Besonders D189 ändert sich materiell: Nach
dem Bezahlen bleiben nur 9 statt 11 Credits, während die damalige R&D-Quote
10 Credits verlangte. Der gespeicherte Siegespfad darf daher nicht als
strategischer Erfolgsbeleg verwendet werden.

### Generische Maßnahme nach Freigabe

- einen gemeinsamen Engine-Guard für jede Action und jeden Effekt, der einen
  Run startet, einführen;
- Basic-Run, Karten-`make_run`, restricted run-only Action und Bonus-Run damit
  im LegalAction-Builder filtern;
- `applyAction` beziehungsweise der `make_run`-Resolver validiert den Guard
  erneut, damit keine neue Action-Quelle die Sperre umgehen kann;
- Engine-Gegenproben für alle vier Quellen, einschließlich erlaubter Action
  direkt nach dem Bezahlen;
- AI-Checkpoint danach für die Freischaltentscheidung und sinnvolle
  Folgeaktion ausführen.

## B1 – Facecheck mit exponiertem teurem Programm

D26 startet bei 4 Credits einen R&D-Run. Sichtbar sind eine bekannte Data Wall
und ein neues unbekanntes äußeres ICE; der einzige installierte Dwarf kostet
6. Der Score berücksichtigt nur das bekannte ICE und keinen side-safen
Erwartungswert für Programmverlust. Das später aufgedeckte D'Arc Knight darf
nicht rückwirkend als damaliges Wissen benutzt werden, zeigt aber die reale
Folge: Dwarf wird getrasht.

Dieser Punkt ist aus dem Einzelspiel nicht als Fehler freigabereif. Ein
R&D-Check kann Information und Corp-Rez-Ausgabe wert sein. Für eine belastbare
Entscheidung fehlen paarige Kontrollen: gleiche Lage ohne installiertes
kritisches Programm, ohne Corp-Rezfähigkeit, mit akutem Payoff sowie mit
sicherer Zentralalternative. Die künftige Risikokurve sollte nicht pauschal
Facechecks verhindern, sondern den möglichen Verlust des einzigen teuren
Coverage-Programms gegen Informations- und Tempoertrag stellen.

## Hint- und Consumer-Audit

| Anker | Kartentext/Implementation | Hint/Compiler/Inspector | Projektion/Consumer/Arbitration | Status |
| --- | --- | --- | --- | --- |
| D4/D75 Ball and Chain | Tax gilt nur für spätere ICE-Encounters | `encounter_tax`, `runner_pay_or_end_run`, `run_lock` und Restpfadbedingungen stimmen | letzte Position wird nicht künstlich besteuert; bekannte Mehrfachpfade werden gequotet | korrekt und verwendet |
| D48/D61 Rex | Trace 3; bei Erfolg ETR plus 2-Credit-Run-Sperre, kein Tag | aktiver und kompilierter Hint modellieren Trace, conditional ETR und Run-Lock; der korrigierte Tag-Consumer verlangt echte `tag_source`-Semantik | exakte Bid-Choices funktionieren; F1 entsteht erst in der unabhängigen Coverage-Quote | korrekt nach FD7671-Remediation |
| D99 Fang | Trace 4; bei Erfolg ETR plus Run-Sperre, kein Tag | aktive Rollen enthalten fälschlich `tag`, RequiredMechanics fälschlich `add_tag`; kompilierte Effekte und Inspector leiten dagegen nur Trace/conditional ETR/Run-Lock ab | aktueller Tag-Ontology-Consumer ignoriert die falsche Legacy-Rolle; D100 bietet korrekt 0 | H1: Hintquelle falsch, produktiver Consumer derzeit geschützt |
| D150 Private LDL Access | HQ-Run; erfolgreicher HQ-Run ersetzt HQ-Access durch erfolgreichen R&D-Access | Access-Replacement ist im Hint/Compiler/Inspector vorhanden | konkrete Action bleibt `partial_projected`, Scope `basic_install`, Score nur 87; Plan blockiert Raw-Gain-Credit 2459 und rettet die fachlich wertvolle Action | H3: spezifische Semantik geht vor dem Action-Score verloren; zusätzlich F2-illegal |
| D154 Bodyweight Synthetic Blood | für 2 Credits fünf Karten ziehen | Compiler enthält `draw amount:5` | Action-Score nutzt nur generisches `runner_goal_fit_card_draw=900`; Plan rettet die starke Handauffüllung gegen Raw-Gain-Credit | H4: Mengeninformation erreicht den Score nicht sichtbar |
| D189 All-Nighter | zweiter Run unabhängig vom Erfolg des ersten | aktiver/kompilierter Hint verlangt fälschlich `successful_run` und setzt Follow-up-Timing auf `successful_run` | Engine und Multi-Run-Consumer wickeln den zweiten Run nach dem erfolglosen TKO-Run korrekt ab | H2: Hintvertrag falsch, Implementation/Consumer korrekt; Elternaktion F2-illegal |
| D190 TKO 2.0 | ETR plus Verlust der nächsten Aktion | aktiver Hint nennt `runner_action_loss`; Inspector leitet nur `corp_ice.end_run` ab | konkrete Continue-Action trägt beide Folgen im Action-ID-Vertrag; RunPlan spart korrekt Credits für den zweiten Run, Raw-Score bevorzugt Pump | H5: Inspector-/generische Consumer-Übergabe unvollständig, konkrete Sequenz trotzdem plausibel |
| Broker über das Spiel | pro Zug eine Action: 3 Credits laden oder alle nehmen | finite Economy-Pool und action economy korrekt kompiliert | Bank-Commitment, Cashout, TTL und Arbitration reagieren auf Funding und Reserve; keine leere Aktivierung | korrekt und verwendet |

### Fall Guy und Tags

Dieses Match enthält weder Fall Guy in irgendeinem Snapshot noch eine
Fall-Guy-Action. Runner-Tags bleiben in allen 351 Snapshots bei 0; es gibt
keine Tag- oder Tag-Prevention-Events. Die frühere Fall-Guy-Nichtnutzung kann
aus diesem Spiel daher weder bestätigt noch widerlegt werden. Die falsche
Fang-Tag-Rolle ist dennoch ein echter Hintfehler; der nach FD7671 korrigierte
Consumer verhindert, dass Trace allein als Tagquelle gilt.

## Facecheck-/Breaker-Vergleich

- D4 zeigt den erwünschten frühen Check vor Breaker-Installation: ein
  unbekanntes ICE, sichtbarer trashbarer Root, 5 Credits, kein exponiertes
  Programm. Ball and Chain ist an letzter Position harmlos; die KI greift zu
  und trasht Rockerboy.
- D12 ist ein weiterer günstiger Probe-Run: Data Wall beendet zwar den Run,
  aber die Corp bezahlt Rez und die Runner-KI gewinnt Coverage-Information.
- D20 installiert danach Dwarf nicht blind vor demselben unbekannten ICE,
  sondern als konkrete Antwort auf die bereits bekannte Data Wall.
- D26 belegt die Gegenseite: Nach einem später neu installierten unbekannten
  ICE ist das inzwischen installierte teure Programm exponiert. Diese Gefahr
  muss side-safe als Risikoband in die Sequenzbewertung eingehen, nicht als
  Kenntnis von D'Arc Knight.
- D98 facecheckt ein neu installiertes ICE vor akut advanced Remote. Der Run
  zwingt 5 Rez-Credits und 4 Trace-Credits, der Runner bietet bei unmöglichem
  Trace korrekt 0. Das ist trotz Fehlschlag plausibel.
- D189 passt lokal ebenfalls: unbekanntes TKO 2.0 auf dringendem Remote,
  All-Nighter hält einen zweiten Run offen, und die KI verschwendet keine
  Credits in einen weiterhin unbezahlbaren Restpfad. Wegen F2 ist die
  Elternaktion jedoch regelwidrig und kein valider Erfolgsbeleg.

## Plan-Lebenszyklus und Arbitration

Die meisten großen Raw-/Final-Differenzen sind fachlich erklärbar:

- D39 installiert Loony Goon trotz hohem Gain-Credit-Raw-Score, weil nach dem
  Dwarf-Verlust Sentry-/AP-Coverage akut ist.
- D66 installiert erneut Dwarf; erst dadurch wird D75–D88 zum bezahlbaren
  Agenda-Steal.
- D96/D97 sammelt vor dem Score-Threat-Run auf 7 Credits; negative absolute
  Gain-Scores sind hier Plan-Funding, nicht zielloses Klicken.
- D107 Cyfermaster und D185/D186 R&D Interface plus Worm werden später im
  finalen R&D-Pfad tatsächlich genutzt.
- D150 und D154 zeigen dagegen, dass ein richtiger Plan spezifische
  Kartensemantik nur zufällig retten kann. Der Raw-Score bleibt als Consumer-
  Warnsignal relevant.
- D59 ist der einzige belegte Planfehler vor F2: ein falscher Path-Quote-Input
  lässt `runner.contest_remote` den um 1126 besseren HQ-Raw-Winner absolut
  blockieren.

## Freigabeliste für ein Folgepaket

### Punkt 1: Sichtbare ICE-Pfadquote muss aktuelle Breaker-Coverage teilen

- Beschreibung Spielfehler: D59 startet ohne Wall-Breaker einen vollständig
  bekannten Remote-Pfad; die Vorabquote behauptet Erreichbarkeit, D63 muss
  später korrekt jacken. HQ ist legal und raw um 1126 besser.
- Dafür geplante Anpassungsmaßnahme: gemeinsame, aktuelle Coverage-/Restpfad-
  Quote für RunTarget, Action-Projektion und RunPlan; historischer Checkpoint
  plus Gegenprobe mit installiertem Dwarf.

### Punkt 2: Run-Sperren für jede Run-Quelle in Engine und applyAction

- Beschreibung Spielfehler: D115, D134, D150, D175, D189 und D192 starten
  trotz unverändertem `runnerRunLockCreditCost = 2` Run-Events oder Bonus-Runs.
  Der finale Sieg ist davon abhängig.
- Dafür geplante Anpassungsmaßnahme: gemeinsamer Engine-Guard für Basic-,
  Karten-, Restricted- und Bonus-Runs, erneute Validierung bei Ausführung,
  Engine-Regressionen und danach AI-Freischalt-/Folgeaktions-Checkpoint.

### Punkt 3: Falsche oder verlorene Kartenverträge bereinigen

- Beschreibung Spielfehler/Schwachpunkt: Fang behauptet Tag-Semantik;
  All-Nighter bindet den zweiten Run fälschlich an Erfolg; Private LDL,
  Bodyweight und TKO verlieren spezifische Access-, Mengen- oder Action-Loss-
  Semantik auf dem Weg zum produktiven Action-Score.
- Dafür geplante Anpassungsmaßnahme: Hintquellen korrigieren, generierte
  Verträge prüfen und gezielte Consumer-Tests bis Action-Projektion, Score und
  Arbitration ergänzen. Keine Karten-ID-Sondergewichte.

## Nicht freigabereif aus diesem Spiel

- B1/D26: Das mögliche Programmtrash-Risiko eines Facechecks ist sichtbar
  untermodelliert, aber die bessere Entscheidung ist ohne paarige side-safe
  Gegenproben nicht eindeutig. Dieser Punkt darf nicht als pauschale
  Breaker-vor-Run- oder Run-vor-Breaker-Regel umgesetzt werden.
- Fall Guy: keine Karte, kein Tag, kein Prevention-Fenster im Match.

## Abschlussgate

- Decision-Denominator: 208 erwartet = 208 klassifiziert.
- Parent-Child-Sequenzen: alle Run-, Choice-, Access-, Trash-, Steal-,
  Pump-/Break-, Trace- und Discard-Fenster geschlossen.
- Hint-Übergaben: relevante Karten bis Implementation, aktive/kompilierte
  Hints, Inspector, Action-Projektion, Consumer, Plan und Arbitration geprüft.
- Findings: bessere legale Alternative beziehungsweise bei F2 die korrekte
  Engine-Grenze und Folgeauswahl benannt.
- Neue Implementierung: bewusst nicht erfolgt; dafür ist nach Skill-Vertrag
  eine separate Nutzerfreigabe und rote aktuelle Reproduktion erforderlich.

