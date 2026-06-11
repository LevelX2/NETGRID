# AI089 Root-Test Closure Review 2026-06-11

## Status

`done`

## Ausgangsbefund

AI088 reproduzierte die Root-/Engine-Fehler aus der Ergebnisanalyse:

- Proteus-Manifestdrift: 154 Karten mit `ai_supported`.
- Hidden/R&D/Archives- und V1.9.9-Access-Smokes mit `Missing legal action`.
- Corolla Speed Chip: erwarteter Runner-Credit im Testsetup war 0 statt 1.
- PlayerView remote root order: Breach-Queue war nach `start_run` noch nicht geöffnet.

Nach der Engine-Reparatur lief der Root-Test weiter und deckte zusätzliche Web-Catalog-Smokes auf, die ebenfalls auf den aktuellen AI-/Proteus-Supportstand angepasst werden mussten.

## Änderungen

### Proteus AI-Support-Vertrag

`packages/engine/src/card-implementations/coverage.test.ts`

- Der Coverage-Test gleicht `ai_supported` jetzt gegen den vorhandenen Implementierungsstand ab.
- Implementierte Proteus-Karten müssen `ai_supported: true` haben.
- Nicht implementierte Proteus-Karten bleiben `ai_supported: false`.

Grund: `@netgrid/catalog` promoted Proteus inzwischen bewusst für Human-vs-Human und AI-Support. Der Engine-Test war noch auf den alten `false`-Vertrag fixiert.

### Access-Smokes und Root-Rez-Fenster

Betroffene Tests:

- `packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts`
- `packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts`
- `packages/engine/src/game/view/player-view-projection.test.ts`

Änderungen:

- Tests passieren das vorhandene Root-Rez-/Jack-out-Fenster vor `access_card`, wenn der aktuelle Regelstand dieses Fenster öffnet.
- Archives-Ambush-Smokes erwarten jetzt den bestehenden `archives_breach_reveal`/Auto-Access-Vertrag statt eine danach nicht mehr legale `access_card`-Aktion.
- Schaden/Tags bleiben in den Archives-Fällen unverändert aus.

Grund: Die Rules Engine erzeugt nach Breach-Start keine `access_card`-LegalAction mehr, wenn Archives-Karten ohne entscheidungspflichtigen Effekt automatisch verarbeitet wurden.

### Corolla Speed Chip

`packages/engine/src/index-tests/originalset/agenda-scorearea-recurring.test.ts`

- Das Testsetup gibt dem Runner 2 Credits statt 1 Credit.
- Nach der Installation wird explizit geprüft, dass 1 normaler Credit bleibt.
- Der erste Killer-Pump muss weiterhin den Corolla-`bit` ausgeben und den normalen Credit erhalten.

Grund: Corolla hat `installCost: 1`. Das alte Setup konnte den Zahlungsquellenvertrag nach Installkosten nicht mehr sauber prüfen.

### Web-Catalog-Smokes

`apps/web/app/api/cards/catalog-data.test.ts`

- `status=ai_supported` erwartet jetzt die aktive `ai_supported`-Supportmenge inklusive Proteus.
- Proteus-Detail- und Filtertests erwarten `ai_supported: true` und AI-Hints.
- AI-Inspector-Smokes wurden auf die aktuellen Kategorien und Klassifikationen umgestellt:
  - `AI Boon`: `runner.rig_first` steckt in `planRolesClassification`, nicht mehr in `lineSupport`.
  - `Deep Thought`: Warnkategorie ist `descriptor_gap`.
  - `Bodyweight Synthetic Blood`: Summary hat keine Warnungen.
  - `Rigged Investments`: Rollen sind `economy` und `resource`; Counter-Bezug bleibt in Mechanics/RiskTags.

Grund: Root deckte nach Engine-Green zusätzliche Testdrifts auf, die dieselbe Supportdaten-Promotion betrafen.

## Verifikation

| Check | Status |
| --- | --- |
| `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts` | grün |
| `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/agenda-scorearea-recurring.test.ts` | grün |
| `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/hidden-access-run-regressions.test.ts` | grün |
| `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts src/game/view/player-view-projection.test.ts` | grün |
| `corepack pnpm --filter @netgrid/engine test` | grün, 157 Dateien / 1449 Tests |
| `corepack pnpm --filter @netgrid/web test` | grün, 33 Dateien / 413 Tests |
| `corepack pnpm test` | grün |
| `corepack pnpm -r --if-present run typecheck` | grün |

## Schluss

AI089 schließt die Root-Test-Regressionslage auf aktuellem HEAD. Die Reparaturen lockern keine Engine-Regeln, erzeugen keine neuen LegalActions außerhalb der Rules Engine und ändern keine Runtime-Semantik; sie aktualisieren Testverträge auf den aktuellen Proteus-/AI-Support- und Access-Timing-Stand.

