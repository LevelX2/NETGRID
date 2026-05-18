# V1.0.2 Requirements Review - Gegner-Aktionsdarstellung und Ablauftransparenz

Status: bestanden
Stand: 2026-05-04

## Review-Ergebnis

Die V1.0.2-Anforderungen sind ausreichend eingefroren, um die Implementierung zu starten.

Der Scope ist bewusst eng: V1.0.2 macht gegnerische Aktionen in Human-vs-KI und Human-vs-Human live verständlich. Die Phase verändert keine Engine-Regeln, keine Karten, keine Mechaniken, keine Replay-Daten und keinen StateHash.

## Geprüfte Artefakte

- `docs/releases/v1/v1-0-2-opponent-action-presentation/plan.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/spec.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/test-matrix.md`
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `apps/server/src/multiplayer.ts`
- `packages/shared/src/index.ts`
- `docs/releases/special/s01/requirements.md`
- `docs/codex/CODEX_STATUS.md`

## Konsistenzprüfung

| Vorgabe | Status | Ergebnis |
|---|---|---|
| Engine bleibt Regelautorität | pass | Cues, Queue, Highlight und Audio sind ausdrücklich Präsentation. |
| Kein FullState im Browser | pass | Cue-Ableitung darf nur `PublicGameEvent`, `ChronicleItem`, `PlayerView` und lokale Settings nutzen. |
| Keine Hidden-Info-Leaks | pass | Redaction-Regeln und Payload-Scan sind eigene Must- und Testspuren. |
| KI nutzt nur LegalActions | pass | `runAiStep` bleibt LegalActions- und `applyAction`-basiert. |
| Replay/StateHash unverändert | pass | Pacing ist Server-Orchestrierung, nicht Engine-State. |
| Human-vs-Human nicht blockiert | pass | Queue/Skip wirken nur lokal. |
| Audio bleibt opt-in | pass | Audio folgt S01: lokal synthetisiert, ohne Server-/Engine-Wirkung. |
| Keine Scope-Ausweitung | pass | Neue Karten, Mechaniken, Assets und Plattformfunktionen sind gesperrt. |

## Risikoentscheidungen

| Risiko | Entscheidung |
|---|---|
| Verdeckte Corp-Installationen könnten über Highlight oder CardView leaken. | Redacted Cues dürfen nur abstrakte Server-/Zonen-Highlights tragen und keine Titel, IDs oder Bilddaten. |
| KI-Pacing könnte Spielablauf verändern. | KI-Aktionen bleiben dieselben LegalActions über `applyAction`; nur Zeitpunkt/Orchestrierung der Ausführung wird beobachtbar. |
| Reconnect könnte alte Events akustisch neu abspielen. | `lastPresentedEventId` ist lokaler UI-Vertrag; alte Bootstrap-/Reconnect-Events bleiben stumm. |
| Human-vs-Human könnte durch lokale Animationen träge werden. | Cue-Queue ist rein lokal und überspringbar; remote Actions werden nicht bestätigt oder blockiert. |
| AI-Reason-Codes könnten als technische Texte sichtbar werden. | Nutzertexte dürfen `aiExplanation` zeigen; `aiReasonCode` bleibt Debug-/Testdatum. |

## Coverage-Check

| Bereich | Status |
|---|---|
| Must-Anforderungen | pass, 20 Must-Anforderungen mit Testspur |
| Cue-/Highlight-Spezifikation | pass |
| KI-Pacing-Modi | pass |
| Advance-AI-Autorisierung | pass |
| Reconnect-/Reload-Verhalten | pass |
| Audio-Scope | pass |
| Visibility-/Replay-/StateHash-Regression | pass |
| Browser-Smokes | pass, als Implementierungs-Gate definiert |

## Offene Punkte

Keine blockerrelevanten offenen Punkte.

Für die Implementierung sind normale technische Detailentscheidungen offen, aber ausreichend begrenzt:

- konkrete Platzierung des Overlays im bestehenden Board,
- genaue Animationsdauer und Cue-Verzögerung,
- ob `advance_ai` zuerst per WebSocket oder REST umgesetzt wird,
- ob `AiPacingMode` initial nur serverseitig oder zusätzlich als UI-Einstellung persistiert wird.

Diese Punkte blockieren die Implementierung nicht, solange die Must-Anforderungen und die Spezifikation eingehalten werden.

## Gate

`V1_0_2_requirements_freeze_done: true`

`ready_for_implementation: true`
