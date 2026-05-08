# V1.0.9 Requirements - Private Internet Hardening

Stand: 2026-05-06
Status: requirements_freeze

## Kurzfassung

V1.0.9 friert den nächsten Release als private Internet-Härtung ein. Ziel ist, eingeladene Spieler über einen privaten HTTPS/WSS-Betriebspfad sicherer spielen zu lassen, ohne öffentliche Plattformfunktionen zu starten.

Der Release erweitert keine Karten, keine Mechaniken, keine Accounts, keine Public Discovery, keine Replay-/StateHash-/Randomness-Verträge und keine Engine-Regelautorität.

## Ist-Basis

- V1.0.8 ist abgeschlossen; SQLite ist privater lokaler Standard-Storage.
- REST, WebSocket, Reconnect, Undo, Lifecycle und Join-Deck-Handshake sind vorhanden.
- Token werden serverseitig als Hashes gespeichert.
- E2E-Leak-Scans prüfen DOM, Browser-Speicher und WebSocket-Payloads.
- Der aktuelle Server erlaubt CORS noch pauschal und prüft WebSocket-Origin nicht explizit.
- Lokale Startskripte und E2E nutzen HTTP auf `127.0.0.1`.

## Anforderungen

| ID | Priorität | Anforderung | Testspur |
| --- | --- | --- | --- |
| V109-MUST-001 | Must | V1.0.9 definiert ein explizites Betriebsprofil `local` und ein privates Internet-Profil, z. B. `private_internet`. | V109-T001 |
| V109-MUST-002 | Must | Im privaten Internet-Profil müssen `NETGRID_WEB_BASE_URL` und `NETGRID_SERVER_BASE_URL` explizit gesetzt sein. | V109-T002 |
| V109-MUST-003 | Must | Im privaten Internet-Profil sind öffentliche URLs nur mit `https://` für Web und Server zulässig; WebSocket-Clients leiten daraus `wss://` ab oder nutzen eine ausdrücklich sichere WSS-Konfiguration. | V109-T003, V109-T004 |
| V109-MUST-004 | Must | `http://127.0.0.1`, `http://localhost` und lokale Testports bleiben für Entwicklung und E2E erlaubt. | V109-T004 |
| V109-MUST-005 | Must | Unsichere Internet-Konfigurationen werden beim Start oder beim Health-/Config-Check kontrolliert abgelehnt. | V109-T005 |
| V109-MUST-006 | Must | REST-CORS verwendet eine explizite Origin-Allowlist; `*` ist im privaten Internet-Profil verboten. | V109-T006 |
| V109-MUST-007 | Must | `NETGRID_ALLOWED_ORIGINS` oder äquivalente Konfiguration unterstützt mehrere erlaubte Origins. | V109-T007 |
| V109-MUST-008 | Must | Preflight-Antworten erlauben nur notwendige Methoden und Header für die bestehende App. | V109-T008 |
| V109-MUST-009 | Must | REST-Anfragen mit unbekannter Origin werden mit side-sicherer Antwort abgelehnt, ohne Match-, Token-, Deck- oder Hidden-Info-Daten. | V109-T009, V109-T030 |
| V109-MUST-010 | Must | WebSocket-Verbindungen auf `/ws` prüfen die Origin gegen dieselbe Allowlist oder einen dokumentierten äquivalenten WSS-Origin-Vertrag. | V109-T010 |
| V109-MUST-011 | Must | WebSocket-Verbindungen mit unbekannter Origin werden vor Match-Join abgelehnt und erzeugen keine side-unsicheren Payloads. | V109-T011, V109-T030 |
| V109-MUST-012 | Must | Sensible REST-Endpunkte besitzen einfache, deterministisch testbare Rate Limits. | V109-T012 |
| V109-MUST-013 | Must | Mindestens `POST /api/matches`, Join-Info mit Token, Join, Reconnect, Bootstrap mit Token, Lifecycle-Kommandos und AI-Advance sind abgedeckt. | V109-T013 |
| V109-MUST-014 | Must | WebSocket-Handshake oder `join_match` besitzt eine einfache Rate-Limit- oder Abuse-Bremse. | V109-T014 |
| V109-MUST-015 | Must | Rate-Limit-Antworten enthalten keine Tokens, TokenHashes, Decklisten, Match-Interna oder Hidden Info. | V109-T015, V109-T030 |
| V109-MUST-016 | Must | Rate-Limits bleiben lokal konfigurierbar und in Tests stabil, ohne echte Wartezeiten über lange Zeitfenster. | V109-T016 |
| V109-MUST-017 | Must | Im privaten Internet-Profil ist ein expliziter `NETGRID_TOKEN_SALT` Pflicht; der lokale Default-Salt ist nicht zulässig. | V109-T017 |
| V109-MUST-018 | Must | Logs, Serverfehler, Health, E2E-Ausgaben und Diagnoseflächen redaktionieren Join-, Session- und Reconnect-Tokens sowie TokenHashes. | V109-T018, V109-T030 |
| V109-MUST-019 | Must | Join-URLs werden nicht vollständig mit Klartext-`joinToken` geloggt. | V109-T019 |
| V109-MUST-020 | Must | `Authorization: Bearer` bleibt für sessionToken-sensitive REST-Kommandos bevorzugt; Query-/Body-Token-Kompatibilität wird dokumentiert und darf nicht in Logs erscheinen. | V109-T020 |
| V109-MUST-021 | Must | `/health` bleibt redaktioniert und enthält keine Matchdaten, Tokens, TokenHashes, Decklisten, CardInstances, PrivatePayloads oder Hidden-Zone-Inhalte. | V109-T021, V109-T030 |
| V109-MUST-022 | Must | Health liefert nur sichere Betriebsbasissignale: Service, Storage-Art/Schema, optional Release/Profil und Realtime-Bereitschaft. | V109-T022 |
| V109-MUST-023 | Must | Detailliertere Diagnose ist nur als lokaler oder ausdrücklich geschützter Admin-/Ops-Pfad erlaubt und bleibt redaktioniert. | V109-T023 |
| V109-MUST-024 | Must | Startup-/Shutdown-/Storage-/Backup-/WebSocket-Ereignisse können strukturiert und redaktioniert geloggt werden. | V109-T024 |
| V109-MUST-025 | Must | V1.0.7/V1.0.8-E2E wird um internetnahe Konfiguration ergänzt: explizite Origins, Server/Web-Base-URLs, SQLite-Isolation und Leak-Scan. | V109-T025 |
| V109-MUST-026 | Must | Ein Origin-Negativtest, ein Rate-Limit-Test und ein Token-Redaction-Test sind Teil des automatisierten Gates. | V109-T026 |
| V109-MUST-027 | Must | Ein LAN-/VPS- oder äquivalenter Reverse-Proxy/TLS-Smoke wird als Release-Gate geplant und im Final Review dokumentiert. | V109-T027 |
| V109-MUST-028 | Must | Bestehende Human-vs-KI-, Human-vs-Human-, Lifecycle/Reconnect-, Viewport-, Storage- und Hidden-Info-Gates bleiben unverändert grün. | V109-T028 |
| V109-MUST-029 | Must | V1.0.9 führt keine Accounts, Public Discovery, Matchmaking, Rankings, Turniere, öffentliche Chat-/Moderationsfunktionen, Postgres-Pfade, neuen Karten oder neuen Mechaniken ein. | V109-T029 |
| V109-MUST-030 | Must | Keine neue Härtung darf `PlayerView`, `PublicEvents`, `LegalActions`, `applyAction`, Replay, StateHash oder AI-Input-Verträge aufweichen. | V109-T031 |
| V109-SHOULD-001 | Should | `.env.example` oder Betriebsdoku erklärt die privaten Internet-Variablen ohne echte Secrets. | V109-T032 |
| V109-SHOULD-002 | Should | Es gibt eine kurze private Deploy-Checkliste für Reverse Proxy, TLS, WSS, Origins, Salt, Storage, Backup und Smoke. | V109-T033 |
| V109-SHOULD-003 | Should | Forwarded-Header werden nur vertraut, wenn ein privater Proxy-/Trust-Modus explizit aktiviert ist. | V109-T034 |
| V109-SHOULD-004 | Should | Rate-Limits unterscheiden nach sensibler Aktion, nicht nur global nach IP. | V109-T035 |
| V109-SHOULD-005 | Should | Fehlercodes für Origin-, Rate-Limit- und unsichere Config-Fälle sind stabil benannt. | V109-T036 |
| V109-COULD-001 | Could | Ein lokaler Diagnosebefehl kann die Internet-Konfiguration prüfen, ohne den Server zu starten. | V109-T037 |

