# V1.0.9 Private Internet Hardening

Status: planning
Stand: 2026-05-06

## Ziel

V1.0.9 macht den privaten NETGRID-Betrieb für eingeladene Spieler über das Internet belastbar genug, ohne daraus eine öffentliche Plattform zu machen.

Der Release härtet die Ränder des bestehenden privaten Systems: Transport, erlaubte Browser-Ursprünge, einfache Missbrauchsbremsen, Secrets, Logs, Healthchecks, Betriebsdiagnose und reproduzierbare Internet-Smokes. Die Rules Engine, Karten, Mechaniken, Replay, StateHash, Randomness, Decklegalität und KI-Regelautorität bleiben unverändert.

## Produktentscheidung

V1.0.9 ist ein privater Internet-Betriebsrelease.

Erlaubt ist:

- ein privater HTTPS/WSS-Betriebspfad für eingeladene Spieler,
- eine konfigurierbare erlaubte Web-Origin,
- harte Ablehnung unsicherer Internet-Konfigurationen,
- einfache Rate-Limits für sensible Endpunkte und WebSocket-Handshake,
- redaktionierte Logs, Health- und Diagnoseausgaben,
- eine private Deploy- und Smoke-Checkliste für LAN/VPS.

Nicht erlaubt ist:

- öffentliche Lobby oder Matchsuche,
- Accounts, Profile, Freundeslisten oder öffentliche Identitäten,
- Matchmaking, Rankings, Turniere oder Zuschauer,
- öffentlicher Chat oder Moderation,
- neue Karten, Mechaniken, offizielle Assets oder breite Kartendaten,
- Postgres, Cloud-Skalierung oder Public-Scale-Betrieb als Pflicht.

## Prüfbasis

Aktueller Stand vor V1.0.9:

- V1.0.8 Storage/Backup-Härtung ist umgesetzt und lokal verifiziert.
- SQLite ist privater lokaler Standard-Storage; JSON bleibt Legacy/Test/Migration.
- `apps/server/src/http-server.ts` startet lokal per `HOST`/`PORT` und erzeugt Join-URLs über `NETGRID_WEB_BASE_URL`.
- REST und WebSocket sind bereits serverautoritativ und tokenbasiert.
- Session-, Reconnect- und Join-Tokens werden als Hashes persistiert; Klartext-Tokens werden nur bei Erstellung/Join/Reconnect an die berechtigte Seite ausgegeben.
- `setCors` erlaubt derzeit pauschal `access-control-allow-origin: *`; das ist für privaten Internetbetrieb zu offen.
- WebSocket-Verbindungen prüfen aktuell keine explizite Origin.
- `startNETGRIDServer` liefert eine `http://`-URL; Internetbetrieb soll hinter TLS-fähigem Reverse Proxy oder gleichwertigem privatem HTTPS/WSS-Pfad laufen.
- V1.0.7/V1.0.8-E2E deckt lokale zwei Browser-Kontexte, Viewports, Lifecycle/Reconnect und Leak-Scans ab.
- E2E-Logs werden bereits auf Token- und Hash-Muster redaktioniert.
- `/health` liefert sichere Basissignale inklusive Storage-Health; V1.0.9 muss daraus einen internetgeeigneten Health-Vertrag machen.

## Releasepakete

### Paket 1: Transport und Deployment-Profil

Funktion:

- Definiert, wie die App privat über Internet betrieben werden darf.
- Erzwingt oder dokumentiert HTTPS/WSS außerhalb von `localhost`/LAN-Entwicklung.
- Trennt lokale Entwicklung von privatem Internetbetrieb.

Muss klären:

- zulässige `NETGRID_WEB_BASE_URL` und `NETGRID_SERVER_BASE_URL`,
- Verhalten bei unsicherem `http://`/`ws://` in Internet-Profilen,
- Reverse-Proxy-Annahmen für TLS und WebSocket-Upgrade,
- Host-/Port-Bindung für `127.0.0.1`, LAN und privaten Server,
- keine automatische Public-Discovery.

### Paket 2: Origin-, CORS- und WebSocket-Zugriff

Funktion:

- Stellt sicher, dass Browser-Anfragen nur von erlaubten privaten Web-Ursprüngen akzeptiert werden.
- Härtet REST und WebSocket-Handshakes gegen fremde Webseiten.

