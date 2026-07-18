# V2.0 Benutzerprofile, Passwort-Alpha und persönliche Server-Decks

Stand: 2026-07-18

Status: Releaseplan-Entwurf, keine Implementierungsfreigabe

Ziel: erste belastbare Benutzerverwaltung für privaten Internetbetrieb

## 1. Zielbild und Planungsentscheidung

NETGRID soll zunächst eine geschlossene Account-Alpha für bekannte Spieler
erhalten. Ein Spieler meldet sich mit einem eindeutigen Anmeldenamen und einem
Passwort an, besitzt ein separates sichtbares Profil und kann bis zu 50 eigene
Decks serverseitig speichern. Kuratierte Standard-Decks sind für alle Spieler
lesbar und spielbar; zum Bearbeiten werden sie als eigenes Deck kopiert.

Die erste Stufe benötigt noch keinen E-Mail-Versand. Das Datenmodell und die
Credential-Grenzen werden jedoch so angelegt, dass E-Mail-Verifikation,
Recovery, Passkeys und Mehrfaktor-Authentifizierung später ergänzt werden
können, ohne Accounts, Sessions oder Decks neu zu schneiden.

Empfohlene Produktgrenzen der ersten Stufe:

- geschlossene Registrierung per Admin-Anlage oder einmaliger Einladung;
- Anmeldung zunächst mit Anmeldename und Passwort;
- E-Mail-Felder im Schema vorbereitet, aber in der ersten Stufe nicht erhoben
  oder für Anmeldung und Recovery verwendet;
- Passwort-Recovery zunächst nur über einen kurzlebigen, einmalig nutzbaren
  Admin-Reset;
- lokaler Gast-/Privatmodus bleibt erhalten;
- keine öffentliche Accountregistrierung, öffentliche Profile, Lobbys,
  Freundeslisten, Rankings, Statistiken oder Deckfreigaben;
- keine Accountdaten in `GameState`, `PlayerView`, `LegalAction`,
  `PublicGameEvent`, Replay-StateHash, `AIInput` oder `DecisionDebug`.

Dieser Plan ersetzt die Passkey-first-Empfehlung aus
`auth-privacy-decision-spike.md` noch nicht stillschweigend. Vor Umsetzung muss
der Wechsel zu Passwort-first als bewusste V2.0-Produktentscheidung
freigegeben und der bestehende Account-Vertrag entsprechend aktualisiert
werden. Passkeys bleiben der empfohlene spätere phishing-resistente Zielpfad.

## 2. Ausgangslage

### Bereits vorhanden

- `apps/server/src/account-session.ts` besitzt Account-, Credential- und
  Account-Session-Records, eine SQLite-Schicht, gehashte Account-Session-Tokens,
  Ablaufprüfung sowie Einzel- und Gesamt-Revocation.
- Die Account-Session-Grundlage ist bewusst isoliert. Sie ist nicht in den
  laufenden HTTP-Server, die Weboberfläche oder Match-Teilnehmer eingebunden.
- SQLite ist der Standardstorage für Matches, Backup, Restore und Maintenance.
- Bearbeitbare persönliche Decks liegen derzeit in einer lokalen
  Datei-Deckbibliothek. Diese Bibliothek ist nicht accountgebunden und eignet
  sich auf einem zentralen Internetserver nicht als Benutzerstorage.
- Beim Matchstart werden bearbeitbare Decks bereits serverseitig validiert und
  als unveränderliche Match-Snapshots eingefroren.
- Die Weboberfläche bietet derzeit alle gültigen Projekt-Snapshots als
  `Projekt-Snapshot` an. Im aktuellen Snapshotbestand liegen spielerische
  Kandidaten, KI-Decks, Playtest-Decks und historische Demo-Stände noch in
  derselben sichtbaren Kategorie.

### Noch nicht vorhanden

