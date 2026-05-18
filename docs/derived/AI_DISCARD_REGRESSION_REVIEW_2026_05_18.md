# AI Discard Regression Review 2026-05-18

## Ergebnis

Die normale KI-Discard-Choice nutzt nach den drei Discard-Paketen eine deterministische Keep-Value-Auswahl. Die Bewertung trennt Basiswert, situativen Planfit und Deck-Doctrine-Fit. Die Auswahl bleibt auf `PlayerView`, `LegalActions` und eigene `ownDeckDoctrine` beschränkt.

## Abgesicherte Szenarien

- Runner hält den einzigen relevanten Breaker statt der alten stabil ersten Option.
- Runner hält Economy bei Creditmangel auch dann, wenn die Doctrine Drucklinien bevorzugt.
- Runner-`rig_builder` und Runner-`hq_pressure` erhalten begrenzte Keep-Boni.
- Korp hält Agenda, ICE, Economy und Remote-Schutz höher als planlose Testkarten.
- Korp-`glacier` und ein erkennbarer `score_next_turn`-Kontext erhalten begrenzte Keep-Boni.
- Gleicher Input erzeugt dieselben `selectedOptionIds` und dieselbe Evidence.
- Gleichwertige Discard-Kandidaten nutzen weiterhin Label-/ID-Tie-Break.

## Grenzen

- Es gibt keine mehrzügige Vollplanung in der Discard-Phase.
- Die Action-Phase-Planwähler werden nicht aus der Discard-Phase heraus aufgerufen.
- Es werden keine gegnerischen verdeckten Karten, privaten Payloads oder nicht redigierten Debugdaten genutzt.
- Engine-Discard, Damage-Randomness, Replay und StateHash bleiben unverändert.
- Die Review deckt normale `resolve_choice`-Discard-Entscheidungen ab, nicht zufälligen Damage-Discard.

## Nachweise

- `corepack --% pnpm --filter @netgrid/ai test -- -t "discard|plan|doctrine"`
- `corepack pnpm --filter @netgrid/ai test -- --run`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `git diff --check`
