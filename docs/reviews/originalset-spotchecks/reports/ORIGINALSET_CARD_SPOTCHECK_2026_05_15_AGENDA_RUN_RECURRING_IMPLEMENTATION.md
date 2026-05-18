# Originalset Card Spotcheck 2026-05-15 Agenda Run Recurring

Job: `spotcheck-2026-05-15-agenda-run-recurring`

Status: umgesetzt und geprüft.

## Karten

| Karte | Card ID | Ergebnis |
|---|---|---|
| Artificial Security Directors | `onr_v1_189_artificial-security-directors` | V1.9.19-Agenda-/Overadvance-Pfad bleibt replay-stabil; Operation-/Agenda-Zieltests grenzen die Infrastruktur ab. |
| Submarine Uplink | `onr_v1_182_submarine-uplink` | Base-Link wirkt im Trace-Fenster als einzelner installierter Link-Beitrag; staerkere Base-Link-Quelle kumuliert nicht. |
| Genetics-Visionary Acquisition | `onr_v1_202_genetics-visionary-acquisition` | V1.9.19-Agenda-Ziel- und Overadvance-Infrastruktur bleibt deterministisch und payload-redigiert. |
| Team Restructuring | `onr_v1_305_team-restructuring` | Power-Counter-Zielwahl auf Korp-Agenda ist deterministisch, public payloadfaehig und replay-stabil. |
| Silver Lining Recovery Protocol | `onr_v1_303_silver-lining-recovery-protocol` | Credit-Gain-Pfad ist karten-ID-spezifisch nachgetestet und frei von Ziel-/Choice-Projektion. |
| Shredder Uplink Protocol | `onr_v1_062_shredder-uplink-protocol` | R&D/HQ-Access-Bonus weist seine Quellen-ID im PublicPayload aus, ohne Folgekarte vor Access zu leaken. |
| Corolla Speed Chip | `onr_v1_124_corolla-speed-chip` | Implementiert: 1 recurring credit, nur fuer Killer-Nutzung waehrend Runs, mit Start-of-turn-Refresh. |
| Mystery Box | `onr_v1_043_mystery-box` | Implementiert: einmal pro Run Top-5-Stack-Reveal, Programmauswahl, Free-Install, Self-Trash und deterministischer Shuffle. |
| Newsgroup Filter | `onr_v1_045_newsgroup-filter` | Main-Action-Fenster, entfernte Quelle und PublicPayload erneut gehaertet. |
| Project Consultants | `onr_v1_300_project-consultants` | Installierte Agenda-Zielwahl, Wrong-Side/Stale-Revalidation und PublicPayload-Zielfelder nachgetestet. |

## Umsetzung

- `packages/shared/src/index.ts` ergaenzt `mysteryBoxUsedSourceIdsThisRun` und hebt `Corolla Speed Chip` von Install-only auf einen 1-Recurring-Killer-Credit-Vertrag.
- `packages/engine/src/index.ts` ergaenzt Shredder-Access-Quellpayload, Mystery-Box-Run-Resolver und PublicPayload-Kontext fuer V1.9.15-/V1.9.19-Haertungen.
- `packages/engine/src/index.test.ts` ergaenzt fokussierte Nachtests fuer Agenda-/Operation-Ziele, Shredder/Submarine, Mystery Box, Corolla Speed Chip und Newsgroup Filter.

## Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle Checks sind gruen.
