# MVP 0.6 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.6 deck editor and match setup requirements`

## 1. Kurzentscheidung

MVP 0.6 baut den funktionalen Deckeditor und die Match-Setup-Grundlage.

Die Phase nutzt die V0.5-Katalog- und Statusdaten, um Decks als eigene, validierbare Produktobjekte einzuführen. Die große UI- und Design-Neugestaltung bleibt V0.7. V0.6 darf nur die funktionalen Oberflächen bauen, die für Deckpflege, Validierung und Matchstart nötig sind.

Kernformel:

> Decks werden editierbar, aber Matches starten nur mit validierten, reproduzierbaren Deck-Snapshots.

## 2. Ziel

V0.6 soll die Brücke zwischen Kartenkatalog und Spielbetrieb schaffen.

Danach soll das Projekt:

- lokale Decks erstellen, speichern, laden, duplizieren, importieren und exportieren können,
- Decks gegen Kartenstatus und lokale Formatprofile validieren können,
- beim Matchstart Runner- und Corp-Decks auswählen können,
- Matchdaten mit unveränderlichen Deck-Snapshots starten,
- nicht spielbare Karten im Editor anzeigen, aber für spielbare Matches sperren,
- KI- und Multiplayer-Modi mit gewählten Decks nutzen können, soweit diese Decks validiert sind.

## 3. Ausgangslage

Vorhanden:

- `DeckDefinition` kennt feste Demo-Decks.
- `DemoDeckId` ist typseitig eng auf vier Decks begrenzt.
- `createGame` akzeptiert bisher nur feste Demo-Deck-IDs.
- V0.4-Deckvalidierung prüft kuratierte Demo-Decks, aber keinen freien Editor.
- Match-Erstellung kennt Modus, Hostseite, Seed und `agendaPointsToWin`, aber noch keine allgemeinen Deckreferenzen.
- KI-Simulation akzeptiert Demo-Deck-IDs.

Engpass:

Decks müssen vom Demo-ID-Modell zu versionierten Deck-Snapshots erweitert werden, ohne Replay, StateHash, Visibility oder Hidden-Info-Barrieren zu schwächen.

## 4. Nicht-Ziele

V0.6 baut nicht:

- finale UI-Neugestaltung,
- vollständige offizielle Turnierlegalität,
- Rotation, Banlisten oder Einfluss als voller Produktumfang,
- automatischen Import fremder Online-Decklisten ohne lokale Validierung,
- Spielbarkeit nicht implementierter Karten,
- neue Regelmechaniken als Hauptziel,
- öffentliche Decklistenplattform,
- Accounts oder Cloud-Sync.

## 5. Grundmodell

V0.6 trennt fünf Dinge:

| Objekt | Bedeutung |
|---|---|
| Katalogkarte | Importierte oder interne Karte aus V0.5. |
| Implementierte Karte | Engine-Karte mit Resolver und Manifest. |
| Deckentwurf | Bearbeitbares lokales Deck. |
| Deck-Snapshot | Unveränderliche Version eines Decks für Matchstart, Replay und StateHash. |
| Match-Deck | Der im Match eingebettete Snapshot, nicht ein Live-Verweis auf den Entwurf. |

Regel:

Wenn ein Deck nach Matchstart geändert wird, ändert sich das laufende Match nicht.

