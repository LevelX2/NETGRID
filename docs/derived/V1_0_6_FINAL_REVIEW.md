# V1.0.6 Final Review - Aktionen, Credits und Kartenanzeige

Stand: 2026-05-05
Status: final geprueft

## Ergebnis

V1.0.6 ist als UI-/Praesentationsrelease umgesetzt. Die aktive Spieloberflaeche spricht sichtbar von Aktionen, zeigt eigene Aktionen als Slots, visualisiert Credits generisch, rendert Kostenchips und fuehrt die Kartenanzeige kompakt im Vorschaukopf. Die Card-Display-Modi sind klar getrennt: Bildmodus nutzt Bilder/Fallback, Textmodus ist dicht ohne leere Art-Flaeche, Kompaktmodus spart Platz und gibt Regeltext per Fokus-/Hover-Tooltip frei.

Engine, Kartenpool, Mechaniken, Replay, StateHash, Randomness, LegalAction-Vertrag und offizielle Assets wurden nicht erweitert.

## V1.0.5-Basis

Die formalen V1.0.5-Finalartefakte fehlen weiterhin. V1.0.6 wurde dennoch ausgefuehrt, weil der Workspace bereits eine passende V1.0.5-UI-Basis enthaelt und die vorhandenen Tests fuer Action-Board, Cue-Position, RunTimeline, Zielhighlight und Rez-/Unrez-Darstellung gruen bleiben. Dieser Befund ersetzt kein spaeteres formales V1.0.5-Finalreview.

## Pflichtchecks

| Check | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/web test` | pass, 4 Dateien, 23 Tests |
| `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts` | pass, 1 Datei, 13 Tests |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass, Workspace-Tests inklusive Web 23, Server 34, Engine 72, AI 25, Catalog 8, Decks 8 und Root-Specs 41 |
| `corepack pnpm build` | pass |
| `git diff --check` | pass |

## Browser-/Playtest-Smoke

Ausgefuehrt im In-App-Browser auf `http://127.0.0.1:3000`, Default-Viewport 1264x720, Human-vs-KI als Runner gegen Corp KI.

| Smoke | Ergebnis |
| --- | --- |
| A Aktionen im eigenen Zug | pass, Runner zeigt `4 Aktionen verfügbar` und vier eckige Slots. |
| B Corp-Aktionsbudget | pass/covered, Corp-Off-Turn zeigt `0 Aktionen aktuell`; Corp-Basisfaelle sind automatisiert getestet. |
| C Bonusaktionen | pass/covered, automatisierter UI-Helfertest erweitert Runner auf 5 Slots und markiert Bonus. |
| D Credits | pass, Spieler und Gegner zeigen Credits mit runder generischer Coin-Optik. |
| E Kostenchips | pass, Action-Buttons zeigen Chips wie `Kosten: 1 Aktion`; keine rohen Kostenobjekte sichtbar. |
| F Kartenanzeige-Steuerung | pass, Modusbuttons sitzen direkt im Vorschaukopf unter `Kartenanzeige`; keine grosse separate `Card Display`-Box in der aktiven rechten Spalte. |
| G Bildmodus | pass, bekannte Karte wird im Bildmodus angezeigt; verdeckte Karte bleibt generischer Platzhalter. |
| H Textmodus | pass, Textmodus zeigt Titel, Meta und Regeltext ohne grosse leere Art-Flaeche und ohne doppelten Detailblock darunter. |
| I Kompaktmodus | pass, Preview ist deutlich kleiner; Chronicle gewinnt Platz; Regeltext ist per Fokus-/Hover-Tooltip erreichbar. |
| J Tooltip, Fokus und schmaler Viewport | partial, Fokus-Tooltip wurde sichtbar und side-sicher bestaetigt; der In-App-Browser stellte keine Viewport-Resize-API bereit, daher wurde der schmale Viewport nicht visuell ausgefuehrt. |
| K Hidden-Info-Stichprobe | pass, verdeckte Remote-Karte zeigte keinen Titel, keine Definition-ID, keine Bild-URL, keine Card-Back-Route und keinen spezifischen Tooltip. |

## Hidden-Info- und Payload-Grenze

Die neuen UI-Elemente nutzen `PlayerView`, `LegalActions`, side-gefilterte Events, side-sichere Match-Payloads und lokale UI-Einstellungen. Verdeckte Karten erzeugen keine echten Card-Back-Bilder mehr; `/api/card-images/back_runner` und `/api/card-images/back_corp` sind nicht mehr als bekannte Routen hinterlegt.

## Offene Restpunkte

- Schmaler Viewport bleibt als manuelle Browser-Smoke-Stichprobe offen, weil das verfuegbare In-App-Browser-Backend kein Resize exposed hat.
- Die fehlenden formalen V1.0.5-Finalartefakte sollten separat nachgezogen werden, falls V1.0.5 als eigenstaendiges Gate historisch abgeschlossen werden soll.
- Die vorhandenen V1.0.5K-Kartenrelease-Aenderungen im Workspace sind nicht Teil dieses V1.0.6-Reviews.

## Gate

`V1_0_6_implemented: true`

`V1_0_6_verified: true`

`V1_0_6_done: true`