## Eingefrorene Releasepakete

| Paket | Name | Muss-Ergebnis |
| --- | --- | --- |
| V109-P1 | Transport und Deployment-Profil | Private Internet-Konfiguration verlangt sichere öffentliche Base-URLs und dokumentiert HTTPS/WSS. |
| V109-P2 | Origin/CORS/WebSocket | REST und WS akzeptieren nur erlaubte Origins. |
| V109-P3 | Rate Limits | Sensible Flows haben einfache Missbrauchsbremsen. |
| V109-P4 | Secrets/Tokens/Redaction | Internet-Salt ist Pflicht; Logs und Diagnosen leaken keine Tokens oder Hidden Info. |
| V109-P5 | Health/Monitoring/Ops | Health ist sicher, Ops-Signale sind minimal und redaktioniert. |
| V109-P6 | Internet-Smokes | Automatisierte und dokumentierte Smokes decken Internet-Risiken ab. |

## Konfigurationsentscheidung

| Variable | Bedeutung |
| --- | --- |
| `NETGRID_DEPLOYMENT_PROFILE` | `local` als Default, `private_internet` für gehärteten Internetbetrieb. |
| `NETGRID_WEB_BASE_URL` | öffentliche private Web-Origin; im Internet-Profil `https://...`. |
| `NETGRID_SERVER_BASE_URL` | öffentliche private Server-Origin; im Internet-Profil `https://...`. |
| `NETGRID_ALLOWED_ORIGINS` | kommaseparierte erlaubte Browser-Origins für REST und WS. |
| `NETGRID_TOKEN_SALT` | im Internet-Profil Pflicht, kein Default-Salt. |
| `NETGRID_RATE_LIMIT_PROFILE` | z. B. `off`, `local`, `private_internet`; Tests dürfen ein deterministisches Profil verwenden. |
| `NETGRID_TRUST_PROXY_HEADERS` | nur bei bewusstem Reverse-Proxy-Betrieb aktivieren. |
| `NETGRID_HEALTH_DETAIL` | `safe` als Default; detailliertere Diagnose nur lokal/geschützt. |

