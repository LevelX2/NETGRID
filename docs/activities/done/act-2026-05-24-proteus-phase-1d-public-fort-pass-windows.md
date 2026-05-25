---
activityId: act-2026-05-24-proteus-phase-1d-public-fort-pass-windows
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 1d
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/upgrades/lesley-major.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/rasmin-bridger.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - data/scenarios/proteus-phase-1d-public-fort-pass-windows-smoke-2026-05-24.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 1d"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 1d"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Public Fort Pass Windows"
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Proteus Phase 1d: Public Fort Pass Windows

## Ziel

Die öffentlichen Fort-Pass-Interaktionen von `Lesley Major` und `Rasmin Bridger` als kleine generische Run-Window-Familie schneiden.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarten

- `onr_proteus_062_lesley-major` Lesley Major
- `onr_proteus_070_rasmin-bridger` Rasmin Bridger

## Benötigte Funktionsbausteine

- Install-Capability `install_only_inside_subsidiary_data_fort` für `Lesley Major`.
- Fort-bound source scoping:
  - Die Quelle wirkt nur auf das Fort, in dem sie installiert ist.
  - Quelle muss aktiv, gerezzed und im passenden Root liegen.
- Pass-ICE timing windows:
  - `Lesley Major`: Korp-Fenster, nachdem Runner das letzte ICE dieses Forts passiert hat.
  - `Rasmin Bridger`: Runner-Entscheidung nach jedem passierten ICE dieses Forts.
- Target binding für `Lesley Major`:
  - Ziel ist eine installierte Karte in diesem Fort, die Advancement Counter erhalten darf.
  - Kosten `[5]`, Wirkung zwei Advancement Counter, Limit einmal pro Run.
- Forced pay-or-end-run für `Rasmin Bridger`:
  - Runner zahlt `[1]` oder der Run endet.
  - Bei ungenügenden Credits muss der End-run-Pfad deterministisch sein.
- PublicEvents und LegalActions mit öffentlichen Fort-/ICE-Positionslabels, ohne verdeckte Kartennamen.

## Nicht im Scope

- Keine Fort-Reorder- oder HQ/R&D-Kartenbewegung.
- Keine Access-Count-Änderung.
- Keine Hidden-Info-Choices.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] Beide Zielkarten haben per-card CardImplementation-Dateien.
- [x] Pass-Fenster erscheinen nur im korrekten Run-Kontext und am korrekten Fort.
- [x] Kosten, Ziel und once-per-run-Limit werden in `applyAction` revalidiert.
- [x] PublicEvents leaken keine unrezzed Kartenidentitäten.
- [x] Replay/StateHash deckt die Pass-Fenster ab.

## Umsetzungshinweise

- Falls die bestehende `fortRunWindows`-Familie erweitert wird, die neuen Kinds generisch nach Timing und Wirkung benennen, nicht nach Proteus-Karten.
- Die beiden Karten nicht mit Hidden-Fort-Manipulation bündeln.

## Ergebnisnotiz

Abgeschlossen. `Lesley Major` und `Rasmin Bridger` sind über eigene CardImplementation-Dateien, Registry-/Coverage-Einträge, Manifest-Promotion und ein Smoke-Szenario umgesetzt. Die Engine ergänzt eine generische öffentliche Fort-Pass-Window-Familie: Korp-Fort-Pass-Fenster nach dem letzten ICE dieses Forts können Advancement-Counter auf same-fort Ziele legen, Runner-Folgefenster nach passiertem ICE erzwingen deterministisch Pay-or-End-run. LegalAction-Projektion und `applyAction` revalidieren Seite, `stateVersion`, Fort-/ICE-Kontext, Quelle, Kosten, Ziel und once-per-run-Gedächtnis. PlayerView/PublicEvent-Payloads verwenden öffentliche Source-/Target- und Betragsfelder ohne unrezzed Kartenidentitäten; Replay und StateHash sind durch fokussierte Engine-Tests abgedeckt. Die Karten sind `human_playable`, bleiben aber nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`.
