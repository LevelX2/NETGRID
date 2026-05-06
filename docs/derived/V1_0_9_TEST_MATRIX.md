# V1.0.9 Test Matrix - Private Internet Hardening

Stand: 2026-05-06
Status: Requirements-Freeze-Testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V109-T001 | Deployment Profile | V109-MUST-001 | `local` und `private_internet` sind unterscheidbar; Default bleibt für lokale Entwicklung nutzbar. |
| V109-T002 | Required Base URLs | V109-MUST-002 | Internet-Profil ohne explizite Web-/Server-Base-URL wird abgelehnt. |
| V109-T003 | HTTPS/WSS Config | V109-MUST-003 | Internet-Profil akzeptiert nur sichere öffentliche HTTPS/WSS-Zielkonfiguration. |
| V109-T004 | Local HTTP Exception | V109-MUST-003, V109-MUST-004 | Lokale HTTP/E2E-URLs bleiben erlaubt, solange das Profil lokal ist. |
| V109-T005 | Unsafe Config Rejection | V109-MUST-005 | Unsichere Internet-Konfiguration blockiert Start oder Config-Check mit redaktioniertem Fehler. |
| V109-T006 | REST CORS Allowlist | V109-MUST-006 | REST antwortet im Internet-Profil nicht mit `access-control-allow-origin: *`. |
| V109-T007 | Multiple Allowed Origins | V109-MUST-007 | Mehrere konfigurierte Origins werden exakt akzeptiert. |
| V109-T008 | Preflight Contract | V109-MUST-008 | OPTIONS erlaubt nur notwendige Methoden/Header und keine breite Wildcard-Policy. |
| V109-T009 | REST Origin Negative | V109-MUST-009 | Unbekannte Origin wird abgelehnt ohne Match-/Token-/Hidden-Info-Daten. |
| V109-T010 | WebSocket Origin Allow | V109-MUST-010 | WebSocket mit erlaubter Origin kann joinen und erhält side-sichere Payloads. |
| V109-T011 | WebSocket Origin Deny | V109-MUST-011 | WebSocket mit unbekannter Origin erhält keine Bootstrap- oder Match-Payload. |
| V109-T012 | Rate-Limit Framework | V109-MUST-012 | Rate-Limit-Gate ist vorhanden und deterministisch testbar. |
| V109-T013 | Sensitive REST Limits | V109-MUST-013 | Match-Erstellung, Join, Reconnect, Bootstrap, Lifecycle und AI-Advance sind abgedeckt. |
| V109-T014 | WebSocket Rate Limit | V109-MUST-014 | WS-Handshakes oder `join_match` werden gegen Missbrauch begrenzt. |
| V109-T015 | Rate-Limit Redaction | V109-MUST-015 | Rate-Limit-Fehler enthalten keine Tokens, Decklisten oder Hidden Info. |
| V109-T016 | Stable Rate-Limit Tests | V109-MUST-016 | Tests nutzen kurze/deterministische Fenster und sind nicht zeitflaky. |
| V109-T017 | Token Salt Required | V109-MUST-017 | Internet-Profil ohne expliziten Salt oder mit lokalem Default-Salt wird abgelehnt. |
| V109-T018 | Log/Error Redaction | V109-MUST-018 | Logs, Fehler, Health und E2E-Ausgaben redaktionieren Token- und Hash-Muster. |
| V109-T019 | Join URL Redaction | V109-MUST-019 | Join-URLs erscheinen in Logs nur ohne Klartext-Token. |
| V109-T020 | Bearer/Query Token Contract | V109-MUST-020 | Session-sensitive REST-Kommandos bevorzugen Bearer; Query-/Body-Kompatibilität leakt nicht. |
| V109-T021 | Health Redaction | V109-MUST-021 | `/health` enthält keine Matchdaten, Tokens, Decklisten, CardInstances oder PrivatePayloads. |
| V109-T022 | Health Safe Signals | V109-MUST-022 | `/health` liefert nur sichere Betriebsbasissignale. |
| V109-T023 | Protected Diagnostics | V109-MUST-023 | Detaillierte Diagnose ist lokal/geschützt oder nicht verfügbar; nie side-unsicher. |
| V109-T024 | Structured Redacted Ops Logs | V109-MUST-024 | Startup-/Storage-/WS-/RateLimit-Logs sind redaktioniert. |
| V109-T025 | Internet-like E2E Config | V109-MUST-025 | E2E kann mit expliziten Origins/Base-URLs/SQLite-Isolation laufen. |
| V109-T026 | Internet Negative Tests | V109-MUST-026 | Origin-Negativtest, Rate-Limit-Test und Token-Redaction-Test laufen automatisiert. |
| V109-T027 | LAN/VPS or Proxy Smoke | V109-MUST-027 | Final Review dokumentiert echten oder äquivalenten privaten Internet-Smoke. |
| V109-T028 | V1.x Regression | V109-MUST-028 | Human-vs-KI, Human-vs-Human, Lifecycle/Reconnect, Viewports, Storage und Hidden-Info-Gates bleiben grün. |
| V109-T029 | Scope Regression | V109-MUST-029 | Keine Accounts, Public-Lobby, Matchmaking, Ranking, Turnier, Chat, Postgres, Karten oder Mechaniken entstehen. |
| V109-T030 | Combined Leak Scan | V109-MUST-009, V109-MUST-011, V109-MUST-015, V109-MUST-018, V109-MUST-021 | REST, WS, Health, Errors, Logs, DOM, Storage und E2E-Ausgabe enthalten keine Token-/Hidden-Info-Muster. |
| V109-T031 | Engine Contract Regression | V109-MUST-030 | `PlayerView`, `PublicEvents`, `LegalActions`, `applyAction`, Replay, StateHash und AI-Input-Verträge bleiben unverändert. |
| V109-T032 | Env Docs | V109-SHOULD-001 | Beispiel-/Betriebsdoku erklärt Variablen ohne echte Secrets. |
| V109-T033 | Deploy Checklist | V109-SHOULD-002 | Private Deploy-Checkliste ist vorhanden und im Final Review geprüft. |
| V109-T034 | Proxy Header Trust | V109-SHOULD-003 | Forwarded-Headers werden nur in explizitem Trust-Modus verwendet. |
| V109-T035 | Per-Action Limits | V109-SHOULD-004 | Limits sind nach sensibler Aktion unterscheidbar. |
| V109-T036 | Stable Error Codes | V109-SHOULD-005 | Origin-, RateLimit- und Config-Fehlercodes sind stabil. |
| V109-T037 | Config Diagnose | V109-COULD-001 | Falls vorhanden, prüft ein lokaler Diagnosebefehl die Internet-Konfiguration redaktioniert. |

