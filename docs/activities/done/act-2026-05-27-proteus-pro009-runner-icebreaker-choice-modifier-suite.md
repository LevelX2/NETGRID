---
activityId: act-2026-05-27-proteus-pro009-runner-icebreaker-choice-modifier-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO009
proReferences:
  - PRO009
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/black-widow.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/fubar.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/morphing-tool.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/bulldozer.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/lockjaw.ts
  - packages/engine/src/card-implementations/proteus/runner/events/personal-touch-the.ts
  - packages/engine/src/card-implementations/proteus/runner/hardware/eurocorpse-tm-spin-chip.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/card-implementations/coverage.test.ts
  - packages/engine/src/index.test.ts
  - data/manifests/proteus-card-support.json
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO009\""
  - "corepack pnpm --filter @netgrid/engine typecheck"
---

# Proteus PRO009: Runner Icebreaker Choice/Modifier Suite

## Ergebnis

PRO009 ist vollständig umgesetzt. Es wurde je eine CardImplementation-Datei für diese 7 Runner-Karten angelegt:

- `onr_proteus_080_black-widow` / Black Widow
- `onr_proteus_088_fubar` / Fubar
- `onr_proteus_092_morphing-tool` / Morphing Tool
- `onr_proteus_082_bulldozer` / Bulldozer
- `onr_proteus_091_lockjaw` / Lockjaw
- `onr_proteus_115_personal-touch-the` / Personal Touch, The
- `onr_proteus_139_eurocorpse-tm-spin-chip` / Eurocorpse (TM) Spin Chip

## Ergänzte generische Bausteine

- Source-bound Install-Choice-State für ein installiertes ICE-Ziel und für initiale Icebreaker-Subtype-Wahlen; `Fubar` nutzt nach PRO009-1 stattdessen eine einmalige Encounter-Subtype-Wahl.
- Selected-subtype Breaker-Matcher mit Revalidierung in LegalActions und `applyAction`.
- Source-bound Encounter-Strength-Modifikator für genau das gewählte Black-Widow-ICE.
- Rungebundener Bulldozer-Followup-Flag für den nächsten Sentry-Break, nach PRO009-1 exakt an die nächste ICE-Begegnung gebunden.
- Rungebundener Lockjaw-Strength-Boost für genau einen eigenen installierten Icebreaker, nach PRO009-1 mit generischem Tap-/Runner-Zugbeginn-Untap-State.
- Gezielter permanenter Icebreaker-Strength-Counter für `Personal Touch, The`.
- Gehostete Programmbeschränkung für ein Icebreaker-Programm und hostgebundene Restricted-Hosted-Credit-Zahlung für `Eurocorpse (TM) Spin Chip`.

## Harness-Zahlen

- Vorher: 154 Proteus-Karten, 80 implementiert, 74 fehlend, 0 Drift-/Konsistenzfehler.
- Nachher: 154 Proteus-Karten, 87 implementiert, 67 fehlend, 0 Drift-/Konsistenzfehler.

Keine PRO009-Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
