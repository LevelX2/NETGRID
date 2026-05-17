---
activityId: act-2026-05-17-hq-access-reveal-lifetime
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts --passWithNoTests
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "keeps HQ access card identities visible in Corp payloads" --passWithNoTests
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "redacts R&D access card identities from Corp payloads" --passWithNoTests
  - git diff --check
---

# HQ-Access: aufgedeckte Handkarte bleibt sichtbar

## Ziel

Eine beim HQ-Zugriff gesehene Handkarte darf nicht sofort verschwinden, sondern muss die konfigurierte Anzeigezeit oder ein manuelles Bestätigungsfenster respektieren.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: HQ-Handkarte blitzt nur kurz auf und ist danach nur noch in der Chronik sichtbar.
- Betroffener Kernworkflow: Run/Breach/Access auf HQ.

## Scope

- HQ-Access-Reveal-Pfad gegen R&D-, Archives- und Remote-Access vergleichen.
- Prüfen, ob Access-State, Run-Ende oder Chronik-Logging das Reveal-Overlay zu früh schließt.
- Reveal als eigenes sichtbares UI-/PublicEvent mit definierter Lebensdauer behandeln, falls nötig.

## Nicht im Scope

- Keine Änderung an HQ-Randomisierung oder Multiaccess-Reihenfolge; dafür gibt es separate Pakete.
- Kein Leaken anderer HQ-Handkarten.

## Akzeptanzkriterien

- [x] Die aufgedeckte HQ-Karte bleibt für die konfigurierte Eventdauer sichtbar oder ist manuell bestätigbar.
- [x] Run-Ende, Access-Cleanup und Chronik schließen das Overlay nicht vorzeitig.
- [x] Reconnect/Multiplayer zeigen keine unzulässigen zusätzlichen HQ-Informationen.
- [x] Tests oder E2E-Smoke decken den HQ-Handkartenzugriff ab.

## Umsetzungshinweise

- Hidden-Info-Grenze besonders prüfen: Nur die tatsächlich accessierte Karte darf sichtbar werden.
- Eventdauer an bestehendem Reveal-/Cue-System ausrichten.

## Ergebnisnotiz

Erledigt: Das Zugriff-Reveal wird im Webclient nicht mehr nur aus dem neuesten Event abgeleitet, sondern aus dem neuesten noch nicht bestätigten sichtbaren `access_card`-Event im Event-Tail. Dadurch bleibt die tatsächlich accessierte HQ-Karte manuell bestätigbar sichtbar, auch wenn danach Run-Cleanup, Run-Ende oder Chronik-Events eintreffen. Redigierte zentrale Zugriffe ohne `cardDefinitionId`/`title` erzeugen kein persistiertes Reveal, sodass Reconnect/Multiplayer keine zusätzlichen HQ- oder R&D-Informationen erhalten.

Verifikation: fokussierter Web-Helfertest, Web-Typecheck, bestehende Multiplayer-Spotchecks für HQ-sichtbar/R&D-redigiert und `git diff --check` bestanden.
