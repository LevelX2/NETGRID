---
activityId: act-2026-05-24-proteus-phase-4-hidden-runner-resources
status: done
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 4
blockedBy:
  - act-2026-05-24-proteus-phase-3-variable-complex-ice
resultArtifacts:
  - docs/activities/inbox/act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty.md
checks:
  - rg -n "Phase 4: Hidden Runner Resources|4a Hidden Resource Activation Foundation|4e Hidden Trash/Sabotage/Cost Penalty" docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md docs/activities
  - git diff --check
---

# Proteus Phase 4: Hidden Runner Resources

## Ziel

Die 16 Proteus-Hidden-Runner-Resources auf der vorhandenen Hidden-Resource-Foundation in eigenen CardImplementation-Dateien umsetzen. Gemeinsame Aktivierungs- und Reveal-/Trash-Kostenfamilien müssen generisch in der Engine liegen.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 4`, `Slice 4` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Abschnitt `Phase 4: Hidden Runner Resources`; dieses Paket ist vor Codearbeit in die dort beschriebenen Slices 4a bis 4e zu zerlegen.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/activities/done/act-2026-05-17-proteus-hidden-resources-contract.md`.
- `docs/activities/done/act-2026-05-17-proteus-hidden-resource-foundation-slice.md`.

## Zielkarten

- `onr_proteus_128_airport-locker` Airport Locker
- `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch
- `onr_proteus_132_bolt-hole` Bolt-Hole
- `onr_proteus_133_chiba-bank-account` Chiba Bank Account
- `onr_proteus_136_credit-subversion` Credit Subversion
- `onr_proteus_137_death-from-above` Death from Above
- `onr_proteus_140_expendable-family-member` Expendable Family Member
- `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble
- `onr_proteus_142_hq-mole` HQ Mole
- `onr_proteus_143_liberated-savings-account` Liberated Savings Account
- `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract
- `onr_proteus_147_r-and-d-mole` R&D Mole
- `onr_proteus_149_simulacrum` Simulacrum
- `onr_proteus_152_swiss-bank-account` Swiss Bank Account
- `onr_proteus_153_time-to-collect` Time to Collect
- `onr_proteus_154_wired-switchboard` Wired Switchboard

## Scope

- Generische Hidden-Resource-Aktivierungsfamilien mit Reveal-and-trash-Kosten schaffen.
- Timingfenster getrennt modellieren: Encounter, Trace, Damage, Tag-Avoid, Access, Kosten-/Penalty-Zahlung, Resource-Trash-Prevention.
- Pro Zielkarte eigene CardImplementation-Datei.
- Korp-View, Korp-AIInput, Reconnect, Undo-Preview, PublicEvents und Logs gegen Hidden-Info-Leaks prüfen.

## Nicht im Scope

- Keine Erweiterung von Hidden-Resource-Foundation ohne konkrete Zielkartenbedarfe.
- Keine Offenlegung von Titeln, DefinitionIds, Kosten, Subtypen oder echten Instance-IDs vor Reveal.
- Keine Proteus-Decklegalität und keine AI-Hints.
- Keine Hidden-Info-Entscheidungen in UI, Catalog oder KI.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei und nutzt generische Hidden-Resource-Familien.
- [ ] Aktivierungen revealen die Quelle erst innerhalb der validierten LegalAction und trashen/kosten sie atomar nach Vertrag.
- [ ] Korp-Targeting verdeckter Slots bleibt redigiert und wird in `applyAction` autoritativ revalidiert.
- [ ] Leak-Scans oder fokussierte Tests decken PlayerViews, PublicEvents, Reconnect, Undo-Preview, Logs und AIInput ab.
- [ ] Nicht gewählte oder nicht aktivierte Hidden Resources bleiben vollständig verborgen.

## Umsetzungshinweise

- Die Foundation ist erledigt; dieses Paket darf nicht erneut nur den verdeckten Slotzustand beweisen, sondern muss kartenindividuelle Aktivierungsfamilien schneiden.
- Ähnliche Karten wie HQ Mole/R&D Mole oder Swiss/Chiba Bank Account sollen gemeinsame Resolver verwenden.

## Ergebnisnotiz

Erledigt am 2026-05-24 als Planungsschnitt. Das Umbrella-Paket wurde vor Codearbeit gemäß `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md` in die Detail-Activities 4a bis 4e zerlegt.

Die Umsetzung beginnt mit `act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation`; 4b bis 4e bleiben abhängig von 4a.
