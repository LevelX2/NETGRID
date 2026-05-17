---
activityId: act-2026-05-17-v2-spectator-payload-leakscan-harness
status: done
kind: test
area: server
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: V2.4
blockedBy:
  - act-2026-05-17-v2-spectator-projection-spike
resultArtifacts:
  - apps/server/src/spectator-projection.ts
  - apps/server/src/spectator-projection.test.ts
checks:
  - "corepack pnpm --filter @netgrid/server test -- src/spectator-projection.test.ts"
  - "corepack pnpm --filter @netgrid/server typecheck"
  - "git diff --check"
---

# Spectator-Payload-Leakscan-Harness vorbereiten

## Ziel

Vor Spectator-UI oder Spectator-Link-API soll ein enger Server-Testharness belegen, dass eine spätere `SpectatorProjectionV1` keine PlayerView-, Replay-, Hidden-Info-, Token- oder KI-Daten leakt.

## Kontext und Quellen

- `docs/derived/V2_4_SPECTATOR_PROJECTION_SPIKE_2026_05_17.md`
- V2.4 Gate: Private Spectator Links und delayed public view bleiben blockiert, bis Projection, Delay, Consent, Linkschutz und Reconnect testbar sind.
- Bestehende Bausteine: `apps/server/src/event-projection.ts`, `apps/server/src/multiplayer-payload.ts`, `apps/server/src/multiplayer.test.ts`.

## Scope

- Reinen Builder- oder Test-Dummy-Schnitt für `SpectatorProjectionV1` definieren, ohne HTTP-, WebSocket- oder UI-Route.
- Fixture mit verdeckter Installation, Zugriff auf verdeckte Zone, Hidden-Info-Barriere, Reconnect-Cursor und verzögertem Event-Cursor aufbauen.
- Payloadscan gegen verbotene Schlüssel und Inhalte ergänzen:
  - `PlayerView`, `legalActions`, `pendingChoice`,
  - `privatePayload`, `cardInstances`, FullState/GameState,
  - Hidden-Kartentitel, Decklisten, Deckhashes,
  - Session-/Reconnect-/Join-/Invite-/Account-Session-Tokens und Token-Hashes,
  - `AIInput`, `DecisionDebug`, `local_analysis`, `exploitSuggestions`, `randomDrawRecords`,
  - lokale Pfade.
- Delay-Regression prüfen: Cursor N darf keine Board- oder Eventdaten aus N+1 enthalten.
- Reconnect-Regression prüfen: gleicher Cursor erzeugt gleiche Spectator-Projektion, ohne Runner-/Korp-PlayerView.

## Nicht im Scope

- Keine Spectator-UI.
- Keine Spectator-Link-API.
- Kein Public Spectator.
- Keine Änderung an `PlayerView`, StateHash, Replay oder KI-Input.
- Keine Veröffentlichung alter Replays oder Matches.

## Akzeptanzkriterien

- [x] Tests belegen, dass Spectator-Payloads keine verbotenen Felder oder Hidden-Kartentitel enthalten.
- [x] Delay-Cursor und Reconnect-Cursor sind mit mindestens einem Negativfall getestet.
- [x] Der Projection-Schnitt ist versioniert oder im Test eindeutig benannt.
- [x] Bestehende Runner-/Korp-PlayerViews, Replay-Views und `eventTail` bleiben unverändert.
- [x] Relevante Server-Tests und `git diff --check` sind grün oder mit konkretem Blocker dokumentiert.

## Umsetzungshinweise

- Der erste Slice darf bewusst serverintern bleiben.
- Positive Allowlist bevorzugen; keine generische Deep-Copy-Redaction als Primärschutz.
- Keine Route freischalten, bevor Consent, Linkschutz und Reconnect-Policy fachlich gefreezt sind.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17 auf `codex/activity-worker-1`.

Umgesetzt wurde ein rein serverinterner, versionierter `SpectatorProjectionV1`-Builder ohne HTTP-, WebSocket- oder UI-Freischaltung. Die Projektion nutzt eine positive Allowlist für Match-Metadaten, öffentliche Board-Zähler, anonyme installierte Slots und eigene Spectator-Event-Metadaten. Verzögerte Cursor verwenden nur passende historische Snapshots; fehlt ein sicherer Snapshot, bricht der Builder mit `spectator_projection_cursor_snapshot_missing` ab statt auf Live-State zurückzufallen.

Der Testharness baut ein StoredMatch-Fixture mit verdeckter Installation, Hidden-Info-Barriere, Reconnect-Cursor, verzögertem Event-Cursor sowie absichtlich injizierten verbotenen Daten in StoredMatch und Roh-Event-Payloads. Die Tests scannen die resultierende Spectator-Projektion gegen verbotene Schlüssel und Inhalte inklusive `PlayerView`, `legalActions`, `pendingChoice`, `privatePayload`, `cardInstances`, FullState/GameState, Hidden-Kartentitel, Decklisten, Deckhashes, Tokens/Token-Hashes, KI-/Decision-Debug-Felder, `randomDrawRecords` und lokale Pfade.

Nicht geändert wurden `PlayerView`, Replay-Views, `eventTail`, `SidePayload`, StateHash, KI-Input, HTTP-/WebSocket-Routen oder UI.
