# V1.1.2K Card Release Implementation Review

Stand: 2026-05-07
Status: done

## Ergebnis

V1.1.2K aktiviert genau 20 weitere lokal geprüfte O:NR-v1-Karten. Die vorherigen V1.0.5K- und V1.0.6K-Freigaben bleiben aktiv; der Runtime-Katalog gibt damit 52 lokale O:NR-v1-Karten für privaten Deckbau und Spiel frei.

## Finale Kartenliste

Runner: Black Dahlia, Codecracker, Cyfermaster™, Loony Goon, Shaka und Wizard's Book.

Corp ICE: Laser Wire, Nerve Labyrinth, π in the 'Face, Quandary, Razor Wire, Reinforced Wall, Rock Is Strong, Scramble, Shotgun Wire, Sleeper, Wall of Ice und Wall of Static.

Corp Operations: Netwatch Credit Voucher und Night Shift.

## Umsetzung

- `packages/shared/src/index.ts`: alle 20 Kartendefinitionen waren bereits vorhanden; keine neue Mechanikfamilie wurde ergänzt.
- `packages/catalog/src/index.ts`: V1.1.2K-Release-Gate ergänzt. Nur die 20 V1.1.2K-Karten werden zusätzlich promoted.
- `packages/catalog/src/index.test.ts`: Runtime-Gate auf V1.0.5K, V1.0.6K und V1.1.2K erweitert; nicht freigegebene lokale O:NR-Karten bleiben gesperrt.
- `packages/decks/src/index.test.ts`: Deckvalidierung mit V1.1.2K-Karten ergänzt.
- `packages/engine/src/index.test.ts`: Engine-Smokes für Kartendefinitionen, Breaker, Operationen, ICE, Visibility und Replay ergänzt.
- `apps/server/src/multiplayer.test.ts`: privater Matchstart-Smoke akzeptiert V1.1.2K-Decks side-sicher.
- `packages/ai/src/index.test.ts`: KI-Smoke über LegalActions/PlayerViews mit V1.1.2K-Decks ergänzt.
- `data/manifests/card-implementation-manifest-1.1.2k.json`: versioniertes Manifest für die 20 neuen Karten.
- `data/scenarios/v112k-card-release-smoke.json`: Szenario-/Gatebeschreibung für das Kartenrelease.

## Abschlusschecks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test -- --run`: pass, 94 Tests.
- `corepack pnpm --filter @netgrid/catalog test -- --run`: pass, 8 Tests.
- `corepack pnpm --filter @netgrid/decks test -- --run`: pass, 8 Tests.
- `corepack pnpm --filter @netgrid/server test -- --run`: pass, 53 Tests.
- `corepack pnpm --filter @netgrid/ai test -- --run`: pass, 30 Tests.
- `corepack pnpm test`: pass, Workspace-Tests plus 42 Root-Spec-Tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts`.

## Grenzen

V1.1.2K führt keine weiteren Karten, kein V1.1.3, keine neuen Engine-Mechanikfamilien, keine Prevention/Avoid/Replacement-Pfade, keine generischen Asset-/Node-/Upgrade-Fähigkeiten, keine scored-agenda-Aktivfähigkeiten, keine kartenbezogenen Zufallswerte und keine offiziellen Assets oder externen Kartendatenquellen ein.

Gate-Ergebnis: `V1_1_2K_card_release_done: true`.
