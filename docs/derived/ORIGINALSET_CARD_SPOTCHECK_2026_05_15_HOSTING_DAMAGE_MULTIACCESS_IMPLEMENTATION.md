# Originalset-Spotcheck 2026-05-15 Hosting/Damage/Multiaccess Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-15-hosting-damage-multiaccess.md`

Jobstatus: `done`; der sequenzielle Umsetzungsjob wurde umgesetzt, geprüft und lokal committed.

## Umgesetzter Scope

| Karte | Card ID | Ergebnis |
|---|---|---|
| Microtech AI Interface | `onr_v1_041_microtech-ai-interface` | Bestehende Multiaccess- und PublicPayload-Abdeckung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| Poltergeist | `onr_v1_048_poltergeist` | Von install-only auf 2 restricted Recurring-Credits für Access-Trashkosten von Nodes gehoben, inklusive Refresh zum Runner-Zugstart. |
| Succubus | `onr_v1_069_succubus` | Bestehende Hosting-/Trash-Kaskadenabdeckung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| Mantis, Fixer-at-Large | `onr_v1_099_mantis-fixer-at-large` | Bestehende Hidden-Zone-Search-/Reveal-/Shuffle-Härtung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| Priority Wreck | `onr_v1_105_priority-wreck` | Bestehende R&D-Breach-Queue-Abdeckung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| Lifesaver Nanosurgeons | `onr_v1_130_lifesaver-nanosurgeons` | Bestehende Damage-Prevention-Abdeckung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| PK-6089a | `onr_v1_138_pk-6089a` | Deck-Hardware auf Installkosten 4, +1 MU, Deck-Unique und 3 restricted Trace-Link-Recurring-Credits gehoben. |
| Data Darts | `onr_v1_234_data-darts` | Next-ICE-No-Break-Subroutine ergänzt und über den bestehenden run-lokalen Modifier replay-stabil gemacht. |
| New Blood | `onr_v1_294_new-blood` | Bestehende Vorzug-Run-History-Abdeckung bleibt gültig; kein zusätzlicher Runtime-Fix nötig. |
| Holovid Campaign | `onr_v1_326_holovid-campaign` | Von generischer Recurring-Asset-Economy auf 12 öffentliche Bits, Zugstart-Drain, Credit und Selftrash umgestellt. |

## Nachgezogene Artefakte

- Shared-Kartentexte und Mechanics-Tags für Poltergeist, PK-6089a, Data Darts und Holovid Campaign aktualisiert.
- Engine-Zahlungspfade für Poltergeist-Access-Trash und PK-Trace-Link-Credits source-bound erweitert.
- Holovid Campaign aus dem generischen Recurring-Asset-Set entfernt und als eigener Bit-Lifecycle im Korp-Zugstart behandelt.
- V1.9.22-Manifest, Catalog-Gate-Erwartungen, lokale V1.9.22-Fakten, Resolver-Verträge und AI-Hints synchronisiert.

## Regressionen

- Poltergeist: Node-Trash-Zahlung aus Recurring-Credits, Upgrade-Negativfall, PublicPayload und Replay/StateHash.
- PK-6089a: Installkosten, MU-Bonus, Trace-Bid-Zahlung aus Recurring-Credits, Refresh und Replay/StateHash.
- Holovid Campaign: Rez mit exakt 12 Bits, letzter Zugstart-Drain, Creditgewinn, Selftrash und Replay/StateHash.
- Data Darts: Net-Damage plus Next-ICE-No-Break-Marker, LegalAction-Projektion und Replay/StateHash.

## Checks

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` - grün, 468 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` - grün, 119 Tests.
- `corepack pnpm typecheck` - grün.
