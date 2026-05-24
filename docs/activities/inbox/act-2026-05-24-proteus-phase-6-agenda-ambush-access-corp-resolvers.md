---
activityId: act-2026-05-24-proteus-phase-6-agenda-ambush-access-corp-resolvers
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 6
blockedBy:
  - act-2026-05-24-proteus-phase-5-visible-runner-breaker-event-economy
resultArtifacts: []
checks: []
---

# Proteus Phase 6: Agenda, Ambush, Access und Korp-Resolver

## Ziel

Die Agenda-, Ambush-, Access- und öffentlichen Korp-Resolver aus Phase 6 umsetzen, nachdem die sichtbaren Basisslices stabil sind. Access-Origin, Damage/Tag/Trace und Agenda-Punkt-/Overadvance-Familien müssen engine-autoritativ bleiben.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 6`, `Slice 6` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Abschnitt `Phase 6: Agenda, Ambush, Access, Public Corp Resolvers`; dieses Paket ist vor Codearbeit in die dort beschriebenen Slices 6a bis 6e zu zerlegen.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Ability-Engine-Muster zu `scoredAgenda`, `accessEffects`, `accessHooks`, `modifiers`, `corpUtility` und `printedSubroutines`.
- V1.9.x-Artefakte zu Run/Access/Multiaccess, Agenda Scoring, Asset/Node und Upgrade/Root/Server.

## Zielkarten

- `onr_proteus_003_corporate-headhunters` Corporate Headhunters
- `onr_proteus_004_fetal-ai` Fetal AI
- `onr_proteus_005_marked-accounts` Marked Accounts
- `onr_proteus_008_project-zurich` Project Zurich
- `onr_proteus_010_world-domination` World Domination
- `onr_proteus_011_brain-wash` Brain Wash
- `onr_proteus_014_chihuahua` Chihuahua
- `onr_proteus_015_colonel-failure` Colonel Failure
- `onr_proteus_016_coyote` Coyote
- `onr_proteus_027_iceberg` Iceberg
- `onr_proteus_032_misleading-access-menus` Misleading Access Menus
- `onr_proteus_038_snowbank` Snowbank
- `onr_proteus_045_washed-up-solo-construct` Washed-Up Solo Construct
- `onr_proteus_047_credit-consolidation` Credit Consolidation
- `onr_proteus_048_data-sifters` Data Sifters
- `onr_proteus_050_manhunt` Manhunt
- `onr_proteus_052_schlaghund-pointers` Schlaghund Pointers
- `onr_proteus_053_underworld-mole` Underworld Mole
- `onr_proteus_055_cybertech-think-tank` Cybertech Think Tank
- `onr_proteus_056_department-of-misinformation` Department of Misinformation
- `onr_proteus_059_government-contract` Government Contract
- `onr_proteus_061_ldl-traffic-analyzers` LDL Traffic Analyzers
- `onr_proteus_067_panic-button` Panic Button
- `onr_proteus_071_raymond-ellison` Raymond Ellison
- `onr_proteus_074_siren` Siren
- `onr_proteus_076_syd-meyer-superstores` Syd Meyer Superstores
- `onr_proteus_102_blackmail` Blackmail
- `onr_proteus_116_pirate-broadcast` Pirate Broadcast
- `onr_proteus_119_promises-promises` Promises, Promises

## Scope

- Pro Zielkarte eigene CardImplementation-Datei.
- Wiederverwendung von `scoredAgenda`, `accessEffects`, `accessHooks`, `steal_cost`, `trash_cost`, `agenda_difficulty`, `corpUtility` und `printedSubroutines` prüfen.
- Generische Overadvance-/Agenda-Point- und Access-Origin-Helfer ergänzen, wenn bestehende Familien nicht reichen.
- Fokussierte Ambush-/Access-Tests für aktuelle Access-Karte, Origin-Zone, Queue-Sicherheit und PublicPayload.

## Nicht im Scope

- Keine Virus-/Antibody-Karten aus Phase 8.
- Keine Random-/Action-Economy-Longtail-Karten aus Phase 9.
- Keine Hidden Runner Resources.
- Keine KI-Strategie- oder Decklegalitätsfreigabe.

## Akzeptanzkriterien

- [ ] Alle Zielkarten haben per-card Implementations und Manifest-/Coverage-Nachweis.
- [ ] Access- und Ambush-Effekte offenbaren nur die aktuell legal bekannte Karte und keine künftigen HQ-/R&D-Queue-Einträge.
- [ ] Agenda-Punkt- und Overadvance-Logik ist StateHash-stabil und nicht in UI/Catalog ausgelagert.
- [ ] Damage, Tag und Trace revalidieren Kosten, Ziele und Choices.
- [ ] Keine neuen Proteus-ID-Branches im Runtime-Code.

## Umsetzungshinweise

- Fetal-AI-/Marked-Accounts-artige Access-Effekte sollten über generische Access-Effect-Steps laufen.
- Project-Zurich-/World-Domination-artige Agenda-Effekte nicht als Einzelkartenbranch modellieren, wenn ein allgemeiner Agenda-Point-/Overadvance-Helfer reicht.

## Ergebnisnotiz

Noch offen.
