---
activityId: act-2026-05-24-proteus-phase-3d-pass-trigger-uninstall-trash-ice
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
releaseTarget: Proteus Phase 3d
proReferences:
  - PRO010
blockedBy:
  - missing-generic-corp-post-pass-ice-window-contract
resultArtifacts: []
checks: []
---

# Proteus Phase 3d: Pass-Trigger/Uninstall/Trash ICE

## Zielkarten

- `onr_proteus_018_datacomb` Datacomb
- `onr_proteus_019_death-yo-yo` Death Yo-Yo
- `onr_proteus_029_marionette` Marionette
- `onr_proteus_037_scaffolding` Scaffolding
- `onr_proteus_042_tumblers` Tumblers
- `onr_proteus_043_twisty-passages` Twisty Passages

## Scope

- Pass-Trigger-Fenster, HQ-Rückführung, Uninstall-/Trash-/Sabotage-Effekte.
- Öffentliche Server-/ICE-Positionslabels ohne Hidden-Info-Leak.

## Nicht im Scope

- Keine ICE-Repositionierung außerhalb der Zielkarten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Pass-/Uninstall-/Trash-Fenster werden über LegalActions/Choices revalidiert.
- [ ] Replay und StateHash bleiben stabil.

## Ergebnisnotiz

Blockiert.

Phase 3d braucht einen generischen Korp-seitigen Post-Pass-ICE-Timingvertrag für die gerade passierte ICE-Instanz:

- Pflicht-/Optional-Fenster für die Korp nach dem Passieren einzelner ICE, bevor der Run weiterläuft.
- Frische LegalAction-Projektion und `applyAction`-Revalidierung für `passedIceId`, Server/Position, StateVersion, Kosten, Rezzed-/Installed-Zustand und Run-Fortsetzung.
- Generische HQ-Rückführung installierter Korp-ICE inklusive Zone-/Serverlisten-Update, Redaction und StateHash-stabilem PublicPayload.
- Einheitliche Semantik für Pflichtzahlung oder HQ-Rückführung (`Datacomb`, `Marionette`, `Twisty Passages`) gegenüber optionaler HQ-Rückführung mit Credit-Gain (`Death Yo-Yo`, `Scaffolding`, `Tumblers`).
- Public Server-/ICE-Positionslabels ohne unrezzed ICE-Identitätsleak.

Der vorhandene Post-Pass-Unterbau deckt Runner-seitige Fenster (`postPassPayOrEndRun`, Disintegrator/Startup-Immolator) und Fort-Upgrades ab, aber keinen CardImplementation-deklarativen Korp-Post-Pass-Choice für die passierte ICE selbst. Eine Umsetzung ohne diesen Vertrag würde neue Spezialfälle im Run-Movement-Pfad erzwingen und die Slice-Akzeptanzkriterien für LegalAction-/Choice-Revalidierung und Replay nicht belastbar erfüllen.
