# AI index.ts Restschuld nach Debug- und Report-Schnitten

Status: `diagnostic_complete`

Datum: 2026-06-13

Bezugsprozess: `ai-play-strength-maturation-3-process-2026-06-13.md`, AI-MAT3-6.

## Befund

Die Schnitte AI-MAT3-4 und AI-MAT3-5 haben zwei reine, risikoarme Hilfsbereiche aus `packages/ai/src/index.ts` entfernt:

- `packages/ai/src/diagnostics/legacy-baseline-debug.ts` kapselt das Legacy-Baseline-DecisionDebug-Formatting.
- `packages/ai/src/reports/simulation-report-formatters.ts` kapselt den Doctrine-Quality-Case-Analysis-Markdown-Formatter.

Gemessene `index.ts`-Zeilenstände im Arbeitsbranch:

| Stand | Commit | `index.ts` LOC |
| --- | --- | ---: |
| vor AI-MAT3-4 | `e1d995d6` | 36.240 |
| nach AI-MAT3-4 | `ba153edb` | 36.199 |
| nach AI-MAT3-5 | `e7bcf359` | 36.156 |

Die Netto-Entlastung liegt bei 84 Zeilen in `index.ts`. Die Verschiebung ist fachlich trotzdem sinnvoll, weil sie zwei klar benennbare Verantwortungen aus der zentralen Datei entfernt und neue Zielorte etabliert:

- `diagnostics/` fuer Debug-/DecisionDebug-Formatting.
- `reports/` fuer reine Report-Formatter.

## Aktuelle Restschuld

`packages/ai/src/index.ts` bleibt nach den Schnitten weiterhin eine gemischte Fassade und Implementierungsdatei. Die groben verbleibenden Kopplungsfelder sind:

| Bereich | Befund | Naechster sinnvoller Schnitt |
| --- | --- | --- |
| Semantic Runtime Scoring | Score-Komponenten, Gates, Evidence, Exclusions und Debug-Aufbau liegen noch eng beieinander. | Keine Big-Bang-Extraktion; zuerst einzelne bereits typisierte Score-/Evidence-Familien mit Golden-Tests herausnehmen. |
| Runner Run/Breaker/Recovery Scoring | Runner-Run-Ziele, Breaker-Kosten, Recovery-, Kredit- und No-Run-Economy-Komponenten bilden einen grossen Helper-Graphen. | Nach AI-MAT3-12 nur den durch Coverage-Goals belegten Breaker-/Search-Anteil schneiden. |
| Corp Remote/Score/Protection Scoring | Remote-Build, Advance, Score-Window, Rez-Floor und Protection-Diagnostik sind noch breit verwoben. | Nach AI-MAT3-11/13 nur DoctrineGoal- und RemoteContest-Diagnostik verschieben, keine Runtime-Neugewichtung. |
| Simulation Metrics | Match-Progression-, Doctrine-, Coverage- und Endgame-Metriken liegen groesstenteils weiter in `index.ts`. | Erst weitere Report-/Coverage-Module stabilisieren; Metrikaggregation separat schneiden, wenn sie keine Runtime-Helfer mehr zieht. |
| Public Facade | `index.ts` ist weiterhin oeffentlicher Exportpfad fuer viele Typen und Funktionen. | Public-Contract-Test vor jeder weiteren Exportbewegung erweitern statt Exporte beiläufig zu veraendern. |

## Schlussfolgerung

Der naechste Strukturfortschritt sollte nicht ueber weitere mechanische LOC-Reduktion gesteuert werden. Die naechsten Pakete sollen fachliche Diagnosegrenzen haerten:

1. TargetChoiceShadow Scorecard und Coverage zuerst als interne Evaluation stabilisieren.
2. DoctrineGoal Coverage und Zielsynthetisierung als eigenstaendige Diagnostik absichern.
3. Erst danach weitere `index.ts`-Schnitte aus den stabilisierten Diagnosefamilien ableiten.

Die aktuelle Restschuld ist damit vermessen und priorisiert, aber nicht blockierend fuer die naechsten Maturation-III-Pakete.
