# AI Runner Phase and Local Pair 1 Trace - 2026-05-24

## Kurzfazit

Dieser Slice hat keine Strategie geändert. Die Diagnose schärft nur Runner-Endgame-Closeout-Metriken und rekonstruiert zwei Local-Pair-1-Repro-Fälle.

`endgameCloseoutOpportunitiesRunner` war definitorisch zu breit und konnte mehrere Decision-Fenster derselben sichtbaren Chance zählen. Die Metrik ist jetzt in Raw, Deduped und True getrennt. Der bestehende Summenwert zeigt nun die deduplizierten echten Chancen. Blockierte bekannte Agenda-Fenster werden als False Positive beziehungsweise Skipped-with-Reason sichtbar.

Local Pair 1 Seeds `001` und `005` zeigen keine echte Runner-Closeout-Lücke. In allen vier Profil/Seed-Fällen bleibt `endgameCloseoutOpportunitiesRunnerTrue = 0`. Die Stagnation sitzt vor allem in Runner-Path-/Breaker-Coverage, Remote-Pressure ohne Wertkonversion und Setup/Economy-Schleifen. Ein neuer Strategie-Fix ist auf dieser Basis noch nicht sauber genug; der nächste enge Slice sollte Runner Phase/Breaker-Tutor-Coverage als Diagnose-zu-Strategie-Brücke sein.

## Methode

- Slot: `local_realistic_pair_1`
- Runner: `local_realistic_runner_blink_pressure_rig_snapshot_v1`
- Corp: `local_realistic_corp_ivory_bastion_snapshot_v1`
- Seeds:
  - `ai-actionlimit-stability-2026-05-23-001`
  - `ai-actionlimit-stability-2026-05-23-005`
- Profile:
  - `belief_ai_v1_4_2`
  - `current_candidate`
- `maxActions`: 160
- Quelle: temporärer lokaler Vitest-Trace-Wrapper gegen bestehende Frozen-Snapshots. Der Wrapper und die JSON-Ausgabe wurden nach Auswertung entfernt.

Strategische Entscheidungen wurden wie in der bestehenden Planfolge-Diagnose von Mikroaktionen getrennt. `continue_run`, `access_card`, `mandatory_draw`, ICE-Approach/Encounter und Break/Pump-Fenster wurden nicht als strategische Stall-Aktionen gezählt.

## Endgame-Closeout-Dedupe

### Befund

Der alte Endgame-Runner-Closeout-Zähler hatte drei Schwächen:

1. Bei Runner nahe am Sieg konnte er zu breit über beliebige meaningful-run-Fenster zählen.
2. Mehrere Decision-Fenster derselben bekannten HQ-/Remote-Agenda konnten mehrfach gezählt werden.
3. Blockierte Chancen wurden nicht sauber von echten verfügbaren Closeout-Fenstern getrennt.

### Neue Diagnosewerte

- `endgameCloseoutOpportunitiesRunnerRaw`: alle sichtbaren Closeout-Signal-Fenster.
- `endgameCloseoutOpportunitiesRunnerDeduped`: pro Ziel/Grund deduplizierte Fenster.
- `endgameCloseoutOpportunitiesRunnerTrue`: deduplizierte, nicht durch Credits, Breaker-Coverage oder Post-Run-Reserve blockierte Chancen.
- `endgameCloseoutOpportunitiesRunnerFalsePositive`: deduplizierte Signale, die wegen sichtbarer Blocker keine echte verfügbare Chance waren.
- `runnerCloseoutByKnownHqAgenda`
- `runnerCloseoutByKnownRndTopAgenda`
- `runnerCloseoutByKnownRemoteAgenda`
- `runnerCloseoutByPointsToWin`
- `runnerCloseoutBlockedByCredits`
- `runnerCloseoutBlockedByBreakerCoverage`
- `runnerCloseoutBlockedByPostRunReserve`
- `runnerCloseoutAttempted`
- `runnerCloseoutSkippedWithReason`

Der bestehende Kompatibilitätswert `endgameCloseoutOpportunitiesRunner` entspricht jetzt `endgameCloseoutOpportunitiesRunnerTrue`.

