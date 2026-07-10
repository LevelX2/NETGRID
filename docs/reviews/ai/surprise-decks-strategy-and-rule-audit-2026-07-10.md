# Strategie- und Regelaudit der Überraschungsdecks 2026-07-10

## Urteil

Die Spiele sind nach den geprüften NETGRID-Regelverträgen technisch sauber und strategisch deutlich besser als der vorherige Lauf. Eine globale oder spieltheoretische Optimalität ist trotzdem nicht bewiesen. Dafür wären eine vollständige Suche des Spielbaums, ein unabhängiges Regelorakel und wesentlich mehr Matchups nötig.

Belastbar belegt sind drei engere Aussagen:

1. Alle 20 persönlichen Spiele liefen legal, replay-stabil, deterministisch und ohne technische Ersatzentscheidung.
2. Keine Entscheidung erfüllt mehr das konservative Gate für eine klar dominierte, durch den Plan gehaltene Aktion.
3. Die vollständige Engine-Suite und die kartenspezifische Testabdeckung stützen die ausgeführten Regel-/Timingpfade; sie ersetzen keinen unabhängigen Vollaudit jedes möglichen Kartenzustands.

## Persönlicher 20×480-Abnahmelauf

- Runner: `Mit Ansage: Der perfekte Coup`
- Korp: `Syds ICE-Pfandhaus`
- Seeds: `surprise-decks-2026-07-10-01` bis `-20`
- Controller: beidseitig `current_candidate`
- Vollbestand: `data/local/ai-selfplay-surprise-decks-20x480-2026-07-10-strategy-audit-final.json`

| Kennzahl                        |       Vorheriger Rerun |  Final |  Delta |
| ------------------------------- | ---------------------: | -----: | -----: |
| Spiele                          |                     20 |     20 |      0 |
| Entscheidungen                  |                  5.469 |  4.812 |   -657 |
| Durchschnittliche Aktionen      |                 273,45 | 240,60 | -32,85 |
| Runner-Siege                    |                     14 |     15 |     +1 |
| Korp-Siege                      |                      6 |      5 |     -1 |
| Illegalitäten                   |                      0 |      0 |      0 |
| Replay-Fehler                   |                      0 |      0 |      0 |
| Aktionslimits                   |                      0 |      0 |      0 |
| Fallbacks / Timeouts            |                  0 / 0 |  0 / 0 |  0 / 0 |
| Findings gesamt                 |                    568 |    431 |   -137 |
| `repeated_no_progress_run`      |                    268 |    218 |    -50 |
| `recovery_low_value_loop`       |                    230 |    132 |    -98 |
| `plan_step_action_mismatch`     |                    110 |     94 |    -16 |
| `duplicate_low_delta_install`   |                      5 |      0 |     -5 |
| `clearly_dominated_plan_choice` | vorher nicht vorhanden |      0 |   grün |

Die 431 verbleibenden Findings sind mittelgradige Diagnosehinweise und überlappen: 218 No-Progress-Runs, 132 Recovery-Hinweise, 94 Plan-Mismatches und 18 Bank-over-target-Hinweise. Sie sind kein Beweis für 431 Fehlzüge, verhindern aber die Aussage „perfekt gespielt“.

Die Finding-Erzeugung ist nach JSON-Persistierung exakt idempotent: 431 Originalfindings und 431 identische Re-Detektionen. Zwei unmittelbar aufeinanderfolgende vollständige Kandidatenläufe haben für alle 20 Seeds identische Sieger, Endgründe, Aktionszahlen und finale StateHashes.

## Ergebnis der vier freigegebenen Punkte

### Negative Wiederholungsruns

Ein negativ bewerteter, bereits wiederholter opportunistischer Zentralrun weicht nun einer positiv bewerteten legalen Alternative, auch wenn diese ein Run auf einen anderen Server ist. Frische R&D-Information, bekannte HQ-Agenda und ausdrückliche Score-Threat-Payoffs bleiben geschützt. Die drei reproduzierten R&D-Fälle aus Seeds 15 und 20 erfüllen das Dominanzgate nicht mehr.

### Trash-Ziel und Access-Budget

Das für ein positives Trash-Ziel eingeplante Budget darf am Access tatsächlich ausgegeben werden. Eine getrennte Nachlauf-Sicherheitsreserve bleibt geschützt. Im Multiaccess zählt ein teureres Folgeziel nicht fälschlich als dominierte Ablehnung, wenn es über dem eingeplanten Trash-Budget liegt.

### Duplicate-Detektor

