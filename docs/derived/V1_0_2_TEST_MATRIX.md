# V1.0.2 Test Matrix - Gegner-Aktionsdarstellung und Ablauftransparenz

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V102-T001 | Unit/Web Cue Mapping | V102-MUST-001, V102-MUST-003, V102-MUST-016 | Aktuelle Chronicle-ActionTypes erzeugen stabile Cues mit nutzerverständlichem Titel; `aiExplanation` erscheint, roher `aiReasonCode` nicht als Haupttext. |
| V102-T002 | Unit/Web Opponent Filter | V102-MUST-001 | Eigene Actions erzeugen standardmäßig keinen großen Gegner-Cue; gegnerische Actions tun es. |
| V102-T003 | Unit/Web Redaction | V102-MUST-002, V102-MUST-004 | Verdeckte Corp-Installation erzeugt redacted Cue ohne Titel, `cardDefinitionId`, private `cardInstanceId`, Bild-URL oder Card-Details. |
| V102-T004 | Unit/Web Highlight Mapping | V102-MUST-005, V102-MUST-017 | Bekannte/offene Karten, Server, Run-Phasen, ScoreArea, Rig und Economy-Bereiche erzeugen passende side-sichere Highlights. |
| V102-T005 | Unit/Web Queue | V102-MUST-006, V102-MUST-007 | Cue-Queue spielt nur neue Events geordnet ab, überspringt alte Bootstrap-/Reconnect-Events und erlaubt lokalen Skip. |
| V102-T006 | Unit/Web Local Attention | V102-MUST-008 | Lokale `pendingChoice` oder aktive lokale `legalActions` pausieren die Queue und erzeugen einen Decision-Highlight. |
| V102-T007 | Unit/Web Audio | V102-MUST-009 | Audio ist opt-in; deaktiviert wird kein Sound ausgelöst; aktiviertes Sound-Mapping bleibt lokal. |
| V102-T008 | Static/Web Boundary | V102-MUST-002, V102-MUST-009 | Cue-/Audio-Code importiert keine Engine-Regelmodule und schreibt keine Server-, Replay- oder StateHash-Daten. |
| V102-T009 | Server AI Step | V102-MUST-011 | `runAiStep` führt höchstens eine KI-Transition aus und aktualisiert MatchVersion/EventLog genau einmal. |
| V102-T010 | Server AI Pacing Defaults | V102-MUST-010, V102-MUST-014 | Human-vs-KI startet im `paced`-Modus ohne unsichtbaren Bulk-Lauf; KI-vs-KI/Testpfade behalten `fast`. |
| V102-T011 | Server Advance Auth | V102-MUST-013 | `advance_ai` wird bei inaktivem Match, nicht aktiver KI, falscher Session, fehlendem Token oder nicht-menschlicher Session side-sicher abgelehnt. |
| V102-T012 | Server Stale/Resync | V102-MUST-013 | Stale `knownStateVersion`/`knownMatchVersion` führt zu Resync-Payload, nicht zu heimlicher KI-Transition. |
| V102-T013 | Server AI Legality | V102-MUST-012 | KI wählt nur aktuelle LegalActions; `applyAction` revalidiert Side, ActionId, StateVersion, Kosten, Ziele und Choices. |
| V102-T014 | Multiplayer Human-vs-Human | V102-MUST-007, V102-MUST-015 | Gegneraktion aus zweiter Session erzeugt lokale Cue-Queue in erster Session; lokale Wiedergabe/Skip blockiert die zweite Session nicht. |
| V102-T015 | Visibility Payload Scan | V102-MUST-002, V102-MUST-004, V102-MUST-005, V102-MUST-016, V102-MUST-017, V102-MUST-018 | AI-Step-, SidePayload-, Cue-, Reconnect- und Fehlerdaten enthalten keine `cardInstances`, privaten Decklisten, Tokens, privaten Payloads oder verdeckten gegnerischen Titel. |
| V102-T016 | Replay/StateHash Regression | V102-MUST-009, V102-MUST-019 | Pacing, Cue-Queue, Highlights und Audio verändern Replay, RandomDrawRecords und StateHash nicht. |
| V102-T017 | Browser Smoke Human-vs-KI | V102-MUST-008, V102-MUST-010 | Runner-vs-Corp-KI zeigt Corp-Pflichtdraw und Folgeaktionen schrittweise; bei Runner-Aktion stoppt die Automatik. |
| V102-T018 | Browser Smoke Human-vs-Human | V102-MUST-015 | Zwei Sessions: Aktion des Gegners erscheint als Cue mit Highlight, ohne Remote-Blockade. |
| V102-T019 | Browser Smoke Reconnect | V102-MUST-006 | Nach Reload/Reconnect bleibt Chronicle vollständig, aber alte Events lösen keine Tonfolge aus. |
| V102-T020 | Scope/Regression Gate | V102-MUST-019, V102-MUST-020 | `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` bleiben grün; keine neuen Karten, Mechaniken, Assets oder Plattformfeatures. |

## Pflichtchecks für Implementierung

- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- Browser-Smoke Human-vs-KI
- Browser-Smoke Human-vs-Human mit zwei Sessions
- Browser-Smoke Reconnect/Reload ohne Audio-Replay alter Events

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_2_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
