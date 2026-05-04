# MVP 0.91 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.91 card image asset gate`

## 1. Kurzentscheidung

MVP 0.91 ist die Bild- und Asset-Gate-Phase nach V0.9.

Die Phase wird bewusst hinter V0.9 gelegt, damit V0.8 zuerst den spielbaren Karten-/Deck-Slice stabilisiert und V0.9 danach die KI-Qualität auf dieser Basis härtet. Erst danach werden offizielle Kartenbilder als lokales Anzeige-Feature geplant.

Kernformel:

> Kartenbilder sind lokale Anzeige-Artefakte. Sie sind keine Regelquelle, kein Decklegalitätskriterium, kein Match-State und kein KI-Input.

## 2. Scope-Entscheidung

V0.91 baut auf diesen vorherigen Phasen auf:

- V0.5: Katalog- und Snapshot-Modell.
- V0.6: Deck-Snapshots und Matchstart-Revalidierung.
- V0.7: image-ready `CardView`, Preview, Zoom und Hidden-Card-Platzhalter.
- V0.8: kuratierter spielbarer Karten-/Deck-Slice.
- V0.9: bessere KI, Rollenmodelle, Erklärungen und Soak-/Regressionstests.

V0.91 ergänzt dazu:

- Quellen-, Nutzungs- und Lizenzentscheidung für Kartenbilder.
- Bild-Source-Registry und Asset-Policy.
- Lokalen, nicht versionierten Bildcache.
- Optional versionierte Bildmetadaten, sofern die Nutzungsentscheidung dies erlaubt.
- Importprogramm für Bildmetadaten und lokale Bilddateien.
- Anzeige bekannter Kartenbilder im Katalog, Deckeditor, Card Preview, Zoom und Board.
- Fallback auf Textkarte oder generischen Platzhalter.

## 3. Nicht-Ziele

V0.91 baut nicht:

- neue spielbare Karten,
- neue Regelmechaniken,
- Kartentextparser oder automatische Regelumsetzung,
- offizielle Card Backs oder Card Frames ohne gesonderte Freigabe,
- öffentliche Verteilung heruntergeladener Bilder,
- Bilddaten in Engine, KI, Replay, StateHash, LegalActions oder PlayerActions,
- Bild-URLs für verdeckte gegnerische Karten,
- unterscheidbare Ladezustände für Hidden Cards,
- externe Laufzeitabhängigkeit beim Matchstart.

## 4. Asset-Gate

Vor jeder Implementierung muss ein Requirements-Freeze entscheiden:

- welche Quelle genutzt wird,
- ob Download, lokaler Cache und private Anzeige erlaubt sind,
- ob URLs oder Metadaten versioniert werden dürfen,
- welche Bildgrößen genutzt werden,
- welche Attribution oder Nutzungsnotiz angezeigt oder dokumentiert werden muss,
- ob nur private lokale Nutzung erlaubt ist,
- wie Updates und Cache-Löschung funktionieren,
- welche Bilder ausgeschlossen bleiben.

Empfohlene Grundlinie:

- Binäre Kartenbilder werden nicht versioniert.
- Lokale Downloads liegen unter `data/local-assets/card-images/` oder einem gleichwertigen ignorierten Ordner.
- Versionierte Artefakte enthalten höchstens freigegebene Quellen-/Policy- und Mapping-Metadaten.
- Ohne positive Nutzungsentscheidung bleibt der Bildmodus bei generischen Platzhaltern.

## 5. Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V091-MUST-001 | Requirements Freeze | `MVP_0.91_REQUIREMENTS.md` definiert Quelle, Nutzungsentscheidung, Nicht-Ziele, Artefakte, APIs, UI-Orte und Tests. |
| V091-MUST-002 | Asset-Policy | Eine dokumentierte Asset-Policy entscheidet klar zwischen erlaubter Anzeige, lokalem Cache, Versionierung und Ausschlüssen. |
| V091-MUST-003 | Kein Gameplay-Einfluss | Bilddaten ändern keine Engine-Regeln, keine LegalActions, keine Deckvalidierung, keine Matchstart-Freigabe, keinen Replay und keinen StateHash. |
| V091-MUST-004 | Lokaler Cache | Heruntergeladene Bilder liegen nur in einem nicht versionierten lokalen Cache und können reproduzierbar neu aufgebaut werden. |
| V091-MUST-005 | Deterministisches Manifest | Bildmetadaten und Cache-Reports werden sortiert, validiert und mit Hashes oder ETags nachvollziehbar geführt. |
| V091-MUST-006 | Side-sichere Anzeige | Laufende Matches zeigen Bilder nur für Karten, die laut PlayerView bekannt sind; Hidden Cards nutzen einen einheitlichen generischen Platzhalter. |
| V091-MUST-007 | Keine Hidden-URL-Leaks | Hidden Cards enthalten keine Bild-URL, keine Asset-ID, keinen Titel im `alt`-/`title`-Text, keine unterscheidbaren Ladezustände und keine DOM-Metadaten. |
| V091-MUST-008 | Fallback | Fehlende, blockierte, beschädigte oder nicht freigegebene Bilder fallen auf Textkarte oder Platzhalter zurück. |
| V091-MUST-009 | Read-only APIs | Bild-APIs geben nur Anzeige- und Statusdaten aus, keine Tokens, keinen FullState, keine `cardInstances` und keine privaten Payloads. |
| V091-MUST-010 | Tests | Importer, Manifest, Cache, API-Sicherheit, Hidden-Info-Schutz und UI-Fallbacks sind test- oder smoke-abgedeckt. |

## 6. Vorgeschlagene Artefakte

Derived Docs:

- `docs/derived/MVP_0.91_REQUIREMENTS.md`
- `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md`
- `docs/derived/CARD_IMAGE_IMPORT_0.91_SPEC.md`
- `docs/derived/CARD_IMAGE_DISPLAY_0.91_SPEC.md`
- `docs/derived/MVP_0.91_TEST_MATRIX.md`
- `docs/derived/MVP_0.91_REQUIREMENTS_REVIEW.md`

Daten und lokale Artefakte:

- `data/card-assets/card-image-source-registry-0.91.json`
- `data/card-assets/card-image-policy-0.91.json`
- `data/card-assets/card-image-manifest-0.91.json`, nur falls Metadaten-Versionierung freigegeben ist
- `data/local-assets/card-images/`, nicht versionierter lokaler Bildcache
- `data/local-assets/card-image-cache-report.json`, nicht versionierter lokaler Cache-Report

Mögliche Codebereiche:

- `packages/assets`
- `scripts/import-card-images.ts`
- `apps/web/app/api/cards/images/`
- bestehende `CardView`-Komponenten in der Web-App

## 7. Importprogramm

Das Importprogramm arbeitet zweistufig:

1. Metadatenimport:
   - Katalogkarten lesen.
   - Quelle und externe Karten-/Printing-IDs zuordnen.
   - erlaubte Bildgrößen und URLs aus der freigegebenen Quelle lesen.
   - Manifest oder lokalen Cache-Plan schreiben.

2. Bildcache:
   - Bilder nur nach Asset-Policy herunterladen.
   - Content-Type, Größe und Mindestdimension prüfen.
   - Hash, ETag oder Last-Modified speichern.
   - defekte Dateien löschen oder als blockiert markieren.
   - Offline-Fallback ermöglichen.

Der Importer darf nicht beim Matchstart laufen und darf keine Engine-, KI- oder Deckvalidierungsdaten erzeugen.

## 8. Anzeige

Erlaubte Anzeigeorte:

- Katalogliste und Katalogdetail,
- Deckeditor,
- Match-Setup-Deckvorschau,
- bekannte Karten im Board,
- Card Preview,
- Zoom/Focus.

Regeln:

- Katalog und Deckeditor dürfen öffentliche Katalogkarten zeigen, sofern die Asset-Policy es erlaubt.
- Im Match entscheidet immer die side-gefilterte `PlayerView`, ob ein Bild geladen werden darf.
- Unbekannte gegnerische Karten bekommen denselben neutralen Platzhalter.
- Eigene verdeckte Karten dürfen nur in der eigenen Sicht Bilddaten erhalten, wenn sie laut PlayerView bekannt sind.
- Bildfehler bleiben lokal und verraten keine Kartenidentität der Gegenseite.

## 9. Teststrategie

Pflichttests:

- Asset-Policy validiert Quelle, erlaubte Nutzung, Cache-Regeln und Ausschlüsse.
- Importer erzeugt deterministische, sortierte Metadaten.
- Cache-Report enthält keine lokalen Secrets und keine Runtime-Tokens.
- API-Payloads enthalten keine verbotenen Schlüssel wie `GameState`, `cardInstances`, `privatePayload`, `sessionToken`, `joinToken` oder `reconnectToken`.
- Hidden-Card-Payloads enthalten keine Bild-URL, keine Asset-ID und keinen unterscheidbaren Ladezustand.
- CardView fällt bei fehlendem Bild auf Textkarte oder Platzhalter zurück.
- Katalogdetail kann ein freigegebenes Bild anzeigen.
- Runner- und Corp-Board-Smokes zeigen bekannte Kartenbilder, aber Hidden Cards nur generisch.
- Bestehende V0.1- bis V0.9-Gates bleiben grün.

## 10. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Unklare Rechte an offiziellen Bildern | Lizenz-/Projektgrenze verletzt | Requirements-Freeze mit positiver Nutzungsentscheidung als hartes Gate. |
| Bilder werden versehentlich versioniert | unerwünschte Weiterverteilung | Cache-Ordner ignorieren und Git-Status-/Artifact-Tests ergänzen. |
| Hidden Cards leaken über URLs | Fairnessbruch | PlayerView-gesteuerte Anzeige und Hidden-URL-Leak-Tests. |
| Bilddaten beeinflussen StateHash | Replay-Bruch | Bilddaten außerhalb Engine, Replay und Match-State halten. |
| Externe Quelle wird Laufzeitabhängigkeit | Matchstart wird fragil | Import nur offline/vorab; Runtime nutzt lokalen Cache oder Fallback. |
| Bildmodus überdeckt Lesbarkeit | schlechtere UI | Text-Fallback, Preview und Zoom bleiben Pflicht. |

## 11. Done-Kriterien

V0.91 ist fertig, wenn:

- Requirements und Asset-Policy eingefroren sind,
- die Quelle und Nutzung ausdrücklich freigegeben oder der Bildmodus bewusst blockiert ist,
- der Importer lokale Bildmetadaten und optional lokale Bilder reproduzierbar verarbeitet,
- heruntergeladene Bilder nicht versioniert werden,
- Katalog, Deckeditor und CardView freigegebene Bilder anzeigen können,
- Hidden Cards keine Bilddaten, URLs, Alt-Texte, Asset-IDs oder Ladezustands-Leaks enthalten,
- fehlende oder blockierte Bilder sauber auf Textkarte oder Platzhalter fallen,
- APIs und UI-Smokes side-sicher sind,
- bestehende Engine-, KI-, Replay-, StateHash-, Multiplayer-, Katalog-, Deck- und Visibility-Gates grün bleiben,
- bekannte Lizenz-, Quellen- und Restpunkte dokumentiert sind.
