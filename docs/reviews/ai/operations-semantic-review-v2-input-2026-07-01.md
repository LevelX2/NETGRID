# Operations Semantic Review v2 – fachliche Nachprüfung

Status: review-only
Stand: 2026-07-01

Dieser Review prüft den hochgeladenen Operations-Report fachlich nach. Er ändert keine AI-Daten. Ziel ist eine saubere Vorschlagsliste für Taktiksignale, Strategieanker, StrategySupportPairs, Target-/Constraint-Hinweise und offene Taxonomiefragen.

## Kurzurteil

Der Operations-Report ist strukturell deutlich brauchbarer als der Agenda-Pilot, weil er pro Karte bereits Ist-/Nachher-Stand, Target-Hinweis und Änderungsfelder enthält. Fachlich überzieht er aber drei Punkte: neue Strategy IDs werden zu schnell produktiv gesetzt (`corp.action_tempo`, `corp.overadvance_value`, `corp.deck_recycle_engine`), einige Signals bleiben zu grob (`tag.payoff`, `resource.trash_payoff`, `hardware.trash_payoff`, `condition.last_turn_run`), und einzelne Effekt-/Datenmodellpunkte sind falsch oder zumindest prüfbedürftig, insbesondere Team Restructuring, Data Sifters, Manhunt und Rent-to-Own Contract.

## Review-Zusammenfassung

- Geprüfte Corp-Operations: 38
- Empfehlung `ändern`: 19
- Empfehlung `kleine Änderung`: 13
- Empfehlung `behalten`: 6
- High Priority: 16
- Medium Priority: 14
- Low Priority: 8
- Bestätigte StrategySupportPairs: 29 auf 25 Karten
- Taxonomie-Candidates/Deferred-Pairs: 6

## Zentrale Korrekturmuster

1. `corp.action_tempo` nicht stillschweigend produktiv setzen. Edgerunner, Overtime und Corporate Guard Temps sind sehr klare Tempo-Karten, aber der Guide verlangt für Extra-Actions eine eigene Taxonomieentscheidung. Bis dahin: Taktiksignale + candidate/deferred, keine produktive Strategy ID.
2. `corp.overadvance_value` nicht als erledigte Strategy ID behandeln. Management Shake-Up, Project Consultants und Systematic Layoffs unterstützen Overadvance, aber bestätigte Pairs sollten vorerst auf `corp.fast_advance` beschränkt bleiben. Overadvance bleibt Taxonomie-Follow-up.
3. Corporate Shuffle ist keine `corp.deck_recycle_engine`. Einmaliges Draw-five + eine HQ-Karte in R&D ist Hand-Refresh/Support, keine Engine.
4. Tag-Semantik trennen: initiale Tag-Quelle, Trace-Tag-Quelle, Tagged-Runner-Payoff und Tag-Snowball sind unterschiedliche Rollen. Datapool und Netwatch Credit Voucher sind Snowball-Followups, nicht initiale Quellen.
5. Conditions textgenau machen. `condition.last_turn_run` und `condition.run_this_game` sind zu grob, wenn der Kartentext spezifischer ist.
6. Target- und Constraint-Signale richtungspräzise machen. `hardware.trash_payoff` und `resource.trash_payoff` sollten durch `target.runner_*` bzw. `tag.runner_*_payoff` präzisiert werden; Cybernetics ist bei Power Grid Overload ein Constraint, kein Taktiksignal.
7. Advancement differenzieren. Counter-Erzeugung, Counter-Transfer, Score-Window und Overadvance sind getrennte Bedeutungen. Team Restructuring braucht `condition.requires_installed_advanceable_card`, nicht `requires_score_window`.
8. ICE-Rez-Operations trennen. Emergency Rig ist temporary; Rent-to-Own rezzed sofort kostenlos und erzeugt danach eine Installment-/Payment-Liability. `ice.corp_deferred_rez` allein ist für Rent-to-Own missverständlich.

## Empfohlene bestätigte Strategieanker-Verteilung

- `corp.tag_trace_punish`: 17
- `corp.fast_advance`: 5
- `corp.ice_tax_glacier`: 4
- `corp.damage_kill`: 3

## Taxonomie-Follow-ups

- `corp.action_tempo`: als neue Strategy ID entscheiden oder weiter nur candidate/deferred führen.
- `corp.overadvance_value`: als eigene Strategy ID entscheiden; nicht automatisch mit Fast Advance vermengen.
- `corp.deck_recycle_engine`: Corporate Shuffle reicht dafür nicht; falls eingeführt, muss es wiederholbare/engineartige Deck-Recycling-Effekte beschreiben.
- Präzise Tag-Payoff-Signale: `tag.runner_credit_punish`, `tag.runner_resource_trash_payoff`, `tag.runner_hardware_trash_payoff`, `tag_snowball_followup`.
- Präzise Conditions: `condition.runner_attempted_run_last_turn`, `condition.runner_attempted_multiple_runs_last_turn`, `condition.runner_trashed_node_last_turn`, `condition.runner_installed_resource_last_turn`, `condition.runner_attempted_run_this_game`.
- Präzise ICE-Rez-Risiken: `risk.temporary_rez_liability`, `risk.deferred_rez_payment_liability`, ggf. `risk.term_counter_payment_liability`.

