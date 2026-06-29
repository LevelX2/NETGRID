# AI Score-Closeout und Economy Evidence 2026-06-29

Analysiertes Match: `match_8ff8d058ccad6138`

Speicher: `data/runtime/multiplayer/netgrid.sqlite`

Modus: `human_runner_vs_corp_ai`

Ergebnis: Korp-Sieg bei StateVersion 305

Decks:

- Runner: `Inside Forgery Loop`
- Korp: `KI Rush Score - Static ICE Mix`

Replay-Umfang:

- Events: 306
- State-Snapshots: 306
- AI-Decision-Traces: 127

## Gesamtbefund

Die Korp spielte besser als in der vorherigen Baseline: Remote 1 wurde konsequent als Scoring-Server aufgebaut, `Red Herrings` wurde als Steal-Kosten-Schutz genutzt, und die Korp gewann über Agenda-Punkte. Die verbleibenden Fehler liegen nicht primär in ICE-Nutzung, sondern in Scoreline-Sequenzbewertung und Economy-Semantik.

## Finding 1: Same-Turn-Closeout wird nicht als Sequenz erkannt

Betroffene Agenda: `Security Purge`

Zeitachse:

- SV 38: `Security Purge` liegt in Remote 1 mit 0 Advancement Counters.
- SV 39: 1 Counter, Korp beendet den Zug.
- SV 106: 1 Counter, Korp hat 2 Credits und 3 Klicks. Eine Sequenz `advance`, `advance`, `score` wäre legal und schließt vor dem nächsten Runner-Zug.
- SV 106/107: Korp nimmt Credits statt den Closeout zu starten.
- SV 108: Korp installiert weiteres ICE.
- SV 181: Korp advanced erst später auf 2 Counter.
- SV 190: Korp advanced auf 3 Counter.
- SV 191: `score_agenda` wird genommen.

Trace-Signal:

- Bei SV 106 rankt `advance_card` nur auf Rang 7 mit `priority:-804`.
- Der Scoring-Window-Kontext bewertet `window_kind:unsafe` und `score_horizon:next_turn`, obwohl die vollständige Same-Turn-Sequenz mit 3 Klicks und 2 Credits schließen kann.

Schichtdiagnose:

- Die Runtime bewertet einzelne LegalActions isoliert.
- Ein legaler mehrschrittiger Closeout im selben Corp-Turn wird nicht als eigene Opportunity erkannt.

Erwartetes Verhalten:

- Wenn `currentCounters + affordableAdvances >= advancementRequirement` und danach noch ein Klick für `score_agenda` bleibt, soll `advance_card` auf diese Agenda als Same-Turn-Closeout zählen.
- Diese Bewertung darf nur vorhandene LegalActions, sichtbaren Server-Kontext, eigene Credits/Klicks und öffentliche/own-Kartenmetadaten nutzen.

## Finding 2: Score-now verliert gegen unnötiges weiteres Advancen

Betroffene Agenda: `Marine Arcology`

Zeitachse:

- SV 252: zweite `Marine Arcology` wird in Remote 1 installiert.
- SV 253: 1 Counter.
- SV 254: 2 Counter.
- SV 281: Remote ist nach Runner-Run leerer, `Marine Arcology` liegt offen mit 2 Countern.
- SV 282: Korp advanced auf 3 Counter. `score_agenda` ist ab diesem Zustand legal.
- SV 283: Korp advanced trotzdem auf 4 Counter, `score_agenda` liegt nur auf Rang 2.
- SV 284: Korp advanced nochmals auf 5 Counter.
- SV 285: Korp scored mit 5 Countern.

Trace-Signal:

- SV 282: `advance_card` gewinnt mit ca. `3004`, `score_agenda` liegt bei ca. `2218`.
- SV 283: `advance_card` gewinnt erneut mit ca. `3004`, `score_agenda` liegt wieder bei ca. `2218`.
- `Marine Arcology` hat `advancementRequirement:3`, `agendaPoints:2` und keinen Overadvance-Payoff.

Schichtdiagnose:

- `corp_advance_score_line` und `corp_advance_remote_context` überstimmen `corp_score_available_agenda`.
- Die Runtime unterscheidet nicht hart genug zwischen legitimer Overadvance-Agenda und Agenda ohne Overadvance-Nutzen.

Erwartetes Verhalten:

