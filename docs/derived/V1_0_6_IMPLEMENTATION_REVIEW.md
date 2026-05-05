# V1.0.6 Implementation Review - Aktionen, Credits und Kartenanzeige

Stand: 2026-05-05
Status: umgesetzt

## Vorpruefung V1.0.5

V1.0.5 ist im Statusbestand nicht als formales Final-Gate dokumentiert: Es liegen keine `V1_0_5_IMPLEMENTATION_REVIEW.md`- oder `V1_0_5_FINAL_REVIEW.md`-Artefakte vor, und `docs/codex/CODEX_STATUS.md` beschrieb V1.0.5 vor diesem Schritt noch als requirements-ready.

Die Workspace-Basis enthaelt aber die fuer V1.0.6 benoetigten UI-Spuren aus V1.0.5: kontextuelle Karten-/Objektaktionen, lokale Cue-Position, Run-Zielhighlight, RunTimeline, entfernte/reduzierte BoardHeader-Dopplung und side-sichere Rezzed-/Unrezzed-Darstellung. V1.0.6 wurde deshalb als reines UI-/Praesentationsrelease auf dieser vorhandenen Basis umgesetzt. Die offenen beziehungsweise parallel vorhandenen V1.0.5K-Kartenrelease-Aenderungen im Workspace gehoeren nicht zum V1.0.6-Scope.

## Umgesetzte Punkte

- Sichtbare aktive Spieloberflaeche nutzt `Aktionen` statt `Clicks` oder `Klicks`.
- Spieler- und Gegnerstatus zeigen Aktionen als eckige Slots: verfuegbar hell/leer, verbraucht gedaempft/gefuellt.
- Bonusaktionen erweitern die lokale Slotkapazitaet dynamisch und markieren Zusatzslots.
- Credits werden als Zahl mit generischer runder Credit-/Muenzoptik angezeigt.
- LegalAction-Kosten werden als Kostenchips gerendert, z. B. `1 Aktion` oder `2 Credits`.
- Card-Display-Steuerung sitzt kompakt direkt im Vorschaukopf.
- Bild-, Text- und Kompaktmodus haben getrennte Layoutklassen und eindeutige ARIA-Labels.
- Textmodus entfernt die grosse Art-Flaeche und zeigt Kartentext direkt in der Kartenflaeche.
- Kompaktmodus reduziert die Preview sichtbar und stellt Regeltext per Fokus-/Hover-Tooltip bereit.
- Doppelte Kartendetails unter der Preview wurden entfernt.
- Hidden Cards nutzen weiterhin nur side-sichere Platzhalter ohne Titel, Definition-ID, Bild-URL oder spezifische Tooltip-Daten.
- Die generierten Card-Back-Bildrouten `back_runner` und `back_corp` wurden aus der Anzeige-Route entfernt.

## Technische Grenze

Die technischen Felder `clicks` und `credits` bleiben unveraendert. Neue Slotkapazitaeten sind lokaler React/UI-State und werden nicht in Server-, WebSocket-, Reconnect-, Replay- oder StateHash-Daten geschrieben. V1.0.6 fuegt keine Engine-Regeln, Karten, Mechaniken, offiziellen Assets oder externen Datenbankabhaengigkeiten hinzu.

## Testabdeckung

- `apps/web/app/action-board-ui.test.ts` deckt Runner-/Corp-Slots, verbrauchte Slots, Off-Turn-Darstellung, Bonusaktionen und Kostenchips ab.
- `tests/specs/visibility-contract.test.ts` deckt V1.0.6-UI-Vertraege, lokale Slot-State-Grenzen, Terminologie, kompakte Kartenanzeige, fehlende Card-Back-Pfade und Hidden-Info-Regressionsschutz ab.
- Der bestehende Web-Testlauf deckt Chronicle, Action-Cues, Action-Board-Helfer und Visibility-Mapping gemeinsam ab.

## V1.0.6 Testmatrix-Abgleich

| Matrix | Ergebnis |
| --- | --- |
| V106-T001 bis V106-T005 | pass, Web-Helfer und aktive UI nutzen Aktionen-Slots inklusive Bonusfall. |
| V106-T006 bis V106-T007 | pass, Slotkapazitaet bleibt lokal; Gegneranzeige nutzt nur side-sichere Viewdaten. |
| V106-T008 bis V106-T010 | pass, Kostenchips und Credit-Badges sind vorhanden und visuell getrennt. |
| V106-T011 bis V106-T015 | pass, kompakte Vorschau-Steuerung, Moduslayouts, dichter Textmodus, kompakter Tooltip-Modus und keine Preview-Dopplung. |
| V106-T016 | pass fuer Fokus-/Tooltip-Mechanik und bekannte Kartendaten; schmaler Viewport siehe Final Review. |
| V106-T017 bis V106-T020 | pass/partial, Browser-Smoke bestaetigt Default-Viewport und Hidden-Info-Stichprobe; schmaler Viewport konnte im Browser-Backend nicht resized werden. |
| V106-T021 | pass fuer Pflichtchecks; Browser-Smoke-Einschraenkung dokumentiert. |

## Geaenderte V1.0.6-Dateien

- `apps/web/app/action-board-ui.ts`
- `apps/web/app/action-board-ui.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/api/card-images/[cardId]/route.ts`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/V1_0_6_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_6_FINAL_REVIEW.md`

## Ergebnis

`V1_0_6_implemented: true`