## Kartenreview

### Badtimes (`onr_classic_016_badtimes`)

Set: classic
Review-Status: **ändern**; Priorität: **medium**; Bucket: `tagged_runner_payoff / memory_pressure`

Aktuelles Problem: Aktuelle Signale sind zu grob: tag.payoff sagt nicht, dass der Payoff MU reduziert und dadurch Programmverlust erzwingen kann. Pair-Ergänzung ist richtig, aber die Taktik sollte präziser werden.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `tag.runner_memory_pressure`, `runner.memory_reduction`, `risk.program_cleanup_after_mu_loss`
- StrategySupportPairs: corp.tag_trace_punish -> punish_payoff/tagged_runner_memory_pressure (medium)
- Target/Constraints: Keine Corp-Zielwahl. Wirkung reduziert Runner-MU; daraus folgende Programm-Auswahl/Trash ist Engine-/Runner-Entscheidung und darf nicht als Corp-Targeting modelliert werden.
- Taxonomie-Follow-up: Präzises Signal für tagged-runner memory pressure katalogisieren; tag.payoff nur als Oberklasse behalten.
- Daten-/Effect-Hinweis: Keine.

Begründung: Die Karte ist ein klassischer Tagged-Runner-Payoff, aber kein Tag-Generator. Sie gehört unter Tag/Punish, weil sie vorhandene Tags in Rig-Druck übersetzt. Medium, weil Effekt temporär ist und von Runner-MU/Rig abhängt.

### Corporate Shuffle (`onr_classic_017_corporate-shuffle`)

Set: classic
Review-Status: **ändern**; Priorität: **high**; Bucket: `draw_hand_refresh / support_only`

Aktuelles Problem: Der Report ersetzt corp.central_stabilize durch corp.deck_recycle_engine. Das überzieht die Karte: Sie zieht fünf und mischt eine HQ-Karte in R&D, ist aber keine wiederholbare Deck-Recycle-Engine. Außerdem fehlt der Double-Operation-/Zwei-Aktionen-Hinweis als Constraint/Risiko.

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`, `risk.double_operation_action_cost`
- StrategySupportPairs: keine
- Target/Constraints: Corp wählt eine eigene HQ-Karte für R&D. Keine Runner-Zielwahl; keine kontrollierte Topdeck-Strategie ableiten.
- Taxonomie-Follow-up: corp.deck_recycle_engine hier nicht setzen. Falls später eine Deck-Recycle-Strategy existiert, sollte diese wiederholbare/zentral deckprägende Effekte verlangen.
- Daten-/Effect-Hinweis: Double Operation: kostet zwei konsekutive Aktionen; als Constraint/Risk erfassen.

Begründung: Draw/Hand-Refresh ist starker Support, aber Support ist keine Strategie. Einmalige Draw-/Shuffle-Operationen sollten keine künstliche Strategy ID erzeugen.

### Reclamation Project (`onr_classic_018_reclamation-project`)

Set: classic
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `ice_recovery / glacier_support`

Aktuelles Problem: Grundrichtung ICE-Tax/Glacier ist plausibel, aber high ist zu stark: Die Karte stellt ICE aus Archives wieder her, erzeugt aber keine Tax allein. Außerdem fehlt hq.corp_ice_recovery und der Reveal-Hinweis.

Empfohlener Nachher-Stand:
- Taktiksignale: `archives.corp_recovery`, `hq.corp_ice_recovery`, `ice.corp_recovery`, `info.reveal_recovered_cards_to_runner`, `risk.double_operation_action_cost`
- StrategySupportPairs: corp.ice_tax_glacier -> recovery_enabler/archives_ice_restock (medium)
- Target/Constraints: Corp wählt beliebig viele ICE aus Archives; gewählte Karten werden Runner gezeigt und in HQ gespeichert. Zielprofil: eigene Archives-Karten, Typ ICE.
- Taxonomie-Follow-up: ice.recovery ggf. auf ice.corp_recovery normalisieren.
- Daten-/Effect-Hinweis: Double Operation: zwei konsekutive Aktionen.

Begründung: Die Karte ist spezifisch genug für ICE-heavy/Glacier, weil sie mehrere ICE wiederherstellen kann. Sie ist aber ein Recovery-Enabler, kein Tax-Tool und keine Engine.

### Accounts Receivable (`onr_v1_281_accounts-receivable`)

Set: originalset-v1
Review-Status: **behalten**; Priorität: **low**; Bucket: `economy_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Kosten 5, Gain 9; netto +4 kann später im CostProfile statt Signal modelliert werden.

Begründung: Einfache Economy bleibt support-only. Sie unterstützt viele Linien, belegt aber keine Strategie.

### Annual Reviews (`onr_v1_282_annual-reviews`)