- Passwort-Credential und Login-Prüfung;
- Account-HTTP-API, sichere Cookie-Anbindung, CSRF und Account-UI;
- Registrierung, Einladung oder Admin-Accountanlage als produktiver Flow;
- E-Mail-Verifikation und Passwort-Reset per E-Mail;
- Accountbindung an Match-Teilnehmer-Metadaten;
- accountgebundene persönliche Decks und Deckquote;
- kuratierter Standard-Deck-Katalog mit Sichtbarkeitsklassen;
- gemeinsame Schema-Migration, Backup-/Restore- und Löschverantwortung für
  Match-, Account- und Deckdaten.

## 3. Datenbank- und Storage-Entscheidung

### SQLite in der ersten Stufe

SQLite ist für eine private, geschlossene Account-Alpha sauber und
ausreichend. Benutzerkonten, Account-Sessions und persönliche Decks gehören in
die Datenbank. Klartextpasswörter, Session-Rohwerte, Reset-Rohwerte und
E-Mail-Verifikationstokens gehören nicht hinein.

Empfohlen wird eine autoritative Anwendungsdatenbank pro Deployment mit
getrennten fachlichen Tabellen und Services, einer gemeinsamen
Schema-Migrationskette sowie einem gemeinsamen Backup-/Restore-Gate. Mehrere
unabhängig verwaltete SQLite-Dateien würden Accountlöschung, Restore,
Integritätsprüfung und spätere Match-Account-Verknüpfungen unnötig erschweren.

Der Code darf weiterhin getrennte Storage-Ports für Match, Account und Deck
besitzen. Die gemeinsame physische SQLite-Datei ist keine Erlaubnis, Account-
oder Deckdaten in Engine-, Replay- oder KI-Verträge zu ziehen.

Postgres ist kein Muss für die erste Stufe. Ein Postgres-/Managed-DB-Gate wird
erst vor öffentlicher Registrierung, horizontaler Skalierung, mehreren
Serverinstanzen oder einer Verfügbarkeitszusage benötigt.

### Vorgeschlagenes fachliches Schema

| Tabelle | Kernfelder | Zweck und Grenze |
| --- | --- | --- |
| `accounts` | `account_id`, `login_name`, `login_name_normalized`, `display_name`, `status`, `role`, Zeitstempel | Stabile Identität; Anzeigename ist nicht der Login-Schlüssel. |
| `account_password_credentials` | `account_id`, `password_hash`, `algorithm`, `parameters_version`, `changed_at`, `must_change` | Genau ein aktuelles Passwort-Credential je Account; nur adaptiver Hash, nie Klartext. |
| `account_passkey_credentials` | bestehende Credential-Felder | Für späteren Passkey-Ausbau; nicht mit Passwortfeldern vermischen. |
| `account_sessions` | bestehende Sessionfelder plus optional `auth_strength`, `credential_version` | Widerrufbare Account-Sitzung; Rohwert nur im sicheren Cookie. |
| `account_invites` | Token-Hash, Zielaccount, Ablauf, Nutzung, Widerruf | Geschlossene Anlage oder Einladung; Rohwert nur einmal anzeigen. |
| `account_reset_tokens` | Token-Hash, Zielaccount, Ablauf, Nutzung, Widerruf | Admin-Reset in Stufe 1, später E-Mail-Recovery; ein Zweck pro Token. |
| `account_emails` | Originalwert, kanonischer Vergleichswert, `verified_at`, Zeitstempel | Erst ab E-Mail-Stufe aktiv nutzen; Verifikation und Änderung ausdrücklich modellieren. |
| `account_decks` | `cloud_deck_id`, `owner_account_id`, Deckmetadaten, Schema-/Versionsfeld, Zeitstempel, `deleted_at` | Bearbeitbarer persönlicher Draft; maximal 50 nicht gelöschte Decks je Account. |
| `account_deck_payloads` oder versioniertes `deck_json` | Kartenliste und bearbeitbarer Deckinhalt | Owner-only; keine Match-Hidden-Daten. Für die Alpha ist ein versioniertes JSON-Payload mit relational indizierten Metadaten ausreichend. |

