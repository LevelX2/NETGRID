# V1.1.1 Discard, Handlimit und Core Damage Plan

Status: planning
Stand: 2026-05-07
Scope: Detailplanung zur Freigabevorbereitung, keine Implementierung

## Kurzentscheidung

V1.1.1 ist der nächste sinnvolle Gate-Schnitt nach V1.1.0. Der Release schließt die in V1.1.0 ausdrücklich verschobene Lücke aus Discard-Phase, Handlimit und vollständigerer Core-Damage-Ausarbeitung.

Der Schnitt ist bewusst eng:

- Discard-Phasen für Korp und Runner werden als Engine-Phasen modelliert.
- Handlimit wird nicht mehr nur in der UI angenommen, sondern als Rules-Engine-Wert geführt.
- Core Damage wird als dritter Damage-Typ spielbar, reduziert dauerhaft das Runner-Handlimit und nutzt weiter den V0.94-Damage-Vertrag.
- Damage Prevention, Avoid, Interrupt und Replacement bleiben gesperrt.
- Full Archives Access bleibt V1.1.2.

## Herkunft und Begründung

V1.1.0 hat Setup, Mulligan, 7-Punkte-Ziel, Game-End-Vertrag, Identity-PlayerViews und Archives-facedown-Grundlage umgesetzt. In `docs/derived/V1_1_0_SETUP_GAME_END_M2_DETAILED_PLAN.md` ist Discard/Handlimit/Core Damage ausdrücklich als V1.1.1-Folgegate markiert.

Die langfristige Roadmap nennt V1.1.1 als `Discard/Handlimit/Core Damage` mit vollständigem Discard-Grundpfad, Handlimit und Core Damage als eigenem Gate. V1.1.2 bleibt `Full Archives Access`.

Die lokale CR-v26.03-Referenz bestätigt für diesen Scope:

- Beide Spieler haben eine Discard-Phase am Ende des eigenen Zuges.
- In der Discard-Phase discarden Spieler auf ihr maximales Handlimit herunter.
- Corp-Discard aus HQ geht facedown in Archives.
- Runner-Discard aus Grip geht in den Heap.
- Beide Spieler beginnen mit maximaler Handgröße 5.
- Core Damage trashte wie Net/Meat zufällig Karten aus dem Runner-Grip und reduziert das maximale Runner-Handlimit dauerhaft um 1 pro Core Damage.
- Runner flatlined sofort, wenn er mehr Damage nimmt als Karten im Grip liegen.
- Runner flatlined außerdem zu Beginn seines Discard Steps, wenn sein maximales Handlimit kleiner als 0 ist.

## Geplante Features

### F1: Discard-Phase im Phasenmodell

Neue oder wieder aktivierte Engine-Phasen:

- `corp_discard_phase`
- `runner_discard_phase`

Neue Timingpoints, Namen endgültig im Requirements Freeze:

- `corp_discard.select_cards`
- `corp_discard.complete`
- `runner_discard.flatline_check`
- `runner_discard.select_cards`
- `runner_discard.complete`

Der bestehende `end_turn` darf nicht mehr direkt zum nächsten Spieler springen, wenn Discard-Verarbeitung nötig ist. Stattdessen:

1. Action Phase endet.
2. Engine öffnet Discard-Phase der aktiven Seite.
3. Engine prüft Handlimit.
4. Wenn Handgröße <= Handlimit: automatische Weiterleitung zum nächsten Zug.
5. Wenn Handgröße > Handlimit: side-private `PendingChoice` für die aktive Seite.
6. Nach erfolgreichem Discard: formaler Zugwechsel.

Paid-Ability-Fenster in der Discard-Phase werden in V1.1.1 nicht als neue Priority-/Paid-Ability-Engine umgesetzt. Sie werden als dokumentierte spätere Lücke markiert.

### F2: Handlimit als Engine-Wert

Handlimit wird in `GameState` und `PlayerView` explizit geführt oder deterministisch berechnet.

Startwerte:

- Korp: 5
- Runner: 5

Runner-Handlimit:

- Basis 5 plus künftige Modifier.
- Minus `runner.coreDamage` oder gleichwertige Core-Damage-Counter.

Korp-Handlimit:

- Basis 5 plus künftige Modifier.
- Keine neuen Korp-Handlimit-Karten in V1.1.1.

UI darf den Runner-Handlimit-Wert nicht mehr hart als `5` annehmen. Das bestehende `Grip x/5` muss auf den PlayerView-Wert wechseln.

### F3: Discard-Choice über LegalActions und PendingChoice

Discard erfolgt nicht durch Client-Sonderlogik. Die Engine bleibt einzige Regelautorität.

Empfohlener Vertrag:

- Die Engine erzeugt eine `PendingChoice` mit `kind: "select_cards"`.
- `source` ist `discard_phase`.
- `side` ist die aktive Seite.
- `minSelections` und `maxSelections` entsprechen exakt `handCount - maxHandSize`.
- Die UI reicht die Auswahl über bestehendes `resolve_choice` ein.
- `applyAction` revalidiert Side, StateVersion, ChoiceId, Anzahl, Kartenzone, Kartenbesitz und Timingpoint.

Discard-Auswahl ist Hidden-Info-relevant:

- Korp-Choice zeigt nur der Korp-Seite HQ-Kandidaten.
- Runner-Choice zeigt nur der Runner-Seite Grip-Kandidaten.
- Gegner sieht höchstens Count und Status, keine Kandidaten.

### F4: Zone-Moves und Sichtbarkeit beim Discard

Korp-Discard:

- ausgewählte HQ-Karten gehen gleichzeitig facedown in Archives.
- Runner sieht keine Kartentitel, keine DefinitionIds und keine frühere Zugriffsinfo.
- Korp sieht eigene Archives weiterhin vollständig.
- PublicEvent enthält Count und `discardPhase`, aber keine Titel.

Runner-Discard:

- ausgewählte Grip-Karten gehen gleichzeitig in den Runner-Heap.
- Die Karten werden nach dem Move nach dem bestehenden Heap-Sichtvertrag sichtbar.
- PublicEvent muss keine Titel enthalten; die PlayerViews können die sichtbare Heap-Folge zeigen.
- Vor-Discard-Grip-Liste und nicht gewählte Karten bleiben privat.

Für beide Seiten gilt:

- Discard ist nicht dasselbe wie Trash. Events und Payloads sollen `discarded` statt `trashed` verwenden.
- Discard löst keine Damage-, Trash- oder Prevention-Sonderregeln aus.
- Undo über eine Discard-Choice hinweg wird blockiert, weil private Handinformation und Auswahlentscheidung offengelegt werden können.

### F5: Core Damage

Core Damage wird als dritter spielbarer Damage-Typ aktiviert, aber ohne Prevention/Avoid/Interrupt/Replacement.

Normale Core-Damage-Auflösung:

1. Damage-Quelle erzeugt eine validierte Damage-Anforderung mit `damageType: "core"`.
2. `applyAction` revalidiert die Quelle wie bei Net/Meat Damage.
3. Wenn `amount > runner.grip.length`, bleibt die V0.94-Entscheidung bestehen: Flatline sofort, keine zusätzliche Random-Auswahl und kein zusätzlicher Grip-Leak.
4. Wenn `amount <= runner.grip.length`, werden exakt `amount` Grip-Karten ohne Replacement über Seed, RandomCounter und RandomDrawRecords ausgewählt und gleichzeitig in den Heap bewegt.
5. Zusätzlich erhält der Runner `amount` Core-Damage-Counter oder ein gleichwertiges persistentes Feld.
6. Das maximale Runner-Handlimit sinkt dauerhaft um `amount`.
7. PublicEvent enthält Damage-Typ, Menge, getrashte Anzahl, neuen öffentlichen Core-Damage-Zähler oder neues öffentliches Runner-Handlimit, aber keine vor-Damage-Grip-Liste.

Core Damage kann das Runner-Handlimit unter 0 senken. Die dadurch ausgelöste zusätzliche Flatline erfolgt erst zu Beginn des Runner-Discard-Steps, nicht sofort bei der Core-Damage-Auflösung, sofern der Runner nicht bereits durch `amount > grip.length` flatlined.

