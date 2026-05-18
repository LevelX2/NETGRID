# Card Image Performance and Architecture Requirements

Stand: 2026-05-15
Status: planning_handoff

## Zweck

Dieses Artefakt plant die Härtung der lokalen Kartenbildanzeige in zwei Stufen. Ziel ist spürbar schnellere Wiederanzeige bekannter Kartenbilder, ohne das private lokale Asset-Gate, Hidden-Info-Grenzen oder die Trennung von UI und Engine aufzuweichen.

Kartenbilder bleiben reine Anzeige-Artefakte. Sie sind keine Regelquelle, kein Decklegalitätskriterium, kein Match-State, kein KI-Input und kein Replay-/StateHash-Input.

## Führende Vorgaben

- `docs/releases/mvp/mvp-0-91-card-images/card-image-asset-gate-spec.md`
- `docs/releases/mvp/mvp-0-91-card-images/card-image-display-spec.md`
- `docs/releases/v1/v1-0-6-ui-resource-clarity/resource-card-display-spec.md`
- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/test-matrix.md`

## Entscheidung zu Rückseiten

Die zwei selbst generierten NETGRID-Kartenrückseiten des Projekts sind als generische, eigene Platzhalter erlaubt. Sie gelten nicht als offizielle oder externe Card Backs.

Bedingungen:

- nur diese zwei selbst generierten Rückseiten,
- keine offiziellen, externen oder nachgebauten fremden Rückseiten,
- keine Nutzung als Identitäts- oder Typinformation,
- kein per-card oder per-instance Back,
- kein Bildpfad, Alttext, Titel, CSS-Klasse oder Ladezustand, der verdeckte Karten unterscheidbar macht,
- für verdeckte gegnerische Karten bleibt der Zustand generisch und side-sicher.

## Ausgangslage

Die aktuelle Bildanzeige hat mehrere Performance- und Architektur-Risiken:

- Die Bildroute lädt lokale Kartenbilder mit zu restriktivem Cache-Verhalten.
- Die Zuordnung `cardId -> lokaler Bildpfad` wird nicht als zentrale, serverseitige Lookup-Schicht behandelt.
- Kleine Listenbilder, Tooltipbilder und größere Vorschauen können dieselben großen Originaldateien laden.
- Mehrere UI-Stellen bauen Bild-URLs oder Bildzustände direkt statt über eine zentrale CardImage-Schicht.
- Tooltipbilder können unnötig früh im DOM landen.

Positiv:

- Bilder werden weiterhin im Webclient angereichert und nicht in Engine, Shared-GameState oder PlayerActions getragen.
- Hidden-Info-Regeln sind fachlich klar: verdeckte Karten bekommen keine echten Frontbild-URLs und keine identifizierenden Bildattribute.

## Architekturziel

Langfristig soll es eine zentrale Bildschicht geben:

- `CardImageService` oder gleichwertige Hilfsschicht für URL-, Cache-, Größen- und Fallback-Entscheidungen.
- Eine zentrale UI-Komponente `CardImage` oder ein klarer Vorläufer davon.
- Eingaben nur aus side-sicheren Daten: `cardId`, Sichtbarkeitsstatus, erlaubter Titel, gewünschter Darstellungsmodus.
- Ausgabe nur als Anzeigeentscheidung: Bild, Text-Fallback, generischer Platzhalter oder erlaubter selbst generierter Rückseitenplatzhalter.

Verboten bleiben:

- Bild-URLs in Match-Payloads für verdeckte Karten,
- Bilddaten in Engine, KI, Replays, Logs oder StateHash,
- absolute lokale Pfade in Browserantworten,
- unterscheidbare Lade- oder Fehlerzustände für verdeckte Karten.

## Stufe 1: Cache, Lookup und Render-Härtung

Ziel: kleiner, risikoarmer Technik-Slice mit messbarer Wirkung.

In Scope:

- Bildroute `apps/web/app/api/card-images/[cardId]/route.ts` prüfen und härten.
- Cache-Header für bekannte lokale Bilder einführen:
  - versionierte generierte Bilder: `private`, lange Cache-Zeit, `immutable`, sofern die URL-Version eindeutig ist,
  - lokale O:NR-Frontbilder ohne URL-Version: `private`, begrenzte Cache-Zeit, Revalidation über `ETag` und `Last-Modified`.
- Serverseitige `cardId -> imagePath`-Lookup-Map einführen oder vorbereiten, damit der lokale Snapshot nicht pro Bildrequest neu geparst wird.
- Fehlerantworten ohne absolute Pfade, ohne private Details und ohne Kartendaten-Leak.
- UI-Bildladepunkte so anpassen, dass Listenbilder `loading="lazy"` und `decoding="async"` nutzen, sofern passend.
- Tooltipbilder im Bildmodus erst bei sichtbarem Tooltip oder Hover-Intent mounten.
- Zentrale CardImage-Schicht mindestens vorbereiten: neue kleine Komponente oder Helper, der vorhandene Direktpfade reduziert, ohne das gesamte Deckeditor-Layout umzubauen.
- Messpunkte für erste Anzeige, Wiederanzeige und Tooltip-Öffnung ergänzen oder dokumentieren.

Out of Scope:

- echte Thumbnail-Dateigenerierung,
- WebP-/PNG-Derivatpipeline,
- Deckeditor-Redesign,
- Virtualisierung großer Listen,
- Service Worker oder IndexedDB,
- neue Asset-Gate-Entscheidungen,
- Engine-, KI-, Replay- oder StateHash-Änderungen.

Akzeptanzkriterien:

- Wiederholtes Anzeigen derselben bekannten Karte löst nicht unnötig vollständige Reload-Kosten aus.
- Die Bildroute liefert nachvollziehbare `ETag`-/`Last-Modified`- oder passende immutable Cache-Verträge.
- Hidden Cards erzeugen keine Frontbild-Requests und keine identifizierenden `src`, `alt`, `title`, `data-*` oder CSS-Zustände.
- Selbst generierte Rückseiten bleiben generisch und leaken keine Kartenidentität.
- Katalog, Deckeditor, Matchansicht, Chronik und Tooltip bleiben funktional.
- Relevante Web-/Visibility-Tests und Typecheck sind grün.

Empfohlene Checks:

- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm typecheck`
- ein gezielter Hidden-Info-/DOM-Leak-Test gegen Bildpfade, Alttexte, Titel und Card-Back-Routen
- Browser- oder Script-Messung der Bildrequests vor/nach Wiederanzeige

