# AI223 Practical Tactic Overlay

Datum: 2026-06-21

## Ergebnis

AI223 implementiert einen begrenzten Immediate-Delta-/Taktik-Entscheider als Overlay hinter der bestehenden AI-Runtime.

Eigenschaften:

- opt-in über `practicalTacticOverlay.enabled`,
- keine neue LegalAction-Erzeugung,
- Auswahl nur aus `input.legalActions`,
- keine Hidden-Info-Erweiterung,
- keine generischen Credit-/Draw-/Run-Mali,
- produktive Action-Änderung gegen eingefrorene Legacy-Referenz möglich.

## Abgedeckte Taktiken

- Agenda stehlen,
- sicher scoren,
- wertvolle Access-Karte trashen,
- sichtbare Coverage installieren,
- echtes Punish-Fenster nutzen,
- stale Punish aufgeben,
- erreichbaren Run fortsetzen,
- stale Run zugunsten konkreter Vorbereitung vermeiden.

## Benchmark-Gate

| Selector | Treffer |
|---|---:|
| Frozen Legacy | 0/32 |
| Practical Tactic Overlay | 32/32 |

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

## Cutover-Status

Noch kein Default-Cutover. AI224 muss den Kandidaten gegen eine eingefrorene Baseline paarweise testen.

