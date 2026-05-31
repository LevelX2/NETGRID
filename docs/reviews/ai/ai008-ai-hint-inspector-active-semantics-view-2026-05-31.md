# AI008 AI Hint Inspector: Active Semantics View

Aufgabe-ID: AI008

## Problem

Die AI005-Anzeige war fachlich zu breit: compiled Hint-Kontext, mechanische Facts, Function-Signals, `lineSupport`, Legacy-Rollen, Planrollen und Warnings standen gleichrangig nebeneinander. Dadurch war nicht klar genug, was aktuell zählt und was Legacy-, Migrations- oder Debug-Kontext ist.

## Neue Standardansicht

Die Kartendetailansicht zeigt den Inspector jetzt unter `Aktive KI-Semantik`. Offen sind nur:

1. `Supportstatus`
2. `Aktive KI-Semantik`
3. `Strategieanker`
4. `Hinweise / Prüfpunkte`

Der Bereich `Legacy / Entwicklerdetails anzeigen` ist standardmäßig geschlossen.

## Aktive KI-Semantik

Als aktive KI-Semantik gelten nur bestehende ViewModel-Felder aus `data/ai/ai-hint-inspector-index.json` und dem bestehenden compiled Hint:

- mechanische Facts: `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `targetProfiles`
- abgeleitete Funktionssignale aus dem Inspector-Index
- gültige `strategicRole`-Werte, falls der Inspector-Status sie als gültig ausweist
- vorhandene `quality`-Felder, ohne neue Felder zu erfinden

Die React-UI berechnet keine neuen Strategy-, Function- oder Warning-Kategorien.

## Strategieanker

Die Hauptansicht trennt zwei aktive Quellen:

- `Abgeleiteter Strategieanker`: `derivedStrategyAnchors` aus dem Inspector-Index.
- `Gültiger lineSupport`: nur `lineSupportClassification` mit `triageCategory: normalized_strategy_id`.

Alias-Kandidaten, Legacy-`lineSupport`, function-signal-only-Werte sowie deferred/human-review Werte erscheinen nicht als aktive Strategieanker.

## Legacy / Entwicklerdetails

In den geschlossenen Entwicklerbereich verschoben wurden:

- `roles` als `Legacy-Rollen`
- `planRoles` als `Legacy-Planrollen`
- nicht normalisierte `lineSupport`-Klassifikationen als `Legacy-lineSupport`
- Alias-, `function_signal_only`-, `legacy_role_only`- und weitere Klassifikationen
- compiled Hint-Quelle, Mechaniken, Werte, Risiken, Szenarien, Notes und Overlay-Felder
- bestehende Legacy-/StrategicRole-Statusdaten und rohe Warning-Kategorien

In der Hauptansicht bleibt davon nur ein kompakter Hinweis wie `Legacy-Daten vorhanden: 15`.

## Hinweise

Warnings werden in der Hauptansicht kompakt über `Kritisch`, `Prüfen`, `Legacy` und `Info` eingeordnet. Legacy-Hinweise erscheinen dort nicht rot und werden nicht als vollständige Listen ausgeklappt. Details bleiben im geschlossenen Entwicklerbereich.

## Tests

Ergänzt und angepasst:

- `apps/web/app/ai-hint-inspector-ui.test.ts`

Abgedeckt sind gültige Strategy Goals, derived Strategy Anchors, Funktionssignale, mechanische Facts, gültige Strategic Roles, vorhandene Quality-Felder, kompakte Legacy-Hinweise, geschlossener Legacy-Bereich, Legacy-Rollen/Planrollen im Entwicklerbereich, lesbare Karten ohne aktive Strategiezuordnung, Legacy-only-Karten, keine Roh-JSON-Wand, keine Hidden-/Runtime-Felder und Reihenfolge aktive Bereiche vor Legacy.

Gezielte Webtests:

- `corepack pnpm --filter @netgrid/web exec vitest run app/ai-hint-inspector-ui.test.ts`
- `corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "AI005|generated remoteRole|lightweight AI inspector"`

## Browser-Smoke

Start: `scripts/start-netgrid.ps1`

Geprüft im Katalog:

- `Microtech AI Interface` zeigt `Aktive KI-Semantik`.
- Supportstatus, mechanische Facts, Funktionssignal und Strategieanker stehen in der Hauptansicht.
- `Legacy / Entwicklerdetails anzeigen` ist initial geschlossen.
- Nach Öffnen sind Legacy-Rollen, Legacy-Planrollen, compiled Quelle und Statusdetails sichtbar.
- Desktop-Screenshot: `C:/Users/Lui/AppData/Local/Temp/netgrid-ai008-ai-hint-inspector-active-semantics.png`
- Mobile-Smoke 390x844: Inspector vorhanden, Legacy-Bereich geschlossen, keine überlaufenden Inspector-Einträge. Screenshot: `C:/Users/Lui/AppData/Local/Temp/netgrid-ai008-ai-hint-inspector-mobile.png`

## Checks

Grün:

- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git diff --cached --check`

## Bewusst nicht geändert

- keine Hintmigration
- keine Plannerwirkung
- keine Taxonomieänderung
- keine DeckDoctrine-Runtime-Änderung
- keine Action-Score-Änderung
- keine Engine-Regeländerung
- keine LegalAction-Änderung
- keine Profil-/Default-Umschaltung
- keine Catalog-/Proteus-Baseline-Korrektur
- keine neue UI-Ableitungslogik für Strategy-, Function- oder Warning-Kategorien
