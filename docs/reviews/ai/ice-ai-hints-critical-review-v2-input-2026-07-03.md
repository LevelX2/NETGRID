# ICE AI-Hints Critical Review v2 – 2026-07-03

Status: Gegenvorschlag zum Upload-Report `ice_semantic_review_v1_2026-07-03.*`. Keine aktiven Hint-Dateien geändert.

## Kurzfazit

Den Upload-Report würde ich nicht 1:1 übernehmen. Die Grundrichtung ist richtig: einfache ETR- und einfache Program-Trash-ICE bleiben support-only, und die fehlenden `strategySupportPairs` werden hierarchisch ergänzt. Kritisch sind aber mehrere falsche oder zu unscharfe Signale, insbesondere bei Position-Scaling, Redirects, Jackout-Tax, Program-Trash und Next-ICE-Break-Lock.

Wichtigster Unterschied: v2 reduziert nicht pauschal, sondern korrigiert in beide Richtungen. Einige überbreite Anker fallen weg, aber mehrere bisher unterschätzte ICE bekommen jetzt echte Strategiepaare.

## Count-Vergleich

| Metrik | Upload v1 | Kritische v2 | Delta |
|---|---:|---:|---:|
| Geprüfte Corp-ICE | 114 | 114 | 0 |
| Karten mit Taktiksignalen | 114 | 114 | 0 |
| Karten mit Strategieanker | 52 | 57 | +5 |
| StrategySupportPairs | 66 | 72 | +6 |
| Overrides gegen Upload-Report | — | 29 | — |

### v2-Ankerverteilung

- `corp.central_stabilize`: 1
- `corp.damage_kill`: 20
- `corp.ice_tax_glacier`: 46
- `corp.remote_scoring`: 2
- `corp.tag_trace_punish`: 3

## Wichtigste fachliche Korrekturen

| Karte | Entscheidung | Begründung |
|---|---|---|
| **Cortical Scrub** | Program-Trash entfernen; `corp.ice_tax_glacier` entfernen | Kartentext enthält Brain/Core damage + ETR, aber keinen Program-Trash. |
| **Data Darts** | Run-Lock/Next-ICE-Break-Lock ergänzen; Damage- und Glacier-Pairs hinzufügen | Funktional kleine Bolter-Variante; der zweite Subroutine-Effekt fehlte vollständig. |
| **Neural Blade** | Run-Lock/Next-ICE-Break-Lock ergänzen; Glacier-Pair hinzufügen | Nur 1 Net damage, aber starker Next-ICE-Lock. |
| **Colonel Failure** | `corp.ice_tax_glacier` hinzufügen | Drei Program-Trash + zwei ETR erfüllen die Guide-Schwelle für anchorfähigen Program-Trash. |
| **Hunting Pack** | `ice.strength_modifier` entfernen; `corp.tag_trace_punish` hinzufügen | Die Karte verändert keine Stärke, erzeugt aber multiple Trace-Tag-Subroutinen. |
| **Pocket Virtual Reality** | Trace-Credit-Signal und `corp.tag_trace_punish` hinzufügen | Zwei Trace-6-Tag-Subroutinen plus encounter-lokaler Trace-Credit-Pool sind ein starker Enabler. |
| **Bug Zapper** | `ice.strength_modifier` entfernen; Damage-Kill hinzufügen | Kein Strength-Mod, aber skalierender Net-Damage-Payoff. |
| **Minotaur** | `ice.strength_modifier` entfernen | Es skaliert die Anzahl der ETR-Subroutinen, nicht die Stärke. |
| **Entrapment / Vortex** | `corp_ice.runner_pay_or_end_run` entfernen | Die Corp zahlt [2] für Redirect; der Runner zahlt nicht. |
| **Ball and Chain / Tutor** | `jackout_tax` entfernen | Beide besteuern Encounters bzw. spätere Subroutinen, nicht das Jackout. |
| **Vacuum Link** | Run-Rewind-Signal und Glacier-Pair hinzufügen | Der eigentliche Effekt ist Runpath-Kontrolle, nicht nur Zufall. |
| **Glacier** | Central-/Remote-Anker entfernen | Mobile Verteidigung belegt primär ICE-Tax/Glacier; konkrete Serverrolle ist Einsatzkontext. |

