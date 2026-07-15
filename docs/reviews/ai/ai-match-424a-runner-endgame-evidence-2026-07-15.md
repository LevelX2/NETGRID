# Match 424A: Runner-Endgame-Evidence (2026-07-15)

## Ergebnis der read-only Analyse

Das neueste abgeschlossene lokale Spiel ist
`match_424abdd1c7ac054d`. Die Hard-Runner-KI verliert mit
`Inside Forgery Loop` gegen `Cheap Bag of Tricks` mit 0:8. Der frühe und
mittlere Spielabschnitt enthält mehrere gute Run-, Tag-, Damage- und
Suchentscheidungen. Die Niederlage entsteht vor allem aus drei später
zusammenwirkenden Fehlerfamilien:

1. starres Plan-Mapping erzwingt negative oder redundante Entwicklung;
2. strukturierte Karten- und Zielsemantik erreicht einzelne Consumer nicht;
3. ein blockierter Matchpoint-Remote erzeugt keine kurze Pfadöffnungs- und
   Fundingsequenz.

Die Analyse ist ausschließlich aus Runner-seitigen AI-Traces, damaligen
LegalActions, side-sicheren PlayerViews, öffentlichen Events und daraus
abgeleiteten sichtbaren Fakten erstellt. Es werden keine Rohkopien von
`game_state_json` oder `trace_json` versioniert und keine spätere Hidden-Info
als damaliger Entscheidungsgrund verwendet.

## Match-Metadaten

| Feld | Wert |
| --- | --- |
| Match | `match_424abdd1c7ac054d` |
| SQLite | `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` |
| Modus | `human_corp_vs_runner_ai` |
| Runner | Hard-AI, `Inside Forgery Loop` |
| Korp | Mensch, `Cheap Bag of Tricks` |
| Seed | `match-mrkixbgq-j4so7f` |
| Abschluss | 2026-07-15T06:00:53.824Z |
| Sieger / Grund | Korp / `agenda_points` |
| Endstand | Runner 0, Korp 8 |
| End-StateVersion / Hash | 293 / `fnv1a:d3b38999` |
| Events / Snapshots | 294 / 294 |
| AI-Traces | 155, Modus `detailed` |

## Vollständige Runner-Entscheidungstimeline

Die 155 Einzelentscheidungen sind nach Runner-Zügen zusammengefasst. Run-,
Access-, Trace-, Damage-, Break- und Choice-Entscheidungen bleiben in ihrer
historischen Reihenfolge enthalten.

