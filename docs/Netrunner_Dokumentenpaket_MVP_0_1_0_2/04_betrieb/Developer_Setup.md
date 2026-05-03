# Netrunner-Webapplikation – Developer Setup

**Status:** Soll-Dokument für lokale Entwicklung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Zweck:** reproduzierbare lokale Entwicklungs- und Testumgebung

## 1. Zweck

Dieses Dokument beschreibt die Zielstruktur für ein lokales Entwickler-Setup. Es ist als Soll-Anleitung zu verstehen und muss an die konkrete Repository-Implementierung angepasst werden, sobald Paketmanager, Framework und Befehle final feststehen.

## 2. Zielumgebung

Empfohlene technische Basis:

| Bereich | Empfehlung |
|---|---|
| Runtime | Node.js LTS |
| Sprache | TypeScript |
| Frontend | Next.js/React |
| Backend | Node.js/TypeScript |
| WebSocket | native `ws` oder Socket.io |
| Tests | Vitest oder Jest, Playwright für E2E |
| Storage MVP 0.2 | SQLite |
| Paketstruktur | Monorepo mit `packages/` und `apps/` |

## 3. Repository-Zielstruktur

```text
/netrunner-app
  package.json
  tsconfig.base.json
  /packages
    /engine
    /shared
    /ai
  /apps
    /server
    /web
  /data
    /cards
    /decks
    /manifests
    /scenarios
  /docs
  /scripts
```

## 4. Lokale Konfiguration

Beispiel `.env.local`:

```env
NODE_ENV=development
APP_BASE_URL=http://localhost:3000
SERVER_PORT=3000
DATABASE_URL=file:./data/dev-netrunner.sqlite
SESSION_SECRET=dev-only-change-me
TOKEN_HASH_SECRET=dev-only-change-me-too
MULTIPLAYER_PROTOCOL_VERSION=0.2.0
ENGINE_SCHEMA_VERSION=0.2.0
PLAYER_VIEW_SCHEMA_VERSION=0.2.0
EVENT_SCHEMA_VERSION=0.2.0
DEBUG_ACCESS_MODE=local_dev_only
ALLOW_FULL_STATE_DEBUG=false
RATE_LIMIT_ENABLED=false
```

Regeln:

- `.env.local` nicht committen.
- Dev-Secrets dürfen nicht im privaten Serverbetrieb wiederverwendet werden.
- `ALLOW_FULL_STATE_DEBUG=true` nur lokal und nie für normale Spielerclients verwenden.

## 5. Installation

Soll-Befehle, abhängig vom gewählten Paketmanager:

```bash
npm install
# oder
pnpm install
```

Prüfen:

```bash
node --version
npm --version
```

## 6. Lokaler Start

Zielbefehle:

```bash
npm run dev
npm run dev:server
npm run dev:web
```

Erwartung:

- Web UI startet auf lokalem Port.
- Server API startet auf lokalem Port.
- SQLite-Datei wird angelegt oder migriert.
- Health Endpoint antwortet ohne Matchdaten.
- Neues Demo-Spiel kann gestartet werden.

## 7. Datenbank vorbereiten

Soll-Befehle:

```bash
npm run db:migrate
npm run db:reset:dev
npm run db:seed:demo
```

Regeln:

- `db:reset:dev` löscht nur lokale Entwicklungsdaten.
- Migrationsschema wird in `schema_migrations` protokolliert.
- Demo-Seeds und Demo-Decks werden versioniert abgelegt.

## 8. Testausführung

### 8.1 Schnelle Tests

```bash
npm run test:unit
```

Umfang:

- Engine-Funktionen,
- Resolver,
- Kosten,
- Targets,
- StateHash,
- Karten-Unit-Tests,
- PlayerView-Filter.

### 8.2 Szenariotests

```bash
npm run test:scenario
```

Umfang:

- Runner-Sieg,
- Corp-Sieg,
- Run/Access,
- Demo-Karten,
- Replay.

### 8.3 Integrationstests

```bash
npm run test:integration
```

Umfang:

- REST Create/Join/Bootstrap,
- WebSocket Join/Action,
- Storage,
- Idempotency,
- Locking.

### 8.4 Visibility-Tests

```bash
npm run test:visibility
```

Umfang:

- alle PlayerViews,
- REST-Payloads,
- WebSocket-Payloads,
- Errors,
- Undo,
- Reconnect,
- EventLog.

### 8.5 E2E-Tests

```bash
npm run test:e2e
```

Umfang:

- zwei Browserkontexte,
- Match erstellen,
- Join,
- Spielaktionen,
- Reconnect,
- Undo,
- Beispielpartie.

## 9. Linting und Type Checks

Soll-Befehle:

```bash
npm run typecheck
npm run lint
npm run format:check
```

Pflicht vor Merge:

- Typecheck bestanden,
- Lint bestanden,
- keine ungenutzten Debug-Full-State-Ausgaben,
- keine Klartexttokens in Testsnapshots.

## 10. Lokales Debugging

Erlaubt lokal:

- StateVersion anzeigen,
- StateHash anzeigen,
- TimingPoint anzeigen,
- EventLog vollständig im Serverterminal prüfen,
- Replay-Runner ausführen,
- Testfixtures inspizieren.

Nicht erlaubt im normalen Spielerclient:

- vollständiger GameState,
- gegnerische private Karten,
- Token/Tokenhashes,
- private Payloads der Gegenseite.

## 11. Replay-Runner

Soll-Befehl:

```bash
npm run replay -- --file ./data/replays/demo.json
```

Erwartung:

- initialer Snapshot wird geladen,
- Events werden deterministisch angewendet,
- finaler StateHash wird verglichen,
- Abweichungen geben EventId und StateVersion aus.

## 12. Lokaler Multiplayer-Test

Ablauf:

1. Server und Web UI starten.
2. Browser A im normalen Profil öffnen.
3. Browser B in Incognito oder anderem Profil öffnen.
4. Browser A erstellt Match als Runner.
5. Browser B tritt über Invite-Link als Corp bei.
6. Beide Seiten prüfen, dass sie nur ihre PlayerView sehen.
7. Demo-Testskript ausführen.

## 13. Häufige lokale Probleme

| Problem | Mögliche Ursache | Lösung |
|---|---|---|
| WebSocket verbindet nicht | falsche URL oder CORS/Origin | `APP_BASE_URL` und Serverport prüfen. |
| Join schlägt fehl | Token abgelaufen oder bereits verwendet | Neues Match erstellen, Logs ohne Token prüfen. |
| StateVersion stale | alter Browserzustand | Reload/Reconnect; prüfen, ob UI Actions nach Send deaktiviert. |
| Replay-Hash falsch | nondeterministische Serialisierung oder RandomCounter | Canonical JSON und RandomDrawRecords prüfen. |
| Visibility-Test schlägt fehl | privates Feld im Payload | Filter zentral korrigieren, nicht UI kaschieren. |
| SQLite locked | fehlende Transaktion/Locking | Action-Pipeline und DB-Verbindungen prüfen. |

## 14. Entwicklungsregeln

- Neue Engine-Mechanik erst mit Unit-Test.
- Neue Karte erst mit Manifest-Eintrag.
- Neue WebSocket-Message erst mit Schema-Test.
- Neue PlayerView-Felder erst mit Visibility-Test.
- Neue Persistenzfelder erst mit Migration.
- Neue Undo-Barrier erst mit Undo-Test.
- Neue Debugausgabe erst mit Security-Review.

## 15. Merge-Checkliste

Vor Merge einer Änderung:

```text
[ ] Typecheck bestanden
[ ] Unit Tests bestanden
[ ] Szenariotests bestanden
[ ] Visibility Tests bestanden
[ ] Replay Tests bestanden, falls State/Event betroffen
[ ] Integration Tests bestanden, falls API/Storage betroffen
[ ] E2E oder manueller Smoke Test, falls UI/WS betroffen
[ ] Dokumente aktualisiert, falls Vertrag/Spezifikation geändert
[ ] Keine Tokens oder privaten Kartendaten in Logs/Snapshots
```