Muss klären:

- `NETGRID_ALLOWED_ORIGINS` als explizite Allowlist,
- lokale Defaults für Entwicklung,
- Ablehnung unbekannter Origins mit side-sicherem Fehler,
- `OPTIONS`/Preflight-Verhalten,
- WebSocket-Origin-Prüfung für `/ws`,
- keine Token-, Match- oder Hidden-Info-Daten in Ablehnungsantworten.

### Paket 3: Rate Limits und einfache Abuse-Bremsen

Funktion:

- Bremst Token-Raten, Join-Spam, Reconnect-Schleifen und WebSocket-Verbindungsfluten.
- Bleibt bewusst einfach und lokal, ohne Accountsystem.

Muss klären:

- Limits für Match-Erstellung, Join-Info, Join, Reconnect, Bootstrap, Lifecycle-Kommandos, AI-Advance und WebSocket-Join,
- Schlüsselung nach IP/Forwarded-Client, MatchId und sensibler Aktion,
- sichere Behandlung von Reverse-Proxy-Forwarded-Headers,
- Retry-Antworten ohne Datenleak,
- Testbarkeit ohne instabile Timer-Flakes.

### Paket 4: Secrets, Tokens und Redaction

Funktion:

- Macht den Internetbetrieb secrets-bewusst.
- Verhindert Token-, Hash-, Decklisten- oder Hidden-Info-Leaks in Logs, Fehlern, Health, Browser-Speicher, E2E-Ausgaben und Diagnoseflächen.

Muss klären:

- `NETGRID_TOKEN_SALT` ist im Internet-Profil Pflicht und darf nicht der lokale Default sein,
- Join-URLs bleiben private Einladungstokens und dürfen nicht geloggt werden,
- `Authorization: Bearer` wird bevorzugt, Query-Token-Kompatibilität wird bewertet und eingegrenzt,
- Log-Redaction für Tokens, TokenHashes, Join-URLs, Decksnapshots, `cardInstances`, `privatePayload`,
- keine Klartext-Secrets in `.env.example` oder Dokumentation.

### Paket 5: Healthchecks, Monitoring und Betriebsdiagnose

Funktion:

- Gibt dem privaten Betreiber sichere Signale, ob Web, Server, Storage und Realtime grundsätzlich funktionieren.
- Bleibt minimal, redaktioniert und ohne Admin-UI.

Muss klären:

- `/health` für sichere öffentliche oder proxyinterne Verfügbarkeit,
- optionaler detaillierter lokaler Diagnosepfad nur mit expliziter Schutzentscheidung,
- strukturierte Startup-/Shutdown-/Storage-/Backup-/WebSocket-Ereignisse,
- keine Matchinhalte, keine Decklisten, keine Tokens, keine Hidden-Zone-Daten,
- Betriebscheckliste für Backup, Restore und Neustart.

### Paket 6: Internet-Smoke, Stabilität und Zukunftsdesign

Funktion:

- Macht V1.0.9 nicht nur konzeptionell, sondern testbar.
- Baut auf dem V1.0.7/V1.0.8-Browser-Gate auf.

Muss klären:

- lokaler TLS-/Proxy-Smoke oder äquivalenter simulierter Internet-Smoke,
- LAN-/VPS-Checkliste für zwei echte Browser/Geräte,
- Origin-Ablehnung, Rate-Limit, Token-Redaction und WSS-Smokes,
- bestehende Human-vs-KI-, Human-vs-Human-, Lifecycle/Reconnect- und Leak-Flows bleiben grün,
- keine neuen Engine-, Karten- oder Regelabhängigkeiten.

## Zielarchitektur

```txt
Browser
  -> HTTPS Web Origin
       -> Next.js Web UI
       -> WSS / REST zur privaten Server-Origin
            -> Origin Gate
            -> Rate Limit Gate
            -> Token/Session Gate
            -> MultiplayerService
                 -> Rules Engine
                 -> SQLite Storage
```

V1.0.9 führt keine neue Regelkomponente ein. Die neuen Gates sitzen vor der bestehenden REST-/WebSocket-Schicht und dürfen nur ablehnen, redaktionieren oder Betriebsinformationen liefern.

## Nicht-Ziele

