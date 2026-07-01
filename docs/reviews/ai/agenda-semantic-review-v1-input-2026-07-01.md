# Agenda Semantic Review v1

Basis: `agenda-strategy-role-hierarchy-pilot-report-2026-07-01.md`. Ziel: fachliche Nachprüfung aller 50 Agenda-Hints mit Vorschlag für Taktiksignale, Strategieanker/Rollen und Begründung.

## Review-Leitlinien

- Taktiksignale beschreiben konkrete Funktion, nicht Subtyp oder Kartenfamilie.
- Strategieanker nur bei echten Ankern, Payoffs, Engines, Enablern oder Win-Conditions.
- Score-Kontext darf sichtbar bleiben, ersetzt aber nicht präzise Funktionssignale wie `draw.corp_*`, `economy.corp_*`, `tag.corp_*`, `damage.corp_*`, `ice.corp_*`, `action.corp_*`.
- Rollen immer im Kontext eines StrategySupportPairs prüfen; Conditions und Risiken sind nicht alleinige Primärevidenz.
- Test-/Fixture-Karten separat halten.

## Empfohlene globale Taxonomie-Kandidaten

1. `corp.action_tempo` oder `corp.score_tempo` als deferred Strategy-ID prüfen: Corporate Boon, Subsidiary Branch, AI Board Member, Project Venice und Please Don't Choke Anyone hängen sonst dauerhaft als starke, aber ankerlose Action-Tempo-Karten herum.
2. `corp.overadvance_value` als deferred Strategy-ID prüfen: Project Babylon, Project Venice und Project Zurich sind keine Fast-Advance-Karten, aber echte Overadvance-Payoffs.
3. `corp.value_engine` / `corp.draw_engine` / `corp.deck_recycle_engine` nicht ad hoc erzwingen; erst einführen, wenn DeckDoctrine dafür eine sinnvolle Linie auswertet.
4. `access.corp_*` für Corp-seitige Access-Wirkungen konsequent verwenden. `access.runner_*` ist bei Corp-Karten oft perspektivisch missverständlich.
5. `primaryAnchorEvidence` und `supportingEvidence` trennen, damit z. B. Economy oder Risiko nicht allein Strategieanker erzeugen.

## Vollständige Kartenliste

### 1. Data Fort Remapping (`onr_classic_001_data-fort-remapping`)

- Set: `classic`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Aktuelles Signal `score.action_counter_bank` ist mechanisch falsch/zu unspezifisch: der Counter gibt keine Aktion, sondern beendet einen Run.
- Empfohlene Taktiksignale: `score.run_end_counter_bank; run.corp_end_run_counter; defense.corp_run_end_counter`
- Empfohlene Strategie/Rolle-Paare: `corp.remote_scoring -> defensive_tool/run_end_score_window_protection (medium)`
- Target/Constraints/Follow-up: kein TargetProfile nötig; Counter-Nutzung ist LegalAction-/Timing-Semantik
- Begründung: Eine gescorte Agenda mit Run-End-Counter schützt Scorefenster und Remotes, ist aber kein ICE-Tax-Tool. Remote-Scoring-Anker bleibt plausibel, aber nur defensiv.
- Stats-Bucket: `remote_defense; run_end_counter`

### 2. Superserum (`onr_classic_002_superserum`)

