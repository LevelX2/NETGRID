# V1.1.3 Mechanics-AI-Card Baseline Test Matrix

Stand: 2026-05-08
Status: eingefroren

## Dokumentations- und Review-Gates

V1.1.3 enthält keine Implementierungstests. Die Matrix beschreibt prüfbare Planungs- und Konsistenzgates.

| Test-ID | Bereich | Requirement-IDs | Prüfschritt |
| --- | --- | --- | --- |
| V113-T001 | No-Code-Scope | V113-MUST-001 | Review: keine Engine-, Server-, Web-, KI- oder Testimplementierung in V1.1.3-Artefakten beauftragt. |
| V113-T002 | Abschlussstand | V113-MUST-002 | Review: V1.1.2/V1.1.2K bleiben als done referenziert und nicht umgeplant. |
| V113-T003 | Mechanik-Coverage | V113-MUST-003, V113-MUST-004, V113-MUST-005, V113-MUST-006 | Review: Setup, Mulligan, Discard, Handlimit, Core Damage, Full Archives, Event Modification, Replacement und Special Zones sind eingeordnet. |
| V113-T004 | Statusmodell | V113-MUST-007, V113-MUST-008, V113-MUST-009 | Review: Statuswerte und Abhängigkeiten sind eindeutig und widersprechen älteren `playable`/`deck_legal`-Regeln nicht. |
| V113-T005 | Kartenmapping | V113-MUST-010, V113-MUST-011 | Review: alle 52 O:NR-v1-Runtime-Karten sind gelistet; keine weitere Karte wird freigegeben. |
| V113-T006 | KI-Smoke vs AI-Support | V113-MUST-012, V113-SHOULD-001 | Review: vorhandene KI-Smokes sind nicht als `ai_supported` fehlinterpretiert. |
| V113-T007 | AI-Level-Audit | V113-MUST-013, V113-MUST-014, V113-MUST-015, V113-MUST-016 | Review: Level 0 bis 6 haben Status, Lücke und Folgegate. |
| V113-T008 | AI-Hints-Vertrag | V113-MUST-017 | Review: Pflichtfelder decken Rollen, requiredMechanics, Fenster, Risiken, Fallback und Szenarien ab. |
| V113-T009 | DecisionDebug-Vertrag | V113-MUST-018 | Review: Debugschema enthält Baselines, Scores, Confidence, Fallback, Zeitbudget, Seed und Redaction. |
| V113-T010 | Reihenfolge | V113-MUST-019 | Review: V1.2.x vor weiteren K-Releases ist begründet. |
| V113-T011 | Harte Gates | V113-MUST-020 | Review: Hidden Info, Replay, StateHash, LegalActions/applyAction, PlayerViews, WebSocket, Reconnect, Undo und KI-Inputs bleiben Pflicht. |
| V113-T012 | Plattform-/Asset-No-Scope | V113-MUST-021 | Review: keine Accounts, Matchmaking, offiziellen Assets oder externen Kartendatenbanken eingeplant. |
| V113-T013 | Statuspflege | V113-MUST-022 | Review: `CODEX_STATUS.md` und Wissensbasis nennen den neuen Planungsstand. |
| V113-T014 | Handoff | V113-SHOULD-003 | Review: Umsetzungshandoff und Folgeprompt existieren. |

## Regression-Gates für Folgeimplementierungen

Diese Gates müssen in V1.2.0 und V1.2.1 fortgeführt werden:

| Gate-ID | Gate | Erwartung |
| --- | --- | --- |
| V113-FG-001 | Hidden Info | Keine verdeckten Karten in PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs, Fehlern, DOM oder KI-Inputs. |
| V113-FG-002 | Replay/StateHash | Jede neue Event-/Choice-Transition replayt deterministisch bis zum gleichen StateHash. |
| V113-FG-003 | LegalActions/applyAction | Jede neue Wahl kommt aus LegalActions und wird in applyAction erneut validiert. |
| V113-FG-004 | Multiplayer/Reconnect | PendingChoice- und Eventfenster werden side-sicher wiederhergestellt. |
| V113-FG-005 | Undo | Neue Hidden-Info-Barrieren blockieren Undo; öffentliche Fenster dokumentieren ihr Undo-Verhalten. |
| V113-FG-006 | KI | KI wählt nur LegalActions, nutzt PlayerView/eventTail und hat legalen Fallback. |
| V113-FG-007 | Kartenstatus | Keine neue Karte wird ohne Statusmodell und Gates spielbar oder KI-supported. |

## Gate-Auswertung

V1.1.3 gilt als abgeschlossen, wenn alle V113-T-Gates im Requirements Review auf pass stehen. Da keine Implementierung erfolgt, gibt es keinen Build- oder Testlauf als Pflichtbestandteil dieses Releases.
