# Card Image Asset Gate 0.91 Spec

Status: Requirements Freeze mit privater lokaler Nutzungsentscheidung
Stand: 2026-05-03

## Zweck

Diese Spezifikation definiert das V0.91-Asset-Gate für offizielle Kartenbilder. Sie ist absichtlich strenger als eine reine technische Importplanung: Bilder dürfen erst genutzt werden, wenn Quelle, Nutzungsumfang, Cache, Versionierung, Attribution, Hidden-Info-Schutz und Tests positiv entschieden sind.

Nach Nutzerentscheidung vom 2026-05-03 ist der freigegebene Korridor eng begrenzt: **Original NETGRID 1996 WotC Frontbilder**, privat und lokal, für den Projektverantwortlichen und Familie. Der Projektverantwortliche besitzt die physischen Karten. Diese Entscheidung ist keine öffentliche Lizenz.

## Primärquellen

| Quelle | URL | Relevanz |
|---|---|---|
| Null Signal Games Visual Assets | https://nullsignal.games/about/nsg-visual-assets/ | Primäre Asset-Guidelines von Null Signal Games. |
| Null Signal Games Purchase Guide | https://nullsignal.games/players/purchase-guide/ | Primäre Hinweise zu Print-and-Play-PDFs und Heimdruck. |
| Null Signal Games FAQ | https://nullsignal.games/about/frequently-asked-questions/ | Primärer Hinweis zu nicht verteilten offiziellen Card Backs. |
| NETGRIDDB API v2 | https://netgriddb.com/api/2.0/doc | Primäre API-Nutzungs- und Caching-Hinweise. |
| NETGRIDDB API v3 Printings | https://api.netgriddb.com/api/docs/printings%2Fall_printings | Technische Bildmetadaten in Printing-Ressourcen. |
| Physische O:NR-1996-Sammlung | lokal beim Projektverantwortlichen | Bevorzugte private Quelle für eigene Frontbild-Scans. |
| Reddit O:NR MPC-formatted | https://www.reddit.com/r/NETGRID/comments/hu282l/original_netgrid_mpcformatted/ | Community-Hinweis auf vollständige O:NR-Scanarchive. |
| CCG Trader NetRunner CCG | https://www.ccgtrader.net/games/netgrid-ccg/ | Set- und Kartenlistenreferenz für O:NR. |

## Quellenbefund

### Null Signal Games

Die freigegebenen Null-Signal-Visual-Assets sind ein abgegrenztes Asset-Pack unter CC BY-ND 4.0. Diese Freigabe erstreckt sich nach der Quelle nicht auf andere Null-Signal-Artworks, Card Frames oder Card Backs. Card Art, Frames und Card Backs bleiben daher für V0.91 ohne separate Freigabe gesperrt.

Print-and-Play-PDFs sind laut Purchase Guide direkt verfügbar und für Heimdruck gedacht. Diese Verfügbarkeit wird für V0.91 nicht als Erlaubnis gewertet, vollständige Kartenbilder in einer Webapp zu importieren, zu cachen oder anzuzeigen.

Die FAQ bestätigt zusätzlich, dass Null Signal offizielle Card Backs nicht verteilt und für Alternativkarten generische/community backs empfiehlt. V0.91 nutzt deshalb keine offiziellen Rückseiten.

### NETGRIDDB

NETGRIDDB stellt öffentliche API-Endpunkte bereit und beschreibt die API als Ergänzung für Deckbuilder, Kartendatenbanken, Turniermanager und ähnliche Tools. Die API v2 weist auf urheberrechtlich geschützte Texte und grafische Inhalte hin und fordert HTTP-Caching-Best-Practices.

Die API v3 `printings`-Ressourcen enthalten technische Bildmetadaten mit Größenprofilen. Das belegt technische Verfügbarkeit, aber keine eigenständige Bildlizenz für lokale Downloads, Versionierung oder Anzeige.

### Original NETGRID 1996

