---
activityId: act-2026-05-17-corporate-negotiating-center-runner-reveal
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/action-cues.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Corporate Negotiating Center" --passWithNoTests
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts --passWithNoTests
  - git diff --check
---

# Corporate Negotiating Center: Agenda-Reveal für Runner und Chronik

## Ziel

`Corporate Negotiating Center` muss den Start-of-Turn-Reveal so projizieren, dass der Runner die gezeigten Agendas sieht und die Chronik den öffentlichen Reveal nachvollziehbar festhält.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Corporation-Agendas werden offenbar nur corp-seitig angezeigt; Runner sieht sie nicht und die Chronik enthält keinen Reveal.
- Lokaler Kartenanker: `onr_v1_314_corporate-negotiating-center`.

## Scope

- Start-of-Turn-Trigger und Reveal-Payload prüfen.
- Broadcast an beide Spieler sicherstellen, sofern der Karteneffekt ein Vorzeigen verlangt.
- Eventdauer für die Anzeige respektieren.
- Chronik mit Quelle, gezeigten Agendas, Timing und Sichtbarkeit ergänzen.

## Nicht im Scope

- Kein Leaken nicht gezeigter HQ-Karten.
- Keine Änderung an der Auswahl-/Suchlogik, außer sie verursacht den Reveal-Fehler.

## Akzeptanzkriterien

- [ ] Der Start-of-Turn-Effekt löst zuverlässig aus.
- [ ] Der Runner sieht die gezeigten Agendas für die normale Anzeigezeit oder bis zur Bestätigung.
- [ ] Die Chronik nennt Quelle, Timing und gezeigte Karten side-sicher.
- [ ] Reconnect/Replay enthalten nur die rechtmäßig gezeigten Informationen.
- [ ] Regression deckt Corp- und Runner-Sicht ab.

## Umsetzungshinweise

- Automatische Trigger-Reveals mit manuellen Reveal-Pfaden vergleichen.

## Ergebnisnotiz

Corporate Negotiating Center schreibt den öffentlichen HQ-Agenda-Reveal jetzt mit Source, Kartentiteln und Reveal-IDs in den PublicPayload. Runner- und Corp-Sicht erhalten nur die gezeigten Agenda-Definitionen; nicht gezeigte HQ-Karten bleiben verborgen. Chronik, Cue-Highlight und Katalog-Nachladung werten den Reveal side-sicher aus.
