# KI-Kernlaufzeit: Post-Optimization-Profiling und Folgeoptimierung

Status: abgeschlossen

## Ziel und Messbasis

Nach Abschluss der Selfplay-Performanceoptimierung wird der aktuelle
produktive Semantic-Runtime-Pfad erneut profiliert. Ziel ist eine weitere
Beschleunigung der eigentlichen KI-Entscheidung, ohne LegalActions, Scores,
Entscheidungsreihenfolge, Evidence, Debugdaten, Replay, StateHash,
Hidden-Info-Schutz oder Baseline-Inhalte zu verändern.

Die feste Profiling-Last ist
`strategy_panel_net_damage_black_ice` mit Seed
`ai-behavior-baseline-v1-07`, 240 Aktionen, einem Worker und vollständigem
Raw-Trace. Auf Commit `763e85b45` benötigte der Lauf unter aktiviertem
Node-CPU-Profiler 27,706 Sekunden. Die CPU-Stichproben ordnen davon 16,441
Sekunden dem Simulationskern und 11,664 Sekunden der KI-Entscheidungswahl zu.

Aktuelle inklusive Schwerpunkte innerhalb der KI sind:

- Aufbau und Sortierung semantischer Kandidaten: 8,560 Sekunden;
- Score-Breakdown: 5,597 Sekunden;
- Runner-Score-Komponenten: 4,173 Sekunden;
- Runner-Run-Target-Auswertung: 4,009 Sekunden;
- semantische Side-Safety-/Redaction-Prüfung: 4,791 Sekunden;
- Belief-State-Aufbau: 2,789 Sekunden;
- AI-Decision-Input-Aufbau: 2,144 Sekunden;
- Runner-Handentwicklung: 1,923 Sekunden.

Die Zeiten sind inklusive Werte aus einem Sampling-Profil und dürfen nicht
addiert werden. Sie dienen der Priorisierung, nicht als fragile CI-Grenzwerte.

## Anforderungen und Invarianten

- Optimierungen sind reine Berechnungs- oder Allokationsoptimierungen.
- Entscheidungslokale Caches enden synchron mit genau einem
  `chooseAiAction`-Aufruf und verwenden dasselbe unveränderte
  `AiDecisionInput` sowie vollständige aktionsabhängige Schlüssel.
- Ein Cache darf weder zwischen Zügen noch zwischen Spielen wirken.
- Markerprüfungen erkennen weiterhin Schlüssel und Stringwerte unabhängig von
  Groß-/Kleinschreibung sowie Token-Trennern; geteilte Objektreferenzen dürfen
  nur dann übersprungen werden, wenn sie bereits vollständig geprüft wurden.
- Gleiche Konfiguration erzeugt bitgleiche ActionSequence, StateHashes,
  Summary, Findings, Aggregate und Raw-Evidence.
- Keine Engine-, Karten-, Seed-, Randomness-, Replay-, Redaction- oder
  Hidden-Info-Verträge werden abgeschwächt.

## Umsetzungspakete

### K0 – aktuelles Profil und Testmatrix

- CPU-Profil der festen 240-Aktionen-Last erfassen.
- Kandidatenbewertung, Run-Target-, Handentwicklungs- und Redaction-Pfade
  getrennt bewerten.
- Dieses Prozessdokument mit Messbasis und Invarianten festhalten.

### K1 – entscheidungslokale aktionsbezogene Ableitungen

- Identische Run-Target-Auswertungen für dieselbe Aktion und dasselbe Ziel
  innerhalb einer Entscheidung wiederverwenden.
- Identische Persistent-Install-/Handentwicklungsableitungen innerhalb einer
  Entscheidung wiederverwenden.
- Fokussierte Tests beweisen Cache-Lebensdauer, vollständige Schlüssel und
  unveränderte Resultate.

### K2 – allokationsarme Markerprüfung

- Semantische Marker ohne Token-Array und temporäres `Set` erkennen.
- Bereits vollständig geprüfte geteilte Objekte nicht erneut traversieren.
- Bestehende sowie ergänzte Marker-, Pfad-, Shared-Reference- und
  Hidden-Info-Tests bleiben grün.

### K3 – Parität, Laufzeit und Abschluss

- Profil und Wallclock auf derselben festen Last erneut messen.
- Baseline- und Raw-Artefakte normalisiert bitgleich vergleichen.
- fokussierte Tests, AI-Typecheck, `check:ai`, vollständige AI-Suite und den
  relevanten Langlauf ausführen;
- Runbook, Review, Projektstatus und Wissenslog um belastbare Erkenntnisse
  ergänzen.

## Testmatrix

| Gate                     | Nachweis                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| Cache-Korrektheit        | gleiche Eingabe/Aktion wird einmal berechnet; neue Entscheidung berechnet neu |
| Schlüsselvollständigkeit | andere Aktion oder anderes Run-Ziel erhält eigene Auswertung                  |
| Redaction                | alle verbotenen Marker in Schlüssel und Werten bleiben erkennbar              |
| Shared References        | vollständige einmalige Traversierung ohne Informationsverlust                 |
| Entscheidungsparität     | ActionSequence, StateHash und vollständige Baseline-Felder bitgleich          |
| Laufzeit                 | gleiche 240-Aktionen-Last vor/nach Änderung, ein Worker                       |
| Regression               | AI-Typecheck, `check:ai`, AI-Suite und Server-KI-Langlauf grün                |

## Arbeitsstand

- Worktree: `C:\Projekte\NETGRID_AI_CORE_PERFORMANCE`
- Branch: `codex/ai-core-performance`
- Basis: lokales `main` auf `763e85b45`
- Remote-Push und Pull Request sind nicht Bestandteil der Aufgabe.

## Abschlussstand

- Run-Target-Auswertungen werden innerhalb einer Entscheidung nach
  Inputidentität, Actionidentität und Zielserver wiederverwendet. Ein anderer
  Zielserver und die nächste Entscheidung erzeugen zwingend eine neue
  Auswertung.
- Persistent-Install-Auswertungen werden nach Actionidentität, die zugrunde
  liegende Handentwicklung nach Inputidentität wiederverwendet. Außerhalb des
  synchronen Entscheidungszyklus existiert kein Cache.
- Semantic-Redaction und Side-Safety erkennen dieselben exakten ASCII-Tokens
  jetzt über eine vorgebaute Grenzprüfung statt über Token-Arrays und
  temporäre Sets. Vollständig geprüfte geteilte Objekte werden nur einmal
  traversiert.
- Der feste unprofilierte 240-Aktionen-Lauf sank gegenüber dem Stand nach der
  ersten Performanceoptimierung von 22,854 auf 18,512 Sekunden, also um
  weitere 19,0 Prozent. Gegenüber der ursprünglichen Messung von 29,228
  Sekunden sind es insgesamt 36,7 Prozent.
- Unter identischem Node-CPU-Profiling sank die Wallclock von 27,706 auf
  16,508 Sekunden. Die inklusive KI-Entscheidungszeit sank von 11,664 auf
  5,051 Sekunden, Kandidatenbewertung von 8,560 auf 3,258 Sekunden,
  Run-Target-Auswertung von 4,009 auf 0,847 Sekunden und semantische
  Redaction von 4,791 auf 0,820 Sekunden.
- Kompakte Konfiguration, Slots, Aggregate und Gate sowie alle vollständigen
  Raw-Slots sind bitgleich. Die 416 AI-Testdateien mit 2.848 Tests,
  AI-Typecheck, `check:ai` und der replayfähige Server-Langlauf sind grün.
