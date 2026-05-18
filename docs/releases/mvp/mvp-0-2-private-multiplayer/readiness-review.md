# MVP 0.2 Readiness Review

Stand: 2026-05-03T10:02:00+02:00

## Ergebnis

`ready_for_MVP_0.2_requirements: true`

`ready_for_MVP_0.2_implementation: false`

MVP 0.2 darf als Requirements-Phase beginnen. Eine Multiplayer-Implementierung darf erst nach abgeleiteten und geprüften MVP-0.2-Artefakten starten.

## Voraussetzungen aus MVP 0.1

| Voraussetzung | Status | Nachweis |
|---|---|---|
| `applyAction` ist deterministisch und revalidiert Actions. | pass | Engine-Tests für stale/wrong-side/LegalAction-Pfad. |
| `getPlayerView(gameState, side)` ist vorhanden und getestet. | pass | Runner-/Corp-Visibility-Tests. |
| LegalActions enthalten Seite, ActionId, TimingPoint, Kosten, Target-Information und Ablauf-StateVersion. | pass | Shared Type und Engine-Tests. |
| PlayerActions enthalten MatchId, Side, ActionId, ClientKnownStateVersion und IdempotencyKey. | pass | Shared Type und ApplyAction-Tests. |
| EventLog enthält StateVersion vorher/nachher und StateHash. | pass | Event-/Replay-Tests. |
| StateHash ist reproduzierbar. | pass | Replay-Test. |
| Demo-Decks sind spielbar genug für Beispielpartien. | pass | Engine-Szenariotests für Runner-Steal, ICE-Break, ETR-Fail und Corp-Score. |
| Visibility-Basistests bestehen. | pass | Engine- und Client-Visibility-Vertragstests. |
| UI kann PlayerView und LegalActions anzeigen. | pass | Next.js UI nutzt `/api/game`. |
| Storage-Adapter für Multiplayer | missing for implementation | Für MVP 0.2 als erstes Requirements-/Implementierungspaket spezifizieren. |

## 0.2-Startbedingungen

Für MVP 0.2 Requirements sollen zuerst entstehen:

- `docs/releases/mvp/mvp-0-2-private-multiplayer/requirements.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/multiplayer-api-spec.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/websocket-protocol-spec.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/storage-schema.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/token-and-session-security.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/reconnect-and-undo-spec.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/multiplayer-test-matrix.md`
- `docs/releases/mvp/mvp-0-2-private-multiplayer/requirements-review.md`
- `data/rules/rules-baseline-0.2.json`
- Multiplayer-Szenario-Fixtures und `tests/specs/multiplayer-acceptance-tests.todo.md`

## Risiken für MVP 0.2

- Storage, Token-Hashing, per-Match-Locking und Idempotency sind noch nicht implementiert.
- WebSocket-Payloads, Reconnect und Undo sind neue Hidden-Info-Angriffsflächen.
- Die bestehende UI ist lokal und Runner-fokussiert; 0.2 braucht getrennte Human/Human-Seiten, Join-Flow und Connection-State.

## Entscheidung

MVP 0.2 Requirements dürfen beginnen. Die Implementierung bleibt gesperrt, bis die 0.2 Requirements Review `ready_for_implementation: true` meldet.