Positive `install_ready`-/`action_bank_parallel`-/`useful_backup`-Kopien werden nicht mehr als Low-Delta-Duplikat gemeldet. Negative, aufgeschobene oder ausdrücklich redundante Kopien bleiben detektierbar. Die fünf positiven Broker-Falschpositiven sind auf 0 gefallen.

### Optimalitätsgate

`clearly_dominated_plan_choice` verlangt gleichzeitig eine negative gewählte Aktion, eine positive legale Alternative und einen der zwei reproduzierten Plankonflikte. Das Gate ist absichtlich konservativ und meldet im finalen 20er-Lauf 0 Fälle.

## Gepaarter A/B-Vergleich

Vier eingefrorene Referenzpaarungen A–D liefen mit je drei identischen Seeds und 480er-Limit auf Ausgangsstand und Kandidat.

| Kennzahl                        |       Kontrolle | Kandidat |
| ------------------------------- | --------------: | -------: |
| Spiele                          |              12 |       12 |
| Entscheidungen                  |           2.703 |    2.772 |
| Illegalitäten                   |               0 |        0 |
| Replay-Fehler                   |               0 |        0 |
| Hidden-Info-Funde               |               0 |        0 |
| Aktionslimits                   |               1 |        1 |
| `repeated_no_progress_run`      |              75 |       55 |
| `clearly_dominated_plan_choice` | nicht vorhanden |        0 |

Acht der zwölf Seeds sind zustandsidentisch. Vier reagieren auf die Strategieänderung; bei dreien bleibt der Sieger gleich, bei A/Seed 01 kippt der Sieger von Runner zu Korp. Das eine 480er-Spiel A/Seed 03 bleibt auf beiden Ständen bestehen. Damit gibt es keine Verschlechterung der harten Technikgates und weniger No-Progress-Funde, aber auch keinen Beleg für eine universelle Winrate-Verbesserung.

## Regel- und Timing-Audit

Der finale Lauf hat 20 verschiedene Aktionstypen an 12 Timingpunkten ausgeführt. Dazu gehören unter anderem Start/Continue/Jack-out-Fenster, Encounter-Break/Pump, Access/Trash/Steal, Rez/Decline-Rez, Install/Advance/Score, Choices, Discard und Checkpoint. Für alle 4.812 Entscheidungen stimmen protokollierter ActionType und resultierender EventType überein.

Harte Laufzeitbefunde:

- 0 illegale Aktionen und 0 `no_legal_action_failure`
- 0 Replay-Abweichungen; alle finalen StateHashes reproduzierbar
- 0 verpasste Scorefenster und 0 passive Aktionen bei vorhandener Scorelinie
- 0 unsichere Scoreentscheidungen
- 0 Hidden-Information-Marker; Export redaction-safe

Statische und testbasierte Abdeckung:

- alle 32 eindeutigen Identitäten/Karten der beiden Decks sind in Engine-Tests referenziert
- vollständige Engine-Suite: 179 Testdateien, 1.598 Tests, alle grün
- Classic: 52/52 CardImplementations vorhanden, keine Manifest-/Registry-Drifts
- Proteus: 154/154 CardImplementations vorhanden, keine Manifest-/Registry-Drifts
- vollständige KI-Suite: 275 Testdateien, 1.750 Tests, alle grün
- Workspace-Typecheck und alle AI-Checks grün

Diese Evidence zeigt, dass die Spiele innerhalb der NETGRID-Engine regelkonform abliefen und die konkret ausgeübten Pfade breit regressionsgeschützt sind. Nicht bewiesen ist, dass die Engine jeden denkbaren Randfall exakt wie ein externes vollständiges Regelwerk interpretiert. Ein solcher Anspruch bräuchte einen unabhängigen, kartentextweisen Soll-Ist-Audit außerhalb derselben Implementierungs- und Testsphäre.

## Offene strategische Aussage

Der aktuelle Stand ist für diese Aufgabe abnahmefähig, aber nicht „fertig optimiert“. Ein sinnvoller neuer, freigabepflichtiger Analysezyklus wäre:

1. die 218 No-Progress-Run-Hinweise nach tatsächlichem Payoff und Run-Mikroschritten neu zu clustern;
2. den Siegerwechsel A/Seed 01 zugweise gegen die Kontrolle zu erklären;
3. das unveränderte 480er-Spiel A/Seed 03 als eigenes Long-Game-Paket zu analysieren.

Diese Punkte wurden nicht automatisch umgesetzt, weil sie neue Befunde außerhalb der vier freigegebenen Maßnahmen sind.
