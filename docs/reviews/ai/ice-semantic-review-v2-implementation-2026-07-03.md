# ICE Semantic Review v2 Implementation - 2026-07-03

Status: umgesetzt im Arbeitsbranch `codex/ice-ai-hints-v2`.

## Zusammenfassung
- Geprüfte aktive Corp-ICE: 114
- Sets: classic: 11, originalset-v1: 60, proteus: 35, testset: 8
- Karten mit Taktiksignalen: alt 106, neu 114
- Karten mit Strategieanker: alt 55, neu 57
- StrategySupportPairs: alt 0, neu 72
- Geänderte Karten: 70
- Karten mit Taktiksignaländerung: 37
- Karten mit Strategieankeränderung: 15
- Neue Ankerverteilung: corp.central_stabilize: 1, corp.damage_kill: 20, corp.ice_tax_glacier: 46, corp.remote_scoring: 2, corp.tag_trace_punish: 3

## High-Impact-Änderungen
- **Cortical Scrub**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Program-Trash ist im Kartentext nicht vorhanden. Der daraus abgeleitete corp.ice_tax_glacier-Pair war fachlich falsch; es bleibt ein Brain-Damage-ICE für corp.damage_kill.
- **Data Darts**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Der zweite Subroutine-Effekt fehlte vollständig. Data Darts ist funktional die kleinere Bolter-Variante und sollte next_ice_break_lock/run_lock sowie passende StrategySupportPairs erhalten.
- **Neural Blade**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Der Break-Lock-Effekt auf die nächste ICE fehlte. Wegen nur 1 Net damage kein eigener Damage-Kill-Anker, aber klarer corp.ice_tax_glacier-Tax-Tool.
- **Colonel Failure**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Der Guide nennt mehrfachen Program-Trash ausdrücklich als anchorfähigen Sonderfall. Colonel Failure ist daher nicht nur support-only.
- **Hunting Pack**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; ice.strength_modifier ist falsch; Hunting Pack verändert keine Stärke. Die multiple Trace-Tag-Funktion sollte aber zusätzlich corp.tag_trace_punish als Enabler tragen.
- **Pocket Virtual Reality**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Der Trace-Credit-Pool fehlt im Report. Durch zwei Trace-6-Tag-Subroutinen plus zweckgebundene Credits ist die Karte stärker als einfache Fetch/Hunter-Tag-ICE und sollte corp.tag_trace_punish als Enabler tragen.
- **Bug Zapper**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; ice.strength_modifier ist falsch, weil Bug Zapper keine Stärke verändert. Dafür ist der skalierende Net-Damage-Payoff stark genug für corp.damage_kill und als deep-server payoff für corp.ice_tax_glacier.
- **Minotaur**: tacticSignals, strategySupportPairs; ice.strength_modifier ist falsch; Minotaur erhält zusätzliche ETR-Subroutinen, keine Stärke.
- **Entrapment**: tacticSignals, strategicRole, strategySupportPairs; corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect.
- **Vortex**: tacticSignals, strategicRole, strategySupportPairs; corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect.
- **Ball and Chain**: tacticSignals, strategySupportPairs; jackout_tax ist falsch; die Karte besteuert Encounters. multi_end_run/end_run sind weniger präzise als runner_pay_or_end_run + run_lock.
- **Tutor**: tacticSignals, strategySupportPairs; jackout_tax ist falsch; Tutor besteuert nicht das Jackout, sondern fügt für den Rest des Runs zusätzliche ETR-Subroutinen an spätere ICE an.
- **Vacuum Link**: tacticSignals, lineSupport, strategicRole, strategySupportPairs; Nur random_or_guessing unterschlägt die eigentliche Funktion. Vacuum Link kontrolliert den Runpath, indem der Runner zu früherem rezzed ICE zurückgesetzt wird oder jackt out.
- **Glacier**: lineSupport, strategicRole, strategySupportPairs; corp.central_stabilize und corp.remote_scoring sind für ein generisches mobiles ICE zu breit. Die Karte schützt je nach Einsatzort verschiedene Server, belegt aber primär die ICE-Tax/Glacier-Linie.

## Vollständige Alt/Neu-Liste

## classic

### Baskerville
- CardId: `onr_classic_005_baskerville`
- Kosten/Stats: Rez 10, Stärke 4, Subtypen: `sentry`, `ap`, `hellhound`, `sleepy`
- Regeln: *Do 2 Net damage. *Trace5 - If trace is successful, give Runner a Baskerville counter. Each counter does 2 Net damage at the start of each run. Runner may remove a Baskerville counter by taking an action to spend [3]. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Baskerville is reduced by [5].
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `tax.runner_persistent`, `trace.source`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `damage.corp_persistent_damage_counter`, `trace.source`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/persistent_damage_counter_ice` (high); `corp.ice_tax_glacier -> tax_tool/ice_tax_or_lock_piece` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Target/Constraints: Constraint: Rez-Kostenreduktion nur nach noisy icebreaker in diesem Run; Baskerville-Counter entfernen kostet Runner eine Aktion und [3].
- Taxonomie-/Schema-Follow-up: damage.corp_persistent_damage_counter als präziser Ersatz/Ergänzung zu tax.runner_persistent prüfen.
- Begründung: tax.runner_persistent ist zu unscharf für einen persistenten Damage-Counter. Der Damage-Counter sollte als Damage-Signal sichtbar sein.

### Bolter Swarm
- CardId: `onr_classic_006_bolter-swarm`
- Kosten/Stats: Rez 8, Stärke 4, Subtypen: `sentry`, `ap`, `hellbolt`, `sleepy`
- Regeln: *Do 4 Net damage. *Runner cannot break any subroutines on the next piece of ice encountered during this run. If Runner has used a noisy icebreaker during this run, the cost to rez Bolter Swarm is reduced by [5].
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.rez_economy`, `corp_ice.run_lock`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.rez_economy`, `corp_ice.run_lock`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_run_lock_ice` (high); `corp.ice_tax_glacier -> tax_tool/next_ice_break_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Constraint: Rez-Kostenreduktion nur nach noisy icebreaker in diesem Run.

### Brain Drain
- CardId: `onr_classic_007_brain-drain`
- Kosten/Stats: Rez 3, Stärke 3, Subtypen: `sentry`, `black_ice`, `ap`
- Regeln: *Roll a die. On a 1, do 3 brain damage.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.random_or_guessing`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.random_or_guessing`, `damage.payoff`, `risk.random_outcome`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/random_brain_damage_ice` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Taxonomie-/Schema-Follow-up: risk.random_outcome für ICE-Random-Fälle einheitlich mit Upgrade/Asset-Reviews verwenden.
- Begründung: Der Damage-Anker bleibt, aber high confidence ist wegen 1/6-Würfelrisiko zu hoch. Risiko sollte explizit sichtbar sein.

### Deadeye
- CardId: `onr_classic_008_deadeye`
- Kosten/Stats: Rez 5, Stärke 0, Subtypen: `sentry`, `killer`, `sleepy`
- Regeln: *Trash a program. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Deadeye is reduced by [5].
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.rez_economy`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.rez_economy`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: -
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `lineSupport`, `strategicRole`
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich. Constraint: Rez-Kostenreduktion nur nach noisy icebreaker in diesem Run.

