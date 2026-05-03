# MVP 0.5 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.5 card import and catalog requirements`

## 1. Kurzentscheidung

MVP 0.5 baut die Kartenimport- und Kartenkatalog-Schicht.

Die Phase erweitert nicht die spielbare Regelbreite. Sie schafft stattdessen die Datenbasis, um spätere Kartenpools kontrolliert aufzunehmen: importierte Karten, lokale Snapshots, Katalogsuche, Statusmodell und Manifest-Abgleich.

Kernformel:

> Importiert ist nicht spielbar. Spielbar wird eine Karte erst durch Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke.

## 2. Ziel

V0.5 soll aus dem bisherigen internen Demo-Kartenbestand eine belastbare Katalog- und Importgrundlage machen.

Danach soll das Projekt:

- Kartendaten aus einer freigegebenen Quelle in einen lokalen Snapshot übernehmen können,
- den Snapshot deterministisch normalisieren und validieren,
- Karten im Katalog anzeigen und filtern können,
- importierte Karten mit dem Implementierungsmanifest abgleichen können,
- klar zwischen Datenverfügbarkeit, Implementierung und Spielbarkeit unterscheiden,
- Basis-/Starterset-Karten als Datenbestand vorbereiten, ohne sie automatisch decklegal oder spielbar zu machen.

## 3. Ausgangslage

Vorhanden aus MVP 0.4:

- `CardDefinition` ist aktuell zugleich Engine-Karte und Demo-Kartendefinition.
- `implementationStatus` kennt praktisch nur `playable_mvp`.
- `DemoDeckId` und `CreateGameConfig` sind auf `demo_runner_001`, `demo_corp_001`, `demo_runner_004` und `demo_corp_004` beschränkt.
- V0.4-Datenartefakte liegen in `data/cards/demo-cards-0.4.json`, `data/decks/demo-decks-0.4.json` und `data/manifests/card-implementation-manifest-0.4.json`.
- Der Browser erhält aktuell nur spielrelevante side-gefilterte Matchdaten; ein separater Kartenkatalog existiert noch nicht.

Engpass:

Der aktuelle Kartenbegriff ist zu eng für Import. Importierte Karten müssen als Katalogdaten existieren können, ohne Engine-Resolver zu besitzen.

## 4. Nicht-Ziele

V0.5 baut nicht:

- automatische Regelumsetzung aus Kartentext,
- neuen spielbaren Kartenpool,
- Damage, Trace, Viren, Hosting, Prevention, Replacement oder weitere neue Regelmechaniken,
- freien Deckbuilder als Produktfeature,
- finale UI-Neugestaltung,
- offizielle Artworks, Logos, Card Frames oder Card Backs,
- externe Kartendatenbank als Laufzeitabhängigkeit,
- öffentliche Plattformfunktionen.

## 5. Grundmodell

V0.5 trennt vier Ebenen:

| Ebene | Bedeutung | Spielbarkeit |
|---|---|---|
| Importquelle | Ursprung der Kartendaten und Nutzungsnotizen. | Nie direkt spielbar. |
| Lokaler Snapshot | Versionierter, geprüfter Datenabzug. | Nie direkt spielbar. |
| Katalogeintrag | Normalisierte Karte für Suche, Anzeige und Status. | Nur Anzeige. |
| Engine-Karte | Implementierte Karte mit Resolver und Manifest. | Nur bei `playable` und Deckfreigabe. |

Empfohlene Statuswerte:

| Status | Bedeutung |
|---|---|
| `imported` | Karte wurde aus Quelle übernommen. |
| `validated` | Karte erfüllt lokales Katalogschema. |
| `catalog_ready` | Karte darf im Katalog erscheinen. |
| `implemented` | Engine kennt Karte und Resolver. |
| `playable` | Tests, Visibility, Replay/StateHash und KI-Smoke bestanden. |
| `deck_legal` | Karte ist für ein konkretes Deckformat freigegeben. |
| `blocked` | Karte ist bewusst gesperrt, mit Grund. |