| Runner-Zug | Decisions | Historische Folge und Bewertung |
| --- | --- | --- |
| Setup | D1 | Starthand mit Cyfermaster, Force Shield, Core Command, Score! und Nasuko Cycle behalten; vertretbar. |
| 1 | D2–D9 | R&D-Run, zwei Zugriffe, Rio City Grid nicht trashen, Cyfermaster installieren, Credit, Force Shield installieren, Ende. Run und Cyfermaster sind gut; D8 erzwingt Force Shield mit Score −236 gegen Credit mit 1614 und leert die Kasse. |
| 2 | D10–D17 | Erneuter R&D-Run mit zwei Zugriffen, danach drei Credits und Ende; kohärent. |
| 3 | D18–D31 | Credit, HQ-Run, Chicago Branch trashen, R&D-Run, Trace-/Breaker-Folge, danach Core Command und gerezztes ICE trashen; stärkste taktische Sequenz des Spiels. |
| 4 | D32–D36 | Zwei Draws, zwei Credits, Ende; richtige Erholung bei leerer Kasse. |
| 5 | D37–D41 | Tag entfernen, drei Credits, Ende; korrekt. |
| 6 | D42–D46 | Zwei Credits, Score!, erstes Militech MRAM Chip, Ende; erstes Handgrößen-Setup ist noch plausibel. |
| 7 | D47–D55 | Credit, Remote-2-Run, Vacant Soulkiller mit Damage Prevention trashen, zwei Draws; guter Contest. |
| 8 | D56–D60 | Draw, Broker, Draw, Fall Guy, Ende; Broker ist sinnvoll, Fall Guy wird als schwacher Handkarten-Override gewählt. |
| 9 | D61–D76 | Draw, Jack 'n' Joe, Inside Job auf R&D und vollständige Run-/Trace-/Access-Folge, Draw, Ende; legal, aber nur schwach zielbewertet. |
| 10 | D77–D82 | Draw, Tag entfernen, Credit, Bodyweight, Ende und Discard; solide Stabilisierung. |
| 11 | D83–D87 | Zweimal Livewire's Contacts, Jack 'n' Joe, SeeYa, Ende; gutes Economy- und Informationssetup. |
| 12 | D88–D93 | Bodyweight, drei Credits, Ende und Discard; unauffällig. |
| 13 | D94–D98 | Credit, Score!, Remote-1-Run, TKO 2.0 beendet den Run, Ende; nachvollziehbarer Contest und öffentliche Pfadinformation. |
| 14 | D99–D103 | Draw, Junkyard BBS, Draw, WuTech Mem Chip, Ende; Setup ohne unmittelbare Konvertierung. |
| 15 | D104–D109 | Draw, Broker, Draw, Mantis, Stack-Suche nach Krash, Ende; Such- und Coverage-Mechanismen arbeiten korrekt. |
| 16 | D110–D114 | Credit, zweites Force Shield, Credit, Krash, Ende; D111 erzwingt Score −372 gegen den als benötigte Coverage bewerteten Krash mit 2314. |
| 17 | D115–D124 | Credit, HQ-Probe mit Schaden und Run-Ende, Credit, Broker laden, Ende; schwach, aber als Informationsprobe nicht eindeutig falsch. |
| Korp-Fenster | D125 | Link-Bid 0 gegen Trace 5; der resultierende Tag wird im nächsten Zug entfernt. |
| 18 | D126–D130 | Tag entfernen, Broker auszahlen, zwei Credits, Ende; gute Banknutzung. |
| 19 | D131–D135 | Broker laden, zwei Draws, Inside Job auf Archives, Ende; D134 gibt Aktion und Credits für einen bekannt unproduktiven Zugriff aus. |
| 20 | D136–D140 | Gegen einen Remote mit einem Advancement werden zwei Credits, Draw und Score! gewählt. Der Contest-Plan besitzt keinen Pfadöffnungs-Fallback; die Korp erzielt danach drei Punkte. |
| 21 | D141–D145 | Bei Korp 6: Draw, Jack 'n' Joe, zweites MRAM, Fall Guy, Ende. D143 bewertet MRAM fälschlich als MU-Support. |
| 22 | D146–D150 | Bei Korp 6 und unbekanntem neuen Remote: Broker laden, zwei Credits, Draw, Ende. SeeYa und Forged Activation Orders sind legal, erhalten aber nur 27 und 202 Punkte. |
| 23 | D151–D155 | Bei Korp 6 und zwei sichtbaren Advancements: Draw, zweites WuTech, Livewire, Draw, Ende. Der direkte Remote-Run ist korrekt als schädlich und unbezahlbar ausgeschlossen; es fehlt die vorbereitende Pfadöffnungs-/Fundingsequenz. Die Korp gewinnt anschließend. |

## Freigegebene Findings und Reproduktionsziele

### 424A-F01 – Negative Force-Shield-Entwicklung verdrängt Coverage

- Historische Evidence: D111 / StateVersion 202, Runner 2 Credits und 3 Klicks.
  Ein Force Shield ist bereits installiert. Das zweite Force Shield hat Score
  −372, wird aber durch `runner.develop_hand_card` gewählt. Krash hat Score
  2314 und die Komponenten `runner_install_breaker` sowie
  `runner_install_required_coverage_answer`.
- Ursachehypothese: falsche Hint-Planrolle `recover_economy` plus zu permissive
  Plan-Arbitration für redundante negative Installationen.
- Roter Vertrag: Krash installieren ist akzeptabel; das zweite Force Shield
  ist verboten.
- Gegenprobe: Ein erstes Force Shield unter sichtbarer Net-/Core-Damage-Gefahr
  bleibt installierbar.

### 424A-F02 – Inside Job umgeht die Zielserver-Ausschlusslogik

