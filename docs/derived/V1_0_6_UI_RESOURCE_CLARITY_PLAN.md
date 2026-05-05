# V1.0.6 Aktionen, Credits und Kartenanzeige

Status: requirements_ready_after_v1_0_5
Stand: 2026-05-05

## Ziel

V1.0.6 ist ein UI-Klarheitsrelease nach V1.0.5. Der Release macht drei grundlegende Informationsflächen der aktiven Spieloberfläche sofort verständlicher:

- verbleibende und verbrauchte Aktionen,
- Credits als klar erkennbare Wirtschaftsressource,
- Kartenanzeige und Kartenpreview-Modi in der rechten Detailspalte.

V1.0.6 erweitert keine Regeln, keine Karten, keine offiziellen Mechaniken und keine Plattformfunktionen. Die Phase nutzt vorhandene side-sichere `PlayerView`-, `LegalActions`- und lokale UI-Daten.

## Ausgangslage

V1.0.5 ist der aktuell ausgewählte Umsetzungsscope für Action Board UX und Board-Klarheit. V1.0.6 wird als direkt anschließender UX-Härtungsrelease geplant und darf erst nach dem V1.0.5-Gate umgesetzt werden oder muss bei einer Umsetzung davor ausdrücklich gegen V1.0.5-Änderungen abgeglichen werden.

Die neuen Beobachtungen betreffen nicht die Regelautorität der Engine, sondern die Lesbarkeit der vorhandenen Ressourcen und Anzeigeoptionen:

1. `Clicks` wirken in der UI wie ein technischer Restbegriff. Spieler sollen sie als `Aktionen` erkennen und als ausgeführte/verfügbare Slots sehen.
2. `Credits` sollen nicht wie ein weiterer Zahlenkasten wirken, sondern durch ein eindeutiges Münz-/Credit-Symbol als Geldressource erfassbar sein.
3. Die drei Card-Display-Modi sind im aktiven Spiel unklar, platzraubend und teilweise visuell redundant. Besonders Text- und Kompaktmodus dürfen keine große leere Fläche ohne Informationswert erzeugen.

## Konsolidierungsentscheidung

Dieses Dokument ist der kanonische Detailplan für V1.0.6. Die verbindlichen Requirements, UI-Spezifikation, Testmatrix, Requirements Review und der Browser-Smoke liegen hier:

- `docs/derived/V1_0_6_REQUIREMENTS.md`
- `docs/derived/RESOURCE_CARD_DISPLAY_1_0_6_SPEC.md`
- `docs/derived/V1_0_6_TEST_MATRIX.md`
- `docs/derived/V1_0_6_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_6_BROWSER_PLAYTEST_SMOKE.md`

Der Requirements Review meldet `V1_0_6_requirements_freeze_done: true` und `ready_for_implementation_after_V1_0_5: true`.

## Muss-Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V106-MUST-001 | Sichtbare aktive Spieloberflächen nennen die Aktionsressource `Aktionen`, nicht `Clicks` oder `Klicks`; technische Felder und Engine-Begriffe bleiben unverändert. |
| V106-MUST-002 | Eigene verbleibende und verbrauchte Aktionen werden als kleine eckige Slots dargestellt: verfügbar leer/hell, verbraucht gefüllt/gedämpft. |
| V106-MUST-003 | Die Slot-Anzeige bildet normale Runner-/Corp-Aktionsbudgets und zusätzliche Aktionen dynamisch ab, ohne Server-, Engine-, Replay- oder StateHash-Daten zu verändern. |
| V106-MUST-004 | Die gegnerische Aktionsressource darf side-sicher ebenfalls visuell angezeigt werden, wenn sie bereits in der PlayerView enthalten ist; sie darf keine versteckten Aktionspläne oder Choices andeuten. |
| V106-MUST-005 | Actionkosten in LegalActions, Cues oder Detailtexten verwenden nutzerverständliche Kostenchips für Aktionen und Credits statt roher `{ clicks, credits }`-Darstellung. |
| V106-MUST-006 | Credits werden in Spieler- und Gegnerstatus mit einer eindeutigen Münz-/Credit-Optik dargestellt, nicht nur als Zahl. |
| V106-MUST-007 | Credit-Anzeige und Aktionsslots sind visuell klar unterscheidbar: Münz-/runde Credit-Optik gegen eckige Aktionsslots. |
| V106-MUST-008 | Credit-Visualisierung nutzt keine offiziellen Netrunner-Symbole, Card Frames, Logos oder externen Assets. |
| V106-MUST-009 | Die Card-Display-Moduswahl in der rechten Detailspalte wird zu kompakten Icon-/Segment-Buttons direkt am Preview-Header oder unmittelbar darüber. |
| V106-MUST-010 | Die normale aktive Spieloberfläche zeigt keine platzraubende `Card Display`-Einstellungsbox mit doppelten Außenlinien. |
| V106-MUST-011 | Die drei Card-Display-Modi haben eindeutige Aufgaben: Bildmodus, Textmodus und Kompaktmodus unterscheiden sich sichtbar und funktional. |
| V106-MUST-012 | Textmodus nutzt den Kartenbereich dicht für Titel, Typ/Werte und Regeltext; große leere Art-Flächen ohne Informationswert sind nicht zulässig. |
| V106-MUST-013 | Kompaktmodus ist wirklich platzsparend und zeigt Regeltext über Tooltip, Fokus-Overlay oder eine ähnlich kompakte Detailinteraktion. |
| V106-MUST-014 | Kartenpreview vermeidet doppelte Informationen: Wenn Regeltext und Kerndaten bereits im Modus sichtbar sind, werden sie nicht noch einmal darunter als Zusatzblock wiederholt. |
| V106-MUST-015 | Card-Display-Tooltips und Overlays bleiben tastaturbedienbar, viewport-sicher und leaken keine verdeckten Kartendaten. |