## 6. Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V05-MUST-001 | Import-Spezifikation | `docs/derived/CARD_IMPORT_0.5_SPEC.md` beschreibt Quelle, Snapshot, Normalisierung, Nutzungsgrenzen und Update-Regeln. |
| V05-MUST-002 | Lokales Snapshot-Schema | Ein versioniertes JSON-Schema für importierte Kartendaten existiert und wird getestet. |
| V05-MUST-003 | Deterministische Normalisierung | Derselbe Input erzeugt denselben Snapshot-Hash, dieselbe Sortierung und dieselben Katalog-IDs. |
| V05-MUST-004 | Statusmodell | Import-, Validierungs-, Implementierungs-, Spielbarkeits- und Decklegalitätsstatus sind getrennt. |
| V05-MUST-005 | Manifest-Abgleich | Katalog kann für jede Karte anzeigen, ob sie importiert, implementiert, spielbar oder gesperrt ist. |
| V05-MUST-006 | Katalog-API | Eine read-only API liefert nur Katalogdaten, keine Match-, Token-, FullState- oder Hidden-Info-Daten. |
| V05-MUST-007 | Minimaler Katalog-Client | Eine funktionale Katalogansicht zeigt Karten, Filter und Status ohne finale Designgestaltung. |
| V05-MUST-008 | Kein Auto-Playable | Keine importierte Karte darf allein durch Import in `createGame`, Deckvalidierung oder KI spielbar werden. |
| V05-MUST-009 | Legacy-Kompatibilität | MVP-0.1 bis MVP-0.4-Demo-Decks, Tests und Baselines bleiben unverändert grün. |
| V05-MUST-010 | Quellen- und Asset-Grenzen | Keine offiziellen Assets werden eingebunden; Text-/Datenquelle wird dokumentiert und lokal versioniert. |

## 7. Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V05-SHOULD-001 | Basis-/Starterset-Datenbestand | Ein erster Basis-/Starterset-Snapshot liegt als Datenbestand vor, falls die Quelle freigegeben ist. |
| V05-SHOULD-002 | Import-Report | Importlauf schreibt Anzahl, Warnungen, Fehler, blockierte Karten und Snapshot-Hash. |
| V05-SHOULD-003 | Katalogfilter | Filter nach Side, Type, Faction, Set, Implementierungsstatus, Spielbarkeit und Textsuche. |
| V05-SHOULD-004 | Katalog-Indizes | ID-, Such- und Filterindizes werden deterministisch erzeugt. |
| V05-SHOULD-005 | Differenzbericht | Ein Update kann zeigen, welche Karten neu, geändert oder entfernt wurden. |

## 8. Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V05-COULD-001 | Rohdaten-Archiv | Nur wenn Nutzungsbedingungen und Repo-Größe passen. |
| V05-COULD-002 | Manuelle Overrides | Nur als versionierte kleine Datei, nicht als stiller Import-Hack. |
| V05-COULD-003 | Katalog-Export | Nur JSON/CSV für lokale Analyse, keine öffentliche Distribution. |

## 9. Vorgeschlagene Artefakte

Derived Docs:

- `docs/derived/MVP_0.5_REQUIREMENTS.md`
- `docs/derived/CARD_IMPORT_0.5_SPEC.md`
- `docs/derived/CARD_CATALOG_0.5_SPEC.md`
- `docs/derived/CARD_STATUS_0.5_SPEC.md`
- `docs/derived/MVP_0.5_TEST_MATRIX.md`
- `docs/derived/MVP_0.5_REQUIREMENTS_REVIEW.md`

Daten:

- `data/card-import/source-registry-0.5.json`
- `data/card-import/card-snapshot-0.5.json`
- `data/card-import/card-snapshot-0.5.hash`
- `data/card-import/import-report-0.5.json`
- `data/card-import/catalog-index-0.5.json`
- `data/manifests/card-catalog-status-0.5.json`