## 6. Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V06-MUST-001 | Deck-Spezifikation | `docs/releases/mvp/mvp-0-6-deck-match-setup/deck-editor-spec.md` beschreibt Datenmodell, Snapshots, Import/Export und Validierung. |
| V06-MUST-002 | Allgemeines Deckmodell | Decks sind nicht mehr ausschließlich `DemoDeckId`, sondern versionierte Deckobjekte mit Side, Identity, Kartenliste und Kartenpool-Version. |
| V06-MUST-003 | Deck-Snapshot-Hash | Jeder validierte Deck-Snapshot hat deterministischen Hash und Version. |
| V06-MUST-004 | Deckvalidierung v2 | Validierung prüft Side, Identity, Kartenstatus, Mengen, Agenda Points, Mindestanforderungen und Formatprofil. |
| V06-MUST-005 | Nicht-spielbare Karten gesperrt | `imported` oder `catalog_ready` Karten ohne `playable`/`deck_legal` blockieren spielbare Matches. |
| V06-MUST-006 | Funktionaler Deckeditor | Decks können lokal erstellt, bearbeitet, gespeichert, geladen, dupliziert und gelöscht werden. |
| V06-MUST-007 | Import/Export | Decks können in einem lokalen JSON-Format importiert und exportiert werden. |
| V06-MUST-008 | Matchstart mit Deckauswahl | Human-vs-Human, Human-vs-KI und KI-vs-KI können mit validierten Deck-Snapshots gestartet werden. |
| V06-MUST-009 | Replay/StateHash-Schutz | Matchstart dokumentiert Deck-Snapshot-Hashes; Replay bleibt reproduzierbar. |
| V06-MUST-010 | Visibility-Schutz | Gegnerische Hidden-Info und private Decklisten werden nicht über Bootstrap, WebSocket, Reconnect, Errors oder Logs geleakt. |
| V06-MUST-011 | Legacy-Kompatibilität | Demo-Decks bleiben startbar und bestehende MVP-0.1 bis MVP-0.5-Tests bleiben grün. |

## 7. Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V06-SHOULD-001 | Decklisten-Ansicht | Lokale Decks haben Liste, Suche, Side-Filter und Validierungsstatus. |
| V06-SHOULD-002 | Validierungsdetails | Fehler nennen Karte, Regel und Behebung, ohne versteckte Matchdaten zu leaken. |
| V06-SHOULD-003 | Deck-Kopieren | Bestehende Demo-Decks können als editierbare Kopie angelegt werden. |
| V06-SHOULD-004 | KI-Smoke mit Decks | KI-vs-KI läuft mit ausgewählten validierten Decks über mehrere Seeds. |
| V06-SHOULD-005 | Deck-Migration | Bestehende Demo-Decks werden als Snapshots abbildbar, ohne ihre IDs zu verlieren. |

## 8. Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V06-COULD-001 | Textdeck-Import | Nur wenn Format klein und eindeutig bleibt. |
| V06-COULD-002 | Deck-Tags/Notizen | Nur lokal, keine Plattformfunktion. |
| V06-COULD-003 | Validierungscache | Falls Deckvalidierung oder Katalog größer wird. |

## 9. Vorgeschlagene Artefakte

Derived Docs:

- `docs/releases/mvp/mvp-0-6-deck-match-setup/requirements.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/deck-editor-spec.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/deck-validation-spec.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/match-setup-spec.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/deck-storage-spec.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/test-matrix.md`
- `docs/releases/mvp/mvp-0-6-deck-match-setup/requirements-review.md`

Daten:

- `data/decks/deck-format-profiles-0.6.json`
- `data/decks/deck-templates-0.6.json`
- `data/decks/deck-snapshots-0.6.json`
- `data/manifests/deck-validation-manifest-0.6.json`

Lokale Laufzeitdaten:

- lokale bearbeitete Decks gehören nicht pauschal in versionierte Projektartefakte,
- ein lokaler Deckspeicher muss in `.gitignore` oder Betriebsdoku klar getrennt werden,
- kuratierte Test- und Template-Decks bleiben versioniert.

Tests:

- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`

Mögliches Paket:

- `packages/decks`: reine TypeScript-Logik für Deckmodell, Validierung, Snapshotting, Import/Export.

Regel:

`packages/decks` darf Kartenstatus und Katalogdaten lesen, aber keine UI-, Netzwerk- oder Datenbanklogik enthalten.

## 10. Bausteine

### 10.1 Deckmodell v2

Ein Deck sollte mindestens enthalten:

- `deckId`,
- `deckVersion`,
- `deckHash`,
- `name`,
- `side`,
- `identityCardId`,
- `cards`,
- `cardPoolSnapshotId`,
- `formatProfileId`,
- `createdAt`,
- `updatedAt`,
- optional lokale Notizen.

Ein Karteneintrag enthält:

- `cardId`,
- `quantity`,
- optional `sourceCatalogId`,
- optional `implementationId`.

### 10.2 Deck-Snapshot

Ein Snapshot ist unveränderlich und enthält:

- normalisierte Kartenliste,
- Identity,
- Side,
- Kartenpool-Snapshot,
- Formatprofil,
- Validierungsergebnis,
- deterministischen Hash.

Snapshots werden beim Matchstart eingebettet oder eindeutig referenziert, sodass Replay und StateHash auch dann stabil bleiben, wenn der editierbare Deckentwurf später geändert wird.

### 10.3 Formatprofile

V0.6 braucht kein vollständiges offizielles Format. Es braucht ein lokales Profil, zum Beispiel:

- erlaubter Kartenpool,
- erlaubte Statuswerte,
- Mindest-Agenda-Points für Corp,
- Mindest- oder Zieldeckgröße für lokale Tests,
- Mengenlimit pro Karte,
- erlaubte Identitäten.

Offizielle Einfluss-, Rotation- und Banlistenregeln bleiben spätere Scope-Entscheidung.

### 10.4 Match-Setup

Match-Erstellung sollte zusätzlich aufnehmen:

- Runner-Deck-Snapshot oder Deckref,
- Corp-Deck-Snapshot oder Deckref,
- Seed,
- Modus,
- Controller,
- `agendaPointsToWin`,
- RulesBaseline,
- Kartenpool-Version.

Der Server validiert Decks erneut beim Matchstart. Der Client darf Validierung nur anzeigen, nicht autoritativ entscheiden.

### 10.5 Funktionale UI

V0.6 baut nur notwendige Funktionen:

- Deckliste,
- Deck bearbeiten,
- Karte hinzufügen/entfernen,
- Validierungsfehler anzeigen,
- Deck speichern/laden,
- Deck für Match auswählen,
- Start blockieren, wenn Deck nicht spielbar ist.

Visuelle Neugestaltung, Layoutsystem, Board-Redesign und Designpolitur bleiben V0.7.

## 11. Teststrategie

### 11.1 Deckmodell- und Snapshot-Tests

Pflicht:

- Gleicher Deckinhalt erzeugt denselben Deckhash.
- Kartenreihenfolge im Input beeinflusst den normalisierten Hash nicht.
- Änderung an Menge, Identity, Formatprofil oder Kartenpool ändert den Hash.
- Snapshot bleibt unverändert, wenn editierbares Deck danach geändert wird.
- Demo-Decks lassen sich als Snapshots abbilden.

### 11.2 Validierungstests

Pflicht:

- falsche Side wird abgelehnt,
- fehlende Identity wird abgelehnt,
- Identity falscher Side wird abgelehnt,
- unbekannte Karte wird abgelehnt,
- import-only Karte wird für spielbares Match abgelehnt,
- nicht `deck_legal` Karte wird abgelehnt,
- ungültige Menge wird abgelehnt,
- Corp-Deck ohne genug Agenda Points wird abgelehnt,
- Mengenlimit wird geprüft,
- Fehlerliste ist vollständig genug für UI-Feedback.

### 11.3 Import-/Export-Tests

Pflicht:

- JSON-Export lässt sich wieder importieren.
- Export/Import erhält Deckhash bei unverändertem Inhalt.
- ungültiges JSON wird side-sicher und ohne Stacktrace abgelehnt.
- unbekannte Felder werden entweder ignoriert oder als Warnung gemeldet, aber nicht still regelrelevant.
- lokale Dateinamen/Decknamen können keine Pfadmanipulation auslösen.

### 11.4 Match-Setup-Tests

Pflicht:

- Human-vs-Human startet mit zwei validierten Snapshots.
- Human-vs-KI startet mit gewählten validierten Decks.
- KI-vs-KI-Simulation startet mit gewählten validierten Decks.
- Match-Record enthält Deckhashes, Kartenpool-Version und RulesBaseline.
- laufendes Match bleibt stabil, wenn Ursprungsdeck später geändert wird.
- ungültige Decks blockieren Matchstart mit safe error.

### 11.5 Visibility- und Hidden-Info-Tests

Pflicht:

- Bootstrap leakt keine vollständige gegnerische Deckliste, sofern sie nicht explizit öffentlich gesetzt ist.
- WebSocket-Payloads enthalten keine gegnerischen versteckten Karten aus HQ/R&D/Stack/Grip.
- Reconnect-Payloads enthalten nur side-gefilterte PlayerView plus erlaubte Deck-Metadaten.
- Error-Payloads nennen keine privaten Kartenlisten.
- Logs enthalten keine Sessiontokens und keine FullState-Ausgabe.

### 11.6 Replay-, StateHash- und KI-Tests

Pflicht:

- Replay rekonstruiert Match mit Deck-Snapshot.
- StateHash ist stabil für gleichen Seed und gleiche Deck-Snapshots.
- KI wählt mit V0.6-Decks nur legale Aktionen.
- AI-Visibility-Test bleibt grün.
- Simulation Summary nennt Deckhashes oder Deckversionen.

### 11.7 UI-Smokes

Empfohlen:

- Deckliste öffnet.
- Deckkopie aus Demo-Deck erstellen.
- Karte hinzufügen/entfernen.
- Validierungsfehler sehen.
- Validiertes Deck für Match auswählen.
- Ungültiges Deck blockiert Start.

Diese Smokes prüfen Funktion, nicht finale Gestaltung.

### 11.8 Regression

Pflicht:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`
- bestehende MVP-0.1 bis MVP-0.5 Gates bleiben grün.