## Pflicht-Server-/Contract-Tests

- Internet-Profil ohne sichere Base-URLs ablehnen.
- Internet-Profil ohne Allowed Origins ablehnen.
- Internet-Profil ohne expliziten Token-Salt ablehnen.
- Lokales Profil mit `127.0.0.1` weiter erlauben.
- REST mit erlaubter Origin akzeptieren.
- REST mit unbekannter Origin ablehnen.
- OPTIONS/Preflight korrekt und schmal beantworten.
- WebSocket mit erlaubter Origin akzeptieren.
- WebSocket mit unbekannter Origin ablehnen, bevor Matchdaten gesendet werden.
- Rate-Limit für Match-Erstellung.
- Rate-Limit für Join/Reconnect/Bootstrap.
- Rate-Limit für WebSocket-Join oder Handshake.
- Rate-Limit-Fehler redaktionieren.
- Health redaktioniert halten.
- Logs/Fehler/Join-URLs redaktionieren.

## Pflicht-E2E-/Regression-Checks

- `corepack pnpm e2e` bleibt grün.
- E2E nutzt SQLite-Testdatenbank und explizite Base-URLs.
- Human-vs-KI Desktop.
- Human-vs-Human mit zwei Browser-Kontexten.
- Lifecycle/Reconnect.
- Tablet und schmaler Viewport.
- DOM-/LocalStorage-/WebSocket-Leak-Scan.
- Health-Leak-Scan.
- Internet-nahe Origin- und Redaction-Negativtests.

## Pflicht-Ops-Smoke

Im Final Review muss mindestens einer dieser Pfade dokumentiert sein:

- echter privater LAN-/VPS-Smoke mit HTTPS/WSS,
- lokaler Reverse-Proxy/TLS-Smoke,
- begründeter äquivalenter Smoke, wenn TLS im aktuellen Arbeitsumfeld nicht automatisierbar ist.

Der Smoke muss prüfen:

- `/health`,
- Host erstellt Lobby,
- Joiner tritt bei,
- Ready/Start,
- Reconnect nach Reload,
- Lifecycle-Kommando,
- Logs/Health/Payloads redaktioniert.

## Pflicht-Projektchecks für Umsetzung

- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm e2e`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_9_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