### F6: Flatline beim Runner-Discard-Step

Zu Beginn des Runner-Discard-Steps prüft die Engine:

- Wenn `runnerMaxHandSize < 0`, endet das Spiel mit `winner: "corp"` und `gameEndReason: "flatline"`.
- Es findet keine Discard-Choice mehr statt.
- PublicEvent und Result Summary enthalten nur den sicheren Grund.

Diese Prüfung ist nicht als Runner-Deckout-Regel zu verstehen. Runner-Stack-Leere bleibt weiterhin keine neue Siegbedingung.

### F7: UI-Anzeige und Bedienung

UI-Mindestumfang:

- Zonenbadge für `Grip x/y` nutzt `PlayerView.own.maxHandSize` oder gleichwertig.
- Korp-Sicht zeigt beim Runner nur Handcount und öffentliches Handlimit, keine Grip-Titel.
- Core-Damage-Zähler wird als kleiner Statuswert beim Runner sichtbar.
- Discard-Choice erscheint als normale Auswahlfläche für eigene Hand/HQ-Karten.
- Gegner sieht Wartestatus: `Runner wählt Discard` oder `Korp wählt Discard`, ohne Kandidaten.
- Chronik unterscheidet `discarded` von `trashed`.

Keine neue große UI-Neugestaltung, keine Drag-and-drop-Pflicht, kein Tutorial.

### F8: KI und Pacing

KI muss Discard-Choices deterministisch und LegalActions-only lösen.

Minimalheuristik:

- Eigene private Hand aus PlayerView nutzen.
- Karten mit niedrigstem einfachem Rollenwert zuerst discarden.
- Bei Gleichstand stabile Reihenfolge nach CardInstanceId oder DefinitionId.
- Keine gegnerische Hidden-Info.

Human-vs-KI-Pacing darf durch Discard-Choices nicht hängen bleiben. Wenn die KI am Zugende discarden muss, soll der Server/AI-Pfad die Choice als einen beobachtbaren KI-Schritt oder als internen Schritt mit side-sicherem Cue abwickeln.

## Nicht-Ziele

V1.1.1 implementiert nicht:

- Damage Prevention.
- Avoid.
- Interrupts.
- Replacement Effects.
- vollständige Paid-Ability-Fenster in der Discard-Phase.
- Runner-Deckout als Siegbedingung.
- Full Archives Access.
- offizielle neue Karten außerhalb bereits lokal geprüfter oder enger Harness-Karten.
- öffentliche Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turnierfunktionen.
- offiziellen Asset-, Logo-, Frame-, Card-Back- oder externen Kartendatenbank-Pfad.

## Vorgeschlagene Requirements

