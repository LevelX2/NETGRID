# V1.0.6 Requirements Freeze

Stand: 2026-05-05
Status: frozen_for_implementation_after_v1_0_5

## Zweck

Dieses Dokument friert die V1.0.6-Anforderungen für Aktionen, Credits und Kartenanzeige ein. V1.0.6 ist ein UI-/Präsentationsrelease nach V1.0.5. Die Phase verbessert die Lesbarkeit vorhandener Ressourcen und Card-Display-Modi, ohne Engine-Regeln, Karten, Mechaniken, Replay oder StateHash zu erweitern.

## Verbindliche Quellen

- `docs/derived/V1_0_6_UI_RESOURCE_CLARITY_PLAN.md`
- `docs/derived/RESOURCE_CARD_DISPLAY_1_0_6_SPEC.md`
- `docs/derived/V1_0_6_TEST_MATRIX.md`
- `docs/derived/V1_0_6_BROWSER_PLAYTEST_SMOKE.md`
- `docs/derived/V1_0_5_REQUIREMENTS.md`
- `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`
- `docs/derived/BOARD_RUN_UI_1_0_5_SPEC.md`
- `apps/web/app/page.tsx`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/globals.css`

Die Nutzerbeobachtungen vom 2026-05-05 sind als Produktinput in diesen Freeze eingearbeitet:

- Klicks sollen als Aktionen verstanden und visuell als Slots dargestellt werden.
- Credits brauchen eine klar erkennbare Münz-/Credit-Optik.
- Die drei Card-Display-Modi und ihre Steuerung müssen geprüft, verkleinert und klarer unterschieden werden.

## Scope

V1.0.6 umfasst:

- sichtbare Umbenennung der Aktionsressource von `Clicks`/`Klicks` zu `Aktionen`,
- Aktionsslots als eckige verfügbare/verbrauchte Anzeigen,
- dynamische Erweiterung der Slot-Anzeige bei Bonusaktionen,
- generische Credit-/Münzoptik für Credit-Zahlen,
- sichtbare Kostenchips für Aktionen und Credits,
- kompakte Card-Display-Modusauswahl an der Card Preview,
- klare Neuordnung von Bild-, Text- und Kompaktmodus,
- Entfernung großer leerer Card-Preview-Flächen im Text- und Kompaktmodus,
- Vermeidung doppelter Kartendetails unterhalb der Preview,
- Browser-/Visual-Smoke für aktive Spieloberfläche, rechten Detailbereich und schmalen Viewport.

## Nicht-Ziele

- Keine Änderung der technischen Engine-Felder `clicks` und `credits`.
- Keine Änderung der LegalAction-/PlayerAction-Verträge.
- Keine neuen Karten oder Mechaniken.
- Keine offizielle deutsche Regelterminologie über die lokale UI hinaus.
- Keine offiziellen Assets, Symbole, Kartenrückseiten, Card Frames oder Logos.
- Keine Persistenz von UI-Displaykapazitäten in Server, Engine, Replay oder StateHash.
- Kein neues Tutorial oder vollständiger Rebuild der rechten Spalte.

## UI-Terminologie

| Technischer Begriff | Sichtbares V1.0.6-Label | Regel |
| --- | --- | --- |
| `clicks` | Aktionen | Normale aktive UI. Technische IDs bleiben unverändert. |
| `credits` | Credits | Darf als Netrunner-Begriff stehen, bekommt aber eine generische Münz-/Credit-Optik. |
| `Card Display` | Kartenanzeige | Sichtbare UI deutsch. |
| `Preview` | Vorschau | Rechte Detailspalte. |
| `placeholder` | Bild | Bildmodus oder bildbereiter Modus. |
| `text-card` | Text | Dichte Textkarte ohne große leere Art-Fläche. |
| `compact` | Kompakt | Kleine Karte mit Regeltext im Tooltip/Fokus-Overlay. |

`Clicks` und `Klicks` sind als normale Endnutzerlabels im aktiven Spiel nicht erlaubt. Debug-/Diagnosebereiche dürfen technische Feldnamen nennen, wenn sie klar als Diagnose erkennbar sind.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
| --- | --- | --- | --- |
| V106-MUST-001 | Die Aktionsressource heißt sichtbar `Aktionen`. | Spieler- und Gegnerstatus sowie Kosten-/Action-nahe UI zeigen nicht mehr `Clicks` oder `Klicks` als normale Labels. | V106-T001, V106-T002 |
| V106-MUST-002 | Eigene Aktionen werden als Slots dargestellt. | Die UI zeigt kleine eckige Slots, bei denen verfügbare Aktionen leer/hell und verbrauchte Aktionen gefüllt/gedämpft erscheinen. | V106-T003, V106-T017 |
| V106-MUST-003 | Normale Aktionsbudgets sind korrekt. | Runner-Turn startet visuell mit vier verfügbaren Aktionen, Corp-Turn mit drei, sofern die PlayerView diese Werte liefert; Off-Turn-Zustände bleiben verständlich. | V106-T003, V106-T004 |
| V106-MUST-004 | Bonusaktionen erweitern die Anzeige. | Wenn die verbleibenden Aktionen im aktuellen Turn die bekannte Slotkapazität überschreiten, werden zusätzliche Slots angezeigt statt Werte abzuschneiden. | V106-T005 |
| V106-MUST-005 | Die Aktionsslot-Kapazität bleibt lokale Präsentation. | Lokale Slotkapazität wird nicht in Server-, Match-, Engine-, Replay-, StateHash-, PublicEvent- oder WebSocket-Daten geschrieben. | V106-T006, V106-T020 |
| V106-MUST-006 | Gegneraktionen dürfen nur side-sicher angezeigt werden. | Gegnerstatus nutzt ausschließlich vorhandene PlayerView-Werte und zeigt keine geplanten gegnerischen Actions, Choices oder verdeckten Kosten. | V106-T007, V106-T020 |
| V106-MUST-007 | Actionkosten sind verständlich. | Kostenchips zeigen `1 Aktion`, `2 Aktionen`, `3 Aktionen` und Credits in nutzerverständlicher Form; rohe Kostenobjekte erscheinen nicht im normalen UI-Text. | V106-T008 |
| V106-MUST-008 | Credits bekommen eine eindeutige Credit-Optik. | Spieler- und Gegnerstatus zeigen Credit-Zahl plus generisches Münz-/Credit-Symbol; Credits wirken nicht wie ein weiterer eckiger Slotzähler. | V106-T009, V106-T017 |
| V106-MUST-009 | Credit- und Aktionsdarstellung sind visuell unterscheidbar. | Aktionen nutzen eckige Slots; Credits nutzen runde/generische Münzoptik oder klar davon abgesetzte Form/Farbe. | V106-T010, V106-T017 |
| V106-MUST-010 | Die Card-Display-Auswahl ist kompakt. | Im aktiven Spiel sitzt die Moduswahl als kleine Icon-/Segmentsteuerung an oder direkt über der Vorschau; die große gerahmte `Card Display`-Box entfällt dort. | V106-T011, V106-T018 |
| V106-MUST-011 | Die Card-Display-Modi sind klar definiert. | Bild, Text und Kompakt haben jeweils einen erkennbaren Zweck und unterscheiden sich visuell. | V106-T012 |
| V106-MUST-012 | Textmodus ist informationsdicht. | Textmodus zeigt Titel, Typ/Subtypen, relevante Werte und Regeltext ohne große leere Art-Fläche. | V106-T013, V106-T018 |
| V106-MUST-013 | Kompaktmodus spart Platz. | Kompaktmodus reduziert Höhe/Fläche deutlich und macht Regeltext per Tooltip, Fokus-Overlay oder gleichwertiger Interaktion erreichbar. | V106-T014, V106-T018 |
| V106-MUST-014 | Preview dupliziert Kartendaten nicht unnötig. | Wenn der aktive Modus Regeltext und Kerndaten bereits sichtbar macht, werden diese nicht zusätzlich in einem zweiten Block unter der Karte wiederholt. | V106-T015 |
| V106-MUST-015 | Tooltips/Overlays sind sicher und bedienbar. | Regeltext-Tooltips funktionieren per Hover und Fokus oder gleichwertig, bleiben im Viewport und verwenden nur bekannte/sichtbare Kartendaten. | V106-T016, V106-T020 |
| V106-MUST-016 | Bestehende V1.0.5-Verträge bleiben grün. | Kontextaktionen, Cue-Position, Run-Zielhighlight, BoardHeader-Entscheidung, RunTimeline und Rez-/Unrez-Darstellung aus V1.0.5 regressieren nicht. | V106-T019, V106-T021 |

## Daten- und Autoritätsgrenzen

- Die UI rendert weiterhin nur `PlayerView`, `LegalActions`, side-gefilterte Events, side-sichere Match-Payloads und lokale UI-Einstellungen.
- Aktionsslots werden aus `view.own.clicks`, `view.opponent.clicks`, `view.activeSide`, Side-Basiswerten und lokaler Turnbeobachtung abgeleitet.
- Die lokale Slotkapazität darf in React-State oder local UI state liegen, aber nicht persistiert oder an Server/Engine gesendet werden.
- Falls die Implementierung ausnahmsweise ein neues side-sicheres Displayfeld braucht, muss vor Code-Änderung ein Requirements-Amendment erfolgen.
- Credit-Icons sind generische UI-Grafik oder CSS; keine offiziellen Netrunner-Symbole.
- Card-Display-Modi dürfen keine verdeckten Titel, Definition-IDs, Bild-URLs oder kartenspezifischen CSS-Klassen für verdeckte Karten erzeugen.

## Betroffene Codebereiche

- `apps/web/app/page.tsx`
  - `OpponentPanel`, `PlayerPanel`, `Stat`, `CardDisplaySettings`, `CardPreviewPanel`, `CardView`.
- `apps/web/app/action-board-ui.ts`
  - Kosten- und Gruppenlabels, falls Kostenchips zentral abgeleitet werden.
- `apps/web/app/action-board-ui.test.ts`
  - Unit-Tests für Aktionen/Credits/Kosten.
- `apps/web/app/globals.css`
  - Slots, CreditBadge, CardDisplay-Buttons, Text-/Kompaktkarten, Tooltip-/Overlay-Fit.
- `tests/specs/visibility-contract.test.ts`
  - Regression gegen Hidden-Info-, FullState-, Token- und Asset-Leaks.

## Pflichtchecks

- `corepack pnpm --filter @netrunner/web test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`
- V1.0.6 Browser-/Playtest-Smoke nach `docs/derived/V1_0_6_BROWSER_PLAYTEST_SMOKE.md`

## Gate

`V1_0_6_requirements_freeze_done: true`

`ready_for_implementation_after_V1_0_5: true`
