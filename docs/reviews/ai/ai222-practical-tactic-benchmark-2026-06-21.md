# AI222 Practical Tactic Benchmark

Datum: 2026-06-21

## Ergebnis

AI222 legt einen kompakten Taktik-Benchmark mit 32 konkreten Entscheidungssituationen an. Jede Situation enthält:

- einen side-safe `AiDecisionInput`,
- die aktuell angebotenen `LegalActions`,
- akzeptable `actionId`s,
- schlechte `actionId`s,
- eine kurze fachliche Begründung,
- eine eingefrorene Legacy-Referenzaktion.

## Abgedeckte Bereiche

- sicher scoren,
- Agenda stehlen,
- wertvolle Access-Karte trashen,
- sichtbaren fehlenden Breaker installieren,
- echtes Punish-Fenster nutzen,
- Punish ohne Tag-Fenster aufgeben,
- erreichbaren Run fortsetzen,
- sinnlosen wiederholten Run vermeiden.

## Legacy-Baseline

Die eingefrorene Legacy-Referenz trifft 0/32 Fälle.

Das ist absichtlich ein Taktik-Korpus für konkrete bisherige Fehlentscheidungsmuster, kein allgemeiner Spielstärkebericht. Erfolg in AI223 muss sich daran messen, dass ein produktiver Entscheider diese Fälle besser auswählt.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/practical-tactic-benchmark.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

