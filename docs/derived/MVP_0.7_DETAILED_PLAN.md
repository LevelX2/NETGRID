# MVP 0.7 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.7 UI redesign and visual design requirements`

## 1. Kurzentscheidung

MVP 0.7 ist die bewusste UI-Neugestaltungs- und Designphase.

Die Phase orientiert sich primär am Designset `docs/ui-designsets/03-design-c-clean-high-contrast/`. Das Design C wird als Hauptstruktur übernommen, weil es lesbar, side-sicher, hell, gut scanbar und mit der bestehenden Next.js/React-Oberfläche realistisch umsetzbar ist.

Kernformel:

> Design C wird zur sauberen Hauptoberfläche; echte Kartenabbilder werden architektonisch vorbereitet, aber erst nach separater Quellen-, Nutzungs- und Asset-Freigabe aktiv genutzt.

## 2. Ziel

V0.7 soll aus den funktionalen V0.5-/V0.6-Oberflächen eine kohärente private Spieloberfläche machen.

Danach soll die Anwendung:

- einen klaren Start- und Matchfluss haben,
- Runner- und Corp-Perspektiven sauber trennen,
- den Boardzustand deutlich lesbarer darstellen,
- `LegalActions`, Choices, Undo, Reconnect, EventLog und KI-Erklärungen verständlich anzeigen,
- Karten als stabile UI-Komponenten darstellen,
- spätere echte Kartenabbilder aufnehmen können,
- weiterhin keine Hidden-Info-Daten im Browser benötigen,
- visuell nicht wie ein offizieller Kartenclient auftreten, solange Asset-Freigaben nicht geklärt sind.

## 3. Designreferenz

Primäre Referenz:

- `docs/ui-designsets/03-design-c-clean-high-contrast/entry.png`
- `docs/ui-designsets/03-design-c-clean-high-contrast/runner-corrected.png`
- `docs/ui-designsets/03-design-c-clean-high-contrast/corp.png`

Kartenbildfreundliche Zusatzreferenz:

- `docs/ui-designsets/03-design-c-clean-high-contrast/entry-card-images.png`
- `docs/ui-designsets/03-design-c-clean-high-contrast/runner-card-images-corrected.png`
- `docs/ui-designsets/03-design-c-clean-high-contrast/corp-card-images-corrected.png`

Diese Zusatzbilder ersetzen die ursprüngliche Design-C-Entscheidung nicht, sondern konkretisieren den Kartenanzeige-Teil: Bildmodus, kompakte Karten, Zoom, Text-Fallback und Card Preview werden als V0.7-Planungsbausteine aufgenommen.

Sekundäre Referenzen:

- `docs/ui-designsets/REALISM_REVIEW.md`
- Design D für späteren Run-/Encounter-Fokus, aber nicht als V0.7-Hauptlayout.
- Design B nur als Inspiration für einen einklappbaren Diagnosebereich.

Übernahme aus Design C:

- helle, kontrastreiche Oberfläche,
- blaue Runner-Akzente und orange Corp-Akzente,
- Topbar mit State, Verbindung und Reconnect,
- klare Startkarten für Spielmodi,
- getrennte Runner-/Corp-Boards,
- rechte Action- und Statusspalte,
- EventLog unten/rechts,
- Boardzentrum als Zone- und Run-Fläche.
- Kartenflächen mit stabilem Bildformat,
- Card Preview mit Image/Text-Umschaltung,
- lokale Card-Display-Einstellung für Image, Compact, Zoom und Text-Fallback.

Anpassungen gegenüber Design C:

- Keine Standardanzeige von Multiaccess wie `Access 3 cards`, solange die Engine dies nicht anbietet.
- Keine falschen Kartentypen in falschen Zonen, zum Beispiel keine Runner-Programme in Corp-HQ.
- Keine offiziellen Kartenrücken, Frames, Logos oder echten Kartennamen ohne Freigabe.
- Kartenflächen werden als abstrakte, image-ready Komponenten gebaut.
- Debug-Details werden in einen optionalen Drawer verschoben.
- Bildmodus ist eine lokale Anzeigepräferenz, keine Spielregel und kein Match-State.
- Resume, Matches und Replays dürfen nur lokale/private Stände zeigen; keine öffentliche Replay-Plattform.

## 4. Ausgangslage

