# V1.4.0 Requirements - Planbasierte Corp-KI

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.4.0 führt eine planbasierte Corp-KI ein. Die KI bewertet mehrere legale Planrichtungen, wählt daraus eine konkrete LegalAction und bleibt vollständig an PlayerView, PublicEvents, LegalActions, eigene Daten und AI-Hints gebunden.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V140-MUST-001 | V1.4.0 startet erst nach grünem V1.3.1-Final-Gate. |
| V140-MUST-002 | Corp-Pläne sind eigene deterministische Entscheidungseinheiten. |
| V140-MUST-003 | Jeder Plan referenziert nur vorhandene LegalActions oder daraus abgeleitete legale PlanSteps. |
| V140-MUST-004 | Die ausgeführte Aktion bleibt eine normale PlayerAction und wird von `applyAction` erneut validiert. |
| V140-MUST-005 | PlanGenerator nutzt nur Corp PlayerView, LegalActions, side-gefilterte PublicEvents, eigenes Deckrollenprofil und AI-Hints. |
| V140-MUST-006 | Die Corp-KI erhält keinen Full GameState und keine verdeckten Runnerdaten. |
| V140-MUST-007 | Difficulty-Profile ändern Bewertungsqualität, Planbreite und Risiko, nicht Informationszugang. |
| V140-MUST-008 | Es gibt Planarten für `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy` und `bait_runner`. |
| V140-MUST-009 | AgendaRiskEvaluator bewertet Scoring-Chancen nur aus erlaubten Daten. |
| V140-MUST-010 | ServerThreatEvaluator bewertet HQ/R&D/Remote-Druck nur aus sichtbarer Historie und Boarddaten. |
| V140-MUST-011 | EconomyReserveEvaluator bewertet Credits, Rez-/Score-Kosten und Economy-Rollen. |
| V140-MUST-012 | IceRezEvaluator bewertet ICE-Rollen und Rez-Kosten ohne versteckte Runner-Rig- oder Handdaten. |
| V140-MUST-013 | ScoringWindowEvaluator bewertet Advance-/Score-Fenster deterministisch. |
| V140-MUST-014 | RemoteIntentMemory nutzt nur eigene und öffentliche Ereignisse, keine versteckten Gegnerdaten. |
| V140-MUST-015 | Kartenrollen kommen aus validierten AI-Hints/Card-Role-Daten und erzeugen keine Spielbarkeit. |
| V140-MUST-016 | Karten ohne `ai_supported` werden nicht in KI-Decks genutzt und nicht strategisch vorausgesetzt. |
| V140-MUST-017 | DecisionDebug nennt Plan-ID, Score, Confidence, sichtbare Gründe, Fallback und Seed side-sicher. |
| V140-MUST-018 | Server-Zeitbudget und legaler Fallback verhindern Hänger. |
| V140-MUST-019 | KI-Smokes decken Score Now, Score Next Turn, Remote Build, HQ/R&D-Schutz und Economy Recovery ab. |
| V140-MUST-020 | Benchmarks vergleichen planbasierte Corp-KI gegen die alte Baseline. |
| V140-MUST-021 | Soaks prüfen keine illegalen Actions, Timeouts, Hänger, Replay-Divergenzen oder Hidden-Info-Leaks. |
| V140-MUST-022 | Human-vs-Corp-KI und KI-vs-KI bleiben spielbar. |
| V140-MUST-023 | Runner-KI bleibt nicht planbasiert in diesem Release. |
| V140-MUST-024 | No-Scope-Regression bestätigt: keine neuen Karten, keine neue Mechanik, kein Belief State, keine FullState-Simulation, kein LLM-Regelakteur. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V140-SHOULD-001 | Benchmark-Metriken sollten Planerfolg, Fallbackrate und Planrollenabdeckung enthalten. |
| V140-SHOULD-002 | DecisionDebug sollte für Playtests verständlich, aber nicht überladen sein. |
| V140-SHOULD-003 | Planprofile sollten versioniert und später tune-bar sein. |

## Gate

`ready_for_implementation_after_V1_3_1: true`

V1.4.0 ist nach erfolgreichem V1.3.1-Gate implementierbar.
