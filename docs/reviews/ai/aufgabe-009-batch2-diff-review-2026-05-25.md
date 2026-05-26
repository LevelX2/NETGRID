# Aufgabe 009 - AI-Hints: Batch-2 Diff-/Normalization-Review

## Kurzfazit

Aufgabe 009 klassifiziert die Batch-2-Differenzen aus dem read-only Dry-Run von Aufgabe 008. Ergebnis: Es gibt 0 echte semantische Konflikte. Alle 5 Shape-Differences, 2 TargetProfile-Differences, 2 TrashCredit-Differences, 6 CostProfile-Differences und 7 BoardContext-Hinweise sind erklaerbare Architektur-/Normalisierungsdifferenzen.

Batch 2 bleibt unveraendert read-only. `data/ai/ai-card-hints-active.json` bleibt Runtime-Quelle, es gibt keine aktive Hintmigration und keine Runtime-, Planner- oder Consumer-Wirkung.

## Ausgangslage

Aufgabe 008 hat Batch 2 mit sechs Karten geprueft:

- `Japanese Water Torture`
- `Krash`
- `Mystery Box`
- `Poltergeist`
- `Scatter Shot`
- `Self-Modifying Code`

Dry-Run-Befund aus Aufgabe 008:

- Preview-Adds: 3
- bestaetigte Generated Facts: 11
- Hard Errors: 0
- Konflikte: 0
- Warnings: 47
- `shape_difference`: 5
- `target_profile_shape_difference`: 2
- `trash_credit_target_shape_difference`: 2
- `cost_profile_shape_difference`: 6
- `board_context_required`: 7

Der neue Report liegt unter `docs/reviews/ai/aufgabe-009-batch2-diff-review-report-2026-05-25.json`.

## Klassifikation

### Shape-Differences

Die 5 Shape-Differences wurden so klassifiziert:

- `Japanese Water Torture` / `breakerProfile`: `generated_more_precise_than_monolith`
- `Krash` / `breakerProfile`: `semantic_equivalent_shape_difference`
- `Mystery Box` / `effect:install_discount`: `semantic_equivalent_shape_difference`
- `Poltergeist` / `effect:trash_credit`: `monolith_more_specific_than_generated`
- `Scatter Shot` / `effect:trash_credit`: `monolith_more_specific_than_generated`

Keiner dieser Faelle ist ein echter semantischer Konflikt. Die Breaker-Faelle brauchen eine gemeinsame BreakerProfile-Normalform. Mystery Box braucht eine Install-Cost-/TargetProfile-Normalisierung. Poltergeist und Scatter Shot brauchen spaeter eine Trash-Credit-Target-/Amount-Normalisierung.

### TargetProfile-Differences

Die 2 TargetProfile-Differences wurden als `generated_more_precise_than_monolith` klassifiziert:

- `Self-Modifying Code`: `zone = stack`, `targetCardType = program`, `installsTarget = true`, `installCost = normal`, `shuffleAfter = true`
- `Mystery Box`: `zone = stack_top`, `lookCount = 5`, `targetCardType = program`, `installsTarget = true`, `installCost = free`, `showToOpponent = true`, `oncePerRun = true`

Wichtig: SMC bleibt normal-cost und erzeugt kein `install_discount`. Mystery Box bleibt der echte Free-Install-Fall.

### TrashCredit-Differences

Die 2 TrashCredit-Differences wurden zielgetrennt klassifiziert:

- `Poltergeist`: `target_equivalent_node_trash_credit`
- `Scatter Shot`: `target_equivalent_upgrade_trash_credit`

Der aktuelle Generated-Facts-Pfad bestaetigt `trash_credit`, traegt aber noch nicht Amount/Repeatable/Target in derselben Form wie der Monolith. Das ist kein Konflikt, aber ein guter Kandidat fuer eine Normalisierungsregel.

### CostProfile-Differences

Alle 6 CostProfile-Differences wurden als `cost_profile_requires_overlay_split` klassifiziert.

Der aktive Monolith mischt hier mechanische Kostenfelder wie `clicks`, `credits`, `memory` mit strategischen Diagnosefeldern wie `reserveRisk` und `opportunityCost`. Fuer eine spaetere Migration sollten mechanische Kosten getrennt von strategischem Overlay betrachtet werden. Reserve-/Opportunity-Risiko soll nicht als Generated Basic Fact behandelt werden.

### BoardContext-Hinweise

Die 7 BoardContext-Hinweise sind keine Fehler:

- `target_profile_requires_search_legalaction_context`: 6
- `install_cost_requires_engine_cost_context`: 1

Search, TargetProfile, During-run-Bedingungen und Install-Cost-Angaben beschreiben Kartenfunktion. Tatsaechliche Playability, Install-Legalitaet und Kostenabwicklung bleiben Engine-/LegalAction-Kontext.

## Normalisierungsregeln

Empfohlene Normalisierungsregeln fuer Aufgabe 010:

1. `target_profile_install_cost_normalization`
   - SMC `installCost = normal` bleibt normal-cost und kein Discount.
   - Mystery Box `installCost = free` bleibt echter Free-Install.

2. `target_profile_stack_search_normalization`
   - Full-stack search (`zone = stack`) und top-five look/install (`zone = stack_top`, `lookCount = 5`) werden als unterschiedliche stabile TargetProfile-Klassen normalisiert.

3. `trash_credit_target_normalization`
   - Poltergeist bleibt node-trash-credit.
   - Scatter Shot bleibt upgrade-trash-credit.
   - Amount/Repeatable werden nur normalisiert, wenn der Vergleich sie sauber tragen kann.

4. `breaker_profile_shape_normalization`
   - Coverage, BaseStrength-Defaults, PumpCost, BreakCost und SideEffects werden in eine vergleichbare BreakerProfile-Normalform gebracht.
   - Krash bleibt universal.
   - Japanese Water Torture behaelt `forgo_actions`.

5. `cost_profile_split_normalization`
   - Mechanische Kosten werden von Reserve-/Opportunity-Risiko getrennt.
   - Strategisches Risiko bleibt Overlay/Diagnose, nicht Generated Fact.

6. `board_context_required_classification`
   - Board-/LegalAction-Kontext wird als Info/Kontext klassifiziert, nicht als Migration-Blocker.

## Bewusst Nicht Geaendert

- Keine Aenderung an `data/ai/ai-card-hints-active.json`.
- Keine Aenderung an `aiSupportStatus`.
- Keine aktive Hintmigration.
- Keine Runtime-Nutzung des Compilers.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Planner-, Consumer- oder Engine-Aenderung.
- Keine Monolith-Bereinigung.
- Keine Performanceinterpretation.

## Empfehlung

Aufgabe 010 sollte ein Batch-2 Normalization-Dry-Run sein. Ziel: die sechs Normalisierungsregeln im read-only Comparator-Pfad anwenden und pruefen, ob Batch 2 danach ohne relevante Shape-/Target-/Trash-/CostProfile-Diffs rollup-ready ist.
