# MVP 0.9 Requirements

Status: Requirements Freeze
Stand: 2026-05-03
Phase: V0.9 stärkere KI

## Kurzentscheidung

V0.9 verbessert die bestehende KI auf dem bestandenen V0.8-Starterset-Slice. Die KI bleibt Controller, nicht Regelautorität: Sie bewertet ausschließlich aktuelle `LegalActions`, die aus side-sicheren `PlayerViews`, side-gefilterten PublicEvents, Difficulty, Seed/Decision-Metadaten sowie manuell versionierten Rollenprofilen abgeleitet werden.

V0.9 baut keinen neuen Kartenpool, keine neue Haupt-UI und keine öffentliche Plattform. Harder AI bedeutet bessere Heuristik, bessere Gewichtung, bessere Erklärung und bessere Regressionstests, nicht mehr Information.

## Eingangsgate

- `MVP_0.8_done: true` ist dokumentiert.
- V0.8-Deck-Snapshots `demo_runner_008_snapshot_v0_8` und `demo_corp_008_snapshot_v0_8` sind validiert.
- V0.8-KI-Smokes sind replaybar und Hidden-Info-sicher.
- Bestehende V0.1- bis V0.8-Checks sind grün.

## Nicht-Ziele

V0.9 baut nicht:

- neue spielbare Karten oder neue Regelmechaniken,
- Kartentextparser oder automatische Regelumsetzung,
- KI mit `GameState`, `cardInstances`, FullState oder privaten Gegnerdaten,
- LLM als Regelakteur oder Action-Generator,
- öffentliche Plattform, Accountsystem, Matchmaking, Rankings oder Cloud Sync,
- V0.10-/V1.0-Stabilisierung.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| V09-MUST-001 | Requirements Freeze | Requirements, Heuristik-, Difficulty-, Explanation-, Soak-Spezifikation, Testmatrix und Requirements Review existieren. | V09-T001 |
| V09-MUST-002 | Unveränderter AI-Input-Contract | AI-Decision-Code nutzt nur `AiDecisionInput`, Rollenprojektionen und side-gefilterte Events; keine FullState-Felder. | V09-T002 |
| V09-MUST-003 | LegalActions-only | Jede KI-Entscheidung referenziert eine aktuelle LegalAction und läuft weiter durch `applyAction`. | V09-T003 |
| V09-MUST-004 | Kein Hidden-State-Einfluss | Gleiche sichtbare Projektion erzeugt gleiche Entscheidung, auch wenn verdeckte gegnerische Karten variieren. | V09-T004 |
| V09-MUST-005 | Kartenrollenmanifest | Kartenrollen sind versioniert, manuell gepflegt und nicht aus Kartentext geparst. | V09-T005 |
| V09-MUST-006 | Deckrollenprofile | Deckrollen werden deterministisch aus validierten Snapshots und Kartenrollen abgeleitet. | V09-T006 |
| V09-MUST-007 | ObservedFacts | Beobachtete Fakten sind aus side-gefilterten Events rekonstruierbar und enthalten keine private Deckliste. | V09-T007 |
| V09-MUST-008 | Controller Lifecycle | KI-Autoplay stoppt oder pausiert bei Winner, Human-Turn, Pending Undo, stale State, Lock oder Actionlimit. | V09-T008 |
| V09-MUST-009 | Qualitätsmetriken | Simulationssummaries enthalten Fallbackquote, Replaystatus, Reason-Code-Abdeckung, Progress und Coverage. | V09-T009 |
| V09-MUST-010 | Runner-KI-Verbesserung | Runner-Fixtures prüfen bessere Setup-, Run-, Encounter-, Access-, Tag- und Economy-Entscheidungen. | V09-T010 |
| V09-MUST-011 | Corp-KI-Verbesserung | Corp-Fixtures prüfen bessere Score-, Remote-, ICE-, Rez-, Economy- und Tag-Entscheidungen. | V09-T011 |
| V09-MUST-012 | Reason-Code- und Erklärungssicherheit | Jede Entscheidung hat stabilen Reason-Code, sichtbare Evidenz und keine verdeckten Kartendaten. | V09-T012 |
| V09-MUST-013 | Soak- und Regressionstests | Mehrere Seeds, Decks und Difficulties laufen ohne IllegalAction, StateHash-Drift oder Hidden-Info-Leak. | V09-T013 |
| V09-MUST-014 | Tuning-Change-Control | Profile, Golden Seeds, Holdout Seeds und akzeptierte Metrikänderungen sind versioniert. | V09-T014 |
| V09-MUST-015 | Multiplayer-Kompatibilität | Human-vs-KI, KI-vs-Human, KI-vs-KI und Human-vs-Human bleiben serverautoritativ und side-sicher. | V09-T015 |

## Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V09-SHOULD-001 | Hard Difficulty | Hard nutzt bessere Gewichtung und begrenzte sichtbasierte Lookaheads ohne Zusatzwissen. |
| V09-SHOULD-002 | Baseline-Vergleich | V0.9-Summaries vergleichen zentrale Metriken gegen die V0.8-Prioritäts-KI. |
| V09-SHOULD-003 | Coverage-Heatmap | Simulationen weisen Rollen-, Kartenrollen-, Actiontyp- und Reason-Code-Abdeckung aus. |
| V09-SHOULD-004 | Holdout-Seeds | Holdout-Seeds werden getrennt dokumentiert und nicht zum Tuning verwendet. |
| V09-SHOULD-005 | Lernhinweise | Erklärtexte sind kurz, deutsch und aus sichtbarer Evidenz formuliert. |

## Gate-Ergebnis

Die Anforderungen sind ausführbar, testbar und innerhalb des bestehenden AI-/Engine-/Server-Modells umsetzbar.

`ready_for_implementation: true`
