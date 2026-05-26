# Aufgabe 004: Batch-1 Compiler-Diff-Review

Datum: 2026-05-25

## Kurzfazit

Aufgabe 004 klassifiziert die 7 `shape_difference`-Warnings und den 1 `monolith_only_mechanical_fact` aus dem Batch-1-Dry-Run. Ergebnis: keine echten semantischen Konflikte, keine aktiven Hintänderungen, keine Runtime-, Planner- oder Consumer-Wirkung.

Die Differenzen sind künftige Normalisierungs- und Deriver-Themen. Sie blockieren keine read-only Batch-1-Weiterarbeit.

## Ausgangslage Aus Aufgabe 003

- Batch-1-Karten: 11
- Preview-Adds: 0
- Bestätigte Generated Facts: 39
- Hard Errors: 0
- Konflikte: 0
- `shape_difference`: 7
- `monolith_only_mechanical_fact`: 1

Quelle:

- `docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json`

Neuer Detailreport:

- `docs/reviews/ai/aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json`

## Shape-Differences

Die 7 Shape-Differences verteilen sich so:

- `monolith_more_specific_than_generated`: 6
- `board_context_shape_difference`: 1
- `real_semantic_conflict`: 0

Details:

| Karte                        | Fact                       | Klassifikation                          | Befund                                                                                                                                       |
| ---------------------------- | -------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Netwatch Operations Office` | `effect:tag_source`        | `board_context_shape_difference`        | Generated hängt den Tag an die scored activation, der Monolith an `trace_success`. Beides beschreibt denselben verschachtelten Trace-Erfolg. |
| `Netwatch Operations Office` | `effect:trace`             | `monolith_more_specific_than_generated` | Generated beschreibt Trace-Klasse/Corp-Initiierung, Monolith enthält Runner-Ziel und Trace-Basis `2`.                                        |
| `On-Call Solo Team`          | `effect:tag_punish_payoff` | `monolith_more_specific_than_generated` | Generated beschreibt den tagged-runner payoff, Monolith spiegelt zusätzlich Amount `1`.                                                      |
| `Strike Force Kali`          | `effect:tag_punish_payoff` | `monolith_more_specific_than_generated` | Generated beschreibt den tagged-runner payoff, Monolith spiegelt zusätzlich Amount `2`.                                                      |
| `Audit of Call Records`      | `effect:trace`             | `monolith_more_specific_than_generated` | Generated beschreibt Trace-Klasse/Corp-Initiierung, Monolith enthält Runner-Ziel und Trace-Basis `5`.                                        |
| `Chance Observation`         | `effect:trace`             | `monolith_more_specific_than_generated` | Generated beschreibt Trace-Klasse/Corp-Initiierung, Monolith enthält Runner-Ziel und Trace-Basis `5`.                                        |
| `Scorched Earth`             | `effect:tag_punish_payoff` | `monolith_more_specific_than_generated` | Generated beschreibt den tagged-runner payoff, Monolith spiegelt zusätzlich Amount `4`.                                                      |

## Monolith-Only-Fact

Der einzelne `monolith_only_mechanical_fact` liegt bei `Employee Empowerment`:

- Active Monolith: `effect:draw`, `timing: start_of_turn`, `amount: 1`
- Generated Facts: nur aktivierte scored-agenda Action `draw 2`
- Klassifikation: `generated_deriver_gap`

Der Fact ist mechanisch, nicht strategisch. Er ist aber nicht im aktuellen CardImplementation-Descriptor sichtbar, weil der Start-of-turn-Draw über separaten scored-agenda Legacy-Flow läuft. Keine aktive Hintänderung in diesem Slice.

## Echte Konflikte

Echte semantische Konflikte: 0.

Keine Differenz zeigt, dass der Monolith fachlich falsch und Generated korrekt wäre oder umgekehrt. Die Abweichungen sind Shape-/Detailfragen.

## Empfohlene Normalisierungsregeln

1. `trace_scope_participant_normalization`
   - Generated `scope: corp` beschreibt Trace-Initiator.
   - Monolith `scope: runner` beschreibt Trace-Ziel.
   - Ein späterer Compiler sollte beides als denselben Trace-Fact normalisieren können.

2. `nested_trace_success_timing_normalization`
   - Generated `tag_source` kann am Parent-Event `scored_activated` hängen.
   - Monolith hängt denselben Tag an `trace_success`.
   - Ein späterer Compiler braucht eine Trigger-Chain-Normalisierung.

3. `tag_punish_payoff_amount_from_payload`
   - Generated `tag_punish_payoff` beschreibt die Payoff-Klasse.
   - Monolith spiegelt den Amount auf dem Payoff-Fact.
   - Ein späterer Compiler kann den Amount aus dem gepaarten `damage`- oder `counter_economy`-Fact übernehmen.

## Empfohlene Deriver-Follow-ups

1. `Employee Empowerment`
   - Start-of-turn draw als Descriptor oder Deriver-Quelle sichtbar machen.

2. Trace-Karten
   - Trace-Ziel und Trace-Basis ableiten, wo die Implementation das stabil hergibt.

3. Tag-Punish-Karten
   - Payoff-Amount aus dem gepaarten mechanischen Payload-Fact in `tag_punish_payoff` normalisieren.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-Regeländerung.
- Keine Strategieänderung.
- Keine Planerwirkung.
- Keine Runtime-Nutzung des Compilers.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Performanceinterpretation.

## Nächster Schritt

Wenn Batch 1 weitergeführt wird, ist Aufgabe 005 sinnvoll als read-only Normalization-Rule-Dry-Run: Trace-Scope, Trace-Success-Timing und Tag-Punish-Amount so normalisieren, dass semantisch gleiche Facts nicht mehr als Shape-Warnings zählen. Weiterhin ohne aktive Migration.
