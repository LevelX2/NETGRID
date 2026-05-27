# Aufgabe 023 - AI: Tag/Punish Terminal Consumer Diagnostics

## Kurzfazit

Aufgabe 023 ergänzt einen reinen Diagnose-Slice für Tag/Punish-Terminalfenster im AI-/Benchmark-Pfad. Es wurden keine Engine-Regeln, keine Legalität, keine Planner- oder Action-Score-Logik, keine Profile und keine Hintdaten geändert. `data/ai/ai-card-hints-active.json` bleibt unverändert.

Der Slice misst jetzt getrennt:

- wann Tags entstehen,
- ob Tags beim Corp-Entscheidungsfenster noch sichtbar sind,
- ob dann eine sichtbare legale Punish-/Payoff-Action existiert,
- ob diese genommen oder übersprungen wird,
- welche Skip-Klasse die Payoff-Action verdrängt,
- ob Source/Payoff-Pairings nur statisch vorhanden sind oder bis ins Terminalfenster konvertieren,
- welcher Runner-Survival-Gegenkontext sichtbar ist.

## Bezug zu Aufgabe 022

Aufgabe 022 hat den read-only Cross-Batch-Funnel mit 38 Tag/Punish-relevanten Corp-Karten, 190 Generated Facts und 165 Source/Payoff-Pairings geschlossen. Aufgabe 023 nutzt diese Grundlage nicht als Legalitätsquelle, sondern nur als Diagnoseklassifikation. Führend bleiben sichtbarer Boardstate, LegalActions und Action-Payloads.

## Vorhandene Metriken

Bereits vorhanden und weitergeführt:

- `runnerTaggedAtCorpDecision`
- `runnerTagClearedBeforeCorpDecision`
- `corpPunishOpportunities`
- `corpPunishTaken`
- `corpPunishSkipped`
- `corpPunishWindowExpiredBeforeCorpTurn`
- `corpPunishOpportunityConfirmedByOntology`
- `corpPunishSkippedDespiteOntologyOpportunity`
- `corpTagSourceConvertedToOntologyPunishOpportunity`
- `corpOntologyPunishOpportunityConverted`
- `corpOntologyPunishOpportunityExpired`
- `corpTagSourceTakenWithOntologyPayoffAvailable`
- `corpTagSourceTakenWithoutOntologyPayoff`
- `corpTagPunishOntologyProfilesSeen`
- `corpTagSourceOntologyUsed`
- `corpTagPunishPayoffOntologyUsed`

Präzise genug waren die vorhandenen Basiszähler für sichtbare Tags, grobe Opportunities und Ontology-Nutzung. Zu breit waren die alten Skip-Gründe `protection`, `remote_safety` und `unknown`; sie konnten Terminalfenster nicht sauber von Score-/Advance-/Install-/Economy-Verdrängung trennen.

## Neue Terminalfenster-Metriken

Neu ergänzt wurden Metrikgruppen für:

- Tag-Erzeugung nach Window und Quelle: Runner-Turn, Corp-Turn, Encounter, Trace Success, Access/Steal, persistent, scored agenda, operation, asset/node, ICE.
- Tag-Zustand am Corp-Decision-Fenster: Payoff bekannt/unbekannt, Runner-Turn-/Encounter-Tag noch sichtbar, Tag vor Corp-Decision gecleared, Expiry vor Decision.
- sichtbare legale Payoffs: Gesamtzahl, Damage, Economy, Trash, Run-lock, Ambush, ByKind und ByCard.
- Taken/Skipped/Overridden: Score, Advance, Economy, Remote Protection, Central Protection, Draw, Install, End Turn, Unknown Higher Priority.
- Source/Payoff-Pairing im konkreten Spiel: Pair gesehen, Source genommen, sichtbarer Payoff, Tagged-Decision-Window, Legal-Payoff-Window, Payoff genommen, Expiry vor Payoff.
- Runner-Survival-Gegenkontext: Trace-/Link-Defense, Damage Prevention, Flatline Prevention und suppressed-punish-value nur als Diagnose.

## Tests

Ergänzt wurden Fokus-Tests in `packages/ai/src/index.test.ts`:

- Tag während Runner-Turn plus Clear vor Corp-Decision.
- Runner tagged bei Corp-Decision mit sichtbarer Damage-Payoff-Action.
- Punish legal, aber Score/Advance/Economy/Install/Unknown verdrängen die Payoff-Action als Diagnose.
- Trace-basierte Tagquelle bleibt trace-success-kontextabhängig.
- Persistent Tag Pressure zählt nicht als aktueller Tag-State ohne Boardstate.
- Source/Payoff-Pairing erzeugt keine Actionentscheidung.
- Runner-Survival-Gegenkontext erzeugt keinen sicheren Runner-State.
- Hidden-State-Invarianz bleibt erhalten.

