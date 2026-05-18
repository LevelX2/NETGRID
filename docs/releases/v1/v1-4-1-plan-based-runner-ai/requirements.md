# V1.4.1 Requirements - Planbasierte Runner-KI

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.4.1 führt eine planbasierte Runner-KI ein. Die Runner-KI bewertet Run-, Rig-, Economy- und Remote-Contest-Pläne aus erlaubten Projektionen und wählt daraus eine LegalAction.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V141-MUST-001 | V1.4.1 startet erst nach grünem V1.4.0-Final-Gate. |
| V141-MUST-002 | Runner-Pläne sind eigene deterministische Entscheidungseinheiten. |
| V141-MUST-003 | Jeder Runner-Plan referenziert nur aktuelle LegalActions oder daraus abgeleitete legale PlanSteps. |
| V141-MUST-004 | Die ausgeführte Aktion bleibt eine normale PlayerAction und wird von `applyAction` erneut validiert. |
| V141-MUST-005 | PlanGenerator nutzt nur Runner PlayerView, LegalActions, side-gefilterte PublicEvents, eigenes Deckrollenprofil und AI-Hints. |
| V141-MUST-006 | Die Runner-KI erhält keinen Full GameState und keine verdeckten HQ-, R&D- oder Remote-Kartenidentitäten. |
| V141-MUST-007 | Es gibt Planarten für `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`. |
| V141-MUST-008 | RunnerRigEvaluator bewertet Breakerrollen, MU, Credits und installierte Programme aus erlaubten Daten. |
| V141-MUST-009 | RunCostEstimator nutzt nur sichtbares/rezzed ICE, bekannte Rollen, Credits und sichere Risikoannahmen. |
| V141-MUST-010 | ServerAccessValueEvaluator bewertet Serverwert ohne versteckte Kartentitel. |
| V141-MUST-011 | RemoteThreatEvaluator bewertet Remote-Gefahr aus Advance-Stand, sichtbaren Karten und PublicEvents. |
| V141-MUST-012 | CorpScoringThreatEvaluator nutzt nur sichtbare Agenda-/Board-/Creditdaten. |
| V141-MUST-013 | Jack-out-Fenster werden als legale Planentscheidungen berücksichtigt. |
| V141-MUST-014 | Asset-Trash-Bewertung nutzt nur sichtbare Assets/Upgrades und bekannte Trash-Kosten. |
| V141-MUST-015 | Karten ohne Runner-AI-Hints oder `ai_supported` werden nicht strategisch vorausgesetzt. |
| V141-MUST-016 | DecisionDebug erklärt Runner-Pläne side-sicher und nennt Unsicherheit, statt Hidden-Info zu behaupten. |
| V141-MUST-017 | Server-Zeitbudget und legaler Fallback verhindern Hänger. |
| V141-MUST-018 | Corp-Rezfenster und Runner-KI-Pacing bleiben robust. |
| V141-MUST-019 | Szenarien decken R&D-Druck, HQ-Druck, Remote-Contest, Rig-Aufbau, Economy Recovery, Asset-Trash und Safe Probe Run ab. |
| V141-MUST-020 | Negativszenarien prüfen, dass Runner-KI definierte sinnlose Runs vermeidet. |
| V141-MUST-021 | Runner-KI wird gegen Random/Basic Corp und planbasierte Corp-KI smoke-getestet. |
| V141-MUST-022 | Hidden-State-Invariance prüft gleiche Entscheidung bei gleicher sichtbarer Projektion. |
| V141-MUST-023 | V1.4.0-Corp-Plan-KI regressiert nicht. |
| V141-MUST-024 | No-Scope-Regression bestätigt: kein Belief State, keine FullState-Simulation, keine neuen Karten, keine neue Mechanik, kein LLM-Regelakteur. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V141-SHOULD-001 | Runner-Benchmarks sollten schlechte Runs, erfolgreiche Contest-Entscheidungen und Rig-Timing messen. |
| V141-SHOULD-002 | DecisionDebug sollte Unsicherheit sichtbar machen, ohne Gegnerkarten zu erraten. |
| V141-SHOULD-003 | Runner-Planprofile sollten versioniert und später tune-bar sein. |

## Gate

`ready_for_implementation_after_V1_4_0: true`

V1.4.1 ist nach erfolgreichem V1.4.0-Gate implementierbar.
