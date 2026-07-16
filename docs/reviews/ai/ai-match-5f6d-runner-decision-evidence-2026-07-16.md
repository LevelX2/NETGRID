# Match 5F6D – Runner-Decision-Evidence (2026-07-16)

Status: vollständige Analyse, Umsetzung freigegeben

## Match und Datenbasis

- Match-ID: `match_5f6d027aecbe34e2`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: `hard`
- Seed: `match-mrnoenon-vadt11`
- Ergebnis: Corp gewinnt durch Agenda-Punkte
- Endstand: Corp 9, Runner 3
- End-StateVersion: 184
- StateHash: `fnv1a:f389b829`
- Abschluss: `2026-07-16T18:23:35.534Z`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Evidence: 185 Events, 185 State-Snapshots, 101 detaillierte AI-Traces

Die Coverage-Prüfung fand exakt 101 erwartete und 101 zugeordnete Decisions,
keine fehlenden, doppelten oder verwaisten Traces und keine Action-Type-
Abweichung. Alle ausgewählten Action-IDs waren Teil der damaligen
`LegalActions`. In den redigierten Traces fanden sich keine verbotenen
FullState-/Private-Payload-Felder, keine Fallbacks und keine Timeouts.

## Vollständige Decision-Coverage

Die folgenden Klassifikationen wurden einzeln aus LegalActions, PlayerView-
Kontext, Eventfolge, DecisionChain, Alternativen und unmittelbarer Folge
geprüft. `P` bedeutet plausibel oder erzwungen, `F` ein Finding und
`F-Folge` eine nachgelagerte Folge eines früheren Fehlers.

| Decisions | Status | Kurzbegründung |
| --- | --- | --- |
| D1–D12 | P | Starthand, frühe Zentralruns, Newsgroup-Aufbau und Finanzierung waren legal und nachvollziehbar. |
| D13–D17 | P | Frühe Facechecks gegen unbekannte ICE waren vertretbar; nach Reveal fehlte jeweils passende Coverage. |
| D18–D32 | P | HQ-Zugriffe, Trash-Ziele, Pile-Driver-Reaktion, R&D-Retest und Reserveaufbau waren produktiv. |
| D33–D57 | P | Weitere Zentralruns, Break-/Continue-Fenster, Olivia-Trash und Breaker-Suche waren lokal sinnvoll oder erzwungen. |
| D58 | F | Bid 5 verhindert den Tag, lässt aber nur 2 Credits für die bekannte Data Wall mit Kosten 3. |
| D59 | P | Hunter passieren ist erzwungen. |
| D60 | F-Folge | Jack out ist nach D58 lokal korrekt; die Ursache liegt im vorgelagerten Bid. |
| D61 | P | Newsgroup erzeugt den besseren Credit-Ertrag. |
| D62 | F | Basic Gain 1 verdrängt Newsgroup Gain 2 bei gleichem Klick und ohne Zusatzkosten. |
| D63–D71 | P | Reserveaufbau, Corporate-Retreat-Steal, Loony-Goon-Ausbau, HQ-Druck und Top-5-Event waren sinnvoll. |
| D72 | F | Erste Grip-Entnahme und Reststapel-Reihenfolge werden als uniforme Fünffachauswahl bewertet. |
| D73 | P | Zugende ist erzwungen. |
| D74–D75 | F | Zweimal verdrängt Basic Gain 1 die strikt bessere Newsgroup-Aktion. |
| D76–D82 | P | Remote-2-Trash und anschließender HQ-Druck waren produktiv. |
| D83–D84 | F | Erneut verdrängt Basic Gain 1 die strikt bessere Newsgroup-Aktion. |
| D85–D95 | P | Der R&D-Run ist produktiv; der nicht gewinnbare Trace wird korrekt mit 0 geboten, danach erfolgt Zugriff und Tag-Entfernung. |
| D96–D101 | P | Zwei Draws suchen die fehlende Code-Gate-Abdeckung; nach den Fehldraws besteht keine legale Contest-Linie mehr. |

