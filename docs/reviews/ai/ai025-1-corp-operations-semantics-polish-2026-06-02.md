# AI025-1 Corp Operations Semantics Polish

## Kurzfazit

AI025-1 schärft AI025 als gezielte Nachkorrektur. Die 40 aktiven/compiled Corp-Operations bleiben abgedeckt; davon sind 27 Originalset-, 8 Proteus- und 5 aktive Test-/V08-Operations. 20 Operation-Hints wurden korrigiert und 9 read-only Funktionssignale im Katalog ergänzt: 8 lokale AI025-1-Signale plus das shared Guide-V3-Draw-Signal `draw.corp_draw`.

## Korrekturen

- Draw, Economy und Recovery wurden getrennt: Off-Site Backups ist Archives-Recovery ohne Draw; V08 Archive Planning Operation ist Draw ohne Archives-Recovery; Closed Accounts ist Runner-Credit-Loss-Payoff, kein Corp-Credit-Gain.
- Falsified-Transactions Expert nutzt `advance.corp_counter_transfer` statt Counter-Erzeugung. Advancement-Burst-Operations verlangen keine vorhandenen Advancement-Counter.
- Conditions wurden präzisiert: mehrere Runs, Node-Trash-last-turn, Run-this-game und Resource-installed-last-turn sind eigene read-only Signale.
- Datapool by Zetatech und Netwatch Credit Voucher sind Tag-Snowball/Additional-Tag-Follow-up statt normale initiale Tag-Quellen.
- Punitive Counterstrike, Scorched Earth und Urban Renewal tragen präzise Meat-Damage-/Tagged-Meat-Damage-Semantik mit Amount-Evidence.
- Rent-to-Own Contract ist Deferred-/Installment-Rez und kein Temporary-Rez; Emergency Rig bleibt Free-/Temporary-Rez mit Kludge-Lifetime-Kandidat.

## Neue Signale

- `condition.multiple_runs_last_turn`: supportOnly=true, anchors=none
- `condition.node_trashed_last_turn`: supportOnly=true, anchors=none
- `condition.run_this_game`: supportOnly=true, anchors=none
- `condition.resource_installed_last_turn`: supportOnly=true, anchors=none
- `damage.meat_source`: supportOnly=false, anchors=corp.damage_kill
- `damage.tagged_meat_payoff`: supportOnly=false, anchors=corp.damage_kill, corp.tag_trace_punish
- `draw.corp_draw`: supportOnly=true, anchors=none; shared Guide-V3-Signal für AI025-1 und AI026-1
- `ice.corp_installment_rez`: supportOnly=true, anchors=none
- `tag.additional_tag_followup`: supportOnly=false, anchors=corp.tag_trace_punish

## Hidden-Info und Wirkung

Alle Planner-, ActionScore-, PlanWeight-, Targeting-AI-, Engine-, Legalitäts-, Profil-/Default-, UI- und Hidden-Info-Wirkungsflags bleiben `false`. Private Corp-Entscheidungen bleiben side-safe und werden nur als Report-Kandidaten oder Schema-Gaps dokumentiert.

## Test-/V08-Trennung

Reports trennen weiterhin 27 Originalset-, 8 Proteus-, 5 aktive Test-/V08- und 4 inaktive Classic-Operations. Test-only StrategySupportPairs werden nicht als Produktionsaggregation gezählt.