- Set: `classic`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Signal trennt Reset und Prävention nicht.
- Empfohlene Taktiksignale: `virus.corp_counter_clear; virus.corp_counter_prevention; defense.virus_counter_defense`
- Empfohlene Strategie/Rolle-Paare: `corp.central_stabilize -> defensive_tool/virus_counter_defense (medium)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte stabilisiert gegen Virusdruck nach dem Score; sie ist kein Scoring-Payoff. Pair ist inhaltlich okay, sollte aber Clear + Prevention ausdrücklich zeigen.
- Stats-Bucket: `central_stabilize; virus_defense`

### 3. Theorem Proof (`onr_classic_004_theorem-proof`)

- Set: `classic`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: `access.runner_program_bounce`, `risk.high_difficulty_agenda` und `score.closeout_agenda` verfehlen die Perspektive. Die Agenda ist für die Corp nicht schwerer zu scoren; der Runner muss einen verzögerten, fragilen Score über MU und Aktion konvertieren.
- Empfohlene Taktiksignale: `access.corp_agenda_steal_replacement; access.corp_delayed_agenda_score; access.corp_runner_agenda_program_install; risk.runner_memory_burden; risk.fragile_delayed_score; risk.program_removal_denies_score`
- Empfohlene Strategie/Rolle-Paare: `corp.remote_scoring -> defensive_tool/agenda_steal_friction_tool (medium)`
- Target/Constraints/Follow-up: Action-Semantik muss die spätere Runner-Ability `A: Score Theorem Proof` separat erkennen; 2-MU-Programminstallation als spezieller Access-Replacement-Fall.
- Begründung: Erfolgreicher Access wird nicht sofort zum Score, sondern in eine verwundbare Runner-Installation mit späterer Aktion verschoben. Das ist Steal-Friction, nicht Corp-Score-Closeout.
- Stats-Bucket: `access_replacement; steal_delay; high_priority`

### 4. Unlisted Research Lab (`onr_classic_003_unlisted-research-lab`)

- Set: `classic`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: `corp.remote_scoring` ist überdehnt. Wiederkehrender Draw ist generische Engine/Support und nicht spezifisch Remote-Scoring.
- Empfohlene Taktiksignale: `draw.corp_recurring; score.recurring_draw`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (optional deferred: corp.value_engine / corp.draw_engine, falls solche Strategy-ID bewusst eingeführt wird)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte hilft jeder Corp-Linie nach dem Score. Ohne eigene Draw-/Value-Engine-Strategie sollte sie support-only bleiben; sonst muss Employee Empowerment konsistent auch geankert werden.
- Stats-Bucket: `draw_engine_candidate; remove_remote_anchor`

### 5. AI Chief Financial Officer (`onr_v1_188_ai-chief-financial-officer`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: `score.draw` und die Shuffle-Signale sind grob; die Karte ist eine wiederholbare HQ/Archives→R&D-Recycle- und Draw-Ability, aber ohne passende Strategy-ID.
- Empfohlene Taktiksignale: `draw.corp_action_draw; hq.corp_hand_to_rnd_shuffle; archives.corp_recycle_to_rnd; rnd.corp_shuffle_recycle`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.deck_recycle_engine / corp.value_engine)`
- Target/Constraints/Follow-up: Ability-ID wichtig, weil die Aktion aus einer gescorten Agenda kommt.
- Begründung: Starke Engine, aber nicht automatisch Remote, Fast Advance oder Central Stabilize. Als Strategy-Anker nur sinnvoll, wenn eine eigene Deck-Recycle-/Value-Strategie eingeführt wird.
- Stats-Bucket: `draw_recycle; support_only; taxonomy_gap`

### 6. Artificial Security Directors (`onr_v1_189_artificial-security-directors`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Pair ist plausibel, aber Rolle zu generisch und Subtype-Scope sollte nicht als Strategie missverstanden werden.
- Empfohlene Taktiksignale: `score.agenda_difficulty_discount; score.black_ops_difficulty_discount`
- Empfohlene Strategie/Rolle-Paare: `corp.fast_advance -> enabler/black_ops_difficulty_enabler (medium)`
- Target/Constraints/Follow-up: constraint.only_black_ops_agendas
- Begründung: Subtype-Difficulty-Reduction erleichtert zukünftige Scores und kann Fast-Advance-/Scorefenster ermöglichen, trägt aber keine Black-Ops-Strategie als solche.
- Stats-Bucket: `difficulty_discount; fast_advance_enabler`

### 7. Bioweapons Engineering (`onr_v1_190_bioweapons-engineering`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: `engine_anchor` ist weniger präzise als Damage-Amplifier; die Karte erzeugt selbst keinen Schaden.
- Empfohlene Taktiksignale: `damage.corp_meat_damage_amplifier; score.meat_damage_amp`
- Empfohlene Strategie/Rolle-Paare: `corp.damage_kill -> damage_amplifier/meat_damage_amp_anchor (high)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte macht vorhandene Meat-Damage-Quellen killfähiger, ist aber ohne Quellen unvollständig. DeckDoctrine sollte sie als Amplifier, nicht als Quelle zählen.
- Stats-Bucket: `damage_kill; amplifier`

### 8. Black Ice Quality Assurance (`onr_v1_191_black-ice-quality-assurance`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Inhaltlich gut, aber Scope/Constraint sollte sauber getrennt werden.
- Empfohlene Taktiksignale: `ice.corp_strength_bonus; ice.corp_black_ice_strength_bonus; score.black_ice_strength_bonus`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> tax_tool/black_ice_tax_anchor (high)`
- Target/Constraints/Follow-up: constraint.only_black_ice; kein TargetProfile, weil statischer globaler Buff
- Begründung: Globaler Stärke-Buff auf Black ICE trägt ICE-Tax/Glacier. Kein Damage-Anker nur wegen Black-Ice-Kontext.
- Stats-Bucket: `ice_tax; subtype_constraint`

### 9. Corporate Boon (`onr_v1_192_corporate-boon`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: `score.action_gain` ist okay, aber Action-Economy sollte nicht unter Economy landen und als potenzieller Tempo-Cluster sichtbar sein.
- Empfohlene Taktiksignale: `action.corp_counter_bank; action.corp_extra_action; score.action_counter_bank; limit.once_per_turn`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.action_tempo / corp.score_tempo)`
- Target/Constraints/Follow-up: Self/counter cashout; keine echte Zielwahl
- Begründung: Vier banked extra actions sind stark, aber ohne dokumentierte Corp-Tempo-Strategy kein Fast-Advance- oder Remote-Anker. Extra Actions können Scores unterstützen, sind aber nicht automatisch Strategie.
- Stats-Bucket: `action_tempo_candidate; support_only`

### 10. Corporate Coup (`onr_v1_193_corporate-coup`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Signalnamen sollten Credit-Economy statt generisches Agenda-Action betonen.
- Empfohlene Taktiksignale: `economy.corp_counter_bank; economy.corp_counter_cashout_action; score.economy_counter_bank; score.agenda_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: Self/counter cashout
- Begründung: Banked Credits nach Score sind starke Economy, aber reine Economy erzeugt keinen Strategieanker.
- Stats-Bucket: `economy; support_only`

