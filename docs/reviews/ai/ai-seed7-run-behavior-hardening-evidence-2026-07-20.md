# Seed-7-Run-Verhalten – Umsetzungsevidence

Status: Final Verify einschließlich aktuellem `main` grün, lokaler Main-Merge und Cleanup ausstehend

## Geprüfter Fehlerkorridor

Der Ausgangsstand `19d8375ed` erreichte im Slot
`strategy_panel_net_damage_black_ice` mit Seed
`ai-behavior-baseline-v1-07` das Action-Limit von 480 Aktionen. Die sechs
auffälligen Wiederholungen lagen bei StateVersion 171, 210, 225, 229, 313 und 339. Zustände 168/171 starteten einen bekannten R&D-Pfad mit vier Runner-
Credits, 210 hatte eine bezahlbare Trace-4-Route bei sechs Runner- und null
Corp-Credits, 225/229 benötigten gegen drei Corp-Credits eine nicht gedeckte
Garantie von sieben. 313/339 liefen denselben bekannten Remote 2 trotz zuvor
nicht konvertierter `trash_affordable`-Begründung.

## Umgesetzter Vertrag

- RunTarget, RunPlan und Encounter verwenden dieselbe effektabhängige
  `RunnerRunRouteQuote`.
- Eine `RunnerRunCommitment` bindet Ziel, Route, Kosten, Access-Reserve und
  akzeptierte Risiken an einen side-sicheren sichtbaren Fingerprint.
- `no_access` ist ein hartes Freigabe-Aus; konditionale Routen benötigen ein
  ausdrückliches Probe-, Breaker- oder Agenda-Risiko.
- Ein unverändert positiv und bezahlbar geplantes Trash-Ziel wird beim Access
  mit dem reservierten Betrag ausgeführt. Eine Invalidierung fällt auf die
  aktuelle semantische Bewertung zurück.
- Wiederholungsdiagnostik vergleicht vorhandene sichtbare
  Entscheidungsfingerprints und bleibt reine Diagnostik. Es gibt weder
  Cooldown noch globale Wiederholungssperre.
- Bank-Cashout benennt den konkreten Run-Server, Funding-Gap und Payoff und
  darf keine `no_access`-Route als finanzierbar umdeuten.
- Eine vollzugriffsbezogene Empfehlung zum weiteren Aufbau sperrt keinen
  eigenständig begründeten Unknown-ICE-Prüfrun, wenn dessen bekannte
  Teilroute finanziert ist. Das bewahrt den positiven 9FEF-F04-Kontrollfall:
  jetzt proben oder ziehen statt drei Klicks lang eine Vollroute zu
  finanzieren.
- Eine Route mit Restricted Breaker Credits bleibt bezahlbar, wenn die
  konkrete Pfadanalyse diese Credits tatsächlich für einen Breaker einsetzen
  kann. Die Quote leitet den Betrag aus der sequenziellen Pfadzahlung ab; eine
  gemischte Breaker-/Trace-Gegenprobe belegt, dass der verbleibende
  Trace-Fehlbetrag nicht aus dem Sonderpool bezahlt wird.
- Ein bekanntes `trash_affordable`-Remote-Ziel bleibt auch bei unbekanntem ICE
  der eigentliche Run-Zweck. `probe_unknown_ice` ersetzt dieses Ziel nicht,
  sondern beschreibt nur Runs ohne höherwertigen bekannten Access-Payoff.
- Das zusätzliche Kreditrisiko eines Unknown-ICE-Probes wird aus den nach dem
  bekannten Pfad verbleibenden Credits und dem modellierten Risikopuffer
  gebildet. Nach einem Rez darf ein `no_access`-Pfad dieses Budget nicht mit
  einer Safety-Sequenz überschreiten. Ein quantifizierter, nicht tödlicher
  Damage-Effekt kann bis zum vorher gebundenen Damage-Budget akzeptiert
  werden; tödlicher Damage, Programmverlust, Trace und Tag behalten ihren
  Safety-Override.

## Seed-7-Gegenprobe

Konfiguration:

- feste sechs Standard-Slots der AI Behavior Baseline v1;
- Seed `ai-behavior-baseline-v1-07`;
- 480 Aktionen;
- Runner und Corp jeweils `current_candidate`;
- unveränderte Detektoren und Redaction-Prüfung.

Ergebnis:

| Kriterium                                     |                    Ausgangsstand | Kandidat |
| --------------------------------------------- | -------------------------------: | -------: |
| Spiele in der Seed-7-Matrix                   |                                6 |        6 |
| Hard Failures                                 | Action-Limit im betroffenen Slot |        0 |
| Betroffener Slot – Aktionen                   |                              480 |      472 |
| Betroffener Slot – `repeated_no_progress_run` |                                6 |        0 |
| Replay                                        |                             grün |     grün |
| Redaction                                     |                             grün |     grün |

