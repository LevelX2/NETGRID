# V2.0 Passwort-Accounts und persönliche Decks – Testmatrix

Stand: 2026-07-18

Status: verifiziert für die geschlossene Alpha

| ID        | Nachweis                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------- |
| T-AUTH-01 | Admin-Bootstrap erzeugt genau einen Admin; Wiederholung wird abgelehnt.                         |
| T-AUTH-02 | Einladung ist gehasht, kurzlebig, einmalig und nach Nutzung unbrauchbar.                        |
| T-AUTH-03 | Normalisierte Anmeldenamen sind eindeutig; Anzeigenamen dürfen gleich sein.                     |
| T-AUTH-04 | Passwortgrenzen, Unicode-NFC und Blockliste werden geprüft.                                     |
| T-AUTH-05 | SQLite enthält weder Klartextpasswort noch Account-Session-/CSRF-/Invite-Rohwert.               |
| T-AUTH-06 | Loginfehler unterscheidet unbekannt, deaktiviert und falsches Passwort öffentlich nicht.        |
| T-AUTH-07 | Account-Session läuft ab und kann einzeln sowie vollständig widerrufen werden.                  |
| T-AUTH-08 | Passwortänderung widerruft andere Sessions und erhöht `credentialVersion`.                      |
| T-AUTH-09 | Account-Cookie autorisiert keine Matchaction; Matchtoken autorisiert keine Account-API.         |
| T-AUTH-10 | Mutationen ohne/mit falschem CSRF oder Origin werden abgelehnt.                                 |
| T-AUTH-11 | Private Internet setzt `Secure`, `HttpOnly`, `SameSite=Lax`; Loopback-Testpfad bleibt möglich.  |
| T-AUTH-12 | Login, Invite, Reset und Adminoperationen werden rate-limited.                                  |
| T-WEB-01  | Login, Session-Self, Logout und Passwortänderung funktionieren im Browser.                      |
| T-WEB-02  | Account-Session-Rohwert liegt weder in `localStorage` noch `sessionStorage`.                    |
| T-WEB-03  | Gastmodus, Match-Recovery und zwei Browserkontexte bleiben regressionsfrei.                     |
| T-DECK-01 | Account A kann Deck von Account B nicht listen, lesen, ändern, löschen oder snapshotten.        |
| T-DECK-02 | 50 Decks können angelegt werden; das 51. wird atomar abgelehnt.                                 |
| T-DECK-03 | Veraltete `deckVersion` wird als Konflikt abgelehnt.                                            |
| T-DECK-04 | Ungültiger Draft ist speicherbar, aber nicht als Match-Snapshot verwendbar.                     |
| T-DECK-05 | Standard-Deck ist unveränderlich und kann als persönliches Deck kopiert werden.                 |
| T-DECK-06 | Nur `standard`-Katalogeinträge erscheinen in API und normaler UI.                               |
| T-DECK-07 | Lokaler Import ist explizit und zählt gegen die Quote.                                          |
| T-DECK-08 | Draftänderung nach Matchstart verändert Snapshot, Replay und StateHash nicht.                   |
| T-DECK-09 | Gegnerpayload, Lobby, Replay, Logs und KI enthalten keine fremde Deckliste oder Accountdeck-ID. |
| T-DECK-10 | Accountlöschung entfernt persönliche Decks, aber keine Match-Engine-Historie.                   |
| T-STOR-01 | Migration Schema 1 zu 2 erhält bestehende Matches und Account-Foundation-Daten.                 |
| T-STOR-02 | Backup/Restore enthält Match-, Account-, Session- und Decktabellen.                             |
| T-STOR-03 | `integrity_check` und `foreign_key_check` sind nach Migration und Restore grün.                 |
| T-REG-01  | Visibility-, Replay-, StateHash-, stale-action- und illegal-action-Gates bleiben grün.          |
| T-REG-02  | Server-/Web-Typecheck, relevante Tests und Build laufen regulär durch.                          |

