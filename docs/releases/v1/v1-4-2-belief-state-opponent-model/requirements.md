# V1.4.2 Requirements - Belief State und Gegner-Modell

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.4.2 führt einen fairen Belief State für KI-Entscheidungen ein. Er rekonstruiert Fakten und Hypothesen ausschließlich aus erlaubten Seitenprojektionen.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V142-MUST-001 | V1.4.2 startet erst nach grünem V1.4.1-Final-Gate. |
| V142-MUST-002 | Belief State nutzt nur PlayerView, aktuelle LegalActions, side-gefilterte PublicEvents, eigene private Karten, rechtmäßig gesehene gegnerische Karten und Replay-Historie. |
| V142-MUST-003 | Belief State erhält keinen Full GameState und keine echten verdeckten Gegnerkarten. |
| V142-MUST-004 | Belief-Einträge unterscheiden `fact`, `own_private_fact`, `revealed_opponent_fact`, `public_fact`, `hypothesis` und `unknown`. |
| V142-MUST-005 | Memory-Rekonstruktion ist deterministisch für dieselbe side-sichere Historie. |
| V142-MUST-006 | Undo und Reconnect rekonstruieren Memory neu statt stale Memory blind weiterzunutzen. |
| V142-MUST-007 | DecisionDebug zeigt Hypothesen und Unsicherheit, aber keine private Wahrheit. |
| V142-MUST-008 | Corp-KI erhält RunnerThreatModel, RunnerAggressionMemory, BreakerAvailabilityEstimate, RemoteContestProbability, HQPressureEstimate und RNDPressureEstimate. |
| V142-MUST-009 | Runner-KI erhält CorpPlanEstimate, RemoteCardBelief, UnrezzedIceRiskModel, HQAgendaDensityEstimate, RNDValueEstimate und CorpCreditReserveInterpretation. |
| V142-MUST-010 | RemoteCardBelief modelliert unbekannte Remote-Karten als Hypothesen, nicht als Titel. |
| V142-MUST-011 | UnrezzedIceRiskModel nutzt nur sichtbare Position, Rez-Historie, Kosten-/Rollenhinweise und erlaubte AI-Hints, keine unrezzed ICE-Titel. |
| V142-MUST-012 | Archives-, Reveal- und Expose-Informationen werden nach bestehenden Visibility-Regeln korrekt als Fakten oder unbekannt geführt. |
| V142-MUST-013 | Search-, Arrange-, Shuffle- und Move-Events invalidieren betroffene Hypothesen deterministisch. |
| V142-MUST-014 | `rnd_access_freshness` wertet wiederholte R&D-Runs auf dieselbe bekannte unveränderte Toplage ab. |
| V142-MUST-015 | `rnd_access_freshness` wird nach Corp-Draw, Shuffle, Arrange, Swap, Steal, Trash, Remove-from-game oder R&D-Move invalidiert. |
| V142-MUST-016 | Hidden-State-Invariance beweist gleiche KI-Entscheidung oder gleiche deterministische Unsicherheit bei gleicher sichtbarer Projektion. |
| V142-MUST-017 | Belief State ändert keine Engine-Regeln, keine LegalActions und keine Replay-/StateHash-Berechnung echter Spiele. |
| V142-MUST-018 | Keine neuen Karten, Mechaniken, `ai_supported`-Freigaben, Simulation, Selfplay, Replay-UI, Tutorial-UI oder Public-Plattformfunktionen werden eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V142-SHOULD-001 | Belief-Einträge sollten eine `sourceEventId` oder gleichwertige side-sichere Herkunft tragen. |
| V142-SHOULD-002 | DecisionDebug sollte die wichtigsten Invalidierungsgründe nennen. |
| V142-SHOULD-003 | Memory-Versionierung sollte spätere Replay-Analyse vorbereiten. |

## Gate

`ready_for_implementation_after_V1_4_1: true`

V1.4.2 ist nach V1.4.1 bereit für Umsetzung.
