# Card Image Display 0.91 Spec

Status: Requirements Freeze mit privater lokaler Nutzungsentscheidung
Stand: 2026-05-03

## Zweck

Diese Spezifikation erweitert die V0.7-CardView-Planung um spätere echte Kartenbilder, ohne den bestehenden Hidden-Info-Vertrag aufzuweichen. Sie beschreibt Anzeigeorte, Fallbacks, Alt-Texte, DOM-Regeln und Matchgrenzen.

Im aktuellen V0.91-Gate ist nur die Anzeige von Original-NETGRID-1996-Frontbildern aus einem nicht versionierten lokalen Cache freigegeben. Die Nutzung bleibt privat/familiär lokal. Android:NETGRID-/NSG-Bilder, offizielle oder externe Card Backs, standalone Frames/Logos und öffentliche Verteilung bleiben blockiert.

Nach Nutzerklärung vom 2026-05-15 sind die zwei selbst generierten NETGRID-Kartenrückseiten des Projekts als generische eigene Platzhalter erlaubt. Sie dürfen keine Kartenidentität, Seite, Typ, Zone oder Ladeunterschiede verdeckter Karten verraten und ersetzen keine Freigabe für offizielle oder externe Card Backs.

## Anzeigeorte

| Ort | Kontext | Bildnutzung nach Freigabe |
|---|---|---|
| Katalogliste | öffentlicher Katalogkontext | Thumbnails für freigegebene, öffentliche Katalogkarten möglich. |
| Katalogdetail | öffentlicher Katalogkontext | mittlere/große Bilder möglich, sofern Policy und Attribution erfüllt sind. |
| Deckeditor | lokaler Deckkontext | O:NR-1996-Frontbilder für bekannte Katalogkarten möglich; keine Decklegalität aus Bildern. |
| Match-Setup-Deckvorschau | privater Vorabkontext | Bilder nur für eigene gewählte Deckkarten und nur aus lokalen Metadaten/Cache. |
| Board | Matchkontext | Bilder nur für Karten, die in der jeweiligen PlayerView bekannt sind. |
| Card Preview | Match- oder Katalogkontext | Bild oder Textkarte je nach Sichtbarkeit und Policy. |
| Zoom/Focus | Match- oder Katalogkontext | großes Bild nur für bekannte/freigegebene Karten. |

## Sichtbarkeitsklassen

| Klasse | Beispiel | Bilddaten erlaubt |
|---|---|---|
| `public_catalog` | Katalogdetail außerhalb eines Matches | Nur nach Asset-Policy. |
| `own_known` | eigene Hand/HQ/Grip in eigener Sicht | Nur nach PlayerView und Asset-Policy. |
| `public_known` | rezzed ICE, gescored Agenda, gestohlene Agenda | Nur nach PlayerView und Asset-Policy. |
| `access_known_window` | aktuell zugegriffene Karte | Nur solange die PlayerView sie als bekannt liefert. |
| `opponent_hidden` | gegnerische Hand, R&D/Stack, unrezzed ICE aus falscher Sicht | Nie. |
| `redacted` | bewusst ausgeblendeter Diagnose-/Undo-Kontext | Nie. |

## Hidden-Card-Regeln

Hidden Cards erhalten:

- keine Bild-URL,
- keine lokale Cache-URL,
- keine Asset-ID,
- keinen externen Printing-Identifier,
- keinen Titel,
- keine DefinitionId,
- keinen `alt`-Text mit Identität,
- keinen `title`-Text mit Identität,
- keine identifizierenden `data-*` Attribute,
- keinen unterscheidbaren Ladezustand,
- keine Bilddimension, die Kartentyp oder Seite verrät,
- keinen Fehlerzustand, der eine konkrete Bilddatei verrät.

Alle Hidden Cards einer sichtbaren Zone verwenden denselben neutralen Platzhalterzustand. Unterschiede dürfen nur aus bereits sichtbaren, legalen PlayerView-Daten stammen, zum Beispiel Anzahl verdeckter Karten oder Rezzed/Unrezzed-Status, sofern diese bereits sichtbar sind.

## Alt-Texte und Beschriftung

| Zustand | `alt`/Beschriftung |
|---|---|
| bekannte Karte mit Bild | sichtbarer Kartentitel nur, wenn derselbe Titel bereits in der PlayerView erlaubt ist. |
| bekannte Karte ohne Bild | Textkarte mit erlaubten sichtbaren Kartendaten. |
| Hidden Card | generischer Text wie `Verdeckte Karte`; keine Seite, kein Typ, kein Titel, keine ID, sofern nicht bereits sichtbar. |
| blockiertes Bild | Textkarte oder generischer Platzhalter; Fehlertext nennt keine externe URL. |

## Fallback-Reihenfolge

Für bekannte Karten:

1. freigegebenes lokales O:NR-1996-Frontbild aus Cache,
2. Textkarte aus side-sicheren Katalog-/PlayerView-Daten,
3. generischer bekannter-Karten-Platzhalter,
4. generischer Fehlerplatzhalter ohne URL.

Für Hidden Cards:

1. einheitlicher Hidden-Platzhalter,
2. gleicher Hidden-Platzhalter bei Fehlern.

Hidden Cards haben keine Bildladeversuche und damit auch keinen Bildfehlerzustand.

Zulässig bleibt ein einheitlicher generischer Platzhalterzustand. Dieser darf visuell eine der selbst generierten NETGRID-Rückseiten nutzen, solange keine echte Frontbildroute, keine fremde oder offizielle Rückseite und keine kartenspezifische URL oder Metadaten verwendet werden.

## API-Payloads

Spätere Bild-APIs dürfen nur liefern:

- `catalogCardId`,
- `imageStatus`,
- freigegebene lokale Anzeige-URL oder Cache-Referenz nur für bekannte/freigegebene Karten,
- erlaubte Größen,
- optionale Attribution,
- Policy-Version,
- Fallback-Grund.

Verboten:

- `GameState`,
- `cardInstances`,
- `privatePayload`,
- `sessionToken`,
- `joinToken`,
- `reconnectToken`,
- lokale absolute Pfade,
- externe Bild-URL in Match-Payloads,
- Hidden-Card-spezifische Assetdaten.

## UI-Präferenz

Bildmodus ist eine lokale Anzeigepräferenz:

- ändert keinen Match-State,
- erzeugt keine StateVersion,
- wird nicht replayt,
- beeinflusst keine LegalActions,
- beeinflusst keine KI,
- kann jederzeit auf Text/Platzhalter zurückfallen.

## Bestehende V0.7-Grenze

V0.7 bleibt gültig: Außerhalb der ausdrücklich freigegebenen privaten lokalen O:NR-1996-Frontbilder rendert die App weiterhin ausschließlich generische Platzhalter und Textkarten. V0.91 hebt keine Sperre für Android:NETGRID, NSG-Bilder, offizielle oder externe Card Backs oder öffentliche Assetnutzung auf. Die zwei selbst generierten NETGRID-Rückseiten sind nur als eigene generische Platzhalter erlaubt.
