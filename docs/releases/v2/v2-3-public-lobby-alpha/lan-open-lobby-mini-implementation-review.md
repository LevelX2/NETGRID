# V2.3a Implementation Review - LAN Open Lobby Mini Slice

Stand: 2026-05-11  
Status: implemented

## Scope

V2.3a wurde als kleiner, eigenständiger Vorstufenschnitt umgesetzt, um im privaten LAN-/WLAN-Bereich offene, joinbare Spiele sichtbar zu machen und den Beitritt direkt aus der Liste zu starten.  
Der Slice bleibt bewusst ohne Engine-, Karten- oder Plattformerweiterungen.

## Umgesetzt

- `GET /api/matches/open` implementiert:
  - liefert nur joinbare öffentliche Metadaten für offene Matches im aktuellen Host-Kontext.
  - nutzt serverseitige Filter auf `pending` und `discoverableInLan`.
- Match-Modelle für die Open-Liste sind auf sichere Felder reduziert:
  - `matchId`, `hostDisplayName`, `mode`, `status`, `createdAt`, `ageSeconds`.
- Join bleibt serverautoritativ:
  - `joinMatch` revalidiert Seiten- und Statuslogik gegen den aktuellen Match-Zustand.
  - bei veraltetem/ungültigem Join wird der Eintritt sauber abgewiesen.
- Host-Erstellung:
  - `discoverableInLan` als Schalter aufgenommen.
  - `human_vs_human` hat standardmäßig sichtbare LAN-Liste; private/unsichtbare Matches können deaktiviert werden.
- Web-UI im Bereich `Beitreten`:
  - neue Sektion `Offene Spiele im LAN` mit Refresh-Button.
  - Polling/Auto-Refresh im Join-Modus (7 Sekunden).
  - Auswahl eines Listeneintrags startet den bestehenden Join-Endpunkt (kein paralleler Join-Stack).
  - klare Fehlernachricht bei ungültigem Listeneintrag inkl. Listenauslösung auf Aktualisierung.
  - „Keine offenen Spiele gefunden.“ bei leerer Liste.
- Sichtbarkeitslabel gesetzt:
  - Webclient zeigt Release-Label `V1.9.4`.

## Test-Nachweise (Code-/Test-Hotspots)

- `apps/server/src/multiplayer.ts`
  - Filterung, Minimal-Payload und Revalidierung für Open-Liste/Join.
- `apps/server/src/http-server.ts`
  - Route `GET /api/matches/open`.
  - Join- und Erstellpfade mit Sichtbarkeitsflag berücksichtigt.
- `apps/web/app/page.tsx`
  - Rendering der offenen LAN-Spiele.
  - Refresh/Auto-Refresh und Join-Flow von Listeneinträgen.
- `apps/web/app/match-start.test.ts`
  - UI-Abdeckung zu Open-List, Join-Flow und Fallback-Pfaden.
- `apps/server/src/multiplayer.test.ts`
  - Filter-, Sichtbarkeits-, Payload- und Race-Cases für V23A.
- `tests/specs/visibility-contract.test.ts`
  - Contract-Abdeckung für Offen-Liste, Sichtbarkeit, empty state und Redaction.

## Daten- und Artefakte

- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-requirements.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-test-matrix.md`
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-plan.md`
- `tests/specs/visibility-contract.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/match-start.test.ts`

## No-Scope-Bestätigung

- Kein Matchmaking, kein Public Discovery, keine Accounts/Ranking/Turniere/Chat-/Spectator-Erweiterung.
- Keine Engine-/Kartenfreigabe-/Rules-/Replay-/StateHash-/RNG-Änderungen.
- Kein neues Persistenz- oder Plattform-Feature über den privaten LAN-Kontext hinaus.
- Kein neuer KI-Entscheidungsfluss, kein neues KI-Input-Schema.

