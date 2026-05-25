---
activityId: act-2026-05-24-proteus-phase-5-visible-runner-breaker-event-economy
status: superseded
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 5
blockedBy:
  - act-2026-05-24-proteus-phase-4-hidden-runner-resources
resultArtifacts:
  - docs/activities/inbox/act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-5b-runner-protection-programs.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-5d-visible-runner-run-events.md
  - docs/activities/inbox/act-2026-05-24-proteus-phase-5e-icebreaker-modifier-support-hardware.md
checks:
  - "Get-Content -LiteralPath 'docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md' | Select-Object -Skip 96 -First 36"
---

# Proteus Phase 5: Sichtbare Runner-Breaker, Events und Economy

## Ziel

Die sichtbaren Runner-Programme, Events, Economy-Karten und kleinen Ressourcen aus Phase 5 über vorhandene CardImplementation-Familien umsetzen. Neue Mechanik darf nur als kleine generische Erweiterung entstehen.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 5`, `Slice 5` und `Ability-Bedarf nach Phase`.
- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Abschnitt `Phase 5: Visible Runner Breaker, Event, Economy`; dieses Paket ist vor Codearbeit in die dort beschriebenen Slices 5a bis 5e zu zerlegen.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/architecture/ability-engine/card-implementation-v1-pattern-catalog.md`.
- V1.9.x-Completion-Artefakte zu Icebreakern, Hidden-Zone, Run/Access, Damage/Prevention und Trace/Tags.

## Zielkarten

- `onr_proteus_079_big-frackin-gun` Big Frackin' Gun
- `onr_proteus_080_black-widow` Black Widow
- `onr_proteus_081_boring-bit` Boring Bit
- `onr_proteus_082_bulldozer` Bulldozer
- `onr_proteus_083_corrosion` Corrosion
- `onr_proteus_086_enterprise-inc-shields` Enterprise, Inc., Shields
- `onr_proteus_088_fubar` Fubar
- `onr_proteus_091_lockjaw` Lockjaw
- `onr_proteus_092_morphing-tool` Morphing Tool
- `onr_proteus_093_redecorator` Redecorator
- `onr_proteus_095_skeleton-passkeys` Skeleton Passkeys
- `onr_proteus_096_skullcap` Skullcap
- `onr_proteus_100_wrecking-ball` Wrecking Ball
- `onr_proteus_101_all-hands` All-Hands
- `onr_proteus_103_cruising-for-netwatch` Cruising for Netwatch
- `onr_proteus_104_decoy-signal` Decoy Signal
- `onr_proteus_105_demolition-run` Demolition Run
- `onr_proteus_106_disgruntled-ice-technician` Disgruntled Ice Technician
- `onr_proteus_107_drone-for-a-day` Drone for a Day
- `onr_proteus_114_on-the-fast-track` On the Fast Track
- `onr_proteus_115_personal-touch-the` Personal Touch, The
- `onr_proteus_118_prearranged-drop` Prearranged Drop
- `onr_proteus_120_reconnaissance` Reconnaissance
- `onr_proteus_121_remote-detonator` Remote Detonator
- `onr_proteus_122_rush-hour` Rush Hour
- `onr_proteus_124_stakeout` Stakeout
- `onr_proteus_127_weefle-initiation` Weefle Initiation
- `onr_proteus_130_back-door-to-rivals` Back Door to Rivals
- `onr_proteus_139_eurocorpse-tm-spin-chip` Eurocorpse (TM) Spin Chip
- `onr_proteus_148_runner-sensei` Runner Sensei

## Scope

- Pro Zielkarte eigene CardImplementation-Datei.
- Bestehende Familien zuerst: `icebreakerAbilities`, `on_play`, `activated`, `make_run`, `trace`, Damage-/Tag-/Trash-/Prevention-Familien, Hidden-Zone-Effekte ohne Hidden Resource.
- Neue Breaker-Matcher, Run-Event-Followups oder installierte Modifier nur generisch und eng geschnitten ergänzen.
- Fokussierte Tests für Pump/Break, Kostenquellen, MU, Run-Events, Hidden-Zone-Schutz und Replay/StateHash.

## Nicht im Scope

- Keine Virusprogramme.
- Keine Hidden Runner Resources.
- Keine Random-Effekte.
- Keine Bad-Publicity-Sonderkarten.
- Keine Proteus-AI-Hints oder Deckgesamtfreigabe.

## Akzeptanzkriterien

- [ ] Alle Zielkarten haben eigene CardImplementation-Dateien und Manifest-/Coverage-Nachweis.
- [ ] Breaker-Actions revalidieren Stärke, Subroutinen, Kosten, Ziele und Timing in `applyAction`.
- [ ] Events mit Hidden-Zone-Bezug leaken keine Stack-/Grip-/HQ-/R&D-Informationen.
- [ ] Neue Helfer sind generisch und nicht an einzelne Proteus-IDs gebunden.
- [ ] Phase-8-/Phase-9-Mechaniken werden nicht versehentlich mitpromotet.

## Umsetzungshinweise

- `Decoy Signal` kann Smarteye-/Expose-nahe Muster wiederverwenden; keine separate UI-Regelentscheidung einbauen.
- Bei Breakern vor allem Matcher und Cost-Source-Logik gegen vorhandene V1.9.x-Icebreaker-Familien abgleichen.

## Ergebnisnotiz

Am 2026-05-24 in die Detail-Activities 5a bis 5e aus `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md` zerlegt. Dieses Umbrella-Paket wird nicht direkt implementiert.
