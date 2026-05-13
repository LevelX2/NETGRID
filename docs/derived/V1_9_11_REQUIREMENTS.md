# V1.9.11 Requirements - Hidden-Zone Search, Reveal, Reorder und Shuffle

Status: frozen
Stand: 2026-05-12

## Must Requirements

| ID | Requirement | Testspur |
| --- | --- | --- |
| V1911-MUST-001 | Der Release betrifft exakt die 16 Karten aus `V1_9_11_DETAILED_PLAN.md`. | Catalog/Manifest |
| V1911-MUST-002 | Keine Karte außerhalb des V1.9.11-Scopes wird neu `human_playable`, `deck_legal` oder `ai_supported`. | Catalog no-promotion test |
| V1911-MUST-003 | Search-, Reveal-, Reorder- und Shuffle-Effekte laufen über Engine-Resolver, nicht über Datenimport oder UI-Logik. | Engine unit tests |
| V1911-MUST-004 | Alle neuen PlayerActions stammen aus LegalActions oder PendingChoices. | Engine stale/illegal tests |
| V1911-MUST-005 | `applyAction` revalidiert Side, actionId, stateVersion, Timingpunkt, Kosten, Targets und Choices. | Engine illegal-action tests |
| V1911-MUST-006 | Hidden-Zone-Choices zeigen Kartenidentitäten nur der berechtigten Side. | Visibility tests |
| V1911-MUST-007 | PublicEvents enthalten keine verdeckten gegnerischen Kartentitel, IDs oder Reihenfolgen. | Visibility/PublicEvent tests |
| V1911-MUST-008 | Reconnect- und Undo-Preview-Payloads bleiben ohne Hidden-Info-Leak. | Server/Web visibility tests |
| V1911-MUST-009 | Search/Reorder/Shuffle erzeugen deterministische Replay-/StateHash-Ergebnisse. | Replay/StateHash tests |
| V1911-MUST-010 | Shuffle und Reorder invalidieren side-safe Known-Position-Memory deterministisch. | AI/Belief tests |
| V1911-MUST-011 | KI beantwortet neue Choices nur aus PlayerView, LegalActions und side-sicheren AI-Hints. | AI smoke tests |
| V1911-MUST-012 | Manifest, Mechanics-Coverage, Szenarien und AI-Hints referenzieren dieselbe 16er-Zielmenge. | Catalog/data tests |
| V1911-MUST-013 | Webclient-Version wird erst beim Releaseabschluss auf `V1.9.11` angehoben. | Final Review |

## Should Requirements

| ID | Requirement |
| --- | --- |
| V1911-SHOULD-001 | Gemeinsame Helper für V0.98- und ONR-v1-Hidden-Zone-Resolver vermeiden doppelte Choice-Logik. |
| V1911-SHOULD-002 | Test-Fixtures decken mindestens einen Runner-Stack-Search-, einen Reveal/Expose- und einen Corp-Hidden-Zone-Fall ab. |
| V1911-SHOULD-003 | KI-Fallback wählt bei mehreren legalen Optionen deterministisch und ohne verdeckte Wertannahmen. |

## No Scope

- Keine V1.9.12 Counter-/Virus-/Recurring-Freigabe.
- Keine V1.9.13 Damage-/Prevention-/Replacement-Freigabe.
- Keine V1.9.14 Trace-/Tag-Freigabe.
- Keine V1.9.15 Run-Flow-/Multiaccess-Freigabe.
- Keine V2.x-Produktfunktionen, Public-Plattform, offiziellen Assets, externen Kartendatenbanken oder Kartentextparser als Regelautorität.
