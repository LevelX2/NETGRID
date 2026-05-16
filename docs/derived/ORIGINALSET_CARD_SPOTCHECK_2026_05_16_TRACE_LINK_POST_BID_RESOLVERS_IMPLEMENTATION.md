# Originalset-Spotcheck 2026-05-16 Trace Link Post-Bid Resolvers Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-16-trace-link-post-bid-resolvers.md`

Jobstatus: `done`.

Dieser Folgejob erledigt die verbliebene Removal Condition aus `spotcheck-2026-05-15-trace-cache-ambush` für `Signpost` und `The Springboard`: Beide Karten nutzen jetzt ein echtes Runner-Choice-Fenster nach offengelegtem Corp- und Runner-Bid, statt statische oder generische Link-/Reveal-Pfade zu verwenden.

## Umgesetzte Fixes

| Karte | Card ID | Ergebnis |
|---|---|---|
| Signpost | `onr_v1_063_signpost` | Post-bid Trace-Link-Choice umgesetzt: installierte Quelle, Runner-Zahlung von 1 Credit, einmal pro Trace, +2 Link und Revalidation von Side, StateVersion, Quelle und Trace-Kontext. |
| The Springboard | `onr_v1_181_the-springboard` | Statischen Base-Link entfernt und durch post-bid Trace-Link-Choice ersetzt: installierte Resource, Runner-Zahlung von 1 Credit, einmal pro Trace, +1 Link und Revalidation von Side, StateVersion, Quelle und Trace-Kontext. |

## Härtungen

- Trace-Status kennt ein eigenes `post_bid_link`-Fenster mit gespeicherten verwendeten Quellen und kumuliertem Post-Bid-Link-Bonus.
- `applyAction` akzeptiert post-bid Link-Choices nur für den Runner, nur zur aktuellen StateVersion und nur für installierte, noch gültige Quellen.
- Öffentliche Events und Kontextdaten nennen nur sichere Quelle, Kosten, Link-Delta und Gesamtbonus; private Hand-, Stack- oder R&D-Informationen werden nicht offengelegt.
- Die Runner-KI bevorzugt nach offengelegten Bids den besten verfügbaren post-bid Trace-Link-Source-Choice und fällt nur ohne sinnvolle Quelle auf `pass` zurück.
- Manifest, AI-Hints und das V1.9.14-Trace-Szenario wurden an den post-bid-Vertrag angepasst.

## Checks

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` - grün, 471 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 2 Dateien / 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` - grün, 1 Datei / 120 Tests.
- `corepack pnpm typecheck` - grün.
