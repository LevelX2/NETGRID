# Maintenance-Control-Plane betreiben

Stand: 2026-07-11  
Status: verbindlicher ARC-001-Betriebspfad

## Zweck

Dieses Runbook beschreibt Bootstrap, Anmeldung, Passwortänderung, Reset und HTTPS-Bereitstellung der NETGRID-Maintenance-Control-Plane. Maintenance-Authentifizierung ist eigenständig; Match-, Join-, Session- und Reconnect-Tokens sind keine Adminberechtigung.

## Sichere Defaults

- `scripts/start-netgrid.ps1` startet den normalen lokalen Spielbetrieb unverändert.
- Im Profil `local` ist Maintenance standardmäßig aktiviert, aber unverschlüsselt ausschließlich über Loopback (`http://127.0.0.1:3100/maintenance`) erreichbar.
- Eine private LAN-Adresse allein gewährt keinen Zugriff.
- Im Profil `private_internet` ist Maintenance standardmäßig deaktiviert.
- Remote-/Tablet-Zugriff verlangt eine explizite HTTPS-Origin und einen exakt benannten Reverse Proxy.
- Das Adminpasswort und die Adminsitzung gehören nie in URL, Bookmark, `localStorage` oder `sessionStorage`.

## Erstes Passwort setzen

Im Projektordner:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/set-maintenance-password.ps1
```

Das Script fragt das Passwort verdeckt zweimal ab. Es übergibt es nur über Standardeingabe an die lokale CLI. Ein Passwort als Kommandozeilenargument ist nicht vorgesehen.

Danach NETGRID normal starten:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-netgrid.ps1
```

Anmeldung lokal: `http://127.0.0.1:3100/maintenance`.

## Passwort ändern und Sitzungen widerrufen

In der angemeldeten Maintenance-Oberfläche unter „Passwort ändern“:

1. aktuelles Passwort eingeben,
2. neues Passwort mit mindestens 12 Zeichen eingeben,
3. Änderung bestätigen.

Eine erfolgreiche Änderung widerruft alle Maintenance-Sitzungen, auch die aktuelle. Alle Browser und Tablets müssen sich neu anmelden.

## Lokaler Reset

Wenn das aktuelle Passwort nicht mehr verfügbar ist, erfolgt der Reset ausschließlich auf dem Serverhost:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/set-maintenance-password.ps1 -Reset
```

Auch ein Reset widerruft sämtliche Sitzungen. Es gibt keinen HTTP-Recovery-Endpunkt und keinen Reset-Link.

## Tablet-/Remote-Zugriff über HTTPS

### Zieltopologie

```text
Tablet oder Admin-Browser
  -> https://admin.netgrid.example
       -> kontrollierter Reverse Proxy
            -> http://127.0.0.1:3100/maintenance   (Web)
            -> http://127.0.0.1:8787/api/storage/maintenance/*   (API)
```

Die Spiel-Origin bleibt separat, zum Beispiel `https://play.netgrid.example`. Die Admin-Origin wird nicht automatisch als CORS-Origin der Game Plane zugelassen.

### Pflichtvariablen

```powershell
$env:NETGRID_MAINTENANCE_ENABLED = "true"
$env:NETGRID_MAINTENANCE_BASE_URL = "https://admin.netgrid.example"
$env:NETGRID_MAINTENANCE_ALLOWED_ORIGINS = "https://admin.netgrid.example"
$env:NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES = "127.0.0.1,::1"
```

Für `private_internet` gelten zusätzlich weiterhin die bestehenden Pflichtwerte für `NETGRID_WEB_BASE_URL`, `NETGRID_SERVER_BASE_URL`, `NETGRID_ALLOWED_ORIGINS` und `NETGRID_TOKEN_SALT`.

Der Start scheitert fail-closed, wenn Remote Maintenance aktiviert ist und eine dieser Bedingungen fehlt:

- explizite `https://`-Maintenance-Base-URL,
- explizite einzelne HTTPS-Origin ohne Wildcard,
- mindestens eine exakte Proxy-Adresse.

