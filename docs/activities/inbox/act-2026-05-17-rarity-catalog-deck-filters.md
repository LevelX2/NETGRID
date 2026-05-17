---
activityId: act-2026-05-17-rarity-catalog-deck-filters
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: catalog UX
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Katalog kann Karten nach Rarität filtern.
- [ ] Deckeditor kann verfügbare Karten nach Rarität filtern.
- [ ] Katalog-Detailinformationen zeigen die Rarität mit deutschem Label an.
- [ ] Filteroptionen verwenden die zentralen deutschen Labels `Häufig`, `Ungewöhnlich`, `Selten`, `Vital`.
- [ ] Karten ohne Raritätswert werden robust behandelt.
- [ ] Bestehende Typ-, Status- und Quellenfilter bleiben regressionsfrei.
- [ ] Es gibt Regressionstests oder einen vergleichbaren UI/API-Testnachweis für Raritätsfilter und Detailanzeige.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Vor Umsetzung `apps/web/app/catalog-ui.ts`, `apps/web/app/page.tsx` und Catalog-API-Filterdaten prüfen.
- Für Datenzugriff an vorhandene `rarity`-Felder aus `CatalogCard`/`CatalogCardSummary` anschließen.
- Filterzustand kompakt halten; keine langen Erklärungstexte in der UI.

## Ergebnisnotiz

Noch offen.
