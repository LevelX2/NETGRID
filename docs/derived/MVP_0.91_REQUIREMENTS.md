# MVP 0.91 Requirements

Status: Requirements Freeze mit privater lokaler Nutzungsentscheidung
Stand: 2026-05-03
Phase: V0.91 Kartenbild-Asset-Gate und Bild-Import

## Kurzentscheidung

V0.91 friert die Anforderungen für offizielle Kartenbilder als rein lokales Anzeige-Feature ein. Die Phase startet erst nach dokumentiertem V0.9-Finalgate; `MVP_0.9_done: true` ist in `docs/codex/CODEX_STATUS.md` und in der Wissensbasis dokumentiert.

Die technische und sicherheitsbezogene Spezifikation ist testbar. Für Android:NETGRID-/NSG-/NETGRIDDB-Bilder liegt weiterhin keine allgemeine öffentliche Asset-Freigabe vor.

Nach Nutzerentscheidung vom 2026-05-03 wird der V0.91-Implementierungskorridor jedoch auf **Original NETGRID 1996 WotC Frontbilder** begrenzt: private lokale Nutzung nur für den Projektverantwortlichen und Familie, auf Basis der physisch vorhandenen Sammlung. Das ist keine öffentliche Lizenz und keine Freigabe für Redistribution, Cloud-Hosting, öffentliche Assets, Card Backs, standalone Frames oder Logos.

Kernformel:

> Kartenbilder sind lokale Anzeige-Artefakte. Sie sind keine Regelquelle, kein KI-Input, kein Decklegalitätskriterium, kein Match-State und kein Replay-/StateHash-Input.

## Eingangsgate

- `MVP_0.9_done: true` ist dokumentiert.
- V0.7 hat eine image-ready `CardView` mit Text-/Platzhaltermodus, Preview und Zoom.
- V0.5/V0.8 liefern Katalog-/Snapshot-Grundlagen; Importstatus erzeugt keine Spielbarkeit.
- V0.9 hat die KI-Grenze gegen FullState, Hidden Info und private Payloads gehärtet.
- In diesem Freeze werden keine Bilder heruntergeladen und keine offiziellen Assets verwendet.

## Geprüfte Quellenlage

| Quelle | Primärbefund | Entscheidung für V0.91 |
|---|---|---|
| Null Signal Games Visual Assets | Das freigegebene Visual-Assets-Pack steht unter CC BY-ND 4.0, aber die Freigabe gilt nur für dieses Pack; Card Art, Frames und Card Backs sind dort ausdrücklich nicht für die öffentliche Nutzung freigegeben. | Keine Freigabe für Kartenbilder, Frames oder Backs. |
| Null Signal Games Purchase Guide | Print-and-Play-PDFs sind pay-what-you-want und für den Heimdruck gedacht. | PnP-Verfügbarkeit ersetzt keine App-Asset-Lizenz. |
| Null Signal Games FAQ | Null Signal verteilt Card Backs nicht und empfiehlt für Alternativkarten generische/community backs statt offizieller Rückseiten. | Offizielle Card Backs bleiben ausgeschlossen. |
| NETGRIDDB API v2 | Die API ist für ergänzende Tools vorgesehen; NETGRIDDB weist auf urheberrechtlich geschützte Texte und grafische Inhalte hin und fordert HTTP-Caching. | Technische Metadatenquelle möglich, aber keine Bildnutzungsfreigabe. |
| NETGRIDDB API v3 Printings | Printing-Ressourcen enthalten `images` mit Größen wie `tiny`, `small`, `medium`, `large`. | URL-Metadaten dürfen erst nach positiver Policy in versionierte Manifeste. |
| Physische O:NR-1996-Sammlung | Der Projektverantwortliche besitzt die Original-NETGRID-1996-Karten physisch und will sie nur privat/familiär lokal nutzen. | Bevorzugte lokale Quelle für private Frontbild-Scans. |
| Community-Archive O:NR 1996 | Der Reddit-Thread `Original NETGRID / MPC-formatted` verweist auf vollständige aufbereitete O:NR-Scans aus EmergencyShutdown, NETGRIDOnline/Wayback und Community-Scans. | Nur als private lokale Referenz/Gaps, nicht als öffentliche Lizenz. |

