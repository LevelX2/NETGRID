---
activityId: act-2026-05-17-startup-emulator-post-break-trash-action
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17T18:52:00+02:00
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --dir apps/web exec vitest run app/action-board-ui.test.ts -t "mirrors Startup Immolator"
  - corepack pnpm --dir apps/web exec vitest run app/chronicle.test.ts -t "Startup Immolator"
  - corepack pnpm --dir packages/engine exec vitest run src/index.test.ts -t "Startup Immolator"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Startup Emulator: Opferaktion nach gebrochener Subroutine anbieten

## Ziel

`Startup Emulator` muss nach dem Brechen aller relevanten Subroutinen eines ICE eine sichtbare Aktion anbieten, um die Karte zu opfern und das ICE zu trashen, sofern der Kartentext dies erlaubt.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach dem Brechen der einzigen Subroutine eines ICE erschien keine erkennbare Startup-Emulator-Aktion.

## Scope

- Trigger-Implementierung und Timing-Fenster prüfen.
- Erkennung `alle Subroutinen des encountered ICE gebrochen` validieren.
- Zielbindung zum encountered ICE über Encounter-/Run-Ende hinweg prüfen.
- UI-Aktion und Chronik für Opferung und ICE-Trash ergänzen.

## Nicht im Scope

- Keine generelle Runner-Hardware-/Resource-Opferarchitektur, außer der Trigger nutzt sie.
- Keine Änderung an ICE-Breaking-Regeln außerhalb des Zielnachweises.

## Akzeptanzkriterien

- [x] Bei erfüllten Voraussetzungen erscheint `Startup Emulator opfern: ICE trashen` oder ein äquivalentes klares Label.
- [x] Die Aktion ist nur im korrekten Timing-Fenster legal.
- [x] `applyAction` revalidiert Quelle, Kosten/Opferung, Ziel-ICE und StateVersion.
- [x] Startup Emulator und Ziel-ICE werden regelgerecht bewegt.
- [x] Chronik dokumentiert Quelle, Opferung, Ziel und Kartenbewegungen.

## Umsetzungshinweise

- Falls der Kartentext Timing nach Encounter oder nach Run verlangt, Zielreferenz entsprechend haltbar und side-sicher modellieren.

## Ergebnisnotiz

Erledigt. Die bestehende Engine-Regel bleibt unverändert: `Startup Immolator` wird nach dem Passieren eines vollständig gebrochenen ICE im `run.jack_out_window` angeboten, `applyAction` revalidiert Quelle, Timing, Ziel-ICE, Rez-Kosten und StateVersion über die LegalAction-Bindung. Der Webclient spiegelt diese Run-gebundene `trigger_ability` jetzt sichtbar im Run-Fenster; die Chronik beschreibt Quelle, Erschöpfung, Ziel-ICE-Trash, Archivbewegung und gezahlte Rez-Kosten. Kein allgemeiner Opfer-/Sacrifice-Mechanismus und keine ICE-Breaking-Regeln wurden erweitert.
