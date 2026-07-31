# A36A Postfix Selfplay – vollständige Spiel- und Decision-Analyse

Stand: 2026-07-31
Git: `bba28dff5f109a77b6db2a9c7d2d588dc1c698f4`
Seed der vollständigen Partie: `a36a-postfix-selfplay-20260731-002`

## Gesamturteil

Die Corp-KI spielt diese Partie deutlich besser als in den zuvor
beanstandeten Spielen. Sie schützt im ersten Zug R&D und HQ, baut anschließend
ein geschütztes Scoring-Remote und führt drei zusammenhängende Agenda-Linien
ohne Passivität zu Ende. Sie gewinnt nach 85 Decisions und 12 beendeten
Halbzügen mit 7:0 Agenda-Punkten. Das Replay ist deterministisch und
fehlerfrei.

Die Runner-KI spielt bis zum vierten Runner-Zug überwiegend sinnvoll, bringt
Rent-I-Con ins Spiel, erzwingt drei ICE-Rezzes, contestet die erste Remote-
Agenda und trasht Vapor Ops aus HQ. Danach erzeugt sie ihre Niederlage jedoch
weitgehend selbst:

1. Bei 3 Credits und einer legal installierbaren Rent-I-Con spielt sie mit
   dem letzten Click Bodyweight™ Synthetic Blood.
2. Sie zieht damit fünf Karten, erzeugt drei sichere Discards und wirft im
   folgenden Pflichtfenster ausgerechnet Rent-I-Con als einzigen unmittelbar
   relevanten Universal-Breaker ab.
3. Die folgenden Züge bauen zwar wieder Wirtschaft und Suchzugriff auf, aber
   der Runner erreicht die geschützten Agenda-Linien nicht mehr rechtzeitig.

Das Problem liegt nicht in fehlenden Karten-Hints. Die vollständigen
Hint-/Consumer-Audits beider Decks bestehen ohne Blocking Finding oder
Warnung. Die nachgewiesenen Schwächen liegen in der planübergreifenden
Endzustandsbewertung, in der Behandlung von Draw-Overflow und in einer
strategisch zu mächtigen generischen Discard-Choice-Auflösung.

Zusätzlich brach ein erster Seed nach 107 erfolgreichen Decisions mit einem
klassifizierten `step_target_mismatch` im Shell-Traders-Plan ab. Dieser
separate harte Fehler wird ebenfalls unten ausgewertet.

## Laufkonfiguration und Integrität

- Runner: `Rent-I-Con: Das Shellspiel`
  (`standard_runner_rent_i_con_shellspiel_2026_07_17`,
  `fnv1a:518ccd75`)
- Corp: `Universal Fast Advance`
  (`standard_corp_universal_fast_advance`,
  `fnv1a:94aba061`)
- Controller: `current_candidate` gegen `current_candidate`
- Schwierigkeit: `hard` gegen `hard`
- Agenda-Ziel: 7
- maximales Sicherheitslimit: 600 Aktionen
- tatsächliches Ende: `game_result`, Corp durch `agenda_points`
- tatsächliche Decisions: 85
- Replay: erfolgreich
- Runtime-/Engine-Fehler in der vollständigen Partie: 0
- LegalAction-Rejections: 0
- automatische Suspicious-Findings: 0

Die automatische Auffälligkeitserkennung ist in dieser Partie damit zu
schwach: Sie erkennt weder die Bodyweight-Überlaufsequenz noch den
Breaker-Discard. Für die fachliche Freigabe bleibt das vollständige
Decision-Audit maßgeblich.

## Geschlossener Decision-Nenner

| Klassifikation | Anzahl |
|---|---:|
| korrekt strategisch oder taktisch | 50 |
| korrektes Pflicht-, Reaktions- oder Abschlussfenster | 24 |
| vertretbare kontextabhängige Abwägung | 8 |
| fragwürdiger Sequenzverlust | 1 |
| klarer Planungsfehler | 1 |
| klarer Discard-Fehler | 1 |
| **Gesamt** | **85** |

`erwartete Decision-Versuche = angewandte Decision-Traces = Ledger-Zeilen =
85`; es gibt keine verworfene oder unklassifizierte Decision.

Legende:

- **Gut**: fachlich richtige Auswahl unter den sichtbaren Möglichkeiten.
- **Pflicht**: Engine-/Folgefenster oder sinnvoller Zugabschluss ohne echte
  strategische Konkurrenz.
- **Vertretbar**: nicht eindeutig optimal, aber mit belastbarer Linie.
- **Fragwürdig**: vermeidbarer Tempoverlust, aber kein allein
  spielentscheidender Fehler.
- **Fehler**: klar schlechter als eine gleichzeitig legale und planlogisch
  erforderliche Alternative.

## Vollständiges Protokoll: jede einzelne KI-Decision

### Zug 1 – Setup und erster Corp-Zug

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 0 | Runner | Starthand mulligan | Gut | Tycho Mem Chip, Swiss Bank Account, Disgruntled ICE Technician, Score! und R&D Interface enthalten keinen unmittelbaren Breaker; der Mulligan bringt Rent-I-Con und sofortige Entwicklung. |
| 1 | Corp | Starthand behalten | Gut | Misleading Access Menus, Data Wall, Corporate Downsizing, Annual Reviews und Vapor Ops bilden zentrale Defense, Agenda und Entwicklung ab. |
| 2 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 3 | Corp | Data Wall vor R&D installieren | Gut | R&D wird im ersten Zug geschützt; gleichzeitig wird der HQ-Überlauf produktiv reduziert. |
| 4 | Corp | Efficiency Experts spielen | Gut | +3 Credits finanzieren die zweite zentrale Defense und spätere Rez-/Score-Linie. |
| 5 | Corp | Misleading Access Menus vor HQ installieren | Gut | Nach R&D wird auch HQ im selben Zug geschützt; genau die zuvor vermisste kohärente Eröffnungsdefense. |
| 6 | Corp | Zug beenden | Pflicht | Alle drei Clicks sind produktiv verbraucht. |

