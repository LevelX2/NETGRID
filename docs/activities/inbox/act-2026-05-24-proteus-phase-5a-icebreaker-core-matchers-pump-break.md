---
activityId: act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 5a
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 5a: Icebreaker Core Matchers/Pump/Break

## Ziel

Die sichtbaren Proteus-Icebreaker als eigene CardImplementation-Dateien über deklarative Icebreaker-Profile, generische Matcher und bestehende Pump-/Break-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5a Icebreaker Core Matchers/Pump/Break`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/architecture/ability-engine/card-implementation-v1-pattern-catalog.md`.
- Bestehende Icebreaker-Implementierungen unter `packages/engine/src/card-implementations/`.

## Zielkarten

- `onr_proteus_079_big-frackin-gun` Big Frackin' Gun
- `onr_proteus_080_black-widow` Black Widow
- `onr_proteus_081_boring-bit` Boring Bit
- `onr_proteus_082_bulldozer` Bulldozer
- `onr_proteus_083_corrosion` Corrosion
- `onr_proteus_088_fubar` Fubar
- `onr_proteus_091_lockjaw` Lockjaw
- `onr_proteus_092_morphing-tool` Morphing Tool
- `onr_proteus_093_redecorator` Redecorator
- `onr_proteus_095_skeleton-passkeys` Skeleton Passkeys
- `onr_proteus_100_wrecking-ball` Wrecking Ball

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Bestehende `icebreakerAbilities`-, Pump- und Break-Muster wiederverwenden.
- Neue Subroutine-/Subtype-Matcher nur generisch und kartenunabhängig ergänzen.
- Effektive Stärke, Timing, Kosten, Ziele und Illegal-Pump-Guards in LegalAction-Projektion und `applyAction` revalidieren.

## Nicht im Scope

- Keine installierten Breaker-Support-Modifier aus Phase 5e.
- Keine Hidden Runner Resources.
- Keine AI-Hints, Decklegalität oder UI-Regelautorität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Alle Pump-/Break-Actions werden aus frischen LegalActions projiziert und in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel- und Strength-/Subtype-/Subroutine-Matcher-Tests sind vorhanden.
- [ ] Replay-/StateHash-Stabilität und Registry-/Coverage-/Manifest-Nachweis sind erbracht.

## Ergebnisnotiz

Noch offen.
