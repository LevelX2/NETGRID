# MVP 0.96 Detailed Plan - Trace, Link und Bidding

Status: historischer Detailplan, durch V0.96 umgesetzt
Stand: 2026-05-04

Hinweis: Dieses Artefakt dokumentiert die Vorplanung vor Requirements Freeze und Umsetzung. Maßgeblich für den aktuellen Stand sind `MVP_0.96_REQUIREMENTS.md`, `TRACE_LINK_BIDDING_0.96_SPEC.md`, `MVP_0.96_IMPLEMENTATION_REVIEW.md` und `MVP_0.96_FINAL_REVIEW.md`.

## Kurzentscheidung

V0.96 bildet M5 ab: Trace, Link und Bidding als erste echte interaktive Corp/Runner-Choice-Sequenz nach dem V0.93-Fundament. Der Scope bleibt eng. Trace wird als serverseitige Sequenz mit `PendingChoice`, Kostenrevalidierung, sichtbaren Credit-Ausgaben, deterministischem Ergebnis und side-sicheren Events geplant. Trace-Erfolge dürfen in V0.96 nur bereits vorhandene oder explizit freigegebene einfache Folgeeffekte auslösen, bevorzugt Tags.

V0.96 startet keine Damage-, Resource-, Multiaccess-, Identity-, Hosting-, Virus-, Prevention- oder Replacement-Mechanik. Bestehende Tag-Mechanik darf als erstes Trace-Ergebnis genutzt werden.

## Voraussetzungen

Vor einem V0.96-Requirements-Freeze muss gelten:

- V0.93-Finalgate ist bestanden und `pendingChoice` ist side-sicher in GameState/PlayerView vorbereitet.
- V0.94 und V0.95 sind abgeschlossen oder bewusst aus der Reihenfolge herausgelöst; Trace selbst braucht Damage nicht, soll aber nicht mit offenen Hidden-Info-Gates vermischt werden.
- Bestehende Tag- und `remove_tag`-Regressionen laufen grün.
- Exakte Trace-/Link-/Bid-Semantik aus CR v26.03 ist vor dem Requirements-Freeze geprüft.
- Die Kostenquellen aus M1 können Credits erneut in `applyAction` revalidieren.
- Keine importierte Trace-Karte wird automatisch `playable` oder `deck_legal`.

## Ziele

- Trace als eigene Engine-Sequenz mit initiierender Quelle, Base Strength, Corp-Bid, Runner-Link, Runner-Bid, Ergebnis und Folgeeffekt planen.
- Link als sichtbaren Runner-Wert einführen, zunächst aus Identity-/Board-/Testfixture-Quellen ableitbar.
- `ChoiceKind: "bid_amount"` für Corp- und Runner-Ausgaben praktisch nutzen.
- Kosten, Side, StateVersion, verfügbare Credits, Max-Bid und Timing für beide Seiten revalidieren.
- PublicEvents so gestalten, dass das Ergebnis und bezahlte Credits nachvollziehbar sind, aber keine verdeckten Karten oder FullState-Daten leaken.
- AI-Profile für Trace-Situationen als LegalActions-only-Entscheider planen.

## Nicht-Ziele

- Keine Damage-Auslösung durch Trace, außer ein späterer Gate-Freeze erlaubt das ausdrücklich.
- Keine Resource-spezifischen Trace-Folgen.
- Keine Hidden-Zone-Search- oder Reveal-Folgen.
- Keine simultanen oder verschachtelten Traces.
- Keine allgemeinen Bidding-Regeln außerhalb von Trace.
- Keine Prevention, Avoid, Interrupts oder Replacement.
- Keine generische UI-Priority jenseits konkreter LegalActions.

## Vorgeschlagene Shared-/Engine-Erweiterungen

| Bereich | Vorgabe |
|---|---|
| `TraceState` | Optionaler State für laufende Trace-Sequenz: `traceId`, Quelle, Controller, Target Side, Base Strength, Corp-Bid, Runner-Link, Runner-Bid, Ergebnisstatus. |
| `TraceResult` | `successful`, `unsuccessful`, `corpStrength`, `runnerStrength`, bezahlte Credits und Folgeeffekt-ID. |
| Link | Additiver Runner-Wert, bevorzugt über `calculateRunnerLink(state)` statt als frei manipulierbares UI-Feld. |
| `EffectCommand` | Neue Commands nur als Plan: `initiate_trace`, `record_trace_bid`, `resolve_trace`, optional `apply_trace_success_effect`. |
| `ChoiceRequest` | Corp-Bid und Runner-Bid als `bid_amount`, Optionen oder Max-Wert aus verfügbaren Credits; keine FullState-Daten. |
| LegalActions | Während Trace nur passende `resolve_choice`-Actions für die zuständige Side. |
| Events | `trace_initiated`, `trace_bid`, `trace_resolved`, `trace_success_effect` mit klarer Visibility-Klasse. |
| AI | Trace-Bid-Policy je Difficulty, nur aus PlayerView, sichtbaren Credits, sichtbarem Link und bekannten Folgeeffekten. |

## Trace-Sequenz

Die V0.96-Sequenz sollte als kleiner State-Automat geplant werden:

1. Ein legaler Effekt startet Trace mit Base Strength und Folgeeffekt.
2. Engine erzeugt Corp-Bid-Choice.
3. Corp beantwortet Choice; `applyAction` revalidiert Side, ChoiceId, StateVersion, Credit-Maximum und Kosten.
4. Engine erzeugt Runner-Bid-Choice mit sichtbarer Corp-Trace-Strength und Runner-Link.
5. Runner beantwortet Choice; `applyAction` revalidiert wie oben.
6. Engine berechnet Ergebnis: Corp Strength gegen Runner Strength.
7. Engine löst nur den freigegebenen Folgeeffekt aus.
8. TraceState wird geschlossen, EventLog und Replay enthalten alle deterministischen Schritte.

