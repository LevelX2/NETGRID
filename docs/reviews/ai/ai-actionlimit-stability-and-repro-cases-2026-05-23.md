# AI ActionLimit Stability and Repro Cases - 2026-05-23

## Kurzfazit

Der zusätzliche 160er Seed-Batch bestätigt: Die ActionLimit-Probleme sind echte strategische Endgame-/Conversion-Probleme, aber die dominante Ursache ist nicht stabil genug für einen neuen engen Fix-Slice. Mehrere Slots wechseln zwischen Runner-, Corp- und beidseitiger Dominanz. Deshalb wurde keine Strategie geändert.

Safety bleibt stabil: `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.

## Konfiguration

- Benchmark-Basis: bestehende Match-Progression-Deck-Suite.
- Deckslots: Smoke, Snapshot Rig, Snapshot Pressure, Snapshot Holdout, Frozen Local Pair 1, Frozen Local Pair 2.
- Profile: `belief_ai_v1_4_2`, `current_candidate`.
- `maxActions`: 160.
- Neue Diagnose-Seeds:
  - `ai-actionlimit-stability-2026-05-23-001`
  - `ai-actionlimit-stability-2026-05-23-002`
  - `ai-actionlimit-stability-2026-05-23-003`
  - `ai-actionlimit-stability-2026-05-23-004`
  - `ai-actionlimit-stability-2026-05-23-005`
  - `ai-actionlimit-stability-2026-05-23-006`

Die Zusatzläufe wurden über einen temporären lokalen Vitest-Wrapper gegen die vorhandenen Repo-Deckslots erzeugt. Der Wrapper und die temporäre JSON-Ausgabe wurden danach entfernt.

## Stabilität Je Slot

### Ursprünglicher 160er Lauf

| Slot              | Candidate ActionLimit | Final NoProgress | Dominant R/C/B | Runner Steals | Corp Scores |
| ----------------- | --------------------: | ---------------: | -------------- | ------------: | ----------: |
| Smoke             |                 0.667 |              126 | 2/4/0          |            15 |          10 |
| Snapshot Rig      |                 0.444 |               73 | 1/2/1          |            27 |          10 |
| Snapshot Pressure |                 0.000 |                0 | 0/0/0          |            27 |          11 |
| Snapshot Holdout  |                 0.667 |              115 | 2/3/1          |            26 |           5 |
| Local Pair 1      |                 0.444 |               91 | 4/0/0          |            12 |           6 |
| Local Pair 2      |                 0.444 |               75 | 1/2/1          |            28 |           5 |

### Zusätzlicher Seed-Batch

| Slot              | Profile   | ActionLimit | Final NoProgress | Dominant R/C/B | Closeout R O/A | Closeout C O/A | Pressure | Setup/Eco | Protect | LowRepeat | Runner Steals | Corp Scores | S/S per Match |
| ----------------- | --------- | ----------: | ---------------: | -------------- | -------------: | -------------: | -------: | --------: | ------: | --------: | ------------: | ----------: | ------------: |
| Smoke             | baseline  |       0.500 |               63 | 0/3/0          |            0/0 |            1/0 |       11 |        37 |      14 |         9 |             7 |           8 |         2.500 |
| Smoke             | candidate |       0.500 |               63 | 2/1/0          |           11/1 |            1/1 |       18 |        34 |      12 |        11 |            11 |           5 |         2.667 |
| Snapshot Rig      | baseline  |       0.500 |               54 | 2/1/0          |           10/7 |            7/5 |       20 |        35 |       8 |         5 |            14 |          11 |         4.167 |
| Snapshot Rig      | candidate |       0.333 |               45 | 0/1/1          |            9/5 |            0/0 |       12 |        20 |       8 |         4 |            15 |          10 |         4.167 |
| Snapshot Pressure | baseline  |       0.167 |               16 | 1/0/0          |            0/9 |            1/1 |       14 |         2 |       3 |         1 |            18 |           8 |         4.333 |
| Snapshot Pressure | candidate |       0.333 |               33 | 2/0/0          |          21/17 |            2/2 |       25 |         5 |       5 |         2 |            19 |           9 |         4.667 |
| Snapshot Holdout  | baseline  |       0.667 |               72 | 2/1/1          |          34/25 |            4/3 |       32 |        34 |      13 |         5 |            11 |          11 |         3.667 |
| Snapshot Holdout  | candidate |       0.167 |               16 | 0/0/1          |            2/6 |            3/3 |        9 |         9 |       6 |         1 |            15 |           8 |         3.833 |
| Local Pair 1      | baseline  |       0.667 |               99 | 2/2/0          |            0/3 |            9/7 |       26 |        49 |      13 |        29 |             3 |           5 |         1.333 |
| Local Pair 1      | candidate |       0.500 |               76 | 2/1/0          |            0/1 |            7/6 |       33 |        31 |       8 |        30 |             7 |           2 |         1.500 |
| Local Pair 2      | baseline  |       0.333 |               40 | 1/1/0          |           17/4 |            1/1 |       12 |        30 |       3 |        11 |            20 |           4 |         4.000 |
| Local Pair 2      | candidate |       0.500 |               46 | 2/1/0          |            1/1 |            3/3 |       24 |        42 |       6 |        11 |            18 |           6 |         4.000 |

Alle Zusatzwerte haben `illegalActions = 0`, `replayFailures = 0`, `timeoutRate = 0`.

## Stabilitätsbewertung

| Slot              | Stabilität                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Smoke             | ActionLimit bleibt hoch. Dominanz ist seedabhängig: ursprünglicher Lauf eher Corp-lastig, Zusatzbatch candidate eher Runner/Corp gemischt. Keine eindeutige Fixrichtung.                     |
| Snapshot Rig      | Corp/mixed-Stall bleibt als Muster plausibel. Der ursprüngliche Candidate-Rückschritt bei ActionLimit ist im Zusatzbatch nicht stabil; Candidate ist dort besser als Baseline.               |
| Snapshot Pressure | Nicht stabil. Ursprünglich Candidate `ActionLimitRate = 0`, im Zusatzbatch schlechter als Baseline. Muster im Zusatzbatch ist Runner-seitig mit Path-/Remote-Threat-Signalen.                |
| Snapshot Holdout  | Nicht stabil. Ursprünglich Candidate weiter auffällig, im Zusatzbatch deutlich besser als Baseline.                                                                                          |
| Local Pair 1      | Stabil auffällig. Candidate verbessert Zusatzbatch gegenüber Baseline, aber der Slot bleibt niedrig terminal und zeigt Runner-/Path-/Remote-Threat-Stall plus beidseitige Economy-Schleifen. |
| Local Pair 2      | Seedabhängig. Ursprünglich Candidate besser, Zusatzbatch schlechter bei ActionLimit, aber bessere Corp-Scores. Kein klarer Default-Gewinn.                                                   |

## ActionLimit-Repro-Korpus

Die Sequenzen zählen nur strategische Entscheidungen; `!` markiert keine unmittelbare Progression nach Diagnoseklassifikation.

### Smoke

**Case S1**

- Slot: `safety_smoke_demo_008`
- Seed: `ai-actionlimit-stability-2026-05-23-001`
- Profile: `current_candidate`
- Decks: `demo_runner_008` vs `demo_corp_008`
- Final score: Runner 5 / Corp 0
- Dominant side: Corp in konkreter Sequenz, Metrikbatch insgesamt mixed
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`, `runner_cannot_afford_meaningful_run`, `runner_known_hq_or_remote_info_not_exploited`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `R end! -> C install remote_2! -> C rez remote_2! -> C draw! -> C install remote_1! -> C end! -> R credit -> R credit -> R run remote_1! -> R steal -> R credit -> R end! -> C draw! -> C install remote_1! -> C advance remote_1! -> C end! -> R credit -> R credit -> R credit -> R run remote_1!`
- Summary: Runner findet noch einen Steal, aber beide Seiten fallen danach wieder in Build/Economy/Contest ohne terminale Conversion. Plausibler Fixkorridor nur nach weiterer Bestätigung: Score-/Contest-Conversion nach sichtbarem Endgame-Druck.

