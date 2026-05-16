# Originalset-Spotcheck 2026-05-16 Runner Program Core

Job: `spotcheck-2026-05-16-runner-program-core`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewaehlten Runner-Programme wurden gegen Install-Revalidation, Afreet-Hosting, Clown-Encounter-Modifier, installierte Breaker-Quellen, PublicPayload-Leaks sowie Replay/StateHash geprueft.

Commit-Status: `done`. Der lokale Commit wurde erfolgreich erstellt.

## Umgesetzte Haertungen

- Afreet, Baedeker's Net Map, Bakdoor, Black Dahlia, Cascade, Clown, Codeslinger, Cyfermaster, Dogcatcher und Dropp werden als Runner-Programm-Installationen mit Wrong-Side-, Stale-, Removed-source-, PublicPayload- und Replay/StateHash-Checks abgedeckt.
- Afreet-Hosting revalidiert die installierte Host-Quelle; Bakdoor bleibt gehostet sichtbar und verwendet keine zusaetzliche Runner-MU.
- Cascade setzt seine Virus- und Recurring-Counter beim Install stabil.
- Clown reduziert die oeffentliche Encounter-Staerke von ICE im Run-Fenster und bleibt replay-stabil.
- Black Dahlia, Codeslinger, Cyfermaster, Dogcatcher und Dropp koennen nur aus installierter Quelle passende Subroutinen brechen; Wrong-Side, Stale und entfernte Breaker-Quelle werden zurueckgewiesen.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind gruen. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
