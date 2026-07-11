# ARC-001 Maintenance-Control-Plane-Sicherheitsprozess

Status: in Umsetzung  
Stand: 2026-07-11  
Quelle: strukturelle Architekturprüfung ARC-001 und Nutzerfreigabe vom 2026-07-11  
Arbeitsbranch: `codex/maintenance-control-plane-security`  
Worktree: `C:\Projekte\NETGRID_MAINTENANCE_SECURITY`

## Zielprüfung

ARC-001 ist erst abgeschlossen, wenn die bisherige implizite Adminfreigabe für jede private LAN-Adresse entfernt ist und alle Maintenance-Funktionen über eine eigenständige, fail-closed Control Plane geschützt werden. Dazu gehören Passwort- und Sitzungsverwaltung, CSRF- und Reauthentifizierungsgrenzen, ein HTTPS-/Reverse-Proxy-fähiger Betriebsvertrag, eine angepasste Oberfläche, Regressionstests und der lokale Merge nach `main`.

## Gesamtziel

NETGRID erhält eine zukunftsfähige Maintenance-Control-Plane, die im lokalen Entwicklungsbetrieb sicher nutzbar bleibt und später von einem Betreiber auch auf einem Tablet oder in einem selbst gehosteten privaten Deployment verwendet werden kann. Der Besitz einer privaten LAN-Adresse oder einer gespeicherten URL ist keine Berechtigung mehr.

Die Control Plane bleibt technisch und fachlich von Match-Tokens, Match-Sessions und einem späteren Nutzerkontensystem getrennt. Sie darf keine neue Regelautorität und keinen neuen Datenkanal für verdeckte Spielinformationen schaffen.

## Sicherheitsmodell

### Vertrauensgrenzen

- Die Maintenance-Control-Plane ist ein eigener administrativer Schutzbereich.
- Private IP-Adressen, Hostnamen, URLs, Origin-Header und Browser-Speicher sind keine Authentifizierung.
- Das Adminpasswort wird nur als starker, individuell gesalzener Ableitungswert gespeichert; der Klartext wird weder persistiert noch geloggt.
- Adminsitzungen verwenden zufällige, undurchsichtige Rohwerte im Browser und nur Hashwerte im Serverzustand.
- Browser erhalten den Sitzungsrohwert ausschließlich als `HttpOnly`-Cookie, niemals in JSON, URL, `localStorage` oder `sessionStorage`.
- Mutierende Maintenance-Aufrufe benötigen eine gültige Adminsitzung, erlaubte Origin und einen sitzungsgebundenen CSRF-Nachweis.
- Besonders folgenschwere Operationen benötigen zusätzlich eine frische Reauthentifizierung mit dem aktuellen Passwort.
- HTTP ist nur für expliziten Loopback-Entwicklungsbetrieb zulässig. LAN-, private-Internet- und spätere öffentliche Betriebsprofile müssen die Control Plane über HTTPS bereitstellen.
- Forwarded-Header sind keine Vertrauensquelle, solange kein explizit konfigurierter Proxy-Vertrag greift.

### Controller-Invarianten

1. Keine Maintenance-Daten ohne erfolgreiche Adminauthentifizierung.
2. Keine LAN-Freigabe allein aufgrund einer RFC1918-, Link-Local- oder privaten IPv6-Adresse.
3. Keine mutierende Maintenance-Aktion ohne gültiges CSRF-Token und erlaubte Origin.
4. Keine Löschung, Recovery-Token-Ausgabe oder Änderung der Cleanup-Policy ohne frische Reauthentifizierung.
5. Eine Passwortänderung widerruft alle vorhandenen Adminsitzungen einschließlich der aktuellen Sitzung.
6. Ein lokaler Passwort-Reset läuft ausschließlich als Host-CLI/-Script mit Zugriff auf den lokalen Authzustand, nie als ungeschützter HTTP-Endpunkt.
7. Aktive Matches sind niemals Cleanup-Kandidaten; dieser Schutz wird beim Apply erneut geprüft und nicht nur in der UI dargestellt.
8. Maintenance-Antworten und Fehler enthalten keine Adminpasswörter, Passwort-Hashes, Sitzungstokens, Match-Tokens oder verdeckten Spieldaten. Ein CSRF-Rohwert darf nur gezielt beim Login an den authentifizierten Browser ausgegeben werden und erscheint nie in Logs oder Fehlern.
9. Adminauthentifizierung erteilt keine Berechtigung für `PlayerActions` und verändert keine Engine-, Replay- oder StateHash-Semantik.
10. Ohne initialisiertes Adminpasswort bleiben fachliche Maintenance-Endpunkte geschlossen. Nur lokales CLI-Bootstrap darf den Zustand initialisieren.

