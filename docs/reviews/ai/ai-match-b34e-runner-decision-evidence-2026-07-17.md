# AI-Match-B34E – vollständige Runner-Decision-Evidence

Status: unveränderte historische Evidence vor produktiven Fixes

## Match und Datenabdeckung

- Match: `match_b34e724e4cfc0362`
- Modus: `human_corp_vs_runner_ai`, Runner-KI `hard`
- Zeitraum: 17. Juli 2026, 20:50:55 bis 21:18:29 Uhr MESZ
- Seed: `match-mrp5in6w-glpyvi`
- Endzustand: StateVersion `204`, StateHash `fnv1a:6cb9fb22`
- Ergebnis: Runner gewinnt mit 7 Agenda-Punkten durch `agenda_points`
- Quelle: `data/runtime/multiplayer/netgrid.sqlite`, read-only ausgewertet
- Umfang: 205 Events, 205 State-Snapshots, ein Game-State und 119 detaillierte
  AI-Decision-Traces
- Coverage: 119 erwartete Decisions, 119 Trace-Zeilen, 119 eindeutige
  Event-Verknüpfungen; keine fehlenden, verwaisten, doppelten oder
  Action-Type-inkonsistenten Traces

Die Rekonstruktion verwendete die jeweilige Runner-`PlayerView`, die dort
sichtbaren PublicEvents und die historischen LegalActions. Rohes
`game_state_json` und zukünftige Events wurden nicht als
Entscheidungsgrundlage verwendet.

## Vollständige Entscheidungsklassifikation

Als fachlich plausibel wurden die Decisions in folgenden lückenlosen
Bereichen klassifiziert:

`1–2, 4–13, 15–23, 25–33, 35–53, 57–58, 60–63, 66–67, 70–90, 93,
95–96, 98–99, 103, 107–119`

Die 22 auffälligen Decisions sind:

`3, 14, 24, 34, 54, 55, 56, 59, 64, 65, 68, 69, 91, 92, 94, 97,
100, 101, 102, 104, 105, 106`

Sie sind vollständig den drei nachfolgenden kausalen Fehlergruppen
zugeordnet. Einige ausgewählte Actions waren äußerlich noch plausibel,
enthielten aber einen falschen internen Grund und sind deshalb ebenfalls
aufgeführt.

## Befund 1 – Search-Consumer-Drift

### Betroffene Decisions

- `Tutor`: D3/S9, D14/S26, D24/S42, D34/S58, D59/S95 und D106/S188
- `Library Search`: D64/S105, D65/S106, D68/S114, D69/S115,
  D100/S175, D101/S176, D102/S177, D104/S184 und D105/S185

### Beobachtung

`runnerSourceCardAnswerRole` klassifiziert Quellkarten zunächst über
strukturierte Rollen und Mechaniken, fällt danach aber auf Tokens aus Titel,
Typ, Subtypen und Regeltext von Quellkarte und Definition zurück. Die Tokens
`search` und `tutor` reichen deshalb aus, um fremde Corp-ICE-Quellen namens
`Tutor` oder die Runner-Run-Event-Quelle `Library Search` als Suchwerkzeug zu
behandeln.

Diese Rolle wird in der semantischen Runtime auf `coverage_search` oder
`setup_card_search` projiziert. Das Ranking vergibt darauf bis zu `+1400`
Coverage-Search- beziehungsweise zusätzliche Setup-Boni. D69 wählte zwar
eine fachlich sinnvolle `Library Search`-Action, tat dies aber mit dem
falschen Suchgrund. Bei D106 trägt ein Corp-`Tutor` denselben falschen Grund.

### Erwarteter Vertrag

- Suchsemantik wird nur aus strukturierten, side-korrekten Runner-Effekten
  und passenden Action-Familien abgeleitet.
- Titel- oder Regeltexttokens einer Corp-Quelle dürfen keine Runner-
  Suchsemantik erzeugen.
- `Library Search` bleibt Run-Event/Multiaccess mit HQ-/R&D-Druck und wird
  nicht zu Kartensuche umgedeutet.
- Eine echte Runner-Suchkarte bleibt positiv als Suche klassifiziert; echte
  Draw-Semantik bleibt Draw.

## Befund 2 – Endgame-/Plan-Arbitration verdrängt Closeoutdruck

### Betroffene Decisions

- D91/S155: `draw_card` mit Raw-Score 78 und Display-Score 328 trotz
  `runner_expected_draw_overflow:-900`; ein HQ-Run lag raw bei 889.
- D92/S156: Installation von `Elena Laskova` raw 677/display 927 statt
  erreichbarem HQ-Run raw 889.
- D94/S163: Installation von `Little Black Box` raw -64/display 186 statt
  HQ-Run raw 889; der Run verlor durch Plan-Mismatch 753 Punkte.
- D97/S166: letzter Klick bei voller Hand; `draw_card` raw 78/display 328
  trotz Overflow. `Finders Keepers` lag raw bei 2077, wurde durch
  Plan-Mismatch um 1799 abgesenkt; HQ lag raw bei 889. Danach musste eine
  doppelte `Superglue` abgeworfen werden.
- D100/S175 und D105/S185: vorbereitende Folgeentscheidungen derselben
  Endgame-Fehlpriorität.
- D101/S176: `draw_card` raw 228/display 478 einschließlich
  `runner_basic_setup_over_ready_pressure:-900`; `Library Search` auf HQ lag
  raw bei 1897, direkter HQ-Run bei 1889, beide durch Planbindung auf 428.