Set: originalset-v1
Review-Status: **behalten**; Priorität: **low**; Bucket: `draw_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Keine.

Begründung: Einmaliger Draw ist kein Draw-Engine-Anker. Support-only ist korrekt.

### Audit of Call Records (`onr_v1_283_audit-of-call-records`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `trace_tag_source`

Aktuelles Problem: Pair ist richtig, aber condition.multiple_runs_last_turn ist nicht katalogpräzise. Conditions sollten textgenau sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_attempted_multiple_runs_last_turn`, `trace.source`, `tag.source`
- StrategySupportPairs: corp.tag_trace_punish -> trace_tag_source/retaliatory_multiple_run_tag_source (high)
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions. Spielbar nur, wenn Runner letzte Runde mindestens zwei Runs versucht hat.
- Taxonomie-Follow-up: condition.multiple_runs_last_turn zu condition.runner_attempted_multiple_runs_last_turn normalisieren.
- Daten-/Effect-Hinweis: Conditions im Effektmodell: requires_runner_action ist zu grob; besser spezifisch multiple-runs-last-turn plus requires_trace_success.

Begründung: Initiale Trace-Tag-Quelle und damit Enabler für Tag/Punish. Hohe Confidence, weil der Effekt genau Trace→Tag ist.

### Chance Observation (`onr_v1_284_chance-observation`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `trace_tag_source`

Aktuelles Problem: Pair ist richtig, aber condition.last_turn_run ist zu grob und sollte textgenau sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_attempted_run_last_turn`, `trace.source`, `tag.source`
- StrategySupportPairs: corp.tag_trace_punish -> trace_tag_source/retaliatory_run_tag_source (high)
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions. Spielbar nur nach Runner-Run im letzten Runnerzug.
- Taxonomie-Follow-up: condition.last_turn_run zu condition.runner_attempted_run_last_turn normalisieren.
- Daten-/Effect-Hinweis: Keine.

Begründung: Klassische Trace-Tag-Quelle. Rolle ist tag_source/enabler, nicht Payoff.

### Closed Accounts (`onr_v1_285_closed-accounts`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `tagged_runner_payoff / credit_loss`

Aktuelles Problem: Taktiksignale sind zu grob. Runner verliert Credits; das ist kein Corp-Credit-Gain und sollte als runner_credit_loss/tagged credit punish sichtbar sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `economy.runner_credit_loss`, `tag.runner_credit_punish`
- StrategySupportPairs: corp.tag_trace_punish -> punish_payoff/tagged_runner_credit_lockout (high)
- Target/Constraints: Keine Zielwahl; betrifft Runner-Creditpool vollständig.
- Taxonomie-Follow-up: economy.runner_credit_loss und tag.runner_credit_punish katalogisieren bzw. als präzise Varianten nutzen.
- Daten-/Effect-Hinweis: Keine.

Begründung: Die Karte ist ein klarer Payoff auf vorhandene Tags und kann Runner-Aktionsfenster massiv schließen. High als Tag/Punish-Payoff.

### Corporate Detective Agency (`onr_v1_286_corporate-detective-agency`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **medium**; Bucket: `tagged_runner_payoff / resource_trash`

Aktuelles Problem: resource.trash_payoff ist richtungsunklar. Es muss erkennbar sein, dass Runner-Ressourcen getrasht werden und Tags die Voraussetzung sind.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `target.runner_resource_trash`, `tag.runner_resource_trash_payoff`
- StrategySupportPairs: corp.tag_trace_punish -> punish_payoff/tagged_runner_resource_trash (high)
- Target/Constraints: TargetProfile nötig: bis zu zwei installierte Runner-Resources, sichtbare/legale Ziele, Trash at no cost.
- Taxonomie-Follow-up: resource.trash_payoff durch target.runner_resource_trash/tag.runner_resource_trash_payoff präzisieren.
- Daten-/Effect-Hinweis: Keine.

Begründung: Klarer tagged-runner punish payoff mit echter Zielwahl. Die Rolle ist Payoff, nicht Tag-Quelle.

### Datapool by Zetatech (`onr_v1_287_datapool-by-zetatech`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `tag_snowball_followup`

Aktuelles Problem: Der Report nennt die Rolle enabler, aber die Signale behalten tag.payoff. Die Karte ist keine initiale Tag-Quelle, sondern Snowball/Additional-Tag, weil Runner bereits tagged sein muss.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_source`, `tag_snowball_followup`, `tag.payoff`
- StrategySupportPairs: corp.tag_trace_punish -> tag_snowball_followup/additional_tag_amplifier (high)
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: tag.additional_tag_followup auf tag.additional_tag_source/tag_snowball_followup normalisieren; tag.source nicht als initiale Quelle verwenden.
- Daten-/Effect-Hinweis: Keine.

Begründung: Zwei zusätzliche Tags verstärken bestehende Tagfenster und sichern spätere Payoffs. Es ist kein Trace und kein Initial-Tag.

### Day Shift (`onr_v1_288_day-shift`)

