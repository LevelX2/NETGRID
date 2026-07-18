# V2.0 Passwort-Accounts und persönliche Server-Decks – Requirements

Stand: 2026-07-18

Status: frozen für die geschlossene Alpha

## Muss-Anforderungen

### Accounts und Anmeldung

- AUTH-001: Accounts werden nur durch lokalen Admin-Bootstrap oder eine
  einmalige Admin-Einladung angelegt.
- AUTH-002: Der normalisierte Anmeldename ist eindeutig und vom sichtbaren
  Anzeigenamen getrennt.
- AUTH-003: Die erste Authentisierung verwendet Anmeldename und Passwort;
  E-Mail ist weder Pflichtfeld noch Recovery-Kanal.
- AUTH-004: Passwörter werden ausschließlich als speicherharter,
  parameterversionierter Hash mit individuellem Salt gespeichert.
- AUTH-005: Account-Sessions sind serverseitig widerrufbar, laufen ab und
  werden ausschließlich über ein `HttpOnly`-Cookie transportiert.
- AUTH-006: Account-Sessions und Match-Capabilities sind getrennt. Keine der
  beiden Authentisierungen ersetzt die andere.
- AUTH-007: Login-, Einladungs- und Admin-Flows sind rate-limited und geben
  keine Account-Existenz preis.
- AUTH-008: Mutierende Account- und Deck-Operationen prüfen Origin und ein an
  die Account-Session gebundenes CSRF-Token.
- AUTH-009: Passwortänderung widerruft alle anderen Account-Sessions.
- AUTH-010: Gast-/Privatmodus und bestehende Match-Recovery bleiben erhalten.

### Persönliche Decks

- DECK-001: Ein aktiver Account kann höchstens 50 nicht gelöschte persönliche
  Decks besitzen; die Grenze wird serverseitig und atomar erzwungen.
- DECK-002: Persönliche Decks sind ausschließlich für ihren Owner sichtbar und
  änderbar.
- DECK-003: Updates verwenden eine Deckversion für Optimistic Locking.
- DECK-004: Ungültige Decks dürfen gespeichert, aber nicht als Match-Snapshot
  verwendet werden.
- DECK-005: Jeder Matchstart revalidiert das Deck und erzeugt einen
  unveränderlichen Snapshot. Spätere Draftänderungen verändern kein Match.
- DECK-006: Lokale Datei-Decks werden nur durch eine ausdrückliche
  Nutzeraktion in das Konto importiert.
- DECK-007: Account-Export und -Löschung umfassen persönliche Decks; Match-
  Snapshots bleiben nach Datenschutzvertrag entkoppelt.

### Standard-Decks

- STD-001: Standard-Decks sind versionierte, unveränderliche
  Projektartefakte und keine Accountdatensätze.
- STD-002: Der normale Benutzerkatalog enthält ausschließlich Einträge mit
  Klassifikation `standard`.
- STD-003: `internal_ai`, `test_fixture` und `retire` sind in der normalen UI
  unsichtbar, bleiben aber als benötigte Evidence unverändert erhalten.
- STD-004: Ein Standard-Deck kann direkt gespielt oder in ein neues
  persönliches Deck kopiert werden. Die Kopie zählt gegen die 50er-Quote.
- STD-005: Änderungen an einem Standard verändern keine vorhandene
  persönliche Kopie und kein laufendes oder historisches Match.

### Sicherheit und Datenschutz

- SEC-001: Rohwerte von Passwörtern, Account-Sessions, CSRF, Einladungen und
  Resets erscheinen nicht in Datenbank, Logs, Fehlern, Browser-Storage,
  WebSocket-Payloads oder Replays.
- SEC-002: Gegnerpayloads enthalten keine Account-ID, persönliche Deck-ID,
  fremde Deckliste oder stabilen privaten Deckhash.
- SEC-003: `GameState`, `PlayerView`, `LegalAction`, `PublicGameEvent`,
  Replay-StateHash, `AIInput` und `DecisionDebug` bleiben accountfrei.
- SEC-004: Die gemeinsame SQLite-Datei besitzt eine versionierte Migration
  und wird vollständig durch Backup, Restore und Integritätsprüfung erfasst.
- SEC-005: Das private Internetprofil akzeptiert Accountcookies nur über HTTPS
  und explizite Origins.

## Nicht-Ziele

E-Mail, Passkeys, MFA, öffentliche Registrierung, öffentliche Profile,
Freundeslisten, Rankings, Chat, Decksharing, Postgres und Multi-Instance-
Betrieb sind nicht Teil dieser Alpha.

## Done

Alle Muss-Anforderungen besitzen einen Test oder eine explizite
Verifikationszeile in `password-accounts-cloud-decks-test-matrix.md`.
