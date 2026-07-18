# Match 3bb14: Corp-KI-Remediation-Evidence

Erfasst: 2026-07-18  
Abgeschlossen: 2026-07-19  
Match: `match_3bb14a8fd2102c9a`  
Ausgangsstand: `81f9e0e0d89fb8e7d534d7e8ecb3f161c3c0fca7`

## Match- und Coverage-Evidence

- Modus: `human_runner_vs_corp_ai`
- Corp-Profil: `hard`
- Ergebnis: Runner gewinnt 5:1 durch Agendapunkte.
- Endzustand: StateVersion 105, StateHash `fnv1a:32e8de4a`
- Events und State-Snapshots: 106/106
- erwartete/vorhandene/zugeordnete AI-Entscheidungen: 42/42/42
- fehlende, verwaiste, doppelte oder typabweichende Traces: 0

Damit lag weder ein Engine-, LegalAction-, Replay- noch Tracefehler vor. Die
beiden bestätigten Fehler waren Bewertungs- und Arbitrationslücken der
Hard-Corp-KI.

## Rote spielgleiche Ausgangsevidence

Beide Captures bauen ihren PlayerView und ihre LegalActions über die Engine
erneut auf. Der Strict-Warmup über 38 beziehungsweise 39 vorangehende
Entscheidungen hatte jeweils null Drift. Vor dem Produktionsfix scheiterten
beide Zielverträge ausschließlich mit `behavior_regression`:

1. D39/SV87 installierte `Private Cybernet Police` in `remote_1`. Die
   ungescorte Agenda erhielt fälschlich 1.850 Punkte
   `corp_persistent_tag_engine_activation_pressure`, obwohl ihre persistente
   Tagquelle erst in der Score Area aktiv wird. Die bessere legale Alternative
   war eine zweite Lage `Shock.r` vor derselben Remote.
2. D40/SV88 advancete dieselbe Agenda trotz sieben benötigter Counter und nur
   eines verbleibenden Klicks. Der öffentliche, bei `The Shell Traders`
   bereitliegende `Rent-I-Con` fehlte in der projizierten
   Breaker-Erreichbarkeit. Er wurde im folgenden Runner-Zug installiert,
   brach `Sleeper`, stahl die Agenda und beendete das Spiel.

## Umgesetzte Consumer-Verträge

### Scored-only-Tag-Timing

`StructuredTagPunishProfile` transportiert nun ausdrücklich, ob eine
Agendawirkung eine gescorte Quelle verlangt. Installieren, Rezzen oder
Advancen einer noch ungescorten Quelle aktiviert diesen persistenten
Tag-Payoff nicht. Eine tatsächlich gescorte Agenda bleibt als positive
Gegenprobe wirksam.

### Öffentliche staged Breaker-Coverage

Die Scoring-Window-Projektion berücksichtigt einzeln sichtbare Breaker in
`specialZones.setAside`, wenn eine sichtbare Quelle einen echten
`delayed_install`-Pfad mit Shell-Countern anbietet und Credits sowie MU die
Installation zulassen. Aktuelle und projizierte Installationskosten werden
getrennt berechnet. Ohne sichtbare Installationsquelle bleibt die Karte
wirkungslos; verdeckte Hand-, Stack- oder Deckinformation wird nicht gelesen.

### Realistischer Score-Horizont und Folgeaktion

`immediate` bedeutet nur noch, dass die aktuelle Aktion die Agenda
scorebereit macht. Mehrere weitere Advances werden als `next_turn` oder
`slow` projiziert. Installieren oder Advancen einer Trace-Karte gilt nicht
mehr selbst als Trace-Auflösung. Board-Triage erkennt eine legal installierbare
Agenda hinter sichtbarem Root-Support sowie eine starke zweite ICE-Lage auf
derselben Remote als konkrete Schutzaktion.

Der vollständige Testlauf deckte zwei ältere Schutzfälle auf, die vorher
zufällig von den falschen Trace-Mali profitierten. Die generische
Nachbesserung verhindert ein `hold_for_later`-ICE als neuen leeren
Remote-Start und lässt bei kritisch niedrigen zwei Credits ein als `unsafe`
markiertes Advance nicht per Urgency-Controller den besseren Rohscore-Sieger
überstimmen. Drei bewusst aggressive historische Corp-Scorelines und die
positive Positions-ICE-Gegenprobe bleiben grün.

## Nachweise

- Match-Checkpoint-Suite: 4/4 grün; D39 und D40 wählen jeweils die zweite
  `Shock.r`-Lage vor `remote_1`.
- fokussierte Match-, Rent-I-Con-/CODE-ROT-, Choice-Ranking-, ICE-Placement-
  und Score-Tests: 117/117 grün.
- AI-Typecheck: grün.
- vollständige AI-Suite: 402/402 Testdateien und 2.846/2.846 Tests grün.
- `git diff --check`: grün.

Der erste vollständige Lauf nach der Horizontkorrektur fand sieben
Regressionen: fünf bestehende Tests erwarteten zu Recht, dass nur die aktuell
abschließende Aktion `immediate` ist; zwei historische Checkpoints legten die
oben beschriebenen früheren Trace-Malus-Abhängigkeiten offen. Nach der
generischen Korrektur ist der vollständige Lauf grün.

## Abgrenzung

Engine, LegalActions, PlayerViews, Replay, StateHash, Seed, RandomCounter und
RandomDrawRecords wurden nicht geändert. Verwendet werden ausschließlich
bereits öffentliche PlayerView-Daten.

Der deckweite `compiled_effect_overlap`-Audit aus Punkt 4 der ursprünglichen
Analyse ist nicht Bestandteil dieser Umsetzung. Seine elf gemeldeten Blocker
und die betroffenen Kartenprofile wurden hier weder verändert noch als
erledigt deklariert; die Bearbeitung erfolgt in einem anderen Thread.
