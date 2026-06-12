# AI134 Runner Coverage Goal Resolution v1

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI134 modelliert Runner-Coverage-Lücken als taktische Goals und klassifiziert vorhandene LegalActions dagegen. Das Paket ist read-only/shadow-only und ändert keine Runtime-Entscheidung.

## Änderung

Neue Datei:

- `packages/ai/src/decision/runner-coverage-goals.ts`

Klassifizierte Fits:

- `install_fixes_coverage`
- `draw_may_find`
- `search_likely_finds`
- `credit_preserves_future_coverage`
- `run_ignores_unresolved_coverage`
- `unrelated`

## Safety

- Die Resolution verarbeitet nur sichtbare Coverage-Typen, sichtbare installierbare Karten und side-safe Search-/Draw-/Credit-/Run-Signale.
- Es werden keine Hidden-Zonen, keine privaten Kartenlisten und kein `FullGameState` benötigt.
- Das Ergebnis ist ein Diagnoseobjekt für AI136 und kein produktiver Ranking-Eingriff.

## Tests

Abgedeckte Fälle:

- sichtbare und bezahlbare Wall-/Barrier-Coverage-Installation schlägt Credit als Goal-Fit
- Credit bleibt sinnvoll, wenn die sichtbare Coverage-Installation nicht bezahlbar ist
- Draw bleibt sinnvoll, wenn keine sichtbare Coverage-Option verfügbar ist
- Search/Run-Klassifikation braucht keine Hidden-Info

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- runner-coverage-goals`
- `git diff --check`
