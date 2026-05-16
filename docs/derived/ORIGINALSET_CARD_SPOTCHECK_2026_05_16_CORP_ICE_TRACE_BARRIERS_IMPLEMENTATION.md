# Originalset-Spotcheck 2026-05-16 Corp ICE Trace/Barriers

Job: `spotcheck-2026-05-16-corp-ice-trace-barriers`

## Ergebnis

Der Job wurde fachlich umgesetzt. Die ausgewählten Corp-ICE wurden gegen Rez-Sichtbarkeit, Wrong-Side-/Stale-Revalidation, Trace-Bids, Programm-Trash, Core-Damage, End-the-run, PublicPayload-Leaks und Replay/StateHash geprüft.

Commit-Status: `committed`. Der vorherige lokale Commit-Blocker beim Erstellen von `.git/index.lock` ist in diesem Abschlusslauf nicht mehr aufgetreten.

## Umgesetzte Härtungen

- Asp und Hunter starten Trace 5 source-bound aus der ungebrochenen Subroutine und setzen bei Erfolg genau 1 Tag.
- Banpei veröffentlicht beim Programm-Trash keine Karteninstanz-ID mehr, sondern die Definition und den Trash-Typ.
- Cortical Scrub deckt Core-Damage plus Runende replay-sicher und payload-redigiert ab.
- Crystal Wall, Fire Wall, Keeper, Mazer, Quandary und Scramble sind als einfache ETR-ICE im Rez-/Continue-Pfad gegen Hidden-until-rez, Wrong-Side, stale `stateVersion`, PublicPayload und Replay geprüft.

## Verifikation

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle genannten Checks sind grün. Der lokale Commit-Blocker ist in diesem Abschlusslauf nicht mehr aufgetreten.