### Zug 2 – erster Runner-Zug

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 7 | Runner | Run auf R&D vor Installation von Rent-I-Con | Fragwürdig | Der Probe-Run erzwingt zwar das Rezzen, verliert aber einen Click. Rent-I-Con war legal und bezahlbar; die Linie Installieren → finanzieren → Run hätte denselben Zugang mit weniger Leerlauf ermöglicht. Kein generelles Verbot von Probe-Runs, aber hier war die konkrete Breaker-Linie bereits sichtbar. |
| 8 | Corp | Data Wall rezzen | Gut | Für 1 Credit beendet das ICE den unvorbereiteten Run und schützt R&D. |
| 9 | Runner | Subroutinen auslösen; Run endet | Pflicht | Kein legaler Break. |
| 10 | Runner | Rent-I-Con installieren | Gut | Reagiert korrekt auf die nun bekannte Wall-Barriere. |
| 11 | Runner | Livewire’s Contacts spielen | Gut | Stellt die Mittel für den sofortigen zweiten R&D-Versuch bereit. |
| 12 | Runner | Run auf R&D | Gut | Bekannter, nun passierbarer Pfad und noch ein Click verfügbar. |
| 13 | Runner | Data-Wall-Subroutine mit Rent-I-Con brechen | Gut | Direkte, günstige Konvertierung der vorbereiteten Linie. |
| 14 | Runner | ICE passieren | Pflicht | Engine-Folgefenster nach dem Break. |
| 15 | Runner | Run fortsetzen statt Jack-out | Gut | Der Zugang ist erreichbar und bezahlt. |
| 16 | Runner | R&D-Karte accessen | Pflicht | Einzige Auflösung des erfolgreichen Runs. |
| 17 | Runner | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 3 – erstes Scoring-Remote

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 18 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 19 | Corp | Wall of Static vor neuem Remote installieren | Gut | Erst Schutz, dann Agenda; die Reihenfolge hält die Score-Linie konsistent. |
| 20 | Corp | Corporate Downsizing in Remote 1 installieren | Gut | Agenda wird ausschließlich in das soeben geschützte Remote gelegt. |
| 21 | Corp | Corporate Downsizing einmal advancen | Gut | Verwendet den letzten Click für konkreten Score-Fortschritt. |
| 22 | Corp | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 4 – Runner contestet das Remote

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 23 | Runner | 1 Credit nehmen | Gut | Exakte Finanzierung des gebundenen Remote-Contest-Plans. |
| 24 | Runner | Gideon’s Pawnshop spielen | Vertretbar | Holt die nach dem ersten Run getrashte Rent-I-Con zurück. Eine sofortige Installation plus bezahlter Break war in diesem Zug noch nicht möglich, aber die Karte wird für die nächste Linie wieder verfügbar. |
| 25 | Runner | Rent-I-Con aus dem Heap wählen | Gut | Die Choice folgt exakt der sichtbaren Wall-Coverage-Lücke. |
| 26 | Runner | Run auf Remote 1 | Gut | Die Agenda ist sichtbar entwickelt und würde im nächsten Corp-Zug scorebar; ein Contest ist zwingend sinnvoll, auch wenn zunächst nur das ICE getestet wird. |
| 27 | Corp | Wall of Static rezzen | Gut | Stoppt den einzigen akuten Agenda-Contest. |
| 28 | Runner | Subroutinen auslösen; Run endet | Pflicht | Rent-I-Con ist nur auf der Hand und die bekannte Wall nicht passierbar. |
| 29 | Runner | Run auf HQ | Gut | Mit dem letzten Click wird der andere erreichbare Wertpfad genutzt. |
| 30 | Corp | Misleading Access Menus rezzen | Gut | Der Runner kann zahlen, wird aber besteuert; Nicht-Rezzen hätte kostenlosen HQ-Zugang erlaubt. |
| 31 | Runner | 1 Credit zahlen und weiterlaufen | Gut | Zugang bleibt erreichbar und die Alternative würde den Run beenden. |
| 32 | Runner | Run fortsetzen | Gut | Jack-out hätte den bereits bezahlten Zugang verschenkt. |
| 33 | Runner | HQ-Karte accessen | Pflicht | Engine-Zugangsfenster. |
| 34 | Runner | Vapor Ops für 1 Credit trashen | Gut | Entfernt das zentrale Advancement-Bank-Werkzeug des Corp-Decks günstig. |
| 35 | Runner | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 5 – Corporate Downsizing wird gescort

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 36 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 37 | Corp | Corporate Downsizing zum zweiten Mal advancen | Gut | Remote ist rezzed geschützt und der Runner hat keine aktuelle Wall-Coverage. |
| 38 | Corp | Corporate Downsizing zum dritten Mal advancen | Gut | Vollendet die vorbereitete Score-Linie. |
| 39 | Corp | Corporate Downsizing scoren | Gut | Unmittelbare Konvertierung statt unnötiger Nebenaktion. |
| 40 | Corp | Annual Reviews spielen | Gut | Der durch das Scoren verfügbare Rest-Click wird in drei neue Karten umgesetzt. |
| 41 | Corp | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 6 – Runner erzeugt und verwirft seine Coverage

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 42 | Runner | 1 Credit nehmen | Gut | Beginnt die Finanzierung der bekannten Rent-I-Con auf der Hand. |
| 43 | Runner | eine Karte ziehen | Vertretbar | Eine begrenzte Informationsaktion bei noch drei verbleibenden Clicks; sie zieht Vewy Vewy Quiet. |
| 44 | Runner | 1 Credit nehmen | Gut | Erreicht 3 Credits und damit die tatsächlichen Installationskosten von Rent-I-Con. |
| 45 | Runner | Bodyweight™ Synthetic Blood statt Rent-I-Con spielen | **Fehler** | Rent-I-Con ist gleichzeitig legal und mit 3 Credits exakt bezahlbar. Bodyweight kostet 2, zieht fünf Karten auf eine nahezu volle Hand und erzwingt drei Discards. Der Plan blockiert den Breaker wegen eines 3-Credit-Reservebodens (`target_credits:6`), erlaubt aber Bodyweight, das denselben Boden auf 1 Credit unterschreitet. |
| 46 | Runner | Zug beenden | Pflicht | Keine Clicks mehr; der vorangehende Kartenplan hat keine Konvertierung mehr vorgesehen. |
| 47 | Runner | Invisibility, R&D Interface und Rent-I-Con discarden | **Fehler** | Rent-I-Con ist die einzige unmittelbar verfügbare Universal-Coverage gegen die bekannten rezzed Walls. Gleichzeitig meldet die Run-Bewertung fortlaufend `find_breaker_first`. Die generische Discard-Bewertung schützt diesen planakuten Einzelbestand nicht zuverlässig. |