Set: originalset-v1
Review-Status: **behalten**; Priorität: **low**; Bucket: `draw_economy_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Keine.

Begründung: Draw + kleiner Credit-Burst ist generischer Support und kein Strategieanker.

### Edgerunner, Inc., Temps (`onr_v1_289_edgerunner-inc-temps`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `action_tempo_candidate / install_burst`

Aktuelles Problem: Der Report setzt corp.action_tempo als echte Strategy ID. Nach Guide sollte eine neue Corp-Tempo-Strategy nicht stillschweigend produktiv verwendet werden. Außerdem ist die Karte install-only und nicht automatisch Fast Advance/Remote Scoring.

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_install_only_action_bundle`, `install.corp_action_bundle`, `tempo.corp_install_burst`
- StrategySupportPairs: keine bestätigte Pair-Zuordnung; candidate: corp.action_tempo -> enabler/install_only_action_bundle (medium), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: Folgeaktionen dürfen nur legale Install-Actions sein; nicht alle drei müssen genommen werden.
- Taxonomie-Follow-up: corp.action_tempo als Strategy-ID separat entscheiden. Bis dahin support-only mit StrategyCandidate/deferred.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 1; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Die Karte ist starkes Tempo, aber ohne beschlossene Tempo-Strategy kein produktiver Strategieanker. Bestehende Strategien sollten nicht als Ersatzcontainer missbraucht werden.

### Efficiency Experts (`onr_v1_290_efficiency-experts`)

Set: originalset-v1
Review-Status: **behalten**; Priorität: **low**; Bucket: `economy_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Keine.

Begründung: Einfache Economy bleibt support-only.

### Falsified-Transactions Expert (`onr_v1_291_falsified-transactions-expert`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `advancement_counter_transfer / fast_advance`

Aktuelles Problem: Grundrichtung Fast Advance ist richtig. Taktik sollte stärker zwischen Counter-Transfer und Counter-Erzeugung trennen; TargetProfile Quelle/Ziel ist zwingend.

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_transfer`, `advance.counter_reallocation`, `advance.score_window_support`, `condition.requires_advancement_counter`, `condition.requires_installed_advanceable_card`
- StrategySupportPairs: corp.fast_advance -> scoring_tool/advancement_counter_reposition (high)
- Target/Constraints: TargetProfile nötig: Quelle mit bis zu drei vorhandenen Advancement-Countern; Ziel ist andere installierte Karte, die advanced werden kann.
- Taxonomie-Follow-up: advance.corp_counter_transfer und advance.counter_reallocation ggf. zusammenführen; keine counter_placement-Signale verwenden.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 1; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Bestehende Counter werden in ein Scorefenster verschoben. Das ist direkte Fast-Advance-/Score-Window-Unterstützung.

### Management Shake-Up (`onr_v1_292_management-shake-up`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `advancement_counter_burst / fast_advance / overadvance_candidate`

Aktuelles Problem: Fast-Advance-Pair ist richtig; corp.overadvance_value sollte aber nicht stillschweigend als neue Strategy ID gesetzt werden. Außerdem ist advance.agenda_counter zu eng, weil die Karte jede advancebare installierte Karte treffen kann.

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- StrategySupportPairs: corp.fast_advance -> scoring_tool/advance_counter_burst (high); candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: drei Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten; eigene hidden information bleibt Corp-seitig.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden; bis dahin nur als candidate/deferred ausweisen.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 10; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Drei neue Counter ermöglichen direktes Scoring und können Overadvance vorbereiten. Overadvance ist aber nicht automatisch eine bestätigte Strategie.

### Netwatch Credit Voucher (`onr_v1_293_netwatch-credit-voucher`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `tag_snowball_followup / minor_economy`

Aktuelles Problem: Die Karte ist kein initialer Tag-Enabler, sondern braucht bereits einen Tag und gibt einen weiteren Tag plus 1 Credit. tag.payoff ist zu grob, die Snowball-Rolle fehlt.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_source`, `tag_snowball_followup`, `economy.corp_credit_burst`, `tag.payoff`
- StrategySupportPairs: corp.tag_trace_punish -> tag_snowball_followup/additional_tag_minor_credit_followup (medium)
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: tag.additional_tag_followup auf tag.additional_tag_source/tag_snowball_followup normalisieren. Economy ist SupportingEvidence, nicht Rollenursache.
- Daten-/Effect-Hinweis: Keine.

Begründung: Der zusätzliche Tag hält das Punish-Fenster offen; der Credit ist Nebenwert. Medium wegen geringer Einzelwirkung.

### New Blood (`onr_v1_294_new-blood`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `ice_rearrange_conceal / glacier_support`

Aktuelles Problem: Grundrichtung ICE-Tax/Glacier ist plausibel, aber das aktuelle Einzelsignal bündelt zwei Funktionen. Hidden-Info-Hinweis ist zentral.

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_conceal_unrezzed_ice`, `ice.corp_rearrange_installed_ice`, `info.corp_hidden_ice_order_reset`
- StrategySupportPairs: corp.ice_tax_glacier -> defensive_tool/ice_conceal_rearrange (medium)
- Target/Constraints: Corp ordnet eigene ICE verdeckt; Runner darf neue Ordnung nicht aus Inspector-/KI-Daten kennen. TargetProfile/Choice muss side-safe sein.
- Taxonomie-Follow-up: ice.corp_rearrange_conceal ggf. durch zwei präzisere Signale ersetzen.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 0; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Die Karte schützt und resetet ICE-Informationen, was ICE-heavy Forts unterstützt. Sie ist aber eine one-shot defensive utility, daher medium.

