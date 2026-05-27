---
activityId: act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 5e
proReferences:
  - PRO009
blockedBy:
  - legacy_umbrella_activity_status_reference_only
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"Personal Touch|Eurocorpse|onr_proteus_115|onr_proteus_139|phase-5e|5e Icebreaker\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"add_counter_to_all_installed_runner_icebreakers|change_breaker_strength|strength counter|Militech|counter.*icebreaker|hostedProgramCapacity|restrictedHostedCreditSource|usableFor.*icebreaker\" packages/engine/src/ability-engine packages/engine/src/index.ts packages/engine/src/card-implementations packages/engine/src/game -S"
  - "git diff --check"
---

# Proteus Phase 5e: Icebreaker Modifier/Support Hardware

## Ziel

Die sichtbaren Breaker-Support-Karten über generische installierte Modifier, Zielbindung und source-bound Credit-/Boost-Logik umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5e Icebreaker Modifier/Support Hardware`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Phase 5a Breaker-Projektion.

## Zielkarten

- `onr_proteus_115_personal-touch-the` Personal Touch, The
- `onr_proteus_139_eurocorpse-tm-spin-chip` Eurocorpse (TM) Spin Chip

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Installierte Modifier auf Breaker, source-bound Credits oder temporäre Boosts.
- Zielbindung an installierte Programme und StateHash-stabile Attach-/Modifierdaten.

## Nicht im Scope

- Keine neuen Icebreaker-Basismatcher aus Phase 5a.
- Keine Cybernetics-/Deck-Hardware aus Phase 7.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Zielbindung, Kosten und Modifier werden in LegalActions und `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Ziel-, Kosten-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

PRO009 ist umgesetzt; diese alte Phase-5e-Activity bleibt nur als Statusreferenz ohne zusätzliche Komplettzählung offen.

PRO009 hat `Personal Touch, The` mit einer LegalAction-gewählten einzelnen Icebreaker-Zielbindung und permanentem +1-Strength-Counter umgesetzt. `Eurocorpse (TM) Spin Chip` nutzt die generisch gehärtete Hosting-/Restricted-Hosted-Credit-Familie: Es hostet genau ein Icebreaker-Programm und die Bits dürfen nur für genau dieses gehostete Icebreaker-Programm während Runs zahlen. Keine PRO009-Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
