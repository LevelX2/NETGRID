# Aufgabe 019 - AI-Hints: Corp Economy / Operation / Advance-Burst Closeout

## Kurzfazit

Aufgabe 019 schließt den read-only Batch `batch_8_corp_economy_operation_advance_burst` für Corp Economy, Operations, Advance-Burst und Score-Conversion-Support ab. Der Batch bleibt konfliktfrei und ohne Runtime-, Planner-, Consumer- oder Engine-Wirkung. `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle.

Ergebnis:

- 30 Kandidaten geprüft.
- 30 Karten eingeschlossen.
- 0 Karten ausgeschlossen.
- 101 Generated Facts bestätigt oder neu abgeleitet.
- 84 Preview-Adds im read-only Vergleichspfad.
- 199 Differenzen/Kontext-Hinweise normalisiert.
- 0 verbleibende Differenzen.
- 0 Hard Errors.
- 0 echte semantische Konflikte.
- Readiness: `ready_read_only_split_subbatches`.

## Warum Dieser Batch

Nach Corp ICE / Future / Trace / Damage ist Corp Economy / Operation / Advance-Burst der nächste direkte Score-Conversion-Hebel. Die mechanischen Outputs sind aus Implementations gut als Generated Basic Facts abgrenzbar:

- Credits, Draw und Extra-Actions.
- Advancement-Counter und Score-Acceleration.
- Rez-/Install-at-no-cost.
- When-scored Economy und finite hosted credit pools.
- Global Research Modifier.
- HQ-/R&D-/Archives-Kontext ohne Hidden Info.

Strategische Score-Conversion bleibt weiterhin Overlay, Planner oder Diagnose. Generated Facts beschreiben nur die statische Kartenfunktion.

## Geprüfte Kandidaten

Eingeschlossen:

- `Project Consultants`
- `Planning Consultants`
- `Systematic Layoffs`
- `Team Restructuring`
- `Night Shift`
- `Overtime Incentives`
- `Off-Site Backups`
- `Silver Lining Recovery Protocol`
- `Corporate Downsizing`
- `Corporate War`
- `Hostile Takeover`
- `Priority Requisition`
- `Security Purge`
- `Data Fort Reclamation`
- `Superior Net Barriers`
- `Encryption Breakthrough`
- `Polymer Breakthrough`
- `Subsidiary Branch`
- `Marine Arcology`
- `AI Chief Financial Officer`
- `Ice Transmutation`
- `Security Net Optimization`
- `Bioweapons Engineering`
- `Black Ice Quality Assurance`
- `Artificial Security Directors`
- `Executive Extraction`
- `Genetics-Visionary Acquisition`
- `Corporate Retreat`
- `Detroit Police Contract`
- `Political Coup`

Ausgeschlossen:

- Keine. Alle 30 Kandidaten haben aktiven Hint, Runtime-Katalogkarte, CardImplementation und passen fachlich in den Batch.

## Derived-Facts-Erweiterungen

Der read-only Deriver/Pilot wurde um Batch-8-Karten und stabile Economy-/Score-Conversion-Fact-Klassen erweitert:

- `effect:economy`
- `effect:counter_economy`
- `effect:draw`
- `effect:extra_action`
- `effect:score_acceleration`
- `effect:advance_burst`
- `effect:rez_discount`
- `effect:install`
- `effect:rez`
- `effect:remote_build`
- `effect:finite_economy_pool`
- `effect:agenda_reveal_economy`
- `effect:shuffle_draw`
- `effect:card_recovery`
- `effect:global_modifier`
- `condition:requires_scored_agenda`
- `condition:requires_score_window`
- `condition:requires_agenda_in_hq`
- `condition:requires_agenda_reveal`
- `condition:requires_hq_agenda`
- `condition:requires_rnd_top`
- `condition:requires_archives_card`
- `condition:requires_start_of_turn`
- `condition:requires_corp_credits_threshold`
- `condition:requires_stolen_agenda_last_turn`

Deriver-Heuristiken für Agenda-Lifecycle-Facts sind scope-gebunden: Start-of-turn-Pools werden nicht als scored-activated Payouts umgedeutet.

## Normalisierung

Normalisierte Regeln:

- `operation_economy_normalization`
- `finite_economy_pool_normalization`
- `scored_activated_economy_draw_normalization`
- `advance_burst_operation_normalization`
- `rez_or_install_discount_normalization`
- `global_research_modifier_normalization`
- `agenda_reveal_or_hq_context_normalization`
- `shuffle_draw_or_rnd_reset_normalization`
- `score_conversion_overlay_split_normalization`
- `score_context_required_classification`
- `legalaction_context_required_classification`
- `hidden_zone_context_classification`
- `variable_amount_context_classification`
- `board_context_required_classification`

## Kontextregeln

Economy / Operations:

- Operation-Economy beschreibt nur mechanische Credit-, Draw- oder Action-Ausgabe.
- Generated Facts empfehlen nicht, eine Operation jetzt zu spielen.

When-scored / Score-Area:

- When-scored- und scored-activated-Facts bleiben Score-/LegalAction-Kontext.
- Sie erzeugen keine `score_now`-Legalität und keine automatische Creditnahme.

Advance-Burst:

- Advance-Burst beschreibt advancement-counter placement.
- Tatsächliche Advance-/Score-Legalität bleibt Engine/LegalActions.

Rez / Install:

- Rez-/Install-at-no-cost-Facts wählen keine Ziele.
- Hidden-Zone-Zielauswahl und konkrete Boardwirkung bleiben Engine-Kontext.

HQ / R&D / Archives:

- Generated Facts enthalten keine konkrete versteckte Kartenidentität und keine R&D-Reihenfolge.
- Shuffle-/Draw-/Reveal-/Recovery-Facts bleiben side-safe Kontext.

Global Modifier:

- Persistent/global modifiers sind mechanische Facts.
- Ob sie aktuell wirken, entscheidet Boardstate/Score-Area/Engine.

Score Conversion:

- Mechanische Economy-/Advance-/Rez-Facts werden von strategischer Score-Conversion getrennt.
- Score-Conversion-Wert bleibt Overlay/Planner/Diagnose und wird nicht generated.

## Rollup-Status

Batch 8 ist `ready_read_only_split_subbatches`.

Subbatches:

- `corp_operation_economy`
- `corp_operation_draw_or_recovery`
- `corp_advance_burst`
- `when_scored_economy_or_rez`
- `scored_agenda_economy`
- `global_research_modifier`
- `score_conversion_support`

Alle 30 eingeschlossenen Karten sind `ready_read_only_with_score_legalaction_context`.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine modularen Overlays als Runtime-Quelle.
- Keine Engine-, Planner-, Consumer- oder Profiländerung.
- Keine Performanceinterpretation.

## Nächster Batch

Empfohlen für Aufgabe 020: `corp_nodes_assets_ambush_economy_remotes`.

Begründung: Nach Corp Economy und Score-Conversion sind Corp Nodes/Assets/Ambush/Economy Remotes der nächste große gameplay-relevante Block. Er schließt direkt an Remote-Portfolio, Trash-Budget und Tag/Punish-Kontext an. Remote-Intent, Bait-Wertung und Trash-Priorität bleiben strategische Overlay-/Planner-Themen und dürfen nicht als mechanische Generated Facts überdehnt werden.