### 11. Corporate Downsizing (`onr_v1_194_corporate-downsizing`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Aktuell fehlt ein möglicher Central-Stabilize-Anker; die Karte reduziert HQ-Agenda-Dichte und gibt Credits.
- Empfohlene Taktiksignale: `economy.corp_agenda_reveal_burst; hq.corp_agenda_density_reduction; rnd.corp_agenda_shuffle_from_hq; score.hq_agenda_reveal; score.hq_agenda_shuffle`
- Empfohlene Strategie/Rolle-Paare: `corp.central_stabilize -> defensive_tool/hq_agenda_flood_cleanup (medium)`
- Target/Constraints/Follow-up: Choice: any number of agenda cards in HQ; side-safe, weil eigene HQ-Karten.
- Begründung: Der Effekt ist nicht nur Economy: er räumt Agendas aus HQ und stabilisiert gegen HQ-Steals. Wegen Konditionalität medium.
- Stats-Bucket: `central_stabilize; hq_agenda_cleanup; add_anchor`

### 12. Corporate Retreat (`onr_v1_195_corporate-retreat`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Risiko/Constraint sollte deutlicher sein.
- Empfohlene Taktiksignale: `economy.corp_credit_action; score.agenda_action; risk.loses_ability_on_install_or_rez`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: constraint.ability_lost_on_install_or_rez
- Begründung: Die Karte ist riskante, langsame Economy. Kein Strategieanker, weil der Nutzen generisch ist und der Drawback stark einschränkt.
- Stats-Bucket: `economy; risk; support_only`

### 13. Corporate War (`onr_v1_196_corporate-war`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Schwellwert und Crash-Risiko sind zentral.
- Empfohlene Taktiksignale: `economy.corp_threshold_burst; score.economy_conditional_burst; risk.requires_corp_credit_threshold; risk.economy_crash_on_score`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: condition.corp_credits_at_score_at_least_12
- Begründung: Reiner Economy-Swing mit hartem Risiko. Kein Fast-Advance-Anker nur wegen viel Geld.
- Stats-Bucket: `economy; threshold_risk; support_only`

### 14. Data Fort Reclamation (`onr_v1_197_data-fort-reclamation`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Pair ist gut; Signale und Target/Sequence-Gap sollten präziser werden.
- Empfohlene Taktiksignale: `install.corp_new_remote_fort_from_hq; economy.corp_install_rez_budget; score.remote_fort_creation; score.remote_install_budget`
- Empfohlene Strategie/Rolle-Paare: `corp.remote_scoring -> engine_anchor/remote_setup_engine (high)`
- Target/Constraints/Follow-up: TargetProfile nötig: bis zu vier HQ-Karten wählen, Install-Reihenfolge, optional rezzen, Budget-Nutzung.
- Begründung: Das ist eine echte Remote-Setup-Engine nach Score. Der Report liegt hier fachlich richtig; nur Zielwahl/Sequenz müssen nachgezogen werden.
- Stats-Bucket: `remote_setup; target_gap`

### 15. Detroit Police Contract (`onr_v1_198_detroit-police-contract`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Counterbank/Recurring Economy präzisieren.
- Empfohlene Taktiksignale: `economy.corp_recurring_counter_bank; economy.corp_start_turn_payout; score.economy_counter_bank`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: Self counter bank; keine Zielwahl
- Begründung: Recurring Credits sind nützlich, aber generische Economy bleibt support-only.
- Stats-Bucket: `economy; support_only`

### 16. Employee Empowerment (`onr_v1_199_employee-empowerment`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; zeigt aber, warum Unlisted Research Lab nicht remote_scoring sein sollte.
- Empfohlene Taktiksignale: `draw.corp_recurring_optional; draw.corp_action_draw; score.recurring_draw; score.agenda_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.draw_engine / corp.value_engine)`
- Target/Constraints/Follow-up: keins
- Begründung: Wiederholbarer Draw ist stark, aber generisch. Ohne eigene Draw-Engine-Strategy kein Strategieanker.
- Stats-Bucket: `draw_engine_candidate; support_only`

