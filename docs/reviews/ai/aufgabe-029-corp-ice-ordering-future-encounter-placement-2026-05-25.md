# Aufgabe 029 - Corp ICE Ordering / Future-Encounter Placement Fix

## Kurzfazit

Der gemeldete Fehler lag in der Corp-Action-Auswahl, nicht in Legalität oder Engine: `install_card` mit `placement = ice` wurde als generischer Remote-Schutz bewertet, ohne zu berücksichtigen, dass neu installiertes ICE außen liegt und Runner ICE von außen nach innen encountered.

Der Fix ergänzt eine enge Future-/Later-ICE-Klassifikation und eine Positionsheuristik in der Corp-Plan-Action-Priorität. Future-/next-/remaining-run-ICE werden auf leeren Servern deutlich abgewertet, wenn direkte ICE-Alternativen installierbar sind. Auf bereits beiceten Servern erhalten sie dagegen einen Positionsbonus, weil sie außen installiert werden und späteres ICE hinter sich haben. Es wurden keine Engine-Regeln, LegalActions, Hints, Profile oder Decks geändert.

## Gemeldeter Ball-and-Chain-Befund

`Ball and Chain` ist als innerstes oder einziges ICE strategisch tot, weil sein relevanter Encounter-Tax erst für weitere ICE im restlichen Run wirkt. Wird es zuerst auf einen leeren Remote installiert und später weitere ICE hinzugefügt, landen diese später installierten ICE außen. `Ball and Chain` bleibt dadurch inner/last und kann keinen späteren Encounter mehr beeinflussen.

Die korrekte Multi-ICE-Reihenfolge ist deshalb: zuerst direkt wirkende ICE inner installieren, danach `Ball and Chain` oder ähnliche Future-ICE außen legen.

## Audit der bisherigen ICE-Installbewertung

- Corp-Pläne werden in `packages/ai/src/corp-plans.ts` als LegalAction-backed Plan-Kandidaten erzeugt.
- `build_scoring_remote`, `protect_hq` und `protect_rnd` erkennen `install_card` mit `placement = ice`.
- Die bisherige Bewertung berücksichtigte Serverziel und Remote-Schutz, aber nicht die Encounter-Position des neu installierten ICE.
- `actionPriority` wählte innerhalb eines Plans nach generischen ICE-/Remote-Schutzsignalen und deterministischem Action-Tiebreak.
- Dadurch konnte eine Hand-/LegalAction-Reihenfolge dazu führen, dass `Ball and Chain` als erstes ICE auf einem leeren Remote installiert wurde.
- Die KI wusste implizit nicht, dass ein später installiertes ICE außen dazu kommt und die erste Future-ICE-Installation dauerhaft inner/last lässt.

Eine lokale Heuristik reicht für diesen Fehler, weil die Regelposition von neuem ICE stabil ist. Ein echter mehrzügiger Plan-State ist dafür nicht nötig.

## Betroffene Kartenklassen

Future-/Later-ICE-Synergy-ICE:

- `Ball and Chain`
- `Canis Major`
- `Canis Minor`
- `Bolter Cluster`
- `Data Darts`
- `Fatal Attractor`
- `Tutor`
- `Viral 15`
- `Virizz`

Direct-Impact-ICE bleiben normale ICE-Installationen: ETR-, Damage-, Trash-, Tag-/Trace- und einfache Taxing-ICE dürfen weiterhin als erstes/inneres ICE auf leeren Servern installiert werden.

## Implementierter Fix

In `packages/ai/src/corp-plans.ts` wurden ergänzt:

- `classifyCorpFutureRunIceDefinitionId`
- `assessCorpFutureRunIcePlacement`
- `corpFutureRunIceOrderingActionBonus`

Bewertung:

- Future-ICE auf leerem Server mit direkter ICE-Alternative: starker Malus.
- Future-ICE auf leerem Server ohne direkte ICE-Alternative: kleiner Notfallschutz-Malus, kein Verbot.
- Future-ICE auf bereits beicetem Server: Positionsbonus, skaliert leicht mit vorhandenen späteren ICE.
- Direct-Impact-ICE erhalten keinen Future-ICE-Malus.

Damit wird ein Drei-ICE-Aufbau lokal in Richtung direct/direct/future gelenkt, ohne neue Actions zu erzeugen oder install_ice-LegalActions zu verändern.

## Neue Metriken

Ergänzt wurden unter anderem:

- `corpFutureRunIceInstallOpportunities`
- `corpFutureRunIceInstalled`
- `corpFutureRunIceInstalledAsInnermost`
- `corpFutureRunIceInstalledAsOutermost`
- `corpFutureRunIceInstalledWithLaterIce`
- `corpFutureRunIceInstalledWithoutLaterIce`
- `corpFutureRunIceInstalledOnEmptyServer`
- `corpFutureRunIceInstalledFirstOnEmptyServer`
- `corpFutureRunIceInstalledAfterInnerIceExists`
- `corpFutureRunIceInstalledAsDeadEffect`
- `corpFutureRunIceInstalledAsLiveEffect`
- `corpNextIceEffectInstalledLast`
- `corpIceOrderFutureEffectDead`
- `corpIceOrderFutureEffectLive`
- `corpMultiIceInstallOrderFutureEffectDead`
- `corpMultiIceInstallOrderOptimized`
- `corpBallAndChainInstalledInnermost`
- `corpBallAndChainInstalledWithoutLaterIce`
- `corpBallAndChainInstalledWithLaterIce`
- `corpCanisInstalledWithoutLaterIce`
- `corpBolterOrDataDartsInstalledWithoutNextIce`

