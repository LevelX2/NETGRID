# MVP 0.98 Implementation Review - Identities, Modifier und Hidden-Zone-Tools

Status: bestanden
Stand: 2026-05-04

## Umsetzungsbefund

V0.98 wurde in zwei internen Gates umgesetzt:

- V0.98a: lokale Runner-/Corp-Identities, Setup-Credits, deterministische Usage-Marker, Runner-Base-Link und statischer Memory-Modifier.
- V0.98b: enge Harness-Karten fuer Search, Reveal, Expose, Arrange, Shuffle und Swap.

Die Engine bleibt die einzige Regelautoritaet. UI, AI und Server erhalten nur PlayerViews, PublicEvents und LegalActions; `applyAction` revalidiert StateVersion, Side, ActionId, ChoiceId, Optionsmenge und Auswahlanzahl erneut.

## Hidden-Info-Befund

- Search und Arrange nutzen `PendingChoice` mit `visibility: hidden_info_barrier`.
- Private Optionslabels erscheinen nur in der PlayerView der berechtigten Side.
- PublicEvents fuer Search/Arrange/Swap enthalten keine privaten Kartentitel oder private Reihenfolge.
- Reveal und Expose sind bewusste PublicEvents mit genau freigegebenen Kartendaten.
- Expose veraendert weder `faceup` noch `rezzed`.
- Multiplayer-Reconnect zeigt Runner-Search-Choices nur dem Runner.
- Undo nach Hidden-Zone-Search wird blockiert.

## Determinismus-Befund

- Identity-Setup laeuft vor dem initialen `game_created`-Hash.
- Identity-Usage-Marker sind Teil des StateHash.
- Search-Shuffle nutzt `shuffleIds`, Seed, RandomCounter und RandomDrawRecords.
- Swap nutzt keine Randomness.
- Replay-Tests reproduzieren StateHashes fuer Search, Arrange, Swap und die Identity-Startwerte.

## No-Scope-Pruefung

Nicht umgesetzt oder freigeschaltet:

- Hosting.
- Viren und Purge.
- Counter-Familien.
- Recurring Credits und Bad Publicity.
- Prevention, Avoid, Interrupts und Replacement.
- Set Aside, Remove from Game, Ownership-/Control-Wechsel.
- Deckbuilding-/Formatregeln ausserhalb der vorhandenen Demo-Gates.

## Risiken und Grenzen

- Search ist absichtlich auf Runner-Stack-Programme beschraenkt.
- Arrange ist absichtlich auf die Top 2 des Runner-Stacks beschraenkt.
- Swap ist absichtlich auf Corp HQ/R&D beschraenkt.
- Identity-Faehigkeiten decken Setup und Static Modifier ab, aber keine generischen paid/triggered Identity-Fenster.

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass, 54 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass, 23 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass, 20 Tests.

## Review-Ergebnis

`ready_for_hardening: true`

`ready_for_MVP_0.98_final_review: true`
