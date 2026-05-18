# V2.0 Cloud-Deck Boundary Contract

Stand: 2026-05-17
Status: Architekturvertrag, keine Implementierungsfreigabe
Zielrelease: V2.0 Closed Accounts Alpha

## Findings

### Hoch: Cloud-Deck-Draft ist kein Match-Snapshot

Betroffene Anker:

- `packages/decks/src/index.ts` definiert `EditableDeck`, `DeckSnapshot`, `DeckPublicMetadata` und `FORBIDDEN_DECK_PAYLOAD_KEYS`.
- `apps/server/src/deck-setup.ts` revalidiert Snapshots serverseitig vor Matchstart.
- `apps/server/src/multiplayer.ts` speichert `privateDeckSnapshots` matchgebunden und nutzt sie für Engine-Decks und eigene KI-Deckdoktrin.

Risiko: Wenn accountgebundene Cloud-Decks direkt als Matchdaten verstanden werden, könnten Accountlöschung, Cloud-Sync oder Deckbearbeitung nachträglich Matchhistorie, Replay oder StateHash berühren.

Empfehlung: Cloud-Decks bleiben bearbeitbare Account-Drafts. Beim Matchstart entsteht daraus ein validierter, unveränderlicher `DeckSnapshot`. Nur der Snapshot geht in Matchstart, Engine-Deckbau und StateHash-relevante Pfade ein. Spätere Cloud-Deck-Änderungen verändern laufende oder historische Matches nicht.

### Hoch: Deckdaten dürfen kein Lobby-, Invite-, Replay- oder KI-Leak werden

Betroffene Anker:

- V2.0 Datenschutzvertrag: `docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md`
- Bestehende Deck-Redaction: `DeckPublicMetadata` ohne `cards`
- Bestehende AI-Doctrine: nur eigener `privateDeckSnapshots?.[side]`-Pfad

Risiko: Decklisten, Deckhashes oder Snapshot-IDs können als Metadatenkorrelation reichen, auch wenn keine vollständige Deckliste sichtbar ist.

Empfehlung: Public-/Opponent-/Invite-/Lobby-Payloads bekommen keine Decklisten, keine Cloud-Deck-IDs, keine privaten Snapshot-IDs und keine stabilen Deckhashes. KI darf nur das eigene validierte Snapshot-Deck sehen. Gegnerdecklisten bleiben für KI, Replay, Public Events und Lobbydaten verborgen.

### Mittel: Lokale Decks dürfen nicht automatisch in Cloud-Decks migrieren

Betroffene Anker:

- Lokale Deckbibliothek aus dem bestehenden privaten Dateipfad.
- Matchstart-Speicher und lokale Webauswahl unterscheiden Snapshot- und lokale Quellen.

Risiko: Eine automatische Migration würde lokale private Dateien, Notizen oder Arbeitsstände in einen Accountkontext schieben, bevor Export/Löschung, Datenschutz und Nutzerzustimmung sauber sind.

Empfehlung: Import lokaler Decks in Cloud-Decks ist eine explizite Nutzeraktion. Kein Hintergrundsync, keine automatische Migration und kein Speichern lokaler Dateipfade im Accountdatensatz.

## Begriffe

| Begriff | Bedeutung | Änderbarkeit | Sichtbarkeit |
| --- | --- | --- | --- |
| Lokales Deck | privater Browser-/Datei-Draft ohne Accountbindung | bearbeitbar lokal | nur lokaler Nutzer |
| Cloud-Deck-Draft | accountgebundener bearbeitbarer Deckentwurf | bearbeitbar durch Owner | Account-Self, später optional private Sharing-Gates |
| Match-Snapshot | validierter, unveränderlicher `DeckSnapshot` zum Matchstart | immutable | serverintern, eigene Seite, Engine/AI nur im erlaubten Kontext |
| Public Deck Metadata | bewusst reduzierte Deckanzeige | aus Snapshot oder Draft abgeleitet | ohne Kartenliste, ohne private IDs, ohne stabile Public-Korrelation |

## Minimaler Cloud-Deck-Datenvertrag

Ein späteres Cloud-Deck-Schema darf höchstens diese fachlichen Felder starten:

| Feld | Zweck | Datenschutzgrenze |
| --- | --- | --- |
| `cloudDeckId` | stabile interne ID | nicht in Lobby, Invite, Public Replay oder Gegnerpayloads |
| `ownerAccountId` | Accountbindung | nur Account-/Admin-Kontext, nicht Engine/Replay/AI |
| `deckVersion` | optimistic locking und Export | keine Matchregelautorität |
| `name` | Nutzeranzeige | personenbezogen behandelbar, in Public-Kontext redigierbar |
| `side`, `identityCardId` | Deckvalidierung | öffentliche Anzeige nur nach UI-/Lobby-Gate |
| `formatProfileId`, `formatProfileVersion` | Revalidierung | sichtbar nur als abstrakte Formatinfo |
| `cardPoolSnapshotId`, `cardPoolVersion` | Revalidierung | kein Kartenfreigabe-Gate umgehen |
| `cards` | eigener Deckinhalt | nur Owner, Matchstart-Server und eigener Export |
| `validationStatus` | `valid`, `invalid`, `needs_revalidation` | keine Public-Deckliste ableiten |
| `createdAt`, `updatedAt`, `deletedAt` | Accountdaten/Retention | export-/löschpflichtig |
| `sourceLocalDeckId` | optionale Importreferenz | keine lokalen Pfade, keine automatische Sync-Ableitung |

