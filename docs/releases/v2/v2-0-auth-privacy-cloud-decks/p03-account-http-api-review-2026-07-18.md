# P03-Review – Geschlossene Account-HTTP-API

Stand: 2026-07-18

Ergebnis: abgeschlossen

## Umgesetzt

- Der reguläre Serverstart aktiviert den Account-Service auf der
  konfigurierten SQLite-Datenbank; isolierte Testserver bleiben ohne explizite
  Account-Service-Injektion geschlossen.
- Lokaler Erstadmin-Bootstrap sowie lokale Invite-/Reset-Kommandos sind über
  `corepack pnpm account:auth -- ...` verfügbar.
- Login, Session-Self, Logout, Revoke-all und Passwortwechsel sind als
  Account-HTTP-API umgesetzt.
- Admins können einmalige Einladungen und Reset-Tokens erzeugen. Invite und
  Reset werden atomar beansprucht, verfallen und können nicht wiederverwendet
  werden.
- Das Account-Cookie ist `HttpOnly`, `SameSite=Lax` und im
  Private-Internet-Profil immer `Secure`. Der Rohwert erscheint in keiner
  JSON-Response.
- Mutationen prüfen explizite Origin, Account-Session und CSRF. Adminrouten
  prüfen zusätzlich die Accountrolle. Login, Invite und Reset sind
  rate-limited und verwenden neutrale öffentliche Fehler.
- Account-Session, Maintenance-Session und Match-Capabilities bleiben
  unterschiedliche Cookie-/Tokenräume.

## Nachweise

- `corepack pnpm --filter @netgrid/server typecheck`: grün.
- `corepack pnpm --filter @netgrid/server exec vitest run src/account-session.test.ts src/account-password.test.ts src/account-http-auth.test.ts src/storage-account-schema.test.ts src/maintenance-http-auth.test.ts`: 5 Dateien, 12 Tests grün.
- Die HTTP-Tests decken neutralen Loginfehler, Cookieattribute, Secure-Cookie,
  Origin, CSRF, Adminrolle, einmalige Einladung, einmaligen Reset,
  Sessionwiderruf und Response-Redaction ab.
- `git diff --check`: grün.

## Done-Gate

Erfüllt. Ein geschlossener Account kann über Invite angelegt, angemeldet,
abgemeldet und vollständig widerrufen werden. Kein Account-Session-Rohwert
wird an JavaScript ausgegeben; Match-Capabilities werden nicht aus dem
Account-Cookie abgeleitet.
