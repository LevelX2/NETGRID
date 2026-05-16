# Originalset-Spotcheck 2026-05-16 Corp Operation/Asset Node

Job: `spotcheck-2026-05-16-corp-operation-asset-node`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Corp-Operationen und Asset-/Node-Karten wurden gegen Side-/StateVersion-Revalidation, Play-/Rez-/Aktivierungs-Timing, Source- und Target-Drift, PublicPayload-Leaks sowie Replay/StateHash geprüft.

Commit-Status: `done`. Der lokale Commit wurde erfolgreich erstellt.

## Umgesetzte Härtungen

- Night Shift und Trojan Horse schreiben sichere Ergebnisfelder für Draw/Credit bzw. Tag-Ergebnis in den PublicPayload-Kontext.
- Overtime Incentives bleibt als LegalAction-only Aktionsgewinn mit öffentlichem Ergebnis abgesichert.
- Blood Cat startet Trace 5 source-bound aus rezzed Asset-Zustand.
- Cowboy Sysop revalidiert sichtbare installierte Runner-Ziele und lehnt entfernte Ziele ab.
- Braindance Campaign, ESA Contract und Remote Facility sind als rezzed Asset-Aktionen replay-sicher geprüft.
- Remote Facility und andere `v1920AssetAbility`-Aktionen erhalten eine öffentliche Source-Erkennung für sichtbare rezzed Quellen.
- Department of Truth Enhancement bleibt im generischen Access-/Trash-Pfad payload- und replay-safe.
- Encoder, Inc. reduziert Code-Gate-Rez-Kosten nur als rezzed Quelle und nennt die öffentliche Modifikatorquelle.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün.