Für `account_decks` gilt ein transaktionales, serverseitiges Limit von 50
aktiven Decks. Gelöschte Decks zählen nicht. Ein Account oberhalb eines später
abgesenkten Limits darf lesen, exportieren und löschen, aber kein weiteres Deck
anlegen. Die Quote soll konfigurierbar sein; der Produktdefault ist 50.

### Drei getrennte Deckarten

1. **Standard-Deck**: versioniertes, kuratiertes und unveränderliches
   Projektartefakt unter `data/decks/`; für alle Spieler sichtbar und direkt
   spielbar.
2. **Persönliches Deck**: accountgebundener bearbeitbarer Draft in der
   Datenbank; nur für den Owner sichtbar; maximal 50.
3. **Match-Snapshot**: validierter, unveränderlicher Snapshot im Matchstorage;
   weder Accountlöschung noch spätere Deckbearbeitung verändert ihn.

Interne KI-, Test-, Diagnose- und historische Decks bleiben versionierte
Projektartefakte, sind aber kein vierter benutzersichtbarer Decktyp.

## 4. Deckkuratierung und Benutzerverhalten

Vor der Account-Deck-UI wird jeder aktuelle Projekt-Snapshot genau einer
Klasse zugeordnet:

| Klasse | Benutzerverhalten |
| --- | --- |
| `standard` | Im Matchstart sichtbar, direkt spielbar und im Deckeditor über `Als eigenes Deck kopieren` nutzbar. |
| `internal_ai` | Nur KI-Pool, Simulation oder Diagnose; in normaler Benutzer-UI unsichtbar. |
| `test_fixture` | Nur automatisierte Tests/Szenarien; in normaler Benutzer-UI unsichtbar. |
| `retire` | Aus dem aktuellen Katalog entfernen, sofern kein aktiver Test-, KI- oder Evidence-Vertrag besteht. |

Die bestehende Sammlung darf nicht pauschal zu Standard-Decks erklärt werden.
Demo-, Classic-, Proteus- und KI-Decks werden auf folgende Kriterien geprüft:

- decklegal im aktuellen Format und Kartenpool;
- vollständig engine-/human-playable;
- für Menschen sinnvoll spielbar und nicht nur Mechaniktest;
- verständlicher Name und kurze strategische Beschreibung;
- keine nur diagnostisch benötigte Kartenmischung;
- bei KI-Nutzung weiterhin getrennte `ai_supported`-Freigabe.

Das Kopieren eines Standard-Decks erzeugt eine neue persönliche ID, setzt den
Owner, übernimmt den Inhalt und schlägt zunächst `<Standardname> – Kopie` als
Namen vor. Das Standard-Deck selbst bleibt unveränderlich. Eine spätere
Aktualisierung des Standards verändert bestehende persönliche Kopien nicht.

Lokale Datei-Decks werden nicht automatisch hochgeladen. Der Nutzer erhält
eine ausdrückliche Aktion `Lokales Deck in mein Konto importieren`. Der Import
zählt gegen die 50er-Quote und wird serverseitig neu validiert.

## 5. Release-Slices

### Slice A – Vertrags- und Storage-Freeze

Ziel: den Passwort-first-Wechsel und die Datenverantwortung vor Code klären.

In Scope:

- bestehenden Passkey-first-Vertrag auf Passwort-Alpha plus späteren
  Passkey-Ausbau umstellen;
- Same-Site-/Reverse-Proxy- und `HttpOnly Secure`-Cookie-Pfad festlegen;
- gemeinsame SQLite-Migration und Backup-/Restore-Verantwortung spezifizieren;
- Account-, Passwort-, Invite-/Reset- und Deckschema einfrieren;
- aktuellen Deckbestand in `standard`, `internal_ai`, `test_fixture` und
  `retire` inventarisieren;
- Datenschutz-Export/Löschung um Passwort-Metadaten, E-Mail-Vorbereitung und
  persönliche Decks ergänzen.

Gate:

- keine offene Credential-, Cookie-, Migration-, Retention- oder
  Decksichtbarkeitsfrage mehr, die das Schema verändern würde.

### Slice B – Geschlossene Passwort-Account-Alpha

Ziel: Account auswählen/anlegen, anmelden und sicher abmelden können.

In Scope:

- Admin legt einen Account an oder erzeugt eine einmalige Einladung;
- Nutzer setzt Anmeldename, Anzeigename und Passwort;
- Login, Session lesen, Logout aktuelles Gerät, alle Geräte abmelden,
  Passwort ändern;
- Admin-Reset mit kurzlebigem Einmal-Token, solange kein E-Mail-Service
  vorhanden ist;
- sichere Account-Cookies, CSRF, Origin-Prüfung, Rate Limits und generische
  Fehlermeldungen;
- einfacher Web-Einstieg `Anmelden`, `Account anlegen/einlösen`, `Abmelden`
  und `Profil`;
- optionaler `accountId`-Link nur in serverseitigen Match-Teilnehmer-Metadaten;
  PlayerActions benötigen weiterhin die Match-Capability.

Out of Scope:

- E-Mail-Eingabe, E-Mail-Reset, MFA, öffentliche Registrierung und
  öffentliche Profile.

Gate:

- Account-Session und Match-Session sind technisch und in Leaktests getrennt;
- Sessionablauf und Revocation werden serverseitig erzwungen;
- keine Account-Session-Rohwerte in Browser-Storage, Datenbank, Logs, Fehlern,
  WebSocket-Payloads oder Replays;
- bestehender Gast-/Privatmodus und alle Matchflows bleiben grün.

### Slice C – Persönliche Server-Decks und kuratierte Standards

Ziel: bis zu 50 eigene Decks verwalten und Standards kopieren können.

In Scope:

- Account-Deck-CRUD mit Ownerprüfung, Optimistic Locking und 50er-Quote;
- UI-Trennung `Standard-Decks` und `Meine Decks`;
- Standard-Deck direkt spielen oder als persönliches Deck kopieren;
- persönliches Deck anlegen, umbenennen, bearbeiten, kopieren, löschen,
  importieren und exportieren;
- expliziter Import aus der lokalen Datei-Deckbibliothek;
- serverseitige Revalidierung und immutable Match-Snapshot-Erzeugung;
- kuratierte Standards sichtbar, interne KI-/Test-/Altdecks unsichtbar;
- Account-Export und -Löschung umfassen persönliche Decks.

Gate:

- Account A kann Decks von Account B weder lesen noch durch ID-Raten ändern;
- das 51. Deck wird atomar abgelehnt;
- Standard-Decks bleiben unveränderlich;
- Gegnerpayload, Lobby, Replay, Logs und KI erhalten keine Cloud-Deck-ID oder
  fremde Deckliste;
- laufende und historische Matches bleiben von Deckänderung und
  Accountlöschung unbeeinflusst.

### Slice D – E-Mail-Verifikation und Recovery

Ziel: selbstständige Recovery und belastbare Kontaktadresse.

In Scope:

- E-Mail-Adresse erfassen, kanonisch vergleichen und Originalwert für Anzeige
  erhalten;
- Verifikationsmail mit zufälligem, kurzlebigem Einmal-Token;
- generischer Passwort-Reset ohne Account-Enumeration;
- E-Mail-Änderung nur nach frischer Reauthentifizierung und Bestätigung der
  neuen Adresse;
- austauschbarer Mail-Provider-Port, Queue/Retry, Zustellstatus und lokale
  Test-Sink-Implementierung;
- keine Tokens oder vollständigen Reset-URLs in Logs.

Entscheidung vor Slice D:

- konkreter Transaktionsmail-Anbieter, Absenderdomain, SPF/DKIM/DMARC,
  Retention und Zustellmonitoring.

Gate:

- unbestätigte Adresse kann keine Account-Recovery übernehmen;
- Tokens sind einmalig, kurzlebig, gehasht und rate-limited;
- Antworten verraten nicht, ob eine Adresse registriert ist.

### Slice E – Passkeys und Mehrfaktor-Authentifizierung

Ziel: phishing-resistente Anmeldung und optional stärkere Accountsicherheit.

Empfohlene Reihenfolge:

1. Passkey zusätzlich zu Passwort registrieren.
2. Passkey-Login als bevorzugte Anmeldung anbieten.
3. Mindestens zwei Credentials oder Recovery-Codes für sicheren Verlustfall
   ermöglichen.
4. MFA/Step-up für sensible Aktionen wie Passwort-, E-Mail-, Credential- und
   Löschänderungen einführen.
5. Erst bei echtem Bedarf TOTP als kompatiblen, aber nicht
   phishing-resistenten Fallback ergänzen.

Gate:

- RP-ID, Origin, Challenge, Signatur, Sign Counter, Credential-Revocation und
  Recovery sind vollständig getestet;
- MFA-Reset ist nicht schwächer als der normale Login;
- Accountübernahme über E-Mail allein ist für MFA-geschützte Accounts nicht
  möglich.

### Später – offene Registrierung und öffentliche Profile

Öffentliche Selbstregistrierung, Profilseiten, Presence, Freunde,
Matchmaking, Rankings und Decksharing bleiben eigene Produkt- und
Moderationsgates. Sie dürfen nicht implizit durch das Vorhandensein von
Accounts freigeschaltet werden.

## 6. Passwort- und Session-Sicherheitsvertrag

Für die Passwort-Alpha gelten mindestens:

- adaptives, speicherhartes Password Hashing; bevorzugt Argon2id, alternativ
  scrypt mit versionierten Parametern und Rehash-on-login;
- individueller zufälliger Salt je Credential; optionaler Pepper nur aus
  Secret-Management, nicht aus der Datenbank;
- mindestens 15 Zeichen für ein Passwort als alleinigen Faktor, mindestens 64
  Zeichen Eingabelänge unterstützen, keine erzwungenen Sonderzeichen-
  Mischregeln und kein periodischer Passwortwechsel;
- Prüfung neuer Passwörter gegen eine lokale Blockliste häufiger oder
  kompromittierter Passwörter;
- Passwortmanager, Autofill und Einfügen zulassen;
- HTTPS/WSS im privaten Internetprofil, sichere Cookies, CSRF, Origin-Allowlist,
  Login-Drosselung und neutrale Login-/Resetfehler;
- Passwortänderung und Accountlöschung verlangen frische
  Reauthentifizierung; Passwortänderung widerruft mindestens alle anderen
  Sessions;
- Maintenance-Passwort und Benutzerpasswörter bleiben getrennte Credentials,
  Rollen und Sessionräume.

Der vorhandene Maintenance-scrypt-Code ist nützliche technische Erfahrung,
aber kein unverändert zu übernehmender Benutzer-Auth-Vertrag. Parameter,
Parallelität, Rate Limits, persistente Fehlversuche und Rehash müssen für den
Accountbetrieb separat bemessen und getestet werden.

Aktuelle fachliche Referenzen:

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP E-Mail Validation and Verification Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)

## 7. Abhängigkeiten

| Arbeit | Hängt ab von | Blockiert |
| --- | --- | --- |
| Passwort-Account-Alpha | Slice A, Same-Site-/Cookie-Pfad, Migration | persönliche Server-Decks, E-Mail, MFA |
| Persönliche Server-Decks | Account-API, Privacy-/Delete-Harness | accountgebundener Matchstart, Cloud-Import |
| Deckkuratierung | aktueller Snapshot-/KI-/Testvertrag | klare Matchstart-UI |
| E-Mail-Verifikation | Mail-Provider, Domain/DNS, Queue/Retry | Self-Service-Recovery, offene Registrierung |
| Passkeys/MFA | stabiles HTTPS-Origin-/RP-ID-Modell, Recovery | erhöhte Account-Sicherheit |
| Öffentliche Registrierung | E-Mail/Recovery, Abuse-Schutz, Moderation, Betrieb | öffentliche Communityfunktionen |

