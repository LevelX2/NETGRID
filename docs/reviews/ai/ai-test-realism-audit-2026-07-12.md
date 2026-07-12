# Audit: Realitätsgehalt der KI-Tests

Stand: 2026-07-12
Status: ATR-01 abgeschlossen, Härtung in Arbeit

## Kurzurteil

Die KI-Suite ist breit und ihre lokalen Verträge sind überwiegend sinnvoll
fokussiert. Sie bewies vor diesem Audit aber nicht durchgängig, dass dieselbe
Fehlfunktion im echten Spiel sichtbar würde. Der wichtigste blinde Fleck liegt
zwischen zwei jeweils grünen Testwelten:

1. Die produktive Semantic Runtime wird intensiv mit handgebauten
   `AiDecisionInput`-Objekten geprüft.
2. Ein eigener Korpus erzeugt reale `PlayerView` und `LegalActions` aus der
   Engine, leitet sie jedoch nur durch eine ausdrücklich wirkungslose
   Shadow-Diagnostik und nicht durch den produktiven Chooser.

Dadurch konnten Fixture-Annahmen und die echte Engine-Situation auseinanderlaufen,
ohne dass eines der bestehenden Gates rot wurde.

## Vollständiger Bestand

Die Zählung erfolgte über `vitest list --staticParse --json`. Erfasst sind alle
Testdateien unter `packages/ai/src`; die Gruppierung folgt der Verzeichnisstruktur.

| Gruppe | Testdateien | Testfälle | Primärer Prüfgegenstand |
|---|---:|---:|---|
| `runtime/` | 92 | 650 | Scoring, Kontext, Auswahlbausteine und Live-Runtime |
| Root/Querschnitt | 54 | 632 | Fassade, Hints, Decks, strategische Vertikalschnitte, Gates |
| `simulation/` | 42 | 149 | Metriken, Diagnostik, Selfplay und Simulation |
| `evaluation/` | 24 | 73 | Korpora, Snapshots, Readiness und Benchmarks |
| `decision/` | 23 | 225 | Ziele, Utility, Frames, Piloten und Target Choice |
| `plans/` | 22 | 85 | Planbildung, Matching, Fortschritt und Coverage |
| `actions/` | 11 | 66 | Semantikprojektion und Action-Verträge |
| `access/` | 10 | 39 | Access-Wert, Memory und Trash-/Reserve-Entscheidungen |
| `diagnostics/` | 9 | 39 | Debug-, Redaction- und Coverage-Ausgaben |
| `memory/` | 1 | 9 | Access-Outcome-Memory |
| `reports/` | 1 | 1 | Reportformatierung |
| **Gesamt** | **289** | **1.968** | |

Zusätzlich wurden fünf KI-nahe Testdateien in Server, Web und Shared als
Randverträge identifiziert. Sie prüfen Transport, Anzeige oder gemeinsame
Typverträge und sind keine Ersatzabdeckung für KI-Verhalten.

## Auditmethode

Jede der 289 Dateien wurde automatisiert auf Gruppe, Testfallzahl und folgende
Realitätssignale geprüft:

- Aufruf der öffentlichen produktiven Chooser-Fassade;
- Aufbau von Zustand, `PlayerView` und `LegalActions` über die Engine;
- vollständige Simulation mit `applyAction` und Replay;
- direkte Prüfung eines internen Helpers;
- Dependency Injection, Mocks oder fest vorgewählte Zwischenergebnisse;
- synthetische Inputs und unsichere Typcasts;
- leere oder einzelne Action-Mengen;
- relevante Konkurrenzaktionen und Zustandsvarianten.

Anschließend wurden sämtliche Dateien mit Live-Chooser-, Engine- oder
Simulationssignal sowie repräsentative Dateien jeder übrigen Gruppe inhaltlich
gegen ihren Testnamen und Vertrag geprüft. Enge Tests wurden nicht pauschal als
schlecht bewertet: Für reine Parser-, Projektion-, Redaction-, Typ- und
Formatverträge ist ein enger Unit-Test der richtige Prüfgegenstand. Kritisch ist
Enge dort, wo der Testname eine Auswahl oder ein Verhalten im Spiel behauptet.

## Quantitative Realitätssignale

- Nur zehn Testdateien rufen `chooseAiAction`, `chooseCorpAction` oder
  `chooseRunnerAction` direkt auf. Diese Dateien enthalten zusammen höchstens
  117 der 1.968 Testfälle; mehrere Fälle in diesen Dateien prüfen zusätzlich
  nur Hilfsverträge.
