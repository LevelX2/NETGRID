# MVP 0.4 Final Review

Status: passed  
Stand: 2026-05-03

## Ergebnis

`MVP_0.4_done: true`

MVP 0.4 ist abgeschlossen. Die Anwendung hat jetzt einen kleinen kontrollierten internen Kartenpool mit V0.4-Decks, eingeschränkter Deckvalidierung, Hardware, einfachem Upgrade-Support und Tags. Damage bleibt absichtlich draußen.

## Final-Gates

| Gate | Ergebnis |
|---|---|
| V0.4 Datenartefakte | pass |
| Manifest-/Testzuordnung | pass |
| Deckvalidierung | pass |
| Safe Card Batch | pass |
| Hardware | pass |
| Upgrade Visibility/Access/Trash | pass |
| Tags und Remove Tag | pass |
| Tag-Punishment-Bedingung | pass |
| AI-/Simulation-Regression | pass |
| Legacy MVP-0.1/0.2/0.3 Regression | pass |
| Build/Test | pass |

## Checks

- `corepack pnpm --filter @netrunner/engine test`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## Annahmen

- V0.4-Decks nutzen `agendaPointsToWin = 7`; Legacy-Demo-Decks bleiben bei 6.
- Upgrades haben in V0.4 keine Servermodifier.
- Tags entstehen direkt durch interne Testkarten; Trace ist nicht implementiert.

## Deferred

- Damage als V0.4.x oder spätere Phase.
- Resources und Resource-Trash.
- Freier Deckbuilder.
- Breitere Kartenpool- und Regelmechaniken.

## Folgegate

`ready_for_next_scope_decision: true`

Der nächste fachliche Schritt sollte nicht automatisch weitere Regelbreite hinzufügen, sondern zuerst bewusst entscheiden, ob V0.4.x Damage, V0.5 Replay/UX oder ein anderer Härtungsstrang folgt.