## 12. Kritische Härtungen

### 12.1 Snapshot-Integrität

- Matchstart erzeugt oder fixiert Deck-Snapshot.
- Match speichert Snapshot-Hash.
- Replay nutzt Snapshot, nicht aktuellen Deckentwurf.
- Änderungen am Entwurf nach Matchstart haben keinen Effekt auf das Match.

### 12.2 Serverseitige Autorität

- Clientvalidierung ist nur Komfort.
- Server validiert Decks erneut beim Speichern und beim Matchstart.
- Engine akzeptiert nur vorbereitete, validierte Deckdefinitionen.
- Manipulierte Deckrefs oder Deckhashes werden abgelehnt.

### 12.3 Hidden-Info-Schutz

- Decklisten sind in V0.6 standardmäßig privat.
- Gegner sieht nur erlaubte Metadaten: Deckname, Side, Identity, Kartenpool-Version, eventuell Validierungsstatus.
- Vollständige Kartenlisten werden nicht in öffentliche Events, WebSocket-Broadcasts oder Reconnect-Payloads gelegt.

### 12.4 Storage-Härtung

- Bearbeitbare lokale Decks werden klar von versionierten Testartefakten getrennt.
- Dateipfade werden nicht aus Decknamen gebaut.
- JSON-Speicher bekommt Größenlimits und Fehlerbehandlung.
- Spätere SQLite-Härtung bleibt möglich, ohne Deckmodell neu zu schneiden.

### 12.5 Performance

- Deckvalidierung nutzt Katalog- und Statusindizes aus V0.5.
- Häufige Validierung im Editor wird gecached.
- Matchstart validiert final synchron und eindeutig.
- Große Kataloglisten werden nicht in jeden Matchpayload eingebettet.

## 13. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Deckeditor öffnet zu früh freie Kartenflut | Scope Creep | `deck_legal` Gate und lokale Formatprofile. |
| Match hängt an editierbarem Deck | Replay bricht | unveränderliche Snapshots beim Start. |
| Gegnerische Deckliste leakt | Hidden-Info-Bruch | side-gefilterte Deck-Metadaten und Payload-Tests. |
| DemoDeckId-Verengung blockiert | technische Schulden | allgemeines Deckmodell parallel zu Legacy-IDs einführen. |
| UI-Redesign schleicht in V0.6 | Analysen werden unterlaufen | nur funktionale UI, Gestaltung V0.7. |

## 14. Done-Kriterien

V0.6 ist fertig, wenn:

- Requirements und Spezifikationen eingefroren sind,
- Deckmodell v2 und Snapshot-Hash existieren,
- Deckvalidierung v2 implementiert und getestet ist,
- funktionaler Deckeditor vorhanden ist,
- Deckimport/-export funktioniert,
- Matchstart mit validierten Deck-Snapshots funktioniert,
- Replay/StateHash mit Deck-Snapshots stabil ist,
- Visibility- und Hidden-Info-Tests bestehen,
- KI-Smokes mit validierten Decks bestehen,
- MVP-0.1 bis MVP-0.5-Gates weiter grün sind,
- `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` und `corepack pnpm build` bestehen.
