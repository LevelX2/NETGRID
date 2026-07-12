# AI Behavior Baseline v1 – Initial Run Review

Status: Baseline erzeugt, technische Attention erforderlich

## Ausführung

- Git-Stand: `4a9e347f4`
- 60 Spiele, 11.144 Entscheidungen, sechs Deck-Slots, zehn feste Seeds je Slot
- Aktionslimit: 480
- Controller: Runner und Korp jeweils `current_candidate`
- Kompakte Vergleichsbasis:
  `data/local/ai-behavior-baseline-v1-2026-07-12.json`
- Vollständige redigierte Rohtraces:
  `data/local/ai-behavior-baseline-v1-2026-07-12-raw.json`
- Lesbarer Laufbericht:
  `docs/reviews/ai/ai-behavior-baseline-v1-2026-07-12.md`

## Harte technische Gates

| Gate                      | Ergebnis |
| ------------------------- | -------: |
| Illegale Aktionen         |        0 |
| Replay-Fehler             |        0 |
| Hidden-Info-Marker        |        0 |
| `no_legal_action_failure` |        0 |
| Fallbacks                 |        0 |
| Timeouts                  |        0 |
| Runtimefehler             |        0 |
| Redaction-safe            |       ja |
| Aktionslimit-Partien      |        2 |

Die Baseline ist deshalb korrekt `attention_required`: Aktionslimits gehören
zum harten technischen Gate, auch wenn die zwei betroffenen Partien keine
Runtimefehler enthalten.

## Verhaltensreferenz

| Kennzahl                                                  |                     Ergebnis |
| --------------------------------------------------------- | ---------------------------: |
| Verpasste Scorefenster                                    |             0 von 97 (0,000) |
| Advanced-Remote-Contests ausgelassen                      |          286 von 326 (0,877) |
| Plan-Konversion innerhalb von drei eigenen Entscheidungen |      2.473 von 3.141 (0,787) |
| Strategische No-Progress-Wiederholungen                   | 2,243 pro 100 Entscheidungen |
| Klar dominierte Planwahl                                  |     0 pro 100 Entscheidungen |
| Trace-Findings                                            | 3,975 pro 100 Entscheidungen |

Die Advanced-Remote-Contest-Rate ist ein vorhandener Diagnosewert, kein
automatischer Fehlerschluss: Sie kann durch konkurrierende Sicherheits-,
Reserve- oder wichtigere unmittelbare Payoffs erklärt sein. Sie wird erst im
gepaarten Folgelauf als Veränderungssignal bewertet.

Die häufigsten Trace-Diagnosen sind `plan_step_action_mismatch` (324),
`bank_over_target_without_funding_need` (47), `recovery_low_value_loop` (42)
und `repeated_no_progress_run` (31). Diese Zähler bleiben bewusst getrennt von
den harten Gates, weil frühere Audits für einzelne Detektoren
Kontext-/Präzisionsprüfungen verlangt haben.

## Aktionslimit-Befund

Beide Limits treten ausschließlich im Slot
`strategy_panel_hybrid_score_punish_cheap_bag` auf:

| Seed                         | Aktionen | Runner AP | Korp AP | Letzter beobachtbarer Verlauf                       |
| ---------------------------- | -------: | --------: | ------: | --------------------------------------------------- |
| `ai-behavior-baseline-v1-01` |      480 |         6 |       5 | langer Run-/Rez-/Break-/Continue-Abschnitt          |
| `ai-behavior-baseline-v1-07` |      480 |         2 |       5 | wiederholte Korp-Credit-Aktionen im langen Endspiel |

Das ist ein konkreter nächster Analyseanker, aber noch kein Beleg für eine
bestimmte Regel- oder Runtimeursache. Vor einer KI-Änderung müssen die beiden
redigierten Traces zugweise rekonstruiert und gegen legale Alternativen geprüft
werden.

## Folgegebrauch

Künftige KI-Änderungen laufen mit identischen sechs Slots, Deck-Fingerprints,
Seeds und 480 Aktionen gegen die kompakte JSON-Basis. Der Runner liefert dann
automatisch Deltas für Scorefenster, Advanced-Remote-Contest, Plan-Konversion,
No-Progress, dominierte Wahl und durchschnittliche Aktionszahl. Neue harte
Fehler oder zusätzliche Limits bleiben sofort rot; Verhaltensdeltas bleiben
zunächst Review-Evidence, bis mehrere Vergleichsläufe belastbare Schwellen
erlauben.