### Definition

Ein Runner-Endgame-Closeout-Signal entsteht nur noch bei side-sicher sichtbarem Punktedruck:

- bekannte HQ-Agenda
- bekannte R&D-Top-Agenda, die als bekannte HQ-Karte angekommen ist
- bekannte Remote-Agenda
- Runner nahe am Sieg plus konkrete Closeout-/Multiaccess-/Interface-/Run-Event-Signale

Generische Central-Runs ohne Memory-, Multiaccess-, Interface- oder echte Closeout-Signale zählen nicht mehr als True Closeout.

## Local Pair 1 Repro 001

### `belief_ai_v1_4_2`

| Feld                        | Wert                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ergebnis                    | ActionLimit, Runner 0 / Corp 6                                                                                         |
| Dominante Seite             | Runner                                                                                                                 |
| Labels                      | Runner setup without conversion, missing breaker/path, remote threat ignored, Corp protection without score conversion |
| Closeout                    | Raw 0, Deduped 0, True 0, Attempted 0                                                                                  |
| Runner Steals / Corp Scores | 0 / 2                                                                                                                  |
| Blocker-Audit               | Breaker-Coverage-Blocker 35, known unaffordable path 3                                                                 |
| Search/Rig                  | search-like 0, rig installs 4                                                                                          |

Runner-Phasen über das Match:

| Phase                  | Entscheidungen |
| ---------------------- | -------------: |
| `setup_breaker_search` |             30 |
| `equipped_pressure`    |             12 |
| `stalled_unknown`      |             14 |
| `setup_economy`        |              3 |
| `setup_rig_install`    |              2 |

Letzte strategische Sequenz, kondensiert:

`R credit -> R run remote_1 -> R run remote_1 -> R run remote_1 -> R end -> C protect R&D -> C build remote_1 -> C advance remote_1 -> C end -> R draw/setup -> R run Archives -> R draw -> R install -> R end -> C economy -> C advance remote_1 -> C protect R&D -> C end -> R draw -> R draw -> R draw -> R install -> R end -> C credit -> C advance remote_1 -> C credit -> C end -> R run remote_1 -> R run remote_1 -> R run remote_1`

Befund: Kein Closeout-Fenster. Der Runner erkennt wiederholt blockierte oder nicht konvertierende Remote-/Path-Lagen, findet aber keine klare Such-/Breaker-Folge. Corp erzeugt Advance-Aktivität, aber das Match endet über Runner-Stagnation.

### `current_candidate`

| Feld                        | Wert                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ergebnis                    | ActionLimit, Runner 0 / Corp 6                                                                        |
| Dominante Seite             | Runner                                                                                                |
| Labels                      | Runner setup without conversion, missing breaker/path, remote threat ignored, both sides economy loop |
| Closeout                    | Raw 0, Deduped 0, True 0, Attempted 0                                                                 |
| Runner Steals / Corp Scores | 0 / 2                                                                                                 |
| Blocker-Audit               | Breaker-Coverage-Blocker 36, known unaffordable path 0                                                |
| Search/Rig                  | search-like 0, rig installs 2                                                                         |

Runner-Phasen über das Match:

| Phase                  | Entscheidungen |
| ---------------------- | -------------: |
| `equipped_pressure`    |             21 |
| `setup_breaker_search` |             16 |
| `stalled_unknown`      |             10 |
| `setup_economy`        |              4 |
| `setup_rig_install`    |              1 |

Letzte strategische Sequenz, kondensiert:

`C end -> R economy -> R run remote_2 -> R run remote_2 -> R run remote_2 -> R end -> C credit -> C advance remote_1 -> C credit -> C end -> R run remote_2 -> R economy -> R run remote_2 -> R run remote_2 -> R end -> C advance remote_1 -> C score remote_1 -> C build remote_1 -> C advance remote_1 -> C end -> R run remote_2 -> R run remote_2 -> R economy -> R run remote_2 -> R end -> C advance remote_1 -> C advance remote_1 -> C credit -> C end -> R run remote_2`

