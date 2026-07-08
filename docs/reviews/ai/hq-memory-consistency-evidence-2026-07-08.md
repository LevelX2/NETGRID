# HQ-Memory-Konsistenz Evidence 2026-07-08

Match: `match_427831dbf32a303c`

Modus: `human_corp_vs_runner_ai`

Status: finished

Winner: `corp`

Endgrund: `agenda_points`

End-StateVersion: `213`

AI-Traces: `127`

SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

## Befund 1: HQ-Trash entfernt Karten nicht aus HQ-Memory

Evidence:

- `evt_148`, `sv147 -> sv148`: Runner trasht `Lesley Major` aus HQ. PublicPayload hat `serverLabel: "HQ"`, aber kein `serverId`.
- `evt_159`, `sv158 -> sv159`: Runner trasht `Setup!` aus HQ. PublicPayload hat `serverLabel: "HQ"`, aber kein `serverId`.
- `sv159`: HQ-Memory meldet `handCount:3`, `knownCount:3`, `allCardsKnown:true` mit `Lesley Major`, `Overtime Incentives`, `Setup!`.
- `sv194/sv195`: HQ-Memory meldet weiterhin `4/4` bekannt und enthält die bereits getrashten Karten.

Technische Hypothese:

- `hqHandMemoryAdjustment` entfernt bekannte HQ-Karten nur bei `event.serverId === "hq"`.
- `publicRunTargetServerId` nutzt `serverLabel` nur für `start_run` und `access_card`; Trash-Events bekommen dadurch keine kanonische HQ-Server-ID.

Akzeptanzkriterium:

- Ein `trash_accessed_card`-Event mit `serverLabel: "HQ"` und `cardDefinitionId` entfernt diese Karte aus dem sicheren HQ-Memory.

## Befund 2: `allCardsKnown` bleibt trotz widersprechendem Access bestehen

Evidence:

- `sv195`: HQ-Memory behauptet `knownCount:4`, `allCardsKnown:true`.
- `evt_204`, `sv203 -> sv204`: Runner accessed `Data Wall 2.0` aus HQ, obwohl diese Karte nicht in der angeblich vollständigen bekannten Menge war.
- `sv204/sv205`: HQ-Memory bleibt trotzdem `knownCount:4`, `allCardsKnown:true`.

Technische Hypothese:

- `rememberObservedHqAccessDefinition` fügt Access-Fakten definitionsbasiert hinzu.
- `currentHqKnownEntriesForHandCount` kürzt bei Überfüllung per `slice(-handCount)` und kann dadurch wieder eine scheinbar vollständige, aber fachlich widersprüchliche Menge erzeugen.

Akzeptanzkriterium:

- Wenn ein späterer HQ-Access einem vollständigen HQ-Ledger widerspricht, wird das HQ-Memory konservativ invalidiert: `allCardsKnown:false`, Unknown-Rest > 0, und eine Debug-/Trace-Diagnose wie `belief_warning:hq_all_known_contradiction` wird sichtbar.

## Befund 3: Wiederholte HQ-Runs entstehen aus stale Trash-Payoff

Evidence:

- `sv160`: Runner startet erneut HQ. RunTarget: `payoff:trash_affordable`, `known:known_payoff`, `recommendation:run_now`.
- `sv195`: Runner startet erneut HQ. Score-Breakdown enthält `runner_hq_partial_known_cards: -180` mit `reason:4/4`, aber zugleich `runner_goal_fit_tactical_goal_run_target:+1000` und `runner_hq_pressure:+480`.
- Die vermeintlich trashbaren HQ-Karten sind durch Befund 1 stale.

Akzeptanzkriterium:

- Bei vollständig oder konservativ ausreichend bekanntem HQ ohne Agenda/trashbaren aktuellen Nutzen liefert Known-Central-Payoff `known_no_current_payoff`.
- HQ-Interface/Multiaccess darf einen bestätigten No-Payoff-Fall nicht zu einem guten Run hochstufen.

## Ausgeschlossen aus diesem Prozess

- Der Post-ICE-Jack-out bei `sv167/evt168` ist ein bereits behobener Altfall.
- Der frühe `sv7`-Credit-vor-freiem-R&D-Fall wird nicht als neuer Fehler umgesetzt, weil spätere `main`-Commits Credit bereits als Support-/Sub-Aktion gehärtet haben. Der Fall bleibt nur als Regressionserwartung für bestehende R&D-Pressure-Tests.
- Der finale `Security Purge`-Score ist kein belegter Runner-KI-Fehler: `Remote 2` existiert in der letzten Runner-Action-Phase `sv205-sv207` noch nicht und wird erst in `evt_210` im Corp-Zug angelegt.
