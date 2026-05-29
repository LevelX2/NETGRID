# Aufgabe 025 - Tag/Punish Payoff-Window Normalization

## Kurzfazit

Die verbliebenen `unknown_higher_priority`-Fälle aus Aufgabe 024 waren in der 8-Slot-Diagnose Metrikartefakte aus Multi-Payoff-Fenstern. Nach Decision-Window-Normalisierung bleiben global 0 `unknown_higher_priority`-Skips und 0 FixGate-suspicious Skips. Ein Strategie-Fix ist nicht gerechtfertigt.

## Bezug zu Aufgabe 022/023/024

- Aufgabe 022 schloss den read-only Tag/Punish-Funnel mit 38 Corp-Karten, 190 Generated Facts und 165 Source/Payoff-Pairings ab.
- Aufgabe 023 ergänzte Terminalfenster-Diagnosen für sichtbare Tag/Punish-Payoff-Actions.
- Aufgabe 024 klassifizierte 11 `unknown_higher_priority`-Skips; 11/11 gewählte Actions waren `play_operation`, auffällig war Operation-vs-Operation-Priorität statt Basic-Credit-/End-Turn-/Setup-Verdrängung.

## Audit der bisherigen Skip-Logik

Die bisherige Terminalfenster-Logik lag in `packages/ai/src/index.ts` in `tagPunishWindowDiagnosticsForSimulationAction`.

Vor Aufgabe 025 wurde `visiblePunishOpportunities[0]` als Referenz-Payoff genutzt. Wenn mehrere legale Payoff-Operationen sichtbar waren und die Corp nicht den ersten Kandidaten, sondern einen anderen legalen Payoff wählte, konnte das Fenster als `corpVisibleTagPunishSkipped` mit `unknown_higher_priority` erscheinen. Die Zählung war damit nicht sauber Decision-window-basiert, sondern an einem LegalAction-Referenzkandidaten ausgerichtet.

Pro Decision standen ausreichend Daten zur Verfügung: chosen action/actionId/action type, chosen card id/title über sichtbare Quellenauflösung, reasonCode/evidence, legale Payoff-Kandidaten, Payoff-Kind/-Kategorie, Runner-Tag-State und sichtbarer Survival-Countercontext. Verdeckte Runner-Zonen werden dafür nicht gelesen.

## Neue Decision-Window-Normalisierung

Ein `payoffWindow` ist jetzt ein Corp-Decision-Fenster mit sichtbarem Runner-Tag und mindestens einer sichtbaren legalen Tag/Punish-Payoff-Action.

- `payoffWindowTaken`: eine der legalen Payoff-Actions wurde gewählt.
- `payoffWindowSkipped`: keine legale Payoff-Action wurde gewählt.
- `alternativePayoffNotChosen`: mehrere legale Payoffs existieren, eine wurde gewählt, andere bleiben Alternativen und werden nicht als Skip gezählt.

Die bestehende LegalAction-Zählung bleibt als Kompatibilitätssignal erhalten. Die neuen `DecisionWindows*`-Metriken sind die führende Skip-/FixGate-Grundlage.

## Operation-vs-Operation-Attribution

Für Multi-Payoff-Fenster mit gewählter Operation werden zusätzliche Diagnosefelder gesetzt:

- `corpVisibleTagPunishOperationChoiceAmongPayoffs`
- `corpVisibleTagPunishChosenDamageOverEconomic`
- `corpVisibleTagPunishChosenEconomicOverDamage`
- `corpVisibleTagPunishChosenTrashOverDamage`
- `corpVisibleTagPunishChosenLethalOverNonLethal`
- `corpVisibleTagPunishChosenNonLethalOverLethal`
- `corpVisibleTagPunishChosenLowerImpactOverHigherImpact`
- `corpVisibleTagPunishChosenUnknownImpactOrdering`

Diese Attribution ist rein diagnostisch. Es wurden keine Action-Scores, PlanWeights, Strategic Lines, Profile oder LegalAction-Erzeugung geändert.

## Neue Metriken

Neu ergänzt wurden:

- `corpVisibleTagPunishDecisionWindows`
- `corpVisibleTagPunishDecisionWindowsTaken`
- `corpVisibleTagPunishDecisionWindowsSkipped`
- `corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs`
- `corpVisibleTagPunishAlternativePayoffsNotChosen`
- `corpVisibleTagPunishChosenPayoffAmongAlternatives`
- `corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff`
- `corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization`
- `corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen`
- `corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization`
- `corpVisibleTagPunishFixGateEligibleWindowNormalized`
- `corpVisibleTagPunishFixGateSuspiciousSkipNormalized`
- `corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken`
- `corpVisibleTagPunishPotentialPayoffOrderingIssue`
- `corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed`
- `corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage`