Damit sind 101 von 101 Decisions klassifiziert. Die eindeutigen Fehler sind
sieben ursächliche Decisions in drei Fehlergruppen plus eine direkte
Folgeentscheidung.

## F1 – Trace-Bid verliert den bezahlbaren Restpfad

- Ziel: D58 / StateVersion 105
- Folge-Evidence: D60 / StateVersion 107
- Gewählt: `runner.resolve_choice` mit `bid_5`
- Bessere sichtbare Alternative: `bid_0`, Tag akzeptieren und mindestens die
  bekannte innere Data Wall weiterhin finanzieren.
- Sichtbarer Kontext: Runner 7 Credits, Trace-Stärke 5, Link 0; die bekannte
  restliche Data Wall benötigt 3 Credits.
- Consumer-Ursache: Die Bid-Effizienz bewertet das Trace-Ergebnis, aber nicht
  den verbleibenden Run-Pfad oder den Zugriffswert. Der RunnerRunPlan erkennt
  anschließend korrekt, dass die Route nach dem Bid nicht mehr erreichbar
  ist.
- Hint-Status: nicht relevant; Runtime-/Consumer-Fehler.
- Positive Gegenprobe: D87 / StateVersion 156 wählt bei Trace 6 und maximal 5
  Credits korrekt `bid_0`, setzt den Run fort, greift zu und entfernt danach
  den Tag.

## F2 – Credit-Aktionsdominanz wird nur für Basic Gain finanziert

- Ziele: D62 / v109, D74 / v135, D75 / v136, D83 / v151, D84 / v152
- Gewählt: `runner.gain_credit`
- Bessere sichtbare Alternative:
  `runner.activated_card_ability.runner_onr_v1_045_newsgroup-filter_1.runner_onr_v1_045_newsgroup-filter_1.activated.0`
- Consumer-Ursache: Der projizierte Nettoertrag der Newsgroup-Aktion ist
  korrekt, aber Finanzierungs- und Low-Credit-Komponenten werden nur für den
  Action-Type `gain_credit` erzeugt. Dadurch erhält die schwächere
  Basic-Aktion einen sachfremden Zusatzvorteil.
- Hint-Status: korrekt; Scoring-Consumer-Fehler.
- Grenze: Eine Ability mit gleichem oder geringerem Nettoertrag, Mehrkosten,
  Limits oder anderem Aktionsaufwand darf die Basic-Aktion nicht pauschal
  verdrängen.

## F3 – Top-5-Suche vermischt Grip-Auswahl und Reststapel

- Ziel: D72 / StateVersion 127
- Gewählt: zuerst `card_runner_onr_v1_011_cloak_2`, danach Cloak, Mouse,
  Fall Guy und Executive Wiretaps.
- Bessere sichtbare erste Entnahme:
  `card_runner_onr_v1_085_executive-wiretaps_1`.
- Sichtbarer Kontext: 3 Credits, 4/4 belegte MU, Cloak kostet 7 und benötigt
  1 MU; Executive Wiretaps kostet 2 und unterstützt den aktiven HQ-Druck.
- Consumer-Ursache: Alle fünf Optionen werden mit demselben Zielvertrag
  bewertet. Die erste Entnahme in den Grip und die Reihenfolge des
  verbliebenen Stapels erhalten weder getrennte Rollen noch aktualisierten
  Hand-, Duplikat-, MU- oder Plankontext.
- Hint-Status: Kartentext und strukturierte Semantik sind korrekt;
  Choice-Consumer-Fehler.
- Positive Gegenprobe: Bei freier MU, mindestens 7 Credits und einem Rig mit
  Bedarf an passender wiederkehrender Stealth-Finanzierung darf Cloak die
  richtige erste Entnahme sein.

## Kein zusätzliches Endgame-Finding

Ab D96 hatte der Runner 0 Credits, volle MU und keine Code-Gate-Abdeckung.
Die relevanten Breaker lagen nach zwei Draws weiterhin nicht im Grip. D98 und
D99 sind deshalb keine ignorierte Remote-Chance, sondern der terminale
Fallback nach zwei fehlgeschlagenen, fachlich vertretbaren Suchversuchen.
