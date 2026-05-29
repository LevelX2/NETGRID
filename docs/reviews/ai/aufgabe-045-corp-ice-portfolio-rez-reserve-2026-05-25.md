# Aufgabe 045 - Corp ICE Portfolio / Rez-Reserve

## Kurzfazit

Aufgabe 045 schließt den Live-Befund "zu viel HQ/R&D-ICE bei zu wenig Rez-Reserve" mit einem engen Corp-Planer-Fix und neuen First-Class-Metriken. Der Fehler war eine Kombination aus Over-Icing, Rez-Reserve und Serverpriorisierung: zusätzliche Central-ICE-Installationen hatten bisher zu wenig Grenznutzenkosten, während Economy, Remote-/Score-Aufbau und Agenda-Exit nicht hart genug gegen das 4. oder 5. HQ/R&D-ICE abgewogen wurden.

Der Fix ändert keine Engine-Regel, keine LegalAction-Erzeugung, kein Profil/Default und keine Hintdaten. Die KI wählt weiter nur bereits legale Actions.

## Live-Befund

Der Screenshot-Befund war: HQ wird teils mit 4 bis 5 ICE geschützt, R&D ebenfalls beicet, aber die Corp hat zu wenige Credits, um die vorhandenen ICE realistisch zu rezzen. Dadurch entsteht scheinbarer Schutz ohne bezahlbare Schutzwirkung; gleichzeitig fehlt der Remote-/Agenda-/Score-Plan.

## Audit der bisherigen Bewertung

- `install_ice` wurde in `packages/ai/src/corp-plans.ts` über Planarten `protect_hq`, `protect_rnd` und `build_scoring_remote` bewertet; die finale Action-Reihenfolge läuft über `actionPriority`.
- HQ/R&D wurden über `evaluateServerThreat`, Central-Run-Memory und `evaluateCorpHqAgendaDensity` bevorzugt, Remotes über Remote-Safety, Remote-Portfolio, Score-Horizon und Rez-Reserve.
- Grenznutzen für spätes ICE war nur indirekt vorhanden. Remote-Portfolio hatte Disziplin, Central-ICE aber keinen eigenen Portfolio-/Diminishing-Return-Guard.
- Rezzed/unrezzed wurde an mehreren Stellen gezählt, aber nicht als zentrale Budgetdiagnose für HQ/R&D gegen weitere Central-Installationen verwendet.
- Eigene Corp-Information über eigene HQ-Karten und unrezzed ICE-Rez-Kosten darf verwendet werden; bisher fehlte die side-safe Zusammenfassung als Portfolio-Evidence.
- HQ-Agenda-Flood wurde bereits erkannt, aber nicht mit Central-Over-Ice-FixGates verbunden.
- R&D-Druck wurde über Central-Memory und sichtbare Runner-Rollen erkannt, aber nicht als expliziter Blocker gegen einen pauschalen Over-Ice-Malus geführt.
- Remote-/Agenda-/Score-Plan wurde nicht eng genug gegen zusätzliche Central-ICE-Installationen gewichtet.

## Neue Metriken

Ergänzt wurden Corp-ICE-Portfolio-/Rez-Reserve-Metriken in `AiMatchProgressionMetrics` und in der Action-Trace-Diagnostik:

- Central Portfolio: `corpHqIceCount`, `corpRndIceCount`, `corpArchivesIceCount`, `corpRemoteIceCount`, `corpHqUnrezzedIceCount`, `corpRndUnrezzedIceCount`, `corpCentralIceCount`, `corpCentralUnrezzedIceCount`, Install-Zähler für HQ/R&D/Archives/Remote/Central.
- Overprotection: `corpHqOverIced`, `corpRndOverIced`, `corpCentralOverIced`, `corpCentralOverIcedWithoutPressure`, `corpCentralOverIcedWithLowRezReserve`, `corpHqFifthIceInstalled`, Diminishing-Return-Suppressed/Penalized.
- Rez Reserve: `corpRezReserveCredits`, `corpRezReserveDeficit`, `corpInstalledIceWithoutRezReserve`, `corpInstalledCentralIceWithoutRezReserve`, `corpInstalledRemoteIceWithoutRezReserve`, `corpCanRezAtLeastOneCentralIce`, `corpCanRezAtLeastOneRemoteIce`, `corpCannotRezAnyNewlyInstalledIce`, Rez-Credit-Defizit-Klassen.
- Pressure / Justification: Agenda-Flood, HQ-/R&D-Pressure und No-Remote-Plan-Blocker.
- Remote / Score Balance und FixGate: Underbuilt-Remote, Agenda-in-HQ, extra Central-ICE-over-Economy/Agenda/Advance/Score sowie `corpIcePortfolioFixGate*`.

