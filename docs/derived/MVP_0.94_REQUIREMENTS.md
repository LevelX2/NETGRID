# MVP 0.94 Requirements

Status: eingefroren
Stand: 2026-05-04

## Ziel

V0.94 setzt Damage und Flatline als erstes hohes Hidden-Info-Gate um. Die Phase ist eng begrenzt: Net- und Meat-Damage trashen zufällig Karten aus dem Runner-Grip, Damage ist immer eine Hidden-Info-Barriere, und Flatline wird als maschinenlesbarer Game-End-Grund eingeführt.

Der Requirements-Freeze basiert auf V0.93, `MVP_0.94_DETAILED_PLAN.md`, `MVP_0.94_0.99_PLANNING_REVIEW.md` und dem CR-v26.03-Abgleich zu Damage/Flatline. Die Regelreferenz bestätigt für den Startscope: Meat- und Net-Damage werden gleich abgewickelt, mehrere Damage-Punkte wählen die Karten gleichzeitig zufällig aus, und der Runner flatlined, wenn er mehr Damage nimmt, als Karten im Grip liegen.

## Must Requirements

| ID | Anforderung | Abdeckung |
|---|---|---|
| M094-SHARED-001 | Shared muss additive Typen für `DamageType`, `DamageRequest` oder gleichwertige Engine-Kontrakte und `GameEndReason` bereitstellen. | Typecheck Shared/Engine/Server/AI |
| M094-GAMEEND-001 | `GameState`, PlayerViews, Server-/WebSocket-Payloads und Result Summaries müssen einen side-sicheren Game-End-Grund mindestens für `agenda_points`, `corp_deck_empty`, `flatline` und `unknown` tragen können. | Engine, Server, Visibility |
| M094-DAMAGE-001 | Die Engine muss einen deterministischen Damage-Pfad für `net` und `meat` bereitstellen. `core` darf typisiert vorbereitet, aber nicht spielbar sein. | Engine Unit Tests |
| M094-DAMAGE-002 | Damage darf nur aus einer legalen Engine-Quelle entstehen: freigegebener Subroutine-/Card-Resolver, EffectCommand oder Testfixture. UI, Server und KI dürfen Damage nicht direkt setzen. | Engine/Server Tests |
| M094-DAMAGE-003 | `applyAction` muss Side, ActionId, StateVersion, Timing, Kosten, Ziele und Damage-Quelle erneut validieren. | Illegal-Action Tests |
| M094-RANDOM-001 | Zufällige Grip-Auswahl muss ausschließlich über Seed, RandomCounter und RandomDrawRecords laufen. | Randomness/Replay Tests |
| M094-RANDOM-002 | Bei mehreren Damage-Punkten werden die betroffenen Grip-Karten ohne Replacement in einem stabilen Batch gewählt und fachlich gleichzeitig getrasht. | Engine Unit Tests |
| M094-FLATLINE-001 | Wenn `amount > runner.grip.length`, endet das Spiel sofort mit `winner: "corp"` und `gameEndReason: "flatline"`. In diesem Fall werden keine zusätzlichen Grip-Karten zur Informationsgewinnung ausgewählt. | Flatline Tests |
| M094-FLATLINE-002 | Wenn `amount <= runner.grip.length`, werden exakt `amount` Grip-Karten getrasht; `amount === runner.grip.length` ist keine Flatline durch Damage-Menge. | Damage Tests |
| M094-VISIBILITY-001 | Damage-Events müssen `visibilityClass: "hidden_info_barrier"` tragen und öffentliche Payloads auf Damage-Typ, Menge, Quelle und Ergebniszusammenfassung beschränken. | Visibility Contract |
| M094-VISIBILITY-002 | CorpView, PublicEvents, WebSocket, Reconnect, Undo-Previews, Fehler, Logs, AI-Inputs und UI-Diagnostics dürfen den vor-Damage-Grip-Inhalt nicht leaken. | Leaktests |
| M094-HEAP-001 | Nach überlebtem Damage liegen getrashte Karten im Runner-Heap und werden entsprechend dem bestehenden Heap-/Discard-Sichtbarkeitsvertrag angezeigt. | PlayerView Tests |
| M094-UNDO-001 | Jede erfolgreiche Damage-Auflösung blockiert Undo über dieses Event hinweg, auch wenn keine Flatline entsteht. | Server/Undo Tests |
| M094-REPLAY-001 | Replay muss Damage-Auswahl, RandomDrawRecords, Zone-Moves, Flatline und finalen StateHash deterministisch reproduzieren. | Replay/StateHash |
| M094-AI-001 | AI darf Damage-Risiko und Damage-Aktionen nur aus PlayerView, LegalActions und side-gefilterten Events bewerten. | AI Smokes |
| M094-MP-001 | Multiplayer Submit, Idempotency, Stale-State-Ablehnung, Reconnect und EventTail müssen Damage side-sicher behandeln. | Server Smokes |
| M094-CARD-001 | Eine lokale/fiktive Damage-Testkarte oder ein Test-Resolver darf nur mit Manifest, Resolver/Ability, Unit-Test, Szenario, Visibility-Test, Replay/StateHash-Test, AI-Smoke und Multiplayer-Smoke `playable_mvp` werden. | Manifest/Testmatrix |
| M094-NOSCOPE-001 | V0.94 darf keine Trace-, Link-, Bidding-, Resource-, Mulligan-, Multiaccess-, Identity-, Hosting-, Virus-, Prevention-, Avoid-, Interrupt- oder Replacement-Mechanik spielbar machen. | No-Scope Regression |

## Should Requirements

| ID | Anforderung | Abdeckung |
|---|---|---|
| M094-SHOULD-001 | Damage sollte als `EffectCommand` oder gleichwertiger Engine-Helfer an den V0.93-Effect-Vertrag angeschlossen werden. | Implementation Review |
| M094-SHOULD-002 | RandomDrawRecords sollten einen Zweckstring enthalten, der Damage-Typ, Quelle und Batch-Zähler ohne Kartentitel beschreibt. | Randomness Review |
| M094-SHOULD-003 | Flatline-Result Summaries sollten für UI und Matchserie denselben sicheren Grundvertrag nutzen wie Agenda- und Deckout-Siege. | Server/UI Tests |

## Nicht-Ziele

- Kein Core-Damage, keine maximale-Handgröße-Reduktion und keine Core-Damage-Counter.
- Keine Damage-Prevention, kein Avoid, kein Interrupt und kein Replacement.
- Kein Mulligan, keine Identity-Setup-Fähigkeit und kein voller M2-Setup-Umbau.
- Keine Trace-, Link-, Bidding-, Resource-, Jack-out-, Multiaccess-, Hosting-, Virus- oder Counter-Familien.
- Keine offiziellen Karten, offiziellen Bilder, Card Frames, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine automatische Spielbarkeit durch Import, Katalog, Deckeditor oder lokale Kartenbilder.

## Gate Requirement

| ID | Anforderung |
|---|---|
| M094-GATE-001 | V0.94 darf erst implementiert werden, wenn diese Requirements, `DAMAGE_FLATLINE_0.94_SPEC.md`, `MVP_0.94_TEST_MATRIX.md` und `MVP_0.94_REQUIREMENTS_REVIEW.md` vorhanden sind und das Requirements Review `ready_for_MVP_0.94_implementation: true` meldet. |
