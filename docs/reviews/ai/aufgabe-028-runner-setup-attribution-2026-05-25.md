# Aufgabe 028 - Runner Setup Attribution + Fix-Gate Review

## Kurzfazit

Aufgabe-ID: Aufgabe 028.

Der Aufgabe-027-Slice wurde um Folgefenster-Attribution für Starved-Economy, Search/Recovery und Memory-/Hand-size-Setup erweitert. Es wurden keine Planner-Scores, keine LegalActions, keine Engine-Regeln, keine Profile und keine aktiven Hintdaten geändert.

Die 8-Slot-Diagnose dreht die Fix-Gate-Bewertung: Starved-Economy ist nach Attribution kein Fix-Kandidat mehr (`55` Fenster, `0` suspicious, `51` blockiert/plausibel). Die starken Kandidaten sind Search/Recovery (`120` Fenster, `95` suspicious) und Memory-Setup (`107` Fenster, `106` suspicious). Beide sind stark genug für einen engen Folgeschnitt; sie liegen aber so nah beieinander, dass der nächste Schritt kein breiter Setup-Boost sein sollte, sondern ein enger Fix-Design-Slice mit Search/Recovery-vs-Memory-Priorisierung.

## Bezug zu Aufgabe 026/027

Aufgabe 026 hat die mechanischen Runner-Economy-/Resource-/Hardware-/Hand-size-/Search-Recovery-Facts read-only stabilisiert. Aufgabe 027 hat daraus Decision-Window-Diagnosen im AI-/Benchmark-Pfad gebaut. Aufgabe 028 nutzt dieselben side-sicheren Action-Trace-Daten und wertet Folgefenster aus:

- nächste Runner-Decision,
- nächste Runner-Runs,
- Install-Followup,
- Coverage-Improvement,
- Memory-Install-Followup,
- No-Progress innerhalb kurzer Folgefenster.

Der Compiled Index bleibt nicht in der Runtime genutzt; die aktiven Hints bleiben unverändert.

## Audit der vorhandenen Metriken

Aufgabe 027 setzt die Decision-Window-Metriken in `runnerEconomySetupDiagnosticsForSimulationAction` in `packages/ai/src/index.ts`. Dort werden legale Economy-, Search-, Recovery-, Memory- und Hand-size-Kandidaten aus vorhandenen `LegalActions`, sichtbaren Rollen/Karten und sichtbarem Boardkontext klassifiziert.

Decision-window-basiert sind unter anderem:

- `runnerEconomyDecisionWindow`
- `runnerEconomyTaken` / `runnerEconomySkipped`
- `runnerCreditStarvedWithLegalEconomy`
- `runnerEconomyFixGateEligibleStarvedSkip`
- `runnerSetupFixGateEligibleSearchRecoverySkip`
- `runnerSetupFixGateEligibleMemorySkip`

Actionbasiert bleiben unter anderem:

- `runnerEconomyActionTaken`
- `runnerDrawAction`
- `runnerRigInstallAction`
- `runnerSearchTaken`
- `runnerRecoveryTaken`
- `runnerMemoryHardwareTaken`
- `runnerHandSizeSupportTaken`

Für Aufgabe 028 reichen die Aufgabe-027-FixGate-Zähler als Eingangssignal, aber nicht als Fix-Begründung. Deshalb ergänzt Aufgabe 028 die Attribution über `summarizeRunnerSetupAttributionMetrics`: gewählte Action-Familie, Blocker/Plausibility und Folgefenster.

Verfügbare Chosen-Action-Daten:

- Action type,
- target server,
- reasonCode und Evidence,
- Runner-Credits/Reserve,
- known path cost / missing credits,
- vorhandene 027-Flags für Economy/Search/Recovery/Memory,
- side-safe Coverage-Typen (`wall`, `code_gate`, `sentry`, `universal`, `special`).

Fehlende Informationen:

- kein konkretes Hidden-Zone-Suchziel,
- keine verdeckten Grip-/Stack-/HQ-/R&D-Kartenidentitäten,
- keine echte Aussage, welches konkrete Suchziel im Stack/Heap vorhanden wäre,
- kein aktiver Planlabel-Consumer für Fixes.

## Neue Attribution-Metriken

Starved Economy:

- `runnerStarvedEconomySkipWindows`
- Chosen-Familien: Run, Draw, Install, SearchRecovery, Trash, EndTurn, Unknown
- Folgefenster: unaffordable run, failed run, no progress, economy next decision, reserve recovered, progress, action limit
- Plausibility/Suspicious: pressure, remote contest, critical setup, trash, low-value run, draw, end turn, unknown
- FixGate: eligible, blocked, suspicious