Quellenlinks sind in `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md` und `data/card-assets/card-image-source-registry-0.91.json` dokumentiert.

## Nutzungsentscheidung

Aktueller V0.91-Entscheid:

- `original_netgrid_1996_front_images_allowed: true`
- `private_family_local_use_allowed: true`
- `self_scan_allowed: true`
- `approved_community_archive_download_allowed: true`
- `local_cache_allowed: true`
- `version_image_urls_allowed: false`
- `official_card_backs_allowed: false`
- `standalone_frames_or_logos_allowed: false`
- `public_redistribution_allowed: false`
- `ready_for_implementation: true`

Begründung: Für öffentliche oder allgemeine Nutzung offizieller Kartenbilder gibt es weiterhin keine ausreichend ausdrückliche Freigabe. Der Projektverantwortliche akzeptiert aber eine bewusst eingegrenzte private lokale Nutzung der selbst physisch vorhandenen Original-NETGRID-1996-Frontbilder. Die App darf diese später nur aus einem nicht versionierten lokalen Cache anzeigen.

## Nicht-Ziele

V0.91 baut nicht:

- neue spielbare Karten,
- neue Regelmechaniken,
- Kartentextparser oder automatische Regelumsetzung,
- offizielle Card Backs, standalone Card Frames oder Logos,
- öffentliche Verteilung heruntergeladener Bilder,
- externe Runtime-Abhängigkeiten beim Matchstart,
- Bilddaten in Engine, KI, LegalActions, PlayerActions, GameState, PublicEvents, Replays, Logs oder StateHash,
- Bild-URLs, Asset-IDs, Alt-Texte, Titel, DOM-Metadaten oder unterscheidbare Ladezustände für Hidden Cards.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| V091-MUST-001 | Requirements Freeze | Alle V0.91-Requirements-, Asset-Gate-, Import-, Display-, Test- und Review-Artefakte existieren. | V091-T001 |
| V091-MUST-002 | V0.9-Vorbedingung | V0.91 startet nur, wenn `MVP_0.9_done: true` oder ein gleichwertiges V0.9-Finalgate dokumentiert ist. | V091-T002 |
| V091-MUST-003 | Primärquellenprüfung | Quelle, technische Verfügbarkeit, Nutzungsbedingungen, Ausschlüsse und offene Rechtsentscheidung sind aus offiziellen oder primären Quellen dokumentiert. | V091-T003 |
| V091-MUST-004 | Asset-Policy | `data/card-assets/card-image-policy-0.91.json` entscheidet Download, Cache, URL-Versionierung, Anzeige und Ausschlüsse eindeutig. | V091-T004 |
| V091-MUST-005 | Source Registry | `data/card-assets/card-image-source-registry-0.91.json` enthält nur Quellenmetadaten, keine echten Kartenbilddateien und keine heruntergeladenen Assets. | V091-T005 |
| V091-MUST-006 | Kein Gameplay-Einfluss | Bilddaten ändern keine Engine-Regeln, LegalActions, Deckvalidierung, Matchstart-Freigabe, KI-Entscheidung, Replay oder StateHash. | V091-T006 |
| V091-MUST-007 | Lokaler Cache nur nach Freigabe | Ein späterer Cache liegt ausschließlich in einem nicht versionierten lokalen Ordner und wird erst nach positiver Policy aufgebaut. | V091-T007 |
| V091-MUST-008 | Deterministische Metadaten | Spätere Bildmetadaten, Manifeste und Cache-Reports werden stabil sortiert und mit Quelle, Zeitpunkt, Hash/ETag und Policy-Version geführt. | V091-T008 |
| V091-MUST-009 | Read-only Bild-APIs | Spätere APIs liefern nur side-sichere Anzeige- und Statusdaten; sie enthalten keine Tokens, FullState, `cardInstances`, private Payloads oder lokale Pfade. | V091-T009 |
| V091-MUST-010 | PlayerView als Match-Grenze | In laufenden Matches entscheidet ausschließlich die side-gefilterte `PlayerView`, ob eine Karte bekannt genug für ein Bild wäre. | V091-T010 |
| V091-MUST-011 | Hidden-Info-Schutz | Hidden Cards enthalten keine Bild-URL, keine Asset-ID, keinen Titel, keine DefinitionId, keinen `alt`-/`title`-Text, keine Datenattribute und keinen unterscheidbaren Ladezustand. | V091-T011 |
| V091-MUST-012 | Fallbacks | Fehlende, blockierte, beschädigte oder nicht freigegebene Bilder fallen auf Textkarte oder einheitlichen generischen Platzhalter zurück. | V091-T012 |
| V091-MUST-013 | Anzeigeorte | Katalog, Deckeditor, Match-Setup-Deckvorschau, Board, Card Preview und Zoom sind spezifiziert und nach öffentlichem Katalogkontext vs. Matchkontext getrennt. | V091-T013 |
| V091-MUST-014 | Keine Runtime-Fetches im Match | Matches starten und laufen ohne externe Bildquelle; Runtime nutzt nur lokale freigegebene Metadaten/Cache oder Fallback. | V091-T014 |
| V091-MUST-015 | Private O:NR-Asset-Grenze | Nach Policy-Freigabe sind nur Original-NETGRID-1996-Frontbilder für private lokale Anzeige erlaubt; Card Backs, standalone Frames/Logos, öffentliche Verteilung und Bildversionierung bleiben verboten. | V091-T015 |
| V091-MUST-016 | Must-Testabdeckung | Jede Must-Anforderung ist in `docs/derived/MVP_0.91_TEST_MATRIX.md` abgedeckt. | V091-T016 |

## Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V091-SHOULD-001 | Attribution | Falls eine spätere Quelle Attribution verlangt oder empfiehlt, wird sie in Katalog/Info oder Dokumentation angezeigt, ohne Hidden Cards zu markieren. |
| V091-SHOULD-002 | Größenprofil | Spätere Bildgrößen werden nach UI-Ort getrennt: kleine Thumbnails für Listen, mittlere Boardbilder, große Preview/Zoom-Bilder. |
| V091-SHOULD-003 | Cache-Wartung | Spätere Cache-Kommandos unterstützen Neuaufbau, Validierung, Bereinigung blockierter Dateien und Bericht ohne lokale Secrets. |
| V091-SHOULD-004 | Offline-first | Nach freigegebenem Import bleibt die App lokal nutzbar, auch wenn die Quelle nicht erreichbar ist. |
| V091-SHOULD-005 | Manuelle Allowlist | Offizielle Bildnutzung wird nicht pauschal für alle Karten aktiviert, sondern über Quelle, Set, Sprache und Policy-Entscheid allowlisted. |

## Offene Entscheidungen

| ID | Entscheidung | Blockerwirkung |
|---|---|---|
| V091-O-001 | Welche konkreten lokalen Scan-/Archivdateien werden genutzt? | Vor Implementierung als lokale Quelle festlegen. |
| V091-O-002 | Wie werden O:NR-Karten-IDs, Sets und Bilddateinamen normalisiert? | Muss im Import umgesetzt werden. |
| V091-O-003 | Welche Auflösung wird für Board, Preview und Zoom bevorzugt? | UI-/Cache-Detail. |
| V091-O-004 | Soll die App eine private Nutzungshinweis-Seite anzeigen? | Optional, aber empfohlen. |

## Gate-Ergebnis

Der Requirements-Freeze ist abgeschlossen und testbar. Das Asset-Gate ist für private lokale Original-NETGRID-1996-Frontbilder bestanden, bleibt aber für öffentliche Nutzung, Card Backs, standalone Frames/Logos, Android:NETGRID-Bilder und NSG-Bilder gesperrt.

`MVP_0.91_requirements_freeze_done: true`

`ready_for_implementation: true`