Tests:

- `tests/specs/card-import-0.5-acceptance-tests.todo.md`

Mögliches Paket:

- `packages/catalog`: reine TypeScript-Logik für Importnormalisierung, Katalogindex und Statusabgleich.

Regel:

`packages/catalog` darf keine Engine-Regeln aus Kartentext ableiten und keine React-, Server- oder Datenbank-Abhängigkeiten bekommen.

## 10. Bausteine

### 10.1 Importquelle und Nutzungsgrenzen

Vor dem Requirements-Freeze muss festgelegt werden:

- welche Quelle genutzt wird,
- ob die Quelle lokal versioniert werden darf,
- welche Felder übernommen werden dürfen,
- ob Kartentexte gespeichert werden dürfen,
- welche Asset-Felder ignoriert werden müssen,
- ob Updates manuell oder per Skript laufen.

Empfehlung:

V0.5 nutzt einen lokalen, versionierten Snapshot. Externe Quellen werden nicht zur Laufzeit abgefragt.

### 10.2 Katalogschema

Ein Katalogeintrag sollte mindestens enthalten:

- lokale `catalogCardId`,
- optionale externe Quell-ID,
- Titel,
- Side,
- Type,
- Subtypes,
- Faction oder neutraler Platzhalter,
- Set/Snapshot-Zuordnung,
- Nummer oder Sortierschlüssel,
- Text als Anzeigeinformation,
- Kosten-/Stärke-/Agenda-Felder, soweit vorhanden,
- Importstatus,
- Implementierungsstatus,
- Spielbarkeitsstatus,
- Sperrgrund.

Kartentext bleibt Anzeige- und Analyseinformation, nie Parser-Input.

### 10.3 Statusabgleich

Der Statusabgleich verbindet:

- importierten Katalog,
- bestehende `CardDefinition`s,
- Implementierungsmanifest,
- Decklegalitätsprofile.

V0.5 darf Decklegalität vorbereiten, aber die eigentliche Deckeditor-Freigabe liegt in V0.6.

### 10.4 Katalog-API

Minimale read-only Endpunkte:

- `GET /api/cards/catalog`
- `GET /api/cards/catalog/:id`
- `GET /api/cards/status-summary`

Die Endpunkte liefern nur Katalogdaten und keine Matchdaten. Sie dürfen nicht auf `GameState`, Tokens, Sessions oder WebSocket-Kontext zugreifen.

### 10.5 Funktionale Katalogansicht

Die UI bleibt absichtlich schlicht:

- Suchfeld,
- Filter,
- Kartenliste,
- Detailansicht,
- Statusanzeige,
- Hinweis, ob Karte importiert, implementiert, spielbar oder gesperrt ist.

Finale visuelle Gestaltung bleibt V0.7.

## 11. Teststrategie

### 11.1 Artefakt- und Schema-Tests

Pflicht:

- Alle V0.5-JSON-Artefakte parsen.
- Snapshot-Schema validiert Pflichtfelder.
- Doppelte lokale IDs werden abgelehnt.
- Leere oder ungültige Side/Type-Werte werden abgelehnt.
- Snapshot-Hash ist stabil.
- Katalogindex wird deterministisch sortiert.

### 11.2 Import-Normalisierungstests

Pflicht:

- Gleicher Input erzeugt identischen Output.
- Karten mit unbekanntem Type werden `blocked` oder `unsupported`, nicht still konvertiert.
- Ungültige Mengen-/Kosten-/Agenda-Felder erzeugen Warnungen oder Fehler.
- HTML, Skriptfragmente oder unerwartete Markups werden nicht ungefiltert in sichtbare UI-Felder übernommen.
- Asset-URLs werden ignoriert oder explizit als nicht verwendet markiert.

### 11.3 Manifest- und Status-Tests