## Tests

Ergänzt wurde ein fokussierter Summary-Test in `packages/ai/src/index.test.ts` für:

- mehrere legale Payoffs, Payoff gewählt, Alternative nicht als Skip gezählt;
- Scorched Earth über Closed Accounts;
- Closed Accounts über lethal/near-lethal Scorched-Earth-Signal als Ordering-Diagnose;
- Basic Credit und End Turn als echte normalized suspicious Skips;
- Score und Unaffordability als blockierte/plausible Skips;
- Hidden-State-Invarianz über identische sichtbare Diagnose;
- DTO-/Summary-Sanitizer-Schutz gegen forbidden hidden-zone Felder.

## 8-Slot Diagnoseergebnis

Benchmark: `runMatchProgressionBenchmarkSuite`, `includeHoldout: true`, `maxActions: 160`, 8 runnable Slots, Baseline `belief_ai_v1_4_2`, Candidate `current_candidate`.

Global Candidate:

- Safety: `illegalActions 0`, `replayFailures 0`, `timeoutRate 0`.
- ActionLimit: Slotraten summiert 2.777; betroffene Slots bleiben Safety-Smoke, Snapshot-Holdout, Local Pair 2 und Real-Scene-Holdouts.
- Corp Scores: 63.
- Runner Steals: 117.
- Alte Payoff-Actions: 64 legal, 35 taken, 1 skipped.
- Neue DecisionWindows: 36 total, 35 taken, 1 skipped.
- MultiplePayoffWindows: 16.
- AlternativePayoffsNotChosen: 28.
- UnknownSkipResolvedAsAlternativePayoff: 11.
- UnknownSkipRemainingAfterWindowNormalization: 0.
- FixGateSuspiciousSkipNormalized: 0.
- PotentialPayoffOrderingIssue: 0.

## Slotbefunde

Local Pair 2:

- 19 legale Payoff-Actions.
- 11 DecisionWindows.
- 11 taken, 0 skipped.
- 5 Multiple-Payoff-Windows.
- 8 AlternativePayoffsNotChosen.
- 3 Unknowns wurden als AlternativePayoffTaken aufgelöst.
- 0 normalized FixGate-suspicious Skips.

Real Scene Pair 2:

- 22 legale Payoff-Actions.
- 9 DecisionWindows.
- 9 taken, 0 skipped.
- 6 Multiple-Payoff-Windows.
- 13 AlternativePayoffsNotChosen.
- 4 Unknowns wurden als AlternativePayoffTaken aufgelöst.
- 0 normalized FixGate-suspicious Skips.

Snapshot Holdout:

- 22 legale Payoff-Actions.
- 15 DecisionWindows.
- 14 taken, 1 skipped.
- 5 Multiple-Payoff-Windows.
- 7 AlternativePayoffsNotChosen.
- 4 Unknowns wurden als AlternativePayoffTaken aufgelöst.
- 0 normalized `unknown_higher_priority` remaining.
- 0 normalized FixGate-suspicious Skips.

Kontrolle:

- Safety Smoke, Progression-Tuning A, Local Pair 1 und Real Scene Pair 1 zeigen keine Tag/Punish-Payoff-Windows.
- Progression-Tuning B zeigt 1 DecisionWindow, 1 taken, 0 skipped.

## FixGate-Bewertung

Nach Normalisierung werden FixGate-Kandidaten nur gezählt, wenn im Fenster keine Payoff-Action gewählt wurde. Die 11 vorherigen Unknowns wurden als `AlternativePayoffTaken` aufgelöst. Es bleibt kein repeated Basic-Credit-, End-Turn-, Low-value-Install-, Economy-/Setup- oder sonstiger Low-value-Conversion-Skip in Local Pair 2, Real Scene Pair 2 oder Snapshot Holdout.

Entscheidung: A. Kein Strategy-Fix; die bisherigen Unknowns waren Metrikartefakte.

Kein allgemeiner Punish-Boost und kein enger Conversion-Fix. Payoff-Ordering bleibt als separate Diagnose sichtbar, im 8-Slot-Lauf aber ohne Befund.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Planner-/Strategie-Score-Änderung.
- Keine PlanWeight- oder Strategic-Line-Änderung.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine aktive Hintmigration.

## Nächster praktischer Schritt

Kein Strategie-Fix für Tag/Punish-Skips. Praktisch sinnvoll ist nur, die normalisierten Window-Metriken in künftigen AI-Reviews als führende Tag/Punish-Konversionssicht zu nutzen und Operation-vs-Operation-Ordering weiter zu beobachten, falls ein späterer Benchmark dort echte lower-impact-over-higher-impact-Muster zeigt.