- Sobald eine Agenda ohne Overadvance-/Counter-Payoff scorebar ist, muss `score_agenda` dieselbe Agenda gegenüber `advance_card` dominieren.
- `advance_card` darf darüber nur gewinnen, wenn ein erkannter Payoff-Schwellenwert erreicht wird.

## Finding 3: `Marine Arcology`-Ability ist als Economy unterbewertet

Betroffene Fähigkeit: `Marine Arcology`, `[A], [A]: Gain 3 credits.`

Zeitachse:

- SV 218: Erste `Marine Arcology` wird gescored.
- SV 232: Korp wählt `gain_credit` mit `priority:1704`; `Marine Arcology: Fähigkeit nutzen` liegt nur bei `939`.
- SV 242: Korp wählt `gain_credit` mit `priority:1585`; `Marine Arcology: Fähigkeit nutzen` liegt nur bei `922`.
- SV 243: Korp wählt `draw_card`; Marine-Ability bleibt nur Rang 2.
- SV 293 und SV 302: Marine-Ability ist fast gleichwertig mit kleinen Economy-Operationen, aber erhält keinen eigenen Economy-Wert aus `gain_credits`.

Trace-Signal:

- ScoreBreakdown für die Ability enthält im Wesentlichen nur `semantic_type_tie_breaker:activated_card_ability`.
- Es gibt keinen sichtbaren `corp_activated_economy`- oder vergleichbaren Nutzenwert.

Schichtdiagnose:

- Aktivierte Corp-Kartenfähigkeiten mit `gain_credits`-Effekt werden nicht als Economy-Kandidaten normalisiert.
- Basis-`gain_credit` bekommt `corp_low_credits` und Reserve-Boni, die 2-Klick-für-3-Credits-Ability aber nicht.

Erwartetes Verhalten:

- Legale eigene/scored `activated_card_ability`-Aktionen mit sichtbarem `gain_credits`-Effekt sollen als Economy zählen.
- Bei reinem Funding-/Economy-Ziel muss 3 Credits für 2 Klicks besser sein als zwei einzelne Basis-Credits, sofern keine Score-now-Triage dagegensteht.

## Finding 4: Zielserver-Bindung driftet zu `new_remote`

Beispiele:

- SV 106/107 während `Security Purge` in Remote 1: Triage nennt `triage_target:new_remote` beziehungsweise `triage_score_remote:new_remote`.
- Die konkrete Agenda liegt aber in `remote_1`, und die relevante LegalAction zielt auf diese Agenda.

Schichtdiagnose:

- Abstrakte Score-Remote-Vorbereitung verdrängt den konkreten vorhandenen Scoreline-Server.
- Dadurch werden konkrete `advance_card`-Aktionen teilweise als Mismatch oder unsafe behandelt.

Erwartetes Verhalten:

- Eine vorhandene advancebare Agenda im Remote bekommt als konkreter Scoreline-Kontext Vorrang vor `new_remote`.
- LegalAction-Ziel, Server-Root und Scoring-Window-Assessment sollen auf denselben Server gebunden werden.

## Nicht-Finding: Project Zurich

`Project Zurich` wurde in diesem Match nicht fünfmal advanced. Die konkrete Karte wurde:

- SV 292 installiert.
- SV 293 auf 1 Counter advanced.
- SV 294 auf 2 Counter advanced.
- SV 303 auf 3 Counter advanced.
- SV 304 gescored.

`Project Zurich` besitzt einen echten Overadvance-Payoff über die CardImplementation `overadvance_start_of_corp_turn_credits`. Ein Fix darf deshalb Overadvance nicht pauschal verbieten.

## Akzeptanzkriterien

- Same-Turn-Closeout-Test: `advance_card` auf eine Agenda mit erfüllbarer Restanforderung gewinnt gegen Economy/Setup, wenn die Agenda im selben Turn noch gescored werden kann.
- Non-Overadvance-Test: `score_agenda` gewinnt gegen weiteres `advance_card`, wenn die Agenda scorebar ist und keinen Overadvance-Payoff hat.
- Overadvance-Regressionsschutz: eine Agenda mit erkanntem Overadvance-Payoff darf bei sinnvoller Schwelle weiter advanced werden.
- Marine-Arcology-Test: Die 2-Klick-3-Credits-Ability gewinnt gegenüber zwei Basis-Credit-Aktionen oder wird mindestens vor einzelnes `gain_credit` gerankt, wenn kein Score-now-Ziel existiert.
- Existing Corp-Triage-, Scoring-Window- und AI-Typechecks bleiben grün.

