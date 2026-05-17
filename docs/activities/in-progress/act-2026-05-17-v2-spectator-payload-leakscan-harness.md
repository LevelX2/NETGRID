---
activityId: act-2026-05-17-v2-spectator-payload-leakscan-harness
status: in_progress
kind: test
area: server
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: V2.4
blockedBy:
  - act-2026-05-17-v2-spectator-projection-spike
resultArtifacts: []
checks: []
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

- [ ] Tests belegen, dass Spectator-Payloads keine verbotenen Felder oder Hidden-Kartentitel enthalten.
- [ ] Delay-Cursor und Reconnect-Cursor sind mit mindestens einem Negativfall getestet.
- [ ] Der Projection-Schnitt ist versioniert oder im Test eindeutig benannt.
- [ ] Bestehende Runner-/Korp-PlayerViews, Replay-Views und `eventTail` bleiben unverändert.
- [ ] Relevante Server-Tests und `git diff --check` sind grün oder mit konkretem Blocker dokumentiert.

## Umsetzungshinweise

- Der erste Slice darf bewusst serverintern bleiben.
- Positive Allowlist bevorzugen; keine generische Deep-Copy-Redaction als Primärschutz.
- Keine Route freischalten, bevor Consent, Linkschutz und Reconnect-Policy fachlich gefreezt sind.
