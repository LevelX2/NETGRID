# Private Deployment Ops Spec 1.0.9

Stand: 2026-05-06
Status: spec

## Zweck

Diese Spezifikation beschreibt den privaten Betriebs- und Prüfumfang für V1.0.9. Sie ergänzt die Security-Spezifikation um konkrete Betriebsprofile, Health, Monitoring, Smoke-Checks und Zukunftsanschlüsse.

## Betriebsprofile

### Local Development

Zweck:

- lokale Entwicklung,
- automatisierte Tests,
- Codex-/Playwright-Smokes.

Eigenschaften:

- HTTP auf `127.0.0.1`,
- dynamische Ports erlaubt,
- lokale Origins erlaubt,
- deterministische Test-Rate-Limits erlaubt,
- temporäre SQLite-Datenbank für E2E,
- Default-Salt nur in lokalen Tests zulässig.

### Private Internet

Zweck:

- privat gehosteter Server für eingeladene Spieler,
- typischerweise hinter Reverse Proxy mit TLS.

Eigenschaften:

- Web und Server öffentlich nur über `https://`,
- Realtime über `wss://`,
- explizite Allowed Origins,
- expliziter Token-Salt,
- SQLite-Storage mit Backup-Pfad,
- redaktionierte Logs,
- Health ohne private Matchdaten,
- keine Public Discovery.

## Empfohlener Reverse-Proxy-Pfad

V1.0.9 muss keinen konkreten Proxy implementieren. Die Doku soll aber einen Zielvertrag festlegen:

```txt
Internet
  -> HTTPS Reverse Proxy
       /          -> Next.js Web
       /api, /ws  -> Netrunner Server
```

oder:

```txt
Internet
  -> HTTPS Web Origin
  -> HTTPS/WSS Server Origin
```

Wichtig:

- WebSocket-Upgrade für `/ws` funktioniert.
- Proxy leitet nur notwendige Header weiter.
- Forwarded-Headers werden in der App nur vertraut, wenn der Betreiber diesen Proxy kontrolliert.
- Logs des Proxy dürfen Join-URLs nicht unredaktioniert dauerhaft speichern; wenn das nicht kontrollierbar ist, muss dies als Betriebsrisiko dokumentiert werden.

## Health-Vertrag

`/health` bleibt der primäre sichere Verfügbarkeitscheck.

Zulässige Signale:

- `ok`,
- Service-Name,
- Release/Profil,
- Storage-Art,
- Storage-Schema-Version,
- Storage-Status grob,
- Realtime grundsätzlich aktiv,
- optional Build-/Version-String ohne Git-Secrets.

Nicht zulässig:

- MatchIds,
- Join-URLs,
- Session- oder Reconnect-Tokens,
- TokenHashes,
- Decklisten,
- private Decksnapshots,
- `GameState`,
- `cardInstances`,
- `privatePayload`,
- EventLog-Inhalte,
- Hidden-Zone-Daten.

## Diagnose und Monitoring

V1.0.9 bleibt minimal.

Soll-Signale:

- Server gestartet/gestoppt,
- Profil und sichere/unsichere Config,
- Storage geöffnet,
- Backup/Restore-Ereignisse,
- WebSocket-Verbindungen aggregiert,
- Origin-Ablehnungen aggregiert,
- Rate-Limit-Treffer aggregiert,
- unerwartete Serverfehler mit redaktioniertem Code.

Nicht Ziel:

- Metrikdatenbank,
- Tracing,
- Alerting-Plattform,
- Admin-UI,
- Moderations- oder Support-Konsole.

## Private Deploy-Checkliste

V1.0.9 soll eine kurze Checkliste liefern oder im Final Review ausfüllen:

1. Node 24 aktiv.
2. Dependencies installiert.
3. SQLite-Storage-Pfad liegt in privatem Runtime-Ordner.
4. Backup-Pfad existiert und Backup funktioniert.
5. `NETRUNNER_DEPLOYMENT_PROFILE=private_internet`.
6. `NETRUNNER_TOKEN_SALT` explizit gesetzt.
7. `NETRUNNER_WEB_BASE_URL=https://...`.
8. `NETRUNNER_SERVER_BASE_URL=https://...`.
9. `NETRUNNER_ALLOWED_ORIGINS` enthält die Web-Origin.
10. Reverse Proxy terminiert TLS und leitet WebSocket-Upgrade weiter.
11. `/health` ist erreichbar und redaktioniert.
12. Host erstellt Human-vs-Human-Lobby.
13. Joiner tritt über privaten Link bei.
14. Ready/Start funktioniert.
15. Reconnect nach Reload funktioniert.
16. Forfeit/Cancel/Recreate funktioniert.
17. Logs enthalten keine Tokens oder Hidden Info.

## Internet-Smoke

Automatisiert oder dokumentiert muss V1.0.9 mindestens prüfen:

- erlaubte Origin funktioniert,
- unbekannte Origin wird abgelehnt,
- WebSocket mit erlaubter Origin funktioniert,
- WebSocket mit unbekannter Origin erhält keine Bootstrap-Payload,
- Rate-Limit blockiert einen kontrollierten Missbrauchsfall,
- Health bleibt redaktioniert,
- E2E nutzt SQLite-Isolation,
- bestehende Zwei-Kontext-Flowabdeckung bleibt grün.

Wenn echter HTTPS/WSS-Smoke nicht vollständig automatisiert wird, ist ein manueller LAN-/VPS-Smoke im Final Review Pflicht. Er muss Datum, Profil, URLs, Browser/Clients, Ergebnis und Redaction-Befund enthalten.

## Zukunftsdesign

V1.0.9 soll spätere Phasen nicht blockieren:

- Origin-/Rate-Limit-/Redaction-Gates sollen adapterartig bleiben.
- Ein späteres Accountsystem darf diese Gates erweitern, aber nicht ersetzen.
- Ein späterer Public-Betrieb braucht neues Auth-, Datenschutz-, Moderations- und Abuse-Gate.
- Health und Logs bleiben so schmal, dass sie nicht zum versteckten Admin-Datenkanal werden.
- Rate-Limits dürfen später persistiert oder proxygestützt werden, müssen aber jetzt in-memory testbar bleiben.

## Akzeptanz

Die Ops-Spezifikation ist erfüllt, wenn:

- die Betriebsprofile trennscharf sind,
- Health und Diagnose sicher begrenzt sind,
- ein privater Deploy-/Smoke-Ablauf ausführbar beschrieben ist,
- Tests und Final Review die Internet-spezifischen Risiken sichtbar prüfen,
- keine öffentlichen Plattformannahmen eingeführt werden.
