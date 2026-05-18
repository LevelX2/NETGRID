# V1.4.3 Requirements - Simulation, Selfplay und Exploit-Regression

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.4.3 führt faire lokale Simulation, Selfplay-Benchmarks und Exploit-Regressionen ein, ohne echten Hidden State zu nutzen.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V143-MUST-001 | V1.4.3 startet erst nach grünem V1.4.2-Final-Gate. |
| V143-MUST-002 | Simulation nutzt Belief State und erlaubte Projektionen, nicht echten Hidden State. |
| V143-MUST-003 | Simulierte GameState-Kopien dürfen echten Matchstate, Storage, EventLog und StateHash nicht verändern. |
| V143-MUST-004 | Simulierte LegalActions werden in jeder hypothetischen Welt neu berechnet. |
| V143-MUST-005 | Simulations-RNG ist deterministisch, seedbar und getrennt vom echten Match-RNG. |
| V143-MUST-006 | ChoiceRequests in Simulation haben Zeitbudget und legalen Fallback. |
| V143-MUST-007 | Karten mit nicht simulierbaren Mechaniken werden aus Simulationsdeckpools ausgeschlossen oder blockierend markiert. |
| V143-MUST-008 | Es gibt versionierte Benchmark-Gegner. |
| V143-MUST-009 | Holdout-Seeds verhindern Tuning auf dieselben Testpartien. |
| V143-MUST-010 | KI-vs-KI-Soak misst illegale Actions, Timeouts, Fallbacks, Winrate, Agenda-Punkte, Spielzüge und Replayfehler. |
| V143-MUST-011 | Exploit-Szenarien werden als dauerhafte Regression-Fixtures gespeichert. |
| V143-MUST-012 | DecisionDebug kritischer Entscheidungen kann für lokale Analyse gespeichert werden, ohne Hidden Info zu leaken. |
| V143-MUST-013 | Tuning-Änderungen werden nur akzeptiert, wenn Holdout-Metriken besser werden oder ein Tradeoff dokumentiert ist. |
| V143-MUST-014 | Simulation darf keine Karte spielbar oder `ai_supported` machen. |
| V143-MUST-015 | Keine Public-Replay-, Spectator-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V143-SHOULD-001 | Soak-Größe sollte mindestens 1.000 Partien oder eine gleichwertige definierte Testmenge sein. |
| V143-SHOULD-002 | Ein stärkeres späteres Gate mit 5.000 Partien sollte vorbereitet, aber nicht erzwungen werden. |
| V143-SHOULD-003 | Reports sollten Beispiel-Replays oder Replay-IDs für auffällige Partien referenzieren. |

## Gate

`ready_for_implementation_after_V1_4_2: true`

V1.4.3 ist nach V1.4.2 bereit für Umsetzung.
