# AI024-1 Corp-ICE-Taktiksignale und Strategieanker

## Kurzfazit

AI024-1 korrigiert 38 ausgewählte Corp-ICE-Hints aus dem AI024-Stand. Die Abdeckung bleibt bei 95 aktiven/compiled Corp-ICE und 11 inaktiven Classic-ICE. Es werden 6 kontrollierte Funktionssignale ergänzt; es gibt keine neue Strategy-ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Neue Signale

- `corp_ice.jackout_lock`: supportOnly=false, mayAnchor=true
- `corp_ice.runner_action_loss`: supportOnly=false, mayAnchor=true
- `corp_ice.next_ice_break_lock`: supportOnly=false, mayAnchor=true
- `corp_ice.encounter_paid_subroutine_add`: supportOnly=false, mayAnchor=true
- `corp_ice.optional_self_bounce_gain`: supportOnly=true, mayAnchor=false
- `corp_ice.runner_pay_or_program_trash`: supportOnly=false, mayAnchor=true

## Geänderte Karten

- Asp: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Trace-success end-run plus post-run action payment lock; no tag text.
- Fang: `corp_ice.conditional_end_run`, `corp_ice.end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Trace-success end-run plus run lock; no tag text.
- Fang 2.0: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Trace-success end-run plus run lock; no tag text.
- Hunter: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`. Trace-success tag source only; no end-run text.
- Rex: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Trace-success end-run plus action-payment run lock; no tag text.
- Fragmentation Storm: `corp_ice.conditional_end_run`, `corp_ice.program_trash`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Trace-success end-run, program trash and run lock; removes false net-damage semantics.
- Jack Attack: `corp_ice.jackout_lock`, `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`. Explicit jack-out lock plus trace-success tag.
- Shock.r: `corp_ice.jackout_lock`, `corp_ice.next_ice_break_lock`. Next-ICE break lock and temporary jack-out lock replace generic other_utility.
- TKO 2.0: `corp_ice.end_run`, `corp_ice.runner_action_loss`. End-run plus explicit next-action loss.
- Too Many Doors: `corp_ice.conditional_end_run`, `corp_ice.random_or_guessing`. Secret bid can end the run; removes false R&D reorder signal.
- Zombie: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`. Two brain damage subroutines plus end-run; no generic other_utility.
- Chihuahua: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`. Trace-success net damage plus on-rez economy.
- Colonel Failure: `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.program_trash`. Three program-trash and two end-run subroutines; removes false self-bounce/maintenance drawback.
- Coyote: `corp_ice.future_strength_buff`, `corp_ice.rez_economy`. Future ICE strength buff plus on-rez economy.
- Datacomb: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`. End-run plus pass-triggered pay-or-uninstall drawback; no rez economy.
- Death Yo-Yo: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`, `damage.payoff`. Brain damage/end-run plus optional pass-triggered self-bounce gain.
- Homing Missile: `corp_ice.conditional_end_run`, `corp_ice.rez_paid_scaling`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`. Rez-paid trace scaling, conditional ETR and run lock.
- Iceberg: `corp_ice.damage_source`, `corp_ice.encounter_paid_subroutine_add`, `corp_ice.net_damage`, `damage.payoff`. Net damage plus encounter-paid end-run subroutine add.
- Marionette: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.self_bounce_or_maintenance_drawback`. Program trash/end-run plus pass-triggered pay-or-uninstall drawback, support-only.
- Misleading Access Menus: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`. Runner pay-or-end-run plus on-rez economy; no run_lock.
- Riddler: `corp_ice.encounter_paid_subroutine_add`. Encounter-paid end-run subroutine add, not vanilla ETR.
- Scaffolding: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`. End-run plus optional pass-triggered self-bounce gain.
- Snowbank: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`. Runner pay-or-end-run plus on-rez economy; no run_lock.
- Tumblers: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`. End-run plus optional pass-triggered self-bounce gain.
- Twisty Passages: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`. End-run plus pass-triggered pay-or-uninstall drawback.
- Washed-Up Solo Construct: `corp_ice.program_trash`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_program_trash`. Runner pay-or-program-trash plus on-rez economy; support-only to avoid over-broad program-trash anchoring.
- Cortical Scanner: `corp_ice.end_run`, `corp_ice.multi_end_run`. Three real end-run subroutines.
- Endless Corridor: `corp_ice.end_run`, `corp_ice.multi_end_run`. Two real end-run subroutines.
- Reinforced Wall: `corp_ice.end_run`, `corp_ice.multi_end_run`. Two real end-run subroutines.
- Wall of Ice: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.net_damage`, `damage.payoff`. Two net damage and two end-run subroutines.
- Toughonium Wall: `corp_ice.end_run`, `corp_ice.multi_end_run`. Four real end-run subroutines.
- Data Wall 2.0: `corp_ice.end_run`. Repo text has a single end-run subroutine.
- onr_v1_223_banpei: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.
- onr_v1_233_d-arc-knight: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.
- onr_v1_235_data-naga: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.
- onr_v1_250_ice-pick-willie: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.
- onr_v1_267_sentinels-prime: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.
- onr_v1_273_triggerman: `corp_ice.end_run`, `corp_ice.program_trash`. Simple program-trash plus ETR ICE stays support-only and no longer auto-anchors Corp ICE Tax/Glacier.

## Entfernte falsche Zuordnungen

- `corp_ice.rnd_reorder`: Too Many Doors. No R&D reorder text.
- `corp_ice.net_damage`: Fragmentation Storm. No net-damage text.
- `corp_ice.tag_source`: Asp, Fang, Fang 2.0, Rex. Trace locks end runs; no tag text.
- `tag.source`: Asp, Fang, Fang 2.0, Rex. No tag text.
- `corp_ice.self_bounce_or_maintenance_drawback`: Colonel Failure. No self-bounce or maintenance drawback text.

## Hidden-Info-Grenzen

Corp-ICE-Semantik bleibt `corp_side_only_until_rezzed`, bis ICE rezzed, exposed oder anderweitig legal bekannt ist. AI024-1 ergänzt keine Runner-seitige unrezzed-ICE-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

- target_profile_activation: deferred. Paid scaling, secret bids, action locks and program trash targets remain diagnostic/read-only until side-safe TargetProfile consumption exists.