V0.5 liefert Kartenimport und Katalog.

V0.6 liefert Deckeditor, Deck-Snapshots und Matchstart mit Deckauswahl.

Aktuelle UI-Eigenschaften:

- Next.js/React-App existiert.
- UI darf laut Web-Regeln nur `PlayerView`, `LegalActions`, side-gefilterte Events und lokale Clientzustände rendern.
- Browser darf keinen FullState halten.
- Vorhandene Oberfläche ist funktional, aber visuell und strukturell nicht auf langfristige Nutzung ausgelegt.
- Aktuelle CSS-Basis ist eher dunkel; V0.7 soll primär hell und kontrastreich werden.

## 5. Nicht-Ziele

V0.7 baut nicht:

- neue spielbare Karten,
- neue Regelmechaniken,
- offiziellen Kartenpool,
- automatische Kartentext-Regelinterpretation,
- öffentliche Plattformfunktionen,
- Matchmaking,
- Accounts,
- Chat,
- Rankings,
- finale mobile App,
- offizielle Kartenabbilder ohne getrennte Asset-Freigabe.

## 6. Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V07-MUST-001 | UI-Spezifikation | `docs/derived/UI_REDESIGN_0.7_SPEC.md` beschreibt Layout, Komponenten, Datenquellen und Zustände. |
| V07-MUST-002 | Design-C-Orientierung | Entry, Runner-View und Corp-View folgen strukturell dem Clean-High-Contrast-Designset. |
| V07-MUST-003 | Side-sichere Datenbindung | Jede UI-Komponente benennt ihre erlaubte Datenquelle: `PlayerView`, `LegalActions`, side-gefilterte Events, Receipts oder lokale UI-State. |
| V07-MUST-004 | Kein FullState im Client | Browser-UI importiert keine Engine und rendert keinen vollständigen `GameState`. |
| V07-MUST-005 | App-Shell und Navigation | Start, Katalog, Decks, Match erstellen, Match fortsetzen und Diagnostics sind klar erreichbar. |
| V07-MUST-006 | RunnerBoard | Runner-Ansicht zeigt Runner-Ressourcen, Grip/Stack/Heap/Rig, gegnerische Server nur side-gefiltert, aktuellen Run und legale Aktionen. |
| V07-MUST-007 | CorpBoard | Corp-Ansicht zeigt Corp-Ressourcen, HQ/R&D/Archives/Remotes, Runner-Public-Info, aktuellen Run und legale Aktionen. |
| V07-MUST-008 | LegalActionsPanel | Aktionen werden gruppiert, kosten-/zielklar angezeigt und während Pending/Stale-Zuständen sicher gesperrt. |
| V07-MUST-009 | ChoiceRequestPanel | Zielauswahl, Access/Steal/Trash/Decline, Rez-Fenster und Subroutine-Auswahl sind als eigene Choice-Zustände modelliert. |
| V07-MUST-010 | EventLog | EventLog unterscheidet Public, Runner, Corp, Redacted und System-Events ohne private Leaks. |
| V07-MUST-011 | Undo/Reconnect | Undo- und Reconnect-Zustände sind sichtbar, verständlich und side-sicher. |
| V07-MUST-012 | Image-ready CardView | Kartenkomponente unterstützt spätere echte Kartenabbilder über kontrollierte Bild-Metadaten und Platzhalter/Fallbacks. |
| V07-MUST-013 | Asset-Gate | Echte Kartenabbilder werden nicht genutzt, bevor Quelle, Nutzungsgrenzen, Caching und Anzeigeerlaubnis dokumentiert sind. |
| V07-MUST-014 | Responsive Desktop/Tablet | Layout ist desktop-first, aber bei schmaleren Browsern ohne Textüberlauf und Überlagerungen bedienbar. |
| V07-MUST-015 | Visual QA | Screenshots oder Browser-Smokes prüfen Entry, Runner, Corp, Katalog, Deckeditor, Reconnect/Undo und aktive Run-Zustände. |
| V07-MUST-016 | Card Display Modes | UI unterstützt mindestens Image Placeholder, Compact, Zoom/Focus und Text-Fallback als lokale Anzeigeoptionen. |