## Anforderungen

| ID             | Anforderung                                                                                                    | Akzeptanznachweis                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ARC001-REQ-001 | Private LAN-Adressen gelten nicht länger als Adminnachweis.                                                    | Adresstest erlaubt nur Loopback als Transportausnahme; API-Tests lehnen LAN ohne Sitzung ab. |
| ARC001-REQ-002 | Ein lokaler Bootstrap-/Reset-Befehl setzt ein neues Maintenance-Passwort ohne Webzugriff.                      | CLI-Test oder isolierter Service-Test; Runbook mit exaktem Aufruf.                           |
| ARC001-REQ-003 | Das Passwort liegt nur als starker, gesalzener Hash mit versionierten Parametern vor.                          | Storage-/Dateitest und Redaction-Scan; kein Klartext im Authartefakt.                        |
| ARC001-REQ-004 | Login erzeugt eine kurzlebige, serverseitig widerrufbare Sitzung.                                              | Auth-Service- und HTTP-Test für Erfolg, Falschpasswort, Ablauf und Widerruf.                 |
| ARC001-REQ-005 | Sitzung und CSRF sind an sichere Cookies bzw. getrennte Nachweise gebunden.                                    | Cookie-Flags-, CSRF- und Origin-Tests; kein Token in JSON oder URL.                          |
| ARC001-REQ-006 | Passwortänderung verlangt aktuelles Passwort und widerruft alle Sitzungen.                                     | Service-/HTTP-Test mit zwei Sitzungen und anschließendem Authfehler.                         |
| ARC001-REQ-007 | Read-only-Maintenance-Routen verlangen eine gültige Adminsitzung.                                              | Summary-, Match-, Detail- und AI-Trace-Regressionen.                                         |
| ARC001-REQ-008 | Mutationen verlangen Sitzung, CSRF und erlaubte Origin.                                                        | Negative und positive Tests für Cleanup-Preview, Retention-Schutz und Logout.                |
| ARC001-REQ-009 | Destruktive oder credential-nahe Operationen verlangen frische Reauthentifizierung.                            | Tests für Cleanup-Apply, Recovery-Zugang und Cleanup-Policy.                                 |
| ARC001-REQ-010 | Aktive Matches können durch Maintenance-Cleanup nicht gelöscht werden.                                         | Preview- und Apply-Revalidierungstest gegen Statuswechsel/aktive Matches.                    |
| ARC001-REQ-011 | Die Maintenance-Oberfläche bietet Login, Sessionstatus, Logout und Passwortänderung ohne Browser-Secretablage. | Web-Tests, Typecheck und Browser-Smoke.                                                      |
| ARC001-REQ-012 | Sichere und unsichere Transportprofile sind fail-closed und dokumentiert.                                      | Konfigurationstests und Betreiber-Runbook für Loopback sowie HTTPS-Proxy.                    |
| ARC001-REQ-013 | Reverse-Proxy-Vertrauen ist explizit und begrenzt.                                                             | Konfigurationsvalidierung; Doku nennt Bind-, Origin- und Forwarded-Header-Grenze.            |
| ARC001-REQ-014 | Bestehende Engine-, Match-, Reconnect-, Replay- und Public-Health-Flows bleiben unverändert.                   | Serverpflichtlauf und relevante bestehende Regressionen.                                     |

## Nicht-Ziele

- Keine öffentliche NETGRID-Plattform, öffentliche Registrierung oder öffentliche Lobby.
- Kein allgemeines Nutzerkonto-, Rollen-, OAuth-, Passkey- oder E-Mail-Recovery-System.
- Keine automatische Zertifikatsausstellung und kein eingebauter öffentlicher Reverse Proxy.
- Kein Speichern des Adminpassworts oder einer Adminsitzung in einer URL.
- Keine Übernahme von Match-Session- oder Join-Tokens als Adminberechtigung.
- Kein Redesign der Maintenance-Oberfläche über den für Authentifizierung und sichere Bedienung nötigen Umfang hinaus.
- Keine Rückwärtskompatibilität für die ungeschützte LAN-Maintenance.
- Kein Push, Pull Request oder Remote-Deployment in diesem Prozess.

## Betriebsprofile