Im finalen Kandidaten ist der frühere Start-/Jack-out-Stillstand nicht mehr
vorhanden. Bei StateVersion 143 rezz’t die Corp stattdessen neues ICE. Die
Revalidation stuft die Route als `no_access` ein. Die KI verwendet nur zwei
Credits ihres gebundenen Probe-Puffers und wählt bei StateVersion 145
`continue_run` mit `runner_run_plan_conserve_credits:true`, statt weitere sechs
Credits für die nun unerreichbare Route auszugeben. Die Partie endet nach 472
Aktionen mit Runner-Sieg durch leeres Corp-Deck; alle produktiven späteren
Runs bleiben zulässig.

Ein zusätzlicher positiver Kontrollfall aus dem Vollvergleich deckte eine
Zielverwechslung auf: Im Hybrid-Score-Punish-Slot mit Seed 10 muss ein Run auf
ein bekanntes Economy-Asset trotz unbekanntem ICE weiterhin dem Trash-Ziel
dienen. Der finale Kandidat führt bei StateVersion 138
`trash_accessed_card` für vier Credits mit
`runner_run_plan_access_trash_converts_commitment:true` aus und beendet die
Partie wie die Referenz nach 241 Aktionen durch Corp-Agenda-Punkte.

Die exakten Zustände 168, 210 und 225 sind zusätzlich als fokussierte
Routen-/Trace-Gegenproben abgedeckt: Garantie fünf bei vier Credits ist nur
konditional, Garantie vier bei sechs Credits ist bezahlbar und wird mit dem
kleinsten Gewinngebot ausgeführt, Garantie sieben bei sechs Credits ist nicht
garantiert.

## Vollständiger Standardvergleich

Der unveränderte Vergleich über sechs Slots, zehn Standard-Seeds und 480
Aktionen lief auf Commit `a2791daeb` mit 60 Spielen und 12.306 Entscheidungen.
Er ist zur Referenz `19d8375ed` vollständig vergleichbar und wurde mit
`accepted: true` ohne Hard Failure abgeschlossen. Action-Limit-Spiele sanken
von eins auf null; Replay-Failures und Hidden-Info-Findings blieben jeweils
null. Die rohe Finding-Anzahl stieg bei 200 zusätzlichen Entscheidungen von
808 auf 817, während die Finding-Rate leicht von 6,674 auf 6,639 pro 100
Entscheidungen sank. Die `strategicNoProgress`-Rate stieg geringfügig von
2,941 auf 3,023 pro 100 Entscheidungen und blieb innerhalb des akzeptierten
Baseline-Korridors; im betroffenen Seed-7-Spiel blieb
`repeated_no_progress_run` bei null.

Nach konfliktfreier Integration des aktuellen `main` auf Merge-Commit
`d9873956e` wurde derselbe Vergleich vollständig wiederholt. Der kombinierte
Stand ist mit 60 Spielen und 12.323 Entscheidungen weiterhin vergleichbar und
mit `accepted: true` ohne Hard Failure abgeschlossen. Action-Limit-Spiele,
Replay-Failures und Hidden-Info-Findings bleiben null. Die Finding-Rate liegt
bei 6,581 und die `strategicNoProgress`-Rate bei 3,043 pro 100 Entscheidungen;
beide Werte bleiben im akzeptierten Vergleichskorridor. Der betroffene
Seed-7-Slot bleibt bei 472 Aktionen und null `repeated_no_progress_run`; der
Seed-10-Kontrollfall bleibt bei 241 Aktionen. Zusätzlich sind 100 fokussierte
Tests, 417 AI-Testdateien mit 2.881 Tests, AI-Typecheck, Source-Structure,
Hint-Metadaten, Contracts, Test-Discovery und 19 Hidden-Info-/Redaction-Tests
auf dem kombinierten Stand grün.

## Lokale Rohartefakte

Die vollständigen redigierten Rohdaten bleiben gemäß Baseline-Prozess lokal
und unversioniert:

- Ausgangsstand:
  `C:\Projekte\NETGRID\data\local\ai-behavior-baseline-v1-candidate-19d8375ed-2026-07-20-raw.json`
- Paket-4-Gegenprobe:
  `C:\Projekte\NETGRID_AI_SEED7_RUN_BEHAVIOR_HARDENING\data\local\ai-behavior-baseline-v1-seed07-seed7-hardening-p4-raw.json`
- Finaler Zehn-Seed-Vergleich:
  `C:\Projekte\NETGRID_AI_SEED7_RUN_BEHAVIOR_HARDENING\data\local\ai-behavior-baseline-v1-seed7-hardening-final-v2-raw.json`
- Zehn-Seed-Vergleich nach Integration des aktuellen `main`:
  `C:\Projekte\NETGRID_AI_SEED7_RUN_BEHAVIOR_HARDENING\data\local\ai-behavior-baseline-v1-seed7-hardening-post-main-raw.json`

Die Worktree-lokalen Rohartefakte werden beim verbindlichen Cleanup entfernt;
die belastbaren Ergebnisse sind in diesem Review dokumentiert.