Befund: Candidate macht mehr Remote-Druck, aber er konvertiert nicht. Die Diagnose klassifiziert viele Fenster als `equipped_pressure`, weil Remote-Contest/Pressure formal plausibel wirkt; die Blocker-Signale zeigen aber weiterhin fehlende tatsächliche Path-Konversion.

## Local Pair 1 Repro 005

### `belief_ai_v1_4_2`

| Feld                        | Wert                                                   |
| --------------------------- | ------------------------------------------------------ |
| Ergebnis                    | ActionLimit, Runner 0 / Corp 3                         |
| Dominante Seite             | Both                                                   |
| Labels                      | Runner setup without conversion                        |
| Closeout                    | Raw 0, Deduped 0, True 0, Attempted 0                  |
| Runner Steals / Corp Scores | 0 / 1                                                  |
| Blocker-Audit               | Breaker-Coverage-Blocker 12, known unaffordable path 0 |
| Search/Rig                  | search-like 8, rig installs 4                          |

Runner-Phasen über das Match:

| Phase                  | Entscheidungen |
| ---------------------- | -------------: |
| `setup_economy`        |             18 |
| `stalled_unknown`      |             17 |
| `early_pressure`       |              7 |
| `setup_breaker_search` |              6 |
| `equipped_pressure`    |              6 |
| `setup_rig_install`    |              3 |

Letzte strategische Sequenz, kondensiert:

`C end -> R run HQ -> R draw -> R run HQ -> R install -> R end -> C protect HQ -> C draw -> C build remote_2 -> C end -> R ability/economy -> R run HQ -> C rez HQ -> R draw -> R draw -> R end -> C rez remote_2 -> C operations -> C credit -> C end -> R draw -> R draw -> R draw -> R draw -> R end -> C build remote_1 -> C rez remote_1 -> C draw -> C operation`

Befund: Baseline mischt frühe HQ-Probes, Draw und Economy, aber ohne terminale Konversion. Es gibt Search-/Setup-Signale, jedoch keine klare Folge zu erfolgreich nutzbarem Druck.

### `current_candidate`

| Feld                        | Wert                                                                         |
| --------------------------- | ---------------------------------------------------------------------------- |
| Ergebnis                    | ActionLimit, Runner 3 / Corp 0                                               |
| Dominante Seite             | Runner                                                                       |
| Labels                      | Runner setup without conversion, missing breaker/path, remote threat ignored |
| Closeout                    | Raw 0, Deduped 0, True 0, Attempted 0                                        |
| Runner Steals / Corp Scores | 1 / 0                                                                        |
| Blocker-Audit               | Breaker-Coverage-Blocker 4, known unaffordable path 0                        |
| Search/Rig                  | search-like 12, rig installs 2                                               |

Runner-Phasen über das Match:

| Phase                  | Entscheidungen |
| ---------------------- | -------------: |
| `setup_economy`        |             27 |
| `stalled_unknown`      |             25 |
| `early_pressure`       |             11 |
| `setup_breaker_search` |              4 |
| `setup_rig_install`    |              2 |

Letzte strategische Sequenz, kondensiert:

`C economy -> C economy -> C credit -> C end -> R ability -> R credit -> R credit -> R credit -> R end -> C protect HQ -> C draw -> C build remote_1 -> C end -> R ability -> R credit -> R credit -> R credit -> R end -> C advance remote_1 -> C advance remote_1 -> C advance remote_1 -> C end -> R ability -> R credit -> R credit -> R credit -> R end -> C advance remote_1 -> C operation -> C advance remote_1`

Befund: Candidate findet einen Steal früher im Match, fällt im Endgame aber in eine starke Economy-/Ability-Schleife. Credits sind hoch, dennoch fehlt die Umschaltung in eine konkrete Drucklinie. Das spricht gegen ein weiteres Reserve-/Economy-Feintuning und für eine Phase-Exit-/Coverage-Nutzung-Diagnose.

## Runner-Phasenanalyse

### Stabile Muster

