# ARC-001 Maintenance-Control-Plane Final Review

Stand: 2026-07-11  
Status: abgeschlossen und lokal in `main` integriert
Arbeitsbranch: `codex/maintenance-control-plane-security`

## Ergebnis

ARC-001 schließt die bisherige implizite Adminfreigabe über private LAN-Adressen. Alle Storage-, Cleanup-, Recovery- und KI-Trace-Maintenance-Routen liegen jetzt hinter einer eigenständigen, fail-closed Control Plane. Das Adminpasswort, Adminsitzungen und Match-Capabilities sind getrennte Sicherheitsdomänen.

## Umgesetzter Vertrag

- lokaler Passwort-Bootstrap und Reset ohne HTTP-Recovery-Endpunkt,
- versionierter, individuell gesalzener `scrypt`-Passwortdatensatz ohne Klartext,
- zufällige, kurzlebige In-Memory-Adminsitzungen; Serverneustart, Passwortänderung und Reset widerrufen sie,
- `HttpOnly`, `SameSite=Strict`, `Path=/`; bei HTTPS zusätzlich `Secure`,
- CSRF-Nachweis und exakte Maintenance-Origin für jede Mutation,
- einmalige frische Reauthentifizierung für Cleanup-Apply, Cleanup-Policy, Policy-Lauf, Snapshot-Kompaktion und Recovery-Zugang,
- zentrale Namespace-Sicherung für alle fachlichen Routen unter `/api/storage/maintenance/`,
- Cleanup nur für terminale Zustände `cancelled`, `abandoned`, `forfeited` und `finished`, mit Revalidierung beim Apply,
- Login, Sitzungsprüfung, Logout, Passwortänderung und Reauth-Dialog in beiden Maintenance-Oberflächen,
- lokale HTTP-Ausnahme nur auf Loopback,
- Remote Maintenance standardmäßig aus und nur mit expliziter HTTPS-Base-URL, exakter Origin und exakt benannten Proxy-Adressen aktivierbar,
- getrennte CORS-Grenzen für Game Plane und Control Plane,
- Betreiber-Runbook und sicherer PowerShell-Passwortdialog.

## Anforderungen

| Anforderung | Ergebnis | Nachweis |
| --- | --- | --- |
| ARC001-REQ-001 bis -006 | erfüllt | `maintenance-auth.ts`, CLI, Service-/HTTP-Tests |
| ARC001-REQ-007 bis -009 | erfüllt | zentrales HTTP-Gate, CSRF-/Origin-/Reauth-Tests |
| ARC001-REQ-010 | erfüllt | terminal-only Filter und Statuswechsel-Revalidierung |
| ARC001-REQ-011 | erfüllt | `maintenance-auth-ui.tsx`, Webtests, Browser-Smoke |
| ARC001-REQ-012 und -013 | erfüllt | Deploymentvalidierung, Proxytest, Runbook |
| ARC001-REQ-014 | erfüllt | Server-/Web-Regressionsläufe; keine Engine- oder Match-Token-Änderung |

## Verifikation

- `@netgrid/server` Typecheck: grün.
- `@netgrid/server` Tests: 11 Dateien, 150 Tests, grün.
- `@netgrid/web` Typecheck: grün.
- `@netgrid/web` Tests nach finalem Main-Abgleich: 39 Dateien, 501 Tests, grün.
- Projektweiter rekursiver Typecheck: grün.
- Contracttests: Shared 10/10 sowie Phase-/Visibility-Verträge 5/5, grün.
- Projektweiter Build einschließlich produktivem Next-Build und statischer Maintenance-Routen: grün.
- PowerShell-Parser für `start-netgrid.ps1` und `set-maintenance-password.ps1`: grün.
- `git diff --check`: grün.
- Browser-Smoke auf Loopback: Login, Datenladung, terminal-only Cleanup-Auswahl, Reauth-Dialog, Policy-Speicherung und Logout erfolgreich.
- HTTPS-/Proxy-Vertrag: automatisierter HTTP-Test mit vertrauenswürdigem Proxykontext, `X-Forwarded-Proto: https`, separater Admin-Origin und `Secure`-Cookie erfolgreich.

Der erste Browser-Smoke verwendete versehentlich die normalen lokalen Ports und ersetzte vorübergehend die laufende Hauptinstanz durch den Worktree-Server. Die Hauptinstanz wurde sofort über `C:\Projekte\NETGRID\scripts\start-netgrid.ps1` wiederhergestellt; die normale SQLite-Datenbank und das aktive Match waren unverändert vorhanden. Weitere Smokes dieses Arbeitsstrangs verwenden keine laufende Nutzerinstanz.

## Sicherheitsbewertung

- Eine gespeicherte URL oder private IP reicht nicht mehr als Adminzugang.
- Sitzungstokens erscheinen nicht in URL, JSON, Web Storage oder persistiertem Serverzustand.
- Passwort- und Tokenrohwerte werden nicht geloggt oder in fachlichen Antworten ausgegeben.
- Ein fremder Origin erhält weder Control-Plane-CORS noch Game-Plane-CORS durch die Adminfreigabe.
- Forwarded-HTTPS gilt nur, wenn die direkte Socket-Gegenstelle explizit als Maintenance-Proxy konfiguriert ist.
- Adminauthentifizierung erteilt keine Match- oder `PlayerAction`-Berechtigung.

## Bewusste Restgrenzen

- ARC-001 stellt keinen Reverse Proxy bereit und automatisiert keine Zertifikate. Ein realer Betreiber muss Zertifikat, DNS, Firewall und Proxykonfiguration nach dem Runbook prüfen.
- Es gibt keine öffentliche Registrierung, Mandantenfähigkeit, Moderation, Abuse-Plattform oder allgemeine Accountverwaltung.
- Adminsitzungen sind bewusst nicht restart-persistent; ein Serverneustart verlangt neue Anmeldung.
- Die Credential-Datei liegt im lokalen Runtime-Bereich. Host-Dateirechte, Backupschutz und Betriebssystemhärtung bleiben Betreiberpflicht.
- Eine allgemeine öffentliche Selbsthoster-Distribution braucht weiterhin eigene Installations-, Update-, Secret-, Backup-, Datenschutz- und Support-Gates.

## Freigabe

Der ARC-001-Sicherheitsgrundschnitt ist für den privaten Version-0-Betrieb freigabefähig. Remote-/Tablet-Betrieb ist nur nach ausgefülltem HTTPS-/Proxy-Smoke des konkreten Deployments freigegeben. Öffentlicher Plattformbetrieb ist ausdrücklich nicht freigegeben.

Lokaler Integrationsnachweis: Merge-Commit `12952902d` auf `main`; kein Push und kein Pull Request.