### Night Shift (`onr_v1_295_night-shift`)

Set: originalset-v1
Review-Status: **behalten**; Priorität: **low**; Bucket: `draw_economy_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`, `draw.corp_draw`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Keine.

Begründung: Draw + Economy ist generischer Support und kein Strategieanker.

### Off-Site Backups (`onr_v1_296_off-site-backups`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `archives_recovery / support_only`

Aktuelles Problem: archives.corp_recovery ist korrekt, aber hq.corp_card_recovery fehlt. Support-only ist richtig.

Empfohlener Nachher-Stand:
- Taktiksignale: `archives.corp_recovery`, `hq.corp_card_recovery`
- StrategySupportPairs: keine
- Target/Constraints: TargetProfile nötig: Corp wählt eine Karte aus eigenen Archives und bringt sie nach HQ; side-safe eigene Zone.
- Taxonomie-Follow-up: Keine Strategy ID für generische Recovery setzen.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 0; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Generische Archives-Recovery kann viele Strategien unterstützen, trägt aber keine konkrete Decklinie direkt.

### Overtime Incentives (`onr_v1_297_overtime-incentives`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `action_tempo_candidate / extra_action_burst`

Aktuelles Problem: Der Report setzt corp.action_tempo als produktiven Anker und Rolle payoff_anchor. Ohne separate Taxonomieentscheidung sollte die Karte nicht künstlich eine Strategy ID erzeugen. Extra Actions sind nicht automatisch Fast Advance oder Remote Scoring.

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_extra_action_burst`, `action.corp_extra_action_support`, `tempo.corp_action_burst`
- StrategySupportPairs: keine bestätigte Pair-Zuordnung; candidate: corp.action_tempo -> payoff_anchor/extra_action_burst (high), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: Keine Zielwahl; die gewonnenen Folgeaktionen bleiben normale LegalActions mit eigenen Kosten/Timing-Gates.
- Taxonomie-Follow-up: corp.action_tempo separat entscheiden. Falls akzeptiert, Overtime ist der klarste High-Confidence-Anker dieser neuen Linie.
- Daten-/Effect-Hinweis: Keine.

Begründung: Zwei freie Aktionen sind stark und deckprägend, aber sie brauchen eine eigene Tempo-Strategy oder bleiben als Taktiksignal support/candidate.

### Planning Consultants (`onr_v1_298_planning-consultants`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **low**; Bucket: `rnd_topdeck_setup / support_only`

Aktuelles Problem: Support-only ist richtig. Optional sollte info.corp_rnd_peek ergänzt werden, weil Corp die Top 5 sieht und ordnet.

Empfohlener Nachher-Stand:
- Taktiksignale: `info.corp_rnd_peek`, `rnd.corp_topdeck_reorder`, `rnd.corp_topdeck_setup`
- StrategySupportPairs: keine
- Target/Constraints: Corp sieht und ordnet Top 5 von R&D; keine Runner-Information ableiten.
- Taxonomie-Follow-up: Kein Deck-Recycle- oder Central-Stabilize-Anker allein aus Topdeck-Setup.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 0; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Topdeck-Reorder ist nützlicher Setup-/Quality-Support, aber kein eigener Strategieanker.

### Power Grid Overload (`onr_v1_299_power-grid-overload`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `tagged_runner_payoff / hardware_trash`

Aktuelles Problem: hardware.trash_payoff ist richtungsunklar und Cybernetics-Ausnahme muss als Constraint/Targeting sichtbar sein. Pair ist grundsätzlich richtig.

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `target.runner_hardware_trash`, `tag.runner_hardware_trash_payoff`
- StrategySupportPairs: corp.tag_trace_punish -> punish_payoff/tagged_runner_hardware_trash (high)
- Target/Constraints: TargetProfile nötig: X installierte Runner-Hardware, Constraint not_cybernetics; nur sichtbare/legale Hardware-Ziele.
- Taxonomie-Follow-up: hardware.trash_payoff durch target.runner_hardware_trash/tag.runner_hardware_trash_payoff präzisieren; not_cybernetics als Constraint, nicht als Taktiksignal.
- Daten-/Effect-Hinweis: Kosten X ist korrekt variabel.

Begründung: Klarer tagged-runner hardware punish payoff. Cybernetics ist Targeting-Constraint, nicht eigenes Setup-Signal.

### Project Consultants (`onr_v1_300_project-consultants`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `advancement_counter_burst / fast_advance / overadvance_candidate`

Aktuelles Problem: Fast-Advance-Pair ist richtig; corp.overadvance_value nicht stillschweigend als produktive Strategy ID setzen. advance.agenda_counter ist zu eng.

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- StrategySupportPairs: corp.fast_advance -> scoring_tool/advance_counter_burst (high); candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: vier Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden. Bis dahin als candidate/deferred führen.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 12; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Vier neue Counter sind direkte Score-Window- und Fast-Advance-Unterstützung. Overadvance ist plausible Zusatzfunktion, aber taxonomisch noch offen.

### Punitive Counterstrike (`onr_v1_301_punitive-counterstrike`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `tagged_meat_damage_payoff`

Aktuelles Problem: Der Report entfernt win_condition korrekt. Taktiksignale sollten den Corp- und Meat-Damage-Typ präziser ausdrücken; damage.meat_source ist etwas zu generisch.

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- StrategySupportPairs: corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff (high); corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source oder damage.corp_tagged_meat_payoff präzisieren.
- Daten-/Effect-Hinweis: Keine.

Begründung: 2 Meat Damage ist meist kein alleiniger Closeout, aber ein klarer Tagged-Meat-Payoff.

### Scorched Earth (`onr_v1_302_scorched-earth`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `tagged_meat_damage_closeout`

Aktuelles Problem: Pair-Struktur ist richtig. Taktiksignale sollten präzisere Corp-Meat-Damage-Signale verwenden.

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- StrategySupportPairs: corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high); corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source normalisieren.
- Daten-/Effect-Hinweis: Keine.

Begründung: 4 Meat Damage ist ein echter Kill-Closeout gegen tagged Runner, deshalb win_condition im Damage-Kill-Pair.

### Silver Lining Recovery Protocol (`onr_v1_303_silver-lining-recovery-protocol`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **low**; Bucket: `reactive_economy_support`

Aktuelles Problem: Support-only ist richtig. Signal kann präziser als reactive/conditional economy beschrieben werden; keine Overadvance- oder Remote-Scoring-Ableitung.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `economy.corp_reactive_credit_burst`, `economy.corp_conditional_credit`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl; Betrag hängt von Advancement-Countern der gestohlenen Agendas ab.
- Taxonomie-Follow-up: Kein overadvance_support: die Karte nutzt gestohlene Agenda-Counter retrospektiv, sie unterstützt Overadvance nicht aktiv.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 0; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Reaktive Economy nach Agenda-Diebstahl ist nützlich, aber kein Strategieanker.

### Systematic Layoffs (`onr_v1_304_systematic-layoffs`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `advancement_counter_burst / fast_advance / overadvance_candidate`

Aktuelles Problem: Fast-Advance-Pair ist richtig; corp.overadvance_value sollte nur candidate/deferred sein. advance.agenda_counter ist zu eng.

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- StrategySupportPairs: corp.fast_advance -> scoring_tool/advance_counter_burst (high); candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: zwei Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 5; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Zwei neue Counter sind direkte Score-Window-Unterstützung. Overadvance ist Zusatznutzen, aber kein bestätigter Strategy-Anker.

### Team Restructuring (`onr_v1_305_team-restructuring`)

Set: originalset-v1
Review-Status: **ändern**; Priorität: **high**; Bucket: `distributed_advancement / fast_advance`

Aktuelles Problem: Condition requires_score_window ist fachlich falsch. Die Karte verlangt installierte advancebare Karten, nicht schon ein Scorefenster. Außerdem sollte sie als Counter-Placement, nicht nur agenda_counter, modelliert werden.

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_support`, `advance.score_window_support`, `condition.requires_installed_advanceable_card`
- StrategySupportPairs: corp.fast_advance -> scoring_tool/distributed_advance_counter_support (medium)
- Target/Constraints: TargetProfile nötig: je ein Counter auf bis zu zwei installierte Karten, die advanced werden können.
- Taxonomie-Follow-up: requires_score_window entfernen; optional schwaches advance.overadvance_support nur als supporting signal prüfen.
- Daten-/Effect-Hinweis: Spoiler-Kosten: 1; Report zeigt variabel/nicht numerisch. Datenmodell prüfen.

