# V2.0 Account- und persönliche Deck-API

Stand: 2026-07-18

Status: API-Freeze für die geschlossene Alpha

## Accountoperationen

| Operation | Methode und Pfad | Auth |
| --- | --- | --- |
| Einladung prüfen | `GET /api/account/invites/:token` | Invite-Token |
| Einladung einlösen | `POST /api/account/invites/:token/accept` | Invite-Token |
| Login | `POST /api/account/login` | öffentlich, rate-limited |
| Session-Self | `GET /api/account/session` | Account-Cookie |
| Logout | `POST /api/account/logout` | Cookie + CSRF |
| alle Geräte abmelden | `POST /api/account/sessions/revoke-all` | Cookie + CSRF |
| Passwort ändern | `POST /api/account/password` | Cookie + CSRF + aktuelles Passwort |
| Reset einlösen | `POST /api/account/resets/:token/accept` | Reset-Token |
| Einladung erzeugen | `POST /api/account/admin/invites` | Admin-Cookie + CSRF |
| Reset erzeugen | `POST /api/account/admin/resets` | Admin-Cookie + CSRF |
| Account exportieren | `GET /api/account/export` | Account-Cookie |
| Account löschen | `DELETE /api/account` | Cookie + CSRF + aktuelles Passwort |

Login und Einladungseinlösung setzen das Cookie und liefern
`{ account, session, csrfToken }`. `csrfToken` wird nicht persistiert. Fehler
für Login, Invite und Reset enthalten keine Account-Existenzinformation.

## Standard-Decks

| Operation | Methode und Pfad | Auth |
| --- | --- | --- |
| Katalog lesen | `GET /api/decks/standards` | keine |
| Standard validieren/snapshotten | `POST /api/decks/standards/:id/snapshot` | keine |

Der Katalog enthält nur `standard`-Einträge und vollständige Kartenlisten, da
diese Decks bewusst öffentlich innerhalb der Anwendung sind. Interne
Klassifikationen werden nicht ausgeliefert.

## Persönliche Decks

| Operation | Methode und Pfad | Auth |
| --- | --- | --- |
| Liste | `GET /api/account/decks` | Account-Cookie |
| anlegen/importieren | `POST /api/account/decks` | Cookie + CSRF |
| Standard kopieren | `POST /api/account/decks/copy-standard` | Cookie + CSRF |
| lesen | `GET /api/account/decks/:id` | Owner-Cookie |
| ändern | `PUT /api/account/decks/:id` | Owner-Cookie + CSRF + erwartete Version |
| löschen | `DELETE /api/account/decks/:id` | Owner-Cookie + CSRF |
| Match-Snapshot | `POST /api/account/decks/:id/snapshot` | Owner-Cookie + CSRF |

Listen liefern Quote `{ limit, used, remaining }`. Fremde IDs antworten wie
nicht vorhandene IDs. Das 51. Deck liefert `409 account_deck_limit_reached`.
Versionskonflikte liefern `409 account_deck_version_conflict`.

## Cookie, CORS und CSRF

- Browserrequests verwenden `credentials: include`.
- Private-Internet-Cookie: `HttpOnly; Secure; SameSite=Lax; Path=/`.
- Lokale Entwicklung darf `Secure` nur auf Loopback deaktivieren.
- Mutationen verlangen erlaubte Origin und `X-NETGRID-CSRF`.
- CORS erlaubt Credentials ausschließlich für explizite Origins.

## Payloadverbote

Keine Response enthält Passwortfelder, Token-Hashes, Invite-/Reset-Hash,
Account-Session-Rohwert, fremde Deckliste, Match-FullState, `privatePayload`,
`AIInput` oder `DecisionDebug`.