- Nur `known-ice-run-risk.test.ts` verbindet in einem bestehenden Test
  Engine-Zustand, Engine-`PlayerView`, Engine-`LegalActions` und den produktiven
  Chooser direkt. Die übrigen Fälle derselben Datei nutzen synthetische Inputs.
- `simulation-harness.test.ts` enthält einen vollständigen deterministischen
  AI-vs-AI-Lauf. Er prüft Legalität, Fehlerfreiheit, Replay und Redaction, aber
  keine konkrete fachliche Fehlentscheidung.
- Der Real-Engine-Korpus umfasst 54 Szenarien. 22 davon tragen bereits eine
  Erwartung an den besten Aktionstyp und konkrete verbotene Fehlerklassen.
  Bislang wird für keines dieser 22 Szenarien die produktive Auswahl gegen diese
  Erwartung geprüft.
- In 47 von 92 Runtime-Testdateien kommen `as unknown as`-Casts vor. Das ist
  nicht automatisch falsch, erhöht bei behauptetem Spielverhalten aber das
  Risiko, dass ein Engine-Feld oder eine reale Kombination unabsichtlich fehlt.

## Bewertung nach Gruppen

### Access

Die zehn Dateien prüfen überwiegend reine Projektionen, Rankingbausteine und
Memory-Übergänge. Diese Enge passt zum lokalen Vertrag. Für Aussagen wie
„Trash statt Decline“ fehlt jedoch stellenweise der Nachweis über die
produktive Choice-Verarbeitung. Priorität: mittel; die wichtigen Access-Fälle
werden über echte Choice-/Action-Konkurrenz gespiegelt.

### Actions

Semantikprojektion, Source Binding und Invarianten sind als Unit-Verträge
angemessen. `action-semantic-coverage.test.ts` erzeugt reale Engine-Actions,
prüft aber Coverage und nicht die spätere Auswahl. Priorität: mittel; keine
pauschale Umstellung auf End-to-End.

### Decision

Frames, Ziel-Synthese und Utility sind sinnvoll getrennt. Bei Tests mit
„candidate“, „alignment“ oder „choice“ muss mindestens eine plausible
Gegenalternative vorhanden sein; sonst kann ein verlorener Rankingfaktor grün
bleiben. Priorität: hoch für Verhaltensbehauptungen, niedrig für reine
Strukturverträge.

### Diagnostics und Reports

Direkte Helper-Tests sind der richtige Prüfgegenstand. Sie dürfen ausdrücklich
nicht als Play-Strength- oder Live-Verhaltensbeleg verwendet werden. Priorität:
niedrig; Dokumentation der Evidenzgrenze genügt.

### Evaluation

Hier liegt die kritischste Benennungs-/Evidenzlücke. Der „RealEngineDecisionCorpus“
erzeugt echte Inputs, wertet aber nur eine no-effect Shadow-Entscheidung aus.
`play-strength-benchmark.test.ts` prüft Aggregation bestehender Snapshots und
nicht aktuelle Spielstärke. `practical-tactic-benchmark.test.ts` prüft einen
eingefrorenen Korpus und Legacy-Trefferwerte, nicht die aktuelle Live-Auswahl.
Priorität: kritisch.

### Memory

Der lokale Zustandsautomat ist angemessen isoliert. Das Zusammenspiel mit
mehreren echten Entscheidungen wird bereits teilweise in vertikalen Runtime-
Tests geprüft. Priorität: niedrig bis mittel.

### Plans

Planbildung und Step Matching werden intensiv, aber meist mit vollständig
synthetischen Kandidaten geprüft. Das ist als Unit-Abdeckung wertvoll, kann
jedoch falsche Annahmen über Engine-Actions konservieren. Priorität: hoch für
Plan-zu-Live-Action-Mapping, sonst mittel.

### Root-/Querschnittsverträge

Die große Datei `semantic-ai-runtime-cutover.test.ts` enthält viele echte
Live-Chooser-Aufrufe und häufig plausible Konkurrenzaktionen. Sie ist daher
wertvoll, bleibt aber synthetisch und kontrolliert viele Kontextwerte selbst.
`strategic-vertical-slices.test.ts` variiert Zustände sinnvoll. Gate-, Hint- und
Exporttests sind korrekt eng. Priorität: hoch für eine Engine-Brücke, nicht für
einen pauschalen Rewrite.

### Runtime