### 17. Encryption Breakthrough (`onr_v1_200_encryption-breakthrough`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Pair ist richtig; Scope/Reveal-Economy trennen.
- Empfohlene Taktiksignale: `ice.corp_code_gate_strength_bonus; ice.corp_strength_bonus; economy.corp_ice_type_reveal_burst; score.code_gate_strength_bonus; score.ice_type_tax_support`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> tax_tool/code_gate_tax_anchor (high)`
- Target/Constraints/Follow-up: constraint.only_code_gates; kein TargetProfile für globalen Buff
- Begründung: Code-Gate-Buff trägt ICE-Tax. Reveal-Economy ist Supporting Evidence, nicht der Ankergrund.
- Stats-Bucket: `ice_tax; subtype_constraint`

### 18. Executive Extraction (`onr_v1_201_executive-extraction`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Wie Artificial Security Directors: Rolle genauer, Subtype nicht als Strategie.
- Empfohlene Taktiksignale: `score.agenda_difficulty_discount; score.gray_ops_difficulty_discount`
- Empfohlene Strategie/Rolle-Paare: `corp.fast_advance -> enabler/gray_ops_difficulty_enabler (medium)`
- Target/Constraints/Follow-up: constraint.only_gray_ops_agendas
- Begründung: Difficulty-Reduction erleichtert zukünftige Scores; Gray Ops bleibt Scope, keine Strategie.
- Stats-Bucket: `difficulty_discount; fast_advance_enabler`

### 19. Genetics-Visionary Acquisition (`onr_v1_202_genetics-visionary-acquisition`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Wie die anderen Discount-Agendas: Rolle genauer, Subtype nicht als Strategie.
- Empfohlene Taktiksignale: `score.agenda_difficulty_discount; score.research_difficulty_discount`
- Empfohlene Strategie/Rolle-Paare: `corp.fast_advance -> enabler/research_difficulty_enabler (medium)`
- Target/Constraints/Follow-up: constraint.only_research_agendas
- Begründung: Research-Difficulty-Reduction ist Score-Enabler. Nicht aus Research-Subtype eine eigene Strategie ableiten.
- Stats-Bucket: `difficulty_discount; fast_advance_enabler`

### 20. Hostile Takeover (`onr_v1_203_hostile-takeover`)

- Set: `originalset-v1`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Einordnung ist korrekt: einfache Economy, kein Anker.
- Empfohlene Taktiksignale: `economy.corp_credit_burst; score.economy_burst`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: keins
- Begründung: 5 Credits beim Score sind generischer Support und tragen keine Decklinie direkt.
- Stats-Bucket: `economy; support_only`

### 21. Ice Transmutation (`onr_v1_204_ice-transmutation`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Pair ist richtig; TargetProfile sollte explizit werden.
- Empfohlene Taktiksignale: `ice.corp_strength_bonus_chosen; ice.corp_subroutine_repeat; score.chosen_ice_strength_bonus; score.repeat_ice_subroutines`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> payoff_anchor/ice_upgrade_payoff (high)`
- Target/Constraints/Follow-up: TargetProfile nötig: Choose a rezzed ICE; priorisiere sichtbares, zentrales oder Remote-schützendes ICE mit starken Subroutinen.
- Begründung: Permanenter gezielter ICE-Upgrade-Payoff ist klarer ICE-Tax/Glacier-Anker.
- Stats-Bucket: `ice_tax; target_profile`

### 22. Main-Office Relocation (`onr_v1_205_main-office-relocation`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Signal kann zusätzlich außerhalb score.* präzisiert werden.
- Empfohlene Taktiksignale: `setup.corp_hand_size; score.hand_size`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: keins
- Begründung: Handsize ist generischer Setup-/Stabilitätsnutzen. Kein Strategieanker.
- Stats-Bucket: `setup; support_only`

### 23. Marine Arcology (`onr_v1_206_marine-arcology`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; Zwei-Aktions-Credit-Gain sollte als ineffiziente Action-Economy sichtbar sein.
- Empfohlene Taktiksignale: `economy.corp_two_action_credit_gain; score.agenda_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: keins
- Begründung: A,A für 3 Credits ist generische Economy. Keine Decklinie.
- Stats-Bucket: `economy; support_only`

### 24. Netwatch Operations Office (`onr_v1_207_netwatch-operations-office`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: `engine_anchor/tag_source` ist zu generisch; Trace-Tag-Quelle muss von Payoff und Trace-Credit getrennt werden.
- Empfohlene Taktiksignale: `trace.corp_source; tag.corp_trace_tag_source; condition.trace_success; score.trace_tag_source`
- Empfohlene Strategie/Rolle-Paare: `corp.tag_trace_punish -> trace_tag_source (high; trace_base=2 als Bewertungsmetadatum)`
- Target/Constraints/Follow-up: keins
- Begründung: Wiederholbare Trace→Tag-Ability ist Tag-Quelle, kein Payoff. Geringe Trace-Stärke betrifft Action-Scoring, nicht die Rollenklasse.
- Stats-Bucket: `tag_trace; source`

### 25. On-Call Solo Team (`onr_v1_208_on-call-solo-team`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: `corp.tag_trace_punish -> punish_payoff` mit Evidence nur `risk.requires_tagged_runner` ist zu grob; Conditions sind keine Primärevidenz.
- Empfohlene Taktiksignale: `damage.corp_tagged_meat_payoff; damage.corp_meat_damage_source; tag.corp_tagged_runner_payoff; condition.requires_tagged_runner`
- Empfohlene Strategie/Rolle-Paare: `corp.damage_kill -> tagged_meat_damage_payoff (high); corp.tag_trace_punish -> tagged_runner_punish_payoff (high)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte nutzt Tags als Bedingung und verursacht Meat Damage. Sie ist keine Tagquelle, sondern Payoff für Tag-/Damage-Linien.
- Stats-Bucket: `damage_kill; tagged_payoff`

