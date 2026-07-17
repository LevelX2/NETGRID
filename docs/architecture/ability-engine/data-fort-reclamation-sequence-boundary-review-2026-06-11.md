# Data Fort Reclamation Sequence Boundary Review 2026-06-11

## Status

`completed_by_ordered_sequence_2026-07-17`

## Zweck

Dieser Review hielt die frühere MVP-Grenze der `Data Fort Reclamation`-Runtime
fest. Die benannte Folgearbeit ist am 2026-07-17 umgesetzt; dieses Artefakt
beschreibt den nun führenden Sequenzvertrag.

## Quellen

- `packages/engine/src/card-implementations/onr-v1/corp/agendas/data-fort-reclamation.ts`
- `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`
- `packages/engine/src/game/corp/install-rez-sequence-handlers.test.ts`
- `packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/data-fort-reclamation-runtime-contract.md`
- `docs/source/Netrunner Errata 1.70.md`
- `data/cards/originalset-v1-cards.json`

## Kartentext und Errata-Lage

Der lokale CardImplementation-Kommentar hält den relevanten Text fest:

> Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.

Die Errata-Quelle bestätigt zwei Vertragsgrenzen:

- Die Korp darf zusätzlich Credits aus dem eigenen Creditpool zum Installieren/Rezzing verwenden.
- Der Effekt erzeugt keine zusätzlichen Aktionen.

## Führender Runtime-Vertrag

Die Runtime modelliert den Effekt als persistente, Korp-private Sequenz:

1. Die Korp wählt bis zu vier installierbare HQ-Karten in Klickreihenfolge.
2. Eine leere Auswahl erstellt kein Remote und gibt den gesamten temporären
   Creditpool zurück.
3. Bei einer nicht leeren Auswahl entsteht genau ein neues Data Fort.
4. Jede gewählte Karte wird einzeln und in der gewählten Reihenfolge
   installiert. Root-Kapazität bleibt vorab und unmittelbar vor dem Schritt
   geprüft.
5. Region- und sonstige Rez-on-install-Karten durchlaufen ihr Pflichtfenster;
   alle anderen rezbaren Karten erhalten unmittelbar nach ihrer Installation
   eine eigene optionale Rez-Choice.
6. Rez-Kosten verbrauchen zuerst den separaten 10-Credit-Effektpool und
   danach Korp-Credits. Erst nach der letzten Karte wird der ungenutzte Rest
   zurückgegeben.

Die Auswahl, jedes Rez-Fenster sowie jeder Folgeschritt bleiben an
`LegalActions`, Choice-ID und `stateVersion` gebunden. Der öffentliche
Payload enthält nur sichere Sequenzzählwerte; HQ-Identitäten und nicht
öffentliche Karten bleiben Korp-privat.

## Entscheidung

Die frühere Batch-Rez-MVP-Grenze ist aufgehoben. Die damaligen Removal
Conditions sind erfüllt: geordnete Einzelinstallationen, Pflicht- und
Optional-Rezfenster, persistenter Effektpool, Korp-Credits als Zusatzquelle,
Root-/Regionspfad, Hidden-Info-Barriere sowie Replay-/StateHash- und
stale-/wrong-side-Revalidation sind Bestandteil des aktuellen Vertrags.

## Teststand

Die Sequenz wird mindestens durch die folgenden fokussierten Checks abgesichert:

```powershell
corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts
corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/per-card-longtail.test.ts
corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts
```
