# KI-Match-F5D27033-Flatline-Risiko-Evidence

Status: umgesetzt und verifiziert

## Quelle und Reproduktion

- Match: `match_f5d27033a083d6b8`
- beendet: 2026-07-16, 23:04 Uhr Ortszeit
- Runtime-Quelle: lokale Multiplayer-SQLite
- Replay: alle 36 historischen KI-Entscheidungen auf unverändertem `main`
  reproduziert
- Checkpoint-Warmup: für alle sechs Fixtures `strict`, Drift `0`
- Hidden-Info-Grenze: PlayerView und öffentlicher Eventpräfix des jeweiligen
  Entscheidungszeitpunkts

## Vorher: rote Zielentscheidungen

### F01: bekannter Damage-Ambush wird trotzdem betreten

Decision 13, StateVersion 25. Der Runner hat neun Credits, vier Handkarten und
zwei Klicks. Im einzigen Root des laufenden Remote-Runs liegt sichtbar und
gerezzt nur Vacant Soulkiller mit zwei Advancement Countern. Der Kartenhint
beschreibt korrekt Access-Schaden und Ambush-Rolle. Trotzdem gewinnt
`continue_run` gegen `jack_out`, weil die Continue-/Jack-out-Kette den sichtbaren
Access-Schaden nicht konsumiert und Jack-out noch den generischen Malus trägt.

Unveränderte Erwartung: `jack_out`; `continue_run` ist verboten.

### F02: marginale Mem-Chip-Installation blockiert den klaren Rohgewinner

Decision 24, StateVersion 41. Der Runner hat neun Credits, drei Handkarten,
einen Klick sowie Memory 1/4. Die Installation von Zetatech Mem Chip kostet
drei Credits und eine Handkarte, obwohl kein Memorydruck besteht. Ihr Rohscore
ist 2; `draw_card` liegt bei 1248. Der absolute Schritt
`runner.play_best_hand_card` hält dennoch an der schwachen Installation fest.

Unveränderte Erwartung: `draw_card`; die Mem-Chip-Installation ist verboten.

### F03: bestätigtes Damage-Signal verliert gegen opportunistischen HQ-Plan

Decision 33, StateVersion 56. Der Runner hat sechs Credits, drei Handkarten,
einen Klick und zwei Core Damage; seine effektive maximale Handgröße ist damit
drei. Soulkiller-Schaden und Neural Blade sind bereits sichtbar bestätigt. HQ
hat keinen bekannten unmittelbaren Ertrag. Der Rohscore bevorzugt zunächst eine
handverbrauchende Installation; danach erzwingt der opportunistische Run-Plan
den HQ-Run vor dem Basiscredit. Das tatsächliche folgende Chance-Observation-
plus-Urban-Renewal-Fenster ist zu diesem Zeitpunkt verdeckt und wird weder als
Hint noch als Input verwendet. Sichtbar begründet sind nur die bestätigte
Damage-Lage, der fehlende Hand-Headroom und der Wert einer flexiblen
Reaktionsreserve.

Unveränderte Erwartung: `gain_credit`; der opportunistische HQ-Run ist verboten.

## Hint- und Consumer-Audit

Die relevanten Hints sind fachlich korrekt:

- Vacant Soulkiller: Access-/Core-Damage-Ambush
- Neural Blade: Damage-Signal
- Fang: Trace/End-the-run, kein falsches Tag-Signal
- Trojan Horse: Tag-Quelle
- Chance Observation: Trace plus Tag
- Urban Renewal: Damage-Payoff

Der Fehler liegt nicht in den Hints. Die Lücken liegen in den Konsumenten:

1. Die Continue-/Jack-out-Bewertung nutzt den sichtbaren bekannten
   Access-Schaden nicht.
2. Handpuffer behandeln die effektive Maximalhand und den durch Core Damage
   verlorenen Headroom nicht konsequent.
3. Plan-Arbitration lässt marginale Development-Installationen und
   opportunistische Runs zu absolut über stärkeren Survival-/Reserve-Aktionen
   stehen.

## Positive Gegenproben

- Decision 30: Ein Remote-Run ohne bekannten Damage-Ambush wird fortgesetzt.
- Decision 20: Krash bleibt als konkret nützliche Breaker-Installation erlaubt.
- Decision 17: Ein R&D-Run mit sichtbarem unmittelbarem Ertrag bleibt erlaubt,
  obwohl bereits Damage-Druck bekannt ist.

Diese drei Checkpoints sind auf unverändertem Code grün. Der Fix darf sie nicht
in allgemeine Passivität umkehren.

## Erwarteter Red-Gate-Stand