Search/Recovery:

- `runnerSearchRecoveryFixGateWindows`
- Legal Search/Recovery
- Missing Coverage: wall, code gate, sentry, universal, special
- Chosen-Familien: Economy, Run, Draw, Install, Trash, EndTurn, Unknown
- Folgefenster: install followup, coverage resolved, coverage still missing, known unaffordable run, no progress
- FixGate: eligible, blocked, suspicious

Memory/Hand-size:

- `runnerMemoryFixGateWindows`
- `runnerHandSizeFixGateWindows`
- legal support / skipped support
- chosen family
- Folgefenster: memory installed, program install blocked, coverage still missing, no progress
- Hand-size: visible damage/discard pressure window, later discard/damage pressure
- FixGate: eligible, blocked, suspicious

Kombiniert:

- `runnerSetupAttributionWindows`
- `runnerSetupAttributionSuspicious`
- `runnerSetupAttributionBlocked`
- `runnerSetupAttributionUnclassified`
- `runnerSetupAttributionByKind*`
- `runnerSetupRecommendedFixKind*`

## Starved-Economy-Befund

Global Candidate:

- Starved-Economy-Skip-Windows: `55`.
- Danach unaffordable run: `0`.
- Danach failed/low-value run: `3`.
- Danach no progress: `23`.
- Danach Economy next decision: `4`.
- Danach Progress: `32`.
- Attribution blocked/plausible: `51`.
- Attribution suspicious: `0`.

Interpretation: Das Aufgabe-027-Signal war real, aber nach Folgefenster-Attribution nicht stark genug für einen Economy-Starved-Fix. Die meisten Fenster werden durch Pressure/Remote-Contest/Setup-Kontext oder späteren Fortschritt entschärft.

## Search/Recovery-Befund

Global Candidate:

- Search/Recovery-FixGate-Windows: `120`.
- Missing Wall: `33`.
- Missing Code Gate: `57`.
- Missing Sentry: `20`.
- Missing Universal/Special: `0` / `0`.
- Install-Followup: `29`.
- Coverage resolved: `5`.
- Coverage still missing: `115`.
- No progress: `29`.
- Attribution blocked/plausible: `98`.
- Attribution suspicious: `95`.

Interpretation: Search/Recovery ist ein echter Fix-Kandidat. Dass viele Fenster zugleich als blockiert zählen, ist plausibel, weil Economy/Pressure/Remote-Contest teils berechtigt ist; trotzdem bleibt Coverage in `115` von `120` Fenstern kurzfristig ungelöst und `95` Fenster bleiben suspicious.

## Memory-/Hand-size-Befund

Global Candidate:

- Memory-FixGate-Windows: `107`.
- Hand-size-FixGate-Windows: `4`.
- Memory installed after skip: `8`.
- Program install blocked: `99`.
- Coverage still missing: `36`.
- No progress: `30`.
- Attribution blocked/plausible: `83`.
- Attribution suspicious: `106`.

Interpretation: Memory-Setup ist der stärkste Einzelkandidat. Das Signal ist sauberer als Economy-Starved: fast alle Memory-FixGate-Fenster bleiben suspicious, weil Memory nicht kurzfristig installiert wird und Programminstall-/Coverage-Fortschritt blockiert bleibt. MRAM/Militech bleiben Hand-size und werden nicht als Memory-Support gezählt.

Hand-size ist nicht stark genug für einen Fix: nur `4` Candidate-Fenster global.

## Focus-Tests

Ergänzt in `packages/ai/src/index.test.ts`:

- Starved Economy Skip -> chosen unaffordable/low-value run -> suspicious und attribution eligible.
- Starved Economy Skip -> remote contest -> blocked/plausible.
- Starved Economy Skip -> Economy next decision / reserve recovered -> nicht automatisch suspicious.
- Search/Recovery legal + missing wall/code gate/sentry + coverage still missing -> suspicious.
- Search/Recovery mit install/coverage followup -> nicht automatisch suspicious.
- Memory legal support skipped -> program install blocked -> suspicious.
- MRAM/Militech bleiben Hand-size, nicht Memory, über bestehende Aufgabe-027-Tests.
- Hand-size visible damage/discard pressure -> Hand-size-Kontext.
- Hidden-State-Invarianz und Sanitizer: keine Hidden-Zone-Identitäten, keine `CardInstances`, keine private Payloads.

## 8-Slot Diagnoseergebnis

Konfiguration: `runMatchProgressionBenchmarkSuite`, `includeHoldout: true`, `maxActions: 160`, 8 runnable Slots, Baseline `belief_ai_v1_4_2`, Candidate `current_candidate`.