### 26. Political Coup (`onr_v1_209_political-coup`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist richtig; analog Corporate Coup.
- Empfohlene Taktiksignale: `economy.corp_counter_bank; economy.corp_counter_cashout_action; score.economy_counter_bank; score.agenda_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: Self/counter cashout
- Begründung: Banked Credits nach Score sind Economy-Support, keine Strategie.
- Stats-Bucket: `economy; support_only`

### 27. Political Overthrow (`onr_v1_210_political-overthrow`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Es fehlt ein High-Agenda-Value-Signal; die Action-Economy allein unterschlägt, dass die Karte 6 Punkte wert ist. Trotzdem nicht automatisch Strategieanker.
- Empfohlene Taktiksignale: `score.high_agenda_value; score.vanilla_points; economy.corp_credit_action; score.agenda_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (optional candidate: corp.remote_scoring -> win_condition/large_agenda_closeout, nur falls hohe gedruckte Agenda-Punkte als Anker zählen sollen)`
- Target/Constraints/Follow-up: keins
- Begründung: Die eigentliche strategische Relevanz ist der 6-Punkte-Score, nicht A: Gain 3. Als generelle Regel sollte `score.high_agenda_value` aber nicht automatisch Remote-Scoring erzeugen, sonst würden vanilla große Agendas zu Strategieankern.
- Stats-Bucket: `high_value_agenda; policy_question`

### 28. Polymer Breakthrough (`onr_v1_211_polymer-breakthrough`)

- Set: `originalset-v1`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Einordnung korrekt: recurring Economy, kein Anker.
- Empfohlene Taktiksignale: `economy.corp_recurring_credit; score.economy_recurring`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: keins
- Begründung: Einfache wiederkehrende Credits sind Support-only.
- Stats-Bucket: `economy; support_only`

### 29. Priority Requisition (`onr_v1_212_priority-requisition`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **medium**
- Aktuelles Problem / Befund: Pairs sind plausibel, aber `scoring_tool` ist unscharf; TargetProfile für ICE-Auswahl fehlt.
- Empfohlene Taktiksignale: `ice.corp_free_rez_on_score; score.free_rez_ice`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> payoff_anchor/free_rez_ice_payoff (high); corp.remote_scoring -> score_window_payoff/free_rez_remote_defense (medium)`
- Target/Constraints/Follow-up: TargetProfile nötig: choose a piece of ICE; priorisiere teures, relevantes, bisher unrezzed ICE auf gefährdetem Server/Scoring-Remote.
- Begründung: Free Rez ist ein echter ICE-Tax-Payoff und kann ein Scorefenster absichern. Kein Credit-Economy-Signal.
- Stats-Bucket: `ice_tax; remote_scoring; target_profile`

### 30. Private Cybernet Police (`onr_v1_213_private-cybernet-police`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Wie Netwatch, aber stärkerer Trace; Rolle muss `trace_tag_source` heißen.
- Empfohlene Taktiksignale: `trace.corp_source; tag.corp_trace_tag_source; condition.trace_success; score.trace_tag_source`
- Empfohlene Strategie/Rolle-Paare: `corp.tag_trace_punish -> trace_tag_source (high; trace_base=5 als Bewertungsmetadatum)`
- Target/Constraints/Follow-up: keins
- Begründung: Repeatable Trace 5→Tag ist klare Tag-Quelle, kein Payoff.
- Stats-Bucket: `tag_trace; source`

### 31. Project Babylon (`onr_v1_214_project-babylon`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: Der Report lässt die Karte support-only, obwohl sie ein skalierender Agenda-Punkte-/Closeout-Payoff ist.
- Empfohlene Taktiksignale: `score.conditional_bonus_agenda_points; score.overadvance_bonus; score.overadvance_scaling; advance.overadvance_payoff; risk.overadvance_investment`
- Empfohlene Strategie/Rolle-Paare: `corp.remote_scoring -> win_condition/overadvance_agenda_point_payoff (medium)`
- Target/Constraints/Follow-up: keins; Overadvance-Bewertung braucht Boardstate/Scorefenster, aber keine Zielwahl.
- Begründung: Bonus-Agenda-Punkte durch Overadvance sind ein echter Score-/Closeout-Payoff. Nicht Fast Advance, aber Remote-/Overadvance-Scoreplan.
- Stats-Bucket: `overadvance; win_condition; add_anchor`

