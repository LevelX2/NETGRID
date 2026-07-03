# Flipped Seed Comparison: latest-match-baseline-014

Status: analysis
Generated: 2026-07-03

## Setup

- Seed: `latest-match-baseline-014`
- Match snapshot: `match_41020769c9f35150`
- Runner deck: `Inside Forgery Loop`
- Corp deck: `KI Rush Score - Static ICE Mix`
- Max actions: 480
- Old run: `b70355e44`, Corp win after 286 actions, final AP Runner 4 / Corp 8
- Current run: `26926f7b7`, Runner win after 34 actions, final AP Runner 7 / Corp 0

Trace files:

- `docs/reviews/ai/flipped-seed-latest-match-baseline-014-old-b70355e44-2026-07-03.json`
- `docs/reviews/ai/flipped-seed-latest-match-baseline-014-current-2026-07-03.json`

## Critical Timeline Delta

| Action | Old `b70355e44` | Current `26926f7b7` |
| ---: | --- | --- |
| Corp T1 click 1 | Install ICE on HQ | Install ICE on new Remote |
| Corp T1 click 2 | Install ICE on HQ | Install ICE on Remote 1 |
| Corp T1 click 3 | Gain credit | Gain credit |
| Runner T2 | Steals 2 agendas from R&D, then stops central pressure | Steals 2 agendas from R&D, then steals 1 agenda from open HQ |
| Corp T3 | Installs R&D ICE, later rezzes it | Installs R&D ICE, but later declines to rez it |
| Runner T4 | R&D access is stopped by rezzed Quandary | R&D run is not stopped; Runner then contests Remote 1 and finally steals from open HQ |

## Finding 1: Opening Remote-First Suppresses Necessary Central Protection

In the current run, Corp action 3 selects `corp.install_card...new_remote` with `Banpei`. The selected scoring contains:

- `corp_board_triage_alignment`: `triage_primary:protect_score_remote`, `triage_severity:high`, `triage_target:new_remote`
- `corp_ice_placement_evaluator`: `server:new_remote`, `score_remote_setup_need:true`, `immediate_stop:true`

The HQ alternative is present and knows that HQ matters:

- `server:hq`
- `hq_agenda_risk:true`
- `hq_pressure:true`
- `ICE-Platzierung=2600`

But it is still pushed down by:

- `corp_board_triage_mismatch=-2400`

On the next Corp click, after one remote ICE exists, the current run again suppresses central protection. Action 4 selects a second Remote 1 ICE and classifies HQ/R&D ICE as mismatch under:

- `triage_primary:force_scoreline_clock`
- `triage_severity:critical`
- `corp_hq_agenda_flood_pressure:true`
- `corp_hq_agenda_count:3`
- `corp_hq_agenda_points:4`

This is too narrow. With zero ICE on HQ/R&D and a full Runner exposure window before any score, "get agendas out of HQ" cannot mean "ignore HQ/R&D protection entirely". The old run also lost two agendas from R&D, but the two HQ ICE prevented the immediate third steal from HQ.

Likely layer: `semantic-runtime-corp-board-triage.ts` plus `corp-ice-placement`.

## Finding 2: Critical R&D Rez Is Misclassified as Triage Mismatch

The sharper bug appears at current action 25. Triage correctly identifies:

- `triage_primary:protect_rd`
- `triage_severity:critical`
- `triage_target:rd`
- `corp_central_pressure_server:rd`
- `corp_central_pressure_active:true`

However, the concrete legal action `rez_ice` on that same R&D ICE is scored as:

- `corp_board_triage_mismatch=-3200`
- `triage_action:rez_ice`
- `triage_action_server:rd`
- `triage_alignment:mismatch`

The selected action becomes `decline_rez` at `-645`, while rezzing Quandary falls to `-1508`.

This is internally inconsistent: `protect_rd` should not hard-penalize rezzing the ICE on R&D. The immediate reason is that `semanticRuntimeCorpEffectiveDefenseContext` reports Quandary as:

- `effective_defense_rezzable:true`
- `effective_defense_rez_cost:2`
- `effective_defense_stop:false`
- `effective_defense_tax_or_damage:false`
- `effective_defense_zero_effect:false`

But Quandary is an ETR ICE in the card/engine data, and the install-side ICE evaluator already recognizes it as:

- `definition:onr_v1_261_quandary`
- `immediate_stop:true`

So the install evaluator and rez evaluator disagree. The likely cause is not the card rule implementation. It is that the effective-defense rez assessment relies too much on `ActionSemanticCandidate` tactic/evidence signals and does not fall back strongly enough to the visible source ICE card's subroutines/roles/mechanics.

Likely layer: `semantic-runtime-corp-effective-defense.ts`, consumed by `semantic-runtime-corp-board-triage.ts`.

## Finding 3: New Hard Penalty Turns an Existing Signal Gap into a Game-Losing Decision

The old run also did not fully recognize the R&D Quandary as `effective_defense_stop:true`; its old action 24 had:

- `effective_defense_stop:false`
- `effective_defense_tax_or_damage:false`

But the penalty was only `corp_board_triage_mismatch=-126`, and plan mapping still selected `rez_ice`.

In the current run, the same signal gap is amplified to `corp_board_triage_mismatch=-3200`, so `decline_rez` wins. This explains why the regression appears after the new coherence/placement work even though part of the semantic blind spot existed before.

Likely layer: hard triage mismatch scaling and rez-action alignment.

## Working Hypothesis

This does not look like a reason to revert all ICE hints or the new ICE placement module. The failure is more specific:

1. `force_scoreline_clock` overcommits to remote construction when HQ/R&D are both open and the Runner receives a full turn before the Corp can score.
2. `protect_hq/protect_rd` treats same-target `rez_ice` as a hard mismatch if effective-defense cannot prove immediate stop.
3. Effective-defense cannot prove immediate stop for Quandary during rez, even though card data and install placement can.

## Suggested Fix Package

Point 1: Same-target central rez must not be hard mismatch
- Description: Current action 25 has `protect_rd` targeting R&D, but `rez_ice` on R&D is penalized as mismatch and `decline_rez` is chosen.
- Planned adjustment: In board triage, classify rezzable same-target `rez_ice` as match or at least neutral when the target is `protect_hq/protect_rd`. Only use hard mismatch for same-target rez when the ICE is definitely zero-effect or unaffordable.

Point 2: Effective-defense must read visible source ICE protection
- Description: Quandary is an ETR ICE, but rez assessment reports `effective_defense_stop:false`.
- Planned adjustment: Extend `semanticRuntimeCorpEffectiveDefenseContext` to inspect the visible source ICE card's subroutines/mechanics/roles as a fallback when action candidate signals are incomplete. Keep no-hidden-info boundaries: Corp can use its own installed ICE identity.

Point 3: Force-scoreline opening must not suppress all central protection before Runner exposure
- Description: Current Corp T1 installs two Remote ICE while HQ/R&D are both open and HQ contains multiple agenda points. HQ ICE alternatives are penalized as triage mismatch.
- Planned adjustment: In `force_scoreline_clock`, allow or prefer first HQ/R&D protection when central exposure is immediate and no score can occur before the Runner acts. Building a scoring remote stays positive, but central protection must not be globally treated as off-plan in this exact phase.

Point 4: Regression coverage with flipped seed pattern
- Description: Existing aggregate benchmark caught the regression, but unit coverage did not.
- Planned adjustment: Add focused tests for same-target `protect_rd` rez, Quandary/ETR effective-defense fallback, and opening agenda-flood with zero central ICE plus full Runner exposure.