Die Evidence ist side-safe: sie enthält Serverklasse, Action-Familie, Counts, Credit-/Defizitwerte, Pressure-/Flood-Klassen und legale Alternativfamilien, aber keine privaten unrezzed Card-IDs/Titles, keine Runner-Hidden-Zonen, keine `CardInstances`, keine `fullGameState` und keine privaten Payloads.

## Implementierter Fix

Der neue Evaluator `evaluateCorpCentralIcePortfolio` nutzt `assessCorpIcePortfolioAction`:

- Zusätzliches HQ/R&D-ICE wird stark abgewertet, wenn der Zielserver bereits 3+ ICE hat, ein hoher Anteil unrezzed ist, die Rez-Reserve knapp ist und kein sichtbarer Central-Pressure-/Agenda-Flood-/Emergency-Blocker greift.
- Economy/Rez-Reserve und Remote-/Score-Linien bekommen Score- und Priority-Boni, wenn sie eine suspicious zusätzliche Central-ICE-Installation ersetzen.
- HQ-Agenda-Flood, wiederholter HQ-Druck, sichtbarer R&D-Multiaccess-Druck und offene/kaum geschützte Centrals blockieren den Malus.
- Remote-ICE bleibt separat behandelt und wird durch diesen Central-Guard nicht pauschal abgewertet.

## Focus-Tests

Ergänzt in `packages/ai/src/index.test.ts`:

- 4 unrezzed HQ-ICE, Low Reserve, kein HQ-Druck: fünftes HQ-ICE wird nicht gewählt; Economy gewinnt; `corpCentralOverIcedWithLowRezReserve` erscheint.
- HQ-Agenda-Flood: weiteres HQ-ICE bleibt auswählbar; FixGate wird durch Agenda-Flood blockiert.
- R&D Interface Pressure: R&D-ICE bleibt auswählbar; kein pauschaler R&D-Malus.
- Remote unterbaut, Centrals overiced, Agenda in HQ: weiteres HQ-ICE verliert gegen Remote-/Reserve-Plan.
- Rez-Reserve-Defizit: Economy-Plan scoret höher als extra Central-ICE.
- Emergency Central Protection: offenes HQ mit Druck bleibt legal und sinnvoll.
- Remote-ICE mit Scoreplan wird nicht over-penalized.
- Hidden-State-/DTO-Sanitizer-Test: Runner-Hidden-Zonen ändern die Entscheidung nicht; Portfolio-Evidence bleibt sanitized.

## 8-Slot Benchmark

Konfiguration: `runMatchProgressionBenchmarkSuite({ includeHoldout: true, maxActions: 160, baselineProfile: "belief_ai_v1_4_2", candidateProfile: "current_candidate" })`. Temporärer Vitest-Harness wurde nach dem Lauf gelöscht.

Aggregat über 8 runnable Slots:

| Metrik                       | Baseline | Candidate |  Delta |
| ---------------------------- | -------: | --------: | -----: |
| illegalActions               |       15 |        15 |      0 |
| replayFailures               |        0 |         0 |      0 |
| timeoutRate                  |        0 |         0 |      0 |
| ActionLimitRate Summe        |    3.890 |     4.112 | +0.222 |
| Corp Scores                  |       49 |        55 |     +6 |
| Runner Steals                |      123 |       114 |     -9 |
| Score+Steal total            |      172 |       169 |     -3 |
| ScoreActions Available/Taken |    49/49 |     55/55 |  +6/+6 |
| Central ICE installs         |      254 |       250 |     -4 |
| HQ ICE installs              |      152 |       141 |    -11 |
| R&D ICE installs             |      102 |       109 |     +7 |
| Remote ICE installs          |      120 |       132 |    +12 |
| Central Over-Ice windows     |      584 |       394 |   -190 |
| Central Over-Ice mit Low Rez |      544 |       346 |   -198 |
| Central ICE ohne Rez-Reserve |      159 |       154 |     -5 |
| Slot-Max-Defizit-Summe       |       68 |        63 |     -5 |