### 32. Security Net Optimization (`onr_v1_215_security-net-optimization`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **medium**
- Aktuelles Problem / Befund: Pairs sind plausibel; TargetProfile muss die Fort-Wahl modellieren.
- Empfohlene Taktiksignale: `ice.corp_fort_strength_bonus; ice.corp_strength_bonus; score.fort_ice_strength_bonus`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> tax_tool/fort_tax_anchor (high); corp.remote_scoring -> defensive_tool/remote_defense_anchor (medium)`
- Target/Constraints/Follow-up: TargetProfile nötig: choose a fort; priorisiere scoring remote oder stark contestete zentrale Forts je Boardstate.
- Begründung: Fortbezogener ICE-Buff trägt ICE-Tax; Remote-Pair nur dann mittelbar, wenn der gewählte Fort ein Scoring-/Schutzserver ist.
- Stats-Bucket: `ice_tax; remote_defense; target_profile`

### 33. Security Purge (`onr_v1_216_security-purge`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: `access.rnd_reveal_requirement` ist falsch gerichtet; Remote-Scoring-Pair ist zu indirekt. Außerdem fehlt das Trash-Risiko für Nicht-ICE.
- Empfohlene Taktiksignale: `info.corp_reveal_top_rnd_to_runner; install.corp_rnd_ice_install; ice.corp_free_rez; score.free_install_and_rez_ice; risk.trash_revealed_non_ice`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> setup_payoff/free_install_rez_ice (medium); entferne corp.remote_scoring-Pair`
- Target/Constraints/Follow-up: TargetProfile/Sequence nötig: installiere/rezzed ICE aus R&D; Server/Position wählen; Non-ICE werden getrasht.
- Begründung: Die Karte baut ICE-Board auf und unterstützt Glacier. Remote-Scoring ist nur möglicher Verwendungsort, nicht primärer Strategieanker.
- Stats-Bucket: `ice_setup; remove_remote_anchor; target_gap`

### 34. Strike Force Kali (`onr_v1_217_strike-force-kali`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: Wie On-Call Solo Team; Rolle und Evidenz präzisieren.
- Empfohlene Taktiksignale: `damage.corp_tagged_meat_payoff; damage.corp_meat_damage_source; tag.corp_tagged_runner_payoff; condition.requires_tagged_runner`
- Empfohlene Strategie/Rolle-Paare: `corp.damage_kill -> tagged_meat_damage_payoff (high); corp.tag_trace_punish -> tagged_runner_punish_payoff (high)`
- Target/Constraints/Follow-up: keins
- Begründung: 2 Meat Damage pro Aktion ist klarer tagged Runner Damage-Payoff. Keine Tagquelle.
- Stats-Bucket: `damage_kill; tagged_payoff`

### 35. Subsidiary Branch (`onr_v1_218_subsidiary-branch`)

- Set: `originalset-v1`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Support-only ist nach aktueller Taxonomie vertretbar, aber das Signal sollte Action-Tempo statt Score/Recurring-Gemisch sein.
- Empfohlene Taktiksignale: `action.corp_recurring_extra_action; tempo.corp_recurring_action; score.recurring_extra_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.action_tempo / corp.score_tempo)`
- Target/Constraints/Follow-up: keins
- Begründung: Dauerhafte zusätzliche Aktionen sind stark und deckprägend, aber laut aktueller Leitlinie nicht automatisch Fast Advance/Remote. Es fehlt wahrscheinlich eine eigene Action-Tempo-Strategy.
- Stats-Bucket: `action_tempo_candidate; taxonomy_gap`

### 36. Superior Net Barriers (`onr_v1_219_superior-net-barriers`)

- Set: `originalset-v1`
- Review-Status: **kleine Änderung**, Priorität: **low**
- Aktuelles Problem / Befund: Pair ist richtig; Scope/Reveal-Economy trennen.
- Empfohlene Taktiksignale: `ice.corp_wall_strength_bonus; ice.corp_strength_bonus; economy.corp_ice_type_reveal_burst; score.wall_strength_bonus; score.ice_type_tax_support`
- Empfohlene Strategie/Rolle-Paare: `corp.ice_tax_glacier -> tax_tool/wall_tax_anchor (high)`
- Target/Constraints/Follow-up: constraint.only_walls; kein TargetProfile für globalen Buff
- Begründung: Wall-Buff trägt ICE-Tax/Glacier. Reveal-Economy bleibt Supporting Evidence.
- Stats-Bucket: `ice_tax; subtype_constraint`

### 37. Tycho Extension (`onr_v1_220_tycho-extension`)