## Vollständige Override-Liste gegen den Upload-Report

| Karte | Prio | Geänderte Felder | Finale Taktiksignale | Finale StrategySupportPairs | Begründung |
|---|---:|---|---|---|---|
| **Cortical Scrub** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `damage.payoff` | `corp.damage_kill → punish_payoff/brain_damage_ice` (high) | Program-Trash ist im Kartentext nicht vorhanden. Der daraus abgeleitete corp.ice_tax_glacier-Pair war fachlich falsch; es bleibt ein Brain-Damage-ICE für corp.damage_kill. |
| **Credit Blocks** | high | `tacticSignals`, `taxonomyFollowup` | `corp_ice.end_run`, `corp_ice.type_choice_or_mode_choice` | — | Die Karte gibt keine Credits und reduziert keine Kosten; sie kann beim Rezzen gegen Mehrkosten den ICE-Typ ändern. corp_ice.rez_economy ist deshalb falsch. |
| **Bug Zapper** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs` | `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff` | `corp.damage_kill → punish_payoff/position_scaling_net_damage_ice` (high)<br>`corp.ice_tax_glacier → payoff_anchor/deep_server_damage_payoff_ice` (medium) | ice.strength_modifier ist falsch, weil Bug Zapper keine Stärke verändert. Dafür ist der skalierende Net-Damage-Payoff stark genug für corp.damage_kill und als deep-server payoff für corp.ice_tax_glacier. |
| **Dog Pile** | medium | `lineSupport`, `strategicRole`, `strategySupportPairs` | `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `damage.payoff`, `ice.strength_modifier` | `corp.damage_kill → punish_payoff/position_scaling_net_damage_ice` (medium)<br>`corp.ice_tax_glacier → tax_tool/position_scaling_strength_tax_ice` (high) | Dog Pile hat nicht nur Strength-Scaling, sondern auch skalierenden Net-Damage. Der Damage-Kill-Bezug sollte sichtbar sein. |
| **Hunting Pack** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs` | `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling`, `corp_ice.tag_source`, `tag.source`, `corp_ice.trace_source`, `trace.source` | `corp.ice_tax_glacier → tax_tool/position_scaling_trace_tag_tax_ice` (medium)<br>`corp.tag_trace_punish → enabler/position_scaling_trace_tag_source` (medium) | ice.strength_modifier ist falsch; Hunting Pack verändert keine Stärke. Die multiple Trace-Tag-Funktion sollte aber zusätzlich corp.tag_trace_punish als Enabler tragen. |
| **Minotaur** | high | `tacticSignals`, `strategySupportPairs` | `corp_ice.end_run`, `corp_ice.outer_ice_scaling`, `corp_ice.position_scaling` | `corp.ice_tax_glacier → tax_tool/position_scaling_etr_ice` (high) | ice.strength_modifier ist falsch; Minotaur erhält zusätzliche ETR-Subroutinen, keine Stärke. |
| **Data Darts** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs` | `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff` | `corp.damage_kill → punish_payoff/net_damage_run_lock_ice` (medium)<br>`corp.ice_tax_glacier → tax_tool/next_ice_break_lock_ice` (high) | Der zweite Subroutine-Effekt fehlte vollständig. Data Darts ist funktional die kleinere Bolter-Variante und sollte next_ice_break_lock/run_lock sowie passende StrategySupportPairs erhalten. |
| **Neural Blade** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs` | `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff` | `corp.ice_tax_glacier → tax_tool/next_ice_break_lock_ice` (high) | Der Break-Lock-Effekt auf die nächste ICE fehlte. Wegen nur 1 Net damage kein eigener Damage-Kill-Anker, aber klarer corp.ice_tax_glacier-Tax-Tool. |
| **Bolter Cluster** | medium | `tacticSignals`, `strategySupportPairs` | `corp_ice.damage_source`, `corp_ice.net_damage`, `corp_ice.next_ice_break_lock`, `corp_ice.run_lock`, `damage.payoff` | `corp.damage_kill → punish_payoff/net_damage_run_lock_ice` (high)<br>`corp.ice_tax_glacier → tax_tool/next_ice_break_lock_ice` (high) | Für dieselbe Funktion wie Bolter Swarm sollte dasselbe präzise next_ice_break_lock-Signal verwendet werden; encounter_tax ist hier zu unscharf. |
| **Canis Major** | medium | `tacticSignals`, `strategySupportPairs` | `corp_ice.future_strength_buff` | `corp.ice_tax_glacier → tax_tool/future_strength_buff_tax_ice` (high) | future_strength_buff ist die präzisere Funktionssprache. encounter_tax und generisches ice.strength_modifier sollten hier nicht die eigentliche Wirkung ersetzen. |
| **Canis Minor** | medium | `tacticSignals`, `strategySupportPairs` | `corp_ice.future_strength_buff` | `corp.ice_tax_glacier → tax_tool/future_strength_buff_tax_ice` (medium) | future_strength_buff ist die präzisere Funktionssprache. encounter_tax und generisches ice.strength_modifier sollten hier nicht die eigentliche Wirkung ersetzen. |
| **Entrapment** | high | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.encounter_tax`, `run.corp_redirect` | `corp.ice_tax_glacier → tax_tool/run_redirect_tax_ice` (high)<br>`corp.remote_scoring → defensive_tool/remote_run_redirect_defense` (medium) | corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect. |
| **Vortex** | high | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.encounter_tax`, `run.corp_redirect` | `corp.ice_tax_glacier → tax_tool/run_redirect_tax_ice` (high)<br>`corp.remote_scoring → defensive_tool/remote_run_redirect_defense` (medium) | corp_ice.runner_pay_or_end_run ist fachlich falsch, weil die Corp [2] zahlt. corp_ice.other_utility ist redundant neben run.corp_redirect. |
| **Dumpster** | medium | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.encounter_tax`, `run.corp_redirect` | `corp.ice_tax_glacier → tax_tool/run_redirect_tax_ice` (high) | corp_ice.other_utility ist redundant. Der central_stabilize-Anker ist zu situationsabhängig, weil Dumpster nicht nur auf HQ/R&D installiert werden kann. |
| **Trapdoor** | medium | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.encounter_tax`, `run.corp_redirect` | `corp.central_stabilize → defensive_tool/central_run_redirect_defense` (medium)<br>`corp.ice_tax_glacier → tax_tool/run_redirect_tax_ice` (high) | corp_ice.other_utility ist redundant; die zentral-spezifische Verteidigungsrolle bleibt wegen Installationsconstraint auf HQ/R&D korrekt. |
| **Ball and Chain** | high | `tacticSignals`, `strategySupportPairs` | `corp_ice.encounter_tax`, `corp_ice.runner_pay_or_end_run`, `corp_ice.run_lock` | `corp.ice_tax_glacier → tax_tool/encounter_pay_or_end_run_tax_ice` (high) | jackout_tax ist falsch; die Karte besteuert Encounters. multi_end_run/end_run sind weniger präzise als runner_pay_or_end_run + run_lock. |
| **Tutor** | high | `tacticSignals`, `strategySupportPairs`, `taxonomyFollowup` | `corp_ice.encounter_tax`, `corp_ice.end_run`, `corp_ice.run_lock` | `corp.ice_tax_glacier → tax_tool/future_etr_subroutine_tax_ice` (high) | jackout_tax ist falsch; Tutor besteuert nicht das Jackout, sondern fügt für den Rest des Runs zusätzliche ETR-Subroutinen an spätere ICE an. |
| **Cinderella** | medium | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.damage_source`, `corp_ice.conditional_end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source` | `corp.damage_kill → punish_payoff/meat_damage_ice` (high)<br>`corp.ice_tax_glacier → tax_tool/trace_success_hardware_trash_etr_ice` (medium) | Der End-the-run-Effekt ist an erfolgreichen Trace gekoppelt. conditional_end_run ist präziser als ein generisches end_run-Signal. |
| **Homewrecker™** | medium | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.damage_source`, `corp_ice.conditional_end_run`, `corp_ice.hardware_trash`, `corp_ice.meat_damage`, `corp_ice.trace_source`, `damage.payoff`, `trace.source` | `corp.damage_kill → punish_payoff/meat_damage_ice` (high)<br>`corp.ice_tax_glacier → tax_tool/trace_success_hardware_trash_etr_ice` (medium) | Der End-the-run-Effekt ist an erfolgreichen Trace gekoppelt. conditional_end_run ist präziser als ein generisches end_run-Signal. |
| **Fang** | low | `tacticSignals`, `strategySupportPairs` | `corp_ice.conditional_end_run`, `corp_ice.run_lock`, `corp_ice.trace_source`, `trace.source` | `corp.ice_tax_glacier → tax_tool/run_lock_ice` (high) | Fang sollte wie Asp/Fang 2.0/Rex über conditional_end_run modelliert werden, nicht zusätzlich als generisches end_run. |
| **Colonel Failure** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `taxonomyFollowup` | `corp_ice.end_run`, `corp_ice.multi_end_run`, `corp_ice.program_trash`, `corp_ice.multi_program_trash` | `corp.ice_tax_glacier → tax_tool/multi_program_trash_tax_ice` (high) | Der Guide nennt mehrfachen Program-Trash ausdrücklich als anchorfähigen Sonderfall. Colonel Failure ist daher nicht nur support-only. |
| **Pocket Virtual Reality** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.tag_source`, `corp_ice.trace_source`, `tag.source`, `trace.source`, `trace.corp_credit_support` | `corp.tag_trace_punish → enabler/encounter_trace_tag_credit_ice` (high) | Der Trace-Credit-Pool fehlt im Report. Durch zwei Trace-6-Tag-Subroutinen plus zweckgebundene Credits ist die Karte stärker als einfache Fetch/Hunter-Tag-ICE und sollte corp.tag_trace_punish als Enabler tragen. |
| **Mastiff** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `taxonomyFollowup` | `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.trace_source`, `damage.payoff`, `trace.source`, `corp_ice.net_damage`, `corp_ice.future_strength_buff`, `damage.corp_persistent_damage_counter` | `corp.damage_kill → punish_payoff/persistent_brain_damage_counter_ice` (high)<br>`corp.ice_tax_glacier → tax_tool/future_strength_buff_tax_ice` (medium) | Neben Damage-Kill unterstützt Mastiff über future_strength_buff dieselbe ICE-Tax-Linie wie Canis/Coyote. Der persistente Damage-Counter sollte präziser sichtbar sein. |
| **Baskerville** | medium | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `taxonomyFollowup` | `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.rez_economy`, `corp_ice.trace_source`, `damage.payoff`, `damage.corp_persistent_damage_counter`, `trace.source` | `corp.damage_kill → punish_payoff/persistent_damage_counter_ice` (high)<br>`corp.ice_tax_glacier → tax_tool/ice_tax_or_lock_piece` (medium) | tax.runner_persistent ist zu unscharf für einen persistenten Damage-Counter. Der Damage-Counter sollte als Damage-Signal sichtbar sein. |
| **Cerberus** | medium | `tacticSignals`, `strategySupportPairs`, `targetOrConstraints`, `taxonomyFollowup` | `corp_ice.damage_source`, `corp_ice.end_run`, `corp_ice.net_damage`, `corp_ice.trace_source`, `damage.payoff`, `damage.corp_persistent_damage_counter`, `trace.source` | `corp.damage_kill → punish_payoff/persistent_damage_counter_ice` (high) | Der persistente Damage-Counter ist für die KI wichtiger als nur generisches damage.payoff/trace.source. |
| **Brain Drain** | medium | `tacticSignals`, `strategySupportPairs`, `taxonomyFollowup` | `corp_ice.brain_damage`, `corp_ice.damage_source`, `corp_ice.random_or_guessing`, `damage.payoff`, `risk.random_outcome` | `corp.damage_kill → punish_payoff/random_brain_damage_ice` (medium) | Der Damage-Anker bleibt, aber high confidence ist wegen 1/6-Würfelrisiko zu hoch. Risiko sollte explizit sichtbar sein. |
| **Roadblock** | medium | `tacticSignals`, `taxonomyFollowup` | `corp_ice.end_run`, `corp_ice.random_or_guessing`, `risk.random_outcome` | — | Die Karte hat ein relevantes Zufallsergebnis: meistens temporäre Strength-Erhöhung, auf 6 aber Derez und automatisches Passieren. risk.random_outcome sollte sichtbar sein. |
| **Vacuum Link** | high | `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`, `taxonomyFollowup` | `corp_ice.random_or_guessing`, `corp_ice.encounter_tax`, `run.corp_run_rewind`, `risk.random_outcome` | `corp.ice_tax_glacier → tax_tool/random_run_rewind_tax_ice` (medium) | Nur random_or_guessing unterschlägt die eigentliche Funktion. Vacuum Link kontrolliert den Runpath, indem der Runner zu früherem rezzed ICE zurückgesetzt wird oder jackt out. |
| **Glacier** | medium | `lineSupport`, `strategicRole`, `strategySupportPairs`, `targetOrConstraints` | `corp_ice.end_run`, `corp_ice.mobile_position_change`, `corp_ice.multi_end_run`, `ice.etr` | `corp.ice_tax_glacier → tax_tool/mobile_fort_ice` (medium) | corp.central_stabilize und corp.remote_scoring sind für ein generisches mobiles ICE zu breit. Die Karte schützt je nach Einsatzort verschiedene Server, belegt aber primär die ICE-Tax/Glacier-Linie. |