## Nicht-Ziele

- Keine Änderung der Engine-Begriffe `clicks`, `credits`, `LegalAction`, `PlayerAction` oder der Kostenstruktur.
- Keine neuen Karten, keine neuen Mechaniken und keine neuen Ressourcenarten.
- Keine offiziellen Assets, offiziellen Credit-Symbole, Card Frames, Logos oder Card Backs.
- Kein Tutorial-System und keine breite UI-Neugestaltung außerhalb der genannten Ressourcen- und Card-Preview-Flächen.
- Keine Änderung an `GameState`, Replay, RandomDrawRecords oder StateHash für UI-Anzeigezwecke.
- Keine Erweiterung von PlayerViews um verdeckte Daten.

## Betroffene Codebereiche

- `apps/web/app/page.tsx`
  - `OpponentPanel`, `PlayerPanel`, `Stat`, `CardDisplaySettings`, `CardPreviewPanel`, `CardView` und mögliche kleine Helper-Komponenten für Aktionsslots und Credit-Badges.
- `apps/web/app/action-board-ui.ts`
  - Kosten-/Action-Gruppenlabels, falls sichtbare Kostenchips dort zentral abgeleitet werden.
- `apps/web/app/globals.css`
  - stabile Slot-, Coin-, Preview- und Mode-Button-Darstellung ohne Layoutsprünge.
- `apps/web/app/action-board-ui.test.ts`
  - Tests für Action-/Credit-UI-Helfer und Kostenlabels.
- `tests/specs/visibility-contract.test.ts`
  - Regression, dass neue UI-Helfer keine FullState-, Token-, Decklisten- oder Hidden-Info-Pfade öffnen.

## Anforderungen an die Umsetzung

Die Umsetzung soll zuerst kleine, testbare UI-Helfer einführen:

1. `ActionSlotMeter`: rendert Aktionsslots aus side-sicheren Werten.
2. `CreditBadge`: rendert Credit-Zahl plus generisches Münzsymbol.
3. `CostChips`: rendert LegalAction-Kosten als `Aktion`-/`Credits`-Chips.
4. `CardDisplayModeSelector`: kompakte Icon-Auswahl ohne große Einstellungsbox.
5. klar getrennte CardView-Varianten für Bild, Text und Kompakt.

Die UI darf eine tab-lokale Darstellungskapazität für Aktionsslots führen, um verbrauchte Slots und spätere Bonusaktionen stabil anzuzeigen. Diese lokale Kapazität wird bei Seiten-/Turnwechsel aus `PlayerView.clicks` und dem normalen Side-Basiswert neu initialisiert und darf nicht in Match-, Server-, Engine-, Replay- oder StateHash-Daten geschrieben werden.

## Risiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| `Clicks` werden technisch in Code und Engine gebraucht. | Nur sichtbare UI-Labels ändern; technische Felder bleiben `clicks`. |
| Verbrauchte Aktionsslots sind nicht direkt als eigenes Engine-Feld vorhanden. | UI führt eine lokale, aus PlayerView und Turnwechseln abgeleitete Darstellungskapazität; bei Unsicherheit zeigt sie konservativ verfügbare Slots korrekt und dokumentiert die Annahme. |
| Bonusaktionen könnten falsch gezählt werden. | Wenn verbleibende Aktionen die bekannte Kapazität übersteigen, wird die Slotzahl lokal erweitert. |
| Credit-Icons wirken wie offizielle Symbole. | Nur generische CSS-/Icon-Münze verwenden, kein offizielles Symbol oder Asset. |
| Text- und Kompaktmodus bleiben optisch redundant. | V1.0.6 definiert Modusaufgaben verbindlich und testet Textmodus/Kompaktmodus separat. |
| Tooltip enthält verdeckte Kartendaten oder läuft aus dem Viewport. | Tooltips/Overlays nutzen nur die sichtbare Karte aus PlayerView und werden per Browser-Smoke geprüft. |

## Akzeptanzkriterien

V1.0.6 ist done, wenn:

- normale aktive Spieloberflächen `Aktionen` statt `Clicks` zeigen,
- eigene Aktionen als eckige verfügbare/verbrauchte Slots erfassbar sind,
- zusätzliche Aktionen als zusätzliche Slots sichtbar werden,
- Credits durch eine eindeutige generische Münz-/Credit-Optik erkennbar sind,
- Action- und Credit-Kostenchips sich klar unterscheiden,
- die Card-Display-Auswahl kompakt am Preview sitzt und keinen eigenen großen Kasten mehr belegt,
- Bild-, Text- und Kompaktmodus klar verschiedene Zwecke erfüllen,
- Textmodus keine große leere Art-Fläche zeigt,
- Kompaktmodus wirklich Platz spart,
- Regeltext und Kerndaten nicht doppelt im Preview wiederholt werden,
- Hidden-Info-, Replay-/StateHash-, PublicEvent-, AI-Input-, stale-action- und illegal-action-Tests grün bleiben,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` und `git diff --check` bestanden sind.
