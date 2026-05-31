# AI007 DeckDoctrine Strategy Viewer im Deckbereich

## Aufgabe-ID

AI007

## Kurzfazit

AI007 ist umgesetzt: Der Deckeditor zeigt pro aktuellem lokal editierbarem Deck eine read-only Sektion `KI-Deckprofil`. Die Sektion rendert den diagnostischen AI006-Output aus `buildDeckStrategyProfile` als ViewModel mit Strategy Scores, side-spezifischen Profilen, Evidence, Gaps, Function-Signal-Counts, Legacy-Signal-Counts und Warnings.

Die Änderung bleibt diagnostisch. Es gibt keine Plannerwirkung, keine Action Scores, keine PlanWeights, keine Hintmigration, keine Engine-/Legalitätswirkung und keine Änderung an der DeckDoctrine-Scoringformel.

## Bezug zu AI003 bis AI006

- AI003/AI003-1: nutzt die vorhandene Strategy-Goal-Taxonomie und side-aware Function-Signal-Ableitung nur als bestehende Datenbasis.
- AI004: zeigt normalisierte Strategieanker und verbleibende Legacy-/Warning-Klassen nur nachrangig an.
- AI005: folgt demselben read-only UI-Muster wie der AI Hint Inspector; keine UI-Reads aus `docs/reviews/ai/*`.
- AI006: verwendet `buildDeckStrategyProfile` als alleinige Strategy-Aggregation.

## Einbauort

Der Viewer sitzt im Deckbereich des Webclients, direkt im `DeckEditorPanel` unter `Deckdetails` und vor `Deckliste` beziehungsweise `Deck-Tisch`.

Der Ort wurde gewählt, weil der Nutzer dort aktuell ein frei editierbares Deck auswählt oder verändert und dieselbe Seite bereits Validierung, Deckliste und Deckaktionen bündelt. Die Anzeige sitzt nicht in einer separaten Snapshot-Seite und ist keine Match-/Runtime-Ansicht.

## Datenquelle

- API: `apps/web/app/api/decks/strategy-profile/route.ts`
- ViewModel/Serverpfad: `apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts`
- UI-Typen/Helfer: `apps/web/app/deck-strategy-profile-ui.ts`

Der Client sendet den aktuellen `EditableDeck`-Entwurf an `/api/decks/strategy-profile`. Der Server validiert den Entwurf über den bestehenden Deckdatenpfad und ruft danach `buildDeckStrategyProfile` auf. Die React-UI rendert nur das zurückgegebene AI007-ViewModel und implementiert die Strategieaggregation nicht neu.

Es wurde kein neues build-time Index-Artefakt erzeugt. Frei editierbare Nutzerdecks werden dynamisch unterstützt; Snapshot-/Beispieldecks sind nicht die einzige Quelle.

## Ungültige Decks

Leere, unvollständige, ungültige oder malformed Deckpayloads führen nicht zu einem Editor-Crash. Der API-Pfad liefert eine `unavailable`-Antwort, und die UI zeigt `KI-Deckprofil nicht verfügbar` mit einem knappen Grund wie `Deck enthält keine Karten` oder `Deckprofil konnte nicht berechnet werden`.

Die Deckvalidierung selbst wurde nicht geändert.

## Angezeigte Sektionen

- Deck-Status / Analysequelle mit Deckname, Deck-ID, Seite, Kartenanzahl, AI006-Schema und Deck-Hash, falls verfügbar.
- Strategien nach `FinalScore` absteigend mit `AnchorScore`, `SupportScore`, `FinalScore`, Confidence, Status, Evidence Count und Gap Count.
- Runner-Profile: Coverage, Economy, Setup, Pressure, Defense.
- Corp-Profile: ICE, Score, Economy, Punish, Remote.
- Anchor Evidence mit Karte, Signal/Quelle, Rolle und Grund.
- Support Evidence mit Function-Signal, Kategorie, Count und Beispielkarten.
- Support Gaps mit Strategiebezug.
- Function-Signal-Counts.
- Legacy-Signal-Counts getrennt nach `roles`, `planRoles`, `lineSupport` und sonstigen Legacy-Signalen.
- Warnings / Hinweise.

Legacy-Signale werden nicht wie neue Strategieanker dargestellt.

## Browser-Smoke

Lokaler Start erfolgte über `scripts/start-netgrid.ps1`.

Geprüft:

- Deckeditor geöffnet.
- Korp-Deck `Ivory Bastion` zeigt `KI-Deckprofil`, `AI006 strategy aggregation`, Primär-/Sekundärstrategien, Score-Balken und Corp-Profile.
- Runner-Deck `King of the Road` zeigt Runner-Strategien, Runner-Profil und Support-Gaps.

Screenshots:

- `C:/Users/Lui/AppData/Local/Temp/netgrid-ai007-deckprofile-panel.png`
- `C:/Users/Lui/AppData/Local/Temp/netgrid-ai007-deckprofile-runner.png`

## Tests

Ergänzt:

- `apps/web/app/deck-strategy-profile-ui.test.ts`
- `apps/web/app/api/decks/strategy-profile/strategy-profile-data.test.ts`

Abdeckung:

- Runner- und Corp-Decks liefern Strategy Scores.
- Runner-/Corp-Profile werden im ViewModel getrennt aufgebaut.
- Top-Strategien sind nach `FinalScore` sortiert.
- Anchor Evidence, Support Evidence, Support Gaps und Legacy-Signal-Counts werden getrennt modelliert.
- Forbidden Runtime-/Planner-Felder wie `cardInstances`, `stateHash`, `legalActions`, `actionScores` und `planWeights` werden nicht exponiert.
- Leere oder malformed Decks liefern eine nicht-crashende unavailable-Antwort.
- Partial Profile ohne side-spezifische Profilfelder rendern als leere Profildaten statt zu crashen.

## Ausgeführte Checks

Grün:

- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec vitest run app/deck-strategy-profile-ui.test.ts app/api/decks/strategy-profile/strategy-profile-data.test.ts`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`

Nicht grün, bekannter Nicht-AI007-Baseline-Drift:

- `corepack pnpm --filter @netgrid/web test` fällt in `apps/web/app/api/cards/catalog-data.test.ts` auf der bestehenden Proteus/Catalog-AI-Baseline: `ai_supported` zählt aktuell 564 statt der alten `< 412` Erwartung, und Proteus-Karten liefern inzwischen AI-Hints statt `null`.

## Bewusst nicht geändert

- Keine Plannerwirkung.
- Keine Action Scores.
- Keine PlanWeights.
- Keine Runtime-Spielentscheidung.
- Keine Engine-Regeländerung.
- Keine Legalitätsänderung.
- Keine Profil-/Default-Umschaltung.
- Keine Hintmigration.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `data/ai/ai-card-hints-compiled.json`.
- Keine Taxonomieänderung.
- Keine DeckDoctrine-Scoringformeländerung.
- Keine Catalog-/Proteus-Baseline-Korrektur.

## Grenzen / spätere Erweiterungen

- Filter und Suchfunktionen innerhalb des Viewers.
- Manuelle Deckprofil-Overrides.
- Runtime Decision Trace.
- Kontrollierte Planner-Nutzung nach separatem Gate.