Die 92 Dateien prüfen die produktive Bewertungslogik sehr detailliert. Der
Großteil ruft jedoch einzelne Scoring-/Kontextfunktionen auf; nur wenige Dateien
beweisen die resultierende Live-Auswahl. Ein Fehler in Wiring, Kandidatenmenge,
Reihenfolge oder einem nicht gesetzten Engine-Feld kann deshalb an allen
lokalen Tests vorbeigehen. Priorität: kritisch für ausgewählte Endentscheidungen,
lokal weiterhin hoch wertvoll.

### Simulation

Die Metrik- und Diagnosefunktionen sind passend isoliert. Der eine komplette
Golden-Seed-Lauf beweist technische Integrität, aber keine ausreichende
Szenariobreite. Eine völlig zufällige breite Suite wäre langsam und instabil;
stattdessen sind kleine deterministische Varianten und der Real-Engine-Korpus
die bessere Härtung. Priorität: hoch.

## Priorisierte Fehlfunktionsklassen

### P0 – Reale Engine-Inputs erreichen nicht den Live-Verhaltensassert

Fehlfunktion: Ein Engine-Feld, eine zusätzliche LegalAction oder eine reale
Action-Form ändert die Auswahl. Sämtliche synthetischen Live-Tests und sämtliche
diagnostischen Engine-Korpus-Tests bleiben grün.

Härtung: Alle 22 fachlich annotierten Engine-Szenarien durch den öffentlichen
Chooser schicken; Legalität, Determinismus und erwarteten Aktionstyp prüfen.

### P0 – Fixture setzt das Ergebnis indirekt fest

Fehlfunktion: Der relevante Scoringpfad ist kaputt, aber der Test injiziert
`bestSemanticRuntimeChoice`, Planresultat oder exakt eine LegalAction und erhält
weiter das erwartete Ergebnis.

Härtung: Solche Tests nur als Wiring-/Fallback-Vertrag benennen; für die
Verhaltensbehauptung eine zweite Prüfung mit echter Kandidatenbildung und
plausibler Gegenalternative ergänzen.

### P1 – Varianten fehlen

Fehlfunktion: Der Test beweist einen positiven Zustand, aber nicht, dass das
Signal bei knapp veränderter realer Situation verschwindet oder eine akute
Priorität überstimmt.

Härtung: Metamorphe Paare ergänzen, beispielsweise Tags 1/0, bezahlbar/knapp
unbezahlbar, bekannte Agenda/unbekannter Remote, vollständige/fehlende Coverage.

### P1 – Simulation prüft nur technische Gesundheit

Fehlfunktion: Alle Aktionen sind legal und Replay bleibt deterministisch, die
KI trifft aber systematisch eine schlechte Auswahl.

Härtung: Deterministische Szenarioerwartungen getrennt vom allgemeinen
Simulation-Smoke als fachliches Gate führen.

### P2 – Benennung überschätzt Evidenz

Fehlfunktion: Ein „benchmark“, „real engine“ oder „readiness“ genannter Test
wird als Live-Verhaltensbeleg interpretiert, obwohl er nur Format, Aggregation
oder diagnostische Projektion prüft.

Härtung: Evidenzgrenzen im aktuellen Testmatrix-/Review-Artefakt ausdrücklich
festhalten und Live-Gates separat benennen.

## Geplante Härtung

1. Engine-Korpus und produktiven Chooser verbinden.
2. Für jede fachlich annotierte Situation Legalität, Wiederholbarkeit und den
   erwarteten Aktionstyp prüfen.
3. Kritische Verhaltensgruppen um mindestens eine kontrollierte Gegenvariante
   ergänzen, ohne den Unit-Test-Scope unnötig aufzublähen.
4. Simulation-Smoke um mehrere deterministische, unterschiedlich verlaufende
   Seeds ergänzen; strategische Erwartungen bleiben im Szenariogate.
5. Aktuelle Testmatrix so aktualisieren, dass Unit-, Live-Synthetic-,
   Live-Engine- und Full-Simulation-Evidenz nicht mehr vermischt werden.

## Residualrisiko

Auch nach der Härtung beweist die Suite keine globale optimale Spielstärke.
Unbekannte Mehrzugkombinationen, neue Karteninteraktionen und seltene
Choice-Folgen benötigen weiterhin Selfplay-/Match-Trace-Auswertung. Der neue
Gate-Vertrag soll jedoch verhindern, dass ein enger grüner Helper-Test erneut
als ausreichender Beleg für eine reale Spielentscheidung gilt.