## Taxonomie-Konsolidierung

| Problem | Vorschlag |
|---|---|
| Persistente Damage-Counter werden teils nur als `tax.runner_persistent` oder gar nicht sichtbar. | Neues/zu prüfendes Signal `damage.corp_persistent_damage_counter`; anwenden bei Baskerville, Cerberus, Mastiff. |
| Mehrfacher Program-Trash wird nicht von einfachem Program-Trash unterschieden. | Neues/zu prüfendes Signal `corp_ice.multi_program_trash`; dadurch Colonel Failure sauber anchorfähig, während Banpei/D'Arc/Data Naga support-only bleiben. |
| Same-server Run-Rewind wird mit random_or_guessing verschluckt. | Neues/zu prüfendes Signal `run.corp_run_rewind`; nicht mit cross-fort `run.corp_redirect` vermischen. |
| `ice.strength_modifier` wird bei Position-Scaling ohne Strength-Änderung gesetzt. | Nur setzen, wenn der Kartentext Stärke verändert. Bei Hunting Pack/Bug Zapper/Minotaur entfernen. |
| `jackout_tax` wird für Encounter- oder Subroutine-Tax verwendet. | Nur verwenden, wenn Jackout tatsächlich kostet. Ball and Chain/Tutor korrigieren. |
| `runner_pay_or_end_run` wird bei Corp-paid Redirect genutzt. | Nur verwenden, wenn der Runner zahlt oder der Run endet. Entrapment/Vortex korrigieren. |

