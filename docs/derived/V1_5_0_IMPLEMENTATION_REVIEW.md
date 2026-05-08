# V1.5.0 Implementation Review - Private Replay, Analyse und Lernhilfe

Stand: 2026-05-08
Status: implemented

## Scope

V1.5.0 wurde nach grünem V1.4.3-Final-Gate umgesetzt. Der Release ergänzt private lokale Replay- und Analysefunktionen mit StateHash-Prüfung, side-sicheren Perspektiven und redigiertem Export, ohne Engine-Regeln oder Kartenfreigaben zu erweitern.

## Umgesetzt

- Replay-Index, Replay-Ansicht und Export in `apps/server/src/multiplayer.ts`:
  - `listReplayIndex`
  - `loadReplayView`
  - `exportReplay`
- Replay-Datenmodell ergänzt:
  - `ReplayIndexEntry`, `ReplayTimelineStep`, `ReplayStateHashCheck`, `ReplayView`, `ReplayExportArtifact`.
- Timeline mit V1.5.0-Kernfeldern:
  - Event-ID, Seite, TimingPoint, StateVersion vorher/nachher, StateHash-Prüfung, Hidden-Info-Barriere, Eventfamilie und Lernhinweis.
- Side-sichere Perspektiven:
  - `runner`, `corp`, `local_analysis` für lokale Ansicht.
  - `local_analysis` ist für Export explizit blockiert (`bad_request`), Export bleibt side-sicher auf Runner/Korp.
- Replay-StateHash-Prüfung:
  - Replay-Actions werden aus lokalen Ereignisdaten rekonstruiert.
  - `game_created` wird als hashbarer Basisfall ohne künstlichen Replay-Fehler behandelt.
- RandomDrawRecords:
  - als nachvollziehbare Hash-Form (`fnv1a:*`) statt Wert-Leaks.
- DecisionDebug im Replay:
  - side-sicher redigiert (`side_private_ai_debug`) für Gegenperspektive,
  - lokal/gleichseitig kontextualisiert mit Fakten/Hypothesen/Unsicherheitsdaten.
- Eventfamilien-/Lernhinweise erweitert:
  - Run/Access, Damage, Trace/Tags, Replacement/Prevention, Special Zones/Control.
- Exploit-Kandidaten:
  - nur als `review_suggestion`, keine automatische Testerzeugung.
- REST-Endpunkte in `apps/server/src/http-server.ts`:
  - `GET /api/replays`
  - `GET /api/replays/:matchId?perspective=...`
  - `GET /api/replays/:matchId/export?perspective=...`
  - korrekte 400-Antwort bei ungültiger Export-Perspektive.
- Web-Oberfläche:
  - neue private Replay-Seite `apps/web/app/replays/page.tsx` mit Liste, Perspektivwechsel, Timeline, Schlüsselmoment-Sprüngen und Exportanzeige.
- Browser-Smoke-Artefakte:
  - `docs/derived/artifacts/v1_5_0_replay_smoke.json`
  - `docs/derived/artifacts/v1_5_0_replay_smoke.png`

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V150-MUST-001 | pass: Start nach grünem V1.4.3-Final-Gate. |
| V150-MUST-002 | pass: Replay-Laden aus Match-/Event-/Snapshot-Daten. |
| V150-MUST-003 | pass: Replay-Metadaten sind token-/session-/pfad-/decklistenfrei. |
| V150-MUST-004 | pass: Timeline zeigt Event/Seite/Timing/StateVersion/StateHash-Prüfung. |
| V150-MUST-005 | pass: Runner-/Korp-Perspektiven folgen den Visibility-Regeln. |
| V150-MUST-006 | pass: `local_analysis` ist lokal markiert und nicht exportierbar. |
| V150-MUST-007 | pass: Hidden-Info-Barrieren sind in der Timeline markiert. |
| V150-MUST-008 | pass: RandomDrawRecords sind nachvollziehbar als Hash ohne Wert-Leak. |
| V150-MUST-009 | pass: Access-, Damage-, Trace-, Replacement- und Special-Zone-Ereignisse sind mindestens abstrakt renderbar (Eventfamilien/Lernhinweise). |
| V150-MUST-010 | pass: DecisionDebug ist perspektivabhängig redigiert. |
| V150-MUST-011 | pass: Export redigiert Secrets und lokale Privatdaten. |
| V150-MUST-012 | pass: Exploit-Kandidaten nur als Review-Vorschlag. |
| V150-MUST-013 | pass: Lernhinweise bleiben legal-action-basiert und beschreibend. |
| V150-MUST-014 | pass: kein Public-Replay/Spectator/Account/Ranking/Matchmaking. |
| V150-MUST-015 | pass: keine Engine-/Karten-/StateHash-Vertragsänderung. |

## Verifikation

- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass (64 Tests).
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm --filter @netgrid/web test`: pass (55 Tests).
- `git diff --check`: pass (nur bekannte CRLF-Warnung in bestehender Datei).
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass (nur bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Katalogpfad).
- `corepack pnpm e2e`: nicht als Produktfehler auswertbar, da lokaler Port-Konflikt durch bereits laufenden fremden `next dev` auf `:3100`.
- gezielter Browser-Replay-Smoke via Playwright auf `/replays`: pass, artefaktisiert.

## No-Scope-Bestätigung

Keine neuen Kartenfreigaben, keine neuen Mechanikfreigaben außerhalb der Spezifikation, kein Kartentextparser, keine Public-Plattformfunktionen, kein LLM/API-Live-Regelakteur und keine Hidden-Info-Leaks in PlayerViews/PublicEvents/WebSocket/Reconnect/Undo/Export/Logs.