## 7. Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V07-SHOULD-001 | Design Tokens | Farben, Abstände, Radius, Typografie, Statusfarben und Icongrößen liegen als zentrale Tokens vor. |
| V07-SHOULD-002 | Run-Fokus | Aktiver Run bekommt eine deutliche Stepper-/Timeline-Darstellung für Approach, Encounter, Break und Access. |
| V07-SHOULD-003 | Diagnostics Drawer | StateVersion, MatchVersion, StateHash, Receipts und Visibility-Status liegen in einem einklappbaren Diagnosebereich. |
| V07-SHOULD-004 | KI-Erklärungen | KI-Reason-Codes werden als Lernhilfe angezeigt, nur aus sichtbaren Daten. |
| V07-SHOULD-005 | Accessibility-Basis | Tastaturfokus, sichtbare Fokuszustände, Labels und Farbkontraste sind geprüft. |
| V07-SHOULD-006 | Card Detail Panel | Klick/Focus auf Karte öffnet Detailpanel mit Text, Status und Bildplatzhalter, soweit side-sicher. |
| V07-SHOULD-007 | Screenshot-Review-Checkliste | Vor Abschluss werden Referenzscreens gegen Design C geprüft. |
| V07-SHOULD-008 | Card Preview Panel | Aktive/ausgewählte Karte kann rechts oder im Detailbereich als Image/Text-Vorschau angezeigt werden. |
| V07-SHOULD-009 | Board Preview | Startscreen kann eine kleine sichere Vorschau der gewählten Card-Display-Option zeigen. |

## 8. Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V07-COULD-001 | Dark Skin | Nur als späterer Theme-Ansatz aus Design A/D, nicht Hauptgate. |
| V07-COULD-002 | Encounter-Fokus aus Design D | Nur wenn Basislayout stabil ist. |
| V07-COULD-003 | Animationen | Nur kurze, ruhige Übergänge ohne Layoutshift und ohne Spielzustand zu verschleiern. |

## 9. Vorgeschlagene Artefakte

Derived Docs:

- `docs/derived/MVP_0.7_REQUIREMENTS.md`
- `docs/derived/UI_REDESIGN_0.7_SPEC.md`
- `docs/derived/UI_COMPONENT_MODEL_0.7_SPEC.md`
- `docs/derived/CARD_VISUALS_AND_ASSETS_0.7_SPEC.md`
- `docs/derived/UI_VISIBILITY_0.7_SPEC.md`
- `docs/derived/MVP_0.7_TEST_MATRIX.md`
- `docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md`

Tests:

- `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`

Mögliche UI-Struktur:

- `apps/web/app/page.tsx` bleibt Einstieg oder wird in Komponenten aufgeteilt.
- `apps/web/app/components/` für UI-Bausteine.
- `apps/web/app/lib/` für UI-Mapping, Statuslabel, Action-Gruppierung und CardVisual-Auswahl.
- `apps/web/app/styles/` oder zentrale CSS-Module für Tokens und Layout.

## 10. Komponentenmodell

V0.7 sollte diese Komponenten verbindlich definieren:

- `AppShell`
- `TopBar`
- `EntryScreen`
- `ModeCard`
- `ResumeMatches`
- `MatchSetupPanel`
- `RunnerBoard`
- `CorpBoard`
- `BoardZone`
- `ServerColumn`
- `RunTimeline`
- `CardView`
- `CardDetailPanel`
- `CardPreviewPanel`
- `CardDisplaySettings`
- `CardZoomDialog`
- `LegalActionsPanel`
- `ChoiceRequestPanel`
- `UndoPanel`
- `ConnectionStatus`
- `EventLogPanel`
- `AiExplanationPanel`
- `ActionReceiptPanel`
- `DiagnosticsDrawer`

Regel:

Keine Komponente darf verdeckte Daten durch Props erhalten, wenn sie diese nicht anzeigen darf. Redaction soll vor der Render-Komponente passieren, nicht erst durch CSS-Verstecken.

## 11. Layout-Leitbild

### 11.1 Entry

Orientierung: `entry.png`.

Inhalte:

- Runner vs KI,
- Corp vs KI,
- KI-vs-KI,
- privates Match erstellen,
- Invite beitreten,
- Match fortsetzen,
- Deckauswahl aus V0.6,
- Preflight-Checks: LegalActions, Hidden-Info Safe, Replay Ready, Decks Validated,
- Card Display: Image, Compact, Zoom, Text Fallback als lokale Anzeigeoption,
- Board Preview mit generischen Platzhalterkarten.