Begründung: Die Karte kann Scoring vorbereiten oder schließen, aber die verteilte Struktur ist weniger stark als ein konzentrierter Counter-Burst.

### Trojan Horse (`onr_v1_306_trojan-horse`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `retaliatory_tag_source`

Aktuelles Problem: Pair ist grundsätzlich richtig. Rolle sollte klar initiale Tag-Quelle nach Agenda-Diebstahl sein, nicht generischer enabler.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `tag.source`
- StrategySupportPairs: corp.tag_trace_punish -> tag_source_enabler/retaliatory_agenda_stolen_tag_source (medium)
- Target/Constraints: Keine Zielwahl. Nur spielbar, wenn Runner letzte Runde Agenda(s) gestohlen hat.
- Taxonomie-Follow-up: retaliatory_tag_source in RoleDetail präzisieren; condition beibehalten.
- Daten-/Effect-Hinweis: Keine.

Begründung: Die Karte erzeugt einen Tag ohne Trace, aber nur reaktiv nach Agenda-Diebstahl. Medium wegen starker Bedingung.

### Urban Renewal (`onr_v1_307_urban-renewal`)

Set: originalset-v1
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `tagged_meat_damage_closeout`

Aktuelles Problem: Pair-Struktur ist richtig. Taktiksignale sollten präziser Corp-Meat-Damage ausdrücken.

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- StrategySupportPairs: corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high); corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source normalisieren.
- Daten-/Effect-Hinweis: Keine.

