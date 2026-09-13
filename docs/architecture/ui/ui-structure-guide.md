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

## Run-Stufen und Aktionssymbole

Im Run-Fenster beginnen die Phasennamen links auf derselben Textachse;
die Phasensymbole stehen rechts. Aktionsbuttons reservieren feste Spalten
für Aktions- und Serversymbol, auch wenn das Serversymbol fehlt. Ihre
Beschriftungen sind linksbündig, Kosten bleiben rechts. Überschrift und
Auto-pass bleiben zentriert.
Die aktuelle Stufe hebt ihren Namen mit fetter Schrift und ihre Symbole
mit höherer Deckkraft und Strichstärke hervor. Die zusätzliche Umrandung
kennzeichnet weiterhin die aktuell verfügbaren Aktionen.

Match-Updates übernehmen `PlayerView` und dessen `legalActions` atomar.
Die zusätzliche WebSocket-Nachricht `legal_actions` darf die Aktionsliste
nur bei derselben expliziten `stateVersion` aktualisieren. Dadurch kombiniert
die Oberfläche keine neuen Klickzahlen mit Aktionen eines früheren Zustands;
ein autoritativer Undo-PlayerView darf weiterhin eine frühere Version liefern.
Aktionsfehlermeldungen bleiben bis zur nächsten erfolgreichen
`action_receipt` derselben Match-/Spielerseite sichtbar. Neuere allgemeine
Hinweise sowie Verbindungs- und KI-Fehler werden dadurch nicht gelöscht.

Rez-Schaltflächen lösen den Kartennamen über die `cardId` der LegalAction
und die bekannte Karte im PlayerView beziehungsweise Kartenmenü auf.
Damit nennen Run-Fenster, Aktionspanel und Kartenmenüs das Rez-Ziel in
Deutsch, Englisch und Französisch auch ohne Titel in den Aktionsmetadaten.

Bei einem Runner-Sieg durch Agendapunkte erhält die letzte öffentliche
`steal_agenda`-Nachricht Vorrang vor älteren Access-Präsentationen und dem
Ergebnisfenster. Ihre eigene Event-ID bindet die lokale Bestätigung; eine
vorher bestätigte Zugriffsvorschau bestätigt den Diebstahl nicht mit.
Kartenidentität und Herkunft stammen aus dem öffentlichen Stehl-Ereignis,
auch wenn der vorherige R&D-Zugriff für die Korp redigiert war. Das
Ergebnisfenster erscheint erst nach dieser Bestätigung. Die Spielformat-ID
`rules_match` heißt dort Standardspiel / Standard game / Partie standard.

Der eigene Runner-Grip verwendet seine kompakte Handbreite als Grundlage
für den Flex-Umbruch mit Stack, Rig und Heap. Erst danach nimmt der geöffnete
Grip mit mehreren Karten den freien Platz seiner Zeile auf.
Die Grip-Breite ist auf vollständig sichtbare Karten samt normalen Abständen,
Zonenbeschriftung und Rahmen begrenzt. `SideZoneFrame` misst dafür nur die
Breite außerhalb seines Inhalts; der Kartenabstand selbst bleibt CSS-gesteuert.
`HandCardsRow` reduziert dort die Überlagerung per CSS direkt aus der
verfügbaren Breite bis zum normalen Kartenabstand, ohne eine nachgelagerte
ResizeObserver-Messung. Die explizite kompakte Wunschbreite bleibt unabhängig
vom berechneten Kartenabstand, damit
Resize, Kartenzahl und Skalierung keinen rückgekoppelten Umbruch erzeugen.

`RunTimelineOverlay` zeigt in jeder Stufe dauerhaft blasse Orientierungssymbole.
Sie erklären typische Möglichkeiten und sind keine Legalitätsanzeige. Nur
Symbole für aktuell angebotene `LegalActions` in der aktiven Stufe werden
kräftig mit einem Leuchtrand dargestellt. Besondere angebotene Aktionen
ergänzen die Orientierungssymbole dynamisch. Tooltips unterscheiden beide
Zustände. ICE-Rezzen (Schild) und das Rezzen anderer Karten (Power-Symbol)
bleiben getrennt; insbesondere kündigt das Power-Symbol in „Bewegung“ kein
ICE-Rezfenster an. Die eigentlichen Aktionen bleiben in den Aktionsbuttons.

Im ICE-Stapel verändert der Marker für die aktuelle Run-Position nicht die
Stapelhöhe. Nur Hover, sichtbarer Tastaturfokus und ein geöffnetes Aktionsmenü
heben eine Karte an; ein vorheriger Mausklick darf mittlere ICE nicht dauerhaft
verdecken. Die lokalisierte Chronik übernimmt den öffentlichen
Inside-Job-Bypass samt ICE-Identität auch aus dem zugehörigen Rez-Pass-Event.
Fortsetzungsereignisse tragen mit `runDestination` und bei ICE zusätzlich
`runDestinationIcePosition` das öffentliche Ziel aus dem Engine-Folgezustand.
Die Chronik zeigt damit „zu ICE n“ oder „zum Root“, ohne die Position aus dem
aktuellen Spielbrett oder der zuvor passierten ICE-Nummer zu erraten.

Bei Kartenfähigkeiten beschreibt die lokalisierte Chronik das Auflegen und
Entnehmen gespeicherter Credits aus `hostedCreditsAdded` beziehungsweise
`hostedCreditsTaken`. Nur wenn `hostedCreditsAfter` ausdrücklich null Credits
ausweist, nennt sie die Entnahme „alle Credits“ samt Menge. Der aktuelle
Kartenstand ist dafür keine Quelle.

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