## 8-Slot-Diagnose

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- 8 runnable Slots
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`

Safety global:

- `illegalActions`: 0 in allen Slots.
- `replayFailures`: 0 in allen Slots.
- `timeoutRate`: 0 in allen Slots.

Candidate über alle 8 Slots:

- Corp Scores: 63.
- Runner Steals: 117.
- Tags während Runner-Turn: 56.
- Tags während Corp-Turn: 9.
- Tags während Encounter: 53.
- Runner tagged bei Corp-Decision: 152.
- Tags vor Corp-Decision gecleared: 49.
- Clears nach Funnel-Source vor Corp-Decision: 30.
- sichtbare legale Tag/Punish-Payoff-Actions: 64.
- sichtbare Payoffs genommen: 24.
- sichtbare Payoffs übersprungen: 12.
- Source/Payoff-Pairings gesehen: 60.
- Source mit Payoff im Deck genommen: 44.
- Pairing zu Tagged-Decision-Window konvertiert: 32.
- Pairing zu Legal-Payoff-Window konvertiert: 18.
- Pairing zu Payoff-Taken konvertiert: 14.
- Pairing vor Payoff-Window expired: 30.

## Slot-Befunde

`local_realistic_pair_2`:

- Candidate: 15 Tags während Runner-Turn, 1 während Corp-Turn, 28 tagged Corp-Decisions.
- 10 Tag-Clears vor Corp-Decision, davon 9 nach Funnel-Source.
- 19 sichtbare legale Payoff-Actions, 8 genommen, 3 übersprungen.
- 19 Pairings gesehen, 12 Sources genommen, 8 bis tagged Decision, 6 bis legal Payoff, 5 bis Payoff genommen, 9 expired.
- Befund: Das alte Timingproblem bleibt sichtbar, aber nicht als simples "legaler Punish wird immer ignoriert". Es gibt legale Payoff-Fenster; ein relevanter Anteil expired vorher.

`real_scene_pair_2`:

- Candidate: 18 Tags während Runner-Turn, 37 tagged Corp-Decisions.
- 11 Clears vor Corp-Decision, alle 11 nach Funnel-Source.
- 22 sichtbare legale Payoff-Actions, 5 genommen, 4 übersprungen.
- 19 Pairings gesehen, 16 Sources genommen, 14 bis tagged Decision, 7 bis legal Payoff, 5 bis Payoff genommen, 11 expired.
- Runner-Survival-Gegenkontext: 9 sichtbare Countercontext-Fenster.
- Befund: Die Payoff-Legalität ist jetzt belegbar messbar. Die verbleibenden Skips liegen nicht bei Economy/Setup, sondern in den derzeit als `unknown_higher_priority` klassifizierten Fällen.

`snapshot_holdout_origin_pressure_vs_tag_ops`:

- Candidate: 16 Tags während Runner-Turn, 8 während Corp-Turn, 77 tagged Corp-Decisions.
- 21 Clears vor Corp-Decision, davon 10 nach Funnel-Source.
- 22 sichtbare legale Payoff-Actions, 10 genommen, 5 übersprungen.
- 22 Pairings gesehen, 16 Sources genommen, 10 bis tagged Decision, 5 bis legal Payoff, 4 bis Payoff genommen, 10 expired.
- Befund: Hier wird der Funnel am stärksten sichtbar. Candidate erzeugt mehr legale Payoff-Fenster und nimmt mehr Payoffs als Baseline, ohne Safety-Regressionssignal.

## Bewertung

Die neue Diagnose beantwortet die vorher offene Frage genauer:

- Es gibt viele Fälle, in denen Tags während Runner-Turn oder Encounter entstehen und vor dem relevanten Corp-Fenster verschwinden.
- Es gibt aber auch echte sichtbare Legal-Payoff-Fenster; diese werden teilweise genommen.
- In den relevanten Tag/Punish-Slots zeigen die neuen Metriken keine Economy-/Setup-Verdrängung als klares Muster.
- Verdächtig bleiben eher `unknown_higher_priority`-Skips in legalen Payoff-Fenstern. Diese sind jetzt messbar, aber noch kein Beleg für einen korrekten Strategiefix.

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

## Empfehlung

Nächster praktischer Schritt: ein gezielter Diagnose-Follow-up für die `unknown_higher_priority`-Skips in sichtbaren legalen Tag/Punish-Fenstern.

Noch keine Strategieänderung. Die Daten zeigen genug Terminalfenster für eine engere Trace-Auswertung, aber noch keinen sauberen Fix-Kontrakt. Der nächste Slice sollte pro übersprungenem Payoff die tatsächlich gewählte Action, ReasonCode, sichtbares Scorefenster, sichtbare Remote-Safety und Hand-/Board-Payoff-Quelle ausgeben. Erst danach ist ein kontrollierter Conversion-Fix vertretbar.