Begründung: 5 Meat Damage ist der stärkste klassische Tagged-Runner-Kill-Closeout.

### Corporate Guard(R) Temps (`onr_proteus_046_corporate-guard-r-temps`)

Set: proteus
Review-Status: **ändern**; Priorität: **high**; Bucket: `action_tempo_candidate / recurring_extra_action_with_drawback`

Aktuelles Problem: Der Report setzt corp.action_tempo als produktiven Anker und interpretiert den Drawback als agenda_forfeit_drawback. Die Strategy ID sollte candidate/deferred bleiben; der genaue Forfeit-Drawback sollte im Regelmodell verifiziert werden.

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_future_extra_action`, `action.corp_recurring_extra_action_limited`, `risk.future_forfeit_drawback`, `risk.agenda_forfeit_drawback?`
- StrategySupportPairs: keine bestätigte Pair-Zuordnung; candidate: corp.action_tempo -> engine_anchor/delayed_recurring_extra_action_engine (medium), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: X wird beim Spielen gewählt/bezahlt; Folgeaktionen und Forfeit-Folge müssen als Engine-/LegalAction-Vertrag abgebildet werden.
- Taxonomie-Follow-up: corp.action_tempo separat entscheiden. Drawback-Signal nach Regeltextverifikation normalisieren.
- Daten-/Effect-Hinweis: Kartentext 'Forfeit the next [X] you gain' im Datenmodell prüfen: agenda point forfeit vs. Credit/sonstiger Forfeit darf nicht blind geraten werden.

Begründung: Wiederkehrende Extra Actions können deckprägend sein, aber der Drawback und die noch unbeschlossene Tempo-Strategy rechtfertigen nur candidate/deferred.

### Credit Consolidation (`onr_proteus_047_credit-consolidation`)

Set: proteus
Review-Status: **behalten**; Priorität: **low**; Bucket: `economy_support`

Aktuelles Problem: Keine fachliche Korrektur nötig.

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- StrategySupportPairs: keine
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: Keine.
- Daten-/Effect-Hinweis: Kosten 10, Gain 15; netto +5 im CostProfile modellieren.

Begründung: Einfache Economy bleibt support-only.

### Data Sifters (`onr_proteus_048_data-sifters`)

Set: proteus
Review-Status: **ändern**; Priorität: **high**; Bucket: `retaliatory_tag_source`

Aktuelles Problem: Condition im Report/Effect-Modell ist falsch bzw. zu grob: requires_installed_card passt nicht. Es muss Runner trashed node last turn sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_trashed_node_last_turn`, `tag.source`
- StrategySupportPairs: corp.tag_trace_punish -> tag_source_enabler/retaliatory_node_trash_tag_source (medium)
- Target/Constraints: Keine Zielwahl. Spielbar nur, wenn Runner letzte Runde Node(s) trashte.
- Taxonomie-Follow-up: condition.node_trashed_last_turn auf condition.runner_trashed_node_last_turn normalisieren.
- Daten-/Effect-Hinweis: Effect Conditions von requires_installed_card auf requires_runner_trashed_node_last_turn prüfen.

Begründung: Die Karte ist eine bedingte, reaktive Tag-Quelle. Medium wegen enger Bedingung, aber strategisch relevant als Tag/Punish-Enabler.

### Emergency Rig (`onr_proteus_049_emergency-rig`)

Set: proteus
Review-Status: **kleine Änderung**; Priorität: **medium**; Bucket: `ice_rez / temporary_rez`

Aktuelles Problem: Grundrichtung ist richtig. Rolle sollte enabler bleiben; zusätzlich sollte das spätere Trashen als eigener Liability/Risk sichtbar sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_free_rez`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`, `risk.trash_rezzed_ice_after_kludge`
- StrategySupportPairs: corp.ice_tax_glacier -> enabler/temporary_free_rez_ice (medium)
- Target/Constraints: TargetProfile nötig: eine installierte ICE; X Kludge-Counter > 0; Trash beim letzten entfernten Counter ist Engine-Folge.
- Taxonomie-Follow-up: risk.temporary_rez_liability kann Oberklasse bleiben; präzises Trash-Liability-Signal ergänzen.
- Daten-/Effect-Hinweis: Kosten X korrekt variabel; X darf nicht 0 sein.

Begründung: Temporärer Free-Rez ermöglicht starke ICE-Fenster, ist aber wegen späterem ICE-Verlust kein reines Tax-Tool.

### Manhunt (`onr_proteus_050_manhunt`)