| ID | Anforderung |
|---|---|
| V111-MUST-001 | `Phase` und `TimingPointId` bilden Korp- und Runner-Discard-Phasen deterministisch ab. |
| V111-MUST-002 | `end_turn` führt über Discard-Verarbeitung statt direkt zum nächsten Spieler, sofern Handlimitprüfung nötig ist. |
| V111-MUST-003 | Handlimit ist Engine-Wert oder deterministische Engine-Berechnung, nicht nur UI-Konstante. |
| V111-MUST-004 | Beide Seiten starten mit maximaler Handgröße 5. |
| V111-MUST-005 | Bei Handgröße <= Handlimit wird die Discard-Phase ohne Choice sauber abgeschlossen. |
| V111-MUST-006 | Bei Handgröße > Handlimit erzeugt die Engine eine side-private `select_cards`-Choice mit exakt erforderlicher Auswahlanzahl. |
| V111-MUST-007 | `resolve_choice` revalidiert Discard-Auswahl, Zone, Side, StateVersion, Anzahl und Timingpoint. |
| V111-MUST-008 | Korp-Discard bewegt Karten facedown nach Archives und leakt keine Titel an Runner, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors, AI oder UI-Diagnostics. |
| V111-MUST-009 | Runner-Discard bewegt Karten in den Heap, ohne vor der Auswahl Grip-Listen oder nicht gewählte Karten zu leaken. |
| V111-MUST-010 | Discard-Events sind keine Trash-Events und werden in Chronik/UI getrennt formuliert. |
| V111-MUST-011 | Undo über erfolgreiche Discard-Auswahl wird blockiert. |
| V111-MUST-012 | Core Damage ist spielbar und nutzt denselben Hidden-Info-/RandomDrawRecord-Grundvertrag wie V0.94 Damage. |
| V111-MUST-013 | Core Damage reduziert das Runner-Handlimit dauerhaft um die Damage-Menge und erhöht einen sichtbaren Core-Damage-Zähler oder gleichwertigen Status. |
| V111-MUST-014 | Core Damage mit `amount > runner.grip.length` flatlined ohne zusätzliche Random-Auswahl oder Zusatzleak. |
| V111-MUST-015 | Runner flatlined zu Beginn des Runner-Discard-Steps, wenn das maximale Runner-Handlimit kleiner als 0 ist. |
| V111-MUST-016 | PlayerViews zeigen eigene Handlimitwerte und gegnerische Handlimit-/Core-Damage-Counts side-sicher. |
| V111-MUST-017 | Server Submit, Idempotency, Reconnect, EventTail und WebSocket-Payloads behandeln Discard/Core Damage side-sicher. |
| V111-MUST-018 | KI löst Discard-Choices deterministisch aus PlayerView/LegalActions und ohne FullState- oder gegnerische Hidden-Info-Nutzung. |
| V111-MUST-019 | Replay reproduziert Discard-Choices, Core-Damage-Randomness, Handlimitänderungen, Flatline und finalen StateHash. |
| V111-MUST-020 | No-Scope-Regression bestätigt, dass keine Prevention/Avoid/Interrupt/Replacement-, Full-Archives-Access- oder Runner-Deckout-Siegbedingung freigeschaltet wird. |

## Vorgeschlagene Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V111-T001 | Shared/Types | Neue Phasen, Timingpoints, Handlimit-/Core-Damage-Felder typisieren sauber. |
| V111-T002 | Engine Turn Flow | Korp-Endturn führt in Korp-Discard und danach zum Runner. |
| V111-T003 | Engine Turn Flow | Runner-Endturn führt in Runner-Discard und danach zur Korp-Draw-Phase. |
| V111-T004 | No-Discard | Handgröße <= Handlimit schließt Discard ohne Choice ab. |
| V111-T005 | Corp Discard Choice | Übervolles HQ erzeugt private Korp-Choice mit exakt benötigter Anzahl. |
| V111-T006 | Runner Discard Choice | Übervolle Grip erzeugt private Runner-Choice mit exakt benötigter Anzahl. |
| V111-T007 | Revalidation | Falsche Side, stale StateVersion, falsche Anzahl oder Karten außerhalb der Hand werden abgelehnt. |
| V111-T008 | Corp Archives | Korp-Discard landet facedown in Archives und leakt keine Titel an Runner. |
| V111-T009 | Runner Heap | Runner-Discard landet im Heap und bleibt ohne Vor-Choice-Leak sichtbar. |
| V111-T010 | Undo | Undo über Discard wird blockiert. |
| V111-T011 | Core Damage Normal | Core Damage trashte zufällig Grip-Karten, erhöht Core-Damage-Status und reduziert Handlimit. |
| V111-T012 | Core Damage Flatline | Core Damage größer als Grip setzt sofort `corp`/`flatline` ohne Random-Auswahl. |
| V111-T013 | Negative Handlimit Flatline | Runner mit maxHandSize < 0 flatlined zu Beginn des Runner-Discard-Steps. |
| V111-T014 | Randomness | Core Damage nutzt nur Seed, RandomCounter und RandomDrawRecords. |
| V111-T015 | Replay/StateHash | Replay reproduziert Discard, Core Damage und finalen StateHash. |
| V111-T016 | Visibility Contract | Keine HQ-/Grip-Kandidaten in gegnerischen Views, WS, Reconnect, Undo-Preview, Errors, Logs, AI oder DOM. |
| V111-T017 | Multiplayer | Submit, Idempotency, stale actions, reconnect und event tail funktionieren während Discard/Core Damage. |
| V111-T018 | AI | KI löst Discard deterministisch und LegalActions-only. |
| V111-T019 | Web UI | Handlimit-Badge nutzt PlayerView, Discard-Choice ist bedienbar, Wartestatus leakt keine Karten. |
| V111-T020 | E2E | Human-vs-KI und Human-vs-Human erreichen Discard-Choice, Reconnect und Core-Damage-Smoke ohne Hänger. |
| V111-T021 | No Scope | Keine Prevention/Avoid/Interrupt/Replacement-, Full-Archives- oder Runner-Deckout-Funktion ist sichtbar. |

