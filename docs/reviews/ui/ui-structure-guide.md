# UI Structure Guide

## Wichtige Orte

- `apps/web/app/page.tsx`: App-Orchestrierung, Match-/Session-State und die noch nicht ausgelagerten großen Screens.
- `apps/web/features/app-shell/`: Branding, Verbindungsbadge und aktive Workspace-Navigation.
- `apps/web/features/game-board/`: reine Spielbrett-Anzeigen wie Ressourcenstrip, Spieleruhr und board-nahe Statuskomponenten.
- `apps/web/features/actions/`: Action-Control-Bausteine, Action-Overlay-Positionierung und UI-Helfer für vorhandene `LegalActions`.
- `apps/web/features/cards/`: Karten-Textdarstellung, generierte Kartenbild-Overlays und Card-Rendering-Helfer.
- `apps/web/features/recent/`: Letzte-Spiele-Anzeige.
- `apps/web/lib/`: Browser-nahe Utilities wie Storage-Keys, Legacy-LocalStorage und Overlay-Positionierung.
- `apps/web/app/styles/`: globale CSS-Tokens und Basisregeln; `globals.css` bleibt Einstieg und enthält noch die übrigen Feature-Regeln.

## Änderungsleitplanken

- Action UI zeigt und sendet nur `LegalActions`, die aus der Engine kommen.
- UI-Komponenten dürfen keine Legalität erzeugen oder Actions fachlich umdeuten.
- Hidden-Info bleibt an PlayerView-, PublicEvent-, Reconnect-, Debug- und Tooltip-Grenzen side-safe.
- Normale Player-UI darf keinen FullState bekommen.
- `page.tsx` soll nicht wieder neue Sammelbereiche für Card-, Action-, Recent-, Storage- oder Overlay-Helfer aufnehmen.

## Wo Ändern?

- Spielbrett-/Ressourcenanzeige: `features/game-board/`.
- Action-Buttons, Kostenchips, Floating-/Dock-Controls: `features/actions/`.
- Kartenbild-Overlays und Regelntext-Segmente: `features/cards/`.
- Letzte Spiele: `features/recent/`.
- Storage-Key oder LocalStorage-Legacy-Pfad: `lib/storage-keys.ts` oder `lib/local-storage.ts`.
- Globale Farben, Z-Index und Theme-Tokens: `app/styles/tokens.css`.

## Bewusst Noch Groß

- `apps/web/app/page.tsx` enthält weiterhin Matchstart, Session/Reconnect, aktive Board-Komposition, Catalog, Deckeditor, Chronicle, Settings und Debug-Flächen. Diese Bereiche sind stark mit bestehendem State verbunden und sollten nur in weiteren behavior-preserving Paketen herausgelöst werden.
- `apps/web/app/globals.css` enthält weiterhin die meisten Feature-Regeln. Der erste Schnitt trennt nur Tokens und Basisregeln, damit die Kaskade stabil bleibt.
- `apps/web/app/action-board-ui.ts` bleibt eine große Utility-Fassade. Cue-Positionierung ist ausgelagert; weitere Splits sollten nach klaren Verantwortlichkeiten erfolgen, nicht nach Dateigröße allein.
