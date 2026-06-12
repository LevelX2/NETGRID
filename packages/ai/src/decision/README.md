# Decision

`decision/` enthält die runtime-nutzbare semantische Entscheidungslogik. Die Module bündeln Inputs, synthetisieren neutrale Ziele, bewerten Action-Goal-Fit, prüfen Hard Gates, projizieren Run-/Target-Alignment, erzeugen Shadow-Entscheidungen und halten opt-in Pilot-Scope-Logik.

## Grenzen

- `decision/` darf keine Evaluation-Reports, Benchmarks oder Snapshot-Suites importieren.
- `decision/` darf keine Runtime-Implementierung importieren.
- Typ-only Imports aus `runtime/semantic-runtime-types` sind erlaubt, solange sie keinen Runtime-Code koppeln.
- Pilot-Module wählen nur aus bereits legalen Action-Kandidaten und erzeugen keine Legalität.
- TargetChoiceShadow bleibt diagnostisch und erzeugt keine produktiven `selectedChoices`.