- `closeout` ist in allen vier Repros 0. Local Pair 1 ist kein Closeout-Metrik-Problem.
- Seed `001` ist Runner-Path-/Remote-Pressure-dominiert. Der Runner versucht wiederholt Remote-Linien, aber viele Fenster tragen Breaker-/Path-Blocker.
- Seed `005` ist stärker Setup-/Economy-dominiert. Candidate baut sehr viel Cashpool auf, ohne in Equipped Pressure zurückzuwechseln.
- Search-/Setup-Signale existieren in Seed `005`, aber nicht als erkennbare Breaker-Search-Reaktion in Seed `001`.
- Rig-Installs sind vorhanden, aber sie reichen nicht als Diagnosebeleg, dass die sichtbare Path-Affordability-Lücke geschlossen und danach genutzt wurde.

### Unklare Muster

- Die Phase `equipped_pressure` ist diagnostisch noch grob. Sie erkennt formal plausible Remote-/Central-Pressure, aber noch nicht zuverlässig, ob der Druck nach effektiven Kosten und Breaker-Coverage tatsächlich wertvoll war.
- `setup_breaker_search` nutzt aktuell Trace-Proxies wie Blocker-Signale und Search-/Setup-Gründe. Ein echter Breaker-/Tutor-Coverage-Audit braucht genauere side-safe Diagnosewerte zu sichtbaren ICE-Typen, eigener Hand/Board/Deck-Doctrine und verfügbaren Suchkarten.
- Corp ist in beiden Seeds nicht völlig passiv: Seed `001` scoret Corp zweimal, Seed `005` advanced mehrfach. Der ActionLimit-Auslöser bleibt aber Runner-lastig.

## Breaker-/Tutor-/Coverage-Audit

Aus dem Repro-Trace folgt:

- Seed `001`, Baseline: 35 Breaker-Coverage-Blocker, 3 known-unaffordable-path-Signale, 0 search-like Aktionen, 4 Rig-Installs.
- Seed `001`, Candidate: 36 Breaker-Coverage-Blocker, 0 known-unaffordable-path-Signale, 0 search-like Aktionen, 2 Rig-Installs.
- Seed `005`, Baseline: 12 Breaker-Coverage-Blocker, 8 search-like Aktionen, 4 Rig-Installs.
- Seed `005`, Candidate: 4 Breaker-Coverage-Blocker, 12 search-like Aktionen, 2 Rig-Installs.

Interpretation:

- Die KI erkennt Path-/Breaker-Probleme teilweise bereits als Blocker.
- Sie nutzt Search-/Tutor-artige Linien im Trace nicht stabil als Antwort auf die Blocker, besonders Seed `001`.
- In Seed `005` ist nicht primär fehlende Economy das Problem; Candidate hat sehr hohe Credits, aber bleibt im Setup-/Economy-Modus.
- Es fehlt diagnostisch eine robuste Antwort auf: Welcher sichtbare ICE-Typ blockiert, welche eigene Karte kann ihn lösen, und wann ist Setup fertig genug für Druck?

## Empfehlung

Kein Strategie-Fix in diesem Slice.

Der nächste enge Slice ist gerechtfertigt, aber er sollte nicht pauschal Druck erhöhen. Empfohlen ist:

1. **Runner Breaker/Tutor Coverage Slice**: side-safe Diagnose und kleiner Follow-up-Fix, ob sichtbare ICE-Typen einen fehlenden Breaker markieren und ob verfügbare Search-/Tutor-/Rig-Karten diese Lücke schließen.
2. Danach erst **Runner Phase Exit Slice**: wenn Cashpool und Coverage ausreichend sind, Setup/Economy nicht weiterführen, sondern konkrete Remote-/Central-/Known-Info-Drucklinie prüfen.
3. Kein eigener Closeout-Slice für Local Pair 1: die deduplizierte Closeout-Metrik zeigt dort keine echten Runner-Closeout-Fenster.

`current_candidate` bleibt als Default weiter fraglich. Die Diagnose macht ihn erklärbarer, aber nicht stabil stärker als `belief_ai_v1_4_2`.