- D102/S177: `Networking` raw 882/display 1132 statt unmittelbarem
  Library-/HQ-Druck raw ungefähr 1897/1889; die Vorbereitung verbrauchte zwei
  Klicks.

### Beobachtung

Der Runner hatte 5 Agenda-Punkte in einem 7-Punkte-Match, HQ war
ungeschützt und ein typisches 2-Punkte-Agenda-Access konnte das Match
beenden. Die bestehende Matchpoint-Run-Conversion greift nur bei
`pointsNeeded <= 1`. Gleichzeitig dürfen Plan-Mapping und Display-
Adjustments langsames Setup oder Overflow-Draw gegen erheblich bessere
unmittelbare Zentral-Actions durchsetzen.

### Erwarteter Vertrag

- Bei zwei oder weniger fehlenden Agenda-Punkten ist erreichbarer HQ-/R&D-
  oder Multiaccess-Druck eine Closeout-Option.
- Overflow-Draw und marginales Setup müssen dieser Option weichen, wenn sie
  keine höherwertige unmittelbare Gefahr beantworten.
- Ein Plan muss bei einem sehr großen Raw-Score-Abstand yielden; die
  Display-Planbindung darf das produktive Ranking nicht umkehren.
- D104/S184 bleibt eine positive Gegenprobe: Vor einer dringenden Remote-
  Contest-Revalidation darf Draw sinnvoll sein, wenn die sichtbare
  Runner-Sicht nach fehlender Coverage sucht und genug Klicks zum Contest
  verbleiben. Die spätere Gewinninformation ist dafür irrelevant.

## Befund 3 – Viral-15-Encounter bezahlt unnötige Sequenzkosten

### Betroffene Decisions

- D54/S90: `Rent-I-Con` wird für einen Credit gepumpt.
- D55/S91: Subroutine 1, eine Jack-out-Tax, wird für einen Credit gebrochen.
- D56/S92: Subroutine 2, ein Pass-Program-Trash, wird für einen Credit
  gebrochen.
- D59/S95: ein späteres `Tutor`-Encounter wird ohne Break passiert; diese
  Entscheidung ist als Kontrast äußerlich plausibel, enthält aber zusätzlich
  die Search-Consumer-Drift aus Befund 1.

### Beobachtung

Der R&D-Run begann bei D53/S89 mit vier Credits. Pump und zwei Breaks senkten
die Credits von vier auf eins. Der Runplan selbst wies eine bekannte Sequenz
von zwei Credits aus: einmal Pump und nur die zweite Subroutine als
`required_subroutine_indexes:1`.

Die erste Subroutine war ohne geplanten Jack-out wirkungslos. Die zweite
hätte `Rent-I-Con` getroffen; der Breaker zerstört sich am Ende des Runs
ohnehin selbst und wurde auf dem verbleibenden Pfad nicht mehr benötigt. Die
produktive Alternative `continue_run` lag bei beiden Break-Entscheidungen
über den ausgewählten Encounter-Actions, wurde jedoch durch den
Encounter-Override verdrängt.

### Erwarteter Vertrag

- Das Encounter-Ranking verwendet den minimal notwendigen Break-Satz und
  rechnet bereits bezahlte Pump-/Break-Kosten in ein gemeinsames Restbudget
  ein.
- Eine Jack-out-Tax wird nur bezahlt, wenn ein Jack-out-Pfad tatsächlich
  gebraucht wird.
- Ein am Runende selbstzerstörender Breaker darf als entbehrlich gelten,
  sofern weder späteres ICE noch ein anderer sichtbarer Runpayoff ihn
  benötigt.
- Positive Gegenproben erhalten Breaks, wenn ein anderes wertvolles Programm
  bedroht ist, späteres ICE den Breaker benötigt oder eine echte
  Jack-out-Kontingenz besteht.

## Deck- und Hint-Consumer-Audit

Historischer Runner-Deck-Snapshot: `Classic Runner - Prep Economy Pressure`,
20 eindeutige Karten und 45 Karten insgesamt.

Der side-sichere Audit gegen aktive, kompilierte und Inspector-Artefakte war
`ok`: null blockierende Befunde, eine nicht blockierende Taxonomie-Warnung
für `MS-todon` (`noisy`, `remove_or_deprecate`). Es gab keine `searchTools`
und keine bekannten `remoteContestTools`; genau das bestätigt, dass die im
Match erzeugte Suchrolle keine Deckfähigkeit war.

Primäre Strategiefits:

- `runner.hq_pressure`: 100
- `runner.interface_closeout`: 100
- `runner.run_event_tempo`: 100

Sekundäre Strategiefits:

- `runner.rnd_pressure`: 98
- `runner.remote_contest`: 88
- `runner.survival_defense`: 80
- `runner.rig_first`: 60

Der aktive und kompilierte Hint für `Library Search` ist bereits konsistent:
Event/Multiaccess/Run-Event, HQ-/R&D-Druck, `future_run_effect` und
Multiaccess 2 für HQ/R&D. Daher ist keine Hint- oder Deckdatenänderung
vorgesehen; der Defekt liegt im Runtime-Consumer.

## Abgeleitete Remediation-Pakete

1. Historische Checkpoints und enge Gegenproben auf unverändertem Code.
2. Generische Search-Consumer-Präzisierung ohne Kartennamen-Ausnahmen.
3. Zwei-Punkte-Closeout und Plan-Yield gegen Overflow/Setup.
4. Sequenzbewusste Encounter-Kosten mit notwendigen Break-Gegenproben.
5. Unveränderte Erwartungen, breite KI-Gates, Final Review und Wissenslog.
