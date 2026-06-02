# AI023-1 Corp-Agenda-Semantik fachlich nachschärfen

## Kurzfazit

AI023-1 korrigiert den AI023-Stand konservativ. Alle 43 aktiven/compiled Corp-Agendas bleiben abgedeckt, es gibt keine neue Strategy ID und keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Wirkung.

## Änderungen

- Project Babylon: Overadvance-Bonuspunkte bleiben `score.overadvance_bonus` / `score.overadvance_scaling`, aber ohne `corp.fast_advance`-Anker.
- Project Venice: Overadvance plus wiederkehrende Extra-Aktion bleibt Tempo-Support und wird wie Project Zurich nicht als Fast-Advance-Anker modelliert.
- Project Zurich: bleibt bewusst support-only; die Venice/Zurich-Konsistenz ist damit hergestellt.
- World Domination: bleibt `corp.remote_scoring` -> `win_condition`, weil der extreme Punkte-Payoff ein Closeout-/Win-Condition-Befund ist und kein Fast-Advance-Befund.
- Bioweapons Engineering: verliert das breite `damage.payoff`; `score.meat_damage_amp` und `score.damage_amp` bleiben die präzise Damage-Amplifier-Evidence.
- Corporate Headhunters: ersetzt `score.brain_damage_or_hand_size_pressure` durch `score.hand_size_pressure`; die Karte wird nicht als Brain-Damage-Quelle modelliert.

## Primäre Anker-Evidenz und Support

- Project Babylon: anchors=none; primary=none; support=score.conditional_bonus_agenda_points, score.overadvance_bonus, score.overadvance_scaling
- Project Venice: anchors=none; primary=none; support=score.overadvance_bonus, score.overadvance_scaling, score.recurring_extra_action
- Project Zurich: anchors=none; primary=none; support=score.economy_recurring, score.overadvance_bonus, score.overadvance_scaling
- Bioweapons Engineering: anchors=corp.damage_kill; primary=score.damage_amp, score.meat_damage_amp; support=none
- Corporate Headhunters: anchors=corp.damage_kill, corp.tag_trace_punish; primary=risk.requires_tagged_runner, score.hand_size_pressure, score.meat_damage_source, score.tagged_meat_damage_payoff; support=damage.payoff, tag.payoff
- World Domination: anchors=corp.remote_scoring; primary=score.bonus_agenda_points, score.closeout_agenda; support=risk.high_difficulty_agenda
- Fetal AI: anchors=corp.damage_kill, corp.ambush_bluff; primary=access.agenda_ambush, access.agenda_net_damage, access.agenda_steal_tax, score.net_damage_access_punish; support=access.archives_safe_exception, access.rnd_reveal_requirement, damage.payoff
- Marked Accounts: anchors=corp.tag_trace_punish, corp.ambush_bluff; primary=access.agenda_ambush, access.agenda_tag; support=access.rnd_reveal_requirement, tag.source
- Viral Breeding Ground: anchors=corp.ambush_bluff; primary=access.agenda_ambush, access.runner_program_disruption; support=access.runner_program_bounce, score.fort_trash_on_score

## Hidden-Info und TargetProfile

Fetal AI, Marked Accounts und Viral Breeding Ground bleiben hidden-info-safe. Der Review beschreibt diese Karten vollständig, erzeugt aber keine neue Runtime-Projektion, keine Runner-KI-Sicht auf verdeckte Agenda-Semantik, keine Inspector-Leaks und keine WebSocket-/Reconnect-/Undo-/Replay-/Log-Erweiterung.

TargetProfile-Kandidaten bleiben inaktiv und report-only. Das Overadvance-/Closeout- oder Corp-Tempo-Thema bleibt Deferred Item ohne neue Strategy ID.

## JSON-Report

Der maschinenlesbare Delta-Report liegt unter `ai023-1-corp-agendas-semantics-polish-report-2026-06-02.json`.
