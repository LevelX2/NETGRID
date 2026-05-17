---
activityId: act-2026-05-17-server-multiplayer-service-split
status: done
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/multiplayer-payload.ts
  - apps/server/src/multiplayer.ts
checks:
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "reconnects a side|allows undo|advanceAi"
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "replays a multiplayer match"
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
---

# MultiplayerService-Verantwortlichkeiten in Builder/Runner trennen

## Ziel

`apps/server/src/multiplayer.ts` soll schrittweise entlastet werden, indem reine Hilfsservices ohne Verhaltensänderung extrahiert werden. Ziel ist weniger Kopplung zwischen Lobby, Storage, KI-Ausführung, Replay und Payload-Redaction.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: `MultiplayerService` bündelt Match-Lifecycle, Auth, Tokens, Storage, Undo, Replay, Payload-Redaction, KI-Ausführung und Ergebnisbildung.
- Betroffene Anker: `apps/server/src/multiplayer.ts` ca. Zeile 682, 1419 und 2225.
- Besonders eng beieinander liegen `submitAction`, `advanceAi`, `payloadFor` und Replay-Verhalten.
- Risiko: Änderungen an Lobby/Storage/KI können unbeabsichtigt Payload- oder Replay-Verhalten berühren.

## Scope

- Zuerst reine Builder/Runner ohne Verhaltensänderung extrahieren:
  - Payload-Builder für side-sichere ClientPayloads.
  - Replay-View-Builder für serverseitige Replay-/Anzeigeprojektionen.
  - AI-Turn-Runner für kontrollierte KI-Ausführung.
  - Lifecycle-Result-Builder für Finish/Forfeit/Cancel-Ergebnisse.
- Bestehende Service-API und Tests stabil halten.
- Keine neue Persistenzsemantik einführen.

## Nicht im Scope

- Keine Änderung an Auth-, Token- oder Session-Verträgen.
- Keine Änderung an Engine-Replay oder StateHash.
- Keine Änderung an Hidden-Info-Redaction.
- Keine neue Storage-Architektur.
- Keine KI-Strategieänderung.

## Akzeptanzkriterien

- [ ] Mindestens ein klar begrenzter Builder/Runner ist aus `MultiplayerService` extrahiert.
- [ ] `submitAction`, Reconnect/Payload, `advanceAi`, Undo und Match-Finish verhalten sich unverändert.
- [ ] Multiplayer-Smokes für Submit, Reconnect, AI advance und Undo-Block bei Hidden-Info-Barriere sind grün.
- [ ] Replay-StateHash-Prüfungen bleiben grün.
- [ ] Die Extraktion ist mechanisch nachvollziehbar und führt keine fachliche Änderung ein.

## Umsetzungshinweise

- Mit einem read-only Builder beginnen, z. B. Payload oder Lifecycle Result.
- Rückgabestrukturen typisieren und im selben Package halten, bis ein API-contract-Paket existiert.
- Nach jeder Extraktion nur den betroffenen Testumfang plus zentrale Multiplayer-Smokes ausführen.

## Ergebnisnotiz

Erledigt. `payloadFor` wurde mechanisch auf einen neuen `buildSidePayload`-Builder ausgelagert. Der Builder kapselt SidePayload-Aufbau, LegalActions, EventTail-Redaction, PendingUndo, AI-Turn-Presentation, Ergebnisdaten und Retention-Payload; `MultiplayerService` liefert nur noch die servicegebundenen Callbacks. Submit/Reconnect/Undo/AI-Advance und Replay-StateHash-Smokes blieben gruen.