Der fokussierte Checkpoint-Test muss vor der Runtime-Korrektur genau drei
`behavior_regression`-Fehler liefern: F01, F02 und F03. Die drei Gegenproben und
der Hidden-Info-Test müssen grün bleiben. Warmup-, Fixture-, Engine-Legality-
oder Runtime-State-Drift zählt nicht als Verhaltensnachweis.

Der unveränderte Ausgangscode lieferte genau diesen Stand: F01, F02 und F03
scheiterten ausschließlich als `behavior_regression`; alle drei Gegenproben und
der Hidden-Info-Test waren grün.

## Umsetzung

### Bekannter Access-Damage-Ambush

Die Runner-Bewertung konsumiert am Jack-out-Fenster nun den bereits sichtbaren
Hint eines gerezzten, bekannten Access-Damage-Ambushes, wenn er die einzige
Root-Karte des erreichten Remote-Servers ist. Ein erforderlicher
Advancement-Counter wird aus der sichtbaren Karte geprüft. Die Regel ist weder
an Vacant Soulkiller noch an eine verdeckte Definition gebunden.

F01 wählt danach `runner.jack_out`. Der Continue-Score erhält im geprüften Fall
den generischen Faktor `runner_known_access_damage_ambush`; dadurch gewinnt
Jack-out trotz des bestehenden Druckverlust-Malus mit -351.

### Effektive Handgröße und Reaktionsreserve

`RunnerDamageThreatAssessment` führt nun die effektive maximale Handgröße und
den verbleibenden Hand-Headroom. Bei bestätigtem oder kritischem Damage-Druck,
einem durch Core Damage auf den empfohlenen Floor gesenkten Handlimit, vollem
Handpuffer und nur einem verbleibenden Klick gilt:

- ein Basiscredit unter zehn liquiden Credits gewinnt abgestuft
  Reaktionsreserve;
- ein letzter Draw unter acht Credits wird abgewertet, weil er den dauerhaften
  Handpuffer nicht erhöht;
- eine nicht unmittelbar defensive Installation wird für den verlorenen
  Puffer bestraft;
- Breaker, Damage-Prevention, Tag-Prevention, Handgrößenhilfe und
  Core-Damage-Reparatur bleiben als unmittelbare Verteidigung erlaubt.

F03 wählt danach `runner.gain_credit` mit Rohscore 1509. Der sichtbare Faktor
`runner_damage_locked_hand_reaction_reserve` trägt +650 bei; der
opportunistische HQ-Plan mit Rohscore 844 gibt über
`damage_reaction_reserve_mapping_yield` frei.

### Marginale Kapazitätsinstallation

Ein `runner.play_best_hand_card`- oder Development-Plan darf eine positive,
aber sehr schwache kumulative Kapazitätsinstallation nicht mehr absolut gegen
einen um mehr als 600 Punkte stärkeren Basis-Draw oder Basiscredit schützen.
Die bestehende Broker-Investment-Ausnahme bleibt erhalten; neue Coverage,
wertvolle Breaker und andere Installationsklassen werden nicht pauschal
freigegeben.

F02 wählt danach den unveränderten Rohgewinner `runner.draw_card` mit 1248
statt der Mem-Chip-Installation mit 2. Die Arbitration meldet Score-Gap 1246
bei Schwelle 600.

## Nachher-Gates

- sechs spielgleiche Checkpoints: drei Zielentscheidungen grün, drei
  Gegenproben grün, Hidden-Info-Test grün
- fokussierter Runtime-Verbund: 108/108 Tests grün
- `@netgrid/ai`-Typecheck: grün
- `check:ai:full`: grün; 618 aktive Hints, 528 Implementierungen, 391
  generierte Facts, 137 Fallbacks, null harte Fehler
- vollständige AI-Suite: 346/354 Dateien und 2445/2460 Tests grün
- die 15 roten Tests in acht Dateien sind auf demselben `main` identisch
  reproduzierbare Broker-/Plan- und Hint-Quality-Altfehler; der Slice fügt
  keinen neuen Vollsuite-Fehler hinzu
- `git diff --check`: grün

## Ergebnis

Die drei freigegebenen Fehler sind mit unveränderten historischen Erwartungen
geschlossen. Die KI nutzt nur PlayerView, öffentliche Eventpräfixe,
LegalActions und bereits geprüfte Hints. Sie kennt Chance Observation und
Urban Renewal an F03 weiterhin nicht. Ambige frühe Check-Runs bleiben über die
vorhandene replay-stabile Probevariation variabel; nur die klar sichtbaren
Damage-/Pufferlagen erhalten den neuen deterministischen Schutz.
