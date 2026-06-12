# AI113 Guard-Kommentar-Konsistenz

Datum: 2026-06-12

Branch: `codex/ai108-ai114-residual-action-limit-mini-sweep`

## Ergebnis

AI113 hat die Residual-Action-Limit-Guard-Kommentare dort nachgezogen, wo die Mini-Sweep-Analyse sonst leicht falsch interpretiert werden kann.

Geändert wurde nur Kommentartext in `packages/ai/src/simulation/selfplay-trace-mining.ts`:

- Late-Draws mit `runnerSetupMissingCoverageTypes` werden als Coverage-/Hand-Goal-Draws eingeordnet, auch wenn die Text-Evidence den Coverage-Grund nicht enthält.
- Corp-Late-Credits bekommen nur dann eine sichere Fortschrittsalternative, wenn eine konkrete Scoreline-Aktion legal war. Reine Economy-Alternativen oder opake `activated_card_ability`-Referenzen bleiben bewusst außerhalb dieses Buckets.

## Schlussfolgerung

Kein Runtime-Fix. Die AI109- und AI110-Entscheidungen sind jetzt im Code an den Klassifikationsstellen nachvollziehbar dokumentiert.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`
