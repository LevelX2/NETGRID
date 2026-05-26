# Aufgabe 005: Batch-1 Normalization-Rule-Dry-Run

Aufgabe-ID: Aufgabe 005

## Kurzfazit

Der Batch-1-Normalization-Dry-Run normalisiert alle sieben aus Aufgabe 004 bekannten Shape-Differences im read-only Comparator-Pfad. Es bleiben 0 unnormalisierte Shape-Differences und 0 echte semantische Konflikte. Der Employee-Empowerment-Deriver-Gap bleibt separat sichtbar und wird durch die Normalisierung nicht verdeckt.

`data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle. Es gibt keine Runtime-, Planner-, Consumer- oder Engine-Wirkung.

## Ausgangslage

Aufgabe 004 hatte sieben Shape-Differences und einen Monolith-only-Fact klassifiziert:

- `Netwatch Operations Office`: `tag_source`, `trace`
- `On-Call Solo Team`: `tag_punish_payoff`
- `Strike Force Kali`: `tag_punish_payoff`
- `Audit of Call Records`: `trace`
- `Chance Observation`: `trace`
- `Scorched Earth`: `tag_punish_payoff`
- `Employee Empowerment`: Monolith-only `effect:draw` mit `timing=start_of_turn`

Die Shape-Differences waren keine echten Konflikte, sondern Formunterschiede zwischen aktivem Monolithen und Generated Basic Facts. Aufgabe 005 macht diese Semantik im Dry-Run explizit.

## Normalisierungsregeln

### `trace_actor_target_scope`

Normalisiert `effect:trace`, wenn Monolith und Generated Fact denselben Timing-Kontext haben, aber Scope/Participant unterschiedlich formen. Die Vergleichsnormalform ist `actor=corp`, `target=runner`, `scope=runner`, `boardContextRequired=true`.

Die Regel behauptet keinen Trace-Erfolg und keine aktuelle Legalität. `requires_trace_success` bleibt eine separate Bedingung.

### `tag_source_trace_success`

Normalisiert `effect:tag_source`, wenn der Monolith den Tag-Payoff als `trace_success` beschreibt und der Generated Fact denselben Tag-Payoff am Parent-Action-Kontext ausweist. Die Vergleichsnormalform setzt `trigger=trace_success`, `actor=corp`, `target=runner`, `resource=tags`.

Direkte Tags ohne Trace werden dadurch nicht als Trace-Success-Tags normalisiert.

### `tag_punish_payoff_amount_from_pair`

Normalisiert `effect:tag_punish_payoff`, wenn der Generated Fact den Payoff erkennt, der Monolith aber zusätzlich den Amount aus dem gekoppelten Payload-Fact trägt. Die Vergleichsnormalform übernimmt den Amount aus dem aktiven Shape und behält `requires_runner_tagged` als Voraussetzung bei.

Variable Amounts wie “all credits” werden nicht künstlich numerisch gemacht.

## Ergebnis

| Regel                                | Anzahl |
| ------------------------------------ | -----: |
| `trace_actor_target_scope`           |      3 |
| `tag_source_trace_success`           |      1 |
| `tag_punish_payoff_amount_from_pair` |      3 |

Kennzahlen:

- Normalisierte Shape-Differences: 7
- Verbleibende Shape-Differences: 0
- Echte semantische Konflikte: 0
- Deriver-Follow-ups: 1

## Employee Empowerment

`Employee Empowerment` bleibt als Folgearbeit sichtbar: Der aktive Monolith enthält `effect:draw` mit `timing=start_of_turn`, `scope=corp`, `amount=1`. Das ist ein mechanischer Deriver-/Descriptor-Follow-up und nicht Teil dieses Normalization-Slices.

## Bewusst Nicht Geändert

- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Änderung an `aiSupportStatus`
- keine Engine-, LegalAction-, Planner-, Consumer- oder Runtime-Änderung
- keine aktive Generated-Fact-Migration
- keine Bereinigung des Employee-Empowerment-Monolith-Facts

## Nächster Schritt

Der nächste praktische Schritt ist Aufgabe 006 als enger Employee-Empowerment-Deriver-Follow-up: den Start-of-turn-Draw mechanisch sichtbar machen oder sauber als Descriptor-Gap dokumentieren, weiterhin read-only und ohne Runtime-Umstellung.
