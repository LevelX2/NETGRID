# UI Structure Inventory 2026-06-23

## Ausgangslage

- `apps/web/app/page.tsx`: 17.866 Zeilen, circa 816 KB.
- `apps/web/app/globals.css`: 13.098 Zeilen, circa 285 KB.
- `apps/web/app/action-board-ui.ts`: circa 82 KB, bereits extrahiert, aber gemischt aus Action-, Board-, Run-, Counter- und Choice-Hilfslogik.

## Verantwortlichkeiten in `page.tsx`

`page.tsx` enthält aktuell mehrere Schichten gleichzeitig:

- App-Entry und Top-Level-State ab `Page`.
- Matchstart, Join, Lobby, Resume und Recent Games.
- Session-Recovery, WebSocket-Verbindung, Payload-Anwendung und lokale Persistenz.
- Katalog, Deckeditor, Deckstrategie-Anzeige und Validierung.
- Aktives Spiel mit Workspace-Navigation, Spielbrett, Server-Lanes, Runner-Rig, Zonen und Ressourcen.
- LegalActions-Panel, Choice-Panels, Undo und Action-Overlays.
- Card-Rendering, Badges, Tooltips, Popover und Kartenvorschau.
- Chronicle, Diagnostics, AI Decision Debug und Maintenance-nahe Debug-Surfaces.
- Einstellungen für Audio, Cues, Tooltip, Kartengröße, Anzeige, KI-Pacing und Gameplay.
- Lokale Storage-Keys, Normalizer, Overlay-Positionen und Browser-Utilities.

## Erste Ziel-Schnitte

1. Basis-Utilities: Storage-Keys, Legacy-LocalStorage und Overlay-Positionen aus `page.tsx` lösen.
2. Feature-Einstieg: aktive Spieloberfläche aus dem Root-Entry in einen `ActiveGameScreen`-Bereich verschieben.
3. Game Board: Panels, Ressourcen, Zonen, Server-Lanes und Board-nahe Kartenanzeige in `features/game-board/` bündeln.
4. Actions: LegalActions-Panel und Choice-Panels in `features/actions/` bündeln.
5. Cards: CardView, Popover, Badges und Counter-Anzeige in `features/cards/` bündeln.
6. Secondary Surfaces: Catalog, Decks, Chronicle, Settings und Debug in eigene Feature-Bereiche verschieben.
7. CSS: `globals.css` über thematische Imports in `app/styles/` aufteilen.

## Leitplanken für alle Pakete

- UI zeigt und sendet nur vorhandene Engine-`LegalActions`.
- Hidden-Info bleibt an PlayerView-, PublicEvent-, Reconnect- und Debug-Grenzen side-safe.
- Strukturarbeit darf keine Engine-, Replay-, StateHash-, KI- oder API-Verträge ändern.
- Wenn ein Schnitt fachlich riskant wird, wird nur reine Darstellung oder reine Utility-Logik extrahiert.
