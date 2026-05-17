---
activityId: act-2026-05-17-shared-api-contract-types
status: done
kind: architecture
area: shared
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
  - packages/shared/src/api-contracts.ts
  - packages/shared/src/index.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer-payload.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts -t "reconnects a side|allows undo|advanceAi"
  - git diff --check
---

# Web-/Server-API-Transportverträge typisiert teilen

## Ziel

Webclient und Server sollen zentrale API-/WebSocket-Transporttypen gemeinsam nutzen, statt Payload-Verträge im Webclient lokal zu duplizieren.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: Der Webclient definiert `ClientPayload`, `LobbyPayload`, `ServerMessage`, Create-/Join-Responses lokal erneut.
- Betroffene Anker: `apps/web/app/page.tsx` ca. Zeile 348 und 433.
- Risiko: Server- und Client-Vertrag können auseinanderlaufen, besonders bei `legalActions`, `eventTail`, `playerView`, `pendingUndo` und `aiTurnPresentation`.
- Nutzerklärung vom 2026-05-17: Keine feste Präferenz, ob die API-Transporttypen in `@netgrid/shared` oder ein eigenes `@netgrid/api-contracts`-Paket gehören. Die technische Umsetzung soll pragmatisch entscheiden und die Wahl dokumentieren.

## Scope

- Kleine gemeinsame API-Contract-Typen extrahieren.
- Zunächst nur TypeScript-Typen verschieben, keine Runtime-Validierung und keine Payload-Änderung.
- Entscheiden, ob diese Typen in `@netgrid/shared` liegen oder in einem eigenen Package vorbereitet werden.
- Entscheidung pragmatisch anhand Dependency-Risiko, Paketaufwand und späterer Auslagerbarkeit treffen.
- Webclient und Server auf gemeinsame Typen umstellen.
- Type-level Compile-Check und ein WebSocket-Payload-Kompatibilitäts-Smoke ergänzen oder bestätigen.

## Nicht im Scope

- Keine Änderung an WebSocket-Protokoll oder HTTP-Routen.
- Keine Runtime-Schema-Validierung, außer separat beschlossen.
- Keine Änderung an PlayerView, LegalAction oder PublicEvent-Semantik.
- Keine größere Package-Reorganisation.

## Akzeptanzkriterien

- [ ] Mindestens die zentralen Client-/Lobby-/ServerMessage-/Create-/Join-Typen sind gemeinsam importierbar.
- [ ] Webclient dupliziert diese Transporttypen nicht mehr lokal.
- [ ] Server und Web typechecken gegen dieselbe Typquelle.
- [ ] WebSocket-Payload-Kompatibilitäts-Smoke oder gleichwertiger Test ist grün.
- [ ] Die Package-Entscheidung ist dokumentiert: `@netgrid/shared` oder eigenes `@netgrid/api-contracts`.

## Umsetzungshinweise

- Für den ersten Schnitt reichen Type-Exports; keine neue Runtime-Abhängigkeit einführen.
- Zirkuläre Dependencies prüfen: Shared darf nicht von Web oder Server abhängen.
- Falls eigenes Package zu schwer ist, zunächst in `@netgrid/shared` als `api-contracts`-Modul starten und später auslagern.

## Ergebnisnotiz

Erledigt. Die ersten gemeinsamen API-Transporttypen liegen in `@netgrid/shared` als `api-contracts`-Modul. Entscheidung: `@netgrid/shared`, weil die Typen reine Contracts ohne Runtime-Validierung sind, Shared bereits von Web und Server konsumiert wird und ein eigenes Package fuer diesen Schnitt aktuell mehr Paketaufwand als Nutzen haette; spaetere Auslagerung bleibt durch das separate Modul moeglich. Web nutzt `ApiSidePayload`, `ApiLobbyPayload`, `ApiServerMessage`, `ApiCreateMatchResponse` und `ApiJoinMatchResponse` statt lokaler Strukturduplikate. Server aliasiert die entsprechenden Payload-/Lobby-/Summary-Typen ebenfalls auf Shared; das WebSocket-Message-Union kommt aus Shared. Protokoll und Payload-Felder wurden nicht fachlich geaendert.
