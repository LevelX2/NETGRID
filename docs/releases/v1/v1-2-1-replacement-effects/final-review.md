# V1.2.1 Final Review - Replacement Effects

Stand: 2026-05-08
Status: done

## Gate-Ergebnis

V1.2.1 ist implementiert und lokal verifiziert.

`V1_2_1_implemented: true`

`V1_2_1_verified: true`

`V1_2_1_done: true`

## Verifikationsbericht

| Gate | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/engine test -- index.test.ts` | pass, 103 Tests |
| `corepack pnpm --filter @netgrid/ai test -- index.test.ts` | pass, 32 Tests |
| `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts` | pass, 56 Tests |
| `corepack pnpm --filter @netgrid/web test` | pass, 49 Tests |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts` | pass, 14 Tests |
| `corepack pnpm lint` | pass |
| `corepack pnpm test` | pass, gesamter Workspace |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts` |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests nach Beenden eines bereits laufenden lokalen Dev-Servers |

## Pflichtgates

| Gate | Ergebnis |
| --- | --- |
| Hidden Info | pass: Replacement-Fenster und Events sind side-sicher |
| Replay/StateHash | pass: Replace und Pass erzeugen deterministische States |
| LegalActions/applyAction | pass: Choice, Side, StateVersion und Fenster werden erneut validiert |
| PlayerViews | pass: nur aktive Seite sieht das Replacement-Fenster |
| WebSocket/Reconnect | pass: pending Replacement bleibt redigiert rekonstruierbar |
| Undo | pass: ersetzte und originale Damage-Pfade respektieren bestehende Barrieren |
| KI-Inputs und AiDecisionDebug-Redaction | pass: KI entscheidet nur aus LegalActions/PlayerView |
| Multiplayer/Idempotency/stale StateVersion | pass: doppelte Requests und stale Choices sind abgesichert |
| No-Scope-Regression | pass: keine neuen Karten, KI-Decks, Assets, Plattformfeatures oder Spezialzonen |

## Finaler Befund

V1.2.1 erfüllt den getrennten Replacement-Vertrag nach grünem V1.2.0-Gate. Replacement Effects sind als Foundation vorhanden, ohne Prevention/Avoid zu verbreitern und ohne Runtime-Karten zu aktivieren.

## Restpunkte

Keine blockierenden Restpunkte für V1.2.1. Spätere Releases können echte Karten- oder weitere Eventfamilien auf diese Foundation setzen, brauchen dafür aber eigene Requirements, Resolver, Visibility-, Replay-/StateHash-, AI- und Multiplayer-Gates.