### Zug 7 – Superserum-Linie beginnt

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 48 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 49 | Corp | Superserum in Remote 1 installieren | Gut | Das bestehende, rezzed geschützte Scoring-Remote wird wiederverwendet. |
| 50 | Corp | Superserum einmal advancen | Gut | Direkter Fortschritt auf der neuen Agenda. |
| 51 | Corp | 1 Credit nehmen | Gut | Sichert die Finanzierung der zwei ausstehenden Advances im Folgezug. |
| 52 | Corp | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 8 – Runner baut nur Support, nicht Coverage

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 53 | Runner | 1 Credit nehmen | Gut | Ermöglicht die konkrete Bank-/Recurring-Credit-Linie. |
| 54 | Runner | Swiss Bank Account verdeckt installieren | Gut | Kostenlose Bankinstallation mit sofort nutzbarer Support-Fähigkeit. |
| 55 | Runner | Installation von Vewy Vewy Quiet beginnen | Vertretbar | Recurring Breaker Credits sind deckstrategisch sinnvoll; ohne installierten Breaker ist die Linie aber nur Vorbereitung und darf nicht mit echter Coverage verwechselt werden. |
| 56 | Runner | Swiss Bank Account trashen und 2 Credits nehmen | Gut | Exakt gebundene Fortsetzung des bereits gewählten Installations-Kostenfensters. |
| 57 | Runner | Vewy Vewy Quiet für 4 Credits fertig installieren | Gut | Schließt dieselbe Action ab und erzeugt zwei wiederkehrende Breaker-Credits. |
| 58 | Runner | mit letztem Click Karte ziehen | Gut | Nach dem Breaker-Discard ist gezielte Suche nach neuer Coverage richtig; gezogen wird The Shell Traders. |
| 59 | Runner | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 9 – Superserum wird gescort

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 60 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 61 | Corp | Superserum zum zweiten Mal advancen | Gut | Geschützter und vom Runner aktuell nicht erreichbarer Score-Pfad. |
| 62 | Corp | 1 Credit nehmen | Vertretbar | Die Agenda bleibt im selben Zug scorebar; die Reihenfolge verbessert lediglich die Liquidität vor dem letzten Advance. |
| 63 | Corp | Superserum zum dritten Mal advancen | Gut | Vollendet die Agenda ohne die Score-Linie zu unterbrechen. |
| 64 | Corp | Superserum scoren | Gut | Unmittelbare Konvertierung auf 4 Agenda-Punkte. |
| 65 | Corp | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 10 – Runner sucht erneut nach Coverage

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 66 | Runner | The Shell Traders installieren | Gut | Kostenlose, deckprägende Entwicklungsressource bei 0 Credits. |
| 67 | Runner | Karte ziehen | Gut | Die Coverage-Pläne melden weiterhin einen fehlenden Breaker; gezogen wird ein zweiter Shell Traders. |
| 68 | Runner | erneut Karte ziehen | Vertretbar | Eine zweite kostenlose Shell-Traders-Installation wäre langfristig stark; der Draw findet jedoch Temple Microcode Outlet und schafft dadurch eine konkrete Breaker-Suche für den Folgezug. |
| 69 | Runner | 1 Credit nehmen | Gut | Finanziert exakt Temple Microcode Outlet im Folgezug. |
| 70 | Runner | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 11 – terminale Corporate-War-Linie

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 71 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 72 | Corp | Corporate War in Remote 1 installieren | Gut | Bei 4 Corp-Punkten ist die 3-Punkte-Agenda terminal; das bekannte Wall of Static schützt weiterhin den Pfad. |
| 73 | Corp | Corporate War einmal advancen | Gut | Beginnt die über zwei Corp-Züge gebundene terminale Linie. |
| 74 | Corp | Corporate War zum zweiten Mal advancen | Gut | Verwendet den letzten Click für den zweiten Counter; eine dritte Advancement-Action war ohne Burst nicht möglich. |
| 75 | Corp | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 12 – Runner kann den bereits verlorenen Wettlauf nicht mehr drehen

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 76 | Runner | Temple Microcode Outlet spielen | Gut | Exakte Search-Action für die bekannte Wall-Coverage-Lücke. |
| 77 | Runner | Rent-I-Con aus dem Stack wählen | Gut | Die Choice folgt dem gebundenen Coverage-Plan und wählt den universellen Breaker. |
| 78 | Runner | 1 Credit nehmen | Vertretbar | Mit 0 Credits und drei Clicks ist Rent-I-Con in diesem Zug nicht mehr installierbar und anschließend für einen Run finanzierbar. |
| 79 | Runner | 1 Credit nehmen | Vertretbar | Teil derselben Finanzierung; Shell-Vorbereitung könnte die Agenda vor dem nächsten Corp-Zug ebenfalls nicht mehr erreichbar machen. |
| 80 | Runner | 1 Credit nehmen | Vertretbar | Erreicht die Installationskosten erst mit dem letzten Click; die Partie wurde durch die früheren Entscheidungen 45 und 47 verloren, nicht durch diese zwangsläufig zu späte Finanzierung. |
| 81 | Runner | Zug beenden | Pflicht | Keine Clicks mehr. |

