# Aufgabe 020 - AI-Hints: Corp Nodes / Assets / Ambush / Economy Remotes Closeout

## Kurzfazit

Aufgabe 020 schließt den read-only Batch `batch_9_corp_nodes_assets_ambush_economy_remotes` ab. Der Batch erweitert den Generated-Facts-Pilot auf Corp Nodes, Assets, Ambushes, Economy-Remotes und angrenzende Tag/Punish-/Remote-Tax-Karten. `data/ai/ai-card-hints-active.json` bleibt unverändert und weiterhin Runtime-Quelle.

Ergebnis:

- 48 Kandidaten geprüft.
- 45 Karten eingeschlossen.
- 3 Karten begründet ausgeschlossen.
- 131 Generated Facts bestätigt oder neu abgeleitet.
- 114 Preview-Adds im read-only Vergleichspfad.
- 295 Differenzen/Kontext-Hinweise normalisiert.
- 0 verbleibende Differenzen.
- 0 Follow-ups.
- 0 Hard Errors.
- 0 echte semantische Konflikte.
- Readiness: `ready_read_only_split_subbatches`.

## Warum Dieser Batch

Nach Corp Economy, Corp ICE und RemoteRole ist Corp Nodes / Assets / Ambush / Economy Remotes der nächste direkte Anschluss an Remote-Portfolio, Trash-Budget und Tag/Punish. Die mechanischen Outputs sind als Generated Basic Facts gut abgrenzbar:

- Remote-Asset-Economy, Action-Economy und finite hosted pools.
- Access-Punish- und Ambush-Effekte.
- Trace-/Tag-Quellen und Tag-Punish-Payoffs.
- Remote-Tax und Runner-Payment-Kontext.
- Hidden-zone / rearrange utilities ohne Hidden Info.

Remote-Intent, Bait-Wertung, Trash-Priorität und Remote-Portfolio-Strategie bleiben Planner/Overlay.

## Geprüfte Kandidaten

Eingeschlossen:

- `ACME Savings and Loan`
- `BBS Whispering Campaign`
- `Braindance Campaign`
- `Blood Cat`
- `City Surveillance`
- `Corporate Negotiating Center`
- `Corprunner's Shattered Remains`
- `Crybaby`
- `ESA Contract`
- `Euromarket Consortium`
- `Experimental AI`
- `Fortress Architects`
- `Hacker Tracker Central`
- `Holovid Campaign`
- `I Got a Rock`
- `Information Laundering`
- `Investment Firm`
- `Newsgroup Taunting`
- `Omniscience Foundation`
- `Pacifica Regional AI`
- `Remote Facility`
- `Rescheduler`
- `Rockerboy Promotion`
- `Rustbelt HQ Branch`
- `Schlaghund`
- `Setup!`
- `Solo Squad`
- `South African Mining Corp`
- `Spinn® Public Relations`
- `Datapool by Zetatech`
- `Netwatch Credit Voucher`
- `Corporate Detective Agency`
- `Power Grid Overload`
- `Urban Renewal`
- `Trojan Horse`
- `New Blood`
- `Cowboy Sysop`
- `Roving Submarine`
- `New Galveston City Grid`
- `Jerusalem City Grid`
- `Singapore City Grid`
- `Chester Mix`
- `Omni Kismet, Ph.D.`
- `Dr. Dreff`
- `Vacant Soulkiller`

Ausgeschlossen:

- `Rex Campaign`: keine aktive Runtime-Katalogkarte, kein aktiver AI-Hint und keine CardImplementation unter diesem Titel gefunden.
- `Marcel DeSoleil`: keine aktive Runtime-Katalogkarte, kein aktiver AI-Hint und keine CardImplementation unter diesem Titel gefunden.
- `Zetatech Software Installer`: Runner-Program/Install-Support, außerhalb des Corp-Node-/Asset-/Ambush-/Remote-Economy-Scopes.

Prompt-Titel wurden auf Katalogtitel normalisiert: `Spinn Public Relations` zu `Spinn® Public Relations` und `Dreff` zu `Dr. Dreff`.

## Derived-Facts-Erweiterungen

Der read-only Deriver/Pilot wurde um Batch-9-Karten und stabile Node-/Asset-Fact-Klassen erweitert:

