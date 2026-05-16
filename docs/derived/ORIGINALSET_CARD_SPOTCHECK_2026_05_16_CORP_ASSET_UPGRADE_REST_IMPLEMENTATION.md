# Originalset-Spotcheck 2026-05-16 Corp Asset/Upgrade Rest

Job: `spotcheck-2026-05-16-corp-asset-upgrade-rest`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Corp-Asset-/Upgrade-Karten wurden gegen Rezzed-Gates, Serverbindung, Source- und Target-Drift, Side-/StateVersion-Revalidation, PublicPayload-Leaks sowie Replay/StateHash geprüft.

Commit-Status: `commit_pending`. Staging und lokaler Commit sind durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; Ursache ist weiterhin die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git`.

## Umgesetzte Härtungen

- Rockerboy Promotion bleibt eine rezzed installierte Economy-Asset-Source; Wrong-Side, stale `stateVersion`, entfernte Source, PublicPayload und Replay sind abgedeckt.
- Chester Mix reduziert ICE-Installkosten nur auf dem eigenen Server; ein serverfremder Install-Pfad erhält keine Chester-Reduktion.
- Chimera revalidiert beim Auflösen der Daemon-Choice die aktuell accessed Source und lehnt entfernte/verschobene Chimera-Quellen ab; sichere öffentliche Choice-Ergebnisse enthalten nur Definition-IDs.
- Namatoki Plaza ist als generisches rezzed Upgrade im Access-/Trash-Pfad payload- und replay-safe abgedeckt.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
