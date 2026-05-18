# AI-Hints Role Gap Report, 2026-05-17

## Zweck

Dieser Report priorisiert kleine AI-Hint-, Rollen- und Szenario-Lücken. Er ändert keine Hints, keine Runtime-Karten, keine Decklegalität und keine `ai_supported`-Freigaben.

No-Cheat-Gate: Hints dürfen nur erlaubte eigene Kartennutzung, sichtbare PublicEvents, PlayerViews und LegalActions beschreiben. Keine Rolle darf gegnerische Hidden-Zonen, Decklisten, künftige Draws oder verdeckte Kartentitel voraussetzen.

## Auswertungsschnitt

Geprüfte Quellen:

- `data/ai/ai-card-hints-active.json`
- `data/ai/card-role-manifest-0.9.json`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/catalog-gates.ts`
- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`
- relevante Rollennutzung in `packages/ai/src/index.ts`, `packages/ai/src/runner-plans.ts` und `packages/ai/src/corp-plans.ts`

Maschinenlesbare Zählung vom 2026-05-17:

| Schnitt | Anzahl | Einordnung |
| --- | ---: | --- |
| aktive AI-Hint-Einträge | 410 | konsolidierte Runtime-Hint-Datei, nicht releasehistorisch sortiert |
| aktive `ai_supported` Hint-Einträge | 377 | enthält die beiden Identitäten `corp_identity_001` und `runner_identity_001` |
| aktive `hinted_only` Hint-Einträge | 33 | alle ohne `scenarioRefs`; keine aktive Planrollenfreigabe |
| aktive Catalog-Runtime-Karten | 374 | `activeRuntimeCardIds`; ohne Identitäten und ohne `simple_tag_ice` |
| aktive Catalog-AI-Approval-Karten | 375 | `activeAiApprovedCardIds`; Runtime plus `simple_tag_ice` |
| V1.9.22-AI-Approval-Zielkarten | 47 | einzelner Batch `v1.9.22`, nicht Gesamtzahl aktiver AI-Hints |
| altes Rollenmanifest V0.9 | 34 | historischer manueller Basisschnitt, nicht die aktive Vollabdeckung |

Die oft genannte Differenz ist damit kein direkter Widerspruch: `377` ist der aktive Hint-Status inklusive Identitäten, `375` ist der Catalog-AI-Approval-Schnitt, `374` ist Runtime ohne `simple_tag_ice`, und `47` ist nur der V1.9.22-Batch.

## Datenbefund

- Keine aktiven Hint-Einträge haben leere `roles`.
- Keine aktiven Hint-Einträge haben leere `planRoles`.
- Genau 33 Karten haben keine `scenarioRefs`; das sind ausschließlich `hinted_only`-Karten.
- 74 `ai_supported`-Einträge haben schmale Rollenabdeckung nach einfacher Heuristik (`roles` mit höchstens zwei Einträgen oder keine Planrollen; Planrollen fehlen aktuell nicht).
- Die wichtigste Qualitätslücke liegt nicht in fehlenden Rollen, sondern in zu groben Rollen für einzelne KI-Nutzungsfamilien.

## Priorisierte Lücken

### P1: Sichtbare Runanalyse, Breaker und ICE

Warum P1: Runner-Planung und Korp-Remote-Contest hängen direkt daran, ob sichtbare ICE/Breaker-Rollen präzise genug sind. Falsche oder zu generische Rollen führen nicht zu illegalen Aktionen, aber zu schlechter Run-, Rig- und Remote-Bewertung.

Kandidaten:

- `onr_v1_224_bolter-cluster` und `onr_v1_258_neural-blade`: aktuell `ice`, `damage`; es fehlt eine feinere Rolle für Non-ETR-Damage-ICE, damit sichtbare Gefahr nicht nur als generische Verteidigung erscheint.
- `onr_v1_047_pile-driver`: aktuell `program`, `icebreaker`; braucht genaue Breaker-Familie oder bewusst dokumentierten Grund, warum sie generisch bleibt.
- Mehrere `ai_supported` Breaker sind funktional abgedeckt, aber rollenarm: `onr_v1_016_cyfermaster`, `onr_v1_052_raffles`, `onr_v1_054_raptor`, `onr_v1_060_shaka`, `onr_v1_070_tinweasel`, `onr_v1_073_wizards-book`.

Kleinstes Folgepaket: `ai-hints-breaker-ice-role-refinement`

- Für die genannten Karten Rollen präzisieren oder bewusst als generisch begründen.
- Je Rolle mindestens ein vorhandenes SzenarioRef bestätigen oder ein kleines Smoke-Szenario vorschlagen.
- Keine `ai_supported`-Promotion, nur Rollen-/Szenario-Härtung für bereits freigegebene Karten.

### P1: Runner Economy, Draw und Search

Warum P1: Runner-Aufbau, Mulligan, Recovery und Zweizugplanung hängen stark an Rollen wie `economy`, `draw`, `setup`, `stack_search`, `tempo` und `memory`.

Kandidaten:

- `onr_v1_079_bodyweight-synthetic-blood`, `onr_v1_095_jack-n-joe`, `onr_v1_101_mit-west-tier`: Draw-/Setup-Rollen sind vorhanden, aber sehr schmal; klären, ob sie nur `draw_for_answers` oder auch Setup-/Tempo-Bias tragen sollen.
- `onr_v1_097_livewires-contacts`, `onr_v1_108_score`: Economy-/Tempo-/Run-Druck-Kombinationen sind wertvoll, aber ohne Sequenz-Szenario leicht über- oder unterbewertet.
- Ressourcen wie `onr_v1_154_broker`, `onr_v1_165_junkyard-bbs`, `onr_v1_178_short-term-contract`: Economy-Rollen vorhanden, aber strategische Install-/Nutzenfenster bleiben grob.

Kleinstes Folgepaket: `ai-hints-runner-economy-draw-smokes`

- 6-10 Runner-Aufbaukarten mit Rollen und vorhandenen SzenarioRefs gegen Mulligan/Recovery/Draw-Smokes abgleichen.
- Nur kleine Rollenpräzisierungen oder neue Mini-Smokes; keine neue Heuristik und keine Massenedits.

### P1: Korp Remote-Scoring, Upgrades und Rezreserve

Warum P1: Der aktuelle Matchprogression-Benchmark zeigt Stagnation bei Korp-Scoring/Remote-Advances. Rollen können hier helfen, ohne sofort neue Codeheuristiken zu bauen.

Kandidaten:

- `onr_v1_333_omniscience-foundation`: `asset`, `gray_ops`, `remote_asset_economy`; prüfen, ob der Remote-/Economy-Wert für Planbewertung ausreicht.
- `onr_v1_359_jenny-jett`, `onr_v1_361_namatoki-plaza`, `onr_v1_370_tesseract-fort-construction`: Upgrades mit `remote_upgrade_support`, aber sehr wenigen Rollen; klären, ob sie Scoring-Fenster, Rezreserve oder Schutzpriorität abbilden sollen.
- `onr_v1_363_olivia-salazar`, `onr_v1_366_red-herrings`: Agenda-/Access-Tax-Rollen sind sichtbar, sollten gezielt mit Remote-Scoring-Smokes belegt werden.

Kleinstes Folgepaket: `ai-hints-corp-remote-scoring-role-smokes`

- Remote-Upgrades/Assets gegen `build_scoring_remote`, `score_next_turn`, `bait_runner` und Rezreserve prüfen.
- Ergebnis soll kleine Rollen-/Szenario-Änderung sein, bevor neue Corp-Planlogik geschrieben wird.

### P2: `hinted_only` ohne SzenarioRefs

Warum P2: Diese 33 Karten sind nicht aktiv planfreigegeben. Sie sind aber relevant als historische Simple-/V0.8-Harness-Karten und können Zahlenberichte verfälschen.

Betroffene Gruppen:

- Simple-Korp: `simple_agenda`, `simple_barrier_ice`, `simple_code_gate_ice`, `simple_draw_operation`, `simple_economy_asset`, `simple_economy_operation`, `simple_priority_agenda`, `simple_sentry_ice`, `simple_tag_punishment_operation`, `simple_taxing_barrier_ice`, `simple_upgrade`
- V0.8-Korp: `v08_archive_planning_operation`, `v08_cashout_asset`, `v08_credit_surge_operation`, `v08_gate_ice`, `v08_project_agenda`, `v08_wall_ice`, `v08_watchdog_ice`
- Simple-/V0.8-Runner: `efficient_fracter`, `simple_decoder`, `simple_draw_event`, `simple_economy_event`, `simple_fracter`, `simple_killer`, `simple_run_event`, `simple_setup_hardware`, `v08_adaptive_killer`, `v08_burst_credit_event`, `v08_deep_draw_event`, `v08_memory_chip`, `v08_overclock_run_event`, `v08_precise_decoder`, `v08_steady_fracter`

Kleinstes Folgepaket: `ai-hints-hinted-only-harness-decision`

- Entscheiden, ob diese Karten bewusst `hinted_only` bleiben oder SzenarioRefs als reine Harness-Dokumentation erhalten.
- Keine automatische Promotion auf `ai_supported`.

### P2: Zahlen- und Gate-Kontrakt dokumentieren

Warum P2: Berichte können aktive Hints, Catalog-Runtime, Catalog-AI-Approval und Release-Zielkarten leicht vermischen.

Kleinstes Folgepaket: `ai-hints-count-contract-reporting`

- Kleine Dokumentations- oder Testhilfe, die die vier Schnitte separat ausgibt:
  - aktive Hint-Einträge,
  - aktive `ai_supported` Hint-Einträge inklusive Identitäten,
  - `activeRuntimeCardIds`,
  - `activeAiApprovedCardIds`,
  - letzter Release-Batch, aktuell V1.9.22 mit 47 Karten.

## Bewusste Nicht-Änderungen

- Keine Rolle wurde ergänzt.
- Kein `aiSupportStatus` wurde geändert.
- Keine Karte wurde spielbar, decklegal oder formatlegal gemacht.
- Keine Engine-, Replay-, StateHash-, PlayerView- oder PublicEvent-Regel wurde verändert.
- Keine Hidden-Info-Annahme wurde in Hints oder Folgepakete aufgenommen.

## Empfohlene Reihenfolge

1. `ai-hints-breaker-ice-role-refinement`
2. `ai-hints-runner-economy-draw-smokes`
3. `ai-hints-corp-remote-scoring-role-smokes`
4. `ai-hints-hinted-only-harness-decision`
5. `ai-hints-count-contract-reporting`
