# Evidence der letzten zwei Corp-KI-Spiele vom 17.07.2026

## Ergebnis vor Umsetzung

Beide Spiele sind vollständig aus der lokalen SQLite-Runtime rekonstruiert.
Die Rules Engine bot alle in den Findings genannten Alternativen legal an;
die Fehler liegen damit in produktiver KI-Arbitration beziehungsweise in den
gesondert ausgewiesenen Rez- und Hint-Verträgen.

| Match | Ende | Ergebnis | Events / Snapshots | AI-Traces | Coverage |
| --- | --- | --- | ---: | ---: | ---: |
| `match_a7593a9bf8632052` | 17.07.2026, 22:59 CEST | Runner 7:0, Agenda-Punkte | 192 / 192 | 79 | 79/79 |
| `match_8107a9dffe8cd234` | 17.07.2026, 22:38 CEST | Runner 7:5, Agenda-Punkte | 280 / 280 | 113 | 113/113 |

Quelle ist
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`; die Datei
wurde ausschließlich read-only geöffnet. Für jede Entscheidung wurden
LegalActions, Actor-PlayerView, PublicEvent-Präfix, Runtime-Plan,
Komponentenwerte und tatsächlich gewählte Aktion gemeinsam geprüft.

## Match A – `match_a7593a9bf8632052`

### Klassifikation

- 58 plausible Entscheidungen:
  D1–3, D5–6, D8–13, D17–18, D22, D24–25, D28, D30, D34, D36–37,
  D40–44, D47–54 und D56–79.
- 16 Entscheidungen mit demselben Verhaltensfinding:
  D14–16, D19–21, D26–27, D31–33, D38–39 und D45–46.
- eine weitere Fehlentscheidung: D55.
- fünf wegen verdeckter Auswahl nicht belastbar bewertbare Entscheidungen:
  D4, D7, D23, D29 und D35.

### A1 – Scoreline-Paralyse durch spekulativen Punish-Plan

Zwischen D14 und D46 wählte die Corp in 15 Entscheidungen den
Basiscredit. Gleichzeitig lagen zeitweise bis zu fünf Agenden im HQ und eine
geschützte Remote war legal für weitere Entwicklung verfügbar.

D31 ist ein früher klarer Anker: Corp 15 Credits und 3 Klicks, Runner 16
Credits, Remote 1 mit `Fetch 4.0.1`; `Data Raven` durfte legal auf Remote 1
installiert werden. Die KI nahm dennoch drei Basiscredits. D45 ist der
stärkere Abschlussanker: Nach der Finanzierung hatte der Runner nur noch 3
Credits, die Scoreline blieb legal, die Corp nahm erneut Credits.

Der produktive Trace erklärt die systematische Unterdrückung:

- `corp_punish_primary_speculative_scoreline_dampen = -5600`;
- `corp_unsafe_delayed_scoreline_exposure = -4200`;
- aktiver Damage-/Tag-Plan, obwohl der Runner während des gesamten Spiels
  keinen Tag besaß.

Die bessere Linie ist keine automatische Agenda-Installation bei jedem
Fenster. Sie ist die Konversion einer bereits finanzierten und hinreichend
geschützten Scoreline, sobald der spekulative Punish-Plan selbst keinen
unmittelbaren Ertrag besitzt. D45 wird deshalb historischer Checkpoint;
ungeschützte, nicht finanzierbare oder tatsächlich unmittelbar produktive
Punish-Linien bilden Gegenproben.

### A2 – Paris City Grid blockiert die einzige Score-Remote

In D55, StateVersion 124, installierte die Corp `Paris City Grid` in Remote 1.
Die Remote enthielt bereits `Fetch 4.0.1` und `Data Raven`; der einzige Root-
Slot wurde dadurch belegt. Der Trace erkannte das Risiko mit
`corp_non_agenda_root_blocks_score_remote = -1800`.

Die unübersteuerte Einzelwertung bevorzugte Paris auf HQ oder R&D mit
`rawScore = -1661` gegenüber Remote 1 mit `rawScore = -3211`. Der
`corp_scoreline_support_plan_controller` setzte trotzdem Remote 1 mit einem
angezeigten Endwert von `-2961` durch. Anschließend musste die Corp Remote 2
neu aufbauen.

Der historische Checkpoint verbietet ausschließlich die wertmindernde
Root-Belegung der einzigen geschützten Score-Remote. Zentrale Installation
und Remotes ohne konkreten Scoreline-Verdrängungsschaden bleiben
Gegenproben.

## Match B – `match_8107a9dffe8cd234`

### Klassifikation

- 102 plausible Entscheidungen:
  D1–7, D9–12, D14–26, D28–63, D65–97, D101–103, D107–109 und
  D111–113.
- acht Verhaltensfindings: D27, D98–100, D104–106 und D110.
- zwei technische Trace-/Event-Abweichungen: D8 und D64.
- eine wegen geheimer Zahlenwahl nicht belastbar bewertbare Entscheidung:
  D13.

### B1 – Agenda-Zielrisiko unterscheidet Punktwert nicht

D27, StateVersion 46, installierte `Corporate Retreat` mit 3 Agenda-Punkten
in die bereits umkämpfte Remote 1. `Project Babylon` mit 1 Punkt und
`Security Purge` mit 2 Punkten waren ebenfalls legal. Alle drei Optionen
erhielten exakt `-3097`, obwohl der Trace `agenda_points_at_risk` kannte. Der
Runner stahl `Corporate Retreat` im unmittelbar folgenden Zug.

Der historische Checkpoint verlangt keine pauschale Auswahl der kleinsten
Agenda. Er verlangt, dass die Zielrisiko-Komponente bei sonst gleicher
Situation den tatsächlich gefährdeten Punktwert unterscheidet. Agenden mit
gleichem Punktwert oder anderweitig deutlich verschiedenen unmittelbaren
Scoring-Chancen bilden die Gegenprobe.

### B2 – Matchpoint-Paralyse trotz stark geschützter Remote

Beim Stand 5:5 nahm die Corp in D98–100 dreimal Credits. In D104–106 folgten
Credit, ein fünftes ICE für die Remote und wieder Credit; D110 war erneut ein
Basiscredit. In D110 besaß Remote 1 fünf ICE:

- `Razor Wire` gerezzt;
- `Filter` gerezzt;
- `Keeper` gerezzt;
- `Data Wall 2.0` ungerezzzt;
- `Quandary` ungerezzzt.

Die Corp hatte 6 Credits und 2 Klicks, der Runner 18 Credits. Im HQ lagen
`Security Purge` und `Project Zurich`, jeweils 2 Agenda-Punkte. Beide durften
legal in Remote 1 installiert werden. Trotzdem lag die Agenda-Option bei etwa
`-15841`, unter anderem durch:

- `corp_game_ending_scoreline_exposure_penalty = -4600`;
- `corp_unsafe_delayed_scoreline_exposure = -4200`;
- Scoreline-Triage `-3200`;
- Contestable-Remote-Penalty `-3000`.

Nach D109 `Efficiency Experts` bestand eine konkrete Zwei-Klick-Linie:
D110 Agenda in Remote 1, D111 Advance und damit Matchpoint-Drohung im
nächsten Corp-Zug. Stattdessen folgte D111 `Fire Wall` auf R&D; der Runner
gewann durch den sofortigen R&D-Run.

D110 wird historischer Checkpoint. Gegenproben sind eine schwach geschützte
Remote, fehlende Credits/Klicks und eine Agenda, deren Punktwert den Sieg
nicht ermöglicht.

### B3 – Nicht-ICE-Rez besitzt zwei Aktionstypen

D8 (`BBS Whispering Campaign`) und D64 (`Lesley Major`) stimmen fachlich mit
den gewählten Rezzes überein. Der AI-Trace referenziert jedoch die
LegalAction als `rez_ice`, während das PublicEvent `rez_card` meldet. Das ist
kein belegter Auswahlfehler, sondern ein Observability- und Vertragsschaden:
Nicht-ICE-Karten dürfen nicht als ICE-Aktion typisiert werden.

Der rote Vertrag wird in der Engine-/Replay-Schicht verankert und mit einem
regulären ICE-Rez gegengeprüft.

## Verpflichtende Deck-Hint-/Consumer-Audits

Beide Corp-Decks besitzen einen `deckSnapshot`; daher wurde der feste
`scripts/audit-ai-deck-hint-consumers.ts`-Pfad gegen temporäre,
matchgebundene Snapshot-Hüllen ausgeführt. Die Hüllen wurden anschließend
gelöscht und nicht versioniert.

### Match A

- 26 eindeutige Karten, 45 Karten insgesamt;
- Primärstrategien: `damage_kill`, `remote_scoring`,
  `tag_trace_punish`;
- `status = failed`, neun blockierende
  `compiled_effect_overlap`-Befunde;
- betroffene Karten: `Corporate Coup`, `Hostile Takeover`,
  `Accounts Receivable`, `Closed Accounts`, `Efficiency Experts`,
  `Night Shift` mit zwei Overlaps und `Scorched Earth` mit zwei Overlaps.

### Match B

- 28 eindeutige Karten, 45 Karten insgesamt;
- Primärstrategien: `ambush_bluff`, `fast_advance`,
  `overadvance_value`;
- `status = failed`, sieben blockierende
  `compiled_effect_overlap`-Befunde;
- betroffene Karten: `Marine Arcology`, `Accounts Receivable`,
  `Efficiency Experts`, `Night Shift` mit zwei Overlaps,
  `Overtime Incentives` und `Red Herrings`.

Eine direkte Kausalität dieser Overlaps für A1, A2, B1 oder B2 ist nicht
belegt. Der Auditstatus ist dennoch ein Abschlussblocker. P2 sichert die
exakten Überlappungen als rote Compiler-/Inspector-Verträge; P4 normalisiert
nur tatsächlich deckungsgleiche Effektkerne und führt beide vollständigen
Audits erneut aus.

## Checkpoint- und Fix-Scope

| Finding | Historischer Anker | Bessere zulässige Richtung | Fix nur bei |
| --- | --- | --- | --- |
| A1 | Match A D45 | geschützte Scoreline konvertieren | `behavior_regression` |
| A2 | Match A D55 | Score-Remote-Root freihalten | `behavior_regression` |
| B1 | Match B D27 | Agenda-Punkte im Zielrisiko werten | `behavior_regression` |
| B2 | Match B D110 | konkrete Matchpoint-Linie beginnen | `behavior_regression` |
| B3 | Match B D8/D64 | generischer Nicht-ICE-Rez-Vertrag | roter Engine-/Replay-Vertrag |
| Decks | beide Snapshots | null Effekt-Overlaps | rote Hint-Verträge |

## Nicht-Findings und Grenzen

- Alle übrigen klassifizierten Decisions bleiben außerhalb des
  Verhaltenstunings.
- Die Choice-Daten reichen nicht aus, um D4/D7/D23/D29/D35 aus Match A oder
  D13 aus Match B besser als die produktive KI zu bewerten.
- Ein verlorenes Spiel allein beweist keine schlechte Entscheidung; die vier
  Verhaltensanker beruhen jeweils auf legaler Alternative, vollständig
  sichtbarem Kontext und nachvollziehbarer fehlerhafter Scoring- oder
  Controller-Kette.
- Der Livebefund zu `Rent-I-Con` in Match B wurde bereits in einem separaten
  Mechanikpaket behoben und ist kein Bestandteil dieses Prozesses.