**Case S2**

- Seed: `ai-actionlimit-stability-2026-05-23-004`
- Profile: `current_candidate`
- Final score: Runner 2 / Corp 5
- Dominant side: Corp
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`
- Condensed last strategic decisions:
  `R jack_out! -> R end! -> C operation! -> C operation! -> C credit! -> C end! -> R credit -> R run rd! -> C rez rd! -> R remove_tag! -> R credit -> R end! -> C install hq! -> C draw! -> C install remote_1! -> C end! -> R credit -> R draw! -> R draw! -> R install`
- Summary: Corp hat 5 Punkte, aber Endgame-Fenster zeigt Economy/Protection/Install statt Abschluss. Fixkorridor: nur falls stabiler, Corp-Closeout/Score-path-Erhalt.

### Snapshot Rig

**Case R1**

- Slot: `progression_tuning_origin_rig_vs_tax`
- Seed: `ai-actionlimit-stability-2026-05-23-001`
- Profile: `current_candidate`
- Final score: Runner 4 / Corp 0
- Dominant side: Both
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`, `runner_known_hq_or_remote_info_not_exploited`
- Condensed last strategic decisions:
  `C install rd! -> C credit! -> C credit! -> C end! -> R credit -> R run hq! -> R jack_out! -> R credit -> R run rd! -> C rez rd! -> R jack_out! -> R end! -> C install rd! -> C credit! -> C credit! -> C end! -> R credit -> R run hq! -> R jack_out! -> R credit`