Global Candidate:

- Safety: `illegalActions 0`, `replayFailures 0`, `timeoutRate 0`.
- ActionLimit-Summe: `2.777`.
- Corp Scores: `63`.
- Runner Steals: `117`.
- Setup Attribution Windows: `286`.
- Suspicious: `201`.
- Blocked/plausible: `232`.
- Unclassified: `0`.
- Recommended kind by slot: Search/Recovery `4`, Memory `4`.

## Slot-Ergebnisse

Smoke:

- Starved `1`, suspicious `0`.
- Search/Recovery `0`.
- Memory `39`, suspicious `39`.
- Empfehlung: Memory-Setup.

Snapshot Rig:

- Starved `6`, suspicious `0`.
- Search/Recovery `0`.
- Memory `2`, suspicious `2`.
- Empfehlung: Memory-Setup.

Snapshot Pressure:

- Starved `11`, suspicious `0`.
- Search/Recovery `0`.
- Memory `19`, suspicious `19`.
- Empfehlung: Memory-Setup.

Snapshot Holdout:

- Starved `28`, suspicious `0`.
- Search/Recovery `0`.
- Memory `9`, suspicious `8`.
- Empfehlung: Memory-Setup.

Local Pair 1:

- Starved `0`.
- Search/Recovery `33`, suspicious `26`.
- Memory `6`, suspicious `6`.
- Empfehlung: Search/Recovery.

Local Pair 2:

- Starved `1`, suspicious `0`.
- Search/Recovery `2`, suspicious `2`.
- Memory `0`.
- Empfehlung: Search/Recovery.

Real Scene Pair 1:

- Starved `5`, suspicious `0`.
- Search/Recovery `58`, suspicious `44`.
- Memory `25`, suspicious `25`.
- Empfehlung: Search/Recovery.

Real Scene Pair 2:

- Starved `3`, suspicious `0`.
- Search/Recovery `27`, suspicious `23`.
- Memory `7`, suspicious `7`.
- Hand-size `4`.
- Empfehlung: Search/Recovery.

## FixGate-Auswertung

Kein Economy-Starved-Fix:

- `55` Fenster bleiben sichtbar, aber `0` attribution-suspicious.
- Kein wiederholtes Muster "Economy skipped -> unaffordable run".

Search/Recovery-Fix ist gerechtfertigt, aber eng:

- `120` Fenster, `95` suspicious.
- Coverage bleibt in `115` Fenstern kurzfristig ungelöst.
- Dominante Coverage: Code Gate `57`, Wall `33`, Sentry `20`.
- Besonders stark in Local Pair 1, Local Pair 2, Real Scene Pair 1 und Real Scene Pair 2.

Memory-Fix ist ebenfalls gerechtfertigt, aber eng:

- `107` Fenster, `106` suspicious.
- Programminstall bleibt in `99` Fenstern blockiert.
- Besonders stark in Smoke und Snapshot Rig/Pressure/Holdout.

Hand-size-Fix nicht gerechtfertigt:

- Nur `4` Candidate-Fenster global.

## Entscheidung

B. Enger Runner Economy Starved-Skip-Fix: nein.

C. Enger Search/Recovery-Fix: ja, als einer der zwei stärksten Kandidaten.

D. Enger Memory-Fix: ja, ebenfalls stark belegt.

E. Hand-size-/Survival-Fix: nein.

F. Weitere Diagnose nötig: nur für Priorisierung zwischen Search/Recovery und Memory. Beide Kandidaten sind stark; die sauberste nächste Aufgabe ist ein enger Fix-Design-Slice, der entscheidet, ob Aufgabe 029 Search/Recovery zuerst oder Memory zuerst schneidet. Kein breiter Runner-Setup-Boost.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine neue Legalität.
- Keine Action-Score-, Planner-, PlanWeight- oder Strategic-Line-Änderung.
- Keine Profilumschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine aktive Hintmigration.

## Nächster praktischer Schritt

Aufgabe 029 sollte ein enger Fix-Design-Slice werden, nicht noch eine breite Diagnose. Empfehlung:

1. Search/Recovery-vs-Memory-Priorisierung ausformulieren.
2. Einen minimalen Fixpfad wählen:
   - Search/Recovery, wenn missing coverage + legal search/recovery + no install/coverage followup dominiert.
   - Memory, wenn program install blocked + memory support legal + no memory install dominiert.
3. Erst danach einen kleinen Strategy-Slice implementieren.

Wenn kein enger Fix risikofrei geschnitten werden soll, ist der alternative nächste Hebel `Corp Score Terminal Conversion Refresh`.