Nicht sichtbar:

- Klartexttokens,
- öffentliche Lobby,
- Account-/Ranking-Elemente.
- echte Kartenabbilder ohne Asset-Freigabe.

### 11.2 Runner View

Orientierung: `runner-corrected.png`.

Primärflächen:

- linke Ressourcenspalte: Credits, Clicks, Agenda Points, Tags, MU, Zone Counts,
- Zentrum: gegnerische Server side-gefiltert, Run-Timeline, Grip/Rig/Heap,
- rechte Spalte: Current Run, LegalActions, ChoiceRequest, EventLog,
- Footer: Timing, Undo, Match-ID kurz, Sync-/State-Hinweise.
- Card Preview für aktive Karte oder Fokuskarte mit Image/Text-Umschaltung.

Besonders wichtig:

- Corp-HQ/R&D verdeckt nur als Counts oder redacted Cards.
- Unrezzed Corp-Karten dürfen keine Titel/Typen leaken.
- Access-Zustände müssen klar vom normalen Run-Zustand getrennt sein.
- Available Breakers, Active ICE und Subroutines dürfen prominent sein, aber nur aus LegalActions/PlayerView abgeleitet werden.

### 11.3 Corp View

Orientierung: `corp.png`.

Primärflächen:

- linke Ressourcenspalte: Credits, Clicks, Agenda Points, Deck/HQ/Archives Counts,
- Zentrum: HQ sichtbar für Corp, Serverraster, R&D/Archives/Remote-Spalten,
- untere Fläche: Runner Public Info, Runner Hidden Counts, Runner Rig Public,
- rechte Spalte: LegalActions, Current Run / Rez Window, EventLog,
- Footer: Match-ID, Per-Match-Lock, Visibility-Filter, Replay/Hash active, Last synced.
- Card Preview für ausgewählte HQ-, ICE-, Root- oder scored Karte mit Image/Text-Umschaltung.
- kompakter Action Receipt Bereich für zuletzt eingereichte Aktionen.

Besonders wichtig:

- Runner Grip/Stack als Counts, keine Kartentitel.
- Corp-HQ ist nur in Corp-View sichtbar.
- Server-Root und ICE brauchen klare Rez-/Unrezzed-/Advanced-/Access-Zustände.
- Runner Hidden Zones verwenden einheitliche generische Rückseiten/Platzhalter ohne identifizierende Bilddaten.

## 12. Kartenabbilder und CardView-Strategie

Der Wunsch nach späteren Originalkartenabbildern wird in V0.7 architektonisch vorbereitet.

### 12.1 CardView-Modi

`CardView` sollte mindestens diese Modi unterstützen:

| Modus | Verwendung |
|---|---|
| `placeholder` | interne Demo-Karten und nicht freigegebene Bilder. |
| `text-card` | lesbare generische Karte mit Titel, Typ, Kosten, Status und kurzem Text. |
| `catalog-image-ready` | Karte hat Bildmetadaten, Bild wird aber noch nicht geladen. |
| `approved-image` | Bild ist nach Asset-Freigabe erlaubt und lokal/zugelassen verfügbar. |
| `hidden` | verdeckte gegnerische Karte, ohne echte Rückseite falls nicht freigegeben. |
| `redacted` | bewusst ausgeblendete Karte oder Event-Kontext. |
| `compact` | kleinere boardtaugliche Karte mit Bildausschnitt oder Platzhalter und Minimaldaten. |
| `zoom` | fokussierte Detaildarstellung für bekannte, side-sichere Karten. |

### 12.2 Bilddaten

Bildmetadaten dürfen vorbereitet werden:

- `imageAssetId`,
- `imageSource`,
- `imageStatus`,
- `localImagePath` oder später erlaubte URL,
- `aspectRatio`,
- `altText`,
- `sourceSnapshotId`.

Empfehlung:

Kartenflächen verwenden von Anfang an ein stabiles Seitenverhältnis von `5 / 7`, damit spätere echte Kartenabbilder ohne Layoutbruch passen.

Die kartenbildfreundlichen Design-C-Zusatzbilder zeigen zwei sinnvolle Ebenen:

- kleine Boardkarten mit wenig Text für Hand, Rig, Server und Hidden Counts,
- großes Card Preview Panel für Text, Kosten, Typ, Status und späteres Bild.

