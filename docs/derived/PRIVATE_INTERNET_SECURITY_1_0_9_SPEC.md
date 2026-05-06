# Private Internet Security Spec 1.0.9

Stand: 2026-05-06
Status: spec

## Zweck

Diese Spezifikation beschreibt die sicherheitsrelevanten Grenzen für V1.0.9 Private Internet Hardening. Sie ist bewusst schmal: Sie macht private Einladungsmatches über Internet sicherer, ersetzt aber kein Account-, Public-Platform-, Moderations- oder Skalierungsmodell.

## Sicherheitsmodell

### Vertrauensannahmen

- Der Betreiber ist privat und kontrolliert Server, Storage, Reverse Proxy und Secrets.
- Spieler erhalten private Join-Links oder Sessiondaten nur außerhalb der App über einen vertrauten Kanal.
- Es gibt keine öffentlichen Lobbys und keine unbekannte Nutzerbasis.
- Der Server bleibt einzige Match- und Regelautorität.
- Browser gelten als potenziell neugierig, erhalten aber weiterhin nur side-sichere Payloads.

### Nicht vertrauenswürdig

- Origin-Header unbekannter Webseiten,
- Client-IP ohne Proxy-Kontext,
- Client-seitige StateVersion, Side, actionId, Targets oder Choices,
- Browser-Speicher als langfristige Secret-Ablage,
- Logs und Diagnoseausgaben als sichere Datenablage.

## Deployment-Profil

V1.0.9 unterscheidet mindestens:

| Profil | Nutzung | Anforderungen |
| --- | --- | --- |
| `local` | Entwicklung, lokale Tests, E2E | `http://127.0.0.1`, dynamische Ports und lokale Origins erlaubt. |
| `private_internet` | privater Internetbetrieb für eingeladene Spieler | `https://`-Base-URLs, explizite Origins, expliziter Token-Salt, Rate-Limits und redaktionierte Ops-Signale Pflicht. |

Im Internet-Profil ist ein Start mit lokalen Default-Secrets oder unsicheren öffentlichen URLs ein Konfigurationsfehler.

## Transport

V1.0.9 muss den sicheren Transportpfad definieren:

- Web läuft über `https://`.
- Realtime läuft über `wss://`.
- REST läuft über `https://`.
- WebSocket-Upgrade muss durch Reverse Proxy oder äquivalenten TLS-Pfad funktionieren.
- Unsicheres `http://`/`ws://` bleibt nur für `localhost`, `127.0.0.1` und explizite lokale Testprofile erlaubt.

Die Node-App muss TLS nicht zwingend selbst terminieren. Ein Reverse Proxy ist zulässig und bevorzugt, solange die App ihre öffentliche Base-URL, erlaubte Origins und Forwarded-Header-Vertrauensgrenze kennt.

## Origin- und CORS-Vertrag

### REST

REST-CORS darf im privaten Internet-Profil nicht `*` sein.

Erlaubte Origins:

- werden explizit konfiguriert,
- müssen exakt gegen Scheme, Host und Port geprüft werden,
- dürfen mehrere private Origins enthalten,
- dürfen keine Wildcard-Domains sein, solange kein eigener Review diese freigibt.

Ablehnung:

- Statuscode darf `403` oder äquivalenter side-sicherer Fehler sein,
- Antwort enthält keinen Matchstatus, keine Token-Hinweise, keine Deckdaten, keine Hidden Info,
- Preflight gibt nur notwendige Methoden und Header frei.

### WebSocket

WebSocket-Verbindungen auf `/ws` müssen denselben Origin-Vertrag verwenden.

Die Origin-Prüfung findet vor `join_match` statt. Unbekannte Origins dürfen keine `state_update`, `lobby_update`, `legal_actions`, `event_log_update`, `choice_request` oder `match_finished`-Payloads erhalten.

## Token- und Secret-Vertrag

### Token-Salt

Im privaten Internet-Profil ist ein expliziter `NETRUNNER_TOKEN_SALT` Pflicht.

Nicht erlaubt:

- lokaler Default-Salt,
- leerer Salt,
- Salt in Git,
- Salt in `.env.example`,
- Salt in Health oder Logs.

### Token-Ausgabe

Klartext-Tokens dürfen nur an die berechtigte Seite zurückgegeben werden:

- Host-Session/Reconnect bei Match-Erstellung,
- Joiner-Session/Reconnect bei Join,
- neue Session/Reconnect bei Reconnect,
- Join-Token nur als privater Einladungslink.

Alle anderen Flächen verwenden Hashes oder keine Tokeninformationen. Hashes sind ebenfalls nicht in Health, normalen Logs oder Browser-Diagnosen sichtbar.

### Query-Token-Bewertung

Bestehende Join-Links enthalten `joinToken` in der URL. V1.0.9 muss diesen Pfad redaktionieren und bewerten.

Mindestregel:

- Join-URLs nie unredaktioniert loggen,
- E2E- und Serverlogs redaktionieren `joinToken=...`,
- Fehlerantworten bei ungültigem Join-Token bleiben generisch,
- langfristig bevorzugt: Session-sensitive REST-Kommandos über `Authorization: Bearer`.

## Rate-Limit-Vertrag

V1.0.9 nutzt einfache, in-memory oder adaptergekapselte Rate Limits. Sie sind keine Public-Scale-Abwehr, sondern private Missbrauchsbremsen.

Mindestkategorien:

| Kategorie | Beispiele | Zweck |
| --- | --- | --- |
| Erstellung | `POST /api/matches` | Match-Spam begrenzen. |
| Token-Probe | Join-Info, Join, Reconnect, Bootstrap | Token-Raten und Link-Erraten bremsen. |
| Lifecycle | Cancel, Leave, Forfeit, Recreate | Wiederholtes Stören begrenzen. |
| AI/Simulation | AI-Advance, AI-vs-AI | CPU-/Loop-Missbrauch begrenzen. |
| Realtime | WS-Handshake, `join_match` | Verbindungsfluten bremsen. |

Schlüsselung:

- lokale Tests dürfen deterministische Keys nutzen,
- Internetbetrieb nutzt IP oder vertrauenswürdige Proxy-Client-IP,
- MatchId und Aktionstyp sollen sensible Flows zusätzlich trennen,
- Forwarded-Headers werden nur bei `NETRUNNER_TRUST_PROXY_HEADERS=true` oder äquivalentem explizitem Trust-Profil genutzt.

Antwort:

- side-sicher,
- keine Token,
- keine Matchdetails,
- optional `Retry-After`,
- stabiler Fehlercode, z. B. `rate_limited`.

## Redaction-Vertrag

Folgende Muster dürfen in sichtbaren Diagnose-, Health-, Log-, E2E- und Error-Flächen nicht erscheinen:

- `sessionToken`,
- `reconnectToken`,
- `joinToken` mit Wert,
- `hostSessionToken`,
- `hostReconnectToken`,
- `tokenHash`,
- `privateDeckSnapshots`,
- `decklist`,
- `cardInstances`,
- `privatePayload`,
- verdeckte Kartentitel,
- vollständige Join-URL mit Token.

Erlaubt sind abstrahierte Signale:

- Storage-Art,
- Schema-Version,
- Service ok/nicht ok,
- Release/Profil,
- Anzahl aktiver WebSocket-Verbindungen nur aggregiert,
- redaktionierte Fehlercodes.

## Fehlervertrag

Alle neuen Fehlerfälle brauchen stabile Codes:

- `origin_not_allowed`,
- `rate_limited`,
- `insecure_deployment_config`,
- `missing_required_secret`,
- `unsafe_base_url`,
- `proxy_not_trusted`,
- `diagnostics_unavailable`.

Fehlermeldungen sind verständlich, aber nicht forensisch ausführlich. Details für lokale Diagnose dürfen nur in redaktionierten Ops-Logs erscheinen.

## Scope-Grenze zur öffentlichen Plattform

V1.0.9 darf nicht als Grundlage nutzen, um heimlich öffentliche Nutzer einzuführen.

Nicht Teil dieser Spezifikation:

- Account-Auth,
- Password/OAuth/Passkeys,
- Freundeslisten,
- öffentliche Lobbyliste,
- Matchmaking,
- Moderation,
- Public Chat,
- Spectator,
- Public Replays,
- Ranked oder Turniere,
- Load Balancing oder horizontale Match Worker.

Diese Themen bleiben spätere harte Gates.
