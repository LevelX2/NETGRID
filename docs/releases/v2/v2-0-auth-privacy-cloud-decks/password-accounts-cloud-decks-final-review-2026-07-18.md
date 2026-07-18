# V2.0 Passwort-Accounts und persönliche Server-Decks – Final Review

Stand: 2026-07-18

Ergebnis: geschlossene Alpha umgesetzt und für den privaten Betrieb
freigegeben

## Ergebnis

NETGRID besitzt jetzt eine geschlossene Passwort-Account-Stufe. Accounts
entstehen ausschließlich durch lokalen Admin-Bootstrap oder einmalige
Admin-Einladung. Account-Sessions sind serverseitig widerrufbar und werden im
Browser nur als `HttpOnly`-Cookie transportiert. E-Mail, Passkeys und MFA
bleiben ausdrücklich spätere Stufen.

Ein angemeldeter Account kann bis zu 50 persönliche Decks im Serverstorage
halten. 40 kuratierte Standard-Decks sind unveränderlich direkt spielbar oder
als unabhängige persönliche Kopie speicherbar. Interne KI-, Test- und
ausgemusterte Decks erscheinen nicht in der normalen UI.

## Architektur- und Sicherheitsreview

- Account-, Credential-, Session-, Invite-, Reset- und Deckdaten liegen in
  der versionierten SQLite-Migrationskette. Passwörter verwenden versioniertes
  `scrypt`; Session-, CSRF-, Invite- und Reset-Rohwerte werden nur gehasht
  persistiert.
- Account-Sessions, Maintenance-Sessions und Match-Join-/Session-/Reconnect-
  Capabilities sind getrennte Autorisierungsräume.
- Mutierende Account- und Deckrouten verlangen erlaubte Origin, Account-
  Session und sessiongebundenes CSRF. Das Private-Internet-Profil setzt das
  Accountcookie nur mit `Secure`, `HttpOnly` und `SameSite=Lax`.
- Persönliche Decks werden serverseitig ownergebunden gelesen und geändert.
  Die 50er-Grenze wird bei Anlage und Standardkopie in einer SQLite-
  `BEGIN IMMEDIATE`-Transaktion gezählt und geschrieben.
- Ungültige Drafts dürfen gespeichert werden. Der Matchstart akzeptiert nur
  einen neu validierten immutable Snapshot; Draftänderung und Accountlöschung
  verändern keinen bereits erzeugten Matchsnapshot.
- Account-IDs und persönliche Deck-IDs wurden nicht in `GameState`,
  `PlayerView`, `LegalAction`, `PublicGameEvent`, Replay-StateHash, `AIInput`
  oder `DecisionDebug` aufgenommen.

## Produkt- und UI-Review

- Die Accountseite unterstützt Login, Invite-Annahme, Sessionwiederherstellung,
  Logout, alle Geräte abmelden, Passwortwechsel sowie Admin-Invite und
  Admin-Reset.
- Der Deckeditor trennt `Standard-Decks` und `Meine Decks`. Standardkopie,
  Anlage, Bearbeitung, Umbenennung, Duplikat, Import, Export, Löschung,
  Quotenanzeige und Matchauswahl sind angebunden.
- Der Gastmodus bleibt erhalten. Die beim Kuration-Freeze klassifizierten
  lokalen Quelldecks werden in der normalen Bibliothek verborgen, beim
  Schreiben der lokalen Datei aber nicht unbeabsichtigt gelöscht.
- Ein realer Playwright-Lauf auf der vom Startskript ausgegebenen LAN-Origin
  bestätigte Login, Account-Self, Standardkopie, Quote `1/50`, Umbenennen,
  Speichern und direkte Standard-Auswahl am Matchstart.

## Kuration

Der Freeze klassifiziert 53 vorhandene lokale Decks: 40 `standard`, 2
`internal_ai`, 10 `test_fixture` und 1 `retire`. Die normalen Standard-API-
Antworten enthalten ausschließlich die 40 aktiven Standards und ihre
deterministischen Snapshotdeskriptoren. Vorhandene KI-/Testverbraucher bleiben
unverändert.

## Verifikation

Grüne Nachweise:

- `corepack pnpm typecheck`;
- `corepack pnpm test:contracts` inklusive Test-Discovery;
- vollständige Server-Suite: 16 Dateien, 173 Tests;
- vollständige Web-Suite: 51 Dateien, 635 Tests;
- Account-/Storage-/Deck-Fokus: 6 Dateien, 15 Tests;
- drei AI-Shards: 378 Dateien, 2.624 Tests;
- `corepack pnpm check:package-boundaries`;
- `corepack pnpm check:card-asset-retention`;
- `corepack pnpm check:proteus-ai-readiness`: 154/154;
- `corepack pnpm build`;
- realer Browser-Smoke und `git diff --check`.

