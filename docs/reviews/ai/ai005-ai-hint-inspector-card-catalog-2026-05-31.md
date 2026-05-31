# AI005 AI Hint Inspector im Kartenkatalog

Aufgabe-ID: AI005

## Kurzfazit

AI005 ergänzt den Kartenkatalog um einen read-only `KI-Hinweise`-Inspector in der Kartendetailansicht. Der Inspector zeigt compiled AI-Hints, mechanische Facts, abgeleitete Function-Signals, Strategieanker, `lineSupport`-Klassifikation, optionale `strategicRole`, vorhandene `quality`, Legacy-`roles`/`planRoles` und Warning-/Gap-/Legacy-Klassen strukturiert an.

Keine Hintdaten wurden migriert oder geändert. Es gibt keine Plannerwirkung, keine Engine-/Legalitätswirkung, keine DeckDoctrine-Runtime-Änderung und keine UI-Reads aus `docs/reviews/ai/*`.

## Bezug zu AI003, AI003-1 und AI004

- AI003 liefert die normierten Strategy Goals, optionalen StrategicRoles und den read-only Function-Signal-Vertrag.
- AI003-1 macht Function-Signal- und Strategy-Anchor-Ableitung side-/cardType-/scope-aware.
- AI004 klassifiziert bestehende Legacy-`lineSupport`-, `roles`- und `planRoles`-Werte als Warning-/Legacy-/Deferred-/Gap-Klassen.
- AI005 nutzt diese bestehende Taxonomie nur zur Anzeige. Es erzeugt keine neue Semantik im React-Code.

## UI-Ort

Der Inspector sitzt in der bestehenden Kartenkatalog-Detailansicht des Webclients unter `apps/web/app/page.tsx` im Abschnitt `KI-Hinweise`.

Die Anzeige ist in diese Bereiche gegliedert:

1. Supportstatus
2. Compiled Hint / Quelle
3. Mechanische Facts
4. Function-Signals
5. Strategie / lineSupport
6. Strategic Role
7. Quality
8. Legacy-Rollen
9. Warnings / Gaps / Legacy

## Datenquellen

Die Katalog-API lädt weiterhin die aktiven Hints für den bestehenden Rückwärtskompatibilitätsbereich und ergänzt zusätzlich den Inspector aus:

- `data/ai/ai-card-hints-compiled.json`
- `data/ai/strategy-goals-v1.json`
- `data/ai/strategic-roles-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-hint-inspector-index.json`

Die UI liest keine Review-Artefakte. Review-Dateien bleiben Evidence, aber kein UI-Datenpfad.

## Inspector-Index-Artefakt

AI005 erzeugt ein neues committed build-time Artefakt:

- Artefakt: `data/ai/ai-hint-inspector-index.json`
- Script: `scripts/build-ai-hint-inspector-index.mjs`
- Build: `corepack pnpm build:ai-hint-inspector-index`
- Aktualitätscheck: `corepack pnpm check:ai-hint-inspector-index`

Das Artefakt enthält pro Karte unter anderem:

- `derivedFunctionSignals`
- `derivedStrategyAnchors`
- `lineSupportClassification`
- `rolesClassification`
- `planRolesClassification`
- `warningCategories`
- `descriptorGaps`
- `legacyStatus`

Der Index nutzt die bestehende AI004-Helperlogik `deriveFunctionSignalsFromHint` und `buildAiStrategyTaxonomyReport`. React erzeugt keine eigene Ableitungslogik.

## Legacy vs neue Semantik

- Normierte Strategy Goals werden über `lineSupportClassification.triageCategory = normalized_strategy_id` positiv markiert.
- Legacy-`lineSupport` bleibt als Legacy/Deferred/GAP sichtbar und wird nicht wie neue Semantik dargestellt.
- Function-only-Werte werden als Funktionssignal klassifiziert, nicht als Strategie.
- `roles` und `planRoles` erscheinen nur im Legacy-Bereich mit AI004-Klassifikation.