Original NETGRID wurde 1996 von Wizards of the Coast veröffentlicht und ist out of print. Die beste Projektquelle ist die physische Sammlung des Projektverantwortlichen. Community-Archive können als private lokale Referenz oder Gap-Fill dienen, insbesondere der Reddit-Thread `Original NETGRID / MPC-formatted`, der auf EmergencyShutdown.net, NETGRIDOnline/Wayback und frische Community-Scans verweist.

Diese Quellen sind keine öffentliche Lizenz. Die Freigabe beruht auf der bewusst eingegrenzten privaten lokalen Nutzungsentscheidung des Projektverantwortlichen.

## Gate-Entscheidung

| Feld | Wert |
|---|---|
| `source_candidate` | `project_owner_physical_onr_1996_collection` |
| `usage_decision` | `private_local_usage_decision_accepted` |
| `original_netgrid_1996_front_images_allowed` | `true` |
| `self_scan_allowed` | `true` |
| `approved_community_archive_download_allowed` | `true` |
| `local_cache_allowed` | `true` |
| `image_url_versioning_allowed` | `false` |
| `official_card_backs_allowed` | `false` |
| `self_generated_netgrid_back_placeholders_allowed` | `true` |
| `standalone_card_frames_allowed` | `false` |
| `standalone_logos_allowed` | `false` |
| `public_redistribution_allowed` | `false` |
| `ready_for_implementation` | `true` |

## Freigabekriterien

Das Asset-Gate bleibt nur unter diesen Bedingungen auf `ready_for_implementation: true`:

- der konkrete Nutzungsumfang bleibt Original NETGRID 1996 Frontbilder,
- die Nutzung bleibt privat, lokal und auf Projektverantwortlichen/Familie beschränkt,
- Quelle, Sets, Bildgrößen und Dateikonventionen sind dokumentiert,
- Download und Cache sind nur für einen nicht versionierten lokalen Ordner freigegeben,
- versionierte Metadaten enthalten keine Remote-Per-Card-Bild-URLs,
- vollständige Frontbilder und offizielle oder externe Card Backs werden nicht ins Repository aufgenommen,
- Match-Runtime hat keine externe Bildabhängigkeit,
- Hidden-Card-Payloads und DOM bleiben identitätsneutral,
- alle Must-Anforderungen sind in der Testmatrix abgedeckt.

## Harte Ausschlüsse

V0.91 schließt aus:

- offizielle oder externe Card Backs,
- standalone Card Frames,
- standalone Logos,
- FFG-/WotC-/NSG-Assets als öffentlich verbreitete Dateien,
- öffentliche oder halböffentliche Weiterverteilung gecachter Kartenbilder,
- Bilddateien in Git,
- Bilddaten oder Bildmetadaten in Engine, KI, GameState, LegalActions, PlayerActions, PublicEvents, Replays, Logs, StateHash oder Hidden-Info-Payloads.

Erlaubt bleiben die zwei selbst generierten NETGRID-Rückseiten des Projekts als generische eigene Platzhalter. Diese Erlaubnis gilt nicht für offizielle, externe oder nachgebaute fremde Card Backs.

## Policy-Artefakte

Die strukturierte Freeze-Entscheidung liegt in:

- `data/card-assets/card-image-source-registry-0.91.json`
- `data/card-assets/card-image-policy-0.91.json`

Diese Dateien sind keine Implementierung. Sie dürfen keine Bilddateien und keine heruntergeladenen offiziellen Assets enthalten.

## Änderungsregel

Jede spätere Erweiterung über private lokale O:NR-1996-Frontbilder hinaus muss als eigene Gate-Entscheidung dokumentiert werden:

- Quelle und Datum der neuen Erlaubnis,
- erlaubter Nutzungsumfang,
- betroffene Sets/Sprachen/Bildgrößen,
- Cache- und Versionierungsregeln,
- Attribution,
- Risikoannahmen,
- Testmatrix-Update,
- Review-Ergebnis.
