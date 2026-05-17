---
activityId: act-2026-05-17-rarity-catalog-deck-filters
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
releaseTarget: catalog UX
blockedBy: []
resultArtifacts:
  - apps/web/app/catalog-ui.ts
  - apps/web/app/catalog-ui.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm install --frozen-lockfile
  - corepack pnpm --filter @netgrid/web exec vitest run app/catalog-ui.test.ts app/api/cards/catalog-data.test.ts --passWithNoTests
  - corepack pnpm --filter @netgrid/web typecheck
---

# Rarität in Katalogdetails anzeigen und in Katalog/Deckeditor filtern

## Ziel

Die bereits vorhandene Kartenrarität soll in der Oberfläche nutzbar werden: Im Katalog muss die Rarität in den Detailinformationen sichtbar sein, und Katalog sowie Deckeditor sollen nach Rarität filtern können.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-17: Rarität ist laut Umsetzung in den Kartendaten vorhanden, aber in der Oberfläche noch nicht sichtbar; mindestens Katalogdetails sollen sie zeigen, wichtiger ist ein Raritätsfilter im Deckeditor-Katalog.
- Datenlage geprüft: Das Vorgängerpaket `act-2026-05-17-card-rarity-metadata-import` ist in `docs/activities/done/` abgeschlossen.
- `docs/codex/CODEX_STATUS.md` und `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md` dokumentieren `rarity` als display-only Catalog-Metadatum mit Codes `common`, `uncommon`, `rare`, `vital` und deutschen Labels.
- Repository-Spotcheck: `packages/catalog/src/rarity.ts`, `packages/catalog/src/catalog-types.ts`, `packages/catalog/src/index.ts` und `apps/web/app/api/cards/catalog-data.test.ts` enthalten Raritätsdaten/API-Abdeckung; eine Suche in `apps/web` findet Rarität aktuell nur in API-Tests, nicht in sichtbaren UI-Komponenten.
- Aktuelle Web-UI hat bereits Typ- und Quellenfilter in Katalog und Deckeditor; Rarität soll daran anschließen.

## Scope

- Raritätslabel in den Katalog-Detailinformationen anzeigen, ohne die Oberfläche zu überladen.
- Katalogfilter für Rarität ergänzen.
- Deckeditor-/Deckbau-Kartenliste nach Rarität filterbar machen; das ist wichtiger als eine dauerhafte Raritätsanzeige in jeder Deckeditor-Listenzeile.
- Filterzählungen und leere Zustände sauber halten.
- Deutsche UI-Begriffe verwenden: `Häufig`, `Ungewöhnlich`, `Selten`, `Vital`.
- UI- und API-/Filtertests für Raritätsfilter ergänzen oder bestehende Catalog-/Deckeditor-Filtertests erweitern.

## Nicht im Scope

- Keine Raritätsdatenextraktion.
- Kein neuer Parser und keine parallele UI-only-Raritätsliste; die vorhandenen Catalog-API-/Snapshot-Daten sind zu verwenden.
- Keine Deckbau-Regel oder Limitierung nach Rarität.
- Keine Änderung an Matchstart, Engine, LegalActions, Replay, StateHash oder KI.
- Kein Redesign des gesamten Katalogs oder Deckeditors.

## Akzeptanzkriterien

- [x] Katalog kann Karten nach Rarität filtern.
- [x] Deckeditor kann verfügbare Karten nach Rarität filtern.
- [x] Katalog-Detailinformationen zeigen die Rarität mit deutschem Label an.
- [x] Filteroptionen verwenden die zentralen deutschen Labels `Häufig`, `Ungewöhnlich`, `Selten`, `Vital`.
- [x] Karten ohne Raritätswert werden robust behandelt.
- [x] Bestehende Typ-, Status- und Quellenfilter bleiben regressionsfrei.
- [x] Es gibt Regressionstests oder einen vergleichbaren UI/API-Testnachweis für Raritätsfilter und Detailanzeige.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Vor Umsetzung `apps/web/app/catalog-ui.ts`, `apps/web/app/page.tsx` und Catalog-API-Filterdaten prüfen.
- Für Datenzugriff an vorhandene `rarity`-Felder aus `CatalogCard`/`CatalogCardSummary` anschließen.
- Filterzustand kompakt halten; keine langen Erklärungstexte in der UI.

## Ergebnisnotiz

Erledigt: Katalog und Deckeditor nutzen die vorhandenen `rarity`-Metadaten für Raritätsfilter mit deutschen Labels. Katalogdetails zeigen die Rarität als kompaktes Metadatum; fehlende oder unbekannte Raritätswerte bleiben robust und brechen Filterzählungen nicht.

Checks:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm --filter @netgrid/web exec vitest run app/catalog-ui.test.ts app/api/cards/catalog-data.test.ts --passWithNoTests`
- `corepack pnpm --filter @netgrid/web typecheck`

Offene Folgepunkte: keine im Scope dieses Pakets.