### Reverse-Proxy-Vertrag

Der Reverse Proxy muss:

- TLS terminieren und ein gültiges Zertifikat für die Admin-Origin liefern,
- `/maintenance` und die benötigten Next.js-Assets an den Webprozess weiterleiten,
- `/api/storage/maintenance/` an den NETGRID-Server weiterleiten,
- `X-Forwarded-Proto: https` selbst setzen und vom Client gelieferte Forwarded-Header überschreiben,
- als Quelladresse exakt einem Wert aus `NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES` entsprechen,
- Request-URLs, Cookies und Bodies nicht mit Klartext-Credentials protokollieren,
- den Backend-Port `8787` nicht direkt für das LAN oder Internet freigeben.

Beispielhafter Caddy-Zuschnitt:

```caddyfile
admin.netgrid.example {
  encode zstd gzip

  handle /api/storage/maintenance/* {
    reverse_proxy 127.0.0.1:8787
  }

  handle {
    reverse_proxy 127.0.0.1:3100
  }
}
```

Caddy setzt den HTTPS-Forwarding-Kontext selbst. Bei anderen Proxies muss `X-Forwarded-Proto` kontrolliert überschrieben werden.

## Lokale SQLite-Optimierung

Die lokale Datenbank kann kontrolliert kompaktiert werden. Vor dem Lauf die NETGRID-App beenden, damit der Wartungsvorgang exklusiven Zugriff auf SQLite erhält. Danach im Projektwurzelverzeichnis ausführen:

```powershell
corepack pnpm storage:optimize
```

Der Befehl erstellt zuerst ein geprüftes, bereits kompaktes Backup mit dem Grund `pre_optimization`. Anschließend entfernt er historische, doppelt gespeicherte `aiDecisionDebug`-Payloads aus öffentlichen Eventzeilen, führt `VACUUM` und `PRAGMA optimize` aus und beendet den Lauf nur bei erfolgreichem `integrity_check`. Die JSON-Ausgabe nennt Backup-ID, normalisierte Zeilen, Dateigrößen und freigegebene Seiten. Bestehende Backups werden nicht automatisch gelöscht.

Nach dem Lauf die App wieder ausschließlich über `scripts/start-netgrid.ps1` starten.

## Betriebsprüfung

1. Ohne Passwortdatei liefert Maintenance nur `maintenance_auth_uninitialized`.
2. Ohne Anmeldung liefern fachliche Maintenance-Endpunkte `maintenance_auth_required`.
3. Login setzt ein `HttpOnly`, `SameSite=Strict`-Cookie; remote zusätzlich `Secure`.
4. Fremde Origins und fehlender CSRF-Nachweis werden abgelehnt.
5. Cleanup-Apply, Cleanup-Policy, Policy-Lauf, Snapshot-Kompaktion und Recovery-Zugang verlangen eine frische Passwortbestätigung.
6. Der manuelle Cleanup kann auch `active` auswählen. Dabei gelten weiterhin Altersgrenze, Vorschau, ausdrückliche Löschbestätigung und frische Passwortbestätigung; die Vorschau warnt ausdrücklich vor möglichen laufenden Partien.
7. Der automatische Cleanup akzeptiert weiterhin ausschließlich terminale Matchzustände. Andere nicht-terminale Zustände bleiben generell ausgeschlossen.
8. Passwortänderung oder lokaler Reset meldet alle Geräte ab.
9. Direkter LAN-Aufruf von Port `8787` bleibt für Maintenance geschlossen.

## Laufende Matchanalyse

Für normale Analyse laufender NETGRID-Matches sollen Codex und andere
Diagnosewerkzeuge nicht direkt `data/runtime/multiplayer/netgrid.sqlite`
öffnen. Sie verwenden die authentifizierte lokale Maintenance-API
`GET /api/storage/maintenance/analysis/matches/:matchId/bundle`; der
Endpunkt materialisiert seinen read-only SQLite-Read kurz und liefert danach
ein versioniertes JSON-Bundle. Direkter SQLite-Zugriff bleibt ein bewusstes
Wartungs-/Sonderwerkzeug.