### Dumpster
- CardId: `onr_classic_009_dumpster`
- Kosten/Stats: Rez 5, Stärke 5, Subtypen: `code_gate`, `deflector`
- Regeln: Dumpster cannot be installed on the Archives. *Runner is now encountering the outermost piece of rezzed ice on the Archives, instead of passing Dumpster. The run is now considered to be a run on the Archives. If there is no rezzed ice on the Archives, Runner is considered to have passed the last piece of ice on the Archives.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.other_utility`, `run.corp_redirect`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `run.corp_redirect`
- Alt Strategieanker: `corp.central_stabilize`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `defensive_tool`, `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_redirect_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: TargetProfile/Constraint: Nicht auf Archives installierbar; Redirect auf Archives und dort äußeres rezzed ICE bzw. Fallback-Regel prüfen.
- Begründung: corp_ice.other_utility ist redundant. Der central_stabilize-Anker ist zu situationsabhängig, weil Dumpster nicht nur auf HQ/R&D installiert werden kann.

### Entrapment
- CardId: `onr_classic_010_entrapment`
- Kosten/Stats: Rez 2, Stärke 4, Subtypen: `code_gate`, `deflector`
- Regeln: *If you pay [2], Runner is now encountering the outermost piece of rezzed ice on a data fort of your choice, instead of passing Entrapment. The run is now considered to be a run on that data fort. If there is no rezzed ice on that fort, Runner is considered to have passed the last piece of ice on that fort.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.other_utility`, `corp_ice.runner_pay_or_end_run`, `run.corp_redirect`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `run.corp_redirect`
- Alt Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Neu Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Alt strategische Rollen: `defensive_tool`, `tax_tool`
- Neu strategische Rollen: `tax_tool`, `defensive_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_redirect_tax_ice` (high); `corp.remote_scoring -> defensive_tool/remote_run_redirect_defense` (medium)
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: TargetProfile: legaler Redirect-Fort und dort äußeres rezzed ICE bzw. Fallback-Regel prüfen. Constraint: Corp zahlt [2] für den Redirect; nicht Runner-pay-or-end-run.
- Begründung: corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect.

### Glacier
- CardId: `onr_classic_011_glacier`
- Kosten/Stats: Rez 0, Stärke 5, Subtypen: `wall`
- Regeln: Rezzing Glacier cost 1 agenda point, in addition to the normal cost. *End the run. *End the run. [1]: Move Glacier to the outermost position of any other data fort. Use this ability only at the start of a run. You may use this ability even if Glacier is unrezzed, in which case, you reveal it.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.mobile_position_change`, `corp_ice.multi_end_run`, `ice.etr`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.mobile_position_change`, `corp_ice.multi_end_run`, `ice.etr`
- Alt Strategieanker: `corp.central_stabilize`, `corp.ice_tax_glacier`, `corp.remote_scoring`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `defensive_tool`, `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/mobile_fort_ice` (medium)
- Geänderte Felder: `lineSupport`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: TargetProfile/Constraint: Fort-Position und Start-of-run-Timing; Rez kostet zusätzlich 1 Agenda-Punkt.
- Begründung: corp.central_stabilize und corp.remote_scoring sind für ein generisches mobiles ICE zu breit. Die Karte schützt je nach Einsatzort verschiedene Server, belegt aber primär die ICE-Tax/Glacier-Linie.

### Imperial Guard
- CardId: `onr_classic_012_imperial-guard`
- Kosten/Stats: Rez 10, Stärke 5, Subtypen: `sentry`, `killer`, `sleepy`
- Regeln: *Trash a program. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Imperial Guard is reduced by [5].
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.rez_economy`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.rez_economy`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: -
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `lineSupport`, `strategicRole`
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich. Constraint: Rez-Kostenreduktion nur nach noisy icebreaker in diesem Run.

### Puzzle
- CardId: `onr_classic_013_puzzle`
- Kosten/Stats: Rez 2, Stärke 5, Subtypen: `code_gate`
- Regeln: *End the run, and trash Puzzle at end of turn. *End the run, and trash Puzzle at end of turn.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: -
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `lineSupport`, `strategicRole`

### Trapdoor
- CardId: `onr_classic_014_trapdoor`
- Kosten/Stats: Rez 3, Stärke 3, Subtypen: `code_gate`, `deflector`
- Regeln: Install Trapdoor only on R&D or HQ. *Runner is now encountering the outermost piece of rezzed ice on a subsidiary data fort of your choice, instead of passing Trapdoor. The run is now considered to be a run on that data fort. If there is no rezzed ice on that fort, Runner is considered to have passed the last piece of ice on that fort. Runner automatically breaks this subroutine if there are no subsidiary data forts.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.other_utility`, `run.corp_redirect`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `run.corp_redirect`
- Alt Strategieanker: `corp.central_stabilize`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.central_stabilize`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `defensive_tool`, `tax_tool`
- Neu strategische Rollen: `defensive_tool`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.central_stabilize -> defensive_tool/central_run_redirect_defense` (medium); `corp.ice_tax_glacier -> tax_tool/run_redirect_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Target/Constraints: TargetProfile/Constraint: Nur auf R&D oder HQ installierbar; legaler subsidiary Redirect-Fort und dort äußeres rezzed ICE bzw. Fallback-Regel prüfen.
- Begründung: corp_ice.other_utility ist redundant; die zentral-spezifische Verteidigungsrolle bleibt wegen Installationsconstraint auf HQ/R&D korrekt.

### Vortex
- CardId: `onr_classic_015_vortex`
- Kosten/Stats: Rez 0, Stärke 2, Subtypen: `code_gate`, `deflector`
- Regeln: *If you pay [2], Runner is now encountering the outermost piece of rezzed ice on a data fort of your choice, instead of passing Vortex. The run is now considered to be a run on that data fort. If there is no rezzed ice on that fort, Runner is considered to have passed the last piece of ice on that fort.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.other_utility`, `corp_ice.runner_pay_or_end_run`, `run.corp_redirect`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `run.corp_redirect`
- Alt Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Neu Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Alt strategische Rollen: `defensive_tool`, `tax_tool`
- Neu strategische Rollen: `tax_tool`, `defensive_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_redirect_tax_ice` (high); `corp.remote_scoring -> defensive_tool/remote_run_redirect_defense` (medium)
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: TargetProfile: legaler Redirect-Fort und dort äußeres rezzed ICE bzw. Fallback-Regel prüfen. Constraint: Corp zahlt [2] für den Redirect; nicht Runner-pay-or-end-run.
- Begründung: corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect.

## originalset-v1

### Asp
- CardId: `onr_v1_221_asp`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `flatline`, `sentry`
- Regeln: *Trace 5-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [1].
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Ball and Chain
- CardId: `onr_v1_222_ball-and-chain`
- Kosten/Stats: Rez 2, Stärke 5, Subtypen: `code gate`
- Regeln: [Subroutine] For the remainder of the run, Runner must pay 2 when encountering a piece of ice, in addition to any other costs, or end the run.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.end_run`, `corp_ice.jackout_tax`, `corp_ice.multi_end_run`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.runner_pay_or_end_run`, `corp_ice.run_lock`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/encounter_pay_or_end_run_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: jackout_tax ist falsch; die Karte besteuert Encounters. multi_end_run/end_run sind weniger präzise als runner_pay_or_end_run + run_lock.

