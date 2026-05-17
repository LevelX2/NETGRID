---
activityId: act-2026-05-17-undo-request-clears-after-response
status: done
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/api-contracts.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
---

# Rücknahme-Anfrage nach Zustimmung oder Ablehnung bereinigen

## Ziel

Eine angefragte Rücknahme darf nach Zustimmung, Ablehnung, Ungültigkeit oder Ablauf nicht dauerhaft im UI hängen bleiben.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Hinweis `Rücknahme angefragt` mit `Zustimmen`/`Ablehnen` bleibt dauerhaft sichtbar.

## Scope

- Server- und Client-Pending-State für Undo-Requests prüfen.
- Antwort-Klicks auf Zustimmung/Ablehnung bis zur State-Bereinigung verfolgen.
- Request-ID, StateVersion und Multiplayer-Sync absichern.
- UI-State nach State-Update bereinigen.

## Nicht im Scope

- Keine Änderung an der fachlichen Undo-Regel oder Hidden-Info-Barriere.
- Kein Redesign des Undo-Panels.

## Akzeptanzkriterien

- [x] Zustimmung führt die Rücknahme aus und entfernt die Anfrage aus beiden Sichten.
- [x] Ablehnung entfernt die Anfrage aus beiden Sichten ohne State-Rollback.
- [x] Erledigte, ungültige oder abgelaufene Requests bleiben nicht sichtbar.
- [x] Multiplayer-/Reconnect-Test deckt Pending-Undo-Cleanup ab.
- [x] Hidden-Info-Barrieren für Undo bleiben unverändert.

## Umsetzungshinweise

- Bestehende Multiplayer-/Undo-Tests als Anker verwenden.

## Ergebnisnotiz

Umgesetzt. `state_update` trägt jetzt den aktuellen Pending-Undo-Zustand als explizites Signal; `null` bereinigt alte UI-Prompts nach Zustimmung, Ablehnung oder ungültiger Antwort. Reconnect-Payloads übernehmen Pending-Undo nur, wenn serverseitig wirklich noch eine offene Anfrage existiert. Die fachliche Undo-Regel und Hidden-Info-Barrieren wurden nicht verändert.

Checks grün:

- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
