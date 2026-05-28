# Aufgabe 024 - AI: Tag/Punish Unknown-Skip Attribution + Fix-Gate Review

## Kurzfazit

Aufgabe 024 ergänzt reine Diagnose-Attribution für `corpVisibleTagPunishSkippedForUnknownHigherPriority`. Der Slice klassifiziert jetzt, welche Action-Familie den legalen Tag/Punish-Payoff verdrängt hat, welche Plausibilitätsklasse daraus folgt und ob ein späterer Fix-Gate-Kandidat vorliegt.

Es wurden keine Engine-Regeln, keine Legalität, keine Planner-, Strategie- oder Action-Score-Logik, keine Profile und keine Hintdaten geändert. `data/ai/ai-card-hints-active.json` bleibt unverändert.

## Bezug zu Aufgabe 022/023

Aufgabe 022 hat den read-only Cross-Batch-Tag/Punish-Funnel mit 38 Karten, 190 Generated Facts und 165 Source/Payoff-Pairings geschlossen. Aufgabe 023 hat daraus Terminalfenster-Metriken gebaut und gezeigt, dass es legale Payoff-Fenster gibt, diese auch teilweise genommen werden und die auffälligen Restfälle vor allem bei `unknown_higher_priority` liegen.

Aufgabe 024 nutzt weiter nur sichtbaren Boardstate, LegalActions, Action-Payloads und bestehende Diagnosefelder. Der Funnel liefert keine Legalität und keine Action-Score-Wirkung.

## Audit

`corpVisibleTagPunishSkippedForUnknownHigherPriority` entsteht im Tag/Punish-Terminalfenster, wenn ein sichtbarer Runner-Tag und mindestens eine sichtbare legale Payoff-Action vorliegen, die gewählte Corp-Action aber nicht in die bereits expliziten Skip-Buckets Score, Advance, Economy, Remote/Central Protection, Draw, Install oder End Turn fällt.

An dieser Stelle liegen bereits side-safe Daten vor:

- gewählte Action mit `action.type`
- sichtbarer Source-Card-Titel/-Id, soweit aus LegalAction und sichtbarem Runtime-Katalog ableitbar
- `reasonCode` und Evidence-Strings
- sichtbare legale Payoff-Kandidaten mit Karte und Payoff-Art
- Runner-Survival-Gegenkontext

Nicht als eigener stabiler Wert vorhanden ist ein separater Plan-Label/Strategic-Line-Name pro Action. Für Aufgabe 024 bleiben deshalb `reasonCode`, Evidence und Action-Familie die robuste Diagnosebasis.

## Neue Metriken

Ergänzt wurden:

- Chosen-Action-Familien für unknown-Skips: Score, Advance, Install Agenda/ICE/Asset, Rez, Operation, Ability, Trace-Tag-Source, Draw, Basic Credit, End Turn, Unknown.
- Coverage-Zähler für ReasonCode, ActionType, ChosenCard, PayoffCard und PayoffKind.
- Plausibilitätsklassen: `plausible`, `suspicious`, `unclassified`.
- Attribution-Buckets wie `unknown_skip_plausible_score_window`, `unknown_skip_plausible_hq_or_rnd_safety`, `unknown_skip_suspicious_economy_or_setup`, `unknown_skip_suspicious_basic_credit` und `unknown_skip_unclassified_missing_evidence`.
- Payoff-Kontext: Damage, Economic, Trash, RunLock, Ambush, lethal/near-lethal und non-lethal.
- Fix-Gate-Zähler: eligible, blocked by Score, AdvanceScore, Safety, Affordability, LowImpact und suspicious skip.

Die per-Action-Evidence bleibt kompakt und side-safe: keine FullGameState-Felder, keine CardInstances, keine Hidden-Zone-Inhalte und keine privaten Payloads.

## Tests

Ergänzt wurde ein fokussierter Summary-Test in `packages/ai/src/index.test.ts`. Er deckt ab:

- unknown skip durch Basic Credit als `unknown_skip_suspicious_basic_credit`
- unknown skip durch End Turn als `unknown_skip_suspicious_end_turn`
- Score- und Advance-to-score-Fenster als plausible Blocker
- HQ/R&D-Safety als plausible Safety
- unaffordable Payoff als plausible Affordability
- low-impact Payoff als plausible LowImpact
- Survival-Countercontext als plausible Safety
- low-value Install als suspicious Fix-Gate-Kandidat
- unclassified missing evidence
- Fix-Gate-Zähler und Payoff-Kontext

Die Hidden-State-Invarianz und DTO-/Sanitizer-Sicherheit bleiben durch die bestehenden Summary-/Sanitizer-Tests abgedeckt.

