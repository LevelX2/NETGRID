# V2.0 Account-, Session- und Passkey-Vertrag

Stand: 2026-05-17  
Status: Vertragsfreeze vor Implementierung  
Quelle: `docs/derived/V2_0_AUTH_PRIVACY_DECISION_SPIKE.md`

## Scope

Dieser Vertrag definiert den kleinsten V2.0-Auth-Schnitt für eine geschlossene private Account-Alpha. Er führt keine öffentliche Registrierung, keine Cloud-Decks, keine Public-Lobby und keine Engine- oder KI-Änderung ein.

Gültige Produktentscheidung:

- Accounts sind optional und nur für bekannte Nutzer.
- Lokaler Gast-/Privatmodus bleibt erhalten.
- Account-Sessions sind eine eigene widerrufbare Auth-Schicht.
- Match-Join-, Match-Session- und Match-Reconnect-Tokens bleiben per-match Capabilities.
- `GameState`, `PlayerView`, `LegalAction`, `PublicGameEvent`, Replay-StateHash, `AIInput` und `DecisionDebug` bleiben accountfrei.

## Architekturentscheidung

### Account-Auth

Der erste V2.0-Pfad ist Passkey-first:

1. Ein Admin legt einen Account oder eine Einladung an.
2. Der Nutzer akzeptiert die Einladung und registriert mindestens einen Passkey.
3. Weitere Passkeys können vom eingeloggten Nutzer oder per Admin-Recovery ergänzt werden.
4. OAuth-Provider, Passwortdatenbank, öffentliche Registrierung und E-Mail-Zwang sind nicht Teil von V2.0 Alpha.

Falls WebAuthn/Passkey wegen Deployment, RP-ID oder Testbarkeit nicht sauber absicherbar ist, bleibt Auth-Code blockiert. Ein reines localStorage-Bearer-Token-Modell ist für Accounts nicht zulässig.

### Account-Session

Account-Sessions werden über serverseitig widerrufbare, gehashte Session-Tokens geführt. Zielzustand ist ein Cookie:

| Feld | Vertrag |
| --- | --- |
| Cookie-Name | `ng_account_session` |
| Inhalt | undurchsichtiger zufälliger Account-Session-Token |
| Speicherung Browser | Cookie, nicht `localStorage` oder `sessionStorage` |
| Cookie-Flags Produktion | `HttpOnly`, `Secure`, `SameSite=Lax` oder strenger, `Path=/` |
| Lebensdauer | kurz genug für private Alpha, initial maximal 14 Tage |
| Rotation | nach Login, Recovery, Credential-Änderung und optional periodisch |
| DB-Speicherung | nur Hash, nie Rohwert |

Lokale Entwicklung darf einen eigenen Testmodus haben, aber Produktions- und private-Internet-Profil dürfen keine unsicheren Account-Session-Cookies akzeptieren.

### Deployment-Bedingung

Account-Cookies setzen Same-Site-Fähigkeit voraus. Wenn Web und API auf getrennten Origins laufen, muss vor Auth-Code eines gelten:

1. Reverse Proxy/BFF stellt Web und Account-API unter derselben Site bereit.
2. API-Cookie-Domain und `SameSite`-Strategie sind nachweislich kompatibel.
3. Der Auth-Slice bleibt blockiert.

`NETGRID_WEB_BASE_URL`, `NETGRID_SERVER_BASE_URL` und `NETGRID_ALLOWED_ORIGINS` bleiben Pflichtanker aus dem Private-Internet-Hardening. Eine Wildcard-Origin bleibt verboten.

## Datenmodell

### `accounts`