- `effect:finite_economy_pool`
- `effect:action_economy`
- `effect:start_of_turn_economy`
- `effect:recurring_economy`
- `effect:advanceable_economy`
- `effect:ambush`
- `effect:access_punish`
- `effect:tag_source`
- `effect:tag_punish_payoff`
- `effect:remote_tax`
- `effect:trace_credit`
- `effect:resource_trash`
- `effect:link_penalty`
- `condition:requires_accessed_card`
- `condition:requires_runner_tagged`
- `condition:requires_trace_success`
- `condition:requires_runner_draw`
- `condition:requires_runner_pay_or_take_tag`
- `condition:requires_advancement_counter`
- `condition:requires_remote_server`
- `condition:requires_rezzed_card`

## Normalisierung

Normalisierte Regeln:

- `remote_asset_economy_normalization`
- `finite_pool_asset_normalization`
- `advanceable_asset_economy_normalization`
- `ambush_access_punish_normalization`
- `tag_source_asset_normalization`
- `remote_tax_or_runner_payment_normalization`
- `remote_capacity_or_portfolio_normalization`
- `trace_credit_support_normalization`
- `hidden_zone_or_rearrange_context_normalization`
- `remote_strategy_overlay_split_normalization`
- `access_context_required_classification`
- `trace_success_context_required_classification`
- `runner_tagged_context_required_classification`
- `variable_amount_context_classification`
- `remote_context_required_classification`
- `legalaction_context_required_classification`
- `hidden_zone_context_classification`
- `board_context_required_classification`

## Kontextregeln

Remote / Economy:

- Remote-Economy beschreibt nur mechanische Credit-, Draw-, Action- oder Poolfunktion.
- Hosted/fixed Pools erzeugen keinen aktuellen Boardstate.
- Generated Facts empfehlen nicht, ein Asset jetzt zu installieren oder zu nutzen.

Access / Ambush:

- Ambush- und Access-Punish-Facts brauchen tatsächlichen Access-Kontext.
- Sie erzeugen keine garantierte Treffer-, Damage-, Trash- oder Target-Auswahl.

Trace / Tag:

- Trace-Success, Runner-tagged, Runner-draw und Payment-Kontexte bleiben sichtbar.
- Tag-Quellen werden nicht als garantierte Tags ausgegeben.
- Tag-Punish wird nicht ohne `requires_runner_tagged` als aktueller Payoff gewertet.

Remote-Tax / Remote-Portfolio:

- Remote-Tax und Runner-Payment-Facts sind Kontextdruck, keine statische Remote-Safety.
- Remote-Portfolio, Bait und Trash-Budget bleiben Overlay/Planner/Diagnose.

Hidden-Zone:

- Hidden-zone und rearrange mechanics enthalten keine konkreten Kartennamen oder Reihenfolgen.
- HQ/R&D/ICE-Rearrange bleibt side-safe Kontext.

## Rollup-Status

Batch 9 ist `ready_read_only_split_subbatches`.

Subbatches:

- `remote_asset_economy`
- `finite_pool_asset_economy`
- `start_of_turn_asset_economy`
- `action_asset_economy`
- `advanceable_asset_economy`
- `ambush_access_punish`
- `tag_source_asset_or_node`
- `tag_punish_asset_or_node`
- `remote_tax_or_runner_payment_asset`
- `remote_capacity_or_remote_portfolio_asset`
- `trace_credit_or_trace_support_asset`
- `board_state_or_hand_size_asset`
- `hidden_zone_or_rearrange_asset`
- `remote_utility_or_rearrange_asset`

Alle 45 eingeschlossenen Karten sind `ready_read_only_with_remote_access_context`.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine modularen Overlays als Runtime-Quelle.
- Keine Engine-, Planner-, Consumer- oder Profiländerung.
- Keine Performanceinterpretation.

## Nächster Batch

Empfohlen für Aufgabe 021: `runner_prevention_damage_survival_tools`.

Begründung: Nach Corp ICE/Damage/Trace und Corp Ambush/Tag-Punish ist Runner Prevention / Damage / Survival der sinnvollste Gegenblock. Er kann mechanische Prevention-/Survival-Facts strukturieren, ohne daraus Runner-Survival-Strategie oder neue Planner-Entscheidungen abzuleiten.
