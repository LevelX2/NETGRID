# Evaluation

`evaluation/` enthält lokale Mess- und Vergleichsgrundlagen für die semantische KI: Snapshot-Suites, Real-Engine-Corpus, Shadow League, Calibration-/Play-Strength-Benchmarks, Shadow-vs-Runtime-Reports und Mistake-Taxonomie.

## Grenzen

- `evaluation/` darf `decision/` nutzen, um Frames, Traces und Shadow-Rankings zu bewerten.
- `evaluation/` darf keine produktive Action-Auswahl treffen.
- `evaluation/` darf den Runtime-Chooser nicht importieren.
- Korpus-Fixtures dürfen side-safe Runtime-Input-Builder wiederverwenden, wenn sie keine produktive Entscheidung auslösen.
- Reports bleiben diagnostisch und ändern keine Default-Runtime-Gewichte.