CR-Abgleich vor Freeze:

- Ob und wann die ausgegebenen Credits öffentlich werden.
- Reihenfolge und Gleichstandsregel für Erfolg/Misserfolg.
- Ob Runner-Link während der Sequenz aus statischen Modifikatoren abgeleitet oder snapshotartig eingefroren wird.

Empfohlene lokale Vereinfachung:

- Für den ersten Trace-Slice ist der Folgeeffekt `add_tag` ausreichend.
- Link startet bei 0 und kann über eine einfache sichtbare Testquelle oder Identity-Metadaten erhöht werden.
- Keine Karte darf Trace und Damage im selben Gate kombinieren.

## Integration in bestehende Mechanismen

| Mechanismus | Integration |
|---|---|
| M1 `pendingChoice` | Trace nutzt ausschließlich bestehende Choice-Revalidierung; keine zweite Choice-Pipeline. |
| Effect Kernel | Trace wird als Effect-Sequenz modelliert, nicht als UI-Ablauf. |
| Tags | `add_tag` bleibt der bevorzugte erste Trace-Erfolgseffekt. |
| Eventklassifikation | Trace-Bids sind mindestens `public` nach Zahlung; Details der offenen Choice bleiben `private_to_side`, bis beantwortet. |
| Replay/StateHash | Jede Bid-Entscheidung und jeder Kostenabzug muss im EventLog replaybar sein. |
| Multiplayer | WebSocket/Reconnect zeigt nur die aktive Choice für die zuständige Side. |
| AI | AI wählt nur aus LegalActions und kennt keine gegnerische Hand, Deckreihenfolge oder private Choices. |

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V096-T001 | Shared Types | Trace-/Link-Typen sind additiv und brechen bestehende Imports nicht. |
| V096-T002 | Trace Start | Eine freigegebene Trace-Quelle erzeugt genau eine Corp-Bid-Choice. |
| V096-T003 | Choice Gate | Während Corp-Bid offen ist, hat Runner keine Trace-Action. |
| V096-T004 | Corp Bid Validierung | Negative Werte, zu hohe Bids, falsche Side und stale StateVersion werden abgelehnt. |
| V096-T005 | Runner Bid Choice | Nach Corp-Bid entsteht Runner-Bid mit korrektem Link- und Max-Credit-Wert. |
| V096-T006 | Runner Bid Validierung | Zu hohe Runner-Bids, falsche Side und falsche ChoiceId werden abgelehnt. |
| V096-T007 | Kosten | Beide Seiten zahlen exakt die gebotenen Credits und können dadurch nicht negativ werden. |
| V096-T008 | Erfolgreicher Trace | Corp Strength > Runner Strength löst freigegebenen Erfolgseffekt aus. |
| V096-T009 | Fehlgeschlagener Trace | Runner Strength >= Corp Strength löst keinen Erfolgseffekt aus. |
| V096-T010 | Tag-Folgeeffekt | `add_tag` aus Trace nutzt bestehenden Tag-Vertrag und Replay. |
| V096-T011 | Sichtbarkeit | PlayerViews, PublicEvents, WebSocket und Reconnect leaken keine verdeckten Karten oder privaten Optionslisten. |
| V096-T012 | Replay/StateHash | Trace mit gleicher Seed-/Action-Sequenz erzeugt denselben finalen StateHash. |
| V096-T013 | Undo | Undo-Barriere folgt Eventklassifikation; keine Hidden-Info-Barriere wird abgeschwächt. |
| V096-T014 | AI Easy/Normal/Hard | AI-Bids sind legal, difficulty-spezifisch und nutzen nur sichtbare Fakten. |
| V096-T015 | Multiplayer | Idempotency, Reconnect während Corp-Bid und Reconnect während Runner-Bid bleiben side-sicher. |
| V096-T016 | No Scope Creep | Keine Damage-, Resource-, Multiaccess-, Identity-, Hosting- oder Prevention-Mechanik wird freigeschaltet. |
| V096-T017 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.96

Vor Implementierung:

- `docs/derived/MVP_0.96_REQUIREMENTS.md`
- `docs/derived/TRACE_LINK_BIDDING_0.96_SPEC.md`
- `docs/derived/MVP_0.96_TEST_MATRIX.md`
- `docs/derived/MVP_0.96_REQUIREMENTS_REVIEW.md`
- optional `data/scenarios/v096-*.json`

Nach Implementierung:

- `docs/derived/MVP_0.96_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`
- aktualisierte Mechanik-Coverage
- Status- und Wissensbasis-Update

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Trace baut eine zweite Choice-Pipeline. | `pendingChoice` zwingend wiederverwenden. |
| Bids sind race-condition-anfällig. | StateVersion, Side, Idempotency und Reconnect-Smokes. |
| AI nutzt verdeckte Informationen für Bids. | AI-Vertragstest mit Hidden-Info-Invarianz. |
| Trace-Folgeeffekte ziehen andere Gates hinein. | In V0.96 nur Tag oder eng freigegebener öffentlicher Effekt. |
| Link wird unklar berechnet. | `calculateRunnerLink` mit sichtbaren Quellen und Snapshot-Regel im Spec. |

## Definition of Done

V0.96 ist fertig, wenn Trace als deterministische, side-sichere Choice-Sequenz funktioniert, Link korrekt in die Runner-Stärke eingeht, Bids kosten- und zustandsvalidiert sind, Replay/StateHash/AI/Multiplayer-Gates bestehen und keine V0.97+-Mechanik nebenbei spielbar wurde.
