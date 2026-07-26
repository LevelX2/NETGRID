---
activityId: act-2026-07-26-stable-local-reconnect-contract
status: done
kind: fix
area: server
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt: 2026-07-26
completedAt: 2026-07-26
branch: codex/activities-worktree-20260726-001
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/server/src/multiplayer.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/app/session-recovery.ts
  - apps/web/app/session-recovery.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/maintenance.ts
  - apps/web/app/maintenance.test.ts
checks:
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts
  - corepack pnpm --filter @netgrid/web test -- session-recovery.test.ts maintenance.test.ts
  - git diff --check
outcome: normal-reconnect-idempotent
---

# Stabilen lokalen Reconnect-Vertrag wiederherstellen

## Ziel

Ein laufendes lokales Match lässt sich nach einem WebSocket-Abbruch, Browser-
Reload, Serverneustart oder aus einem zweiten Firefox-Tab wieder verbinden,
solange die lokale Sitzung nicht ausdrücklich gelöscht wurde. Ein normaler
Reconnect darf die dafür gespeicherten Zugangsdaten nicht selbst ungültig
machen.

## Kontext und Quellen

- Playtest-Fund vom 2026-07-26: Das aktive Match
  `match_efa2150596c7b527` meldet in Firefox wiederholt „Reconnect ist nicht
  möglich“, obwohl der Server nach seinem Neustart noch einen nicht widerrufenen
  Reconnect-Token für die Runner-Sitzung enthält.
- Befund aus der Serverpersistenz: Frühere erfolgreiche Reconnects widerrufen
  jeweils Session- und Reconnect-Token; der aktuelle Token wurde beim Neustart
  nicht geändert.
- `apps/server/src/multiplayer.ts`, `reconnectMatch()`: erzeugt gegenwärtig bei
  jedem erfolgreichen Reconnect ein neues Session-/Reconnect-Tokenpaar und
  widerruft das vorherige Paar.
- `apps/web/app/session-recovery.ts`: `loadStoredSession()` bevorzugt die
  Tab-Kopie aus `sessionStorage` vor der persistierten Recovery-Sitzung in
  `localStorage`. Ein älterer Firefox-Tab kann dadurch den gültigen Stand
  überstimmen.
- `apps/web/app/page.tsx`, `reconnectSession()`: übernimmt eine erfolgreiche
  Serverantwort bereits in den lokalen Speicher, kann aber einen alten,
  bevorzugten Tab-Stand nicht zuverlässig ausgleichen.

## Scope

- Den normalen Reconnect als idempotenten Wiederverbindungsvorgang definieren:
  derselbe gültige Reconnect- und Session-Token bleibt für die Lebensdauer der
  lokalen Match-Sitzung gültig. `reconnectMatch()` aktualisiert nur den
  Verbindungs-/Last-seen-Zustand und liefert den aktuellen side-sicheren
  Payload; es rotiert oder widerruft keine Tokens.
- Token-Widerruf auf ausdrückliche Lebenszyklusereignisse begrenzen: lokale
  Sitzung löschen, Match-Ende/-Löschung oder ein später ausdrücklich
  eingeführter Sicherheits-Reset. Der bestehende Side- und Token-Hash-Abgleich
  bleibt zwingend.
- Die persistierte Recovery-Sitzung als verbindlichen lokalen Stand behandeln.
  Eine Tab-Kopie darf diesen Stand nicht überstimmen, wenn sie für dasselbe
  Match/dieselbe Side abweicht oder älter ist.
- Offene Tabs über eine vorhandene Browser-Mechanik (`storage`-Event oder
  `BroadcastChannel`) auf den aktuellen Sitzungsstand synchronisieren. Ein
  alter Tab soll den aktuellen Stand übernehmen statt einen widerrufenen Token
  an `/reconnect` zu senden.
- Fehlerbehandlung präzisieren: „Reconnect ist nicht möglich“ nur für einen
  tatsächlich fehlenden, falschen oder ausdrücklich widerrufenen Token zeigen;
  nicht für einen durch die Anwendung selbst veralteten Tab-Stand.