- Historische Evidence: D134 / StateVersion 245, letzter Klick und 6 Credits.
  Draw hat Score 898. Der normale bekannte Archives-Payoff ist unproduktiv,
  dennoch wird Inside Job auf Archives mit Score 133 durch
  `runner.play_best_hand_card` gewählt.
- Ursachehypothese: Run-Event-Projektion kennt den Server, aber Ausschluss und
  Plan-Mapping verwenden die konkrete RunTargetEvaluation nicht vollständig.
- Roter Vertrag: Draw ist akzeptabel; Inside Job auf Archives ist verboten.
- Gegenprobe: Der bereits versionierte Inside-Job-R&D-Checkpoint bleibt mit
  einem wertvollen Bypasspfad erreichbar und attraktiv.

### 424A-F03 – MRAM wird über den Kartennamen als MU-Support erkannt

- Historische Evidence: D143 / StateVersion 265, 10 Credits und 2 Klicks. Ein
  MRAM ist bereits installiert. Das zweite erhält trotz korrektem
  `hand_size_modifier` die Komponente `runner_mu_pressure_memory_support` und
  wird mit Score 1211 gewählt.
- Ursachehypothese: der Fallback auf die Titelphrase `mem chip` überstimmt
  strukturierte Rollen, `memoryLimitBonus` und Hint-Effekte.
- Roter Vertrag: Das zweite MRAM ist verboten und die ausgewählte Aktion darf
  keinen MRAM-basierten MU-Support voraussetzen.
- Gegenprobe: WuTech oder ein anderer echter Memory-Limit-Chip bleibt unter
  realem MU-Druck priorisierbar.

### 424A-F04 – Remote-Informationswerkzeuge erhalten keinen Matchpoint-Kontext

- Historische Evidence: D146 / StateVersion 273, Korp 6, Runner 8 Credits und
  4 Klicks, ein unbekannter Root in einem dreifach geschützten Remote. Broker
  wird mit Score 782 geladen; SeeYa erhält 27 und Forged Activation Orders
  202. Der Bankplan mappt außerdem mehrere unspezifische aktivierte
  Kartenfähigkeiten.
- Ursachehypothese: `expose_info`, `ice_trash`, Zielkontext und Banksemantik
  werden nicht bis zur konkreten Remote-Gefahr zusammengeführt.
- Roter Vertrag: SeeYa ist als frühe Informationsaktion akzeptabel; ein
  generischer Bankplan darf keine fremden aktivierten Fähigkeiten als
  Bankaufbau behandeln.
- Gegenprobe: Ohne Matchpoint- oder Remote-Gefahr bleibt normaler Broker-Aufbau
  eine zulässige Hintergrundaktion.

### 424A-F05 – Blockierter Matchpoint-Remote erzeugt keine kurze Sequenz

- Historische Evidence: D151 / StateVersion 283, Korp 6, zwei sichtbare
  Advancements im Remote, Runner 10 Credits und 4 Klicks. Draw gewinnt mit 898.
  Broker hält sichtbar 6 Credits; Livewire's Contacts, Forged Activation
  Orders und SeeYa sind legal. Der direkte Remote-Pfad kostet sichtbar etwa
  20 Credits und enthält TKO 2.0, daher ist der direkte Run korrekt
  ausgeschlossen.
- Ursachehypothese: `runnerOpponentMatchpointContestSemanticChoice` akzeptiert
  nur bereits erreichbare Remotes; PlanPortfolio und Bankgates erzeugen keinen
  Vorbereitungsplan aus Pfadöffnung, Cashout, Burst-Economy und Run.
- Roter Vertrag: Der erste Schritt muss die konkrete Schlusssequenz verbessern;
  akzeptabel sind Forged Activation Orders oder Broker-Cashout, Draw und
  redundantes Setup sind verboten.
- Gegenprobe: Ohne öffentliche Matchpoint-Gefahr oder ohne realistisch
  verbesserbaren Pfad greift kein pauschaler Endgame-Override.

### 424A-F06 – Krash-Pfad wird als fehlende Coverage statt unbezahlbar erklärt