## 8-Slot-Diagnose

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`

Safety global:

- `illegalActions`: 0
- `replayFailures`: 0
- `timeoutRate`: 0

Candidate global:

- Corp Scores: 63
- Runner Steals: 117
- sichtbare legale Tag/Punish-Payoff-Actions: 64
- Payoffs genommen: 24
- Payoffs übersprungen: 12
- Unknown-Skips: 11
- plausible Unknown-Skips: 2
- suspicious Unknown-Skips: 4
- unclassified Unknown-Skips: 5
- FixGate-eligible suspicious windows: 4

Dominante Chosen-Action-Family:

- `play_operation`: 11 von 11 Unknown-Skips
- Basic Credit: 0
- End Turn: 0
- Install/Rez/Advance/Score: 0

Dominante ReasonCodes und Karten:

- ReasonCode: `corp.tag.punish_visible_tag` in 11 von 11 Unknown-Skips
- Chosen Cards: `Scorched Earth` 5, `Closed Accounts` 4, `Datapool by Zetatech` 1, `Punitive Counterstrike` 1
- Payoff Cards: `Scorched Earth` 6, `Closed Accounts` 5, `Datapool by Zetatech` 4, `Netwatch Credit Voucher` 3, `Punitive Counterstrike` 1, `Urban Renewal` 1
- Payoff Kinds: Damage 6, Economic 5, Trash 5, Unknown 4
- Lethal/Near-lethal: 4
- Non-lethal: 7

## Slot-Befunde

`local_realistic_pair_2`:

- sichtbare legale Payoff-Actions: 19
- Payoffs genommen: 8
- Payoffs übersprungen: 3
- Unknown-Skips: 3
- plausible/suspicious/unclassified: 0 / 0 / 3
- Chosen Family: 3x `play_operation`
- Chosen Cards: `Scorched Earth` 2, `Punitive Counterstrike` 1
- Payoff-Kontext: Damage 3, Trash 2, lethal/near-lethal 1
- FixGate-eligible suspicious windows: 0

Befund: Local Pair 2 bleibt kein sauberer Fix-Beleg. Es gibt legale Payoff-Fenster und Payoffs werden genommen, aber die verbliebenen Unknown-Skips sind unclassified, nicht Basic Credit, End Turn oder Low-Value-Install.

`real_scene_pair_2`:

- sichtbare legale Payoff-Actions: 22
- Payoffs genommen: 5
- Payoffs übersprungen: 4
- Unknown-Skips: 4
- plausible/suspicious/unclassified: 1 / 1 / 2
- Chosen Family: 4x `play_operation`
- Chosen Cards: `Scorched Earth` 3, `Closed Accounts` 1
- Payoff-Kontext: Damage 3, Economic 2, Trash 3, lethal/near-lethal 3
- FixGate-eligible suspicious windows: 1
- Safety-blocked: 1

Befund: Real Scene Pair 2 liefert einen möglichen Fix-Gate-Kandidaten, aber auch Safety-Gegenkontext und zwei weiterhin unclassified Fälle.

`snapshot_holdout_origin_pressure_vs_tag_ops`:

- sichtbare legale Payoff-Actions: 22
- Payoffs genommen: 10
- Payoffs übersprungen: 5
- Unknown-Skips: 4
- plausible/suspicious/unclassified: 1 / 3 / 0
- Chosen Family: 4x `play_operation`
- Chosen Cards: `Closed Accounts` 3, `Datapool by Zetatech` 1
- Payoff-Kontext: Economic 3, Non-lethal 4
- FixGate-eligible suspicious windows: 3
- LowImpact-blocked: 1

Befund: Snapshot Holdout enthält die stärkste Fix-Gate-Evidence. Die Payoffs sind aber überwiegend economic/non-lethal und die gewählten Actions sind ebenfalls Tag/Punish-nahe Operationen, nicht generische Economy oder Setup.

## Fix-Gate-Auswertung

Die Diagnose findet 4 FixGate-eligible suspicious windows:

- 3 in Snapshot Holdout
- 1 in Real Scene Pair 2
- 0 in Local Pair 2

Gleichzeitig bleiben 5 Unknown-Skips unclassified, und alle 11 Unknown-Skips wählen `play_operation`. Es gibt kein Muster, in dem legaler Punish sichtbar durch Basic Credit, End Turn, Low-Value Install oder generisches Setup verdrängt wird.

## Entscheidung

Entscheidung: **weiterer Diagnose-Slice vor Strategie-Fix**.

Ein pauschaler Tag/Punish-Boost ist nicht gerechtfertigt. Ein enger Conversion-Fix ist noch nicht sauber genug belegt, weil die auffälligen Fälle nicht durch Low-Value-Actions dominiert werden, sondern durch andere Operationen, teils sogar Tag/Punish-Payoff-Karten selbst. Vor einem Fix sollte ein kleiner Follow-up die suspicious/unclassified `play_operation`-Skips mit konkreter Operation-vs-Payoff-Priorität auswerten: gewählte Operation, legaler Payoff, Kosten, Damage-/Trash-/Economic-Impact, Runner-Handgröße, Score/Safety-Gegenkontext und ob beide Actions denselben Payoff-Typ bedienen.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Planner-/Strategy-/Action-Score-Änderung.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.

## Nächster Praktischer Schritt

Aufgabe 025 sollte kein Punish-Boost sein, sondern ein enger `play_operation`-Attribution-Slice für Tag/Punish-Fenster:

- Operation-vs-Payoff-Priorität konkret ausgeben.
- Same-payoff-vs-different-payoff unterscheiden.
- Economic/non-lethal Payoffs getrennt von lethal/near-lethal Damage bewerten.
- Die 4 FixGate-eligible suspicious windows und 5 unclassified windows als Repro-Ziel nehmen.

Erst wenn daraus wiederkehrend eine Low-Value-Operation gegen einen klar stärkeren legalen Payoff sichtbar wird, ist ein begrenzter Conversion-Fix vertretbar.