| Feld | Typ | Pflicht | Bemerkung |
| --- | --- | --- | --- |
| `accountId` | string | ja | stabil, nicht aus Anzeigename ableiten |
| `displayName` | string | ja | sichtbare Nutzerangabe, personenbezogen |
| `status` | `active`/`disabled`/`deleted` | ja | `deleted` blockiert Login und Account-APIs |
| `role` | `user`/`admin` | ja | V2.0 nur minimale Adminrolle |
| `createdAt` | ISO string | ja |  |
| `updatedAt` | ISO string | ja |  |
| `deletedAt` | ISO string | nein | nur bei Löschung |
| `contactHash` | string | nein | optionaler späterer Kontaktkanal, kein V2.0-Muss |

Nicht zulässig: Passwort-Hash, Klartext-E-Mail als Muss, Accountdaten in Engine-State.

### `account_credentials`

| Feld | Typ | Pflicht | Bemerkung |
| --- | --- | --- | --- |
| `credentialId` | string | ja | WebAuthn Credential ID, für Logs redigieren |
| `accountId` | string | ja |  |
| `publicKey` | string/bytes | ja | WebAuthn Public Key |
| `signCount` | number | ja | Replay-/Clone-Erkennung nach WebAuthn-Vertrag |
| `label` | string | nein | nutzergewähltes Gerätelabel |
| `createdAt` | ISO string | ja |  |
| `lastUsedAt` | ISO string | nein | personenbezogene Nutzungsmetadaten |
| `revokedAt` | ISO string | nein | Credential ist nicht mehr nutzbar |

### `account_sessions`

| Feld | Typ | Pflicht | Bemerkung |
| --- | --- | --- | --- |
| `sessionId` | string | ja | interne ID |
| `accountId` | string | ja |  |
| `sessionTokenHash` | string | ja | salted Hash, nie Rohwert |
| `createdAt` | ISO string | ja |  |
| `lastSeenAt` | ISO string | ja | personenbezogen |
| `expiresAt` | ISO string | ja | muss enforced werden |
| `revokedAt` | ISO string | nein | widerrufen |
| `deviceLabel` | string | nein | optional, keine User-Agent-Pflicht |

Nicht in V2.0 Alpha speichern, solange nicht separat entschieden: IP-Historie, vollständiger User-Agent, Geodaten.

### `account_invites`

| Feld | Typ | Pflicht | Bemerkung |
| --- | --- | --- | --- |
| `inviteId` | string | ja | interne ID |
| `inviteTokenHash` | string | ja | Einladungsrohwert nie persistieren |
| `targetAccountId` | string | ja |  |
| `createdByAccountId` | string | ja | Admin-Audit |
| `createdAt` | ISO string | ja |  |
| `expiresAt` | ISO string | ja | kurzlebig |
| `usedAt` | ISO string | nein | einmalig nutzbar |
| `revokedAt` | ISO string | nein |  |

Recovery nutzt dasselbe Muster wie Invite: kurzlebig, einmalig, gehasht, nie in Logs.

### Match-Session-Verknüpfung

Bestehende `SessionRecord`-ähnliche Match-Teilnehmer können optional `accountId` tragen. Diese Verknüpfung ist Metadatum, keine Regelautorität.

Vertrag:

- Ein gültiger Account allein erlaubt keine PlayerActions.
- Eine gültige Match-Session allein erlaubt nur Match-Capability-Flows, keine Account- oder Cloud-Deck-APIs.
- Account-Löschung entfernt oder anonymisiert die Account-Verknüpfung, ändert aber keine historischen Engine-Events und keinen StateHash.
- Gegnerpayloads erhalten keine Account-ID.

## API-Vertrag

Die konkreten Pfade können im Implementation-Slice angepasst werden, die fachlichen Operationen sind Pflicht:

| Operation | Methode/Pfad-Vorschlag | Auth | Ergebnis |
| --- | --- | --- | --- |
| Invite prüfen | `GET /api/auth/invites/:token` | Invite-Token | redigierter Account-/Statushinweis |
| Passkey-Registrierung starten | `POST /api/auth/passkeys/register/options` | Invite oder Account-Session | Challenge mit Ablauf |
| Passkey-Registrierung abschließen | `POST /api/auth/passkeys/register/verify` | Invite oder Account-Session | Credential gespeichert, Account-Session gesetzt |
| Passkey-Login starten | `POST /api/auth/passkeys/login/options` | keine Account-Session | Challenge mit Ablauf |
| Passkey-Login abschließen | `POST /api/auth/passkeys/login/verify` | Challenge | Account-Session-Cookie gesetzt |
| Aktuelle Session lesen | `GET /api/account/session` | Account-Session | Account-Selbstsicht |
| Logout aktuelles Gerät | `POST /api/account/session/logout` | Account-Session + CSRF | Session widerrufen, Cookie gelöscht |
| Alle Geräte abmelden | `POST /api/account/sessions/revoke-all` | Account-Session + CSRF | alle Sessions widerrufen |
| Credential widerrufen | `POST /api/account/passkeys/:credentialId/revoke` | Account-Session + CSRF | Credential widerrufen |

Alle mutierenden Account-Endpunkte benötigen Origin-Prüfung, Rate-Limit und CSRF-Schutz. Fehler geben keine Auskunft darüber, ob ein konkreter Account oder Credential existiert, außer in eingeloggter Selbstsicht.

## CSRF-, Origin- und Rate-Limit-Vertrag

Pflichten:

- `Origin`/`Referer` muss bei mutierenden Account-Endpunkten gegen die Allowlist geprüft werden.
- Zusätzlich wird ein CSRF-Token verwendet, das nicht im `HttpOnly` Account-Session-Cookie liegt.
- CSRF-Token ist an Account-Session und Ablauf gebunden.
- `GET`-Endpunkte verändern keinen Zustand.
- Login-, Invite-, Recovery- und Passkey-Challenge-Endpunkte nutzen strengere Rate-Limits als normale Match-Actions.

Empfohlene CSRF-Form:

- Server setzt oder liefert `ng_csrf` als nicht-HttpOnly Wert für denselben Site-Kontext.
- Client sendet `X-NETGRID-CSRF: <token>` bei mutierenden Account-Endpunkten.
- Server prüft Token-Hash, Account-Session, Ablauf und Origin.

## WebAuthn-/Passkey-Vertrag

Pflichten:

- RP-ID wird aus dem finalen Web-Origin abgeleitet und in Tests fest konfiguriert.
- Challenge ist zufällig, kurzlebig, einmalig und serverseitig gespeichert oder gehasht.
- Challenge ist an Operation, Account/Invite und Origin gebunden.
- Registration prüft Attestation-/ClientData-/AuthenticatorData-Felder über eine etablierte WebAuthn-Bibliothek.
- Login prüft Assertion, Credential-ID, Signatur, Challenge, Origin, RP-ID und Sign Counter.
- Credential-ID, Challenge und ClientData werden in Logs redigiert.

Nicht im ersten Slice:

- plattformübergreifendes Account-Recovery per E-Mail.
- MFA-Policy über Passkey hinaus.
- OAuth-Verknüpfung.

## Revocation-Vertrag

| Fall | Erwartung |
| --- | --- |
| Logout aktuelles Gerät | aktuelle `account_sessions.revokedAt` gesetzt, Cookie gelöscht, Account-APIs lehnen ab |
| Alle Geräte abmelden | alle aktiven Account-Sessions des Accounts widerrufen |
| Credential widerrufen | neue Logins mit dieser Credential-ID scheitern; bestehende Sessions bleiben bis Logout/Revoke gültig, sofern nicht anders gewählt |
| Account deaktiviert | Login und Account-APIs scheitern; bestehende Account-Sessions werden beim nächsten Check ungültig |
| Account gelöscht | Sessions widerrufen, Cloud-Daten nach Löschvertrag entfernt, Match-Metadaten anonymisiert/entkoppelt |
| Invite widerrufen | Invite kann keine Registrierung starten oder abschließen |
| Invite genutzt | Invite wird `usedAt` und kann nicht wiederverwendet werden |
| Recovery genutzt | altes Recovery-Token wird `usedAt`, alle vorherigen Account-Sessions werden widerrufen |

