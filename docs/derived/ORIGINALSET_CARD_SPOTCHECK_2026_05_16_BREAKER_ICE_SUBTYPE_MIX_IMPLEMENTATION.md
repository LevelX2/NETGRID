# Originalset-Spotcheck 2026-05-16 Breaker/Ice Subtype Mix

Job: `spotcheck-2026-05-16-breaker-ice-subtype-mix`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Runner-Icebreaker und Hidden-Zone-Run-Helfer wurden gegen Install-Side/Stale-Revalidation, Run-Timing, passende ICE-Subtypen, PublicPayload-Leaks und Replay/StateHash geprüft.

Commit-Status: `commit_pending`. Staging und lokaler Commit sind durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; Ursache ist weiterhin die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git`.

## Umgesetzte Härtungen

- Raffles, Raptor, Shaka, Snowball, Tinweasel, Wild Card, Wizard's Book und Worm werden in passenden Encounter-Fenstern installiert, gepumpt bzw. genutzt und per Replay abgesichert.
- SeeYa revalidiert Expose-Ziel-Drift und bleibt Hidden-Zone-barriered.
- Smarteye zeigt approached unrezzed ICE über einen source-bound Trigger ohne private Payloads.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
