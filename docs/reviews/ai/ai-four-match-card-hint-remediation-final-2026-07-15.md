# Kartenhint-Remediation aus vier gespeicherten Spielen: Final Review

## Ergebnis

Die Hint- und Consumer-Analyse der vier zuletzt abgeschlossenen Spiele ist auf
dem aktuellen Code abgeschlossen. Geprüft wurden 54 tatsächlich von der KI
ausgewählte Karten und zwölf weitere sichtbare, aber nicht ausgewählte
KI-Handkarten aus:

- `match_dfe6223d817c646d`;
- `match_e6761d8fcdbd7996`;
- `match_f450485d3e5be1ab`;
- `match_10311b60ca1364f6`.

Acht aktive Kartenhints wurden korrigiert oder familienweit normalisiert. Ein
zusätzlicher Runtime-Fehler wurde für `Inside Job` spielgleich reproduziert
und generisch behoben. Für die übrigen untersuchten Consumer-Kandidaten gab es
keinen aktuellen roten Beleg und deshalb keinen Produktionsfix.

## Korrigierte Hint-Gruppen

| Gruppe | Karten | Korrektur |
| --- | --- | --- |
| Run plus Encounter-Payoff | `Disgruntled Ice Technician` | Run auf beliebigen Server, vollständig gebrochenes ICE derezzen und Run danach beenden; kein ICE-Trash und keine feste R&D-Rolle |
| Handlimit-Hardware | `Militech MRAM Chip`, `MRAM Chip` | kanonische Rolle `handlimit`, Signal `setup.hand_size` und `hand_size_modifier`; keine Memory- oder Remote-Upgrade-Rolle |
| Suche statt Draw | `Mantis, Fixer-at-Large` | Kartensuche bleibt erhalten; das künstliche Draw-Effect wurde entfernt |
| Burst-Economy | `Score!` | reine Economy-/Recovery-Rolle; keine Run-Event- oder R&D-Druckrolle |
| HQ-Stabilisierung | `Corporate Downsizing` | HQ-Agenda-Reveal und Shuffle nach R&D statt R&D-Top-Reveal; kein unspezifischer R&D-Schutzanker |
| Eingeschränkte wiederkehrende Credits | `Cloak`, `Vewy Vewy Quiet` | einheitliches Signal und Target für Credits auf nicht-noisy Icebreakern |

Die Normalisierung verwendet vorhandene Taxonomie statt neuer Synonyme:
`handlimit` war bereits der gemeinsame Rollenbegriff für Handgrößenmodifikatoren.
Die fokussierte Vollsuite deckte die zunächst abweichende Schreibweise
`hand_size` als unbekannte Rolle auf; aktive und kompilierte Hints sowie
Inspector-, Qualitäts- und Taxonomieartefakte wurden daraufhin kanonisch
regeneriert.

## Inside Job: belegtes Consumer-Delta

Der aktive Hint für `Inside Job` war mechanisch bereits richtig und enthielt
`target:bypass_first_ice`. Der Run-Action-Consumer akzeptierte für den
Bypass-Boolean jedoch nur einen unpräfixierten Signalwert. Dadurch blieb die
Projektion `bypassFirstIce=false`, und die R&D-Pfadquote aus Decision 62,
StateVersion 116 meldete trotz anschließend erfolgreichem Bypass und Access:

```text
path:blocked_unpayable
credits_after:-2
```

Die Projektion erkennt nun den vorhandenen strukturierten Target-Token über
denselben begrenzten Signalvertrag wie andere Run-Signale. Für die
aktionsbezogene Pfadquote wird anschließend genau die äußerste ICE-Position
aus der inner-to-outer gespeicherten Serverliste entfernt. Es gibt keine
Kartenname-, Match-ID-, Seed- oder Server-Sonderwertung.

Der unveränderte fachliche Checkpoint wählt weiterhin `Inside Job` auf R&D
und belegt nun:

```text
pathPassability: reachable
pathCost: 0
creditsAfterRun: 4
run_action_projection_bypass_first_ice:true
run_action_projection_bypassed_first_ice:true
```

## Bewusste Nicht-Fixes

- `Disgruntled Ice Technician`: Der aktuelle Chooser vermeidet den
  historischen leeren Archives-Einsatz bereits. Nur der falsche Hint wurde
  korrigiert.
- `Clown` und `Pattel's Virus`: In den gespeicherten Zuständen ist kein
  eindeutig falsches Auslassen belegt. Breakkosten-Support bleibt vom
  marginalen Nutzen, MU, Coverage und den erwarteten Einsparungen abhängig.
- `Lockjaw`: Die vorhandene Trapdoor-/Dumpster-Gegenprobe belegt die
  situationsabhängige Nutzung beschränkter Breaker-Credits bereits.
- `Core Command: Jettison Ice`: Es gibt keinen spielgleichen Zustand, in dem
  sichtbarer ICE-Trash eindeutig besser als die gewählte Tag-Entfernung war.
  Deshalb gibt es keine Zielwert- oder Kartennamenregel.

## Beabsichtigte Folge der Score-Korrektur

Eine vorhandene Discard-Gegenprobe wechselte nach Entfernung der falschen
R&D-Druckrolle von `Temple Microcode Outlet` zu `Score!`: Bei installierter
Breaker-Coverage und 18 Credits ist die zusätzliche Burst-Economy die
redundantere Handkarte. Der Gegenvertrag ohne installierte Breaker-Coverage
behält den Suchzugriff weiterhin. Die Fixture wurde auf diese neue fachliche
Wahrheit nachgezogen; es gab keinen zusätzlichen Discard-Scoring-Fix.

## Verifikation

```text
Vor Fix: Hint-Vertrag 16/16 fachliche Assertions rot
Vor Fix: Inside-Job-Pfadquote rot, Disgruntled-Gegenprobe grün
Inside-Job-Projektion und RunTargetEvaluation: 3 Dateien, 76/76 Tests grün
Vorhandene Match-Gegenproben: 5 Dateien, 34/34 Tests grün
Taxonomie-, Qualitäts- und Hint-Verträge: 3 Dateien, 33/33 Tests grün
Vollständige @netgrid/ai-Suite: 330/330 Dateien, 2222/2222 Tests grün
@netgrid/ai Typecheck: grün
corepack pnpm check:ai: grün
git diff --check: grün
```

`check:ai` bestätigt 618 aktive Kartenhints, konsistente kompilierte Hints,
193 geprüfte Derived-Facts-Pilotkarten, 193 Hint-Index-Pilotkarten, sechs
manuelle Overlays und einen aktuellen Action-Signal-Katalog. Die vorhandenen
Warnungen bleiben nicht blockierende Qualitätsschuld; es wurde kein neuer
Gate-Fehler akzeptiert.

LegalActions, Engine-Autorität, Hidden-Info-Grenzen, Replay, StateHash und
Randomness wurden nicht geändert. Zusätzliche Selfplays oder Behavior-
Baselines waren für die textgenauen Karten- und spielgleichen
Consumer-Verträge nicht erforderlich.
