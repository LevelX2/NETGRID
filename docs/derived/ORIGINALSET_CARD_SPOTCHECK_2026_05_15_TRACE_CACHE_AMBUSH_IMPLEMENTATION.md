# Originalset-Spotcheck 2026-05-15 Trace/Cache/Ambush Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-trace-cache-ambush.md`

Jobstatus: `blocked` mit grünem Teilfix. Alle aus diesem Sammeljob ausgelagerten Follow-up-Removal-Conditions sind inzwischen umgesetzt; offen bleiben nur die bewusst als Teilfix dokumentierten Karten aus dem ursprünglichen Sammeljob.

Nachtrag 2026-05-16: Der Folgejob `spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers` hat die drei Hidden-Zone-/Temporary-Install-Removal-Conditions für `Deal with Militech`, `Hunt Club BBS` und `Sneak Preview` umgesetzt und grün geprüft. Der Folgejob `spotcheck-2026-05-16-persistent-counter-pool-resolvers` hat außerdem `Code Viral Cache`, den vollständigen `Cerberus`-Counter-Loop und `Paris City Grid` umgesetzt und grün geprüft. Der Folgejob `spotcheck-2026-05-16-trace-link-post-bid-resolvers` hat die post-bid Trace-Link-Choice-Resolver für `Signpost` und `The Springboard` umgesetzt und grün geprüft.

## Umgesetzte Teilfixes

| Karte | Card ID | Ergebnis |
|---|---|---|
| Ice Pick Willie | `onr_v1_250_ice-pick-willie` | Falscher R&D-Top-Reveal entfernt; Subroutinen sind jetzt Program-Trash und End-the-run. Der Nachtest prüft, dass die R&D-Identität nicht in Payload oder Runner-View erscheint. |
| TRAP! | `onr_v1_345_trap` | Access-Ambush-Schaden von 1 auf 3 Net Damage korrigiert; Tag, Archives-No-op und R&D-Reveal-Barriere bleiben erhalten. |
| Cerberus | `onr_v1_227_cerberus` | Erste Subroutine auf 3 Net Damage korrigiert und falscher Trace-Tag-Erfolg entfernt. |
| Deal with Militech | `onr_v1_082_deal-with-militech` | Folgejob umgesetzt: Research-Agenda-Turn-Flag, Militech-Counter auf installierten Icebreakern und Strength-Bonus statt falscher Stack-Suche. |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Folgejob umgesetzt: private Multi-Expose-Choice für bis zu drei installierte unrezzed Korp-Karten ohne Zielidentitäts-Leak vor der Choice. |
| Sneak Preview | `onr_v1_110_sneak-preview` | Folgejob umgesetzt: Heap-/Stack-Programminstall mit Stack-Shuffle, Memory-Revalidation, temporärem Tracking und End-of-turn-Return. |
| Signpost | `onr_v1_063_signpost` | Folgejob umgesetzt: post-bid Trace-Link-Choice nach offengelegten Bids, Kostenzahlung, Einmal-pro-Trace-Grenze und AI-Auswahl. |
| The Springboard | `onr_v1_181_the-springboard` | Folgejob umgesetzt: statischer Base-Link entfernt und post-bid Trace-Link-Choice nach offengelegten Bids mit Kostenzahlung und Einmal-pro-Trace-Grenze ergänzt. |
| Code Viral Cache | `onr_v1_155_code-viral-cache` | Folgejob umgesetzt: HQ-Run-Install-Gate, Purge-Replacement-Choice für bis zu zwei Counter und Korp-Trash-Aktion. |
| Cerberus | `onr_v1_227_cerberus` | Folgejob umgesetzt: Trace-Erfolg legt Cerberus-Counter, Runstart verursacht Counter-Damage und Runner-Removal ist kostenvalidiert. |
| Paris City Grid | `onr_v1_365_paris-city-grid` | Folgejob umgesetzt: servergebundener 6-Bit-Trace-Pool, Poolverbrauch und Corp-Turnstart-Refresh. |

## Follow-up-Status

Die ausgelagerten Vollresolver für Hidden-Zone-/Temporary-Install, persistente Counter-/Pool-Pfade und post-bid Trace-Link sind durch dedizierte Folgejobs abgeschlossen. Der ursprüngliche Sammeljob bleibt historisch als `blocked` dokumentiert, weil Ice Pick Willie und TRAP! nur als grüne Teilfixes innerhalb des Sammelumfangs abgeschlossen wurden.

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün, 379 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 16 Dateien / 127 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 44 Tests.
- `corepack pnpm typecheck` - grün.