## Stufe 2: Derivate, zentrale Komponente und Editor-Layout

Ziel: größere Produkt- und UX-Härtung auf Basis der Messung aus Stufe 1.

In Scope:

- echte Bildvarianten:
  - `thumb` für Listen,
  - `preview` für Tooltips und Seitenvorschau,
  - `full` nur für explizite Zoom-/Detailansicht.
- lokale Derivat-Erzeugung für private Assets in ignorierten Asset-Pfaden.
- Cleanup- und Invalidierungsregeln für Derivate.
- zentrale `CardImage`-Komponente für alle Bildorte.
- Deckeditor-Kompaktlayout:
  - Sticky Action Bar mit Speichern, Prüfen und Matchstart,
  - kompaktere Filter,
  - seitliche oder einklappbare Preview,
  - bessere Desktop-Priorisierung.
- optional spätere Listenvirtualisierung nach Messbefund.

Out of Scope:

- öffentliche Asset-Verteilung,
- offizielle oder externe Card Backs,
- neue Regel- oder Kartenfreigabe,
- Service Worker oder IndexedDB, solange URL- und Hidden-Info-Vertrag nicht separat freigegeben sind.

Akzeptanzkriterien:

- Listen nutzen kleine Bildderivate statt Originaldateien.
- Preview und Fullsize sind getrennte bewusste Ladepfade.
- Deckeditor bleibt schneller und Aktionen sind ohne langes Scrollen erreichbar.
- Kein Hidden-Info-Leak über Derivatnamen, URL, Ladezustand oder DOM.
- Asset-Derivate bleiben lokal/ignoriert und werden nicht versehentlich versioniert.

## Umsetzungsempfehlung

Stufe 1 sollte vor Stufe 2 umgesetzt werden. Sie reduziert Wiederlade- und Serverkosten, klärt die Architekturgrenze und erzeugt Messdaten. Stufe 2 sollte erst starten, wenn die Stufe-1-Messung zeigt, wo die größten verbleibenden Bildkosten liegen.