## Function-Signals und StrategyAnchors

Function-Signals und StrategyAnchors werden aus dem Inspector-Index gelesen. Der Index wird build-time aus den bestehenden side-aware AI003-1-/AI004-Regeln erzeugt. Der UI-Code liest nur das Ergebnis.

## Warnings

Sichtbare Warning-Klassen:

- `legacy_lineSupport`
- `unknown_unmapped`, falls vorhanden
- `descriptor_gap`
- `function_signal_descriptor_gap`
- `deferred_requires_human_review`
- `wrong_side_anchor`, falls vorhanden
- `missing_compiled_hint`, falls API-seitig je ein aktiver Hint ohne compiled Hint auftaucht
- `legacy_fallback_only`

Farbliche Einordnung:

- grün: valide neue Semantik
- gelb: Legacy, deferred oder Descriptor-Gap
- rot: missing, invalid, unknown oder wrong-side
- blau/grau: reine Information oder Function-Signal-only

## Tests

Ergänzt wurden:

- `packages/ai/src/ai-hint-inspector-index.test.ts`
- `apps/web/app/ai-hint-inspector-ui.test.ts`
- AI005-Assertions in `apps/web/app/api/cards/catalog-data.test.ts`

Abgedeckt sind Supportstatus, compiled/mechanische Facts, BreakerProfile, RemoteRole, Function-Signals, Strategy-/`lineSupport`-Klassifikation, Legacy-Rollen, Legacy-Warnings, fehlende `strategicRole`, vorhandene `quality` ohne erfundene Felder, keine Roh-JSON-Wand und keine Hidden-/Runtime-Feldnamen.

## Bewusst nicht geändert

- keine Hintmigration
- keine Plannerwirkung
- keine Action-Score- oder PlanWeight-Änderung
- keine Engine-Regeländerung
- keine LegalAction-Änderung
- keine DeckDoctrine-Runtime-Änderung
- keine Profil-/Default-Umschaltung
- keine Catalog-/Proteus-Baseline-Korrektur
- keine UI-Reads aus Review-Artefakten
- keine neuen Quality-Felder

## Bekannte Grenzen

- Kataloglistenfilter für AI-Inspector-Merkmale sind noch nicht umgesetzt.
- Es gibt noch keinen Vergleich `active` vs `compiled` in der UI.
- DeckDoctrine Viewer und Runtime Decision Trace bleiben spätere Diagnoseflächen.
- Der Supportstatus zeigt `Generated Facts` nur aus stabilen compiled-vs-active/overlay-Feldern; feinere Herkunftsbelege bleiben außerhalb der UI.

## Checks

Grün:

- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy` (`0` Errors, `69` Warnings)
- `corepack pnpm check:ai-compiled-hints` (`0` Errors, `1917` Warnings)
- `corepack pnpm check:ai-hint-quality` (`0` Errors, `150` Warnings)
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm exec vitest run app/ai-hint-inspector-ui.test.ts` aus `apps/web`
- `corepack pnpm exec vitest run app/api/cards/catalog-data.test.ts -t "AI005|generated remoteRole"` aus `apps/web`
- Browser-Smoke über `scripts/start-netgrid.ps1` und `http://127.0.0.1:3100`: Katalog-Tab zeigt `KI-Hinweise` mit Supportstatus, compiled Quelle, mechanischen Facts, Legacy-Rollen und Warnings ohne sichtbare Überlappung.

Nicht grün, bestehende Drift außerhalb AI005:

- `corepack pnpm --filter @netgrid/web test`: 354/356 Tests grün; 2 bestehende Assertions in `apps/web/app/api/cards/catalog-data.test.ts` erwarten noch `<412` `ai_supported` Karten und Proteus ohne AI-Hints. Der aktuelle Workspace liefert `564` `ai_supported` Karten und Proteus-Hints. AI005 ändert keine Proteus-Baseline.

Noch im Abschlusslauf zu prüfen:

- `git diff --check`
- `git diff --cached --check`
