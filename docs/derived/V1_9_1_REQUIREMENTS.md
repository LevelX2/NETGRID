# V1.9.1 Requirements - Mechanikpaket J

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.1 schließt den expliziten Deferred-Überhang aus V1.9.0 durch genau drei Karten:  
`Cockroach`, `Incubator` und `Grubb`.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V191-MUST-001 | V1.9.1 startet erst nach bestandenem V1.9.0-Final-Gate. |
| V191-MUST-002 | Der V1.9.1-Kernkorb enthält exakt 3 neue Runtime-Karten: `onr_v1_013_cockroach`, `onr_v1_034_incubator`, `onr_v1_030_grubb`. |
| V191-MUST-003 | `Cockroach`: bei erfolgreichem HQ-Run werden Cockroach-Counter aufgebaut; ab Schwellenwert `>=2` werden HQ-Discards der Korp deterministisch randomisiert. |
| V191-MUST-004 | `Incubator`: bei erfolgreichem Run werden Incubate-Counter aufgebaut; zu Runner-Start jedes Zuges wird pro Counter deterministisch gewürfelt; bei `6` entsteht ein deterministischer Choice-Pfad für Counter-Transformation. |
| V191-MUST-005 | Counter-Transformation durch Incubator bleibt side-sicher, legal-action-gesteuert und replay/statehash-deterministisch. |
| V191-MUST-006 | `Grubb` ist als Worm-Icebreaker spielbar und unterstützt den remainder-of-run-Stärkepfad ohne globale Breaker-Regression. |
| V191-MUST-007 | Purge-Interaktion mit Virus-Countern bleibt konsistent: Cockroach-/Incubator-Virus-Counter sind vom Purge-Gate erfasst. |
| V191-MUST-008 | Replay-/StateHash-/Visibility-Verträge bleiben grün; keine Hidden-Info-Leaks in PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs oder Errors. |
| V191-MUST-009 | Keine Karte außerhalb des 3er-Kernkorbs wird implizit `human_playable`/`deck_legal` oder `ai_supported`. |
| V191-MUST-010 | Keine V2.x-Funktionen, keine Public-Plattformfeatures, keine zusätzlichen Mechanikfamilien außerhalb des V1.9.1-Kerns. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V191-SHOULD-001 | Cockroach-Randomisierungslogik soll einen eigenen deterministic purpose-Namespace in `randomDrawRecords` nutzen. |
| V191-SHOULD-002 | Incubator-Multiroll und Choice-Auflösung sollen getrennt getestet werden (Roll-Gate vs. Choice-Gate). |
| V191-SHOULD-003 | V1.9.1-Artefakte sollen den Abschluss des V1.9.0-Deferred-Überhangs explizit nachweisen. |

## Gate

`ready_for_implementation_after_V1_9_0: true`

V1.9.1 ist als strikt begrenzter 3-Karten-Release zur Umsetzung freigegeben.