| Profil                  | Bindung und Transport                                             | Maintenance-Verhalten                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local_loopback`        | HTTP nur auf Loopback zulässig                                    | Passwortpflicht; Cookie darf für diesen expliziten Entwicklungsfall ohne `Secure` gesetzt werden, bleibt aber `HttpOnly` und `SameSite=Strict`.       |
| `private_lan`           | HTTPS erforderlich, bevorzugt über kontrollierten Reverse Proxy   | Passwortpflicht; `Secure`-Cookie; exakte Maintenance-Origin; direkter unsicherer LAN-Zugriff wird abgelehnt.                                          |
| `private_internet`      | HTTPS/WSS und explizite Origins wie im Internet-Hardening-Vertrag | Spieloberfläche kann erreichbar sein, Maintenance bleibt standardmäßig deaktiviert und muss als separate Control Plane bewusst freigeschaltet werden. |
| späteres Public Hosting | öffentliche Game Plane und private Control Plane getrennt         | ARC-001 liefert nur die Sicherheitsgrundlage; Distribution, Mandanten, Accounts, Abuse- und Plattformbetrieb brauchen eigene Gates.                   |

Die bevorzugte Zieltopologie lautet:

```text
Admin-Browser
  -> HTTPS Maintenance-Origin
       -> kontrollierter Reverse Proxy
            -> Loopback/interne NETGRID-Maintenance-API

Spieler-Browser
  -> HTTPS Game-Origin
       -> Web, Match-API und WebSocket
```

## Zustandsautomat

```text
uninitialized
  -- lokaler bootstrap/reset --> ready

ready
  -- korrektes Passwort --> authenticated
  -- falsches Passwort --> ready + generischer Fehler

authenticated
  -- Ablauf/logout/widerrufen --> ready
  -- Passwortänderung --> ready + alle Sitzungen widerrufen
  -- aktuelle Passwortbestätigung --> reauthenticated

reauthenticated
  -- sensible Einzeloperation --> authenticated
  -- kurzes Reauth-Fenster abgelaufen --> authenticated
