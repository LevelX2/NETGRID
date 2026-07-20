# KI-Kernlaufzeit – Folgeoptimierung und Abschlussreview

Status: abgeschlossen

Datum: 20. Juli 2026

Prozess:
`docs/architecture/ai/ai-core-runtime-performance-followup-process-2026-07-20.md`

## Ergebnis

Das Post-Optimization-Profil hat die verbleibenden Kosten nicht mehr primär
im Baseline-Runner, sondern in wiederholten reinen Runner-Auswertungen und in
allokationsintensiven Hidden-Info-Markerprüfungen lokalisiert. Beide Pfade sind
ohne Änderung an Scores, Evidence oder Entscheidungen optimiert.

Der feste unprofilierte 240-Aktionen-Fall
`strategy_panel_net_damage_black_ice` / `ai-behavior-baseline-v1-07` sank vom
bereits optimierten Stand 22,854 auf 18,512 Sekunden. Das sind weitere 19,0
Prozent und gegenüber der ursprünglichen 29,228-Sekunden-Messung insgesamt
36,7 Prozent weniger Wallclock.

## Technische Änderungen

1. Run-Target-Auswertungen werden für denselben Input, dieselbe Action und
   denselben Zielserver genau einmal je Entscheidung berechnet. Andere Ziele
   bleiben getrennt; die nächste Entscheidung beginnt leer.
2. Persistent-Install-Fit und die dazugehörige Handentwicklung werden
   innerhalb derselben Entscheidung wiederverwendet. Es gibt keine
   spielübergreifende oder zustandsübergreifende Lebensdauer.
3. Semantic-Redaction und Side-Safety prüfen exakte verbotene Tokens über
   vorgebaute Token-Grenzmuster. Sie erzeugen keine Token-Arrays und Sets mehr;
   geteilte Objektreferenzen werden nach vollständiger Prüfung nicht erneut
   traversiert.

## Profilvergleich

Messumgebung: lokaler Windows-Rechner, Node.js 24.18.0, ein Worker,
vollständiger Raw-Trace, identischer Slot, Seed und 240-Aktionen-Limit.

| Inklusive Profilregion       |   Vorher |  Nachher | Änderung |
| ---------------------------- | -------: | -------: | -------: |
| Profiler-Wallclock           | 27,706 s | 16,508 s |  −40,4 % |
| KI-Entscheidungswahl         | 11,664 s |  5,051 s |  −56,7 % |
| Kandidatenbewertung          |  8,560 s |  3,258 s |  −61,9 % |
| Score-Breakdown              |  5,597 s |  2,027 s |  −63,8 % |
| Runner-Score-Komponenten     |  4,173 s |  0,902 s |  −78,4 % |
| Runner-Run-Target-Auswertung |  4,009 s |  0,847 s |  −78,9 % |
| semantische Redaction        |  4,791 s |  0,820 s |  −82,9 % |
| Simulations-Side-Safety      |  4,722 s |  1,471 s |  −68,8 % |

Inklusive Profilzeiten überlappen und dürfen nicht addiert werden. Die
Wallclock unter Profiler dient nur dem identischen Vorher-/Nachher-Vergleich.

## Parität und Gates

- Konfiguration, Slotresultat, Aggregate und Gate der kompakten Baseline sind
  feldgleich.
- Alle vollständigen Raw-Slots einschließlich ActionSequence, Decision-Trace
  und finalem StateHash sind feldgleich.
- 15 fokussierte Cache-, Redaction- und Side-Safety-Tests sind grün.
- `@netgrid/ai`-Typecheck und `check:ai` sind grün; das Strukturgate meldet
  null Runtime- und Typzyklen.
- Die vollständige AI-Suite ist mit 416 Testdateien und 2.848 Tests in 385,68
  Sekunden grün.
- Der beobachtbare Server-KI-vs-KI-Langlauf endet nach mehr als 120 Aktionen
  regulär, speichert für jede Aktion einen Decision-Trace und replayt mit
  korrektem StateHash. Der Test benötigt 33,93 Sekunden.

## Nutzung und nächste Messpunkte

Der Standard-Benchmark profitiert automatisch, da er den öffentlichen
`chooseAiAction`-Pfad verwendet. Neue Benchmarks sollen ebenfalls die
öffentlichen Simulationseinstiege nutzen und benötigen keine Cacheoption. Für
vergleichbare Performanceevidence bleibt `--workers 1` der serielle
Referenzpfad.

Die verbleibenden aktuellen Profilspitzen liegen deutlich niedriger: Corp-
Scoring-Window-Projektion, AI-Decision-Input-Aufbau, Deck-Doctrine-Aufbau und
sichtbare Karten-Lookups. Weitere Arbeit daran soll erneut profilgetrieben und
paritätsgesichert erfolgen; es besteht kein belegter Anlass, Regeln,
Informationen oder Diagnoseevidence zu reduzieren.