- Summary: wiederholte Zentralversuche plus Corp-Central-Protection/Economy. Kein eindeutiger einzelner Fix, weil Zusatzbatch Candidate hier besser als Baseline ist.

**Case R2**

- Seed: `ai-actionlimit-stability-2026-05-23-003`
- Profile: `current_candidate`
- Final score: Runner 6 / Corp 2
- Dominant side: Corp
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`, `runner_known_hq_or_remote_info_not_exploited`
- Condensed last strategic decisions:
  `R jack_out! -> R end! -> R choice! -> C install remote_1! -> C install new_remote! -> C install remote_1! -> C end! -> R run remote_1! -> R steal -> R trash -> R credit -> R run rd -> R jack_out! -> R credit -> R end! -> C credit! -> C credit! -> C install rd! -> C end! -> R run rd`
- Summary: Runner ist nahe am Sieg, aber Corp-Seite erzeugt wenig terminale Score-Gegenlinie.

### Snapshot Pressure

**Case P1**

- Slot: `progression_tuning_origin_pressure_vs_tax`
- Seed: `ai-actionlimit-stability-2026-05-23-001`
- Profile: `current_candidate`
- Final score: Runner 3 / Corp 1
- Dominant side: Runner
- Labels: `corp_protection_without_score_conversion`, `runner_missing_breaker_or_path`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `R run hq -> R jack_out! -> R run hq -> R jack_out! -> R run hq -> R jack_out! -> R end! -> C advance remote_2 -> C score remote_2 -> C install remote_2! -> C advance remote_2! -> C end! -> R run hq! -> C rez hq! -> R jack_out! -> R run hq -> R jack_out! -> R run hq -> R jack_out! -> R run hq`
- Summary: hier ist der alte "Candidate ActionLimit 0"-Befund nicht stabil. Zusatzseeds zeigen Runner-seitige HQ-Repeats/Path-Probleme.

### Snapshot Holdout

**Case H1**

- Slot: `snapshot_holdout_origin_pressure_vs_tag_ops`
- Seed: `ai-actionlimit-stability-2026-05-23-006`
- Profile: `current_candidate`
- Final score: Runner 2 / Corp 5
- Dominant side: Both
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`, `runner_cannot_afford_meaningful_run`, `runner_known_hq_or_remote_info_not_exploited`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `R end! -> C advance remote_1 -> C score remote_1 -> C install hq! -> C install hq! -> C end! -> R credit -> R run hq! -> R jack_out! -> R run rd! -> R run hq -> R jack_out! -> R end! -> C operation! -> C install rd! -> C credit! -> C end! -> R run rd! -> C rez rd! -> R run hq!`
- Summary: Candidate ist im Zusatzbatch deutlich besser als Baseline, aber dieses Repro zeigt weiterhin known-HQ-/Remote-Threat- und Corp-Protection-Signale.

### Local Pair 1

**Case L1-1**

- Slot: `local_realistic_pair_1`
- Seed: `ai-actionlimit-stability-2026-05-23-001`
- Profile: `current_candidate`
- Runner: `local_realistic_runner_blink_pressure_rig_snapshot_v1`
- Corp: `local_realistic_corp_ivory_bastion_snapshot_v1`
- Final score: Runner 0 / Corp 6
- Dominant side: Both
- Labels: `both_sides_economy_loop`, `runner_missing_breaker_or_path`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `R run remote_2! -> R run remote_2! -> R end! -> C advance remote_1 -> C score remote_1 -> C choice! -> C install remote_1! -> C advance remote_1! -> C end! -> R run remote_2! -> R run remote_2! -> R credit! -> R run remote_2! -> R end! -> C advance remote_1! -> C advance remote_1! -> C credit! -> C end! -> C choice! -> R run remote_2!`
- Summary: Local Pair 1 bleibt die stabilste Problemzone. Runner läuft wiederholt denselben Remote-Pfad ohne Conversion; Corp erzeugt Score-Aktivität, aber nicht terminal genug vor Limit.

**Case L1-2**

