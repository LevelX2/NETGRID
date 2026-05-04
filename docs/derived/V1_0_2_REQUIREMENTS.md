# V1.0.2 Requirements - Gegner-Aktionsdarstellung und Ablauftransparenz

Status: Requirements Freeze
Stand: 2026-05-04

## Kurzentscheidung

V1.0.2 ist eine Präsentations- und Orchestrierungsphase. Gegnerische Aktionen werden live als side-sichere Cues, kurze Board-Highlights und optionales lokales Aktionsaudio dargestellt. Für Human-vs-KI wird die bisherige unsichtbare KI-Bulk-Ausführung durch ein beobachtbares Pacing ergänzt.

Die Engine bleibt die einzige Regelautorität. Cues, Highlights, Queue, Audio und KI-Pacing verändern keine Regeln, keine LegalActions, keine Replay-Daten und keinen StateHash.

## Quellen

- `docs/derived/V1_0_2_OPPONENT_ACTION_PRESENTATION_PLAN.md`
- `docs/derived/V1_0_1_JOIN_DECK_HANDSHAKE_PLAN.md`
- `docs/derived/V1_0_DECK_MATCH_STABILIZATION_FINAL_REVIEW.md`
- `docs/derived/S01_REQUIREMENTS.md`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/server/src/multiplayer.ts`
- `packages/shared/src/index.ts`
- `docs/codex/CODEX_STATUS.md`

## Scope

V1.0.2 umfasst:

- Ableitung von `OpponentActionCue`s aus side-sicheren `PublicGameEvent`s und vorhandener Chronicle-Formatierung.
- Lokale Cue-Queue für neue gegnerische Events.
- Board-Highlights für Server, Zonen, Run-Phasen, sichtbare Karten und lokale Entscheidungen.
- KI-Pacing für Human-vs-KI mit `fast`, `paced` und `manual`.
- Ein side-authentifiziertes Advance-AI-Kommando für beobachtbare KI-Schritte.
- Side-sichere Präsentationsdaten für aktive KI-Seite und Advance-Erlaubnis.
- Opt-in Aktionsaudio aus lokaler Web-Audio-Synthese.
- Unit-, Server-, Visibility-, Browser-Smoke- und Regressionstests.

## Nicht-Ziele

V1.0.2 baut nicht:

- neue Karten oder neue offizielle Mechaniken,
- Prevention, Avoid, Interrupt, Replacement oder Priority-Pass,
- neue Engine-Regelautorität in UI, Server, KI oder Audio,
- LLM-Regelentscheidungen,
- Audio-Dateien, offizielle Sounds, offizielle Artworks, Card Frames, Logos oder Card Backs,
- Änderung von Replay-, StateHash-, RandomDrawRecord- oder GameState-Determinismus,
- öffentliche Spectator-, Matchmaking-, Ranking-, Account-, Decklisten-, Turnier- oder Plattformfunktionen,
- vollständige Tutorial-, Coaching- oder Beobachtermodus-Schicht.

## Begriffe

- `OpponentActionCue`: reine UI-Präsentationsableitung aus side-sicheren Daten.
- `BoardHighlight`: lokale Hervorhebung eines abstrakten Boardbereichs, Servers, einer sichtbaren Karte, Run-Phase oder Entscheidung.
- `AiPacingMode`: Match-Orchestrierungsmodus für KI-Ausführung, kein Engine-State.
- `advance_ai`: serverseitiges Kommando, das höchstens einen KI-Schritt ausführt oder im Fast-Modus bewusst bis zum nächsten Human laufen kann.
- `lastPresentedEventId`: lokaler UI-Marker, damit Reconnect oder Reload alte Events nicht akustisch neu abspielt.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| V102-MUST-001 | Gegnerische `PublicGameEvent`s erzeugen Live-Cues außerhalb des Chronicle-Protokolls. | Für Events mit gegnerischem Actor entsteht aus Sicht des lokalen Spielers ein `OpponentActionCue`. | V102-T001, V102-T002 |
| V102-MUST-002 | Cue-Ableitung nutzt nur side-sichere Eingaben. | Eingaben sind `PublicGameEvent`, `ChronicleItem`, aktuelle `PlayerView` und lokale UI-Einstellungen; kein FullState, keine privaten Payloads. | V102-T003, V102-T015 |
| V102-MUST-003 | Cue-IDs sind stabil und lokal. | `cueId` wird aus Event-ID, Viewer-Side und optionalem Cue-Discriminator gebildet und ist kein Engine-Objekt. | V102-T001 |
| V102-MUST-004 | Verdeckte Corp-Installationen bleiben verdeckt. | Cues und Highlights nennen keine Titel, `cardDefinitionId`, private `cardInstanceId`, Bild-URL oder unterscheidbare Bilddaten verdeckter gegnerischer Karten. | V102-T003, V102-T015 |
| V102-MUST-005 | Bekannte oder offene Karten dürfen nur side-sicher fokussiert werden. | Titel, `cardDefinitionId` und `cardInstanceId` werden nur verwendet, wenn sie im `PublicGameEvent` oder in der aktuellen `PlayerView` für den Viewer sichtbar sind. | V102-T004, V102-T015 |
| V102-MUST-006 | Die Cue-Queue verarbeitet nur neue Events. | Reconnect oder Reload zeigt altes Eventlog weiterhin im Chronicle, spielt aber keine alten Cues oder Sounds automatisch ab. | V102-T005, V102-T019 |
| V102-MUST-007 | Mehrere Gegneraktionen bleiben geordnet und lokal überspringbar. | Cues werden nach Event-/StateVersion-Reihenfolge abgespielt; Überspringen oder schneller Modus beeinflusst das Match nicht. | V102-T005, V102-T014 |
| V102-MUST-008 | Lokale Entscheidungen stoppen die Automatik. | Wenn nach einem gegnerischen Event lokale `pendingChoice` oder `legalActions` vorliegen, pausiert die Queue und hebt die Entscheidung sichtbar hervor. | V102-T006, V102-T017 |
| V102-MUST-009 | Audio ist opt-in und rein lokal. | Deaktiviertes Audio erzeugt keinen Sound; aktiviertes Audio nutzt lokale Synthese und schreibt nichts in Engine, Server-State, Replay oder StateHash. | V102-T007, V102-T016 |
| V102-MUST-010 | Human-vs-KI nutzt standardmäßig beobachtbares Pacing. | Neue Human-vs-KI-Matches laufen im Default nicht unsichtbar bis zum nächsten Menschen durch. | V102-T010, V102-T017 |
| V102-MUST-011 | `runAiStep` führt höchstens eine KI-Aktion aus. | Ein einzelner Schritt erzeugt maximal eine erfolgreiche Engine-Transition. | V102-T009 |
| V102-MUST-012 | KI-Schritte bleiben LegalActions-basiert. | Jede KI-Aktion wird aus aktuellen `LegalActions` gewählt und durch `applyAction` revalidiert. | V102-T013 |
| V102-MUST-013 | Advance-AI ist authentifiziert und zustandsgebunden. | `advance_ai` ist nur für aktive Matches, aktive KI-Seite und menschliche Session im Match erlaubt; stale Versionen führen zu side-sicherem Resync statt heimlichem Weiterspielen. | V102-T011, V102-T012 |
| V102-MUST-014 | `fast` bleibt für Simulation und Tests verfügbar. | AI-vs-AI und technische Tests können weiterhin den bestehenden Bulk-Lauf verwenden; Human-vs-KI nutzt nicht `fast` als Normalfall. | V102-T010 |
| V102-MUST-015 | Human-vs-Human nutzt dieselbe Cue-Ableitung ohne Remote-Blockade. | Gegneraktionen erzeugen lokale Cues; lokale Bestätigung oder Skip hält den entfernten Gegenspieler nicht an. | V102-T014, V102-T018 |
| V102-MUST-016 | KI-Erklärungen sind nutzerverständlich und side-sicher. | Sichtbare Cue-Texte dürfen `aiExplanation` zeigen, aber keinen rohen `aiReasonCode` als Haupttext ausgeben. | V102-T001, V102-T015 |
| V102-MUST-017 | Board-Highlights bleiben abstrakt oder sichtbar. | Highlights nutzen `serverId`, `serverLabel`, `zoneLabel`, Run-Phase oder sichtbare CardView-Daten; verdeckte Gegnerkarten bekommen nur abstrakte Server-/Zonen-Highlights. | V102-T004, V102-T015 |
| V102-MUST-018 | Präsentationsdaten leaken keine privaten Matchdaten. | Payloads enthalten keine `cardInstances`, privaten Decklisten, Tokens, Session-IDs, privaten Payloads oder verdeckten gegnerischen Titel. | V102-T015 |
| V102-MUST-019 | Bestehende Verträge bleiben grün. | Visibility-, Replay-, StateHash-, stale-action-, illegal-action-, AI-Input- und Multiplayer-Verträge bleiben unverändert erfüllt. | V102-T016, V102-T020 |
| V102-MUST-020 | Scope-Grenzen bleiben hart. | Keine neuen Karten, Mechaniken, offiziellen Assets oder öffentlichen Plattformfunktionen werden durch V1.0.2 freigegeben. | V102-T020 |

## KI-Pacing-Entscheidung

`AiPacingMode` wird auf Match-/Server-Orchestrierungsebene geführt:

- `fast`: KI läuft wie bisher bis zum nächsten Human oder Sicherheitslimit; Standard für KI-vs-KI und Tests.
- `paced`: KI führt einen Schritt aus; UI zeigt Cue; danach kann die UI nach kurzer Verzögerung den nächsten Schritt anfordern. Standard für Human-vs-KI.
- `manual`: KI führt genau einen Schritt pro ausdrücklicher lokaler Bestätigung aus.

`AiPacingMode` ist nicht Teil von `GameState`, Replay oder StateHash.

## Erlaubte Payload-Ergänzungen

V1.0.2 darf side-sichere Präsentationsfelder ergänzen, wenn sie keine verdeckten Kartendaten offenlegen:

- `serverId`
- `serverLabel`
- `zoneLabel`
- `runPhase`
- `highlightKind`
- `redactedKind`
- `aiExplanation`
- `aiReasonCode` nur für Debug/Testdaten und nicht als sichtbarer Haupttext
- `actor`
- `actionType`

Zusätzlich darf die side-gefilterte Match-Payload ein Präsentationsobjekt tragen:

```ts
type AiTurnPresentationState = {
  activeAiSide?: "runner" | "corp";
  canAdvanceAi: boolean;
  pacingMode: "fast" | "paced" | "manual";
};
```

Dieses Objekt darf keine verdeckten Kartendaten, Tokens oder privaten Decklisten enthalten.

## Implementierungsreihenfolge

1. Cue-Ableitung und Unit-Tests auf Basis von `chronicle.ts`.
2. Server-KI-Pacing mit `runAiStep`, `advance_ai` und side-sicherem Präsentationspayload.
3. Web-Queue, Overlay, Board-Highlights und Entscheidungshervorhebung.
4. Opt-in Aktionsaudio.
5. Browser-Smokes und Final Review.

## Gate

`V1_0_2_requirements_freeze_done: true`

`ready_for_implementation: true`