- keine Accounts,
- keine öffentlichen Nutzerprofile,
- keine öffentliche Lobbyliste,
- kein Matchmaking,
- keine Rankings,
- keine Turniere,
- kein Spectator,
- kein öffentlicher Chat,
- keine Moderationskonsole,
- keine neue KI-Entscheidungslogik,
- keine neuen Karten, Mechaniken, offiziellen Assets oder Kartendaten,
- keine Änderung an Replay, StateHash, RandomCounter oder RandomDrawRecords,
- keine Änderung daran, dass `applyAction` die einzige Regeltransition ausführt.

## Teststrategie

V1.0.9 braucht drei Testschichten:

1. Server-/Contract-Tests für Origin, Rate Limits, Konfiguration, Health und Redaction.
2. E2E-Smokes über den bestehenden Playwright-Gate mit internetnahen Env-Settings.
3. Dokumentierter LAN-/VPS-Betriebssmoke, falls echter TLS-/Reverse-Proxy-Betrieb nicht vollständig automatisiert wird.

Pflicht bleibt:

- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm e2e`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`

## Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Falsche Origin-Policy sperrt lokale Entwicklung oder echte private Spieler aus. | mittel | Profiltrennung: local dev erlaubt lokale Origins; private internet verlangt explizite Allowlist. |
| Zu weiche Origin-/CORS-Regeln lassen fremde Webseiten mitspielen. | hoch | Keine `*`-Origin im Internet-Profil; WebSocket-Origin-Prüfung; Contract-Tests. |
| Rate Limits erzeugen flaky Tests oder blockieren legitime Reconnects. | mittel | Testbare Clock/Window-Strategie; großzügige Defaults; gezielte Limits nur auf sensible Flows. |
| Tokens landen in Logs, URLs, Health oder E2E-Ausgaben. | hoch | Redaction-Helfer, Leak-Scans, Query-Token-Bewertung, keine Tokenausgabe in Errors. |
| HTTPS/WSS wird nur dokumentiert, aber nicht realistisch geprüft. | hoch | Proxy-/TLS-Smoke oder klarer manueller LAN/VPS-Drill mit Ergebnis im Final Review. |
| V1.0.9 wird heimlich zum Public-Platform-Start. | hoch | Non-Scope-Gate und Scope-Regressionstest gegen Accounts, Lobbylisting, Matchmaking, Chat, Ranking und Turnierpfade. |

## Dokumentationsbedarf

V1.0.9 ist geplant, wenn folgende Dokumente konsistent vorliegen:

- `docs/derived/V1_0_9_PRIVATE_INTERNET_HARDENING_PLAN.md`
- `docs/derived/V1_0_9_REQUIREMENTS.md`
- `docs/derived/PRIVATE_INTERNET_SECURITY_1_0_9_SPEC.md`
- `docs/derived/PRIVATE_DEPLOYMENT_OPS_1_0_9_SPEC.md`
- `docs/derived/V1_0_9_TEST_MATRIX.md`
- `docs/derived/V1_0_9_REQUIREMENTS_REVIEW.md`

Nach Umsetzung sollen ergänzt werden:

- `docs/derived/V1_0_9_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_9_FINAL_REVIEW.md`

## Akzeptanzkriterien

V1.0.9 ist umsetzungsbereit, wenn:

- die sechs Releasepakete abgebildet sind,
- jede Must-Anforderung eine Testspur hat,
- die Security-/Deployment-Spezifikationen keine Engine- oder Public-Platform-Ausweitung enthalten,
- die Requirements Review bestätigt, dass Funktion, Teststabilität und Zukunftsdesign ausreichend bis sehr gut abgedeckt sind.

V1.0.9 ist done, wenn:

- privater Internetbetrieb mit expliziter Origin und HTTPS/WSS-Pfad dokumentiert und geprüft ist,
- REST und WebSocket unbekannte Origins ablehnen,
- sensible Endpunkte einfache Rate-Limits besitzen,
- Internet-Profil ohne eigenen Token-Salt nicht startet oder klar blockiert,
- Health/Logs/Fehler/E2E-Ausgaben redaktioniert bleiben,
- LAN-/VPS- oder äquivalenter Proxy-Smoke bestanden ist,
- bestehende Engine-, Visibility-, Replay-, Storage- und Browser-Gates grün bleiben.
