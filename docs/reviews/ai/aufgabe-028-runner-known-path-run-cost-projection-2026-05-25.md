# Aufgabe 028 - Runner Known-Path Run-Cost Projection Fix

## Kurzfazit

Der Fehler lag nicht in der Engine-Legalität, sondern in der AI-Bewertung sichtbarer Runpfade: `assessKnownRezzedIcePath` lieferte bisher nur einen aggregierten `blocked`-/`visibleBreakCost`-Wert. Die Bewertung hatte dadurch keine explizite Full-Path-Evidence dafür, dass ein Runner zwar das nächste ICE brechen kann, nach diesen Kosten aber ein späteres bekanntes ICE vor dem Access nicht mehr bezahlen kann.

Der Fix ergänzt eine sequentielle Full-Path-Quote mit Restcredits, `canReachAccess`, `canBreakNextIceButNotFullPath` und konkretem `unpayableReason`. Bekannte Kosten-No-Access-Runs werden im Runner-Plan stark abgewertet und in der Action-Priorität verdrängt. Es wurde keine Engine-Regel, LegalAction-Erzeugung, Hintquelle oder Profilumschaltung geändert.

## Screenshot-/Repro-Befund

Der gemeldete Fall entspricht einem sichtbaren Multi-ICE-Pfad: Der Runner kann ein äußeres bekanntes ICE isoliert bezahlen, verbraucht dabei aber Credits, sodass ein späteres bekanntes ICE vor dem Server nicht mehr bezahlbar ist. Genau diese sequentielle Restcredit-Perspektive ist jetzt testgedeckt.

Der Focus-Test verwendet einen äquivalenten bekannten Remote-Pfad mit äußerem Sentry und innerem Code Gate. Beide ICE sind isoliert bezahlbar; zusammen ist der Pfad bei 4 Credits nicht bis Access bezahlbar. Die Run-Action wird nicht als Remote-Contest gewählt, Economy wird stattdessen genommen.

## Audit

- Bisher wurde der Pfad über `assessKnownRezzedIcePath` in `packages/ai/src/visible-run-analysis.ts` über bekannte/rezzed ICE summiert.
- Die ICE-Reihenfolge wird korrekt von außen nach innen bewertet (`server.ice.slice().reverse()`; Engine startet am outermost Index `server.ice.length - 1`).
- Pump-/Breakkosten wurden zwar addiert, aber nicht als sequentielle Failure-Ursache ausgewiesen.
- Späteres ICE nach bereits gezahlten Kosten wurde nur indirekt über `visibleBreakCost > credits` sichtbar.
- First-Probe gegen unbekanntes oder unrezzed ICE bleibt nicht als sicherer No-Access-Pfad klassifiziert.
- Die alten Metriken `runsStartedAgainstKnownUnaffordablePath` bleiben breiter und enthalten auch Coverage-/Unbreakable-Fälle. Die neuen `runnerRunStartedAgainstKnownUnpayableFullPath`-Metriken zählen nur echte Kosten-No-Access-Fälle.

## Implementierter Fix

`assessKnownRezzedIcePath` gibt jetzt zusätzlich aus:

- `canReachAccess`
- `creditsAfterPath`
- `canBreakNextIceButNotFullPath`
- `unpayableIceIndex`
- `creditsSpentBeforeUnpayableIce`
- `unpayableReason`
- `assessedKnownIceCount`

`estimateRunCost` nutzt diese Full-Path-Quote. Echte bekannte Kosten-No-Access-Runs erhalten `known_full_path_no_access` und eine starke negative Bewertung. `actionPriority` drückt solche Run-Actions zusätzlich nach unten, damit sie innerhalb eines Run-Plans nicht gegenüber Economy/Setup durchrutschen.

## Guardrails

- Unbekanntes oder nur unrezzed ICE wird nicht als sicher unpassierbar behandelt.
- First-Probe-Fenster bleiben sichtbar: 329 `runnerRunAllowedAsFirstProbeUnknownIce` im 8-Slot-Candidate.
- Force-Rez-/Probe-Wert bleibt getrennt von Access-Run-Wert.
- Keine Hidden-Info-Felder, keine `CardInstances`, keine private Payloads in Evidence/Summary.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Engine-, Legalitäts-, Runtime-Compiled-Index- oder Planner-Profiländerung.

## Neue Metriken

Ergänzt wurden unter anderem:

- `runnerRunStartedAgainstKnownUnpayableFullPath`
- `runnerRunStartedAgainstKnownUnpayableRemotePath`
- `runnerRunStartedAgainstKnownUnpayableCentralPath`
- `runnerKnownPathCanReachAccessFalse`
- `runnerKnownPathCanBreakNextIceButNotFullPath`
- `runnerRunAbortedAfterKnownUnpayableLaterIce`
- `runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce`
- `runnerRunCostQuoteUnderestimatedFullPath`
- `runnerRepeatRunOnKnownUnpayablePath`
- `runnerRunAllowedAsFirstProbeUnknownIce`
- `runnerRunSuppressedAsKnownNoAccess`
- `runnerRunPenalizedAsKnownNoAccess`

## Tests

Ergänzt:

- Sequentielle Full-Path-Quote über äußeres Sentry plus inneres Code Gate.
- Remote-Repro: nächstes ICE isoliert bezahlbar, voller bekannter Pfad nicht bezahlbar, Run wird nicht gewählt.
- Summary-Aggregation der neuen Known-Path-Metriken.

Bestehende Backoff-, EffectiveRunQuote-, Hidden-Info- und sichtbare-ICE-Tests bleiben grün.

## 8-Slot Benchmark

Konfiguration:

- `runMatchProgressionBenchmarkSuite`
- `includeHoldout: true`
- `maxActions: 160`
- Baseline `belief_ai_v1_4_2`
- Candidate `current_candidate`
- 8 runnable Slots

Global Candidate:

- `illegalActions`: 0
- `replayFailures`: 0
- `timeoutRate`: 0
- `corpScores`: 63
- `runnerSteals`: 117
- `runsStartedAgainstKnownUnaffordablePath`: 10
- `runnerRunStartedAgainstKnownUnpayableFullPath`: 0
- `runnerRunStartedAgainstKnownUnpayableRemotePath`: 0
- `runnerRunStartedAgainstKnownUnpayableCentralPath`: 0
- `runnerKnownPathCanReachAccessFalse`: 0
- `runnerKnownPathCanBreakNextIceButNotFullPath`: 0
- `runnerRunAbortedAfterKnownUnpayableLaterIce`: 1
- `runnerRunAllowedAsFirstProbeUnknownIce`: 329
- `runnerRunSuppressedAsKnownNoAccess`: 393
- `runnerRunPenalizedAsKnownNoAccess`: 0

Interpretation: Der eng definierte bekannte Kosten-No-Access-Run tritt nach dem Fix im Candidate nicht mehr als gestarteter Run auf. Die breitere alte `runsStartedAgainstKnownUnaffordablePath`-Metrik bleibt bei 10, weil sie weiterhin Coverage-/Unbreakable-No-Access-Fälle mit `knownPathCost=0` einschließt; das ist nicht der hier behobene Kostenprojektionsfehler.

## Slotbefunde

- Safety Smoke: 0 neue Full-Path-Kosten-No-Access-Runs, 6 alte breite unaffordable-path Fälle, 46 suppressions, 60 erlaubte Probe-Runs.
- Local Pair 1: 0 Full-Path-Kosten-No-Access-Runs, 0 alte breite unaffordable-path Fälle.
- Local Pair 2: 0 Full-Path-Kosten-No-Access-Runs, 0 alte breite unaffordable-path Fälle.
- Snapshot Rig/Pressure/Holdout: 0 Full-Path-Kosten-No-Access-Runs.
- Real Scene Pair 2: 0 Full-Path-Kosten-No-Access-Runs, 4 alte breite unaffordable-path Fälle; diese sind Coverage-/No-breaker-diagnostisch, nicht Kostenprojektion.

## Bewusst Nicht Geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität und keine neue Action-Erzeugung.
- Keine Corp-Strategieänderung.
- Keine Profilumschaltung oder Profile-Promotion.
- Keine neuen Decks und keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index oder modularer Overlays.

## Nächster Schritt

Der konkrete Known-Path-Kostenfehler ist geschlossen. Die verbleibenden breiten `runsStartedAgainstKnownUnaffordablePath`-Fälle sind überwiegend Coverage-/Unbreakable-Pfade, nicht Kostenunterprojektion. Der nächste praktische Slice sollte deshalb wieder auf den stärkeren offenen Hebel aus Aufgabe 028 Attribution gehen: Search/Recovery- oder Memory-Setup-Fix, alternativ Corp Score Terminal Conversion Refresh.
