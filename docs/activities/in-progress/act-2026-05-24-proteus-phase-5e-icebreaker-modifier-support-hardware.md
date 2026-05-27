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
  - act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break
  - Personal Touch needs a generic targeted permanent +1 strength counter for one installed icebreaker; the current Militech effect only adds Militech counters to all installed runner icebreakers.
  - Eurocorpse (TM) Spin Chip needs a hosted-program payment restriction for exactly the icebreaker installed in the chip; current restricted hosted credit sources can pay for any matching icebreaker during a run and do not revalidate the host-to-breaker binding.
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

Blockiert. Der Slice haengt nicht nur fachlich an der Phase-5a-Icebreaker-Familie, sondern benoetigt auch zwei generische Modifier-/Zahlungsbausteine:

- `Personal Touch, The` kann nicht mit dem vorhandenen `add_counter_to_all_installed_runner_icebreakers` umgesetzt werden. Der vorhandene Baustein ist explizit auf Militech-Counter fuer alle installierten Icebreaker beschraenkt; benoetigt wird eine LegalAction-gewaehlte einzelne Icebreaker-Zielbindung mit permanentem +1-Strength-Counter und erneuter Zielrevalidierung in `applyAction`.
- `Eurocorpse (TM) Spin Chip` kann die vorhandene `hostedProgramCapacity` teilweise wiederverwenden, aber die vorhandene `restrictedHostedCreditSource`-Familie erlaubt nur globale Uses wie `using_icebreaker_during_run`. Sie prueft nicht, ob der bezahlte Icebreaker tatsaechlich in genau diesem Hardware-Host installiert ist.
- Eine Promotion mit der bestehenden Credit-Familie waere zu breit und damit regelwidrig; keine CardImplementation wurde fuer 5e angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