## Umsetzungsschritte nach Freigabe

### Schritt 0: Requirements Freeze

Erstellen oder ableiten:

- `docs/derived/V1_1_1_REQUIREMENTS.md`
- `docs/derived/DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md`
- `docs/derived/V1_1_1_TEST_MATRIX.md`
- `docs/derived/V1_1_1_REQUIREMENTS_REVIEW.md`

Gate:

- Requirements Review meldet `ready_for_implementation: true`.

### Schritt 1: Shared Types und State-Vertrag

Dateibereiche:

- `packages/shared/src/index.ts`
- bei Bedarf Datenartefakte unter `data/rules`

Aufgaben:

- Phasen und Timingpoints ergänzen.
- PlayerView um Handlimit/Core-Damage-Status ergänzen.
- Event-/Payload-Felder für Discard und Core Damage typisieren.
- Action/Choice-Vertrag für Discard dokumentieren.

### Schritt 2: Engine Discard-Phase

Dateibereiche:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`

Aufgaben:

- `endTurn` auf Discard-Phase umbauen.
- `startDiscardPhase` oder gleichwertigen Helper einführen.
- Handlimit berechnen.
- Side-private Discard-PendingChoice erzeugen.
- `resolvePendingChoice` für Discard erweitern.
- Korp-Discard facedown nach Archives.
- Runner-Discard in Heap.
- PublicEvent-Kontext redigiert und eindeutig als Discard markieren.

### Schritt 3: Engine Core Damage

Dateibereiche:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- bei Harness-Karte zusätzlich `packages/shared/src/index.ts`

Aufgaben:

- Core Damage im Damage-Pfad freischalten.
- Core-Damage-Status und Handlimitreduktion persistieren.
- Flatline bei `amount > grip.length` ohne Zufallsauswahl beibehalten.
- Flatline bei negativem Runner-Handlimit zu Beginn des Runner-Discard-Steps implementieren.
- Replay/StateHash absichern.

### Schritt 4: Server, Multiplayer und Undo

Dateibereiche:

- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`, falls Payloadtypen angepasst werden
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/visibility-contract.test.ts`

Aufgaben:

- Discard-PendingChoices side-sicher über Bootstrap, WebSocket und Reconnect serialisieren.
- Idempotency/stale-state für Discard-`resolve_choice` testen.
- Undo-Barriere nach Discard/Core Damage sicherstellen.
- Result Summary für negative-Handlimit-Flatline prüfen.
- Redaction-Tests erweitern.

### Schritt 5: AI

Dateibereiche:

- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`

Aufgaben:

- Discard-Choices deterministisch lösen.
- Core-Damage-Status in Bewertung nur aus PlayerView nutzen.
- KI-Pacing so prüfen, dass Discard-Choices nicht hängen bleiben.

### Schritt 6: Web UI

Dateibereiche:

- `apps/web/app/page.tsx`
- `apps/web/app/chronicle.ts`
- `apps/web/app/action-cues.ts`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/globals.css`
- zugehörige Web-Tests

Aufgaben:

- statisches Runner-Handlimit entfernen.
- Handlimit/Core-Damage aus PlayerView anzeigen.
- Discard-Choice mit eigener Hand/HQ-Auswahl darstellen.
- Gegner-Wartestatus ohne Kandidaten anzeigen.
- Chronik und Cues für Discard/Core Damage redigiert formulieren.

### Schritt 7: E2E, Dokumentation und Final Review

Dateibereiche:

- `tests/e2e`
- `docs/derived`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner` nur bei finaler, wiederverwendbarer Statusänderung

