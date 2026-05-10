# Deck-Legal AI Approval V1.9.1 bis V1.9.4 Plan

Stand: 2026-05-10  
Status: Planungsdokument (keine Umsetzung in diesem Schritt)

## Ziel

Nach dem abgeschlossenen Human-Release V1.9.1 bis V1.9.4 sollen die dort neu freigegebenen O:NR-v1-Karten kontrolliert von `human_playable` auf `ai_supported` gehoben werden, ohne Scope-Drift und ohne Hidden-Info-Risiko.

## Ausgangslage (Runtime-Stand)

- O:NR-v1 Basisset gesamt: 374 Karten
- Davon aktuell `human_playable`: 133
- Davon aktuell `ai_supported`: 117
- Direkt verfügbar für nächsten AI-Approval-Slice (`human_playable`, aber noch nicht `ai_supported`): 16
- Noch nicht human-spielbar (damit nicht AI-Approval-fähig in diesem Slice): 241

## Verfügbare Karten für den nächsten AI-Approval-Slice

| Release | CardId | Titel | Seite | Typ | Resolver |
| --- | --- | --- | --- | --- | --- |
| V1.9.1 | `onr_v1_013_cockroach` | Cockroach | runner | program | `successful_hq_run_counter_then_randomize_corp_hq_discard_at_threshold` |
| V1.9.1 | `onr_v1_034_incubator` | Incubator | runner | program | `successful_run_counter_then_start_of_turn_die_and_hidden_choice_counter_transform` |
| V1.9.1 | `onr_v1_030_grubb` | Grubb | runner | program | `wall_breaker_with_run_remainder_strength_bonus` |
| V1.9.2 | `onr_v1_076_all-nighter` | All-Nighter | runner | event | `run_then_optional_bonus_run_without_extra_click` |
| V1.9.2 | `onr_v1_096_kilroy-was-here` | Kilroy Was Here | runner | event | `rd_run_with_free_access_trash` |
| V1.9.2 | `onr_v1_107_romp-through-hq` | Romp through HQ | runner | event | `hq_run_with_free_access_trash` |
| V1.9.2 | `onr_v1_184_top-runners-conference` | Top Runners' Conference | runner | resource | `start_of_turn_credit_gain_and_trash_on_run_start` |
| V1.9.2 | `onr_v1_188_ai-chief-financial-officer` | AI Chief Financial Officer | corp | agenda | `scored_agenda_action_shuffle_hq_archives_into_rd_then_draw_5` |
| V1.9.2 | `onr_v1_211_polymer-breakthrough` | Polymer Breakthrough | corp | agenda | `corp_start_of_turn_credit_gain_from_scored_agenda` |
| V1.9.2 | `onr_v1_235_data-naga` | Data Naga | corp | ice | `trash_installed_program_then_end_the_run` |
| V1.9.3 | `onr_v1_207_netwatch-operations-office` | Netwatch Operations Office | corp | agenda | `scored_agenda_action_trace_7_add_tag` |
| V1.9.3 | `onr_v1_213_private-cybernet-police` | Private Cybernet Police | corp | agenda | `scored_agenda_action_trace_7_add_tag` |
| V1.9.3 | `onr_v1_251_jack-attack` | Jack Attack | corp | ice | `run_wide_jack_out_lock_plus_trace_tag_subroutine` |
| V1.9.3 | `onr_v1_271_tko-2-0` | TKO 2.0 | corp | ice | `end_the_run_plus_runner_forgo_next_action` |
| V1.9.4 | `onr_v1_208_on-call-solo-team` | On-Call Solo Team | corp | agenda | `scored_agenda_action_if_tagged_deal_1_meat_damage` |
| V1.9.4 | `onr_v1_217_strike-force-kali` | Strike Force Kali | corp | agenda | `scored_agenda_action_if_tagged_deal_2_meat_damage` |

Verteilung:

- Runner: 7
- Corp: 9
- Typen: 3 Program, 3 Event, 1 Resource, 6 Agenda, 3 ICE

## Empfohlene Batch-Strategie

### Batch A: Niedrig bis mittel (schneller Nutzwert)

Karten:

- `onr_v1_076_all-nighter`
- `onr_v1_096_kilroy-was-here`
- `onr_v1_107_romp-through-hq`
- `onr_v1_184_top-runners-conference`
- `onr_v1_211_polymer-breakthrough`
- `onr_v1_207_netwatch-operations-office`
- `onr_v1_213_private-cybernet-police`

Ziel:

- Sofort nutzbare Runner-Pressure- und Corp-Agenda-Plansignale in bestehende Planrollen einhängen (`pressure_hq`, `pressure_rnd`, `recover_economy`, `protect_hq`, `protect_rnd`, `build_scoring_remote`).