### Zug 13 – Corp schließt ab

| D | Seite | Aktion | Urteil | Begründung |
|---:|:---:|---|---|---|
| 82 | Corp | Pflichtkarte ziehen | Pflicht | Engine-Pflichtfenster. |
| 83 | Corp | Corporate War zum dritten Mal advancen | Gut | P1-Terminalplan, geschütztes Remote und unmittelbare Scorebarkeit. |
| 84 | Corp | Corporate War scoren | Gut | Erzielt 7 Punkte und beendet das Spiel; der negative Credit-Effekt unter 12 Credits ist wegen des sofortigen Sieges irrelevant. |

## Was nachweisbar besser funktioniert

### Corp-Defense und Scoring

- R&D und HQ erhalten beide im ersten Corp-Zug ICE.
- Das Scoring-Remote wird vor der ersten Agenda aufgebaut.
- Der Score-Plan bleibt über mehrere Corp-Züge auf derselben
  Agenda-/Remote-Instanz gebunden.
- Die Corp rezzed das jeweils relevante ICE genau im Angriffsfenster.
- Sie baut nicht unnötig weitere zentrale ICE-Schichten, während ein
  geschützter Score-Pfad offen ist.
- Corporate Downsizing, Superserum und Corporate War werden jeweils
  vollständig bis zum Score verfolgt.
- Corporate War wird trotz seines negativen Credit-Ergebnisses korrekt als
  terminale 3-Punkte-Agenda gescort.

Damit greifen die wesentlichen vorherigen Korrekturen an Defense-Portfolio,
Remote-Score-Plan und terminaler Priorisierung in dieser Partie.

### Runner-Reaktionsfenster

- Rent-I-Con wird nach dem ersten Probe-Run korrekt installiert und
  anschließend korrekt zum Break verwendet.
- Der Runner contestet die erste entwickelte Remote-Agenda rechtzeitig.
- Er bezahlt Misleading Access Menus nur dann, wenn dadurch echter HQ-Zugang
  entsteht.
- Er trasht Vapor Ops korrekt.
- Die Search-Choices von Gideon’s Pawnshop und Temple Microcode Outlet wählen
  jeweils Rent-I-Con.
- Swiss Bank Account wird nur als exakte Fortsetzung des bereits gewählten
  Vewy-Vewy-Quiet-Kostenfensters verwendet.

## Klare Fehlerursachen und vorgeschlagene Maßnahmen

### F1 – Bodyweight-Plan bewertet nicht den tatsächlichen Zugendzustand

**Evidence:** D45, Zustand 45.

Rent-I-Con ist legal und kostet exakt die vorhandenen 3 Credits. Ihr
Kartenplan wird dennoch als nicht ausführbar behandelt, weil
`runner.develop_board_and_hand` zusätzlich einen Creditboden von 3 erhalten
will und deshalb `development_funding_target_credits:6` fordert. Im selben
Entscheidungsfenster darf der Bodyweight-Plan 2 Credits ausgeben, auf 1 Credit
fallen und fünf Karten in eine fast volle Hand ziehen.

Die beiden Pläne bewerten also nicht denselben projizierten Endzustand:

- Breaker-Installation: zu streng durch Reserveboden blockiert;
- Draw-Event: tatsächliche Kosten, fünf gezogene Karten und Pflicht-Discards
  nicht gleichwertig gegen denselben Reserve- und Endzustandsmaßstab geprüft.

**Maßnahme:**

1. Die tatsächliche Handänderung jedes konkreten Draw-Events in die
   planinterne Projektion aufnehmen.
2. Für Bodyweight bei vier Handkarten und letztem Click drei garantierte
   Discards projizieren.
3. Installierbare akute Einzel-Coverage und deren Endzustand gegen den
   Draw-Endzustand vergleichen.
4. Den Creditboden planklassenübergreifend konsistent anwenden; ein anderer
   Kartenplan darf ihn nicht stillschweigend unterschreiten.
5. Ownership bleibt in `runner.develop_board_and_hand` beziehungsweise
   `runner.rig_and_coverage`; keine Sonderregel im Choice-Resolver.

### F2 – Discard-Choice entscheidet strategisch außerhalb des Plans

**Evidence:** D47, Zustand 47.

Das Pflichtfenster hat nur eine `resolve_choice`-LegalAction, aber die
Payload-Auswahl ist strategisch. Der aktuelle Resolver sortiert die
Handkarten iterativ mit einem globalen `discardKeepScore`. Er erhält keine
exakte, residente Retain-Bindung des Coverage-Plans. Dadurch können globale
Economy-Werte die einzige akut benötigte Breaker-Instanz verdrängen, obwohl
die Run-Pläne gleichzeitig `find_breaker_first` melden.

**Maßnahme:**

1. Vor dem Discard muss der zuständige Plan Retain-Anforderungen für
   einzigartige, aktuell benötigte Coverage veröffentlichen.
2. Das Pflichtfenster bindet diese Anforderungen an die konkrete
   `resolve_choice`-Action und die konkreten Karteninstanzen.
3. Der Resolver vervollständigt dann nur noch die Payload innerhalb dieser
   Bindung.
4. Regression-Checkpoint aus Zustand 47:
   Rent-I-Con muss erhalten bleiben; Action-ID, Executor und Choice-Origin
   dürfen sich nicht ändern.

### F3 – Probe-Run wird nicht gegen die vollständige Alternativsequenz geprüft

**Evidence:** D7.

`runner.pressure_central` gewinnt vor der bereits legalen akuten
Rent-I-Con-Entwicklung. Nach dem erwartbaren Rez endet der Run, anschließend
installiert die KI den Breaker ohnehin und läuft noch einmal.

**Maßnahme:**

Der Zugplaner soll in solchen Situationen mindestens zwei Endzustände
vergleichen:

- Probe → mögliche Information → Neuplanung;
- Breaker installieren → finanzieren → Run.

Das ist ausdrücklich kein apodiktisches Verbot von Probe-Runs. Der Probe-Run
bleibt sinnvoll, wenn der Breaker nicht bezahlbar ist, die ICE-Information
einen echten Wert hat oder die vorbereitete Linie andere wichtige Actions
verdrängen würde.

### F4 – Shell-Traders-Plan kann einen falschen Zielkandidaten materialisieren

**Evidence:** Seed `a36a-postfix-selfplay-20260731-001`, Zustand 107.

Der erste Lauf erreichte 107 korrekte Actions, Runner 5 : Corp 3, und brach
dann mit folgendem klassifizierten Fehler ab:

`step_target_mismatch`, Owner `plan_module`,
Plan `runner.shell_traders_pipeline`, Zielinstanz R&D Interface,
aktuelle LegalAction-Typen nur `trigger_ability`.

Die Signalerzeugung bindet Source und Ziel. Die spätere
`shellTradersPipelineCandidates`-Filterung prüft jedoch nur:

- Action-ID im Signal,
- `trigger_ability`,
- Shell-Traders-Source.

Sie prüft das aktuelle Ziel der Candidate-Action nicht erneut. Wenn
Action-ID/Source technisch übereinstimmen, aber die aktuelle Payload eine
andere Zielkarte bindet, hält das Modul die Route zunächst für vorhanden.
Erst der allgemeine Plan-Step-Matcher verwirft sie wegen des Zielkonflikts
und löst den harten Sicherheitsfehler aus.

