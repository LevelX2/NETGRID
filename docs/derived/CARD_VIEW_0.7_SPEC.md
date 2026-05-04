# Card View 0.7 Spec

Status: Design Freeze
Stand: 2026-05-03

## Ziel

`CardView` macht Karten im Board lesbar und bereitet spätere echte Kartenabbilder vor. In V0.7 werden keine offiziellen Kartenbilder, Logos, Frames oder Card Backs geladen.

## Modi

| Modus | Verwendung | Hidden-Info-Regel |
|---|---|---|
| `placeholder` | generische Projektkarte ohne echtes Bild | side-sicher |
| `text-card` | Titel, Typ, Kosten, Status und kurzer Text für bekannte Karten | nur bekannte Karten |
| `compact` | kleine Boardkarte mit Minimaldaten | keine privaten Details |
| `preview` | großes Detailpanel für fokussierte bekannte Karte | nur side-sichere Details |
| `zoom` | fokussierter Dialog | nur side-sichere Details |
| `hidden` | verdeckte gegnerische Karte | kein Titel, keine DefinitionId, keine Bilddaten |
| `redacted` | bewusst ausgeblendeter Kontext | neutraler Platzhalter |
| `image-ready` | Karte hat spätere Bildmetadaten, Bild wird aber nicht geladen | keine externen Assets ohne Freigabe |

## Layout

- Standardseitenverhältnis: `5 / 7`.
- Boardkarten zeigen wenig Text.
- Detailtext liegt in Preview oder Zoom.
- Hidden Cards verwenden einheitliche generische Platzhalter.
- Bildfehler fallen auf Text oder Platzhalter zurück.
- Keine CardView darf durch Hover, Tooltip, `alt`, `title`, Datenattribute oder Ladezustand verdeckte Karten identifizierbar machen.

## Lokale Anzeigeoptionen

Die lokale Card-Display-Einstellung darf enthalten:

- Platzhalterbild,
- kompakte Karten,
- Text-Fallback,
- Preview,
- Zoom/Focus.

Sie ist eine UI-Präferenz und verändert keinen Match-State, keine LegalActions, keine StateVersion und keine Replay-Daten.

## Asset-Gate

Vor echter Bildanzeige muss separat dokumentiert sein:

- Quelle,
- Nutzungsbedingungen,
- erlaubte Speicherung oder erlaubtes Laden,
- Caching,
- Bildgrößen,
- Alt-Texte,
- Fallback,
- keine offiziellen Card Backs oder Frames ohne Freigabe,
- keine Bild-URL-Leaks für verdeckte Karten.

Bis dahin rendert V0.7 ausschließlich eigene generische Platzhalter.

## Testspur

Diese Spezifikation deckt `V07-MUST-012` und `V07-MUST-013` ab.