## 8. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
| --- | --- |
| Passwortdatenbank erweitert die Angriffsfläche. | Speicherharter Hash, TLS, Rate Limits, Blockliste, Secret-Redaction, Securitytests und später Passkeys. |
| Ohne E-Mail kann ein Nutzer sein Passwort nicht selbst zurücksetzen. | Geschlossene Alpha mit Admin-Einmal-Reset; keine offene Registrierung vor E-Mail-Recovery. |
| SQLite wird versehentlich als öffentliche Skalierungslösung behandelt. | Private-Alpha-Grenze dokumentieren; Postgres-/HA-Gate vor Multi-Instance oder Public Launch. |
| Lokale Deckdateien anderer Nutzer werden auf dem Server sichtbar. | Lokale Bibliothek nicht als Cloudstorage verwenden; nur expliziter Owner-Import über Account-API. |
| KI-/Testdecks überfluten die Benutzeroberfläche. | Verbindliche Sichtbarkeitsklasse und Kuration vor UI-Umschaltung. |
| Accountlöschung beschädigt Replays oder StateHash. | Accountlinks nur in Metadaten; Match-Snapshots und Engine-Historie unverändert lassen. |
| Account-Session wird mit Match-Capability verwechselt. | Getrennte Tokenräume, Cookies, Auth-Middleware und negative Contract-/Leaktests. |
| E-Mail wird zu früh als unbestätigte PII gesammelt. | Feld im Schema vorbereiten, Erhebung erst zusammen mit echter Verifikation aktivieren. |

## 9. Release-Gates und Verifikation

Jeder Umsetzungsslice benötigt mindestens:

- Requirements, API-/Datenschema, Testmatrix, Implementation Review und Final
  Review;
- Schema-Migration vorwärts und Restore-Test aus Backup;
- Unit-/Integrationstests für Account-, Session-, Quote- und Ownergrenzen;
- Browser-E2E für Accountanlage/Invite, Login, Logout, Sessionablauf,
  Passwortänderung und Deckflows;
- CSRF-, Origin-, Cookie-, Rate-Limit-, Enumeration- und Secret-Leaktests;
- Account-A-vs.-Account-B-Autorisierungstests;
- Export-/Löschtest ohne FullState, Gegnerdeck, Token, Token-Hash,
  `privatePayload`, `AIInput` oder `DecisionDebug`;
- bestehende Visibility-, Replay-, StateHash-, stale-action- und
  illegal-action-Gates;
- lokaler Gast-/Privatmodus und bestehende Human-/KI-Matchmodi regressionsfrei;
- dokumentierter Backup-/Restore- und Admin-Recovery-Drill.

## 10. Offene Produktentscheidungen vor Implementierungsfreigabe

Der Plan kann ohne weitere Analyse erstellt werden. Vor Slice B sind nur diese
Freigaben nötig:

1. Geschlossene Alpha per Admin/Invite statt offener Selbstregistrierung.
2. Anmeldename als erster Login-Schlüssel; E-Mail erst mit Verifikation und
   Recovery aktivieren.
3. Lokalen Gast-/Privatmodus parallel erhalten.
4. 50 persönliche Decks als konfigurierbaren, serverseitig erzwungenen
   Default bestätigen.
5. Den heutigen Projektdeckbestand nicht pauschal veröffentlichen, sondern vor
   der UI-Umstellung kuratieren.

## 11. Handoff

Nach Freigabe ist der nächste umsetzungsreife Auftrag kein großer
Gesamtrelease, sondern Slice A als enger Vertrags-/Schema-Freeze. Erst danach
geht Slice B an den `release-implementation-agent`. Der
`test-quality-agent` sollte parallel zur Implementierungsplanung die Auth-,
Owner-, Quote-, Privacy- und Browser-E2E-Matrix prüfen.
