# Aufgabe 044 - Runner Known-Unbreakable Remote Starts Closeout + Fix

## Kurzfazit

Aufgabe 044 schließt das nach Aufgabe 043 verbliebene Reachability-Risiko: Die 10 `runnerRunStartedAgainstKnownUnbreakableRemotePath`-Fälle waren echte Runner-Action-Auswahlfehler in `safe_probe_run`. Der Plan bewertete einen zentralen oder Archives-Probe-Kontext, `selectPlanAction` konnte innerhalb desselben Plan-Candidates aber eine bekannte unbreakable Remote-Run-LegalAction mit gleicher Standardpriorität auswählen.

Der Fix macht known no-access Runs auch für `safe_probe_run`-Action-Auswahl hart unattraktiv. Remote-trash-, Remote-contest- und Access-Wert bleiben an erreichbaren Access gekoppelt. Der frische 8-Slot-Lauf geht auf `runnerRunStartedAgainstKnownUnbreakableRemotePath = 0` zurück.

## Bezug zu Aufgabe 043

Aufgabe 043 hatte bekannte unpayable Kostenpfade von known-unbreakable Coverage-/ETR-Pfaden getrennt und zentrale HQ/R&D-Multiaccess-Werte an `canReachAccess` gegatet. Der konkrete Data-Wall/HQ-Interface-Fall war geschlossen, aber im 8-Slot-Benchmark blieben 10 bekannte unbreakable Remote-Starts.

## Trace-Sampling

Temporärer Harness: `runMatchProgressionBenchmarkSuite({ includeHoldout: true, maxActions: 160, baselineProfile: "belief_ai_v1_4_2", candidateProfile: "current_candidate" })`. Der Harness wurde nach der Auswertung gelöscht.

Vor dem Fix wurden 10 Candidate-Fälle side-safe extrahiert:

| Slot                    | Fälle | Reason                       |
| ----------------------- | ----: | ---------------------------- |
| `safety_smoke_demo_008` |     6 | `runner.plan.safe_probe_run` |
| `real_scene_pair_2`     |     4 | `runner.plan.safe_probe_run` |

Gemeinsames Muster:

- tatsächliche LegalAction: `start_run` auf `remote_1`
- Klassifikation: known/rezzed ETR-ICE, fehlende Coverage, `canReachAccess = false`
- Decision-Evidence: Plan-Kontext zeigte zentrale/Archives-Probe-Ziele, nicht den Remote als wertvollen Access
- keine Force-Rez- oder First-Probe-Situation
- keine neue sichtbare State-Change-Rechtfertigung

Root-Cause-Verteilung:

| Klasse                                        | Anzahl |
| --------------------------------------------- | -----: |
| `true_unbreakable_remote_run_bug`             |     10 |
| `force_rez_or_probe_misclassified`            |      0 |
| `state_changed_after_prior_block`             |      0 |
| `valuable_remote_but_coverage_repair_missing` |      0 |
| `metric_artifact`                             |      0 |
| `unclassified_needs_more_evidence`            |      0 |

## Implementierter Fix

Der enge Fix sitzt in der Runner-Plan-Action-Auswahl:

- Für `pressure_rnd`, `pressure_hq` und `safe_probe_run` wird jede `start_run`-Action vor der Zielpriorisierung gegen `runnerRunActionIsKnownNoAccess` geprüft.
- Known-unbreakable Remote-Runs erhalten dadurch dieselbe harte Auswahl-Penalty wie bekannte no-access Central-Runs.
- First-Probe gegen unknown/unrezzed ICE bleibt erlaubt, weil diese Pfade nicht als known no-access klassifiziert werden.
- Coverage-Repair-/Economy-/Draw-Alternativen können den known-bad Remote-Run schlagen.

Keine Engine-Regel, keine LegalAction und keine Hidden-Info-Quelle wurde geändert.

## Neue Metriken

Ergänzt wurden Aufgabe-044-spezifische Diagnosezähler:

- `runnerKnownUnbreakableRemoteTraceSampled`
- `runnerKnownUnbreakableRemoteTrueBug`
- `runnerKnownUnbreakableRemoteForceRezOrProbeMisclassified`
- `runnerKnownUnbreakableRemoteStateChanged`
- `runnerKnownUnbreakableRemoteCoverageRepairMissing`
- `runnerKnownUnbreakableRemoteMetricArtifact`
- `runnerKnownUnbreakableRemoteUnclassified`
- `runnerKnownUnbreakableRemoteRunSuppressed`
- `runnerKnownUnbreakableRemoteRunPenalized`
- `runnerKnownUnbreakableRemoteCoverageRepairTaken`
- `runnerKnownUnbreakableRemoteCoverageRepairAvailable`
- `runnerKnownUnbreakableRemoteRunTakenDespiteGate`

## Focus-Tests

Neue Focus-Abdeckung:

- bekannte/rezzed Remote Data Wall blockiert bekannten BBS-Trash, Runner wählt Economy statt Remote-Run
- Repeat-Remote nach known-unbreakable Block bleibt unter Economy
- Remote-Run wird nach installierter Wall-Coverage wieder erlaubt
- unrezzed/unknown Remote-ICE-Probe bleibt nicht known-unbreakable
- sichtbare Wall-Coverage-Repair-Action schlägt known-bad Remote-Run

Zusätzlich bleiben die Aufgabe-043-HQ/Data-Wall-Reachability-Tests aktiv.

## 8-Slot Benchmark

Konfiguration: `includeHoldout: true`, `maxActions: 160`, 8 runnable Slots, Baseline `belief_ai_v1_4_2`, Candidate `current_candidate`.

| Global                | Baseline | Candidate |
| --------------------- | -------: | --------: |
| illegalActions        |        0 |         0 |
| replayFailures        |        0 |         0 |
| timeoutRate Summe     |        0 |         0 |
| actionLimitRate Summe |    2.779 |     2.889 |
| Corp Scores           |       52 |        60 |
| Runner Steals         |      132 |       118 |
| Score+Steal total     |      184 |       178 |

Reachability/Remote:

| Metrik                                                | Candidate |
| ----------------------------------------------------- | --------: |
| `runnerRunStartedAgainstKnownUnbreakableRemotePath`   |         0 |
| `runnerRunStartedAgainstKnownUnbreakableCentralPath`  |         0 |
| `runnerRunStartedAgainstKnownUnpayableFullPath`       |         0 |
| `runnerKnownPathBlockedByMissingCoverage`             |       488 |
| `runnerKnownPathBlockedByKnownEtr`                    |       488 |
| `runnerMultiaccessValueSuppressedNoAccess`            |       317 |
| `runnerRemoteTrashSkippedAffordableRelevant`          |         0 |
| `runnerKnownUnbreakableRemoteRunSuppressed`           |       171 |
| `runnerKnownUnbreakableRemoteCoverageRepairAvailable` |       171 |
| `runnerKnownUnbreakableRemoteCoverageRepairTaken`     |       163 |
| `runnerKnownUnbreakableRemoteRunTakenDespiteGate`     |         0 |
| `runnerRunAllowedAsFirstProbeUnknownIce`              |       197 |

Slotbefunde:

| Slot                                          | Baseline Corp | Candidate Corp | Baseline Steals | Candidate Steals | Unbreakable Remote Starts | Suppressed |
| --------------------------------------------- | ------------: | -------------: | --------------: | ---------------: | ------------------------: | ---------: |
| `safety_smoke_demo_008`                       |             7 |             10 |              14 |               15 |                         0 |         42 |
| `progression_tuning_origin_rig_vs_tax`        |            10 |             11 |              22 |               17 |                         0 |         14 |
| `progression_tuning_origin_pressure_vs_tax`   |            10 |             13 |              27 |               22 |                         0 |         14 |
| `snapshot_holdout_origin_pressure_vs_tag_ops` |             9 |              6 |              19 |               21 |                         0 |          4 |
| `local_realistic_pair_1`                      |             2 |              2 |              10 |                7 |                         0 |         34 |
| `local_realistic_pair_2`                      |             0 |              3 |              19 |               15 |                         0 |          8 |
| `real_scene_pair_1`                           |             8 |              9 |              15 |               15 |                         0 |         29 |
| `real_scene_pair_2`                           |             6 |              6 |               6 |                6 |                         0 |         26 |

## Guardrails

- First-probe unknown ICE bleibt sichtbar: `runnerRunAllowedAsFirstProbeUnknownIce = 197`.
- Known no-access full-path costs bleiben sauber: `runnerRunStartedAgainstKnownUnpayableFullPath = 0`.
- Remote-Trash-Regressionssignal bleibt 0: `runnerRemoteTrashSkippedAffordableRelevant = 0`.
- Cheap-Remote Agenda/Advance bleibt 0/0.
- Multi-ICE future dead order bleibt 0.
- Tag/Punish normalized unknown/suspicious bleibt 0/0.
- Keine Hidden-Info-/Sanitizer-Dumps wurden eingeführt.

## Bewusst nicht geändert

- keine Engine-Regeländerung
- keine neue Legalität und keine Änderung an LegalActions
- keine Profil- oder Default-Umschaltung
- keine Deck- oder Holdout-Optimierung
- keine Änderung an `aiSupportStatus`
- keine manuelle Änderung an `data/ai/ai-card-hints-active.json`
- keine Proteus-/Catalog-Baseline-Korrektur

## Nächster praktischer Schritt

Der Reachability-Komplex ist mit `runnerRunStartedAgainstKnownUnbreakableRemotePath = 0`, `runnerRunStartedAgainstKnownUnbreakableCentralPath = 0` und known-unpayable full-path 0 für diesen Slice geschlossen. Der nächste sinnvolle Live-Hebel ist das separate Corp-Thema: ICE-Portfolio / Rez-Reserve / HQ-overicing.
