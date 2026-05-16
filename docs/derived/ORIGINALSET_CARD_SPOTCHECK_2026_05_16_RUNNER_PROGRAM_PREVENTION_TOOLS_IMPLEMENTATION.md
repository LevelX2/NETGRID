# Originalset-Spotcheck 2026-05-16 Runner Program Prevention Tools

Job: `spotcheck-2026-05-16-runner-program-prevention-tools`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewaehlten Runner-Programme wurden gegen Install-Revalidation, Imp-Hosting, Damage-Prevention, Breaker-Run-Fenster, Hidden-Zone-Expose, Access-Hidden-Info, PublicPayload-Leaks sowie Replay/StateHash geprueft.

Commit-Status: `done`. Der lokale Commit wurde erfolgreich erstellt.

## Umgesetzte Haertungen

- V1.9.11-Hidden-Zone-Programmabilities schreiben nun `sourceDefinitionId` in den oeffentlichen Payload-Kontext, damit Chronik und Audit die sichtbare installierte Quelle nennen koennen.
- Dwarf, Expert Schedule Analyzer, Force Shield, Imp, Jackhammer, Joan of Arc, Krash, Loony Goon, Mouse und R&D-Protocol Files werden als Runner-Programm-Installationen mit Wrong-Side-, Stale-, Removed-source-, PublicPayload- und Replay/StateHash-Checks abgedeckt.
- Imp-Hosting revalidiert den Host, und Jackhammer bleibt gehostet replaybar.
- Force Shield und Joan of Arc verhindern Core-Damage source-bound und veroeffentlichen nur abstrakte Prevention-Ergebnisse.
- Dwarf, Jackhammer, Krash und Loony Goon koennen nur aus installierter Quelle passende Subroutinen brechen.
- Mouse expose't nur mit installierter Quelle und hidden-info-barrier Payload; Expert Schedule Analyzer bleibt im Access-Pfad hidden-info-sicher.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind gruen. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