## Browser-E2E-Szenarien

1. Admin lädt Account ein; Nutzer setzt Namen/Passwort und erhält Session.
2. Nutzer meldet sich ab und wieder an; Browser-Storage-Scan bleibt leer.
3. Zwei Accounts sehen nur ihre eigenen Decks.
4. Standard kopieren, bearbeiten, speichern und Match starten.
5. Quote 50/51 und Versionskonflikt erscheinen verständlich.
6. Gast nutzt lokale Datei-Decks weiterhin ohne Account.

## Leak-Schlüssel

Automatische Payload-/Log-/Storage-Scans suchen mindestens nach
`ng_account_session`, `sessionTokenHash`, `csrfTokenHash`, `passwordHash`,
`inviteTokenHash`, `resetTokenHash`, `privatePayload`, `cardInstances`,
`fullGameState`, `AIInput`, `DecisionDebug` und fremden Testdeckwerten.

## Ausgeführte Nachweise

| Matrixbereich               | Ausführbarer Nachweis                                                                | Ergebnis                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `T-AUTH-01` bis `T-AUTH-12` | `account-session`, `account-password`, `account-http-auth`, `storage-account-schema` | 11 Tests grün; gemeinsam mit den Decktests 15 Accounttests grün                                     |
| `T-WEB-01` bis `T-WEB-03`   | vollständige Web-Suite und realer Playwright-Lauf auf der Startskript-LAN-Origin     | 51 Dateien/635 Tests grün; Login, Session-Self und Gast-/Accountwechsel im Browser bestätigt        |
| `T-DECK-01` bis `T-DECK-10` | `account-decks`, `account-decks-http`, Payload-/Replay-/Snapshot-Regressionen        | Owner-404, Quote, Parallelanlage, Version, Standardkopie, Export/Löschung und Snapshot-Handoff grün |
| `T-STOR-01` bis `T-STOR-03` | `storage-account-schema`, Storage-Backup-/Integritätsvertrag                         | Schemamigration, Hash-only-Persistenz und gemeinsame SQLite-Grenze grün                             |
| `T-REG-01`                  | Contracttests, vollständige Server-Suite, drei AI-Shards, Proteus-Readiness          | 173 Servertests, 2.624 AI-Tests und Proteus 154/154 grün                                            |
| `T-REG-02`                  | `corepack pnpm typecheck`, `corepack pnpm test:contracts`, `corepack pnpm build`     | grün                                                                                                |

Der Browserlauf hat zusätzlich Standardkopie, Quote `1/50`, Umbenennen,
Speichern und die direkte Standard-Auswahl am Matchstart bestätigt. Ein
gezielter Sichtbarkeitstest stellt sicher, dass alle eingefrorenen lokalen
Quell-IDs der Klassen `standard`, `internal_ai`, `test_fixture` und `retire`
im normalen Gasteditor unsichtbar bleiben, ohne ihre Dateien beim nächsten
Speichern zu löschen.

## Projektweite Bestandsabweichungen

Zwei zusätzliche AI-Ratchet-Checks sind bereits auf dem unveränderten
lokalen `main` rot und wurden durch diesen Release nicht verschlechtert:

- `check:ai-source-structure` meldet zwei schon auf `main` über ihrer
  hinterlegten Zeilengrenze liegende Corp-Score-Dateien.
- `check:ai-derived-facts-full` meldet einen schon auf `main` veralteten
  generierten Coverage-Report.

Beide Abweichungen betreffen weder Account-/Deckcode noch Engine-, Hidden-
Info-, Replay-, StateHash- oder KI-Laufzeitverhalten. Die drei vollständigen
AI-Testshards und die Proteus-Readiness sind grün; die Ratchets werden nicht
durch eine fachfremde Baseline-Erhöhung oder Report-Neugenerierung in diesem
Release kaschiert.
