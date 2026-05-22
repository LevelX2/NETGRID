---
activityId: act-2026-05-21-player-view-public-events-tail
status: done
kind: architecture
area: server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/multiplayer-payload.ts
  - apps/server/src/multiplayer-payload.test.ts
checks:
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer-payload.test.ts
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "hidden"
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts
  - git diff --check
---

# PlayerView-PublicEvents für Live-Updates verschlanken

## Ziel

Normale Live-, Bootstrap- und Reconnect-Payloads sollen nicht mehr unnötig die vollständige öffentliche Event-Historie in `playerView.publicEvents` mitschleppen, ohne Chronik, Turn-Kontext, Action-Cues, Replay oder Belief-Rekonstruktion funktional zu verlieren.

## Kontext und Quellen

- Der Server sendet bereits `eventTail`, aber `getPlayerView` baut weiterhin `publicEvents` aus der vollständigen `state.eventLog`.
- Webclient-Stellen nutzen `playerView.publicEvents` für Turnnummern, Chronik-Kontext, Action-Cues und Belief-nahe Rekonstruktion.
- Relevante Dateien:
  - `packages/engine/src/index.ts`
  - `apps/server/src/multiplayer-payload.ts`
  - `apps/web/app/page.tsx`
  - `packages/shared/src/api-contracts.ts`

## Scope

- Verbrauchsstellen im Webclient und Server inventarisieren, die aktuell vollständige `playerView.publicEvents` brauchen.
- Einen additiven Payload-Vertrag definieren: begrenzte Event-Tails plus explizite abgeleitete Metadaten für Turnnummer, aktuelle Aktionsnummer, Turn-Kontext und Chronicle-Kontext.
- Live-/Reconnect-Payloads auf begrenzte Eventlisten umstellen, wenn alle notwendigen Metadaten vorhanden sind.
- Vollständige Historie weiter über Replay- und gezielte History-/Chronik-Pfade verfügbar halten.
- Tests ergänzen, die lange Eventlisten in normalen Payloads begrenzen und gleichzeitig Turn-/Chronik-Anzeige stabil halten.

## Nicht im Scope

- Kein Löschen, Kürzen oder Entwerten der gespeicherten Replay-Historie.
- Keine Änderung an Engine-Regeln, LegalActions oder StateHash.
- Keine Hidden-Info-Erweiterung in den neuen Metadaten.
- Keine UI-Neugestaltung der Chronik; nur Datenvertrag und Nutzung verschlanken.

## Akzeptanzkriterien

- [ ] Normale SidePayloads enthalten keine unbegrenzt wachsende öffentliche Event-Historie mehr.
- [ ] Turnnummer, Aktionszähler, Action-Cues und Chronicle-Kontext bleiben in bestehenden UI-Workflows korrekt.
- [ ] Replay-View und Export erhalten weiterhin vollständige History-Funktionalität.
- [ ] Hidden-Info- und Token-Leak-Tests bleiben grün oder werden passend erweitert.
- [ ] Checks: `corepack pnpm --filter @netgrid/shared typecheck`, `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/web typecheck`, passende Server-/Web-Tests.

## Umsetzungshinweise

- Nicht blind `publicEvents` abschneiden, bevor alle Webclient-Abhängigkeiten ersetzt sind.
- Additive API-Felder bevorzugen, damit bestehende Tests schrittweise angepasst werden können.
- Die Engine kann den bisherigen `getPlayerView`-Vertrag behalten; die Verschlankung darf serverseitig über Payload-Projektion erfolgen, falls das risikoärmer ist.

## Ergebnisnotiz

Erledigt. Normale SidePayloads projizieren `playerView.publicEvents` jetzt serverseitig auf denselben begrenzten, seitensicher redigierten Event-Tail wie `eventTail` (`SIDE_PAYLOAD_EVENT_TAIL_LIMIT = 80`). Der Engine-Vertrag von `getPlayerView` bleibt unverändert; Replay- und History-Pfade behalten ihre vollständige Historie.

Der Webclient kann Turn-/Chronicle-/Action-Cue-Kontext weiter aus `playerView.publicEvents` lesen, bekommt dort aber keine unbegrenzt wachsende Event-Historie mehr. Der neue Server-Test erzeugt mehr Events als das Limit und sichert, dass `eventTail` und `playerView.publicEvents` im SidePayload identisch begrenzt sind.

Shared-, Server- und Web-Typechecks sowie der neue Payload-Test, der fokussierte Hidden-Info-Test und der vollständige Multiplayer-Testlauf waren grün.