Der vollständige Servertest deckte auf, dass die CORS-Methoden zu breit global
erweitert waren. Der Server bewirbt `PUT` und `DELETE` jetzt nur für
`/api/account/decks`; die Match-API behält den engeren Methodensatz
`GET,POST,OPTIONS`. Beide Routenverträge sind separat getestet.

## Geerbte projektweite Abweichungen

Zwei AI-Ratchets sind bereits auf dem unveränderten lokalen `main` rot:

- `check:ai-source-structure` meldet die Corp-Score-Dateien mit 997/925 und
  828/808 Zeilen;
- `check:ai-derived-facts-full` meldet einen veralteten generierten
  Coverage-Report.

Der Arbeitsbranch hat an den betroffenen Dateien und am Report keinen Diff
gegen `main`. Die Abweichungen werden deshalb nicht durch eine fachfremde
Limitanhebung oder Report-Neugenerierung im Accountrelease kaschiert. Alle
ausführbaren KI-Testshards und das Proteus-Gate sind grün; es gibt keinen
Hinweis auf eine Account-/Deck-bedingte KI- oder Engine-Regression.

## Gate-Entscheidung

Die Muss-Anforderungen und die Sicherheitsgrenzen der geschlossenen Alpha
sind erfüllt. Der Stand ist für privaten Betrieb und weitere Playtests
freigegeben. Er ist keine Freigabe für öffentliche Selbstregistrierung oder
einen offenen Internetdienst. E-Mail-Verifikation/Recovery, Passkeys, MFA,
Missbrauchsschutz und Public-Operations bleiben eigene Folgegates.

## Nachkorrektur: Standard-Decks im Matchstart

Ein Playtest am 2026-07-18 zeigte zwei gekoppelte Matchstartfehler: Ein nicht
mehr vorhandenes persönliches Deck konnte intern weiter als Auswahlquelle
gespeichert sein, obwohl das Auswahlfeld bereits ein Standard-Deck anzeigte.
Außerdem waren die kuratierten Standard-Snapshots zwar über die Deck-API
sichtbar, aber noch nicht im autoritativen Server-Resolver registriert.

Der Client normalisiert ungültige gespeicherte Deckslots nun auf die tatsächlich
sichtbare Standardauswahl. „Direkt spielen“ und die Deck-Editor-Auswahl setzen
den gewählten Seitenslot für beide Teilnehmerprofile, damit der Slot unabhängig
von Seitenwahl und KI-Zuordnung verfügbar ist. Der Server löst alle aktiven
kurierten Standard-Snapshot-IDs als unveränderliche Matchstart-Snapshots auf.

Verifiziert wurde der reale Browserstart als Runner mit
„Rent-I-Con: Das Shellspiel“ gegen „Cheap Bag of Tricks“ im kombinierten
Classic-/Protheus-Pool bis zum erstellten Match (`HTTP 201`). Ergänzend sind
Server-Resolver-, Client-Fallback- und Typprüfungen grün.

## Erweiterung: Zufällige Standard-Decks je Matchslot

Jeder Runner- und Korp-Deckslot am Matchstart bietet nun zusätzlich
„Zufälliges Standard-Deck“ an. Das gilt sowohl für die eigenen Slots als auch
für die explizit gewählten KI-Slots in den erweiterten Optionen. Die Auswahl
wird lokal gespeichert, bleibt bis zum Start als Zufallswunsch sichtbar und
wird erst beim Erstellen des Matches auf einen konkreten kuratierten
Standard-Snapshot aufgelöst.

Die Auflösung ist über Matchseed und Slotkennung deterministisch. Die
Kandidaten werden zuvor nach Seite, Deckvalidierung und aktivem Kartenpool
gefiltert und unabhängig von der API-Reihenfolge stabil sortiert. Der Server
erhält weiterhin ausschließlich konkrete unveränderliche Snapshot-IDs; Replay,
StateHash und autoritative Deckvalidierung bleiben dadurch unverändert. Nach
dem erfolgreichen Start zeigt die Statusmeldung die tatsächlich verwendeten
Decknamen aus den öffentlichen Servermetadaten.

Ein realer Browserlauf setzte die beiden eigenen sowie beide KI-Slots auf
„Zufälliges Standard-Deck“. Der Start endete mit `HTTP 201`, übertrug vier
konkrete Standard-Snapshot-IDs und zeigte anschließend „Bit-Denial Lock“ gegen
„Rent to Own War Engine“ als tatsächlich aktive Decks. Der Testmatch wurde
danach regulär aufgegeben. Persistenz-, Resolver- und Typprüfungen sind grün.
