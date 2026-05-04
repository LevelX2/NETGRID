# MVP 0.97 Detailed Plan - Run, Jack-out, Breach und Multiaccess

Status: detaillierte Planungsfassung, keine Implementierung
Stand: 2026-05-04

## Kurzentscheidung

V0.97 bildet M6 ab und vertieft den Run-Pfad. Der aktuelle Single-Access-Run wird in Richtung echter Breach- und Access-Sequenzen erweitert: Jack-out an freigegebenen Timingpunkten, ein expliziter Breach-State, Access-Queue und Multiaccess für R&D, HQ, Archives und Remote. Das Gate ist sehr Hidden-Info-sensibel und darf nur auf dem V0.93-Event-/Choice-Fundament aufbauen.

V0.97 implementiert keine Access-Replacement-, Prevention-, Search-, Hosting- oder Identity-Mechaniken. Additional Access darf nur als enges Testfixture oder lokale freigegebene Karte entstehen, wenn Requirements und Tests das ausdrücklich abdecken.

## Voraussetzungen

- V0.93 M1-Fundament ist abgeschlossen.
- V0.94 Damage und V0.95 Resources sind abgeschlossen oder bewusst aus der Reihenfolge herausgelöst.
- V0.96 Trace hat die Choice-Pipeline nicht beschädigt oder ist bewusst aus dem V0.97-Scope ausgeklammert.
- Bestehende Run-, Encounter-, Breaker-, Rez-, Access-, Steal- und Trash-Regressionen laufen grün.
- Archives-/facedown-Fragen aus `SETUP_GAME_END_0.93_SPEC.md` wurden vor Requirements-Freeze fachlich geklärt.
- CR-v26.03-Jack-out-, Breach- und Access-Reihenfolge wurde gegen die lokale Umsetzung geprüft.

## Ziele

- `RunState` so erweitern, dass Breach und Access nicht mehr nur über ein einzelnes `accessedCardId` laufen.
- Jack-out als konkrete LegalAction nur an freigegebenen Timingpunkten anbieten.
- `BreachState` mit Access-Queue, aktuellem Access und Abschlussstatus planen.
- Multiaccess für R&D, HQ, Archives und Remote als deterministische Engine-Sequenz planen.
- Hidden-Info-Barrieren für jeden neuen Informationskontakt absichern.
- UI, Multiplayer, Replay, StateHash und AI auf mehrere Access-Schritte vorbereiten.

## Nicht-Ziele

- Keine vollständige offizielle Priority-Maschine im Run.
- Keine Access-Prevention, Access-Replacement oder "cannot access" Sonderfälle.
- Keine Karten, die Zugriffsreihenfolge aus versteckten Zonen manipulieren, außer als isoliertes Testfixture.
- Keine Search/Reveal/Expose/Arrange-Mechaniken.
- Keine Public-Replay-Plattform.
- Keine UI-Regelableitung: UI zeigt nur Engine-State und LegalActions.

## Vorgeschlagene Shared-/Engine-Erweiterungen

| Bereich | Vorgabe |
|---|---|
| `RunState` | Bestehende Felder beibehalten, `breach?: BreachState`, `jackOutWindow?: boolean`, optional `passedIceIds`. |
| `BreachState` | `breachId`, `serverId`, `source`, `accessMode`, `queue`, `currentIndex`, `completed`, `accessedSummaries`. |
| `AccessQueueEntry` | Interner Eintrag mit Zone, InstanceId, Ursprung, Hidden-Info-Klasse und Status `pending/accessed/trashed/stolen/declined/skipped`. |
| Action Types | Mögliche neue Typen: `jack_out`, `breach_access_next`, `finish_breach`; bestehende `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash` kompatibel halten, wo sinnvoll. |
| Randomness | HQ-Multiaccess nutzt RandomDrawRecords ohne Replacement. |
| Archives | Faceup/facedown-Sichtbarkeit wird explizit im Access-Entry und PlayerView-Filter modelliert. |
| Events | `jack_out`, `breach_started`, `access_card`, `breach_completed` mit Visibility-Klasse. |

## Run- und Breach-Ablauf

Empfohlener Ablauf:

1. Run startet wie bisher mit Zielserver.
2. ICE werden wie bisher approached und encountered.
3. Nach freigegebenen Pass-/Approach-Fenstern kann `jack_out` legal sein.
4. Bei erfolgreichem Run erzeugt Engine einen Breach-State.
5. Engine baut Access-Queue abhängig vom Server und Access-Anzahl.
6. Jede Access-Entscheidung wird als eigener Schritt über LegalActions resolved.
7. Steal/Trash/Decline bleiben explizite Aktionen.
8. Nach letzter Queue-Position beendet Engine Breach und Run.

Jack-out-Startscope:

- Legal nur in klar dokumentierten Fenstern.
- Nicht während bereits offener Access- oder Hidden-Info-Choice.
- Nicht nach Beginn einer Breach-Queue.