**Maßnahme:**

1. Shell-Traders-Candidates bereits im Modul gegen
   `signal.targetCardInstanceId` prüfen.
2. Target-spezifische Action-IDs oder eine gleichwertig exakte
   Payload-/Target-Bindung sicherstellen.
3. Wenn kein exakter Candidate mehr existiert, Plan blockieren oder nach
   Informationsgrenze neu planen; niemals einen anderen Target-Trigger als
   Ersatzkopf anbieten.
4. Den harten Sicherheitsmechanismus beibehalten.

### F5 – Why-not-Abdeckung ist noch nicht vollständig

In der vollständigen Partie:

- 54 von 85 Decisions ohne Top-Level-`whyNot`;
- 16 nicht gewählte Action-Alternativen ohne `whyNot`;
- alle 84 ausgewiesenen gewählten Alternativen besitzen ein `whyChosen`;
- Redaction-Gate bestanden.

Die Lücken betreffen unter anderem alternative Shell-Traders- und
Installationsaktionen. Das verursacht nicht unmittelbar das 7:0, erschwert
aber die Kontrolle, warum ein starker Spezialplan nicht gewählt wurde.

**Maßnahme:**

Plan-owned Ausschlussgründe für jede nicht gewählte, fachlich echte
Alternative ausgeben. Keine neue Entscheidungsautorität in der
Observability-Schicht aufbauen.

## Vollständiger Deck-Hint-/Consumer-Audit

| Deck | eindeutige Karten | Karten gesamt | Blocking | Warnungen | Checkpoint-Verhalten |
|---|---:|---:|---:|---:|---|
| Rent-I-Con: Das Shellspiel | 26 | 45 | 0 | 0 | bestanden |
| Universal Fast Advance | 16 | 45 | 0 | 0 | bestanden |

Für alle Karten sind aktive Hints, Definitionen, Implementierungen,
Feld-Consumer-Verträge und Deckstrategie-Ableitungen vorhanden. Besonders
relevant:

- Rent-I-Con ist als `icebreaker`, `universal_breaker` und
  `breaker.emergency_coverage` beschrieben.
- The Shell Traders besitzt einen eigenen Plan-Owner.
- Bodyweight ist als Draw-/Search-Engine bekannt.
- Corporate War trägt Threshold-Risiko und terminalen Score-Wert.
- Vapor Ops projiziert Economy- und Advancement-Funktionen.

Damit sind die klaren Fehler nicht durch fehlende Card-Hints zu erklären.
Sie entstehen dort, wo mehrere korrekte Einzelsignale zu einem Zug- oder
Choice-Endzustand zusammengesetzt werden.

## Freigabe-Gate

Diese Analyse nimmt bewusst keine Änderung am KI-Verhalten, an Hints,
Consumern oder Planmodulen vor. Vor einer Umsetzung sollten mindestens
folgende Maßnahmen einzeln freigegeben werden:

1. Bodyweight-/Draw-Overflow-Endzustandsprojektion und konsistenter
   Creditboden;
2. plan-gebundene Retain-Anforderungen für Discard-Choices;
3. Sequenzvergleich Probe-Run gegen Breaker-vor-Run;
4. exakte Shell-Traders-Target-Bindung;
5. vollständige plan-owned Why-not-Ausgabe.

## Umsetzungsstatus 2026-07-31

Die führenden Fehler D45, D47 und Zustand 107 wurden im Paketprozess
umgesetzt und sind durch spielgleiche Checkpoints sowie Gegenproben
abgesichert. Das identische Abschluss-Selfplay umfasst 109 replay-saubere
Decisions ohne illegale Action, Fallback, Timeout, Runtime- oder
Plan-Safety-Fehler.

Die vollständige Nachanalyse ersetzt dieses Dokument nicht als
Ausgangsevidence, sondern schließt den Vorher-/Nachher-Vergleich:
`docs/reviews/ai/a36a-postfix-selfplay-final-audit-2026-07-31.md`.

Die Why-not-Abdeckung blieb entsprechend dem Umsetzungsvertrag außerhalb
dieses Slices, sofern kein bereits vorhandener plan-owned Blockergrund ohne
neue Entscheidungslogik übernommen werden konnte.