Nicht speichern ohne eigenes Gate: lokale Dateipfade, Browser-Storage-Schlüssel, gegnerische Deckdaten, Match-Hidden-Daten, `GameState`, `privatePayload`, `cardInstances`, `AIInput`, `DecisionDebug`.

## Matchstart-Grenze

Der spätere Flow bleibt serverautoritativ:

1. Nutzer wählt lokales Deck oder Cloud-Deck bewusst aus.
2. Server lädt oder erhält die Deckdaten nur im Account-/Owner-Kontext.
3. Server validiert gegen aktuelles Formatprofil, Cardpool-Version, Mechanik-/Kartenstatus und AI-Gate, falls KI beteiligt ist.
4. Server erzeugt einen immutable `DeckSnapshot`.
5. Match speichert nur den Match-Snapshot und redigierte Match-Metadaten.
6. Engine erhält nur das aus dem Snapshot gebaute `EngineDeckDefinition`.
7. KI erhält nur den eigenen Snapshot für Deckdoktrin, nie das gegnerische Deck.

Ein Cloud-Deck-Update nach Matchstart erzeugt keinen neuen Match-Snapshot und verändert keine laufende Partie.

## Sichtbarkeitsmatrix

| Kontext | Erlaubt | Verboten |
| --- | --- | --- |
| Account-Self | eigene Cloud-Decks, Kartenliste, Validierungsfehler, Export | fremde Decks, Match-Hidden-Daten |
| Matchstart-Server | vollständiges gewähltes Deck zur Revalidierung und Snapshot-Erzeugung | ungeprüfte automatische Promotion |
| Eigene Matchseite | eigener Snapshot soweit UI-Funktion freigegeben ist | Gegnerdeckliste |
| Gegnerpayload | höchstens bewusst freigegebene abstrakte Metadaten | Cloud-Deck-ID, Deckliste, Deckhash, private Snapshot-ID |
| Lobby/Invite/Public List | Format/Modus/Cardpool-Version nur nach Lobby-Gate | Deckliste, Deckhash, Cloud-Deck-ID, Snapshot-ID |
| Replay Export | side-sichere Perspektive, kein Cloud-Draft | `local_analysis`, FullState, private Decksnapshots des Gegners |
| AIInput | eigener validierter Snapshot für eigene Deckdoktrin | Account-ID, Cloud-Deck-ID, gegnerischer Snapshot, Nutzerprofile |
| Logs/Metrics | aggregierte Validierungsfehler und Statuscodes | Kartenlisten, Hashes, lokale Pfade, Account-Session-Daten |

## Export, Löschung und Retention

Cloud-Decks sind Accountdaten:

- Account-Self-Export enthält eigene Cloud-Deck-Drafts und Validierungsstatus.
- Account-Löschung löscht eigene Cloud-Deck-Drafts.
- Match-Snapshots bleiben von Cloud-Drafts getrennt und werden nach Privacy-Vertrag entkoppelt oder anonymisiert, ohne StateHash zu verändern.
- Backups folgen der dokumentierten Retention und versprechen keine Sofortlöschung.
- Importierte lokale Decks bleiben lokale Quelle; der Cloud-Draft ist eine separate Kopie.

## Kleine Umsetzungsschnitte

1. `cloud-deck-schema-storage`: Account-gebundene Cloud-Deck-Records und Storage-Service ohne REST-API, mit Export-/Delete-Testharness.
2. `cloud-deck-import-api`: expliziter Import lokaler Decks in Cloud-Drafts, nur mit Account-Session, CSRF, Origin-Check und Server-Revalidierung.
3. `cloud-deck-matchstart-handoff`: Matchstart-Auswahl eines Cloud-Drafts erzeugt immutable Snapshots und erweitert keine Gegner-, Lobby-, Replay- oder KI-Payloads.

Konkrete Blocker vor Implementierung:

- Account-API mit Cookie-/CSRF-/Origin-Gate fehlt noch.
- Export-/Löschimplementierung für Accountdaten fehlt noch.
- Cloud-Deck-Schema braucht Redaction- und Browser-Storage-Tests.
- Public Lobby und Sharing bleiben außerhalb von V2.0.

## Ergebnis

Cloud-Decks sind optionale Account-Drafts. Lokale Decks bleiben lokal, Match-Snapshots bleiben immutable und side-sicher, und Engine/KI/Replay sehen weiterhin nur die jeweils erlaubten Snapshot- oder Public-Projektionen.
