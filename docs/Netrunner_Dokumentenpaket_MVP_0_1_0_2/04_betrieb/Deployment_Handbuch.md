# Netrunner-Webapplikation – Deployment-Handbuch für privaten Betrieb

**Status:** Soll-Dokument für MVP 0.2  
**Stand:** 03.05.2026  
**Geltungsbereich:** lokaler, LAN- und privater Serverbetrieb  
**Primäres Ziel:** reproduzierbarer und sicherer privater Betrieb ohne öffentliche Plattformfunktionen

## 1. Zweck

Dieses Dokument beschreibt, wie die Anwendung privat betrieben werden soll. Es deckt lokale Nutzung, LAN-Betrieb und privaten Serverbetrieb ab. Es ersetzt keine produktive Sicherheitszertifizierung für eine öffentliche Plattform.

## 2. Betriebsarten

| Betriebsart | Beschreibung | Mindestanforderung |
|---|---|---|
| Lokal | Ein Rechner, zwei Browserfenster | HTTP/WS zulässig, Dev-Secrets nur lokal. |
| LAN | Zwei Geräte im Heimnetz | Stabile Hostadresse, Firewall beachten. |
| Privater Server | Zugriff über Internet für eingeladene Spieler | HTTPS/WSS, starke Secrets, Backups. |
| Docker | Reproduzierbarer Start | Persistentes Volume für SQLite. |

## 3. Nicht-Ziele

Nicht abgedeckt:

- öffentliche Nutzerregistrierung,
- Matchmaking,
- Ranglisten,
- Moderation,
- Turnierbetrieb,
- Abuse-Handling für öffentliche Plattform,
- horizontale Skalierung,
- Hochverfügbarkeit.

## 4. Konfiguration

Beispiel für privaten Server:

```env
NODE_ENV=production
APP_BASE_URL=https://netrunner.example.internal
SERVER_PORT=3000
DATABASE_URL=file:/app/data/netrunner.sqlite
SESSION_SECRET=<strong-random-secret>
TOKEN_HASH_SECRET=<strong-random-secret>
MULTIPLAYER_PROTOCOL_VERSION=0.2.0
ENGINE_SCHEMA_VERSION=0.2.0
PLAYER_VIEW_SCHEMA_VERSION=0.2.0
EVENT_SCHEMA_VERSION=0.2.0
DEBUG_ACCESS_MODE=server_console_only
ALLOW_FULL_STATE_DEBUG=false
RATE_LIMIT_ENABLED=true
TRUST_PROXY=true
ALLOWED_ORIGINS=https://netrunner.example.internal
```

Regeln:

- Secrets müssen hohe Entropie haben.
- Secrets dürfen nicht im Repository liegen.
- `ALLOW_FULL_STATE_DEBUG=false` im privaten Internetbetrieb.
- `ALLOWED_ORIGINS` einschränken.
- SQLite-Datei in persistentes Volume legen.

## 5. TLS und WebSocket

Außerhalb localhost gilt:

- HTTPS für REST,
- WSS für WebSocket,
- keine Klartexttokens über unverschlüsseltes Netzwerk,
- Reverse Proxy muss WebSocket Upgrade unterstützen.

Beispiel Reverse-Proxy-Anforderungen:

```text
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
```

## 6. Docker-Sollstruktur

Beispielhafte Verzeichnisstruktur:

```text
/deploy
  docker-compose.yml
  .env
  /data
    netrunner.sqlite
    backups/
```

Beispiel `docker-compose.yml` als Zielbild:

```yaml
services:
  netrunner:
    image: netrunner-app:0.2.0
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

## 7. Start und Smoke Test

Nach Deployment:

1. Health Endpoint prüfen.
2. Neues privates Match erstellen.
3. Invite-Link in zweitem Browser öffnen.
4. Beide WebSockets verbinden.
5. Eine einfache Action ausführen.
6. StateVersion auf beiden Clients prüfen.
7. Serverlog auf Token-/Full-State-Leaks prüfen.
8. Backup-Datei oder SQLite-Datei prüfen.

## 8. Backup

Für MVP 0.2 reicht ein pragmatisches SQLite-Backup.

Empfohlen:

- regelmäßiges Kopieren der SQLite-Datei bei gestopptem Server oder über SQLite-kompatible Backupmethode,
- Backup vor Migration,
- Backup vor Update,
- Backup nicht öffentlich ablegen,
- Backups enthalten private Spielinformationen und sind entsprechend zu schützen.

Backup-Inhalt:

- Matches,
- GameState,
- EventLogs,
- Snapshots,
- Sessions und Tokenhashes,
- ActionReceipts,
- UndoRequests.

Klartexttokens sollten auch im Backup nicht enthalten sein.

## 9. Update und Rollback

### 9.1 Update

1. Aktive Matches beenden oder pausieren.
2. Backup erstellen.
3. Neue Version deployen.
4. Migrationen ausführen.
5. Smoke Test durchführen.
6. Replay-Test für mindestens ein bestehendes Replay ausführen.

### 9.2 Rollback

1. Server stoppen.
2. Vorheriges Image/Build aktivieren.
3. Passendes Backup wiederherstellen.
4. Migration-Kompatibilität prüfen.
5. Smoke Test ausführen.

Rollback ist schwierig, wenn Migrationen nicht rückwärtskompatibel sind. Deshalb vor Migration Backup erstellen.

## 10. Logging im Betrieb

Logs dürfen enthalten:

- Start/Stop,
- Versionen,
- Health-Status,
- MatchId,
- StateVersion,
- Fehlercode,
- ConnectionStatus,
- Dauer von Requests.

Logs dürfen nicht enthalten:

- Klartexttokens,
- vollständigen GameState,
- private Payloads beider Seiten,
- verdeckte Kartentitel im falschen Kontext,
- SQL-Dumps mit Tokens,
- komplette WebSocket-Payloads ungefiltert.

## 11. Rate Limits

Empfohlene Limits:

| Aktion | Limit |
|---|---:|
| Match erstellen | 10 pro Stunde/IP |
| Join-Versuche | 20 pro Stunde/Match oder IP |
| WebSocket Join | 30 pro Stunde/Match |
| Submit Action | 5 pro Sekunde/Session plus Idempotency |
| Reconnect | 30 pro Stunde/Session |

Im privaten Betrieb dienen Limits vor allem dem Schutz gegen Bugs, Spam und versehentliche Doppelsendungen.

## 12. Monitoring und Health

Mindestsignale:

- Server läuft,
- Storage erreichbar,
- Migrationen aktuell,
- WebSocket Gateway aktiv,
- aktive Matchanzahl,
- Fehlerzähler nach Code,
- durchschnittliche Action-Verarbeitungszeit.

Nicht in öffentlichen Health-Ausgaben enthalten:

- Matchdetails,
- Playernamen, falls vermeidbar,
- StateHashes aktiver Partien,
- Tokens,
- private Karteninformationen.

## 13. Betrieb bei Serverneustart

Nach Neustart:

- aktive Matches laden,
- abgelaufene Locks bereinigen,
- StateHash prüfen,
- pending Matches in `paused_disconnect` setzen, falls Verbindungen fehlen,
- Reconnect erlauben,
- nicht wiederherstellbare Matches als debugpflichtig markieren.

## 14. Sicherheitscheck vor privatem Internetbetrieb

```text
[ ] HTTPS/WSS aktiv
[ ] ALLOWED_ORIGINS gesetzt
[ ] starke Secrets gesetzt
[ ] DEBUG_ACCESS_MODE nicht local_dev_only im Internet
[ ] ALLOW_FULL_STATE_DEBUG=false
[ ] Token werden nicht geloggt
[ ] SQLite liegt in persistentem geschütztem Volume
[ ] Backup-Verfahren geprüft
[ ] Rate Limits aktiv
[ ] Visibility-Tests bestanden
[ ] E2E-Smoke-Test bestanden
```

## 15. Betriebsabnahme

Der private Betrieb gilt als MVP-0.2-tauglich, wenn:

- ein Match über privaten Link erstellt und gespielt werden kann,
- WebSocket über WSS außerhalb localhost funktioniert,
- Reconnect nach Browserneustart funktioniert,
- Serverneustart aktive Matches entweder wiederherstellt oder sauber pausiert,
- Backups erstellt und testweise wiederhergestellt werden können,
- Logs keine Tokens oder privaten Kartendaten enthalten,
- Debug-Full-State nicht im normalen Spielerclient verfügbar ist.
