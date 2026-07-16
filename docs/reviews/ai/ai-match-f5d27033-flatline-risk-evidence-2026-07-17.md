# KI-Match-F5D27033-Flatline-Risiko-Evidence

Status: Red Evidence vor Runtime-Korrektur

## Quelle und Reproduktion

- Match: `match_f5d27033a083d6b8`
- beendet: 2026-07-16, 23:04 Uhr Ortszeit
- Runtime-Quelle: lokale Multiplayer-SQLite
- Replay: alle 36 historischen KI-Entscheidungen auf unverändertem `main`
  reproduziert
- Checkpoint-Warmup: für alle sechs Fixtures `strict`, Drift `0`
- Hidden-Info-Grenze: PlayerView und öffentlicher Eventpräfix des jeweiligen
  Entscheidungszeitpunkts

## Rote Zielentscheidungen

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