Aufgaben:

- Browser-E2E um Discard- und Core-Damage-Smoke erweitern.
- Requirements/Testmatrix mit Umsetzung abgleichen.
- `V1_1_1_IMPLEMENTATION_REVIEW.md` und `V1_1_1_FINAL_REVIEW.md` erstellen.
- Status erst nach erfolgreicher Umsetzung auf `V1_1_1_done: true` setzen.

## Empfohlene Prüfbefehle

- `corepack pnpm --filter @netrunner/shared typecheck`
- `corepack pnpm --filter @netrunner/engine test -- --run`
- `corepack pnpm --filter @netrunner/server test -- --run`
- `corepack pnpm --filter @netrunner/ai test -- --run`
- `corepack pnpm --filter @netrunner/web test -- --run`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`

## Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Discard leakt HQ- oder Grip-Kandidaten. | Side-private Choice-Serializer, negative Payload-/DOM-/Reconnect-/AI-Tests. |
| Corp-Discard macht Archives versehentlich zu Full-Archives-Access. | Nur facedown Move und Count; Access-Logik bleibt V1.1.2. |
| Discard wird als Trash behandelt. | Eigene Eventfelder und Tests gegen Trash-trigger-nahe Begriffe. |
| Core Damage aktiviert Prevention/Replacement durch die Hintertür. | Keine Imminent-Instruction-Pipeline; No-Scope-Tests behalten harte Sperre. |
| Negative-Handlimit-Flatline tritt zum falschen Zeitpunkt ein. | Test explizit auf Runner-Discard-Step, nicht sofort nach Core Damage. |
| KI oder Server hängt an PendingChoice. | AI-Choice-Smoke und Human-vs-KI-Pacing-E2E. |
| UI bleibt bei statischem `Grip x/5`. | PlayerView-Feld und Web-Test auf dynamisches Handlimit. |

## Freigabevorschlag

V1.1.1 kann nach Freigabe als Requirements-Freeze beauftragt werden. Die Implementierung sollte erst starten, wenn die vier Freeze-Artefakte vorhanden sind und das Review `ready_for_implementation: true` meldet.

## Auftragsprompt nach Freigabe

```text
Arbeite im Projekt Netrunner wiki-first.

Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- KI-Wissen-Netrunner/00 Projektstart.md
- KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md
- docs/codex/CODEX_STATUS.md
- docs/derived/V1_1_1_DISCARD_HANDLIMIT_CORE_DAMAGE_PLAN.md
- docs/derived/V1_1_0_FINAL_REVIEW.md
- docs/derived/DAMAGE_FLATLINE_0.94_SPEC.md
- docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf nur gezielt fuer Discard, maximale Handgroesse und Core Damage

Aufgabe:
Erstelle den V1.1.1 Requirements Freeze fuer Discard, Handlimit und Core Damage. Implementiere noch keinen Code.

Erstelle:
- docs/derived/V1_1_1_REQUIREMENTS.md
- docs/derived/DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md
- docs/derived/V1_1_1_TEST_MATRIX.md
- docs/derived/V1_1_1_REQUIREMENTS_REVIEW.md

Regeln:
- Keine Damage Prevention, Avoid, Interrupt oder Replacement.
- Kein Full Archives Access.
- Keine Runner-Deckout-Siegbedingung.
- Keine neuen offiziellen Assets, Plattformfeatures oder breite Kartenfreigabe.
- Jede Must-Anforderung braucht Testabdeckung.
- Hidden-Info, Replay/StateHash, Undo, Reconnect, AI und Multiplayer sind Gate-Kriterien.

Finale Antwort:
- geplante Features,
- Requirements-Freeze-Dateien,
- offene Annahmen,
- Risiken,
- ready_for_implementation: true | false.
```