- Fokussierte Server- und Web-Regressionstests für wiederholten Reconnect,
  Reload/Serverneustart und zwei Firefox-Tabs ergänzen.

## Nicht im Scope

- Kein automatischer Serverstart, -stopp oder -neustart; der Fix darf den
  normalen lokalen Laufweg nicht berühren.
- Keine Änderung an Matchregeln, `LegalActions`, Engine-Autorität, Replay,
  `StateHash` oder KI-Entscheidungen.
- Keine Ausgabe roher Session-, Reconnect- oder Join-Tokens in UI, Logs,
  Fehlern, Events, Replays oder Debug-Payloads.
- Kein allgemeines Account-/Login- oder Remote-Sicherheitsprojekt. Falls ein
  künftiger Sicherheits-Reset benötigt wird, ist er ein separates,
  explizit gestaltetes Paket.

## Akzeptanzkriterien

- [ ] Nach einem erfolgreichen Reconnect bleiben die gleichen Session- und
  Reconnect-Tokens gültig; ein zweiter normaler Reconnect funktioniert ohne
  Tokenwechsel ebenfalls.
- [ ] Ein Serverneustart ohne lokale Sitzungs-Löschung macht den gespeicherten
  Reconnect-Token nicht ungültig; die Wiederverbindung liefert den aktuellen
  PlayerView, `LegalActions` und Event-Tail für die korrekte Seite.
- [ ] Zwei geöffnete Firefox-Tabs derselben Side können nacheinander
  reconnecten, ohne dass ein Tab wegen eines von der App selbst veralteten
  Tokens scheitert.
- [ ] Ein bewusst falscher, side-fremder oder ausdrücklich widerrufener Token
  bleibt fail-closed und liefert keine Match-, Hidden-Info- oder Token-Details.
- [ ] Persistierte Sitzungsdaten bleiben lokal; alle PlayerView-, WebSocket-,
  Reconnect-, PublicEvent- und Fehlermeldungsgrenzen bleiben hidden-info-sicher.
- [ ] Betroffene Server- und Webtests, Server-/Web-Typechecks sowie
  `git diff --check` sind grün.

## Umsetzungshinweise

- Zuerst den Serververtrag in `apps/server/src/multiplayer.ts` und seine
  vorhandenen Reconnect-Tests anpassen. Nicht eine neue UI-Fallback-Regel
  erfinden, die einen ungültigen Serververtrag verdeckt.
- Danach `apps/web/app/session-recovery.ts` und die Bootstrap-/Reconnect-
  Sequenz in `apps/web/app/page.tsx` so ändern, dass die Recovery-Quelle
  eindeutig und tabübergreifend konsistent ist.
- Tests müssen ohne reale Tokens arbeiten; Test-Token sind ausschließlich
  Fixture-Werte. Die Produktionspfade dürfen Token weiterhin nur gehasht
  persistieren.
- Bei einem echten Konflikt zwischen zwei gleichzeitig aktiven Tabs ist der
  zuletzt empfangene, serverautorisierte Sitzungsstand maßgeblich. Beide Tabs
  dürfen dadurch nicht in eine Rotation oder einen Reconnect-Fehlerzyklus
  geraten.

## Ergebnisnotiz

Der normale Reconnect prüft nun das bestehende Session-/Reconnect-Tokenpaar
inklusive Side-Bindung und gibt es unverändert zurück. Die Tokens werden dabei
nicht mehr rotiert oder widerrufen; mehrfaches Reconnecten bleibt möglich.

Der bereits vorhandene, ausdrücklich ausgelöste Wartungs-Fortsetzungszugang
ist als separater Recovery-Tokenpfad erhalten. Nur dieser Pfad widerruft die
alten Tokens und stellt ein neues Paar aus.

Die persistierte Recovery-Sitzung gewinnt bei gleichem Match und gleicher Side
gegen eine abweichende Tab-Kopie. Offene Tabs übernehmen Änderungen an dieser
persistierten Sitzung über das `storage`-Event.

Checks: Server- und Web-Typecheck sowie die vollständigen betroffenen
Server-/Web-Vitest-Läufe sind grün; `git diff --check` ist grün. Keine offenen
Folgepunkte.
