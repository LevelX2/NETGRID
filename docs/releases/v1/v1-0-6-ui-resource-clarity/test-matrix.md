# V1.0.6 Test Matrix - Aktionen, Credits und Kartenanzeige

Stand: 2026-05-05
Status: Requirements-Freeze-Testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V106-T001 | Unit/Web Terminologie | V106-MUST-001 | Spieler- und Gegnerstatus nutzen `Aktionen` statt `Clicks`/`Klicks` als normale sichtbare Labels. |
| V106-T002 | Contract UI Rohlabels | V106-MUST-001 | Aktive Spieloberfläche enthält keine normalen Endnutzerlabels `Clicks`, `Klicks`, `Card Display` oder `Preview`; erlaubte Debug-Kontexte sind klar getrennt. |
| V106-T003 | Unit/Web Action Slots | V106-MUST-002, V106-MUST-003 | Runner mit 4 Aktionen zeigt vier leere Slots; nach einer Aktion ein verbrauchter und drei verfügbare Slots. Corp mit 3 Aktionen zeigt analog drei Slots. |
| V106-T004 | Unit/Web Off-Turn Slots | V106-MUST-003, V106-MUST-006 | Nicht aktive Seite wird kompakt/gedämpft angezeigt und suggeriert keine künftigen geplanten Aktionen. |
| V106-T005 | Unit/Web Bonus Actions | V106-MUST-004 | Wenn `currentClicks` die bekannte Kapazität übersteigt, erweitert die UI die Slotanzahl und zeigt zusätzliche verfügbare Slots. |
| V106-T006 | Static/Web Local State Boundary | V106-MUST-005 | Action-Slot-Kapazität bleibt React-/UI-lokal und wird nicht in Server-, WebSocket-, Replay- oder StateHash-Daten geschrieben. |
| V106-T007 | Visibility Opponent Actions | V106-MUST-006 | Gegnerische Aktionsanzeige nutzt nur `view.opponent.clicks` und leakt keine Handkarten, Choices, Kostenpläne oder verdeckte Daten. |
| V106-T008 | Unit/Web Cost Chips | V106-MUST-007 | LegalAction-Kosten werden als `Aktion(en)`- und `Credits`-Chips gerendert; rohe `{ clicks, credits }`-Objekte erscheinen nicht im normalen UI. |
| V106-T009 | Unit/Web Credit Badge | V106-MUST-008 | Spieler- und Gegnerstatus zeigen Credit-Zahl plus generisches Coin-/Credit-Symbol. |
| V106-T010 | Visual Resource Distinction | V106-MUST-009 | Aktionen nutzen eckige Slots, Credits eine runde/generische Münzform; beide Ressourcen sind auf einen Blick unterscheidbar. |
| V106-T011 | Unit/Web Compact Display Selector | V106-MUST-010 | Card-Display-Modusbuttons sind kompakt an der Vorschau platziert; die aktive rechte Spalte enthält keine große `Card Display`-Box. |
| V106-T012 | Unit/Web Mode Definitions | V106-MUST-011 | Bild-, Text- und Kompaktmodus erzeugen unterschiedliche Klassen/Layouts und haben eindeutige ARIA-Labels. |
| V106-T013 | Unit/Web Text Mode Density | V106-MUST-012 | Textmodus rendert Titel, Typ/Werte und Regeltext ohne große leere Art-Fläche. |
| V106-T014 | Unit/Web Compact Mode | V106-MUST-013 | Kompaktmodus reduziert die Preview-Fläche und stellt Regeltext per Tooltip/Fokus-Overlay oder gleichwertiger Interaktion bereit. |
| V106-T015 | Unit/Web Preview Deduplication | V106-MUST-014 | Bei sichtbarem Regeltext auf der Karte wird kein zweiter identischer Regeltextblock unter der Preview gerendert. |
| V106-T016 | Unit/Web Tooltip Accessibility | V106-MUST-015 | Tooltips/Overlays sind per Fokus erreichbar, bleiben viewport-sicher und verwenden nur bekannte Kartendaten. |
| V106-T017 | Browser/Visual Resource Scan | V106-MUST-002, V106-MUST-008, V106-MUST-009 | In einem aktiven Spiel sind Aktionen, Credits, Agenda und Tags visuell unterscheidbar; Texte laufen nicht aus. |
| V106-T018 | Browser/Visual Card Display Modes | V106-MUST-010, V106-MUST-012, V106-MUST-013 | Rechte Detailspalte spart Platz; Text- und Kompaktmodus erzeugen keine großen leeren Preview-Flächen. |
| V106-T019 | Regression V1.0.5 UI | V106-MUST-016 | Kontextaktionen, Cue-Position, Run-Zielhighlight, BoardHeader, RunTimeline und Rez-/Unrez-Darstellung bleiben bedienbar. |
| V106-T020 | Visibility Payload Scan | V106-MUST-005, V106-MUST-006, V106-MUST-015 | Neue UI-Elemente öffnen keine FullState-, Token-, Decklisten-, verdeckte Karten- oder private Payload-Pfade. |
| V106-T021 | Scope/Build Gate | V106-MUST-016 | `lint`, `typecheck`, `test`, `build`, `git diff --check` und V1.0.6 Browser-Smoke bestehen; keine neuen Karten, Mechaniken oder offiziellen Assets. |

## Pflichtchecks für Implementierung

- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`
- V1.0.6 Browser-/Playtest-Smoke aus `docs/releases/v1/v1-0-6-ui-resource-clarity/browser-playtest-smoke.md`

## Empfohlene automatisierte Ergänzungen

Die Umsetzung sollte mindestens ergänzen:

- Web-Unit-Test für `ActionSlotMeter` mit Runner-, Corp-, Off-Turn- und Bonusaktionsfällen.
- Web-Unit-Test für `CreditBadge` und die Unterscheidung von Credit- und Aktionsdarstellung.
- Web-Unit-Test für Kostenchips aus LegalAction-Kosten.
- Web-/Contract-Test gegen gesperrte sichtbare Labels `Clicks`, `Klicks`, `Card Display`, `Preview`.
- Web-Unit-Test für kompakte Card-Display-Steuerung in der Card Preview.
- Web-Unit-Test für Textmodus ohne große Art-Fläche.
- Web-Unit-Test für Kompaktmodus mit zugänglichem Regeltext.
- Visibility-Test gegen verdeckte Daten in Tooltips, CSS-Klassen und Bildpfaden.

## Browser-/Visual-Gate

Falls noch kein automatisches Browser-E2E-Framework eingeführt wird, ist für V1.0.6 ein dokumentierter manueller Smoke ausreichend. Er muss mindestens abdecken:

- Runner- und Corp-Aktionsslots,
- verbrauchte und verfügbare Aktionen,
- Bonusaktions-Darstellung über Testfixture oder gezielten UI-Unit-Fall,
- Credit-Badges,
- Kostenchips,
- Card-Display-Steuerung,
- Bild-/Text-/Kompaktmodus,
- Tooltip/Fokus-Overlay,
- schmalen Viewport,
- Hidden-Info-Stichprobe.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/releases/v1/v1-0-6-ui-resource-clarity/requirements.md` haben mindestens eine Testspur in dieser Matrix.