```

`uninitialized` gibt über HTTP keine Setup-Geheimnisse und keine Maintenance-Daten aus. Es liefert nur einen generischen, redigierten Hinweis, dass lokales Betreiber-Setup erforderlich ist.

## Automatische Fehlerbehandlung

- Fehlende oder ungültige Authentifizierung: `401 maintenance_auth_required` beziehungsweise generisches `maintenance_auth_invalid` beim Login.
- Fehlendes lokales Setup: `503 maintenance_auth_uninitialized`, ohne Dateipfad oder Hashdetails.
- Unzulässiger Transport oder deaktiviertes Profil: `403 maintenance_unavailable` oder Startfehler bei widersprüchlicher sicherer Konfiguration.
- Fehlende Origin/CSRF-Prüfung: `403 maintenance_request_rejected` ohne Tokenhinweis.
- Fehlende frische Reauthentifizierung: `403 maintenance_reauthentication_required`.
- Rate-Limit bei Login/Reauth: `429 rate_limited` mit redigierter Antwort.
- Storage-/Authdateifehler: fail-closed; keine automatische Neuerstellung, wenn dadurch bestehende Credentials unbemerkt ersetzt würden.
- Cleanup-Statuswechsel: Preview wird ungültig; Apply bricht ohne Teillöschung ab.
- Nach jedem Fehler bleiben fachliche Maintenance-Daten verborgen.

## Sicherheitsblocker

Die Umsetzung oder das jeweilige Paket muss stoppen, wenn einer dieser Punkte nicht sicher erfüllbar ist:

- Ein Browserfluss würde das Sitzungstoken oder Passwort in URL, JSON-Antwort, Web Storage oder Logs ablegen.
- Das gewählte Cookie-Modell funktioniert im vorgesehenen Profil nicht same-site oder nicht über HTTPS.
- Ein Reverse Proxy könnte beliebige Client-Forwarded-Header ungeprüft an eine öffentlich gebundene App weitergeben.
- Cleanup-Apply kann aktive Matches oder andere als die revalidierten Kandidaten löschen.
- Bestehende PlayerView-, PublicEvent-, Replay- oder Match-Token-Redaction wird geschwächt.
- Eine Passwortänderung lässt alte Sitzungen weiter gültig.

## Paketfolge

### P01 – Sicherheitsvertrag und Paketprozess

Status: abgeschlossen

Ergebnis:

- dieses führende Prozessartefakt,
- Anforderungen, Nicht-Ziele, Invarianten, Zustandsautomat und Testvertrag,
- dokumentierte Abgrenzung zu Account-Auth und öffentlicher Plattform.

Prüfung:

- Quervergleich mit Backend-0.5-, Private-Internet- und V2-Account-Session-Verträgen,
- `git diff --check`.

### P02 – Authkern, Credential-Speicher, Sitzungen und lokaler Reset

Status: abgeschlossen

Ergebnis:

- isolierter Maintenance-Auth-Service,
- versionierter starker Passwort-Hash,
- gehashte, kurzlebige, widerrufbare Sitzungen und sitzungsgebundene CSRF-Nachweise,
- lokale CLI für Bootstrap/Reset,
- Service- und Persistenztests.

Prüfung:

- fokussierte Authtests,
- Server-Typecheck,
- `git diff --check`.

### P03 – Fail-closed Maintenance-API und Konsistenzgrenzen

Status: in Umsetzung

Ergebnis:

- Login-, Session-, Logout-, Passwortänderungs- und Reauth-HTTP-Vertrag,
- Schutz aller bestehenden Maintenance-Routen,
- Login-/Reauth-Rate-Limit,
- Origin-/CSRF-Gate für Mutationen,
- Reauth-Gate für Cleanup-Apply, Cleanup-Policy und Recovery-Zugang,
- Cleanup-Ausschluss aktiver Matches mit Apply-Revalidierung.

Prüfung:

- fokussierte HTTP- und Cleanup-Regressionen,
- kompletter Server-Testlauf und Typecheck,
- `git diff --check`.

### P04 – Sichere Maintenance-Oberfläche

Status: ausstehend

Ergebnis:

- Login- und Setup-Hinweis,
- Cookie-basierter Sessionstatus ohne Browser-Secretablage,
- CSRF-Weitergabe nur im Arbeitsspeicher,
- Logout und Passwortänderung,
- Reauth-Dialog für sensible Aktionen,
- konsistentes Authverhalten auf AI-Trace-Unterseite.

Prüfung:

- fokussierte Webtests,
- Web-Typecheck,
- Browser-Smoke auf Loopback,
- `git diff --check`.

### P05 – HTTPS-/Reverse-Proxy-Vertrag und Betreiberpfad

Status: ausstehend

Ergebnis:

- explizite Maintenance-Konfiguration für Origin, Cookie-/Transportmodus und Aktivierung,
- sichere Startvalidierung für LAN-/Internetprofile,
- dokumentierte Reverse-Proxy-Zieltopologie,
- Betreiber-Runbook für Bootstrap, Passwortwechsel, Reset, Logout aller Sitzungen und Tablet-Zugriff,
- Installations-/Deployment-Hinweise für spätere Selbsthoster.

Prüfung:

- Konfigurationstests,
- Script-/Doku-Smoke soweit lokal automatisierbar,
- `git diff --check`.

### P06 – Sicherheitsregressionen, Current-State und Final Review

Status: ausstehend

Ergebnis:

- vollständige ARC-001-Testmatrix mit Nachweisen,
- aktualisierte führende Wissens- und Betriebsseiten,
- Final Review mit Restrisiken und ausdrücklich offenen Public-Hosting-Gates.

Prüfung:

- Server- und Web-Testläufe,
- Server- und Web-Typechecks,
- relevante Vertrags-/Redaction-Tests,
- Browser-Smoke,
- `git diff --check`.

### P07 – Defensive Integration

Status: ausstehend

Ergebnis:

- aktuelles lokales `main` defensiv in den Arbeitsbranch integriert,
- Konflikte semantisch aufgelöst,
- vollständiger Abschluss-Verify nach Integration,
- Arbeitsbranch lokal nach `main` gemergt,
- Worktree entfernt.

Prüfung:

- sauberer Arbeitsbranch,
- dokumentierte Merge- und Verify-Nachweise,
- kein Push und kein Pull Request.

## Testmatrix

| ID           | Fall                           | Erwartung                                                                        |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------- |
| ARC001-T-001 | LAN-IP ohne Sitzung            | Keine Maintenance-Daten; `401` oder geschlossenes Profil.                        |
| ARC001-T-002 | Uninitialisiertes Authsystem   | Keine Daten und kein Web-Setup; lokaler CLI-Hinweis.                             |
| ARC001-T-003 | Passwortpersistenz             | Nur versionierter Salt/Hash/Parameterdatensatz, kein Klartext.                   |
| ARC001-T-004 | Login                          | Richtige Credentials setzen sichere Session; falsche bleiben generisch.          |
| ARC001-T-005 | Sessionablauf/-widerruf        | Abgelaufene oder widerrufene Sitzung wird abgelehnt.                             |
| ARC001-T-006 | Passwortänderung               | Aktuelles Passwort Pflicht; alle Sitzungen danach ungültig.                      |
| ARC001-T-007 | Read-only-Routen               | Alle bestehenden Leseendpunkte verlangen Auth.                                   |
| ARC001-T-008 | Mutation ohne Origin/CSRF      | Anfrage wird ohne Zustandsänderung abgelehnt.                                    |
| ARC001-T-009 | Destruktive Aktion ohne Reauth | Anfrage wird ohne Zustandsänderung abgelehnt.                                    |
| ARC001-T-010 | Aktiver Match-Cleanup          | Aktive Matches erscheinen nie als Kandidat und werden beim Apply revalidiert.    |
| ARC001-T-011 | Cookie-Flags                   | `HttpOnly`, `SameSite=Strict`, `Path=/`; außerhalb Loopback zusätzlich `Secure`. |
| ARC001-T-012 | Browser-Storage/URL            | Keine Credential- oder Sitzungsrohwerte.                                         |
| ARC001-T-013 | Unsicheres LAN-/Internetprofil | Start oder Maintenance-Zugriff scheitert fail-closed.                            |
| ARC001-T-014 | Reverse-Proxy-Grenze           | Forwarded-Information wird nur im expliziten Vertrauensmodus berücksichtigt.     |
| ARC001-T-015 | Redaction                      | Antworten, DOM, Logs und Fehler enthalten keine Auth- oder Hidden-Info-Rohwerte. |
| ARC001-T-016 | Matchregression                | Matchstart, Join, Reconnect, Actions, Replay und Health bleiben unverändert.     |

## Worktree- und Git-Regeln

- Alle Änderungen entstehen ausschließlich im Worktree `C:\Projekte\NETGRID_MAINTENANCE_SECURITY`.
- Je abgeschlossenem Paket wird genau ein lokaler Commit erstellt.
- Es ist immer höchstens ein Paket `in Umsetzung`.
- Ein Paket wird erst nach seinen relevanten Checks und `git diff --check` abgeschlossen.
- Unabhängige Änderungen in anderen Worktrees oder auf `main` werden nicht überschrieben.
- Vor dem finalen Merge wird das aktuelle lokale `main` defensiv in den Arbeitsbranch integriert.
- Erst nach vollständigem Verify wird der Arbeitsbranch lokal nach `main` gemergt und der Worktree entfernt.
- Push und Pull Request erfolgen nur auf ausdrücklichen Nutzerwunsch und sind hier nicht autorisiert.

## Controller-Kern

Der Controller arbeitet die Pakete P01 bis P07 streng sequenziell ab. Vor jedem Paket prüft er Ziel, Invarianten, Sicherheitsblocker, Worktree-Status und Abhängigkeiten. Er darf ein Paket nur dann als abgeschlossen markieren und committen, wenn dessen Ergebnis vollständig vorliegt, die relevanten Tests erfolgreich sind und `git diff --check` grün ist. Bei Sicherheitsblockern stoppt er fail-closed und dokumentiert den konkreten Blocker. Nach P06 integriert er das aktuelle lokale `main` defensiv, wiederholt den vollständigen Verify, mergt lokal nach `main` und entfernt den Worktree. Das `/Goal` wird erst danach als abgeschlossen markiert.

## Abschlusskriterien

ARC-001 ist abgeschlossen, wenn:

1. alle Anforderungen `ARC001-REQ-001` bis `ARC001-REQ-014` nachweislich erfüllt oder mit Nutzerentscheidung explizit aus dem Scope genommen sind,
2. alle Pakete einzeln geprüft und committen wurden,
3. keine Maintenance-Funktion allein über LAN-Nähe zugänglich ist,
4. Passwort, Sitzungen, CSRF und Reauthentifizierung ihren Sicherheitsvertrag erfüllen,
5. die HTTPS-/Reverse-Proxy- und Betreiberhandhabung verständlich dokumentiert ist,
6. Engine-, Match-, Replay- und Redaction-Regressionsschutz grün ist,
7. der Arbeitsbranch lokal in `main` integriert und das Worktree entfernt wurde,
8. keine nicht autorisierte Remote-Aktion erfolgt ist.
