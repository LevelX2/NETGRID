# V2.3a Test Matrix - LAN Open Lobby Mini Slice

Stand: 2026-05-10
Status: requirements_freeze_testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V23A-T001 | Web UI Grundanzeige | V23A-MUST-001 | Unter `Beitreten` ist der Bereich `Offene Spiele im LAN` sichtbar. |
| V23A-T002 | Serverfilter Status | V23A-MUST-002 | Nur `pending`-Matches werden gelistet. |
| V23A-T003 | Serverfilter Sichtbarkeit | V23A-MUST-002 | Nur Matches mit `discoverableInLan=true` erscheinen in der Liste. |
| V23A-T004 | Payload-Minimum | V23A-MUST-003 | Listeneinträge enthalten nur freigegebene Metadatenfelder. |
| V23A-T005 | Payload-Redaction | V23A-MUST-004 | `GET /api/matches/open` enthält keine Tokens, Deckdaten oder Hidden-Info-Felder. |
| V23A-T006 | Join-Flow-Reuse | V23A-MUST-005 | Listenbeitritt nutzt den bestehenden Join-Endpunkt/-Pfad statt eigener Parallel-Logik. |
| V23A-T007 | Fallback-Regression | V23A-MUST-006 | Join-Link und manuelle Eingabe funktionieren unverändert weiter. |
| V23A-T008 | Host-Opt-in sichtbar | V23A-MUST-007 | Bei Erstellung mit `discoverableInLan=true` ist das Match in der LAN-Liste sichtbar. |
| V23A-T009 | Host-Opt-out unsichtbar | V23A-MUST-007 | Bei `discoverableInLan=false` ist das Match nicht in der LAN-Liste sichtbar. |
| V23A-T010 | Listenaktualisierung | V23A-MUST-008 | Auto-Refresh und manueller Refresh aktualisieren die Liste korrekt. |
| V23A-T011 | Race Join vs Statuswechsel | V23A-MUST-009, V23A-MUST-013 | Wird ein Match zwischen Listung und Join ungültig/aktiv, lehnt der Server den Join side-sicher ab. |
| V23A-T012 | UI-Fehlerpfad | V23A-MUST-009 | Nach Join-Fehler wird eine klare Meldung gezeigt und die Liste neu geladen. |
| V23A-T013 | Redaction Regression | V23A-MUST-010 | REST/WS/Reconnect/Logs bleiben token- und hidden-info-safe. |
| V23A-T014 | Engine-/Replay-Scope | V23A-MUST-011 | Keine Änderung an Mechanics, Kartenfreigaben, RulesBaseline, Replay, StateHash oder RNG. |
| V23A-T015 | Plattform-Non-Scope | V23A-MUST-012 | Keine neuen Pfade für Matchmaking, öffentliche Lobby, Accounts, Ranking, Turnier, Spectator, Chat-Ausbau. |
| V23A-T016 | Serverautorität | V23A-MUST-013 | Join ohne gültigen serverseitigen Zustand wird nicht akzeptiert; Revalidierung bleibt Pflicht. |
| V23A-T017 | Empty State UX | V23A-SHOULD-001 | Bei leerer Liste erscheint eine klare Leermeldung ohne Fehlalarm. |
| V23A-T018 | Combined Leak Scan | V23A-MUST-004, V23A-MUST-010 | DOM, Browser-Storage, REST/WS-Payloads und Logs enthalten keine Token-/Deck-/Hidden-Info-Muster. |
| V23A-T019 | Kleine LAN-Performance | V23A-SHOULD-002 | Open-List-Antwort bleibt in kleinen privaten Setups reaktionsschnell. |

## Pflicht-Server-/Contract-Tests

- `GET /api/matches/open` liefert nur joinbare `pending`-Einträge.
- `discoverableInLan=false` wird sicher herausgefiltert.
- Open-List-Payload enthält keine sensiblen Felder.
- Join auf stale/ungültige Einträge wird side-sicher abgelehnt.
- Race-Fall (Listung -> Match wird aktiv) erzeugt keinen Doppelstart und keinen inkonsistenten Status.

## Pflicht-Web-/UI-Tests

- Bereich `Offene Spiele im LAN` sichtbar und bedienbar.
- Leerer Zustand klar dargestellt.
- Eintrag auswählen und Beitreten möglich.
- Join-Fehler zeigt klare Rückmeldung und aktualisiert Liste.
- Join-Link-/Manuell-Fallback unverändert nutzbar.

## Pflicht-E2E-Checks

- Zwei-Tab-Flow: Host erstellt sichtbares Match, Joiner sieht es und joint.
- Opt-out-Flow: Host erstellt unsichtbares Match, Joiner sieht es nicht in der Liste.
- Leak-Scan auf DOM/Storage/Payloads/Logs bleibt grün.

## Pflicht-Projektchecks für Umsetzung

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V2_3A_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