Slotbefunde:

- Smoke: Corp Scores +3, Central Over-Ice -36, Low-Rez-Over-Ice -49.
- Local Pair 1: Central ICE -4, HQ ICE -4, Central Over-Ice -44, Runner Steals -1.
- Local Pair 2: Remote ICE +5, Central ICE -4, Corp Scores +3, ActionLimit +0.111.
- Snapshot Holdout: Corp Scores -3, Runner Steals +1, aber Central Over-Ice -41.
- Real Scene Pair 1: ActionLimit +0.222, Corp Scores -1, Runner Steals -2, Central Over-Ice -29.
- Real Scene Pair 2: beide Profile bleiben ActionLimit 1.000; Candidate verbessert Rez-Defizit und Central-without-reserve, Runner Steals +1.

Die Suite zeigt keine suspicious `corpIcePortfolioFixGateSuspiciousCentralOverIce`-Fenster; die neuen Focus-Fixtures decken den eigentlichen FixGate ab. In den realen Slots sind viele Over-Ice-Fenster durch No-Remote-Plan, Pressure oder andere Planlagen klassifiziert. Die Portfolio-Metriken sind trotzdem nützlich, weil der Candidate aggregiert weniger HQ/Central-Over-Ice und mehr Remote-ICE zeigt.

## Guardrails

- Known-unbreakable Remote/Central und known-unpayable Full-Path bleiben in allen Slots bei 0.
- First-probe unknown ICE bleibt erlaubt.
- ReplayFailures und Timeouts bleiben 0.
- `illegalActions` steht in Local Pair 2 und Real Scene Pair 2 bei beiden Profilen identisch ungleich 0; Delta ist 0 und kein Aufgabe-045-spezifisches Signal.
- Future-run-ICE-Dead-Effect bleibt unverändert; Real Scene Pair 1 hat 1/1 bei Baseline/Candidate.
- Tag/Punish wurde nicht geändert; keine neue Profil-/Default-Wirkung.

## Bewusst nicht geändert

- Keine Engine-Regeländerung.
- Keine LegalAction-Änderung.
- Keine Profil-/Default-Umschaltung.
- Keine neuen Decks.
- Keine Holdout-Optimierung.
- Keine Änderung an `aiSupportStatus`.
- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine manuelle Hintmigration.
- Keine Proteus-/Catalog-Baseline-Korrektur.

## Checks

Grün:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-derived-facts-full`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-manual-overlays`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/catalog exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git diff --cached --check`
- 8-Slot-Benchmark-Harness mit erhöhtem Testtimeout

Generated-Fact-Batch-Checks 1 bis 12 wurden nicht zusätzlich ausgeführt, weil keine Generated-Fact-Reports oder -Tests drifteten.

## Bekannte Grenzen

- Der Fix ist bewusst eng. Er verhindert nicht pauschal 4+ ICE auf HQ/R&D; legitime Pressure-/Flood-/Emergency-Fälle bleiben möglich.
- Die Benchmark-Suite zeigt weiterhin hohe ActionLimit-Werte in einzelnen Holdouts. Aufgabe 045 löst nicht das generelle Makroplanungsproblem.
- `corpIcePortfolioFixGateSuspiciousCentralOverIce` triggert in der 8-Slot-Suite nicht; die Focus-Tests sichern den konkreten Live-Fehler.
- Die aggregierte `corpRezReserveDeficit`-Auswertung ist aktuell eine Summary-Kennzahl, kein vollständiges mehrzügiges Rez-Budget-Modell.

## Nächster praktischer Schritt

Nächster sinnvoller Slice: konkrete Trace-Sampling-Auswertung der verbleibenden Central-Over-Ice-with-Low-Rez-Fenster aus Snapshot Holdout, Local Pair 2 und Real Scene Pair 1, getrennt nach No-Remote-Plan, echter Pressure und fehlender mehrzügiger Remote-/Agenda-Planung.