## Focus-Tests

Ergänzt:

- `Ball and Chain` wird nicht zuerst auf leerem Remote installiert, wenn direkte ICE-Alternativen legal sind.
- `Ball and Chain` bleibt als äußeres ICE auf bereits beicetem Remote erlaubt.
- Drei-ICE-Aufbau bevorzugt direct first und Future-ICE danach.
- `Canis Major`, `Canis Minor`, `Bolter Cluster` und `Data Darts` werden auf leerem Remote als Dead-Effect diagnostiziert.
- Direct ETR ICE darf weiterhin zuerst auf leerem Remote installiert werden.
- Future-ICE als einzige ICE-Option bleibt als Emergency Protection erlaubt.
- Hidden-State-Invarianz und Sanitizer-Check für DecisionDebug.

## 8-Slot Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global Candidate:

- `games`: 72
- `illegalActions`: 0
- `replayFailures`: 0
- `timeoutRate`: 0
- `actionLimitRate`: 0.361
- `corpScores`: 64
- `runnerSteals`: 117

ICE-Ordering Candidate:

- `corpFutureRunIceInstallOpportunities`: 26
- `corpFutureRunIceInstalled`: 7
- `corpFutureRunIceInstalledAsDeadEffect`: 1
- `corpFutureRunIceInstalledAsLiveEffect`: 6
- `corpFutureRunIceInstalledOnEmptyServer`: 1
- `corpFutureRunIceInstalledAfterInnerIceExists`: 6
- `corpMultiIceInstallOrderFutureEffectDead`: 0
- `corpMultiIceInstallOrderOptimized`: 2
- `corpBallAndChainInstalledInnermost`: 1
- `corpBallAndChainInstalledWithoutLaterIce`: 1
- `corpBallAndChainInstalledWithLaterIce`: 6
- `corpCanisInstalledWithoutLaterIce`: 0
- `corpBolterOrDataDartsInstalledWithoutNextIce`: 0

Baseline zum Vergleich:

- `corpScores`: 55
- `runnerSteals`: 129
- `corpFutureRunIceInstallOpportunities`: 33
- `corpFutureRunIceInstalled`: 7
- `corpFutureRunIceInstalledAsDeadEffect`: 1
- `corpMultiIceInstallOrderFutureEffectDead`: 1
- `corpMultiIceInstallOrderOptimized`: 4

Interpretation: Der Candidate zeigt kein Safety-Signal und keine breite Under-Icing-Regression. Die Multi-ICE-Dead-Order fällt von 1 auf 0. Ein einzelnes `Ball and Chain`-Dead-Effect-Fenster bleibt im Real-Scene-Pair-1; das ist nach den Focus-Tests wahrscheinlich ein Emergency-/No-direct-alternative-Fall und kein belegter Multi-ICE-Reihenfolgefehler.

## Slotbefunde

- Safety Smoke: keine Future-ICE-Opportunities, keine Ordering-Signale.
- Snapshot Rig: keine Future-ICE-Opportunities, Safety grün.
- Snapshot Pressure: keine Future-ICE-Opportunities, Safety grün.
- Snapshot Holdout: keine Future-ICE-Opportunities, Safety grün.
- Local Pair 1: keine Future-ICE-Opportunities.
- Local Pair 2: keine Future-ICE-Opportunities.
- Real Scene Pair 1: 26 Opportunities, 7 Future-ICE-Installationen, 6 live, 1 dead, 2 optimierte Multi-ICE-Orders.
- Real Scene Pair 2: keine Future-ICE-Opportunities.

## Regressionsbewertung

- Corp installiert weiterhin ICE.
- First ICE auf leerem Remote bleibt mit Direct-Impact-ICE möglich.
- Future-ICE als einzige Schutzoption wird nicht verboten.
- Kein Anstieg von `illegalActions`, `replayFailures` oder `timeoutRate`.
- Candidate verbessert im 8-Slot-Lauf Corp Scores von 55 auf 64 und Runner Steals fallen von 129 auf 117; das ist diagnostisch positiv, aber keine Performanceinterpretation oder Profilpromotion.
- `corpAgendaInstalledInCheaplyContestableRemote` und `corpAdvanceInCheaplyContestableRemote` bleiben im ausgewerteten Lauf bei 0.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität und keine Änderung an `install_ice`-LegalActions.
- Keine Runner-Strategieänderung.
- Keine Profilumschaltung oder Profile-Promotion.
- Keine neuen Decks und keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster Schritt

Der konkrete Future-Encounter-Placement-Fehler ist eng gefixt. Als nächster praktischer Schritt bietet sich ein Corp Score Terminal Conversion Refresh an: Die ICE-Reihenfolge ist nun weniger naiv, aber die weiter offene Spielstärke-Frage bleibt, ob sichere Remotes konsequent in Agenda-Install, Advance und Score konvertieren.
