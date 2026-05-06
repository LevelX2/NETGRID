# V1.0.6K Card Release Implementation Review

Stand: 2026-05-06
Status: done

## Ergebnis

V1.0.6K aktiviert 20 weitere lokal geprüfte O:NR-v1-Karten. Die vorherigen 12 V1.0.5K-Karten bleiben aktiv; der Runtime-Katalog gibt damit 32 lokale O:NR-v1-Karten für Deckbau und Spiel frei.

## Umgesetzte Karten

Runner: Bodyweight™ Synthetic Blood, Jack 'n' Joe, Livewire's Contacts, Score!, Wild Card und WuTech Mem Chip.

Corp: Tycho Extension, Accounts Receivable, Annual Reviews, Closed Accounts, Datapool® by Zetatech, Day Shift, Efficiency Experts, Punitive Counterstrike, Scorched Earth, Urban Renewal, Filter, Fire Wall, Keeper und Mazer.

## Umsetzung

- `packages/catalog/src/index.ts`: V1.0.6K-Release-Gate ergänzt. Nicht freigegebene lokale O:NR-Karten bleiben im Runtime-Katalog demotiert.
- `packages/catalog/src/index.test.ts`: Katalogtest auf V1.0.5K plus V1.0.6K erweitert.
- `packages/decks/src/index.test.ts`: Deckvalidierung mit V1.0.6K-Karten ergänzt.
- `packages/engine/src/index.test.ts`: Engine-Smokes für Runner-Draw/Economy, WuTech, Wild Card, Corp-Operationen, Meat Damage und einfache ICE ergänzt.
- `apps/server/src/multiplayer.test.ts`: privater Matchstart-Smoke akzeptiert V1.0.6K-Decks weiter side-sicher.
- `data/manifests/card-implementation-manifest-1.0.6k.json`: versioniertes Manifest für die 20 neuen Karten.
- `data/scenarios/v106k-card-release-smoke.json`: Szenario-/Gatebeschreibung für das Kartenrelease.

## Grenzen

V1.0.6K führt keine neue Prevention-/Avoid-/Interrupt-/Replacement-Engine ein und nimmt keine Karten auf, deren aktuelle Engine-Werte noch vom bestätigten Text abweichen. Private lokale Text- und Bildartefakte unter `data/local/` und `data/local-assets/` bleiben ignoriert und nicht versioniert.

## Abschlusschecks

- `corepack pnpm --filter @netrunner/catalog test`: pass.
- `corepack pnpm --filter @netrunner/decks test`: pass.
- `corepack pnpm --filter @netrunner/engine test -- index.test.ts`: pass.
- `corepack pnpm --filter @netrunner/server test -- multiplayer.test.ts`: pass.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass. Turbopack meldet weiterhin die bekannte NFT-Trace-Warnung zur Web-App-Konfiguration, bricht den Build aber nicht ab.
