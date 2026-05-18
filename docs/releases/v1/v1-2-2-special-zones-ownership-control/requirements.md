# V1.2.2 Requirements - Special Zones, Ownership und Control

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.2.2 implementiert Sonderzonen und Kartenkontrolle als enges Engine-Gate. Es schafft die Grundlage fuer spaetere Kartenfamilien, ohne neue Runtime-Karten freizugeben.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V122-MUST-001 | V1.2.2 startet erst nach gruenem V1.2.1-Gate. |
| V122-MUST-002 | `set_aside` ist als kanonische Spezialzone oder kanonischer ZoneState modelliert. |
| V122-MUST-003 | `removed_from_game` ist als kanonische Spezialzone oder kanonischer ZoneState modelliert. |
| V122-MUST-004 | Jede CardInstance befindet sich zu jedem Zeitpunkt in genau einer kanonischen ZoneRef. |
| V122-MUST-005 | Owner und Controller sind getrennte Konzepte im CardInstance-Vertrag. |
| V122-MUST-006 | Ownership bleibt in V1.2.2 unveraenderlich. |
| V122-MUST-007 | Control-Wechsel veraendert nur den Controller, nicht den Owner. |
| V122-MUST-008 | Control-Wechsel wird als deterministische Engine-Transition modelliert. |
| V122-MUST-009 | Control-Wechsel ueber LegalActions/PlayerActions wird in `applyAction` fuer Side, actionId, StateVersion, Quelle, Ziel, Controller und Timingpunkt revalidiert. |
| V122-MUST-010 | Spezialzonen-Moves werden atomar ausgefuehrt und entfernen die Karte aus der Ursprungszone. |
| V122-MUST-011 | Moves nach Set Aside und Removed from Game erzeugen EventLog-Eintraege mit redigierter Public-Projektion. |
| V122-MUST-012 | Optionaler Rueckkehrpfad aus Set Aside ist nur test-only erlaubt und erzeugt keine Runtime-Kartenfreigabe. |
| V122-MUST-013 | Removed from Game ist in V1.2.2 terminal, sofern kein test-only Harness explizit anderes prueft. |
| V122-MUST-014 | Host-/Trash-Kaskaden bleiben bei kontrollierten Karten deterministisch und invariantensicher. |
| V122-MUST-015 | Gehostete Karten behalten Owner/Controller-Felder nach klar definiertem Vertrag. |
| V122-MUST-016 | PlayerViews zeigen Spezialzonen nur nach Sichtbarkeitsklasse. |
| V122-MUST-017 | PublicEvents leaken keine verdeckten Spezialzonen-Kartenidentitaeten. |
| V122-MUST-018 | WebSocket-Payloads werden aus side-sicheren PlayerViews abgeleitet. |
| V122-MUST-019 | Reconnect waehrend oder nach Spezialzonen-Moves stellt side-sichere Zone- und Controllerprojektionen wieder her. |
| V122-MUST-020 | Undo vor und nach Set Aside, Removed from Game und Control-Wechsel ist definiert. |
| V122-MUST-021 | Neue Hidden-Info aus Spezialzonen oder Control-Wechsel setzt eine Undo-Barriere. |
| V122-MUST-022 | Replay rekonstruiert Zone-Move, Control-Wechsel, EventLog und Endzustand deterministisch. |
| V122-MUST-023 | StateHash unterscheidet unterschiedliche ZoneRefs und Controller stabil. |
| V122-MUST-024 | Alte Replays/Snapshots bleiben baseline-kompatibel oder werden mit klarer Migrations-/Baseline-Regel behandelt. |
| V122-MUST-025 | KI-Inputs enthalten keine zusaetzlichen Hidden-Zone-Daten. |
| V122-MUST-026 | KI darf Special-Zone- oder Control-Actions nur aus LegalActions waehlen. |
| V122-MUST-027 | Ohne AI-Hints muss KI Spezialzonenfenster legal passen oder fallbacken. |
| V122-MUST-028 | `AiDecisionDebug` nennt nur side-sichere Zone-, Owner- und Controllerdaten. |
| V122-MUST-029 | Keine neue Runtime-Karte wird durch V1.2.2 promoted. |
| V122-MUST-030 | Keine KI-Deckliste wird durch V1.2.2 erweitert. |
| V122-MUST-031 | MechanicSupport wird granular fuer `special_zones.set_aside`, `special_zones.removed_from_game`, `card_control.controller` und `card_control.control_change_limited` vorbereitet. |
| V122-MUST-032 | V1.2.3-Kartenkandidaten werden nur vorbereitet, nicht freigegeben. |
| V122-MUST-033 | No-Scope-Regression bestaetigt: keine Format-/Deckbuilding-Regeln, keine Public-Plattformfeatures, keine offiziellen Assets, kein Kartentextparser. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V122-SHOULD-001 | ZoneRefs sollten so gestaltet sein, dass spaetere weitere Spezialzonen ohne neues Grundmodell moeglich sind. |
| V122-SHOULD-002 | EventLog-Eintraege sollten fuer Debug und Review lesbar bleiben, waehrend PublicEvents redigiert sind. |
| V122-SHOULD-003 | Control-Wechsel sollte spaeter fuer AI-Hints nutzbar sein, ohne KI-Informationszugang zu erweitern. |
| V122-SHOULD-004 | Implementation Review sollte eine Liste blockierter Kartenfamilien fuer V1.2.3 oder spaeter enthalten. |

## Gate

`ready_for_implementation: true`

V1.2.2 ist implementierbar, sobald V1.2.1 final gruen ist.
