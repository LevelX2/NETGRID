# Aufgabe 021 - AI-Hints: Runner Prevention / Damage / Survival Tools Closeout

## Kurzfazit

Aufgabe 021 schließt den read-only Batch `batch_10_runner_prevention_damage_survival_tools` ab. Der Batch erweitert den Generated-Facts-Pilot auf Runner-Prevention, Damage-/Flatline-Survival, Program-Trash-Prevention, Link-/Trace-Defense und tagbezogene Survival-Tools. `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle.

Ergebnis:

- 31 Kandidaten geprüft.
- 15 Karten eingeschlossen.
- 16 Karten begründet ausgeschlossen.
- 62 Generated Facts bestätigt oder neu abgeleitet.
- 59 Preview-Adds im read-only Vergleichspfad.
- 104 Differenzen/Kontext-Hinweise normalisiert.
- 0 verbleibende Differenzen.
- 0 Follow-ups.
- 0 Hard Errors.
- 0 echte semantische Konflikte.
- Readiness: `ready_read_only_split_subbatches`.

## Warum Dieser Batch

Nach Corp ICE/Damage und Corp Nodes/Ambush/Tag-Punish ist Runner Prevention / Damage / Survival die passende Gegenseite. Die mechanischen Outputs sind als Generated Basic Facts abgrenzbar:

- Damage Prevention mit Damage-Type, Amount und Per-turn-Kontext.
- Flatline-Replacement und persistente Survival-Penalties.
- Program-Trash-Prevention für installierte Programme.
- Link, Base-Link und Trace-Defense.
- Tag-Prevention und Tag-Survival-Kontext.
- Breaker-/Survival-Overlap bei `Evil Twin`.

Strategische Survival-Bewertung, Flatline-Risiko, Install-priority und tatsächliche Prevention-Nutzung bleiben Engine, LegalActions, Boardstate und Planner/Overlay.

## Geprüfte Kandidaten

Eingeschlossen:

- `Bakdoor™`
- `Emergency Self-Construct`
- `Evil Twin`
- `Force Shield`
- `Joan of Arc`
- `Rabbit`
- `Shield`
- `Signpost`
- `Bodyweight™ Synthetic Blood`
- `Total Genetic Retrofit`
- `Militech MRAM Chip`
- `MRAM Chip`
- `Nasuko Cycle`
- `Crash Everett, Inventive Fixer`
- `Fall Guy`

Ausgeschlossen:

- `Baedeker’s Net Map`: Katalog und Implementation sagen Runner-Program, der aktive Monolith-Hint sagt Hardware; wegen Type-Mismatch nicht in Batch 10 normalisiert.
- `Newsgroup Filter`: Runner-Action-Economy, nicht Prevention/Survival.
- `Cloak`: restricted hosted credits, besser Runner-Economy/Payment.
- `Invisibility`: restricted hosted credits, besser Runner-Economy/Payment.
- `The Shell Traders`: Delayed Install/Payment Setup, besser Runner-Economy/Resource/Hardware.
- `Enterprise, Inc., Shields`: keine aktive Runtime-Katalogkarte, kein aktiver AI-Hint und keine CardImplementation gefunden.
- `Broker`: hosted-credit economy, nicht Prevention/Survival.
- `Organ Donor`: Grip-trash-for-credits Economy mit Hidden-card Choice, nicht Prevention/Survival.
- `Loan from Chiba`: Runner Economy mit Lose-game-Risk, besser Economy/Risk.
- `Short-Term Contract`: finite hosted-credit economy, nicht Prevention/Survival.
- `Jack ’n’ Joe`: reines Draw-Event.
- `Livewire’s Contacts`: Runner Draw Resource, nicht Prevention/Survival.
- `Score!`: Score/Draw-Payoff, nicht Prevention/Survival.
- `Temple Microcode Outlet`: Search/Install Utility, nicht Prevention/Survival.
- `Forgotten Backup Chip`: Program Recovery, besser Program-Recovery/Runner utility.
- `Gideon’s Pawnshop`: Hardware-trash-for-credits Economy, nicht Prevention/Survival.

## Derived-Facts-Erweiterungen

Der read-only Deriver/Pilot wurde um Batch-10-Karten und stabile Survival-Fact-Klassen erweitert:

- `effect:damage_prevention`
- `effect:flatline_prevention`
- `effect:program_trash_prevention`
- `effect:tag_prevention`
- `effect:trace_defense`
- `effect:link`
- `effect:base_link`
- `effect:remove_brain_damage`
- `effect:meat_damage_prevention`
- `effect:net_damage_prevention`
- `effect:brain_damage_prevention`
- `effect:hand_size_modifier`
- `effect:action_penalty`
- `effect:persistent_survival_modifier`
- `effect:prevention_replacement`
- `effect:survival_payoff`
- `condition:requires_damage`
- `condition:requires_net_damage`
- `condition:requires_brain_damage`
- `condition:requires_flatline`
- `condition:requires_program_trash`
- `condition:requires_installed_program`
- `condition:requires_trace_attempt`
- `condition:requires_prevention_window`
- `condition:requires_turn_limit_available`

## Normalisierung

Normalisierte Regeln:

- `damage_prevention_normalization`
- `flatline_prevention_replacement_normalization`
- `program_trash_prevention_normalization`
- `trace_defense_link_normalization`
- `tag_survival_context_normalization`
- `survival_cost_penalty_split_normalization`
- `prevention_window_context_normalization`
- `breaker_survival_overlap_normalization`
- `payment_context_normalization`
- `survival_strategy_overlay_split_normalization`
- `damage_window_context_required_classification`
- `flatline_replacement_context_required_classification`
- `trash_prevention_context_required_classification`
- `trace_context_required_classification`
- `installed_card_context_required_classification`
- `per_turn_limit_context_required_classification`
- `legalaction_context_required_classification`

## Kontextregeln

Prevention / Damage:

- Damage Prevention ist window- und damage-event-abhängig.
- Damage-Type, Amount und Per-turn-Limit bleiben sichtbar.
- Generated Facts erzeugen keine generelle Damage-Immunität.

Flatline / Penalties:

- Emergency-Self-Construct-artige Effekte werden als Flatline-Replacement normalisiert.
- Brain-Damage-Removal, Meat-Damage-Prevention, Action- und Handgrößen-Penalties bleiben getrennte mechanische Facts.
- Es wird kein aktueller sicherer Nicht-Flatline-Zustand erzeugt.

Trash / Installed-Card:

- Joan-of-Arc-artige Prevention bleibt auf andere installierte Programme begrenzt.
- Hardware, Resources und beliebige Karten werden nicht mitgeschützt.
- Ziel- und Payment-Legalität bleiben Engine/LegalActions.

Trace / Tag:

- Link, Base-Link und Trace-Defense sind Trace-window-Facts.
- Sie garantieren keinen Trace-Sieg.
- Tag-Prevention und Tag-Survival erzeugen keinen `Runner not tagged`-Boardstate.

Breaker / Survival:

- `Evil Twin` bleibt gleichzeitig Sentry-Breaker und Damage-Prevention-Tool.
- BreakerProfile erzeugt keine aktuelle Break-Legalität.
- Prevention erzeugt keine aktuelle Damage-Legalität oder Immunität.

## Rollup-Status

Batch 10 ist `ready_read_only_split_subbatches`.

Subbatches:

- `damage_prevention`
- `flatline_prevention`
- `program_trash_prevention`
- `trace_defense_or_link`
- `tag_survival_or_tag_prevention`
- `memory_or_hand_size_survival`
- `prevention_breaker_overlap`
- `excluded_or_out_of_scope`

Alle 15 eingeschlossenen Karten sind `ready_read_only_with_prevention_window_context`. Die 16 ausgeschlossenen Karten sind als `excluded_from_batch_with_reason` dokumentiert.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Planner-/Consumer-Anbindung.
- Keine Engine-, LegalAction- oder Regeländerung.
- Keine Profilumschaltung.
- Keine Holdout-Optimierung.
- Keine neuen Decks.

## Empfohlener Nächster Batch

Empfohlen wird Aufgabe 022: `corp_tag_punish_assets_operations_expansion`.

Begründung:

- Corp Damage, Ambush und Runner Survival sind jetzt mechanisch read-only vorbereitet.
- Tag/Punish nutzt dieselben Guardrails: Trace-Success, Runner-tagged, Payment, Prevention und LegalAction-Kontext.
- Der Batch schließt direkt an Local Pair 2 / Tag-Punish-Funnel an, ohne schon Strategie- oder Plannerwirkung einzuführen.

Kandidaten:

- `Datapool by Zetatech`
- `Netwatch Credit Voucher`
- `Corporate Detective Agency`
- `Power Grid Overload`
- `Urban Renewal`
- `Punitive Counterstrike`
- `Trojan Horse`
- `City Surveillance`
- `Blood Cat`
- `Omniscience Foundation`
- `Schlaghund`
- `I Got a Rock`
- `Solo Squad`
- `Hacker Tracker Central`