- Historische Evidence: D154 / StateVersion 286, Krash ist installiert und der
  Runner besitzt 12 Credits. Gegen HQ werden zunächst 10 Credits für Neural
  Blade berücksichtigt; für Data Wall 2.0 fehlen weitere 4. Der Trace meldet
  dennoch `missing:wall`, `blocked_missing_coverage` und aktiviert erneut die
  Fähigkeit `breaker_wall`.
- Ursachehypothese: die Mehr-ICE-Quote verliert zwischen bezahltem und später
  unbezahlbarem ICE die vorhandene strukturierte Coverage.
- Roter Vertrag: HQ bleibt nicht erreichbar, wird aber als
  `blocked_unpayable` mit vollständiger Pfadkosteninformation klassifiziert;
  kein neuer Wall-Breaker wird als Lösung verlangt.
- Gegenprobe: Ein wirklich fehlender Wall-Breaker bleibt
  `blocked_missing_coverage`; mit mindestens 14 Credits wird der Krash-Pfad
  erreichbar.

### 424A-F07 – Plan-Arbitration akzeptiert negative redundante Ziele

- Historische Evidence: D8, D59, D111, D134 und D144 zeigen wiederholt, dass
  ein `develop_hand_card`- oder `play_best_hand_card`-Plan stark unterlegene
  beziehungsweise negative Aktionen erzwingen kann.
- Reproduktionsanker: D111 und D134.
- Roter Vertrag: Ein Plan darf vom Rohscore abweichen, aber keine negative
  redundante Installation oder unproduktive Eventvariante ohne akuten
  passenden Bedarf erzwingen.
- Gegenprobe: konkrete Coverage-, Survival- und profitable Run-Event-Pläne
  dürfen weiterhin begründet über dem Rohscore liegen.

### 424A-F08 – Falsche oder veraltete Hint-Semantik

- Force Shield: `recover_economy` ist sachlich falsch.
- Core Command: die Condition muss einen erfolgreichen HQ-Run ausdrücken.
- Broker: `public_trash_to_hand` und Card-Flow-Werte beschreiben nicht die
  implementierte Hosted-Credit-Bank.
- Inside Job: Serverziel und First-ICE-Bypass müssen für Consumer eindeutig
  projizierbar bleiben.
- Militech MRAM, SeeYa und Forged Activation Orders dienen als bereits
  korrekte Kontrollen ihrer strukturierten Effekte.

### 424A-F09 – Bankaktionen werden zu breit an Ability-Typen gebunden

- Historische Evidence: D146 mappt der Schritt `build_bank_counter` SeeYa,
  Broker und Junkyard BBS, obwohl nur Broker sichtbare Hosted Credits aufbaut.
- Ursachehypothese: ein Action-Type-Fallback für
  `activated_card_ability`/`trigger_ability` greift, wenn die konkrete
  Semantik nicht eng genug gebunden ist.
- Roter Vertrag: Nur eine Action mit belegtem Bank-/Counter-Effekt erfüllt den
  Bankaufbauschritt.
- Gegenprobe: unterschiedliche echte Bankkarten dürfen weiterhin generisch
  über ihre Effekte erkannt werden.

## Nicht als Produktionsfix verfolgt

- D6 Cyfermaster statt sofortigem Score! bleibt fachlich vertretbar und wird
  später erfolgreich genutzt.
- D29 Core Command ist trotz niedrigerem Rohscore eine gute taktische
  Konvertierung nach erfolgreichem HQ-Run.
- D116 HQ-Probe bei zwei Credits ist schwach, aber als Informationsprobe nicht
  eindeutig falsch.
- Der direkte Remote-Run bei D151 bis D154 bleibt zu Recht ausgeschlossen.
- Kein Checkpoint behauptet, dass die verbesserte Schlusssequenz den Sieg
  garantiert; sie muss lediglich die beste sichtbare Contest-Chance verfolgen.

## Red-/Green-Vertrag

Vor Produktionsänderungen werden alle Zielzustände mit
`warmup-policy=strict` capturiert. Nur `behavior_regression` bestätigt ein
historisches Verhaltensfinding. Bereits grüne Ziele werden als Nicht-Fix
dokumentiert. Nach dem Red-Commit bleiben Fixtures und Erwartungen
unverändert; ausschließlich generische Hints, Consumer, Planer oder
RunTarget-Auswertung dürfen sie grün machen.