- Set: `originalset-v1`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Einordnung als support-only/vanilla high value ist konsistent, sofern hohe gedruckte Punkte nicht automatisch Strategieanker erzeugen.
- Empfohlene Taktiksignale: `score.high_agenda_value; score.vanilla_points`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (policy candidate: large_agenda_closeout, falls große gedruckte Agendas strategisch zählen sollen)`
- Target/Constraints/Follow-up: keins
- Begründung: Keine Fähigkeit. Die Punktezahl ist wichtig für Bewertung, sollte aber nicht automatisch Remote-Scoring-Anker sein.
- Stats-Bucket: `vanilla; high_value_agenda; support_only`

### 38. AI Board Member (`onr_proteus_001_ai-board-member`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Support-only ist vertretbar; Signal sollte Random-Action-Modus und Extra-Action-Typen trennen.
- Empfohlene Taktiksignale: `action.corp_random_recurring_extra_action; risk.random_action_mode; action.corp_install_only_action; economy.corp_credit_action; draw.corp_draw_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.action_tempo / corp.score_tempo)`
- Target/Constraints/Follow-up: Random mode resolution; keine Zielwahl außer Folgeaktion.
- Begründung: Recurring Extra Action ist potenziell deckprägend, aber zufällig und nicht automatisch Fast Advance/Remote. Eigene Tempo-Strategie wäre sauberer.
- Stats-Bucket: `action_tempo_candidate; random`

### 39. Charity Takeover (`onr_proteus_002_charity-takeover`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Support-only ist richtig; Bad Publicity ist aus Corp-Sicht primär Risiko, nicht positives Score-Signal.
- Empfohlene Taktiksignale: `economy.corp_credit_burst; risk.bad_publicity_gain; risk.bad_publicity_loss_condition; score.economy_burst`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: condition.corp_bad_publicity_threshold_7_loss
- Begründung: 9 Credits sind einfache Economy mit hartem Bad-Publicity-Drawback. Keine Bad-Publicity-Strategy und kein Remote/Fast-Advance-Anker.
- Stats-Bucket: `economy; bad_publicity_risk; support_only`

### 40. Corporate Headhunters (`onr_proteus_003_corporate-headhunters`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Grundzuordnung stimmt, aber Rolle sollte spezifisch `tagged_meat_damage_engine` heißen; Condition nicht als Primärevidenz.
- Empfohlene Taktiksignale: `damage.corp_tagged_meat_payoff; damage.corp_meat_damage_source; damage.corp_hand_size_pressure_on_successful_damage; tag.corp_tagged_runner_payoff; condition.requires_tagged_runner`
- Empfohlene Strategie/Rolle-Paare: `corp.damage_kill -> damage_engine/tagged_meat_hand_size_pressure (high); corp.tag_trace_punish -> tagged_runner_punish_payoff (high)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte ist Kill-Engine: sie macht getaggten Schaden und reduziert zusätzlich Runner-Handgröße bei erfolgreichem Damage. Keine Brain-Damage-Semantik.
- Stats-Bucket: `damage_kill; tagged_payoff; hand_size_pressure`

### 41. Fetal AI (`onr_proteus_004_fetal-ai`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Grundrichtung stimmt, aber Signale sollten corp-seitig und damage-typ-präzise sein.
- Empfohlene Taktiksignale: `access.corp_net_damage_ambush; access.corp_agenda_steal_tax; access.archives_safe_exception; access.rnd_reveal_requirement; damage.corp_net_damage_access_punish`
- Empfohlene Strategie/Rolle-Paare: `corp.damage_kill -> access_punish/net_damage_steal_tax (high); corp.ambush_bluff -> access_punish/agenda_net_damage_ambush (high)`
- Target/Constraints/Follow-up: keins
- Begründung: Net-Damage beim Access plus Steal-Tax ist konkreter Access-Punish. `damage.payoff` darf nur Oberklasse sein.
- Stats-Bucket: `access_ambush; net_damage; steal_tax`

### 42. Marked Accounts (`onr_proteus_005_marked-accounts`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Grundrichtung stimmt; `access.agenda_tag` sollte als Corp Access-Tag-Ambush präzisiert werden.
- Empfohlene Taktiksignale: `access.corp_tag_ambush; access.rnd_reveal_requirement; tag.corp_access_tag_source`
- Empfohlene Strategie/Rolle-Paare: `corp.tag_trace_punish -> access_tag_source (high); corp.ambush_bluff -> access_punish/access_tag_ambush (medium)`
- Target/Constraints/Follow-up: keins
- Begründung: Access-Tag ist Tagquelle und Ambush-Punish, aber kein persistenter Tag-Source und kein Payoff.
- Stats-Bucket: `access_ambush; tag_source`