V0.7 sollte deshalb nicht versuchen, vollständigen Kartentext in jede Boardkarte zu pressen. Detailtext gehört in Preview, Zoom oder Text-Fallback.

### 12.3 Asset-Gate

Vor echter Anzeige offizieller Kartenabbilder muss es eine separate Entscheidung geben:

- erlaubte Quelle,
- Nutzungsbedingungen,
- lokale Speicherung oder Remote-Laden,
- Caching,
- erlaubte Bildgrößen,
- Alt-Texte,
- Fallback,
- keine offiziellen Card Backs oder Frames ohne Freigabe,
- keine Bild-URL-Leaks für verdeckte gegnerische Karten.

Bis dahin verwendet V0.7 generische, eigene Platzhalterkarten im Stil von Design C.

Die lokale Anzeigeoption `Image cards` darf auch vor Asset-Freigabe existieren, lädt dann aber ausschließlich generische Projektplatzhalter. `Text fallback` muss jederzeit verfügbar sein und darf nicht schlechter bedienbar sein als der Bildmodus.

### 12.4 Hidden-Info-Regel für Bilder

Für verdeckte Karten gilt:

- keine echten Kartentitel,
- keine echten Bild-URLs,
- keine identifizierbaren Thumbnails,
- keine abweichenden Rückseiten pro Karte,
- keine Metadaten im DOM, die die Karte identifizieren.

Hidden Cards werden aus PlayerView-Redaction gebaut, nicht aus echten Kartendaten.

Auch ein generischer Hidden-Card-Back muss für alle verdeckten gegnerischen Karten gleich bleiben. Es darf keine unterschiedlichen Farben, Icons, Größen oder Ladezustände geben, aus denen eine konkrete Karte ableitbar wäre.

## 13. Datenbindung

Erlaubte Datenquellen:

- `PlayerView`,
- `LegalActions`,
- side-gefilterter `EventLog`,
- `ActionReceipt`,
- `OpponentStatus`,
- `PendingUndo`,
- Matchmetadaten ohne Tokens,
- Katalog-/Deckdaten aus V0.5/V0.6, sofern sie nicht Hidden-Info im laufenden Match leaken.
- lokale Card-Display-Präferenz, solange sie keine Matchdaten verändert.

Nicht erlaubt:

- `GameState`,
- `cardInstances` als Vollobjekt,
- private Payloads der Gegenseite,
- Session-/Reconnect-/Join-Tokens in sichtbaren Logs,
- Engine-Importe im normalen Client.

## 14. Teilphasen

### V0.7-A Requirements und UI-Spezifikation

Ergebnisse:

- Requirements,
- Component Model,
- Data Binding Matrix,
- Asset Strategy,
- Visual QA Matrix.

Gate:

Jede geplante Komponente hat Datenquelle, Hidden-Info-Regel und Testspur.

### V0.7-B Design Tokens und Komponentenbasis

Ergebnisse:

- helle Design Tokens,
- Runner-/Corp-Akzentfarben,
- CardView-Grundmodell,
- CardDisplaySettings,
- CardPreviewPanel,
- CardZoomDialog,
- Status- und Icon-System,
- Layout-Grids.

Gate:

Keine UI-Karten, Buttons oder Panels haben Textüberlauf in Desktop- und Tablet-Breiten.

### V0.7-C Entry und Matchflow

Ergebnisse:

- Startscreen nach Design C,
- Matchmodus-Auswahl,
- Deckauswahl aus V0.6,
- Resume,
- Preflight-Checks,
- Card Display Auswahl und Board Preview,
- Join/Invite ohne Token-Leak.

Gate:

Matchstart funktioniert weiter mit validierten Deck-Snapshots; ungültige Decks blockieren sicher.

### V0.7-D RunnerBoard

Ergebnisse:

- Runner-Ressourcen,
- Serverübersicht side-gefiltert,
- RunTimeline,
- Grip/Rig/Heap,
- LegalActions/Choice/EventLog.
- Card Preview und Zoom/Text-Fallback.

Gate:

Runner-View leakt keine Corp-HQ/R&D/unrezzed/Hidden-Details.

### V0.7-E CorpBoard

Ergebnisse:

