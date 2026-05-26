# Aufgabe 010 - AI-Hints: Batch-2 Normalization-Dry-Run

## Kurzfazit

Aufgabe 010 setzt die in Aufgabe 009 empfohlenen Batch-2-Normalisierungsregeln als read-only Comparator-/Dry-Run-Pfad um. Ergebnis: 15 Batch-2-Differenzen wurden normalisiert, 7 BoardContext-Hinweise werden als Safety-Infos geführt, und es bleiben 0 ungelöste Shape-/Target-/TrashCredit-/CostProfile-Differenzen sowie 0 echte semantische Konflikte.

`data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle. Es gibt keine Runtime-, Planner-, Consumer- oder Engine-Wirkung.

## Ausgangslage

Aufgabe 009 hatte Batch 2 konfliktfrei klassifiziert:

- `shape_difference`: 5
- `target_profile_shape_difference`: 2
- `trash_credit_target_shape_difference`: 2
- `cost_profile_shape_difference`: 6
- `board_context_required`: 7
- echte semantische Konflikte: 0

Der neue Normalization-Report liegt unter `docs/reviews/ai/aufgabe-010-batch2-normalization-dry-run-report-2026-05-25.json`.

## Implementierte Regeln

### `target_profile_install_cost_normalization`

Normalisiert SMC und Mystery Box als unterschiedliche, korrekte Install-Cost-Shapes:

- `Self-Modifying Code`: `installCost = normal`, kein `install_discount`, keine Free-Install-Semantik.
- `Mystery Box`: `installCost = free`, `install_discount`, Free-Install nur für den Mystery-Box-Effekt.

Nicht normalisiert wird eine Playability- oder Kostenentscheidung. Diese bleibt Engine-/LegalAction-Kontext.

### `target_profile_stack_search_normalization`

Normalisiert full-stack search und top-five stack look/install als unterschiedliche TargetProfile-Klassen:

- SMC: `zone = stack`, `targetCardType = program`, `installsTarget = true`.
- Mystery Box: `zone = stack_top`, `lookCount = 5`, `showToOpponent = true`, `oncePerRun = true`.

Top-five und full-stack werden ausdrücklich nicht gleichgesetzt.

### `trash_credit_target_normalization`

Normalisiert dedicated Trash-Credit-Facts zielgetrennt:

- `Poltergeist`: target `node`
- `Scatter Shot`: target `upgrade`

Die Regel erzeugt keine Zahlbarkeits- oder Trash-Legalität und darf die Targets nicht vertauschen.

### `breaker_profile_shape_normalization`

Normalisiert BreakerProfile-Vergleiche:

- `Japanese Water Torture`: coverage `wall`, `breakCost = 0`, SideEffect `forgo_actions`; Pump-/Action-Debt bleibt SideEffect.
- `Krash`: coverage `universal`, keine Reduktion auf spezifische ICE-Typen.

Die Regel erzeugt keine Break-Legalität. Encounter-, Run-, Kosten- und `effectiveRunQuote`-Bewertung bleiben Engine-/LegalAction-Sache.

### `cost_profile_split_normalization`

Trennt mechanische Kostenfelder von strategischem Risiko:

- mechanisch: `clicks`, `credits`, `memory`, Breaker-/Target-/Trash-Credit-Kosten, soweit generated.
- strategisch/Overlay: `reserveRisk`, `opportunityCost`, Action-Debt-Bewertung, Trash-Budget-Kontext.

Reserve-/Opportunity-Risiko wird nicht als Generated Basic Fact behandelt.

### `board_context_required_classification`

Klassifiziert Board-/LegalAction-Kontext als Info:

- Search/Target/During-run: `target_profile_requires_search_legalaction_context`
- Install-Cost: `install_cost_requires_engine_cost_context`

Diese Hinweise bleiben sichtbar, zählen aber nicht als ungelöste Warning oder Migration-Blocker.

## Ergebnis

- normalisierte Differenzen: 15
- BoardContext-Infos: 7
- verbleibende Shape-Differences: 0
- verbleibende TargetProfile-Differences: 0
- verbleibende TrashCreditTarget-Differences: 0
- verbleibende CostProfile-Differences: 0
- echte semantische Konflikte: 0
- Hard Errors: 0

Regelanwendungen:

- `target_profile_install_cost_normalization`: 3
- `target_profile_stack_search_normalization`: 2
- `trash_credit_target_normalization`: 4
- `breaker_profile_shape_normalization`: 2
- `cost_profile_split_normalization`: 6
- `board_context_required_classification`: 7

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine aktive Hintmigration.
- Keine Runtime-Nutzung des Compilers.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Planner-, Consumer- oder Engine-Änderung.
- Keine Monolith-Bereinigung.
- Keine Performanceinterpretation.

## Empfehlung

Aufgabe 011 sollte der Batch-2-Rollup sein. Ziel: prüfen, ob Batch 2 nach Dry-Run, Diff-Review und Normalisierung vollständig conflict-/gapfrei und future-migration-ready ist.
