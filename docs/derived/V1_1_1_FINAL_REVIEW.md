# V1.1.1 Final Review - Discard, Handlimit und Core Damage

Stand: 2026-05-07
Status: done

## Gate-Ergebnis

V1.1.1 ist vollständig implementiert und lokal verifiziert.

`V1_1_1_requirements_freeze_done: true`

`V1_1_1_implemented: true`

`V1_1_1_verified: true`

`V1_1_1_done: true`

## Verifikationsbericht

| Gate | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netrunner/shared typecheck` | pass |
| `corepack pnpm --filter @netrunner/engine test -- --run` | pass, 88 Tests |
| `corepack pnpm --filter @netrunner/server test -- --run` | pass, 52 Tests |
| `corepack pnpm --filter @netrunner/ai test -- --run` | pass, 29 Tests |
| `corepack pnpm --filter @netrunner/web test -- --run` | pass, 38 Tests |
| `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts` | pass, 14 Tests |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass, Workspace-Tests plus Root-Specs |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts` |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests |

## Finaler Befund

- Requirements Freeze: `V1_1_1_REQUIREMENTS.md`, `DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md`, `V1_1_1_TEST_MATRIX.md` und `V1_1_1_REQUIREMENTS_REVIEW.md` liegen vor; Review-Ergebnis `ready_for_implementation: true`.
- Discard: Korp und Runner haben eigene Discard-Phasen, private Choices und side-sichere Events.
- Handlimit: Engine-Wert, PlayerView-Vertrag und Web-Anzeige sind dynamisch.
- Core Damage: spielbarer Damage-Typ, reduziert Runner-Handlimit dauerhaft und bleibt deterministisch.
- Flatline: negativer Runner-Handlimit-Check erfolgt am Beginn des Runner-Discard-Steps.
- Hidden Info: HQ-Discard, Damage-Trash, Reconnect, Undo, WebSocket-Payloads und UI bleiben redigiert.
- Replay/StateHash: neue Phasen, Choices und Core-Damage-Zustand bleiben deterministisch.
- Multiplayer/Reconnect/Undo: Discard-Choice und Core-Damage-Status sind side-sicher getestet.
- AI: Discard wird LegalActions-/PlayerView-only und deterministisch entschieden.
- UI: Handlimit, Core Damage und Discard-Auswahl sind sichtbar, ohne private gegnerische Karten zu leaken.

## Scope-Abgleich

Keine Damage Prevention, kein Avoid, keine Interrupts, keine Replacement Effects, kein Full Archives Access, keine Runner-Deckout-Siegbedingung, keine offiziellen Assets und keine Plattformfeatures wurden eingeführt.

## Bekannte Abweichungen

- Die Build-Warnung zu Turbopack/NFT in der Next-Konfiguration besteht weiter als bekannte nicht-blockierende Warnung.
- Der E2E-Gate deckte Testdrift auf: Reconnect erfolgt inzwischen ueber gespeicherte Sitzung/Reload statt sichtbarem Button, und Kartenaktionen im Browser-Harness werden nach Kartenauswahl gesucht. Die finalen E2E-Tests sind angepasst und grün.

## Restpunkte

- Keine blockierenden Restpunkte fuer V1.1.1.
- Naechster geplanter Gate-Kandidat bleibt V1.1.2 mit Full Archives Access als primaerem Mechanik-/Visibility-Gate und Matchstart Entry UX als unabhaengigem UI-Slice.