## Bewusst nicht geändert

- Einfache ETR-ICE wie Data Wall, Filter, Fire Wall, Keeper, Quandary, Wall of Static bleiben support-only.
- Einfache Program-Trash+ETR-ICE wie Banpei, D'Arc Knight, Data Naga, Ice Pick Willie, Sentinels Prime und Triggerman bleiben support-only.
- Fetch 4.0.1, Hunter und einfache Testset-Tag-ICE bleiben support-only; nur deutlich stärkere Trace-/Tag-Engines wie Data Raven, Hunting Pack und Pocket Virtual Reality tragen `corp.tag_trace_punish`.
- Toughonium™ Wall, Cortical Scanner und Reinforced Wall bleiben trotz Multi-ETR support-only, weil reine große ETR-Mauer ohne zusätzliche Tax-/Lock-/Payoff-Semantik sonst zu schnell `corp.ice_tax_glacier` aufblasen würde.
- Testset-ICE bleiben ohne Strategieanker; die neuen Taktiksignale dort sind ausreichend.

## Umsetzungshinweise

1. Erst die Signalkatalog-Frage klären: `damage.corp_persistent_damage_counter`, `corp_ice.multi_program_trash`, `run.corp_run_rewind` ergänzen, falls noch nicht vorhanden.
2. Danach die `cardOverridesAgainstUploadedReport` aus der JSON anwenden, falls v1 bereits importiert wurde.
3. Wenn v1 noch nicht importiert ist, kann `fullFinalRecommendations` als Zielzustand verwendet werden.
4. `lineSupport` und `strategicRole` bleiben nur Legacy-/Kompatibilitätsfelder; führend sollte `strategySupportPairs` sein.