### Batch B: Mittel bis hoch (Interaktions- und Lock-Pfade)

Karten:

- `onr_v1_030_grubb`
- `onr_v1_235_data-naga`
- `onr_v1_251_jack-attack`
- `onr_v1_271_tko-2-0`
- `onr_v1_208_on-call-solo-team`
- `onr_v1_217_strike-force-kali`

Ziel:

- Run-/Encounter-/Action-Loss-/Tag-Damage-Verträge KI-seitig robust bewerten, ohne Hidden-Info-Overreach.

### Batch C: Hochrisiko (Random/Persistenz/Hidden-Zone-lastig)

Karten:

- `onr_v1_013_cockroach`
- `onr_v1_034_incubator`
- `onr_v1_188_ai-chief-financial-officer`

Ziel:

- Deterministische Zufalls- und Persistenzpfade mit klaren Unsicherheitsmarkern und stabilen Side-Safety-Checks.

## Aufgabenpakete

### 1) Preflight und Scope-Freeze

- Zielmenge exakt auf die 16 Karten einfrieren.
- Pro Karte Risiko-Tier (`low`, `medium`, `high`) dokumentieren.
- Keine Freigabe außerhalb der 16 Karten.

### 2) Datenartefakte vorbereiten

- Neues Hint-Artefakt: `data/ai/ai-card-hints-deck-legal-v191-v194.json`
- Neues Batch-Manifest: `data/manifests/deck-legal-ai-approval-v191-v194-manifest.json`
- Neue Scenario-Smokes: `data/scenarios/ai-deck-legal-v191-v194-smokes.json`

### 3) Runtime-Catalog-Freigabepfad erweitern

- In `packages/catalog/src/index.ts` neuen Slice-Export anlegen:
  - `DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS`
- In `DECK_LEGAL_AI_APPROVED_CARD_ID_SET` aufnehmen.
- Statusketten-Tests für `human_playable/deck_legal/format_legal/ai_supported` erweitern.

### 4) KI-Hint-Merge in allen relevanten Konsumenten

- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `apps/web/app/api/cards/catalog-data.ts`

Ziel:

- Neue Hints werden konsumiert, aber nur für die explizit freigegebenen Karten `ai_supported`.

### 5) KI-Plan- und Risiko-Abdeckung

- Runner:
  - Run-Event-Wahl und Bonus-Run-Ketten (`All-Nighter`)
  - Access-Trash-Events (`Kilroy`, `Romp`)
  - Rungebundene Resource-Lifecycle-Entscheidung (`Top Runners' Conference`)
  - Persistenter Breakerwert im Run-Rest (`Grubb`)
  - Random-/Counter-Persistenz (`Cockroach`, `Incubator`)
- Corp:
  - Scored-Agenda-Action-Timing (`Netwatch`, `Private Cybernet Police`, `On-Call`, `Strike Force Kali`)
  - Statische Scored-Agenda-Wirtschaft (`Polymer Breakthrough`)
  - Program-Trash-/Run-Lock-ICE (`Data Naga`, `Jack Attack`, `TKO 2.0`)
  - Hidden-Zone-Shuffle-Entscheidung mit Draw-Folge (`AI Chief Financial Officer`)

### 6) Test- und Gate-Paket

Pflicht:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

Gezielt:

- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
- `corepack pnpm --filter @netgrid/ai test -- index.test.ts`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- `corepack pnpm --filter @netgrid/web test -- catalog-data.test.ts`

Gate-Ziele:

- `runnerAiUsesOnlyLegalActions = true`
- `corpAiUsesOnlyLegalActions = true`
- `decisionDebugSideSafe = true`
- `hiddenStateInvariance = true`
- kein Hidden-Info-Leak über DecisionDebug/API/PublicEvents

## Done-Kriterien für diesen Slice

1. Genau diese 16 Karten wechseln von `human_playable` auf `ai_supported`.
2. Keine Nicht-Zielkarte wird neu `ai_supported`.
3. Hints/Manifest/Scenario-Artefakte sind vollständig.
4. Alle Pflicht- und Zieltests sind grün.
5. Scope bleibt unverändert:
   - keine neuen Mechaniken
   - kein Belief-State-/FullState-Scope-Sprung
   - keine Public-Plattformfeatures

## Entscheidungsbedarf vor Umsetzung

1. Batch-Strategie bestätigen (`A -> B -> C`) oder alternative Reihenfolge.
2. Umsetzungsmodus bestätigen:
   - ein gemeinsamer Slice für alle 16 Karten, oder
   - drei nacheinander abschließbare Sub-Slices nach Batch.