### 43. Please Don't Choke Anyone (`onr_proteus_006_please-dont-choke-anyone`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Support-only ist vertretbar, aber die Karte hat eine erkennbare Damage→Action-Conversion, die als Taxonomie-Gap markiert werden sollte.
- Empfohlene Taktiksignale: `damage.corp_prevent_own_damage_for_counter; action.corp_damage_conversion_counter_bank; action.corp_counter_to_extra_action; limit.once_per_turn`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.action_tempo / corp.damage_conversion_tempo)`
- Target/Constraints/Follow-up: Conversion trigger on successful damage; keine klassische Zielwahl
- Begründung: Die Karte nutzt Damage-Quellen, verhindert den Schaden aber. Daher kein Damage-Kill-Payoff, sondern alternative Tempo-Engine.
- Stats-Bucket: `damage_conversion; action_tempo_candidate`

### 44. Project Venice (`onr_proteus_007_project-venice`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **medium**
- Aktuelles Problem / Befund: Support-only ist vertretbar, aber Overadvance-Payoff und Action-Tempo sollten klarer sein.
- Empfohlene Taktiksignale: `advance.overadvance_payoff; score.overadvance_bonus; score.overadvance_scaling; action.corp_recurring_extra_action`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.overadvance_value / corp.action_tempo)`
- Target/Constraints/Follow-up: keins
- Begründung: Recurring Extra Actions aus Overadvance sind ein starker Payoff, aber ohne eigene Overadvance-/Tempo-Strategie sollte kein Fast-Advance-Anker erzwungen werden.
- Stats-Bucket: `overadvance; action_tempo_candidate`

### 45. Project Zurich (`onr_proteus_008_project-zurich`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **low**
- Aktuelles Problem / Befund: Support-only ist vertretbar; Overadvance-Payoff und Economy sauber trennen.
- Empfohlene Taktiksignale: `advance.overadvance_payoff; score.overadvance_bonus; score.overadvance_scaling; economy.corp_recurring_credit`
- Empfohlene Strategie/Rolle-Paare: `_keine_ (deferred: corp.overadvance_value)`
- Target/Constraints/Follow-up: keins
- Begründung: Overadvance erzeugt recurring Economy. Das ist Value-Support, aber ohne eigene Overadvance-Strategy kein Strategieanker.
- Stats-Bucket: `overadvance; economy; support_only`

### 46. Viral Breeding Ground (`onr_proteus_009_viral-breeding-ground`)

- Set: `proteus`
- Review-Status: **ändern**, Priorität: **high**
- Aktuelles Problem / Befund: `access.runner_program_bounce` muss corp-seitig präzisiert werden; `score.fort_trash_on_score` ist eher eigenes Fort-Trash-Risiko/Drawback.
- Empfohlene Taktiksignale: `access.corp_runner_program_bounce; access.corp_program_disruption; access.agenda_ambush; score.own_fort_trash_on_score; risk.trash_own_fort_on_score`
- Empfohlene Strategie/Rolle-Paare: `corp.ambush_bluff -> access_punish/program_bounce_ambush (medium)`
- Target/Constraints/Follow-up: TargetProfile nötig: choose up to two programs per advancement counter; eigene Score-Resolution trashing in/on fort beachten.
- Begründung: Access-Punish ist Programmbounce, nicht Damage. Der Score-Effekt zerstört eigene Fort-Karten und darf nicht als positiver Remote-Setup-Anker gelesen werden.
- Stats-Bucket: `access_ambush; program_bounce; own_fort_risk`

### 47. World Domination (`onr_proteus_010_world-domination`)

- Set: `proteus`
- Review-Status: **kleine Änderung**, Priorität: **medium**
- Aktuelles Problem / Befund: Grundzuordnung stimmt; Risiko sollte als Corp-Advancement-Investment, nicht unspezifisch „high difficulty agenda“ beschrieben werden.
- Empfohlene Taktiksignale: `score.bonus_agenda_points; score.closeout_agenda; risk.large_advancement_investment; risk.high_difficulty_agenda`
- Empfohlene Strategie/Rolle-Paare: `corp.remote_scoring -> win_condition/one_card_score_closeout (medium)`
- Target/Constraints/Follow-up: keins
- Begründung: Die Karte ist eine klare Win-Condition, aber der riesige Advance-Aufwand senkt die praktische Confidence. Nicht Fast Advance.
- Stats-Bucket: `remote_scoring; win_condition`

### 48. Project Agenda (`v08_project_agenda`)

- Set: `testset`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Fixture ohne Fähigkeit; nicht produktiv aggregieren.
- Empfohlene Taktiksignale: `_keine_`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture
- Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.
- Stats-Bucket: `test_fixture`

### 49. Simple Agenda (`simple_agenda`)

- Set: `testset`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Fixture ohne Fähigkeit; nicht produktiv aggregieren.
- Empfohlene Taktiksignale: `_keine_`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture
- Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.
- Stats-Bucket: `test_fixture`

### 50. Simple Priority Agenda (`simple_priority_agenda`)

- Set: `testset`
- Review-Status: **behalten**, Priorität: **low**
- Aktuelles Problem / Befund: Fixture ohne Fähigkeit; nicht produktiv aggregieren.
- Empfohlene Taktiksignale: `_keine_`
- Empfohlene Strategie/Rolle-Paare: `_keine_`
- Target/Constraints/Follow-up: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture
- Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.
- Stats-Bucket: `test_fixture`