Set: proteus
Review-Status: **ändern**; Priorität: **high**; Bucket: `scaling_trace_tag_source`

Aktuelles Problem: Condition sollte textgenau sein. Außerdem ist der strukturierte Effekt amount=1 irreführend, da die Tags nach Trace-Marge skalieren: ein Tag pro Punkt, um den die Corp Link überschreitet.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_attempted_run_last_turn`, `trace.source`, `tag.source`, `tag.scaling_trace_margin_source`
- StrategySupportPairs: corp.tag_trace_punish -> trace_tag_source/scaling_trace_margin_tag_source (high)
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions; Tag-Anzahl = erfolgreiche Trace-Marge.
- Taxonomie-Follow-up: tag.scaling_trace_margin_source oder RoleDetail scaling_trace_tag_source katalogisieren; condition.last_turn_run normalisieren.
- Daten-/Effect-Hinweis: Effect amount sollte scaling-by-trace-margin statt amount=1 abbilden.

Begründung: Sehr klare und potenziell mehrere Tags erzeugende Trace-Tag-Quelle. High als Tag/Punish-Enabler.

### Rent-to-Own Contract (`onr_proteus_051_rent-to-own-contract`)

Set: proteus
Review-Status: **ändern**; Priorität: **high**; Bucket: `ice_rez / installment_liability`

Aktuelles Problem: Aktuelle Signale nennen deferred_rez, obwohl die ICE sofort kostenlos gerezzt wird. Der relevante Nachteil ist die spätere Installment-/Payment-Liability, nicht verzögertes Rezzen.

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_free_rez`, `ice.corp_installment_rez`, `risk.deferred_rez_payment_liability`, `risk.term_counter_payment_liability`
- StrategySupportPairs: corp.ice_tax_glacier -> enabler/installment_free_rez_ice (medium)
- Target/Constraints: TargetProfile nötig: eine installierte ICE; Term-Counter = Rez-Kosten; Folgezahlung/Counter-Änderung ist Engine-Vertrag.
- Taxonomie-Follow-up: ice.corp_deferred_rez entfernen oder nur als Legacy; präzise Immediate-Free-Rez-plus-Installment-Semantik verwenden.
- Daten-/Effect-Hinweis: Keine.

Begründung: Die Karte schafft ein sofortiges ICE-Rez-Fenster für ICE-Tax/Glacier, aber mit laufender Zahlungsverpflichtung.

### Schlaghund Pointers (`onr_proteus_052_schlaghund-pointers`)

Set: proteus
Review-Status: **ändern**; Priorität: **medium**; Bucket: `paid_trace_tag_source`

Aktuelles Problem: condition.run_this_game ist zu grob; die zusätzliche Trace-Kostenregel sollte als Risk/CostProfile sichtbar sein.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_attempted_run_this_game`, `trace.source`, `tag.source`, `risk.extra_trace_cost`
- StrategySupportPairs: corp.tag_trace_punish -> trace_tag_source/paid_trace_tag_source (medium)
- Target/Constraints: Keine Zielwahl; Trace-Bidding/Kosten über LegalActions; Bedingung: Runner hat in diesem Spiel einen Run versucht.
- Taxonomie-Follow-up: condition.run_this_game normalisieren; risk.extra_trace_cost oder CostProfile-Feld prüfen.
- Daten-/Effect-Hinweis: Keine.

Begründung: Initiale Trace-Tag-Quelle, aber teuer und mit zusätzlichem Trace-Kostenmodell; daher medium.

### Underworld Mole (`onr_proteus_053_underworld-mole`)

Set: proteus
Review-Status: **ändern**; Priorität: **high**; Bucket: `conditional_trace_tag_source / resource_trash`

Aktuelles Problem: Der Report modelliert die Karte nur als punish_payoff. Sie ist zugleich Trace-Tag-Quelle und Resource-Trash-Disruption nach spezifischer Runner-Aktion. Tag-Quelle und Payoff/Disruption sollten getrennt werden.

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.runner_installed_resource_last_turn`, `trace.source`, `tag.source`, `target.runner_resource_trash`, `resource.runner_recent_install_trash`
- StrategySupportPairs: corp.tag_trace_punish -> trace_tag_source/resource_install_retaliatory_trace_tag_source (medium); corp.tag_trace_punish -> disruption_tool/trace_success_recent_resource_trash (medium)
- Target/Constraints: TargetProfile nötig: nur eine Resource, die Runner im letzten Zug installiert hat; Trash und Tag erfolgen nur bei Trace-Erfolg.
- Taxonomie-Follow-up: condition.resource_installed_last_turn normalisieren; resource.trash_payoff richtungs- und zeitpräzise machen.
- Daten-/Effect-Hinweis: Effect Conditions: requires_installed_resource plus requires_trace_success reichen nicht; 'installed during last turn' muss sichtbar sein.

Begründung: Die Karte schafft einen Tag und zerstört ein eng definiertes Ziel. Sie ist kein tagged-runner payoff, weil der Runner vorher nicht tagged sein muss.