## Nicht-Ziele

- keine öffentlichen Plattformfunktionen,
- keine Accounts oder Benutzerverwaltung,
- keine persistente öffentliche Identität,
- kein globaler oder öffentlicher Chat,
- kein Spectator oder Public Replay,
- kein Matchmaking, Ranking oder Turnierbetrieb,
- keine neuen Regelmechaniken,
- keine neuen Karten oder Asset-Gates,
- keine Postgres-/Cloud-Persistenz,
- keine Änderung an Engine-, Replay-, StateHash-, Randomness- oder AI-Verträgen.

## Akzeptanz

V1.0.9 ist umsetzungsbereit, wenn diese Requirements, die Security-Spezifikation, die Ops-Spezifikation, die Testmatrix und das Requirements Review konsistent sind.

V1.0.9 ist abgeschlossen, wenn:

- alle Must-Anforderungen erfüllt sind,
- jede Must-Anforderung automatisiert oder durch einen dokumentierten Smoke abgedeckt ist,
- private Internet-Konfiguration ohne explizite sichere URLs, Origins und Token-Salt blockiert wird,
- Origin-, Rate-Limit- und Redaction-Tests grün sind,
- V1.0.7/V1.0.8-E2E weiter grün bleibt,
- keine Public-Platform-, Engine-, Karten- oder Mechanik-Ausweitung entstanden ist.
