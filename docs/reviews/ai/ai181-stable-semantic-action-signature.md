# AI181 Stable Semantic Action Signature

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI181 definiert eine stabile, redaction-safe `SemanticActionSignature` für LegalAction-nahe Opportunity-Alternativen. Die Signatur ist Diagnose-Evidence und ändert keine Runtime-Entscheidung.

## Umsetzung

- Neuer AI-interner Helper `packages/ai/src/semantic-action-signature.ts`.
- Neuer Test `packages/ai/src/semantic-action-signature.test.ts`.
- `scripts/build-ai170-opportunity-state-snapshots.ts` ergänzt jede kompaktierte Snapshot-Alternative um `semanticActionSignature`.
- AI170-Snapshot-Artefakte wurden regeneriert.

## Signaturfelder

| Feld | Quelle | Redaction-Regel |
| --- | --- | --- |
| `actionType` | vorhandene Snapshot-Alternative | erlaubt |
| `semanticActionType` | vorhandene Snapshot-Alternative | erlaubt |
| `sourceKind` | vorhandene Snapshot-Alternative | erlaubt |
| `sourceDefinitionId` | nur wenn bereits side-safe vorhanden | optional |
| `abilityId` | nur wenn bereits side-safe vorhanden | optional |
| `targetIdentity` | AI181 konservativer Seed | unbekannt bleibt unbekannt |
| `costClass` | HardGate-/Economy-Klasse | keine Rohkosten-Payloads |
| `timingClass` | Snapshot-Kontextklasse | keine Runtime-Payloads |
| `serverId` / `choiceOptionId` | erst bei side-safe Quelle | optional |
| `signatureKey` | deterministische Verkettung der obigen Felder | keine Hidden-Info |

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Opportunity-Fälle | 17 |
| angeforderte Snapshots | 19 |
| verfügbare Snapshots | 17 |
| signierte Alternativen | 76 |
| Redaction safe | 1 |

AI181 beseitigt noch nicht den Zielidentitätsblocker. `targetIdentity` ist in diesem Paket absichtlich konservativ: zielirrelevante Aktionen erhalten `none`, Hidden-Info-Kontexte `unknown_hidden_blocked`, Run-/Choice-Aktionen ohne side-safe Ziel nur `server:unknown` beziehungsweise `choice:unknown`. AI182 muss daraus die side-safe TargetIdentity v1 ableiten.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai170-opportunity-state-snapshots.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-action-signature.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

Hinweis: `corepack pnpm --filter @netgrid/ai test -- semantic-action-signature` startet in der aktuellen Paketkonfiguration die gesamte AI-Suite. Dabei timeouteten bestehende lange Simulation-Smokes in `src/index.test.ts` und `src/simulation/simulation-harness.test.ts`; der direkte neue Signaturtest ist grün.
