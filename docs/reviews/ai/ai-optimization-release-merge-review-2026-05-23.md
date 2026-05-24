# AI Optimization Release-/Merge-Review 2026-05-23

Status: Release-/Merge-Review, keine neue KI-Strategie
Workspace: `C:\Projekte\NETGRID-ai-optimization-diagnosis`
Branch: `codex/ai-legal-action-diagnosis`
Vergleichsbasis: `belief_ai_v1_4_2` gegen `current_candidate`

## Kurzfazit

Der Branch enthält mehrere Änderungen, die unabhängig von Spielstärke mergewürdig sind: LegalAction-/Seitenauflösung, sichtbare Effective-Run-Quote, side-safe `unbrokenRunEffect`, AIInput-/DTO-Sanitizing, Hidden-State-/DTO-Safety-Tests und die neue Match-Progression-Deck-Suite.

`current_candidate` sollte `belief_ai_v1_4_2` jetzt nicht als Default ersetzen. Der Candidate ist sicherer erklärbar und gegen Basic-Profile kontrollierter, aber im aktuellen `maxActions: 160`-Vergleich nicht durchgehend stärker. Er gewinnt Runner-Steals in mehreren Slots und verbessert einzelne No-Progress-Werte, verliert aber im Snapshot-Holdout deutlich Corp-Scores und verschlechtert in Local Pair 1 die strategische Stagnation.

Empfehlung: **Option C**. Technische Fixes, Safety-/DTO-Arbeit, Benchmark-/Diagnosebasis und Datencontracts nach `main` übernehmen. Strategie-Slices nur als experimentelles `current_candidate`-Profil mergen, nicht als aktives/default Profil. Eine Default-Aktivierung braucht einen separaten Profilentscheid nach stabileren Score-/Steal- und ActionLimit-Gates.

## Merge-Empfehlung

| Option                                                                                    | Bewertung                                                                                                                                         | Empfehlung                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A: Alles mergen, `current_candidate` nicht aktivieren                                     | Technisch möglich, wenn alle Strategieänderungen streng im Candidate-Profil bleiben. Risiko: viel Heuristikcode in `main`, ohne Default-Freigabe. | Akzeptabel, aber nicht bevorzugt.                                       |
| B: Nur Infrastruktur, Benchmark, DTO-/Engine-/Safety und Datencontracts mergen            | Risikoarm. Nachteil: aufwendig zu splitten, weil Diagnosemetriken und Candidate-Slices inzwischen eng in denselben Dateien liegen.                | Fachlich sauber, praktisch nur bei Cherry-pick-/Split-Aufwand sinnvoll. |
| C: Infrastruktur vollständig mergen, Strategie-Slices als experimentelles Profil behalten | Nutzt die sichere Basis und die Diagnosearbeit, ohne `current_candidate` zur Produkt-KI zu erklären.                                              | **Empfohlen.**                                                          |

Praktische Reihenfolge:

1. Technische/Safety-Fixes: LegalAction-Seitenauswahl, Effective-Run-Quote, `unbrokenRunEffect`, DTO-/Hidden-Info-Tests.
2. Benchmark-/Diagnosebasis: Match-Progression-Deck-Suite, Snapshot-Adapter, Frozen Holdouts, Metriken, Reports.
3. Daten-/Contract-Arbeit: AI-Hints-/Support-Contract, Toughonium-Wall-Entscheidung und sichere Hint-Schärfungen.
4. Strategie-Slices: nur als `current_candidate`/experimentell, keine Default-Aktivierung.
5. Profilaktivierung separat entscheiden, wenn Benchmarks einen klaren Vorteil zeigen.

## Profilentscheidung

Antwort: **Nein, `current_candidate` soll jetzt nicht Default werden.**

Begründung:

- Safety ist stabil: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0` in allen aktuellen Candidate-Slots.
- Candidate ist erklärbarer und gegen Basic-Profile kontrollierter.
- Gegen `belief_ai_v1_4_2` ist die Spielstärke nicht eindeutig besser:
  - Smoke: gleiche Steals/Scores, aber höhere ActionLimitRate.
  - Snapshot Rig: mehr Runner-Steals, weniger Corp-Scores.
  - Snapshot Pressure: mehr Runner-Steals bei gleichen Corp-Scores, aber höhere ActionLimitRate.
  - Snapshot Holdout: mehr Runner-Steals, aber Corp-Scores fallen stark.
  - Local Pair 1: mehr Runner-Steals, gleiche Corp-Scores, aber deutlich schlechtere strategische Stagnation.
  - Local Pair 2: ActionLimit besser, Runner-Steals leicht besser, Corp-Scores leicht schlechter.
- Das Hauptproblem ActionLimit/Stagnation ist nicht gelöst.

## Änderungsklassifikation

### A. Must-Merge Infrastruktur/Fixes

| Änderung                                                                                  | Empfehlung | Grund                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| AI-Simulation/Server-Side-Resolver für activeSide-vs-LegalActions                         | Mergen     | Behebt ein echtes Timing-/LegalAction-Problem ohne Strategiegewichtung.                              |
| Effective-Run-Quote aus `main`                                                            | Mergen     | Side-safe Engine-Projektion sichtbarer effektiver ICE-/Run-Kosten; keine kartenspezifische KI-Logik. |
| `VisibleEffectiveSubroutine.unbrokenRunEffect`                                            | Mergen     | Schließt echte Bewertungslücke für Tutor-/Virizz-artige sichtbare Run-Dauer-/Folgeeffekte.           |
| AIInput-/DTO-Sanitizing für Effective-Quote und Unbroken-Effect                           | Mergen     | Wichtiges Hidden-Info-Gate; keine privaten Root-Karten, kein `FullState`, keine `privatePayloads`.   |
| Hidden-State-/DTO-Safety-Tests                                                            | Mergen     | Harte Regression gegen Leaks und Hidden-State-abhängige Entscheidungen.                              |
| kleiner Corp-Advance-Schutz: last-click final advance nicht als same-turn Score behandeln | Mergen     | Enge generische Korrektur für Score-Window-Erhalt; kein Deck- oder Karten-Hardcoding.                |

### B. Benchmark-/Diagnose-Infrastruktur

| Änderung                                                                                | Empfehlung | Grund                                                                                                   |
| --------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Match-Progression-Deck-Suite                                                            | Mergen     | Beste aktuelle Messbasis für Smoke, Snapshot-Tuning, Snapshot-Holdout und lokale realistische Holdouts. |
| Snapshot-Deck-Adapter und Frozen Local-Realistic Holdouts                               | Mergen     | Verhindert Demo-Fallback und trennt Tuning von Holdout-Signalen.                                        |
| Progression-, Conversion-, Outcome-, Reserve-, Remote-, Central- und Planfolge-Metriken | Mergen     | Diagnostisch wertvoll, aber nicht als harte Spielstärke-Beweise missverstehen.                          |
| Reviews unter `docs/reviews/ai/`                                                        | Mergen     | Evidence und Entscheidungsgrundlage für spätere Profilfreigabe.                                         |

Diese Gruppe ist mergewürdig, aber sie aktiviert kein Spielstärkeprofil.

### C. Daten-/Contract-Verbesserungen

| Änderung                           | Empfehlung                       | Grund                                                                                        |
| ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| AI-Hints-/Support-Contract         | Mergen                           | Stabilisiert `ai_supported` und die Erwartung an Kartenrollen unabhängig vom aktiven Profil. |
| Toughonium-Wall-Entscheidung       | Mergen                           | Konkrete Contract-Entscheidung; kein Heuristik-Overfit.                                      |
| fokussierte AI-Hint-Qualitätsrunde | Mergen, falls Tests grün bleiben | Sinnvoll als Datenqualität; Wirkung nicht als Candidate-Stärke verkaufen.                    |

### D. Strategie-/Profiländerungen

| Slice                                             | Bewertung                                                                          | Merge-Entscheidung                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Corp Remote-Advance-/Score-Horizont               | Klar positiv als Grundlage, aber noch balance-sensibel.                            | In `current_candidate` behalten; Default später entscheiden. |
| Corp Score-Conversion-Diagnose                    | Primär Diagnose.                                                                   | Mergen.                                                      |
| Corp Remote-Protection / Contest-Risk             | Fachlich sinnvoll, kann Scores verzögern.                                          | Experimentell behalten; nicht separat defaulten.             |
| Runner Draw-/Hand-/Duplicate-Discipline           | Einer der klareren Runner-Gewinne.                                                 | Übernahme plausibel; bevorzugt weiter im Candidate-Profil.   |
| Runner Remote-Trash-/Opportunity-Diagnose         | Primär Messkorrektur.                                                              | Mergen.                                                      |
| Runner Economy Reserve / Known-Path-Affordability | Sinnvoll, aber Passivitätsrisiko.                                                  | Experimentell behalten.                                      |
| Runner Remote-Contest Targeting                   | Holdout-seitig stark, aber Fensterzähler bleiben erklärungsbedürftig.              | Experimentell behalten.                                      |
| Runner Central Pressure / Closeout / No-Fresh     | Erhöht Erklärbarkeit; Spielstärke gemischt.                                        | Nicht defaulten.                                             |
| Plan-Continuation / Plan-Abort                    | Gute Diagnose-/Planfolge-Struktur, keine klare Gesamtstärke.                       | Experimentell behalten.                                      |
| Outcome Follow-up / Outcome-Gating                | Gemischt; macht Candidate erklärbarer, aber Snapshot-Holdout verliert Corp-Scores. | Nicht defaulten; weiter gated.                               |
| kleiner Corp-Advance-Schutz                       | Enge Korrektur, kein breiter Strategiewechsel.                                     | Mergen.                                                      |

Nicht mergen würde ich nur eine **Default-Aktivierung** von `current_candidate` und jede ungegatete Übernahme gemischter Slices in das bisherige aktive Profil. Keine der geprüften Dateien sollte wegen Spielstärke komplett verworfen werden, solange `current_candidate` experimentell bleibt.

## Benchmark-Zusammenfassung

Aktueller Entscheidungsbenchmark: Match-Progression-Deck-Suite mit `maxActions: 160`. Diese Werte sind nur innerhalb dieses Laufs gegen die Baseline zu vergleichen, nicht absolut gegen ältere `maxActions: 80`-Reports.

| Slot              | Profil              |   ALR | Runner Steals | Corp Scores | Score/Steal pro Match | Strategic Longest No-Progress | Same Strategic Repeat | Converted <=3 own decisions | Remote Advances | Remote Trash | Score Windows Taken | Safety |
| ----------------- | ------------------- | ----: | ------------: | ----------: | --------------------: | ----------------------------: | --------------------: | --------------------------: | --------------: | -----------: | ------------------: | ------ |
| Smoke             | `belief_ai_v1_4_2`  | 0.556 |            17 |           9 |                 2.889 |                            25 |                    62 |                         461 |              44 |            3 |                 9/9 | 0/0/0  |
| Smoke             | `current_candidate` | 0.667 |            17 |           9 |                 2.889 |                            19 |                    56 |                         479 |              46 |            3 |                 9/9 | 0/0/0  |
| Snapshot Rig      | `belief_ai_v1_4_2`  | 0.333 |            27 |          11 |                 4.222 |                            44 |                    46 |                         396 |              51 |            0 |               11/11 | 0/0/0  |
| Snapshot Rig      | `current_candidate` | 0.333 |            30 |           9 |                 4.333 |                            43 |                    41 |                         350 |              47 |            0 |                 9/9 | 0/0/0  |
| Snapshot Pressure | `belief_ai_v1_4_2`  | 0.111 |            24 |          11 |                 3.889 |                            38 |                    50 |                         415 |              54 |            1 |               11/11 | 0/0/0  |
| Snapshot Pressure | `current_candidate` | 0.222 |            28 |          11 |                 4.333 |                            36 |                    45 |                         426 |              50 |            0 |               11/11 | 0/0/0  |
| Snapshot Holdout  | `belief_ai_v1_4_2`  | 0.667 |            25 |           6 |                 3.444 |                            12 |                    56 |                         476 |              46 |            6 |                 6/6 | 0/0/0  |
| Snapshot Holdout  | `current_candidate` | 0.667 |            27 |           2 |                 3.222 |                            23 |                    63 |                         453 |              46 |            4 |                 2/2 | 0/0/0  |
| Local Pair 1      | `belief_ai_v1_4_2`  | 0.444 |            10 |           7 |                 1.889 |                            26 |                    86 |                         366 |              48 |            4 |                 7/7 | 0/0/0  |
| Local Pair 1      | `current_candidate` | 0.444 |            12 |           7 |                 2.111 |                            36 |                   122 |                         334 |              48 |            2 |                 7/7 | 0/0/0  |
| Local Pair 2      | `belief_ai_v1_4_2`  | 0.556 |            26 |           5 |                 3.444 |                            28 |                   113 |                         388 |              53 |            0 |                 5/5 | 0/0/0  |
| Local Pair 2      | `current_candidate` | 0.444 |            27 |           4 |                 3.444 |                            28 |                   103 |                         353 |              46 |            0 |                 4/4 | 0/0/0  |

Safety-Spalte: `illegalActions/replayFailures/timeoutRate`.

## Klare Gewinner

- **Sichtbarkeits- und LegalAction-Fixes**: Diese schließen echte Vertragslücken und haben keinen erkennbaren Spielstärke-Nachteil.
- **Effective-Run-Quote und `unbrokenRunEffect`**: Fundamentale side-safe Kosten-/Risikobasis für Runs und Break-Entscheidungen. Die aktuelle Suite enthält nur wenige breite Tutor-/Virizz-artige Situationen, trotzdem ist der Fix regel- und sichtbarkeitsseitig wichtig.
- **Deck-Suite und Frozen Holdouts**: Der Branch hat erst dadurch gezeigt, dass Demo-Smoke, Snapshot-Tuning, Snapshot-Holdout und lokale Realistic-Holdouts unterschiedliche Aussagen liefern.
- **Draw-/Duplicate-Discipline und Remote-Contest-Diagnose**: Klare lokale Fehler wurden reduziert oder als Messproblem enttarnt.

## Neutrale/diagnostische Änderungen

- Remote-Trash-Diagnose: Wichtig, weil bezahlbare relevante Trash-Gelegenheiten meist genommen werden; das alte Problem war oft Opportunity/Targeting.
- Closeout-/Repeat-Dedupe: Wichtig, weil breite Closeout-Zähler und Mehrfachfenster korrigiert wurden.
- Planfolge-/Conversion-Metriken: Zeigen, dass viele lokale Entscheidungen plausibel sind, aber nicht in Abschlusslinien konvertieren.
- Outcome-Metriken und Gating: Erklären Folgeentscheidungen besser, aber erzeugen noch keine stabile Gesamtverbesserung.

## Gemischte oder negative Änderungen

- **Outcome-Follow-up/Outcome-Gating**: Local Pair 1/2 und einzelne Slots werden erklärbarer oder leicht besser; Snapshot Holdout verliert aber Corp-Score-Konversion.
- **Central Pressure / Closeout / No-Fresh**: Verbessert Erklärbarkeit und verhindert manche stale Runs, aber ist kein klarer Progressionssprung.
- **Economy Reserve**: Schützt gegen schlechte Runs, kann aber Tempo kosten und Passivität fördern.
- **Corp Protection**: Schützt riskante Remotes, kann aber Score-Timing verzögern, wenn Schutzpläne zu lange dominieren.

Metriken, die besonders vorsichtig zu lesen sind:

- `centralCloseoutOpportunities` wurde bewusst enger definiert; Verbesserungen können Messkorrektur statt Spielstärke sein.
- `noFreshCentralSubstitutions` zeigt richtige Ersatzwahl, aber nicht automatisch Progression.
- Outcome-Follow-up-Metriken sind Candidate-/Doctrine-gated; Baseline-Nullwerte bedeuten nicht, dass die Baseline keine sinnvollen Folgeentscheidungen hatte.
- ActionLimitRate ist wichtig, aber aktuell noch kein hartes Profil-Gate, weil Slots mit besserem Score/Steal trotzdem ActionLimit erreichen können.

## Risiken

- **Overfitting**: Snapshot- und Local-Holdout-Decks sind wertvoll, aber klein. Local Pair 1 darf nicht hartoptimiert werden.
- **Wartungskomplexität**: Viele Metriken und Plan-/Outcome-Evidences erhöhen die Review-Last. Das ist als Diagnosebasis akzeptabel, aber kein Ersatz für klare Release-Gates.
- **Performance/Laufzeit**: Die vollständige Match-Progression-Deck-Suite mit `maxActions: 160` läuft spürbar lange. Sie sollte Merge-Gate für AI-Branches sein, aber nicht für jeden kleinen Nicht-AI-Patch.
- **DTO-/Trace-Risiko**: Effective-Quote und `unbrokenRunEffect` erweitern sichtbare Projektionen. Die Sanitizing- und Hidden-State-Tests müssen hart bleiben.
- **Profilverwechslung**: Der größte Produktfehler wäre, `current_candidate` implizit als Default zu behandeln, obwohl der Benchmark keine klare Gesamtüberlegenheit zeigt.

## Test-/Gate-Plan

Harte Gates vor Merge:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/engine test -- --runInBand`
- `corepack pnpm --filter @netgrid/shared exec tsc -p tsconfig.json --noEmit`
- Match-Progression-Deck-Suite mit Smoke, Snapshot-Suite und beiden Frozen Local-Realistic-Holdouts.