Für die historische Analyse einer einzelnen KI-Entscheidung dient
`GET /api/storage/maintenance/analysis/matches/:matchId/decisions/:decisionIndex`.
Neue KI-Traces persistieren dafür am damaligen Entscheidungspunkt den Vertrag
`ai-decision-historical-audit-v1`: actor-sichere LegalAction-Semantik,
Engine-Bindungs- und Validierungs-Evidence, einen StateHash-gebundenen
Actor-Snapshot sowie – nur während eines Runs – die damals sichtbare
Run-/Encounter-Projektion. Der Detailendpunkt liefert diesen Auditvertrag
vollständig, jedoch nie rohe Zustände, Datenbankzeilen, Logzeilen oder
gegnerische private Zonen.

Das Bundle verwendet `netgrid-match-analysis-bundle-v2`. Es enthält die
Schema-Versionen und im kompakten Decision-Index pro Abschnitt den Status
`persisted`, `reconstructed` oder `unavailable`. Der Detailendpunkt verwendet
`netgrid-decision-analysis-context-v2` und liefert für eine Entscheidung die
vollständige Audit-Evidence. Aktuelle Engine-Rekonstruktion ist ausdrücklich
kein Ersatz: ältere Traces ohne gespeicherten Auditvertrag melden für jeden
betroffenen Abschnitt strukturiert `unavailable` mit
`historical_audit_not_persisted`; der Server erstellt keinen
Rückwärtskompatibilitätsadapter.

Mit `side=runner|corp&includeOwnDeckSnapshot=true` liefert das Bundle außerdem
den beim Matchstart serverprivat persistierten eigenen Decksnapshot als
reihenfolgenneutrale Definition-Counts. Der Vertrag
`netgrid-maintenance-own-deck-snapshot-v1` enthält Identity, Gesamtzahl,
Kartenpool-/Formatbindung, Deck-Hash und eine eindeutige Signatur, aber keine
Instanz-IDs, Shuffle-Daten oder Positionen. Der Decision-Detailendpunkt bindet
denselben Snapshot automatisch an die Seite der historischen Entscheidung und
ergänzt aus dem exakt zugehörigen State-Snapshot eine actor-sichere Zonenbilanz
mit bekannten Karten außerhalb von Stack beziehungsweise R&D und den dort
noch möglichen Definition-Counts. Fehlen Deckzuordnung, historischer Snapshot
oder Hash-/Versionsbindung, bleibt der Abschnitt mit Provenance `unavailable`
und `diagnostics.unavailableSections: ["ownDeckSnapshot"]` fail-closed. Eine
aktuelle Deckdatei oder gegnerische Deckzusammensetzung wird nie als Ersatz
gelesen.

Im lokalen Profil dürfen dieselben read-only Analysis-Routen ohne
Maintenance-Login über `127.0.0.1` oder `::1` aufgerufen werden. Das gilt
ausschließlich für `GET /api/storage/maintenance/analysis/*` und prüft die
tatsächliche Socket-Adresse; Host- oder Forwarded-Header genügen nicht.
Alle übrigen Maintenance-Routen, insbesondere Cleanup, Backup, Restore,
Compaction, Trace-Änderungen und Credentials, bleiben authentifiziert.

## Öffentliche Selbsthoster-Perspektive

ARC-001 ist die Sicherheitsgrundlage, aber keine vollständige öffentliche Distribution. Vor einer allgemeinen Veröffentlichung bleiben eigene Gates für Installation/Updates, Secret-Erzeugung, Zertifikatsautomatisierung, Backup/Restore, Benutzerkonten, Missbrauchsschutz, Datenschutz, Moderation und Support erforderlich. Die Game Plane darf öffentlich erreichbar sein; die Control Plane bleibt betreibergebunden und separat abgesichert.
