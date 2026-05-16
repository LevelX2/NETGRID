# Originalset-Spotcheck 2026-05-15 Trace/Cache/Ambush Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-trace-cache-ambush.md`

Jobstatus: `blocked` mit grünem Teilfix.

Nachtrag 2026-05-16: Der Folgejob `spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers` hat die drei Hidden-Zone-/Temporary-Install-Removal-Conditions für `Deal with Militech`, `Hunt Club BBS` und `Sneak Preview` umgesetzt und grün geprüft. Der ursprüngliche Sammeljob bleibt blockiert, weil `Signpost`, `The Springboard`, `Code Viral Cache`, der vollständige `Cerberus`-Counter-Loop und `Paris City Grid` weiterhin eigene Resolver-Scope-Jobs benötigen.

## Umgesetzte Teilfixes

| Karte | Card ID | Ergebnis |
|---|---|---|
| Ice Pick Willie | `onr_v1_250_ice-pick-willie` | Falscher R&D-Top-Reveal entfernt; Subroutinen sind jetzt Program-Trash und End-the-run. Der Nachtest prüft, dass die R&D-Identität nicht in Payload oder Runner-View erscheint. |
| TRAP! | `onr_v1_345_trap` | Access-Ambush-Schaden von 1 auf 3 Net Damage korrigiert; Tag, Archives-No-op und R&D-Reveal-Barriere bleiben erhalten. |
| Cerberus | `onr_v1_227_cerberus` | Erste Subroutine auf 3 Net Damage korrigiert und falscher Trace-Tag-Erfolg entfernt. |
| Deal with Militech | `onr_v1_082_deal-with-militech` | Folgejob umgesetzt: Research-Agenda-Turn-Flag, Militech-Counter auf installierten Icebreakern und Strength-Bonus statt falscher Stack-Suche. |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Folgejob umgesetzt: private Multi-Expose-Choice für bis zu drei installierte unrezzed Korp-Karten ohne Zielidentitäts-Leak vor der Choice. |
| Sneak Preview | `onr_v1_110_sneak-preview` | Folgejob umgesetzt: Heap-/Stack-Programminstall mit Stack-Shuffle, Memory-Revalidation, temporärem Tracking und End-of-turn-Return. |

## Offene Blocker

Der Gesamtjob bündelt mehrere eigenständige Vollresolver, die nicht sicher als Nebenpatch in einem Spotcheck-Lauf abgeschlossen werden konnten:

- `Signpost` und `The Springboard`: post-bid Trace-Link-Choice nach offengelegten Bids, Kosten, Einmal-pro-Trace-Grenze und AI-Bid-Policy.
- `Code Viral Cache`: HQ-Erfolgsbedingung, Purge-Replacement mit Runner-Counterchoice und Korp-Trash-Aktion.
- `Cerberus`: Cerberus-Counter, Start-of-run-Damage pro Counter und Runner-Removal-Aktion.
- `Paris City Grid`: servergebundener 6-Bit-Trace-Pool, Trace-Payment-Priorität und Corp-Turnstart-Refresh.

Removal Condition: die offenen Mechaniken als dedizierten Resolver-Scope planen und anschließend diesen Job oder gezielte Folgejobs erneut aufnehmen.

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün, 379 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 16 Dateien / 127 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 44 Tests.
- `corepack pnpm typecheck` - grün.
