# AI201 LegalAction Witness Contract v1

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI201 definiert eine read-only `LegalActionWitness`-Struktur fuer Engine-bereitgestellte `LegalAction`-Eintraege. Die Witness-Schicht beschreibt vorhandene LegalActions, erzeugt keine Legalitaet und aendert keine Runtime-Entscheidung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Sample Witnesses | 3 |
| Redaction safe | 1 |
| No-target Witnesses | 1 |
| Server-target Witnesses | 1 |
| Hidden-blocked Witnesses | 1 |
| Runtime geaendert | 0 |

## Contract

- `actionId`, `stateVersion`, `side` und `actionType` stammen aus der vorhandenen `LegalAction`.
- `sourceRef`, `abilityRef`, `targetRef`, `choiceRef`, `costProfile` und `timingProfile` sind redaction-safe Projektionen.
- Hidden-Info-Marker fuehren zu `hidden_blocked` und Blockern, nicht zu privaten IDs.
- Basic no-target Actions erhalten `targetRef:none`.
- Einfache Server-Actions koennen `targetRef:server:<serverId>` erhalten.

## Schluss

AI201 schliesst den ersten Witness-Contract ohne Runtime-Wirkung. AI202 baut darauf einen First-Class `TargetRef`-Vertrag auf.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai201-legalaction-witness-contract-v1.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/legalaction-witness.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
