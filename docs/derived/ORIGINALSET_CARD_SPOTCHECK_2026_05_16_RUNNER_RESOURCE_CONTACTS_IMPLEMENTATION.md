# Originalset-Spotcheck 2026-05-16 Runner Resource Contacts

Job: `spotcheck-2026-05-16-runner-resource-contacts`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewaehlten Runner-Resources wurden gegen Install-Revalidation, Tag-Removal, Agenda-Punkt-Kosten, Credit-/Recurring-Refresh, PublicPayload-Leaks sowie Replay/StateHash geprueft.

Commit-Status: `commit_pending`. Staging und lokaler Commit sind durch `Permission denied` beim Erstellen von `.git/index.lock` blockiert; Ursache ist weiterhin die fremde direkte DENY-ACL `S-1-5-21-2893003870-2010802999-161870138-128397290` auf `.git`.

## Umgesetzte Haertungen

- Crash Everett, Danshi's Second ID, Databroker, Field Reporter for Ice and Data, Floating Runner BBS, Junkyard BBS, Karl de Veres, Leland, Loan from Chiba und The Shell Traders werden als Runner-Resource-Installationen mit Wrong-Side-, Stale-, Removed-source-, PublicPayload- und Replay/StateHash-Checks abgedeckt.
- Danshi's Second ID schreibt sichere `removedTags`- und `runnerTagsAfter`-Felder.
- Gain-Credit-Events koennen sichere `agendaPointCostPaid`-Felder veroeffentlichen; Databroker nutzt das fuer seinen Agenda-Punkt-Kostenpfad.
- Floating Runner BBS, Loan from Chiba und The Shell Traders bleiben ueber Runner-Start-of-turn, Creditgewinn und Recurring-Refresh replay-stabil.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind gruen. Staging und lokaler Commit bleiben bis zur `.git`-ACL-Reparatur blockiert.