Nur falls Daten/Decks/Catalog berührt werden:

- relevante Deck-/Catalog-Checks.

Gate-Empfehlung:

- Safety-Gates bleiben hart: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.
- DTO-/Hidden-Info-Gates bleiben hart.
- Kein Demo- oder AppData-Fallback in der Deck-Suite.
- ActionLimitRate bleibt diagnostisches Gate, aber noch kein hartes Blocker-Gate für `current_candidate`, solange Profil nicht default wird.
- Für eine spätere Default-Aktivierung sollte ActionLimitRate zusammen mit Runner-Steals, Corp-Scores, Score/Steal pro Match und No-Progress-Ketten als kombinierter Gatekorb gelten.

## Offene Folgearbeiten

1. Release-/Merge-Integration mit explizitem Hinweis: `current_candidate` bleibt experimentell.
2. Separater Profilfreigabe-Review nach mehreren stabilen Benchmarks.
3. ActionLimit/Stagnation nicht mit weiteren Kleingewichten bearbeiten, sondern als Planabschluss-/Score-Window-Problem konsolidiert angehen.
4. Snapshot-Holdout-Corp-Score-Verlust gezielt weiter untersuchen, bevor Corp-Protection oder Outcome-Follow-up defaultfähig wird.
5. Performance des Benchmark-Harness beobachten; gegebenenfalls Smoke-Gate und Full-Suite-Gate trennen.

## Schlussentscheidung

Der Branch sollte nicht als "neue stärkere KI" gemergt werden. Er sollte als **Safety-, Sichtbarkeits-, Diagnose- und experimenteller Candidate-Branch** nach `main` gehen. `belief_ai_v1_4_2` bleibt bis auf Weiteres aktives/default Profil; `current_candidate` bleibt wertvoll als kontrollierter, besser instrumentierter nächster Kandidat.