### Banpei
- CardId: `onr_v1_223_banpei`
- Kosten/Stats: Rez 4, Stärke 0, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Bolter Cluster
- CardId: `onr_v1_224_bolter-cluster`
- Kosten/Stats: Rez 7, Stärke 4, Subtypen: `ap`, `hellbolt`, `sentry`
- Regeln: [Subroutine] Do 4 net damage. [Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.encounter_tax`, `corp_ice.net_damage`, `corp_ice.run_lock`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_run_lock_ice` (high); `corp.ice_tax_glacier -> tax_tool/next_ice_break_lock_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: Für dieselbe Funktion wie Bolter Swarm sollte dasselbe präzise next_ice_break_lock-Signal verwendet werden; encounter_tax ist hier zu unscharf.

### Canis Major
- CardId: `onr_v1_225_canis-major`
- Kosten/Stats: Rez 0, Stärke 4, Subtypen: `sentry`, `watchdog`
- Regeln: [Subroutine] For the remainder of the run, all further ice is encountered at +2 strength.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.future_strength_buff`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/future_strength_buff_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: future_strength_buff ist die präzisere Funktionssprache. encounter_tax und generisches ice.strength_modifier sollten hier nicht die eigentliche Wirkung ersetzen.

### Canis Minor
- CardId: `onr_v1_226_canis-minor`
- Kosten/Stats: Rez 0, Stärke 5, Subtypen: `sentry`, `watchdog`
- Regeln: [Subroutine] For the remainder of the run, all further ice is encountered at +1 strength.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.future_strength_buff`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/future_strength_buff_tax_ice` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: future_strength_buff ist die präzisere Funktionssprache. encounter_tax und generisches ice.strength_modifier sollten hier nicht die eigentliche Wirkung ersetzen.

### Cerberus
- CardId: `onr_v1_227_cerberus`
- Kosten/Stats: Rez 11, Stärke 5, Subtypen: `ap`, `black ice`, `hellhound`, `sentry`
- Regeln: [Subroutine] Do 3 Net damage. [Subroutine] Trace 5 - If trace is successful, give Runner a Cerberus counter. Each Cerberus counter does 2 Net damage at the start of each run. Runner may remove a Cerberus counter by taking an action to spend [4]. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.trace_source`, `damage.payoff`, `damage.corp_persistent_damage_counter`, `trace.source`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/persistent_damage_counter_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Target/Constraints: Constraint: Cerberus-Counter entfernen kostet Runner eine Aktion und [4].
- Taxonomie-/Schema-Follow-up: damage.corp_persistent_damage_counter als präziser gemeinsamer Signaltyp für Baskerville/Cerberus/Mastiff prüfen.
- Begründung: Der persistente Damage-Counter ist für die KI wichtiger als nur generisches damage.payoff/trace.source.

### Cinderella
- CardId: `onr_v1_228_cinderella`
- Kosten/Stats: Rez 8, Stärke 6, Subtypen: `ap`, `black ice`, `firestarter`, `sentry`
- Regeln: [Subroutine] Trace 6 - If trace is successful, end the run, trash a piece of hardware, and do 2 meat damage. This damage cannot be prevented.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.conditional_end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/meat_damage_ice` (high); `corp.ice_tax_glacier -> tax_tool/trace_success_hardware_trash_etr_ice` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Target/Constraints: TargetProfile: installiertes Runner-Hardware-Ziel erforderlich. Constraint: ETR, Hardware-Trash und Meat damage nur bei Trace-Erfolg.
- Begründung: Der End-the-run-Effekt ist an erfolgreichen Trace gekoppelt. conditional_end_run ist präziser als ein generisches end_run-Signal.

### Code Corpse
- CardId: `onr_v1_229_code-corpse`
- Kosten/Stats: Rez 10, Stärke 5, Subtypen: `ap`, `ice`, `sentry`, `zombie`
- Regeln: [Subroutine] Do 1 core damage. [Subroutine] Do 1 core damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Cortical Scanner
- CardId: `onr_v1_230_cortical-scanner`
- Kosten/Stats: Rez 7, Stärke 3, Subtypen: `code gate`
- Regeln: [Subroutine] End the run. [Subroutine] End the run. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Cortical Scrub
- CardId: `onr_v1_231_cortical-scrub`
- Kosten/Stats: Rez 7, Stärke 3, Subtypen: `ap`, `black ice`, `brainwipe`, `sentry`
- Regeln: [Subroutine] Do 1 core damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.program_trash`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Begründung: Program-Trash ist im Kartentext nicht vorhanden. Der daraus abgeleitete corp.ice_tax_glacier-Pair war fachlich falsch; es bleibt ein Brain-Damage-ICE für corp.damage_kill.

### Crystal Wall
- CardId: `onr_v1_232_crystal-wall`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### D'Arc Knight
- CardId: `onr_v1_233_d-arc-knight`
- Kosten/Stats: Rez 6, Stärke 2, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Data Darts
- CardId: `onr_v1_234_data-darts`
- Kosten/Stats: Rez 5, Stärke 3, Subtypen: `ap`, `hellbolt`, `sentry`
- Regeln: [Subroutine] Do 3 net damage. [Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: -
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_run_lock_ice` (medium); `corp.ice_tax_glacier -> tax_tool/next_ice_break_lock_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Begründung: Der zweite Subroutine-Effekt fehlte vollständig. Data Darts ist funktional die kleinere Bolter-Variante und sollte next_ice_break_lock/run_lock sowie passende StrategySupportPairs erhalten.

### Data Naga
- CardId: `onr_v1_235_data-naga`
- Kosten/Stats: Rez 9, Stärke 5, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Data Raven
- CardId: `onr_v1_236_data-raven`
- Kosten/Stats: Rez 5, Stärke 5, Subtypen: `sentry`
- Regeln: [Subroutine] Trace 5 - If trace is successful, give Runner a tag and a Data Raven counter. Each Data Raven counter gives Runner a tag at the start of each Runner turn. Runner may remove a Data Raven counter by taking an action to pay 1.
- Alt Taktiksignale: `corp_ice.persistent_tag_source`, `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Neu Taktiksignale: `corp_ice.persistent_tag_source`, `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Alt Strategieanker: `corp.tag_trace_punish`
- Neu Strategieanker: `corp.tag_trace_punish`
- Alt strategische Rollen: `engine_anchor`
- Neu strategische Rollen: `engine_anchor`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.tag_trace_punish -> engine_anchor/persistent_tag_engine_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Data Wall
- CardId: `onr_v1_237_data-wall`
- Kosten/Stats: Rez 1, Stärke 0, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Data Wall 2.0
- CardId: `onr_v1_238_data-wall-2-0`
- Kosten/Stats: Rez 2, Stärke 1, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Endless Corridor
- CardId: `onr_v1_239_endless-corridor`
- Kosten/Stats: Rez 4, Stärke 2, Subtypen: `code gate`
- Regeln: [Subroutine] End the run. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Fang
- CardId: `onr_v1_240_fang`
- Kosten/Stats: Rez 5, Stärke 4, Subtypen: `pit bull`, `sentry`
- Regeln: [Subroutine] Trace 4 - If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: Fang sollte wie Asp/Fang 2.0/Rex über conditional_end_run modelliert werden, nicht zusätzlich als generisches end_run.

### Fang 2.0
- CardId: `onr_v1_241_fang-2-0`
- Kosten/Stats: Rez 6, Stärke 5, Subtypen: `pit bull`, `sentry`
- Regeln: [Subroutine] Trace 5 - If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Fatal Attractor
- CardId: `onr_v1_242_fatal-attractor`
- Kosten/Stats: Rez 1, Stärke 4, Subtypen: `ap`, `black ice`, `sentry`
- Regeln: [Subroutine] The next time Runner encounters a piece of ice during the run, do 3 Net damage unless Runner breaks all subroutines of that piece of ice.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_ice` (medium)
- Geänderte Felder: `strategySupportPairs`

### Fetch 4.0.1
- CardId: `onr_v1_243_fetch-4-0-1`
- Kosten/Stats: Rez 0, Stärke 3, Subtypen: `bloodhound`, `sentry`
- Regeln: [Subroutine] Trace 3 - If trace is successful, give Runner a tag.
- Alt Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Neu Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Filter
- CardId: `onr_v1_244_filter`
- Kosten/Stats: Rez 0, Stärke 0, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Fire Wall
- CardId: `onr_v1_245_fire-wall`
- Kosten/Stats: Rez 5, Stärke 4, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Fragmentation Storm
- CardId: `onr_v1_246_fragmentation-storm`
- Kosten/Stats: Rez 6, Stärke 4, Subtypen: `flatline`, `sentry`
- Regeln: [Subroutine] Trace 4 - If trace is successful, end the run and trash a program, and Runner cannot run again until Runner takes an action to pay [1].
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.program_trash`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.program_trash`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Haunting Inquisition
- CardId: `onr_v1_247_haunting-inquisition`
- Kosten/Stats: Rez 8, Stärke 6, Subtypen: `code gate`
- Regeln: [Subroutine] Runner cannot make another run during his or her next six actions. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.run_lock`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.run_lock`, `corp_ice.end_run`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`

### Homewrecker™
- CardId: `onr_v1_248_homewrecker`
- Kosten/Stats: Rez 7, Stärke 5, Subtypen: `ap`, `black ice`, `firestarter`, `sentry`
- Regeln: [Subroutine] Trace 5 - If trace is successful, end the run, trash a piece of hardware, and do 2 meat damage. This damage cannot be prevented.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.conditional_end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/meat_damage_ice` (high); `corp.ice_tax_glacier -> tax_tool/trace_success_hardware_trash_etr_ice` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Target/Constraints: TargetProfile: installiertes Runner-Hardware-Ziel erforderlich. Constraint: ETR, Hardware-Trash und Meat damage nur bei Trace-Erfolg.
- Begründung: Der End-the-run-Effekt ist an erfolgreichen Trace gekoppelt. conditional_end_run ist präziser als ein generisches end_run-Signal.

### Hunter
- CardId: `onr_v1_249_hunter`
- Kosten/Stats: Rez 2, Stärke 5, Subtypen: `bloodhound`, `sentry`
- Regeln: [Subroutine] Trace 5 - If trace is successful, give Runner a tag.
- Alt Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Neu Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Ice Pick Willie
- CardId: `onr_v1_250_ice-pick-willie`
- Kosten/Stats: Rez 5, Stärke 1, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Jack Attack
- CardId: `onr_v1_251_jack-attack`
- Kosten/Stats: Rez 3, Stärke 3, Subtypen: `ap`, `sentry`
- Regeln: [Subroutine] For the remainder of the run, Runner cannot jack out. [Subroutine] Trace 5 - If trace is successful, give Runner a tag.
- Alt Taktiksignale: `corp_ice.jackout_lock`, `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Neu Taktiksignale: `corp_ice.jackout_lock`, `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/jackout_tax_or_lock_ice` (medium)
- Geänderte Felder: `strategySupportPairs`

### Keeper
- CardId: `onr_v1_252_keeper`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Laser Wire
- CardId: `onr_v1_253_laser-wire`
- Kosten/Stats: Rez 4, Stärke 2, Subtypen: `wall`
- Regeln: [Subroutine] Do 1 net damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Liche
- CardId: `onr_v1_254_liche`
- Kosten/Stats: Rez 14, Stärke 6, Subtypen: `ap`, `black ice`, `sentry`
- Regeln: [Subroutine] Do 1 core damage. [Subroutine] Do 1 core damage. [Subroutine] Do 1 core damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Mastiff
- CardId: `onr_v1_255_mastiff`
- Kosten/Stats: Rez 12, Stärke 5, Subtypen: `ap`, `black ice`, `hellhound`, `sentry`, `watchdog`
- Regeln: *Do 1 brain damage. *Do 1 Net damage. *For the remainder of the run, all ice is encountered at +1 strength. *-If trace is successful, give Runner a Mastiff counter. Each Mastiff counter does 1 brain damage at the start of each run. Runner may remove a Mastiff counter by taking an action to spend [4]. *End the run.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`, `corp_ice.net_damage`, `corp_ice.future_strength_buff`, `damage.corp_persistent_damage_counter`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/persistent_brain_damage_counter_ice` (high); `corp.ice_tax_glacier -> tax_tool/future_strength_buff_tax_ice` (medium)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Taxonomie-/Schema-Follow-up: Lokale Spoilerquelle lässt die Trace-Zahl aus; externe Kartendatenbank weist auf Trace5 hin. Signal damage.corp_persistent_damage_counter sollte auch für Baskerville/Cerberus geprüft werden.
- Begründung: Neben Damage-Kill unterstützt Mastiff über future_strength_buff dieselbe ICE-Tax-Linie wie Canis/Coyote. Der persistente Damage-Counter sollte präziser sichtbar sein.

### Mazer
- CardId: `onr_v1_256_mazer`
- Kosten/Stats: Rez 5, Stärke 5, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Nerve Labyrinth
- CardId: `onr_v1_257_nerve-labyrinth`
- Kosten/Stats: Rez 6, Stärke 4, Subtypen: `code gate`
- Regeln: [Subroutine] Do 2 net damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Neural Blade
- CardId: `onr_v1_258_neural-blade`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `ap`, `sentry`, `sword`
- Regeln: [Subroutine] Do 1 net damage. [Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: -
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/next_ice_break_lock_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Begründung: Der Break-Lock-Effekt auf die nächste ICE fehlte. Wegen nur 1 Net damage kein eigener Damage-Kill-Anker, aber klarer corp.ice_tax_glacier-Tax-Tool.

### Pi in the 'Face
- CardId: `onr_v1_259_in-the-face`
- Kosten/Stats: Rez 5, Stärke 3, Subtypen: `deckrash`, `sentry`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Pocket Virtual Reality
- CardId: `onr_v1_260_pocket-virtual-reality`
- Kosten/Stats: Rez 7, Stärke 4, Subtypen: `sentry`
- Regeln: [Subroutine] Trace 6 - If trace is successful, give Runner a tag. [Subroutine] Trace 6 - If trace is successful, give Runner a tag. Whenever Pocket Virtual Reality is encountered, gain [4]. Use these bits only to pay for the above traces. When the encounter ends, return to the bank any of the [4] you did not spend.
- Alt Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`
- Neu Taktiksignale: `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`, `trace.corp_credit_support`
- Alt Strategieanker: -
- Neu Strategieanker: `corp.tag_trace_punish`
- Alt strategische Rollen: -
- Neu strategische Rollen: `enabler`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.tag_trace_punish -> enabler/encounter_trace_tag_credit_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: Constraint: [4] Encounter-Credits nur für die beiden Trace-Subroutinen und nur bis Encounter-Ende.
- Begründung: Der Trace-Credit-Pool fehlt im Report. Durch zwei Trace-6-Tag-Subroutinen plus zweckgebundene Credits ist die Karte stärker als einfache Fetch/Hunter-Tag-ICE und sollte corp.tag_trace_punish als Enabler tragen.

### Quandary
- CardId: `onr_v1_261_quandary`
- Kosten/Stats: Rez 2, Stärke 2, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Razor Wire
- CardId: `onr_v1_262_razor-wire`
- Kosten/Stats: Rez 6, Stärke 3, Subtypen: `wall`
- Regeln: [Subroutine] Do 2 net damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Reinforced Wall
- CardId: `onr_v1_263_reinforced-wall`
- Kosten/Stats: Rez 8, Stärke 4, Subtypen: `wall`
- Regeln: [Subroutine] End the run. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Rex
- CardId: `onr_v1_264_rex`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `pit bull`, `sentry`
- Regeln: [Subroutine] Trace 3 - If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Rock Is Strong
- CardId: `onr_v1_265_rock-is-strong`
- Kosten/Stats: Rez 6, Stärke 5, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Scramble
- CardId: `onr_v1_266_scramble`
- Kosten/Stats: Rez 3, Stärke 3, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Sentinels Prime
- CardId: `onr_v1_267_sentinels-prime`
- Kosten/Stats: Rez 8, Stärke 4, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Shock.r
- CardId: `onr_v1_268_shock-r`
- Kosten/Stats: Rez 1, Stärke 3, Subtypen: `ap`, `sentry`, `stun`
- Regeln: [Subroutine] Runner cannot break any subroutines of the next piece of ice encountered during the run, and cannot jack out until after that encounter.
- Alt Taktiksignale: `corp_ice.jackout_lock`, `corp_ice.next_ice_break_lock`
- Neu Taktiksignale: `corp_ice.jackout_lock`, `corp_ice.next_ice_break_lock`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/next_ice_break_lock_ice` (medium)
- Geänderte Felder: `strategySupportPairs`

### Shotgun Wire
- CardId: `onr_v1_269_shotgun-wire`
- Kosten/Stats: Rez 8, Stärke 5, Subtypen: `wall`
- Regeln: [Subroutine] Do 2 net damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Sleeper
- CardId: `onr_v1_270_sleeper`
- Kosten/Stats: Rez 1, Stärke 1, Subtypen: `code gate`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### TKO 2.0
- CardId: `onr_v1_271_tko-2-0`
- Kosten/Stats: Rez 7, Stärke 4, Subtypen: `ap`, `knockout`, `sentry`
- Regeln: [Subroutine] End the run, and Runner forgoes his or her next action.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.runner_action_loss`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.runner_action_loss`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_tax_or_lock_piece` (medium)
- Geänderte Felder: `strategySupportPairs`

### Too Many Doors
- CardId: `onr_v1_272_too-many-doors`
- Kosten/Stats: Rez 1, Stärke 3, Subtypen: `sentry`
- Regeln: [Subroutine] Secretly spend [0], [1], or [2]; Runner does the same. Then you and Runner reveal how much each of you spent. End the run unless you spent as many bits as Runner spent.
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.random_or_guessing`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.random_or_guessing`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Triggerman
- CardId: `onr_v1_273_triggerman`
- Kosten/Stats: Rez 7, Stärke 3, Subtypen: `killer`, `sentry`
- Regeln: [Subroutine] Trash a program. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Tutor
- CardId: `onr_v1_274_tutor`
- Kosten/Stats: Rez 4, Stärke 5, Subtypen: `code gate`
- Regeln: [Subroutine] For the remainder of the run, all ice encountered has an additional subroutine, "[Subroutine] End the run," after all other subroutines.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.end_run`, `corp_ice.jackout_tax`, `corp_ice.run_lock`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.end_run`, `corp_ice.run_lock`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/future_etr_subroutine_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Taxonomie-/Schema-Follow-up: Optional: präzises Signal corp_ice.future_end_run_subroutine oder ice.corp_subroutine_support prüfen, falls die ICE-/Asset-Taxonomie vereinheitlicht werden soll.
- Begründung: jackout_tax ist falsch; Tutor besteuert nicht das Jackout, sondern fügt für den Rest des Runs zusätzliche ETR-Subroutinen an spätere ICE an.

### Vacuum Link
- CardId: `onr_v1_275_vacuum-link`
- Kosten/Stats: Rez 3, Stärke 5, Subtypen: `random`, `sentry`
- Regeln: [Subroutine] Roll a die. If you roll a 1, 2, or 3, Runner resumes the run from that many pieces of rezzed ice back, or jacks out. If there are not that many pieces of ice, Runner returns to the first piece of ice.
- Alt Taktiksignale: `corp_ice.random_or_guessing`
- Neu Taktiksignale: `corp_ice.random_or_guessing`, `corp_ice.encounter_tax`, `run.corp_run_rewind`, `risk.random_outcome`
- Alt Strategieanker: -
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: -
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/random_run_rewind_tax_ice` (medium)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Taxonomie-/Schema-Follow-up: Neues/zu prüfendes Signal: run.corp_run_rewind für same-server Rückversetzen im Run; nicht mit cross-fort run.corp_redirect vermischen.
- Begründung: Nur random_or_guessing unterschlägt die eigentliche Funktion. Vacuum Link kontrolliert den Runpath, indem der Runner zu früherem rezzed ICE zurückgesetzt wird oder jackt out.

### Viral 15
- CardId: `onr_v1_276_viral-15`
- Kosten/Stats: Rez 5, Stärke 3, Subtypen: `sentry`
- Regeln: [Subroutine] For the remainder of the run, Runner must pay [1] to jack out, in addition to any other costs. [Subroutine] For the remainder of the run, Runner trashes an installed program after passing each piece of rezzed ice, including Viral 15, unless Runner jacks out.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.jackout_tax`, `corp_ice.program_trash`, `corp_ice.run_lock`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.jackout_tax`, `corp_ice.program_trash`, `corp_ice.run_lock`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Virizz
- CardId: `onr_v1_277_virizz`
- Kosten/Stats: Rez 2, Stärke 4, Subtypen: `sentry`
- Regeln: [Subroutine] For the remainder of the run, Runner must pay an additional [1] to break each ice subroutine.
- Alt Taktiksignale: `corp_ice.break_cost_tax`, `corp_ice.encounter_tax`, `corp_ice.run_lock`
- Neu Taktiksignale: `corp_ice.break_cost_tax`, `corp_ice.encounter_tax`, `corp_ice.run_lock`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Wall of Ice
- CardId: `onr_v1_278_wall-of-ice`
- Kosten/Stats: Rez 13, Stärke 6, Subtypen: `wall`
- Regeln: [Subroutine] Do 2 net damage. [Subroutine] Do 2 net damage. [Subroutine] End the run. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_ice` (high); `corp.ice_tax_glacier -> tax_tool/multi_end_run_tax_ice` (medium)
- Geänderte Felder: `strategySupportPairs`

### Wall of Static
- CardId: `onr_v1_279_wall-of-static`
- Kosten/Stats: Rez 3, Stärke 2, Subtypen: `wall`
- Regeln: [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Zombie
- CardId: `onr_v1_280_zombie`
- Kosten/Stats: Rez 9, Stärke 4, Subtypen: `ap`, `black ice`, `sentry`, `zombie`
- Regeln: [Subroutine] Do 1 brain damage. [Subroutine] Do 1 brain damage. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `strategySupportPairs`

## proteus

### Brain Wash
- CardId: `onr_proteus_011_brain-wash`
- Kosten/Stats: Rez 3, Stärke 2, Subtypen: `ap`, `black_ice`, `brainwipe`, `sentry`
- Regeln: *Do 1 brain damage.
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Bug Zapper
- CardId: `onr_proteus_012_bug-zapper`
- Kosten/Stats: Rez 6, Stärke 2, Subtypen: `ap`, `hellbolt`, `sentry`
- Regeln: *Do 2 Net damage for each rezzed piece of ice installed outside Bug Zapper. *End the run.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `payoff_anchor`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/position_scaling_net_damage_ice` (high); `corp.ice_tax_glacier -> payoff_anchor/deep_server_damage_payoff_ice` (medium)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Begründung: ice.strength_modifier ist falsch, weil Bug Zapper keine Stärke verändert. Dafür ist der skalierende Net-Damage-Payoff stark genug für corp.damage_kill und als deep-server payoff für corp.ice_tax_glacier.

### Caryatid
- CardId: `onr_proteus_013_caryatid`
- Kosten/Stats: Rez 7, Stärke 5, Subtypen: `wall`
- Regeln: *End the run. When you rez Caryatid, you may pay [1], above the rez cost, to make it a code gate instead of a wall.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Chihuahua
- CardId: `onr_proteus_014_chihuahua`
- Kosten/Stats: Rez 0, Stärke 0, Subtypen: `ap`, `hellhound`, `sentry`
- Regeln: *Trace 1-If trace is successful, do 1 Net damage. Gain [2] when you rez Chihuahua.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Colonel Failure
- CardId: `onr_proteus_015_colonel-failure`
- Kosten/Stats: Rez 17, Stärke 6, Subtypen: `killer`, `sentry`
- Regeln: *Trash a program. *Trash a program. *Trash a program. *End the run. *End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.program_trash`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.program_trash`, `corp_ice.multi_program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: -
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/multi_program_trash_tax_ice` (high)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.
- Taxonomie-/Schema-Follow-up: Neues/zu prüfendes Signal: corp_ice.multi_program_trash für mehrfachen Program-Trash als harte Rig-Tax-Schwelle.
- Begründung: Der Guide nennt mehrfachen Program-Trash ausdrücklich als anchorfähigen Sonderfall. Colonel Failure ist daher nicht nur support-only.

### Coyote
- CardId: `onr_proteus_016_coyote`
- Kosten/Stats: Rez 0, Stärke 3, Subtypen: `sentry`, `watchdog`
- Regeln: *For the remainder of the run, all further ice is encountered at +1 strength, unless Runner pays [2] while passing Coyote. Gain [3] when you rez Coyote.
- Alt Taktiksignale: `corp_ice.future_strength_buff`, `corp_ice.rez_economy`
- Neu Taktiksignale: `corp_ice.future_strength_buff`, `corp_ice.rez_economy`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/future_strength_tax_ice` (medium)
- Geänderte Felder: `strategySupportPairs`

### Credit Blocks
- CardId: `onr_proteus_017_credit-blocks`
- Kosten/Stats: Rez 6, Stärke 3, Subtypen: `sentry`
- Regeln: *End the run. When you rez Credit Blocks, you may pay [1], above the rez cost, to make it a wall instead of a sentry.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_economy`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`
- Taxonomie-/Schema-Follow-up: Optional: Wenn Mehrkosten beim Rezzen explizit modelliert werden sollen, eigenes Risiko/Cost-Signal wie risk.additional_rez_cost statt corp_ice.rez_economy verwenden.
- Begründung: Die Karte gibt keine Credits und reduziert keine Kosten; sie kann beim Rezzen gegen Mehrkosten den ICE-Typ ändern. corp_ice.rez_economy ist deshalb falsch.

### Datacomb
- CardId: `onr_proteus_018_datacomb`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `wall`
- Regeln: *End the run. If Runner passes Datacomb, pay [1], or uninstall it and store it in HQ.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Death Yo-Yo
- CardId: `onr_proteus_019_death-yo-yo`
- Kosten/Stats: Rez 7, Stärke 2, Subtypen: `ap`, `black_ice`, `brainwipe`, `sentry`
- Regeln: *Do 1 brain damage. *End the run. If Runner passes Death Yo-Yo, you may choose to uninstall it, store it in HQ, and gain [1].
- Alt Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`, `damage.payoff`
- Alt Strategieanker: `corp.damage_kill`
- Neu Strategieanker: `corp.damage_kill`
- Alt strategische Rollen: `punish_payoff`
- Neu strategische Rollen: `punish_payoff`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Digiconda
- CardId: `onr_proteus_020_digiconda`
- Kosten/Stats: Rez 6, Stärke -, Subtypen: `ap`, `sentry`, `sword`
- Regeln: *Do 2 Net damage. *End the run. Pay [X], above the rez cost, when you rez Digiconda. X is Digiconda 's strength, and X cannot be greater than 6.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.rez_paid_scaling`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.rez_paid_scaling`, `damage.payoff`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/rez_paid_scaling_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.

### Dog Pile
- CardId: `onr_proteus_021_dog-pile`
- Kosten/Stats: Rez 5, Stärke 0, Subtypen: `ap`, `sentry`
- Regeln: *Do 1 Net damage for each rezzed piece of ice installed outside Dog Pile. *End the run. Dog Pile has +1 strength for each rezzed piece of ice installed outside it.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/position_scaling_net_damage_ice` (medium); `corp.ice_tax_glacier -> tax_tool/position_scaling_strength_tax_ice` (high)
- Geänderte Felder: `lineSupport`, `strategicRole`, `strategySupportPairs`
- Begründung: Dog Pile hat nicht nur Strength-Scaling, sondern auch skalierenden Net-Damage. Der Damage-Kill-Bezug sollte sichtbar sein.

### Food Fight
- CardId: `onr_proteus_022_food-fight`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `deckrash`, `sentry`
- Regeln: Food Fight has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/rez_paid_scaling_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.

### Galatea
- CardId: `onr_proteus_023_galatea`
- Kosten/Stats: Rez 6, Stärke 4, Subtypen: `wall`
- Regeln: *End the run. When you rez Galatea, you may pay [1], above the rez cost, to make it a code gate instead of a wall.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Gatekeeper
- CardId: `onr_proteus_024_gatekeeper`
- Kosten/Stats: Rez 3, Stärke 4, Subtypen: `code_gate`
- Regeln: Gatekeeper has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/rez_paid_scaling_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.

### Homing Missile
- CardId: `onr_proteus_025_homing-missile`
- Kosten/Stats: Rez 4, Stärke -, Subtypen: `sentry`
- Regeln: *Trace x-If trace is successful, end the run, and Runner cannot make another run until Runner takes an action to pay [2]. Pay X, above the rez cost, when you rez Homing Missile. X is Homing Missile 's strength and trace limit, and X cannot be greater than 8.
- Alt Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.rez_paid_scaling`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Neu Taktiksignale: `corp_ice.conditional_end_run`, `corp_ice.rez_paid_scaling`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_lock_ice` (high)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.

### Hunting Pack
- CardId: `onr_proteus_026_hunting-pack`
- Kosten/Stats: Rez 1, Stärke 4, Subtypen: `bloodhound`, `sentry`
- Regeln: For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one subroutine as follows: "*Trace 5-If trace is successful, give Runner a tag."
- Alt Taktiksignale: `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `corp_ice.tag_source`, `ice.strength_modifier`, `tag.source`
- Neu Taktiksignale: `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `corp_ice.tag_source`, `tag.source`, `corp_ice.trace_source`, `trace.source`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`, `corp.tag_trace_punish`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`, `enabler`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/position_scaling_trace_tag_tax_ice` (medium); `corp.tag_trace_punish -> enabler/position_scaling_trace_tag_source` (medium)
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`
- Taxonomie-/Schema-Follow-up: Tag-Trace-Strategieanker bleibt bewusst deferred; Skalierung ist nützlich, aber ohne eigenen Payoff kein bestätigter Punish-Anchor.
- Begründung: ice.strength_modifier ist falsch; Hunting Pack verändert keine Stärke. Die multiple Trace-Tag-Funktion sollte aber zusätzlich corp.tag_trace_punish als Enabler tragen.

### Iceberg
- CardId: `onr_proteus_027_iceberg`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `wall`
- Regeln: *Do 1 Net damage. *[2]: Iceberg has one "*End the run" subroutine for the present encounter. Use this ability only when Runner encounters Iceberg.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.encounter_paid_subroutine_add`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.encounter_paid_subroutine_add`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/paid_end_run_subroutine_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.
- Taxonomie-/Schema-Follow-up: Optionales Follow-up: bezahlte ETR-Subroutine ist aktuell nur über corp_ice.encounter_paid_subroutine_add modelliert.

### Lesser Arcana
- CardId: `onr_proteus_028_lesser-arcana`
- Kosten/Stats: Rez 7, Stärke 4, Subtypen: `sentry`
- Regeln: *End the run. When you rez Lesser Arcana, you may pay 1, above the rez cost, to make it a wall instead of a sentry.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Marionette
- CardId: `onr_proteus_029_marionette`
- Kosten/Stats: Rez 3, Stärke 0, Subtypen: `killer`, `sentry`
- Regeln: *Trash a program. *End the run. If Runner passes Marionette, pay [1], or uninstall it and store it in HQ.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.self_bounce_or_maintenance_drawback`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.program_trash`, `corp_ice.self_bounce_or_maintenance_drawback`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

### Mastermind
- CardId: `onr_proteus_030_mastermind`
- Kosten/Stats: Rez 7, Stärke 0, Subtypen: `ap`, `black_ice`, `sentry`, `zombie`
- Regeln: *Do 1 brain damage for each rezzed piece of ice installed outside Mastermind. *End the run. Mastermind has +1 strength for each rezzed piece of ice installed outside it.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier`, `corp_ice.brain_damage`
- Alt Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.damage_kill`, `corp.ice_tax_glacier`
- Alt strategische Rollen: `punish_payoff`, `tax_tool`
- Neu strategische Rollen: `punish_payoff`, `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/brain_damage_ice` (high); `corp.ice_tax_glacier -> tax_tool/position_scaling_tax_ice` (medium)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`

### Minotaur
- CardId: `onr_proteus_031_minotaur`
- Kosten/Stats: Rez 6, Stärke 4, Subtypen: `sentry`
- Regeln: For each rezzed code gate or wall installed outside Minotaur, Minotaur has one "*End the run" subroutine.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `ice.strength_modifier`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/position_scaling_etr_ice` (high)
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`
- Begründung: ice.strength_modifier ist falsch; Minotaur erhält zusätzliche ETR-Subroutinen, keine Stärke.

### Misleading Access Menus
- CardId: `onr_proteus_032_misleading-access-menus`
- Kosten/Stats: Rez 0, Stärke 1, Subtypen: `code_gate`
- Regeln: *End the run unless Runner pays [1]. Gain [3] when you rez Misleading Access Menus.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/pay_or_end_run_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Mobile Barricade
- CardId: `onr_proteus_033_mobile-barricade`
- Kosten/Stats: Rez 6, Stärke 3, Subtypen: `wall`
- Regeln: *Do 1 Net damage. *End the run. [1]: Move Mobile Barricade and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Mobile Barricade is unrezzed, in which case, you reveal it.
- Alt Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.mobile_position_change`, `corp_ice.net_damage`, `damage.payoff`
- Neu Taktiksignale: `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.mobile_position_change`, `corp_ice.net_damage`, `damage.payoff`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile/Constraint: Fort-Position und Start-of-run-Timing.

### Riddler
- CardId: `onr_proteus_034_riddler`
- Kosten/Stats: Rez 2, Stärke 4, Subtypen: `code_gate`
- Regeln: [2]: Riddler has one "*End the run" subroutine for the present encounter. Use this ability only when Runner encounters Riddler.
- Alt Taktiksignale: `corp_ice.encounter_paid_subroutine_add`
- Neu Taktiksignale: `corp_ice.encounter_paid_subroutine_add`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/paid_end_run_subroutine_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.
- Taxonomie-/Schema-Follow-up: Optionales Follow-up: bezahlte ETR-Subroutine ist aktuell nur über corp_ice.encounter_paid_subroutine_add modelliert.

### Roadblock
- CardId: `onr_proteus_035_roadblock`
- Kosten/Stats: Rez 2, Stärke 0, Subtypen: `code_gate`, `random`
- Regeln: *End the run. When Runner encounters Roadblock, roll a die. On a 6, derez Roadblock, and Runner automatically passes it; otherwise, add the result to Roadblock's strength for that encounter.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.random_or_guessing`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.random_or_guessing`, `risk.random_outcome`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`
- Taxonomie-/Schema-Follow-up: Optional: eigenes Risiko für random bypass/derez liability prüfen, wenn Roadblock-ähnliche Karten häufiger werden.
- Begründung: Die Karte hat ein relevantes Zufallsergebnis: meistens temporäre Strength-Erhöhung, auf 6 aber Derez und automatisches Passieren. risk.random_outcome sollte sichtbar sein.

### Sandstorm
- CardId: `onr_proteus_036_sandstorm`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `wall`
- Regeln: Sandstorm has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.rez_paid_scaling`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/rez_paid_scaling_ice` (medium)
- Geänderte Felder: `strategySupportPairs`
- Target/Constraints: Choice/Constraint: bezahltes X oder encounter-paid Option muss über LegalActions bewertet werden.

### Scaffolding
- CardId: `onr_proteus_037_scaffolding`
- Kosten/Stats: Rez 2, Stärke 0, Subtypen: `wall`
- Regeln: *End the run. If Runner passes Scaffolding, you may choose to uninstall it, store it in HQ, and gain [1].
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Snowbank
- CardId: `onr_proteus_038_snowbank`
- Kosten/Stats: Rez 0, Stärke 0, Subtypen: `wall`
- Regeln: *End the run unless Runner pays [1]. Gain [3] when you rez Snowbank.
- Alt Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`
- Neu Taktiksignale: `corp_ice.encounter_tax`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_end_run`
- Alt Strategieanker: `corp.ice_tax_glacier`
- Neu Strategieanker: `corp.ice_tax_glacier`
- Alt strategische Rollen: `tax_tool`
- Neu strategische Rollen: `tax_tool`
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/pay_or_end_run_ice` (high)
- Geänderte Felder: `strategySupportPairs`

### Sphinx 2006
- CardId: `onr_proteus_039_sphinx-2006`
- Kosten/Stats: Rez 6, Stärke 5, Subtypen: `code_gate`
- Regeln: *End the run. When you rez Sphinx 2006, you may pay [4], above the rez cost, to make it a sentry instead of a code gate.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Sumo 2008
- CardId: `onr_proteus_040_sumo-2008`
- Kosten/Stats: Rez 8, Stärke 5, Subtypen: `sentry`
- Regeln: *End the run. When you rez Sumo 2008, you may pay [1], above the rez cost, to make it a wall instead of a sentry.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Toughonium™ Wall
- CardId: `onr_proteus_041_toughoniumtm-wall`
- Kosten/Stats: Rez 13, Stärke 7, Subtypen: `wall`
- Regeln: [Subroutine] End the run. [Subroutine] End the run. [Subroutine] End the run. [Subroutine] End the run.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.multi_end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Tumblers
- CardId: `onr_proteus_042_tumblers`
- Kosten/Stats: Rez 5, Stärke 4, Subtypen: `code_gate`
- Regeln: *End the run. If Runner passes Tumblers, you may choose to uninstall it, store it in HQ, and gain [1].
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.optional_self_bounce_gain`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Twisty Passages
- CardId: `onr_proteus_043_twisty-passages`
- Kosten/Stats: Rez 3, Stärke 4, Subtypen: `code_gate`
- Regeln: *End the run. If Runner passes Twisty Passages, pay [1], or uninstall it and store it in HQ.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.self_bounce_or_maintenance_drawback`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -

### Walking Wall
- CardId: `onr_proteus_044_walking-wall`
- Kosten/Stats: Rez 5, Stärke 3, Subtypen: `wall`
- Regeln: *End the run. [1]: Move Walking Wall and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Walking Wall is unrezzed, in which case, you reveal it.
- Alt Taktiksignale: `corp_ice.end_run`, `corp_ice.mobile_position_change`
- Neu Taktiksignale: `corp_ice.end_run`, `corp_ice.mobile_position_change`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile/Constraint: Fort-Position und Start-of-run-Timing.

### Washed-Up Solo Construct
- CardId: `onr_proteus_045_washed-up-solo-construct`
- Kosten/Stats: Rez 0, Stärke 0, Subtypen: `killer`, `sentry`
- Regeln: *Trash a program unless Runner pays [1]. Gain [3] when you rez Washed-Up Solo Construct.
- Alt Taktiksignale: `corp_ice.program_trash`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_program_trash`
- Neu Taktiksignale: `corp_ice.program_trash`, `corp_ice.rez_economy`, `corp_ice.runner_pay_or_program_trash`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: -
- Target/Constraints: TargetProfile: installiertes Runner-Programm als legales Trash-Ziel erforderlich.

## testset

### Gate ICE
- CardId: `v08_gate_ice`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `code_gate`
- Regeln: Die Corp erhält 2 Credits. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `economy.corp_credit_burst`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Simple Barrier ICE
- CardId: `simple_barrier_ice`
- Kosten/Stats: Rez 3, Stärke 3, Subtypen: `barrier`
- Regeln: End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Simple Code Gate ICE
- CardId: `simple_code_gate_ice`
- Kosten/Stats: Rez 2, Stärke 2, Subtypen: `code_gate`
- Regeln: Die Corp erhält 1 Credit. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `economy.corp_credit_burst`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Simple Sentry ICE
- CardId: `simple_sentry_ice`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `sentry`
- Regeln: Der Runner verliert 2 Credits, falls möglich. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `economy.runner_credit_loss`, `tax.runner_credit`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Simple Tag ICE
- CardId: `simple_tag_ice`
- Kosten/Stats: Rez 3, Stärke 2, Subtypen: `sentry`
- Regeln: Gib dem Runner 1 Tag. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `corp_ice.tag_source`, `tag.source`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Simple Taxing Barrier ICE
- CardId: `simple_taxing_barrier_ice`
- Kosten/Stats: Rez 4, Stärke 4, Subtypen: `barrier`
- Regeln: Der Runner verliert 1 Credit. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `economy.runner_credit_loss`, `tax.runner_credit`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Wall ICE
- CardId: `v08_wall_ice`
- Kosten/Stats: Rez 5, Stärke 5, Subtypen: `barrier`
- Regeln: End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

### Watchdog ICE
- CardId: `v08_watchdog_ice`
- Kosten/Stats: Rez 4, Stärke 3, Subtypen: `sentry`
- Regeln: Gib dem Runner 1 Tag. End the run.
- Alt Taktiksignale: -
- Neu Taktiksignale: `corp_ice.tag_source`, `tag.source`, `corp_ice.end_run`
- Alt Strategieanker: -
- Neu Strategieanker: -
- Alt strategische Rollen: -
- Neu strategische Rollen: -
- Alt StrategySupportPairs: -
- Neu StrategySupportPairs: -
- Geänderte Felder: `tacticSignals`

## Verifikation

Grün:

- `node scripts/check-ice-semantic-review-v2.mjs`
- `node scripts/check-ai024-corp-ice-semantics.mjs`
- `node scripts/check-ai024-1-corp-ice-semantics-polish.mjs`
- `node scripts/check-ai-action-semantic-signal-catalog.mjs`
- `git diff --check`

Residual-Gate:

- `node scripts/check-ai-strategy-taxonomy.mjs` bleibt rot mit 30 Fehlern. Derselbe Fehlerstand besteht bereits auf `main`; nach Ergänzung der ICE-v2-Derivation-Regeln erzeugen die neuen ICE-v2-Signale keinen zusätzlichen Anchor-Contract-Fehler. Removal Condition: Legacy-Taktiksignal-Ankerverträge und die alte ungültige Signal-ID im AI004-Taxonomie-Backlog bereinigen.
