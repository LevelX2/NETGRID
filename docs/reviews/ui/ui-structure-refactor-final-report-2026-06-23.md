# UI Structure Refactor Final Report 2026-06-23

## Ergebnis

Der Webclient wurde behavior-preserving in kleinere UI-Strukturbereiche geschnitten. Es gab keine Engine-, LegalAction-, KI-, API-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.

## Reduzierte Monolithen

- `apps/web/app/page.tsx`: von 17.866 auf 16.884 Zeilen reduziert.
- `apps/web/app/globals.css`: von 13.098 auf 12.979 Zeilen reduziert; Tokens und Basisregeln liegen nun unter `apps/web/app/styles/`.
- `apps/web/app/action-board-ui.ts`: von 1.833 auf 1.772 Zeilen reduziert; Cue-Positionierung liegt nun im Actions-Feature.

## Neue Bereiche

- `apps/web/features/app-shell/AppShell.tsx`: Brand, ConnectionBadge und Active-Match-Workspace-Navigation.
- `apps/web/features/game-board/ResourceStrip.tsx`: Ressourcenstrip, Action-Slots, Stat-, Credit- und Agenda-Statusbausteine.
- `apps/web/features/game-board/PlayerClock.tsx`: Spieleruhr und Grace-Anzeige.
- `apps/web/features/actions/ActionControls.tsx`: Floating-/Dock-Controls, Priority-Hold, Action-Buttons und Cost-Chips.
- `apps/web/features/actions/cue-position.ts`: Cue-Overlay-Positionierung.
- `apps/web/features/cards/CardTextRendering.tsx`: Kartenregeltextsegmente und generierte Kartenbild-Overlays.
- `apps/web/features/recent/RecentGamesPanel.tsx`: Letzte-Spiele-Oberfläche.
- `apps/web/lib/storage-keys.ts`, `local-storage.ts`, `overlay-position.ts`: Browser-/Storage-nahe Utilities.

## Bewusst Nicht Angefasst

- `page.tsx` enthält weiterhin große State- und Controller-Flächen für Matchstart, Session/Reconnect, Catalog, Deckeditor, Chronicle, Settings und Debug. Diese Bereiche sind stärker mit Root-State gekoppelt und sollten in weiteren kleineren Paketen extrahiert werden.
- `globals.css` ist weiterhin groß. Der erste CSS-Schnitt trennt nur Tokens und Basisregeln, um die bestehende Kaskade nicht breit zu verändern.
- `LegalActionsPanel`, `CardView`, `CatalogPanel` und `DeckEditorPanel` bleiben im Root, weil ein direkter Umzug ohne vorherige Prop-/Typgrenzen zu breit gewesen wäre.

## Verifikation

- Paketweise Web-Typechecks: bestanden.
- Fokussierte Web-Tests über `action-board-ui.test.ts` und `recent-results-ui.test.ts`: bestanden; Vitest führte dabei 33 Testdateien mit 421 Tests aus.
- Web-Build nach CSS-Schnitt: bestanden.
- Finale Checks laufen in UIREF-9 vor dem lokalen Merge.

## Restpunkte

- Matchstart-/Session-Controller als eigene Hook-/Controller-Schicht schneiden.
- `LegalActionsPanel` nach vorgelagerter Choice-/Action-Typgrenze vollständig in `features/actions/` verschieben.
- `CardView` und card-nahe Popover/Badges als nächstes in `features/cards/` bündeln.
- Catalog, Deckeditor, Chronicle, Settings und Debug in weitere Feature-Surfaces extrahieren.