- Corp-Ressourcen,
- HQ/Server/R&D/Archives/Remotes,
- Runner Public Info,
- Runner Hidden Counts,
- Rez Window,
- LegalActions/Choice/EventLog.
- Card Preview, Action Receipt und Zoom/Text-Fallback.

Gate:

Corp-View leakt keine Runner-Grip/Stack-Details.

### V0.7-F Diagnostics, Undo, Reconnect, KI-Erklärungen

Ergebnisse:

- Diagnostics Drawer,
- Undo Panel,
- Reconnect States,
- Action Receipts,
- KI-Erklärungen.
- Card Display Settings.

Gate:

Diagnostics bleibt side-sicher und zeigt keine Klartexttokens.

### V0.7-G Visual QA und Hardening

Ergebnisse:

- Screenshot-Smokes,
- responsive QA,
- accessibility baseline,
- final review.

Gate:

Build/Test/Visibility/Visual-Smokes sind grün.

## 15. Teststrategie

### 15.1 Contract- und Mapping-Tests

Pflicht:

- Jede UI-Mappingfunktion akzeptiert nur PlayerView-artige Daten.
- Action-Gruppierung erzeugt keine Aktion, die nicht aus `LegalActions` kommt.
- Choice-Panels zeigen nur aktuelle Choice-/Action-Daten.
- CardView-Hidden-Modus enthält keine `definitionId`, Titel oder Bildmetadaten verdeckter gegnerischer Karten.
- Display-Mode-Wechsel ändert keine Matchdaten, keine LegalActions und keine StateVersion.

### 15.2 Visibility-Tests

Pflicht:

- Runner-HTML/Payload enthält keine Corp-HQ-Titel.
- Runner-HTML/Payload enthält keine verdeckten R&D-/unrezzed-ICE-Titel.
- Corp-HTML/Payload enthält keine Runner-Grip-/Stack-Titel.
- EventLog zeigt redacted Inhalte nur als `[redacted]` oder neutrale Systemtexte.
- Diagnostics Drawer enthält keine Tokens und keinen FullState.
- Card Preview und Zoom zeigen keine verdeckten gegnerischen Kartendaten.
- Hidden Card DOM enthält keine echte Bild-URL, keinen Titel und keine identifizierende Asset-ID.

### 15.3 Interaction-Tests

Pflicht:

- Pending Action sperrt Action-Buttons.
- Accepted Receipt aktualisiert StateVersion.
- Rejected/Stale Action zeigt sichere Fehlermeldung.
- Reconnect zeigt `reconnecting`, `resynced`, `opponent offline`, `session replaced`.
- Undo zeigt verfügbar, requested, needs response, accepted, declined, blocked.
- Access/Trash/Steal/Decline und Rez-Fenster sind klar bedienbar.

### 15.4 Visual- und Layout-Tests

Pflicht:

- Entry-Screen bei Desktop und schmalerem Viewport.
- RunnerBoard mit normalem Runner-Turn.
- RunnerBoard während Encounter.
- CorpBoard während Corp-Turn.
- CorpBoard während Rez Window.
- Deckauswahl und Katalogansicht aus V0.5/V0.6.
- Card Display Settings und Board Preview.
- Card Preview Panel mit Image/Text-Umschaltung.
- Zoom/Focus Dialog für bekannte Karte.
- Keine überlappenden Panels.
- Kein Buttontext läuft aus.
- CardView bleibt im `5 / 7`-Rahmen.

Empfohlen:

- Browser-Screenshots gegen Design-C-Review-Checkliste.
- Canvas-/Screenshot-Pixelcheck nur falls grafische Darstellung oder Bildladezustände kritisch werden.

### 15.5 Asset-Tests

Pflicht:

- Ohne Asset-Freigabe werden keine externen Kartenbilder geladen.
- Image Cards Modus lädt vor Asset-Freigabe nur generische Projektplatzhalter.
- Hidden Cards erhalten keine echten Bild-URLs.
- Bildfehler fallen auf Platzhalter zurück.
- Unbekannte oder nicht freigegebene `imageStatus` Werte werden nicht gerendert.
- Alt-Texte sind vorhanden und side-sicher.
- Text-Fallback funktioniert auch bei deaktivierten oder fehlgeschlagenen Bildern.

### 15.6 Accessibility-Tests

Pflicht:

- Fokusreihenfolge von Topbar zu Board zu Actions zu Log ist nutzbar.
- Buttons und Inputs haben Labels.
- Fokuszustände sind sichtbar.
- Farbkontraste für Haupttext, Status und Actions sind ausreichend.
- Tastaturbedienung für Action Panel und Choice Panel ist möglich.

### 15.7 Regression

Pflicht:

- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`
- bestehende Engine-, AI-, Multiplayer-, Catalog-, Deck- und Visibility-Gates bleiben grün.

## 16. Kritische Härtungen

### 16.1 Hidden-Info-Härtung

- Redaction passiert vor dem Rendern.
- Keine versteckten Daten in React State.
- Keine privaten Daten in DOM-Attributen, Tooltips, `alt`, `title`, Debug oder Logs.
- EventLog-Filter wird zentralisiert.

### 16.2 Action-Härtung

- UI sendet nur vorhandene `actionId`s.
- Pending- und stale-Zustände deaktivieren erneute Eingaben.
- Idempotency-Key wird nicht als Nutzerfeature überbetont.
- Manipulierte Aktionen bleiben serverseitig abgelehnt.

### 16.3 Asset-Härtung

- Kein Remote-Bildladen ohne Allowlist und Freigabe.
- Keine offiziellen Card Backs als Hidden Card.
- Keine Asset-URLs in Hidden Cards.
- Bildmetadaten werden nur für sichtbare, bekannte Karten geladen.
- Lokaler Cache muss später reproduzierbar und versioniert sein.

### 16.4 Performance

- CardView-Listen vermeiden unnötige Re-Renders.
- Katalog-/Decklisten laden Summary und Detail getrennt.
- Bilder werden später lazy geladen.
- Board layoutet mit festen Tracks und `aspect-ratio`, nicht über dynamische Textgrößen.
- Diagnostics Drawer lädt schwere Daten erst bei Öffnung.

### 16.5 Responsive-Härtung

- Desktop ist Hauptziel.
- Schmale Viewports stapeln rechte Spalte unter Board oder machen Panels tabbed.
- Action Panel bleibt immer erreichbar.
- Current Choice hat auf kleinen Viewports Vorrang vor EventLog.

## 17. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Design wird mit Engine-Scope verwechselt | ungetestete Mechaniken | V0.7 baut keine neuen Regeln. |
| Echte Kartenbilder zu früh | Lizenz-/Scope-Risiko | Asset-Gate und Platzhalter bis Freigabe. |
| Hidden-Info im DOM | Fairnessbruch | Redaction vor Rendern, DOM-/Payload-Tests. |
| UI dupliziert Regeln | Divergenz zur Engine | Actions nur aus `LegalActions`, Choice nur aus Server-/PlayerView-Zustand. |
| Board wird zu dicht | Bedienbarkeit sinkt | Design-C-Hauptstruktur, Diagnostics auslagern. |
| Textüberlauf | unprofessionelle UI | feste Layouts, responsive QA, keine viewportabhängigen Fontgrößen. |
| Bildkarten verdrängen Lesbarkeit | schlechtere Bedienung | Text-Fallback, Card Preview, Zoom und Compact-Modus gleichwertig planen. |
| Hidden-Card-Back verrät Informationen | Hidden-Info-Leak | einheitliche generische Rückseite ohne echte Assetdaten. |

## 18. Done-Kriterien

V0.7 ist fertig, wenn:

- Requirements und UI-Spezifikationen eingefroren sind,
- Design C als Hauptstruktur umgesetzt ist,
- Entry, RunnerBoard, CorpBoard, CardView, LegalActionsPanel, ChoiceRequestPanel, EventLog, Undo/Reconnect und Diagnostics existieren,
- CardView, CardPreview, CardDisplaySettings und Zoom/Text-Fallback echte Kartenabbilder später ohne Layoutbruch aufnehmen können,
- echte Kartenabbilder bis zur Asset-Freigabe nicht geladen werden,
- Hidden-Info-, DOM-, EventLog- und Diagnostics-Tests bestehen,
- Visual-Smokes für Entry, Runner, Corp und aktive Run-Zustände grün sind,
- Accessibility-Basics geprüft sind,
- V0.5-/V0.6-Katalog- und Deckfunktionen weiterhin erreichbar sind,
- `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` und `corepack pnpm build` bestehen.
