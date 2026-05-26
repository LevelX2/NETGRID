# Aufgabe 003: Batch-1 Generated-Facts-Dry-Run

Datum: 2026-05-25

## Kurzfazit

Aufgabe 003 führt einen read-only Dry-Run für Batch 1 der Generated-Fact-Migration aus. Der Dry-Run bestätigt die scored-agenda- und Tag/Punish-Facts aus Generated Basic Facts gegen den aktiven Hint-Monolithen, ohne `data/ai/ai-card-hints-active.json` zu ändern und ohne Runtime-, Planner- oder Consumer-Wirkung.

Ergebnis: 11 Batch-1-Karten, 39 bestätigte Generated Facts, 0 Preview-Adds, 0 Konflikte, 0 Hard Errors.

## Batch-1-Scope

Inputquellen:

- `data/ai/ai-card-hints-active.json`
- `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- `docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json`

Report:

- `docs/reviews/ai/aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json`

Check:

- `corepack pnpm check:ai-generated-fact-migration-dry-run`

In Scope:

- `scored_agenda_action`
- `economy`
- `counter_economy`
- `draw`
- `extra_action`
- `trace`
- `tag_source`
- `damage`
- `tag_punish_payoff`
- `requires_scored_agenda`
- `requires_trace_success`
- `requires_runner_tagged`

Nicht in Scope:

- `breakerProfile`
- `remoteRole`
- `targetProfiles`
- `costProfile`
- `lineSupport`
- `quality`
- `manualNotes`
- `strategicNotes`
- `descriptorGaps`
- `roles`
- `planRoles`
- `aiSupportStatus`

## Enthaltene Karten

Batch 1 enthält 11 Karten:

- `Corporate Boon`
- `Corporate Coup`
- `Employee Empowerment`
- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Political Overthrow`
- `Strike Force Kali`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`

Keine Aufgabe-002-Batch-1-Karte wurde ausgeschlossen.

## Ergebniszahlen

- Hard Errors: 0
- Konflikte: 0
- Warnings: 110
- Infos: 33
- Bestätigte Facts: 39
- Preview-Adds: 0
- Preview-geänderte Karten: 0

Warning-Gruppen:

- `consumer_active_for_fact_type`: 39
- `generated_fact_already_present`: 32
- `board_context_required`: 31
- `shape_difference`: 7
- `monolith_only_mechanical_fact`: 1

Info-Gruppen:

- `preview_only`: 11
- `legacy_keep_for_compat`: 11
- `no_change_needed`: 11

## Bestätigte Facts

Die 39 bestätigten Generated Facts liegen in den erwarteten Gruppen:

- Scored-agenda activation: `scored_agenda_action`, `requires_scored_agenda`
- Scored-agenda payoffs: `economy`, `counter_economy`, `draw`, `extra_action`, `damage`
- Trace/tag: `trace`, `tag_source`, `requires_trace_success`
- Tag punish: `requires_runner_tagged`, `tag_punish_payoff`, `damage`, `counter_economy`

Der Dry-Run ergänzt keine Facts in der Preview. Das ist gut: Batch 1 ist als späterer Compilerpfad vor allem ein Ersatz für bereits vorhandene mechanische Monolith-Facts, nicht eine Erweiterung der aktiven Hintdaten.

## Shape-Differenzen

Die 7 Shape-Differenzen sind nicht als Konflikte klassifiziert:

- Trace-Facts beschreiben im Generated Fact teils die Corp-Initiierung, während der aktive Monolith Runner-Targeting beschreibt.
- `tag_source` kann im Generated Fact am scored activation hängen, während der aktive Monolith die Trace-Success-Stufe ausdrückt.
- `tag_punish_payoff` kann im Generated Fact ohne `amount` stehen, während der aktive Monolith den konkreten Payoff-Betrag auf dem Payoff-Fact spiegelt.

Diese Formen sind semantisch plausibel, brauchen bei einer späteren echten Migration aber eine klare Normalisierungsregel.

## Board-Kontext

31 Warnings markieren `board_context_required`. Sie bedeuten nicht, dass der Fact falsch ist. Sie verhindern nur eine falsche statische Interpretation:

- scored-agenda actions sind nur relevant, wenn die Engine LegalActions dafür anbietet.
- trace success und tag punish hängen von Runtime-/Boardzustand ab.
- Generated Facts beschreiben die mechanische Klasse, nicht die aktuelle Legalität.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-Regeländerung.
- Keine Strategieänderung.
- Keine Planerwirkung.
- Keine Runtime-Nutzung des Compilers.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Consumer-Anbindung.
- Keine neue Deck- oder Holdout-Arbeit.

## Empfehlung

Der Dry-Run zeigt keine Konflikte. Aufgabe 004 kann daher ein read-only Batch-1-Compiler-Diff-Review sein:

1. Normalisierungsregeln für Shape-Differenzen festlegen.
2. Für Batch 1 definieren, welche Monolith-Facts später durch Generated Facts ersetzt werden könnten.
3. Weiterhin keine Runtime-Quelle umstellen, bis ein expliziter Compiler-/Fallback-Plan geprüft ist.