- Seed: `ai-actionlimit-stability-2026-05-23-005`
- Profile: `current_candidate`
- Final score: Runner 3 / Corp 0
- Dominant side: Both
- Labels: `both_sides_economy_loop`, `corp_protection_without_score_conversion`, `runner_missing_breaker_or_path`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `C draw! -> C install remote_1! -> C end! -> R ability! -> R credit! -> R credit! -> R credit! -> R end! -> C advance remote_1! -> C advance remote_1! -> C advance remote_1! -> C end! -> R ability! -> R credit! -> R credit! -> R credit! -> R end! -> C advance remote_1 -> C operation! -> C advance remote_1`
- Summary: starke Economy-Schleifen und Advance ohne zuverlässige Score-/Contest-Conversion.

### Local Pair 2

**Case L2-1**

- Slot: `local_realistic_pair_2`
- Seed: `ai-actionlimit-stability-2026-05-23-002`
- Profile: `current_candidate`
- Final score: Runner 1 / Corp 4
- Dominant side: Both
- Labels: `both_sides_economy_loop`, `runner_cannot_afford_meaningful_run`, `runner_missing_breaker_or_path`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `C choice! -> C end! -> R run rd! -> C choice! -> R choice! -> R steal -> R ability! -> R remove_tag! -> R credit -> R end! -> C install remote_1! -> C advance remote_1! -> C credit! -> C end! -> R credit -> R ability! -> R credit -> R run rd! -> C choice! -> R choice!`
- Summary: Zusatzbatch kippt gegen Candidate; vor allem Ressourcen-/Path-Probleme und Remote-Threat-Skip-Signale.

**Case L2-2**

- Seed: `ai-actionlimit-stability-2026-05-23-004`
- Profile: `current_candidate`
- Final score: Runner 4 / Corp 4
- Dominant side: Corp
- Labels: `both_sides_economy_loop`, `runner_cannot_afford_meaningful_run`, `runner_missing_breaker_or_path`, `runner_remote_threat_ignored`
- Condensed last strategic decisions:
  `C advance remote_1! -> C credit! -> C advance remote_1! -> C end! -> R run rd! -> R run hq! -> R credit -> R credit -> R end! -> C credit! -> C advance remote_1 -> C credit! -> C advance remote_1 -> C score remote_1 -> C end! -> C choice! -> R run hq! -> R credit -> R credit -> R run hq`
- Summary: Beide Seiten erzeugen Score-/Steal-Aktivität, aber zu wenig terminale Folge.

## Muster

### Stabil

- Safety bleibt sauber.
- Local Pair 1 bleibt auffällig und niedrig-terminal.
- Viele ActionLimits enthalten echte strategische No-Progress-Fenster, keine reinen Mikroaktionsartefakte.
- Economy-/Setup-/Protection-Schleifen tauchen wiederholt auf, aber nicht mit derselben dominanten Seite in allen Slots.

### Seedabhängig

- Snapshot Pressure: ursprünglicher Candidate-Befund war sehr gut, Zusatzbatch schlechter als Baseline.
- Snapshot Holdout: ursprünglicher Candidate blieb auffällig, Zusatzbatch klar besser.
- Local Pair 2: ursprünglicher Candidate besser, Zusatzbatch schlechter bei ActionLimit.
- Snapshot Rig: ursprünglicher Candidate schlechter, Zusatzbatch besser.

### Unklar

- Ob ein einzelner Corp-Score-Path-Fix oder Runner-Path-/Remote-Threat-Fix global hilft.
- Ob Local Pair 1 eine echte generische Runner-Conversion-Lücke oder ein Deckpair-Druckproblem ist.
- Ob `endgameCloseoutOpportunitiesRunner` in einzelnen Slots noch zu breit ist, weil Attempts teils höher als Opportunities liegen.

## Empfehlung

Kein Strategie-Fix in diesem Schritt.

Der nächste sinnvolle Schritt ist ein sehr enger Diagnose-/Metrik-Slice:

1. `endgameCloseoutOpportunitiesRunner` und `endgameCloseoutAttemptsRunner` deduplizieren und definitorisch schärfen.
2. Für Local Pair 1 ein Trace-Review der zwei Repro-Seeds `001` und `005` durchführen.
3. Erst danach einen möglichen Fix-Slice schneiden, vermutlich entweder:
   - Runner Path/Remote-Threat Endgame Conversion, falls Local Pair 1 bestätigt wird.
   - oder Corp Score-Path Endgame Conversion, falls Smoke/Rig/Holdout nach deduplizierter Metrik stabil Corp-lastig bleiben.

Ein Release-/Merge-Review bleibt sinnvoll, aber vor Profilaktivierung sollte `current_candidate` nicht als klar besser bewertet werden.