Pflicht:

- Jede `playable` Karte hat Manifest-Eintrag.
- Jede manifestierte Karte referenziert eine existierende Engine-Karte oder einen dokumentierten internen Demo-Eintrag.
- Importierte, aber nicht implementierte Karten erscheinen nicht in `DEMO_CARDS_BY_ID` als spielbare Engine-Karte.
- `deck_legal` darf nur gesetzt werden, wenn `playable` gesetzt ist.

### 11.4 API- und Visibility-Tests

Pflicht:

- Katalog-API enthält keine Token, Sessions, Matchdaten, FullState, `cardInstances`, private Payloads oder Reconnect-Daten.
- Katalog-API ist read-only.
- Fehlerantworten enthalten keine lokalen Rohpfade, geheimen Tokens oder Stacktraces.
- Public-Katalogdaten unterscheiden sich klar von Match-PlayerViews.

### 11.5 Regressionstests

Pflicht:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`
- bestehende Engine-, AI-, Multiplayer-, Visibility- und V0.4-Kartentests bleiben grün.

### 11.6 Manuelle Smokes

Empfohlen:

- Katalog öffnet lokal.
- Suche findet bekannte importierte Karte.
- Filter nach Side/Type/Status funktionieren.
- Eine importierte, nicht spielbare Karte wird sichtbar als nicht spielbar markiert.
- Bestehender Matchstart mit Demo-Decks funktioniert unverändert.

## 12. Kritische Härtungen

### 12.1 Import-Sicherheit

- Keine direkte Übernahme von HTML in React.
- Keine Ausführung externer Skripte.
- Keine automatische Bild- oder Assetnutzung.
- Keine Laufzeitabfragen externer Kartendatenbanken im Spielbetrieb.
- Größenlimits für Snapshot und Importreport.

### 12.2 Datenintegrität

- Snapshot-Hash und Importreport sind Pflicht.
- Jede manuelle Änderung an Snapshot oder Overrides muss im Diff sichtbar sein.
- Normalisierung ist deterministisch.
- Quellversion und Importzeitpunkt werden dokumentiert.

### 12.3 Scope-Härtung

- Importpfad kann keine Karte in `playable` hochstufen.
- Engine und KI ignorieren import-only Karten.
- Deckvalidierung in V0.4 bleibt unverändert, bis V0.6 sie erweitert.

### 12.4 Performance

- Katalogindex wird vorab erzeugt.
- Suche nutzt normalisierte Suchfelder statt Vollscan über Rohdaten, sofern der Snapshot größer wird.
- API kann Summary und Detail trennen, damit Listenansichten nicht alle Textdetails laden müssen.

## 13. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Quelle rechtlich/organisatorisch unklar | Import blockiert | Quellenentscheidung als V0.5-Gate. |
| Import wird mit Spielbarkeit verwechselt | Scope Creep und ungetestete Karten | Statusmodell und harte Tests gegen Auto-Playable. |
| Kartentext verleitet zu Parser | Regelinkonsistenz | Kartentext nur Anzeige; Resolver bleiben explizit. |
| Große Datenmenge verlangsamt UI | schlechter Katalog | Index, Summary-Endpunkte, deterministische Sortierung. |
| Externe Assetnutzung schleicht ein | Lizenz-/Scope-Risiko | Asset-Felder ignorieren, keine offiziellen Bilder/Frames. |

## 14. Done-Kriterien

V0.5 ist fertig, wenn:

- Requirements und Spezifikationen eingefroren sind,
- lokaler Snapshot und Importreport vorliegen,
- Katalogschema und Statusmodell getestet sind,
- Katalog-API side- und tokenfrei ist,
- funktionale Katalogansicht existiert,
- Import keine Karte automatisch spielbar macht,
- MVP-0.1 bis MVP-0.4-Gates weiter grün sind,
- `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` und `corepack pnpm build` bestehen.