Multiaccess-Startscope:

- R&D: Top N in Reihenfolge, aber nur der aktuelle Access wird sichtbar.
- HQ: N zufällige Karten ohne Replacement über RandomDrawRecords.
- Archives: Access-Queue aus legal zugänglichen Archives-Karten, faceup/facedown mit Filterregeln.
- Remote: Root-Karten und Agenda/Asset/Upgrade entsprechend lokalem Modell; kein komplexes Access-Replacement.

## Integration in bestehende Mechanismen

| Mechanismus | Integration |
|---|---|
| Basic Run | Bestehender Run bleibt Regression; Single-Access ist ein Breach mit Queue-Länge 1. |
| EventVisibilityClass | Jeder Access aus versteckter Zone ist `hidden_info_barrier`. |
| RandomDrawRecords | HQ-Multiaccess und zufällige Auswahl nutzen bestehende deterministische Randomness. |
| `pendingChoice` | Nur verwenden, wenn eine Access- oder Reihenfolgeentscheidung tatsächlich eine Choice braucht. |
| Undo | Nach erstem Hidden-Info-Access blockiert; vor Breach nur nach bestehender Serverregel. |
| AI | AI sieht nur Breach-legalActions und öffentliche/own PlayerView-Daten. |
| UI | UI rendert Access-Queue-Zustand aus PlayerView, ohne verdeckte IDs im DOM. |

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V097-T001 | Shared Types | `BreachState` und AccessQueue sind additiv und brechen bestehende Run-Imports nicht. |
| V097-T002 | Single Access Regression | Ein normaler R&D-Run verhält sich fachlich wie vor V0.97. |
| V097-T003 | Jack-out Legal | `jack_out` erscheint nur in freigegebenen Timingfenstern. |
| V097-T004 | Jack-out Illegal | Falsche Side, falsches Timing, stale StateVersion und offene Choice werden abgelehnt. |
| V097-T005 | Breach Start | Erfolgreicher Run erzeugt genau einen Breach-State. |
| V097-T006 | R&D Multiaccess | R&D-Queue greift Top N deterministisch in Reihenfolge ab. |
| V097-T007 | HQ Multiaccess | HQ-Queue wählt N verschiedene Karten deterministisch über RandomDrawRecords. |
| V097-T008 | Archives Access | Faceup/facedown Archives-Entries folgen den dokumentierten Sichtbarkeitsregeln. |
| V097-T009 | Remote Access | Remote-Root-Access bleibt deterministisch und kompatibel mit Steal/Trash/Decline. |
| V097-T010 | Hidden-Info-Barriere | Jeder neue Hidden-Info-Access blockiert Undo und leakt keine Queue-IDs. |
| V097-T011 | PublicEvents | PublicEvents nennen Titel nur nach legalem Reveal/Access/Trash/Steal. |
| V097-T012 | PlayerView/DOM | PlayerViews und UI-Payloads enthalten keine verdeckten künftigen Queue-Entries. |
| V097-T013 | Replay/StateHash | Multiaccess replayt mit identischem finalem StateHash. |
| V097-T014 | Multiplayer Reconnect | Reconnect während Breach zeigt nur zulässigen aktuellen Access-State. |
| V097-T015 | AI Contract | AI wählt nur LegalActions und kennt keine künftigen R&D-/HQ-Access-Details. |
| V097-T016 | No Replacement | Keine Access-Replacement-/Prevention-Action wird spielbar. |
| V097-T017 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.97

Vor Implementierung:

- `docs/derived/MVP_0.97_REQUIREMENTS.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/derived/MVP_0.97_TEST_MATRIX.md`
- `docs/derived/MVP_0.97_REQUIREMENTS_REVIEW.md`
- optionale Szenarien `data/scenarios/v097-*.json`

Nach Implementierung:

- `docs/derived/MVP_0.97_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`
- aktualisierte Mechanik-Coverage
- UI-/Multiplayer-Review, falls PlayerView oder WebSocket-Payloads erweitert wurden

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Access-Queue leakt künftige Karten. | Interner Queue-State, side-sichere PlayerView-Serializer, DOM-Leaktests. |
| HQ-Multiaccess ist nicht replaybar. | RandomDrawRecords ohne Replacement und StateHash-Szenarien. |
| Jack-out wird an falschen Fenstern angeboten. | Timing-Tests und CR-Abgleich vor Freeze. |
| UI leitet eigene Regeln ab. | UI darf nur LegalActions/BreachView rendern. |
| Archives-facedown bleibt unklar. | Requirements-Freeze blockieren, bis Sichtbarkeitsregel entschieden ist. |

## Definition of Done

V0.97 ist fertig, wenn Runs mit Jack-out, Breach-State und Multiaccess deterministisch, side-sicher und replaybar funktionieren, bestehende Single-Access-Runs regressionsgeschützt bleiben und keine Access-Replacement-, Search-, Identity- oder Hosting-Mechanik nebenbei freigeschaltet wurde.

