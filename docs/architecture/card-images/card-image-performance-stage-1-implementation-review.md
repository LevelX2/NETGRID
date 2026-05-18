# Card Image Performance Stage 1 Implementation Review

Stand: 2026-05-15
Status: umgesetzt

## Scope

Umgesetzt wurde nur Stufe 1 der Kartenbild-Performance- und Architektur-Härtung:

- Bildroute `apps/web/app/api/card-images/[cardId]/route.ts` mit Cache-Headern, `ETag`, `Last-Modified` und 304-Revalidation.
- Zentraler serverseitiger Lookup-Vorläufer `apps/web/app/api/card-images/card-image-lookup.ts` für `cardId -> imagePath`.
- Zentraler clientseitiger Vorläufer `apps/web/app/card-image-service.ts` für Kartenbild-URLs und gemeinsame `<img>`-Attribute.
- UI-Härtung in `apps/web/app/page.tsx` für Katalog, Deckeditor, Chronik, Board-Karten und Bild-Tooltips.
- Generische Hidden-Card-Rückseitenklasse in `apps/web/app/globals.css`.

Nicht umgesetzt wurden Thumbnail-Dateigenerierung, Bildderivate, Deckeditor-Redesign, Virtualisierung, Service Worker, IndexedDB sowie Engine-, KI-, Replay-, StateHash- oder Kartenlogikänderungen.

## Architekturentscheidung

Die Route baut Bildpfade nicht mehr direkt aus mehreren Quellen zusammen. `card-image-lookup.ts` ist die zentrale serverseitige Lookup-Schicht:

- selbst generierte Projektbilder kommen aus dem versionierten Manifest `card-image-manifest.ts`,
- lokale O:NR-Frontbilder werden einmalig aus dem lokalen Snapshot in eine `Map<cardId, relativePath>` gelesen,
- relative Pfade werden auf erlaubte Ordnerpräfixe, `.png`, keine absoluten Pfade und kein `..` geprüft,
- Browserantworten enthalten keine absoluten lokalen Pfade.

Der Webclient nutzt `card-image-service.ts` als kleinsten zentralen CardImage-Weg. Die Komponente setzt für Kartenbilder standardmäßig `loading="lazy"` und `decoding="async"`; priorisierte Detailbilder können explizit `priority` setzen.

## Cache-Vertrag

Versionierte generierte Projektbilder:

- URL: `/api/card-images/<cardId>?v=2026-05-04-generated-card-art-1`
- `Cache-Control: private, max-age=31536000, immutable`
- zusätzlich `ETag`, `Last-Modified`, `Content-Length`, `Content-Type: image/png`, `X-Content-Type-Options: nosniff`

Lokale O:NR-Frontbilder und unversionierte Bildaufrufe:

- URL: `/api/card-images/<onr_v1_...>`
- `Cache-Control: private, max-age=3600, must-revalidate`
- `ETag` aus Bildart, `cardId`, Dateigröße und Datei-Mtime
- `Last-Modified` aus Datei-Mtime
- `If-None-Match` und `If-Modified-Since` liefern bei frischem Clientcache `304`

Fehlerantworten:

- `private, no-store`
- keine absoluten Pfade
- keine externen URLs
- keine privaten Snapshot-Details

## Hidden-Info-Nachweis

Hidden Cards erhalten weiterhin keine Frontbild-URL, weil `enrichVisibleCard` nur bekannte Karten mit `imageUrl` anreichert und `CardView` Bild-URLs nur bei `card.known` nutzt.

Die Hidden-Card-DOM-Härtung wurde zusätzlich verschärft:

- keine side-spezifischen Klassen `hiddenRunnerBack` oder `hiddenCorpBack`,
- einheitliche Klasse `hiddenBack`,
- einheitlicher generischer Rückseitenzustand,
- keine versteckten Card-Back-Routen als per-card oder per-instance URL im DOM,
- keine Bild-Tooltips für unbekannte Karten,
- keine `alt`-/`title`-Texte mit verdeckter Kartenidentität.

Die zwei selbst generierten NETGRID-Rückseiten bleiben als generische Platzhalter erlaubt. Für verdeckte Karten wird kein offizieller oder externer Card Back verwendet und kein Rückseitenzustand aus Kartenidentität, Typ, Zone oder Instanz abgeleitet.

## Messnotiz

Vor Stufe 1 verursachten O:NR-Bildrequests bei jeder Anfrage erneut Snapshot-Parsing und lieferten `Cache-Control: no-store, max-age=0`. Nach Stufe 1 wird der lokale O:NR-Snapshot pro Serverprozess in einer Map gehalten; bekannte Bilder können über Browsercache und 304-Revalidation wiederverwendet werden.

Für Stufe 1 wurde kein neues Browser-Performance-Harness eingeführt. Der messbare Vertrag liegt in den Headern, im Wegfall des per-request Snapshot-Parsings und in den gezielten Unit-Checks. Eine belastbare UI-Ladezeitmessung mit Request-Zählung bleibt Stufe 2 vorbehalten.

## Checks

- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/web typecheck`
- `corepack pnpm typecheck`
- `git diff --check`

Zusätzliche Testabdeckung:

- `apps/web/app/api/card-images/[cardId]/route.test.ts` prüft Cache-Control-Vertrag und ETag/Last-Modified-Revalidation.
- `apps/web/app/card-image-service.test.ts` prüft versionierte generierte Bild-URLs, unversionierte O:NR-URLs und dass Hidden-/Unsupported-IDs keine Bild-URL erhalten.

## Offene Punkte für Stufe 2

- echte `thumb`-/`preview`-/`full`-Derivate erzeugen,
- Derivat-Invalidierung und Cleanup definieren,
- alle verbleibenden Kartenbildorte vollständig auf eine zentrale `CardImage`-Komponente ziehen,
- Deckeditor-Layout und Listenperformance messen und danach gezielt verbessern,
- optional Listenvirtualisierung erst nach Messbefund entscheiden.
