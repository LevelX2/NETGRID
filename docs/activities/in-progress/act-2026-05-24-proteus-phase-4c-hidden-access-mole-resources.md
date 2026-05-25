---
activityId: act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources
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
releaseTarget: Proteus Phase 4c
blockedBy:
  - missing-hidden-resource-access-start-intervention-window
  - slice-scope-mismatch-simulacrum-encounter-ap-ice
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources.md
  - docs/releases/proteus/README.md
checks:
  - rg -n "HQ Mole|R&D Mole|Simulacrum" data/cards/proteus-cards.json docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
---

# Proteus Phase 4c: Hidden Access and Mole Resources

## Ziel

Die verdeckten Access-Modifier und Mole-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4c Hidden Access/Mole Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_142_hq-mole` HQ Mole
- `onr_proteus_147_r-and-d-mole` R&D Mole
- `onr_proteus_149_simulacrum` Simulacrum

## Scope

- Access-Modifikatoren, zusätzliche oder ersetzte Access-Informationen und zentrale Server-Redaction generisch modellieren.
- Runner-private Aktivierungen in Access-Fenstern mit `applyAction`-Revalidierung absichern.
- Öffentliche Ergebnisse so formulieren, dass vor Reveal keine verdeckte Source-Identität sichtbar wird.

## Nicht im Scope

- Keine Economy-/Bank-, Prevention- oder Sabotage-Familien.
- Keine UI-Regelautorität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Access-Modifikatoren werden aus generischen Hidden-Resource-Bausteinen abgeleitet.
- [ ] Zentrale Server- und Karteninformationen bleiben für die Korp nur im erlaubten Umfang sichtbar.
- [ ] Wrong-Side-, stale-action-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Blockiert am 2026-05-24.

`HQ Mole` und `R&D Mole` können nicht über die vorhandene öffentliche `access_count`-Modifier-Familie umgesetzt werden. Diese Modifier sind passiv, öffentlich und wirken, solange die Quelle installiert ist. Für verdeckte Runner-Resources wäre das falsch: Die zusätzliche Access-Queue darf erst nach einer Runner-privaten Aktivierung im passenden Access-Start-Fenster entstehen, nachdem die Quelle validiert, bezahlt, revealed und getrasht wurde.

Benötigter generischer Vorlauf:

- Runner-private Hidden-Resource-Intervention unmittelbar vor `buildBreachState`/Access-Queue-Aufbau für HQ oder R&D.
- LegalAction-Projektion nur für den Runner, inklusive `stateVersion`, angegriffenem Server, Source-Slot, Kosten `[4]`, Timing und servergebundenem Ziel (`hq` oder `rd`).
- `applyAction`-Revalidierung gegen aktuellen Run, Server, noch installierte verdeckte Quelle, Kosten, Choice und Source-Definition.
- Atomare Reveal-and-trash-Auflösung vor Queue-Erweiterung.
- PublicPayload mit `hiddenResourceSlotId`, `hiddenRunnerResourceRevealed`, `publicRevealDefinitionId`, finaler Access-Anzahl und ohne vorzeitige HQ-/R&D-Karteninformationen.
- Reconnect-/Replay-/StateHash-Tests, die künftige HQ-/R&D-Queue-Einträge nicht vor dem jeweiligen Access zeigen.

`Simulacrum` passt fachlich nicht in diesen Access-Mole-Slice. Der lokale Text lautet: "[T]: Pass a piece of AP ice. You may use this ability during an encounter with a piece of ice." Das braucht ein Encounter-Intervention-Fenster für AP-ICE-Pass/Bypass, nicht ein Access-Start-Fenster.

Entblockung:

- Zuerst eine generische Hidden-Resource-Access-Start-Intervention für zentrale Server schneiden.
- `Simulacrum` in einen Encounter-/AP-ICE-Hidden-Resource-Slice verschieben oder separat planen.
- Danach `HQ Mole` und `R&D Mole` mit eigenen CardImplementation-Dateien promoten und die Access-Queue-Redaction gezielt testen.