Match-Tokens:

- Logout einer Account-Session widerruft nicht automatisch laufende Match-Sessions.
- Account-Deaktivierung oder -Löschung darf keine neuen accountgebundenen Matchstarts erlauben.
- Aktive accountgebundene Matches müssen vor Löschung beendet, verlassen, forfaitiert oder ausdrücklich entkoppelt werden.
- Match-Reconnect bleibt über Match-Reconnect-Token möglich, solange dieser nicht separat widerrufen wurde.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| V20-AUTH-T001 | Cookie-Flags | Produktion setzt `ng_account_session` nur mit `HttpOnly`, `Secure`, `SameSite` und ohne Rohwert in JSON |
| V20-AUTH-T002 | Same-Site-Blocker | Auth-Preflight schlägt fehl, wenn Web/API-Cookie-Strategie nicht tragfähig ist |
| V20-AUTH-T003 | Invite einmalig | genutzter oder widerrufener Invite kann keine Passkey-Registration starten |
| V20-AUTH-T004 | Passkey-Challenge | abgelaufene, fremde oder wiederverwendete Challenge wird abgelehnt |
| V20-AUTH-T005 | Credential-Revocation | widerrufene Credential kann nicht einloggen |
| V20-AUTH-T006 | Account-Session-Hash | DB/Storage enthält keinen Account-Session-Rohwert |
| V20-AUTH-T007 | Logout aktuelles Gerät | aktuelle Account-Session ist danach ungültig |
| V20-AUTH-T008 | Revoke all | alle Account-Sessions werden ungültig |
| V20-AUTH-T009 | Account deaktiviert | Login und Account-APIs scheitern ohne Account-Existenz-Leak |
| V20-AUTH-T010 | CSRF | mutierende Account-Endpunkte lehnen fehlendes/falsches CSRF-Token ab |
| V20-AUTH-T011 | Origin | mutierende Account-Endpunkte lehnen fremde Origin ab |
| V20-AUTH-T012 | Rate-Limit | Login-/Invite-/Recovery-Probes werden begrenzt |
| V20-AUTH-T013 | Match-Trennung | Account-Session ohne Match-Token kann keine PlayerAction einreichen |
| V20-AUTH-T014 | Guest-Modus | lokaler Gast-/Privatmodus funktioniert ohne Account-Session |
| V20-AUTH-T015 | Account-Link-Redaction | Gegnerpayload, PlayerView, PublicEvent, AIInput und DecisionDebug enthalten keine Account-ID |
| V20-AUTH-T016 | Replay/StateHash | Account-Metadaten ändern Replay-StateHash nicht |
| V20-AUTH-T017 | Browser-Storage | Account-Session-Rohwerte erscheinen nicht in localStorage/sessionStorage |
| V20-AUTH-T018 | Log-Scan | Logs/Fehler enthalten keine Session-, Invite-, Challenge- oder Credential-Rohwerte |

## Implementierungsgrenzen

Ein nachfolgender Foundation-Slice darf:

- Speicherstruktur und Hash-/Revocation-Helfer für Accounts vorbereiten.
- Account-Session-Checks als isolierten Service ergänzen.
- Redaction- und Testharness vorbereiten.

Er darf nicht:

- Accountdaten in Engine-State oder KI-Input schieben.
- Match-Token-Flows durch Accountpflicht ersetzen.
- Cloud-Decks oder öffentliche Plattformfeatures starten.
- OAuth, Passwörter oder öffentliche Registrierung einführen.

## Offene Annahmen

- Für private Alpha reicht Admin-Invite ohne öffentlichen Signup.
- E-Mail/Kontaktkanal bleibt optional und wird vor Nutzung separat entschieden.
- Same-Site-Cookiefähigkeit ist der zentrale technische Blocker vor Auth-Code.
- Passkey/WebAuthn wird mit einer etablierten Bibliothek umgesetzt; kein eigenes Kryptoprotokoll.
