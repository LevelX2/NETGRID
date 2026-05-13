# V1.9.22 Requirements

Stand: 2026-05-13
Status: planned

## Must

- V1922-MUST-001: Genau 47 V1.9.22-Zielkarten werden geplant; keine Karte ausserhalb des Slices wird promotet.
- V1922-MUST-002: Jede freigegebene Karte hat einen konkreten Resolver-/Ability-Nachweis oder einen dokumentierten Blocker mit Removal Condition.
- V1922-MUST-003: PlayerActions entstehen nur aus LegalActions; `applyAction` revalidiert Side, actionId, stateVersion, Timing, Kosten, Ziele und Choices.
- V1922-MUST-004: Visibility, PublicEvents, PlayerViews, Reconnect, Undo, Replay und StateHash bleiben side-sicher.
- V1922-MUST-005: `human_playable`, `deck_legal` und `ai_supported` werden nur bei Engine-, Daten-, KI- und Testabdeckung gesetzt.
- V1922-MUST-006: Originalset-Completion wird erst nach Final Review und gruenen Pflichtchecks als Gate-Ergebnis markiert.

## Erste Akzeptanz fuer WIP-Start

- Catalog-WIP-Guard: 47/47 Zielkarten in `ONR_V1_9_22_WIP_CARD_IDS`.
- No-Promotion: keine V1.9.22-Zielkarte in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval-Listen.
- Planungsartefakte: Detailplan, Requirements, Spec, Testmatrix, Requirements Review und Implementation Review existieren.
