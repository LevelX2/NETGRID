# Card Implementation 0.8 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Resolver-Modell

Jede neue Karte verweist auf einen expliziten Resolvernamen. Der Resolvername ist Code- und Manifest-Vertrag, nicht aus Kartentext abgeleitet.

Pflichtfelder pro Karte:

- `cardCode`
- `status: playable_mvp`
- `sourceMode: local_original`
- `resolver`
- `visibilityClass`
- `riskFlags`
- `roleTags`
- `unitTests`
- `scenarioTests`
- `visibilityTests`
- `replayTests`
- `aiSmokeTests`

## Resolver-Gruppen

| Gruppe | Karten |
|---|---|
| Runner Event Resolver | `v08_burst_credit_event`, `v08_deep_draw_event`, `v08_overclock_run_event` |
| Runner Install Resolver | `v08_memory_chip`, `v08_steady_fracter`, `v08_precise_decoder`, `v08_adaptive_killer` |
| Corp Operation Resolver | `v08_credit_surge_operation`, `v08_archive_planning_operation` |
| Corp Agenda Resolver | `v08_project_agenda` |
| Corp Asset Resolver | `v08_cashout_asset` |
| Corp ICE Resolver | `v08_wall_ice`, `v08_gate_ice`, `v08_watchdog_ice` |

## Testpflicht je Karte

Jede neue spielbare Karte braucht:

- Unit-Test für legalen Effekt.
- Negativtest für falsche Seite, stale StateVersion oder nicht zahlbare Kosten.
- Szenario-Referenz.
- Visibility-/Payload-Leakscan.
- Replay/StateHash-Abdeckung.
- KI-Smoke-Abdeckung über V0.8-Decks.

## Matchstart-Regel

V0.8-Decks dürfen nur aus validierten Snapshots entstehen. Katalog- oder Importstatus allein erzeugt keine Engine-Definition und keine Matchstart-Freigabe.
