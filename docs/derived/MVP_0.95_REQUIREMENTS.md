# MVP 0.95 Requirements - Resources und Tag-Interaktion

Status: Requirements Freeze
Stand: 2026-05-04

## Scope

V0.95 führt Runner-Resources als sichtbare installierte Boardkarten ein und verbindet vorhandene Tags mit der Corp-Basisaktion, eine installierte Resource zu trashen. Der Scope bleibt eng und baut auf dem abgeschlossenen V0.94-Gate auf.

Regelreferenz: CR v26.03, Abschnitte 3.10, 5.2 und 10.5. Die Referenz wird nur für diesen Scope genutzt und erweitert nicht automatisch spätere Mechaniken.

## Ziele

- `resource` wird als additiver Kartentyp im Shared-Vertrag eingeführt.
- Runner kann lokale, manifestierte Resources aus dem Grip installieren.
- Installierte Resources sind öffentlich sichtbare Runner-Boardkarten.
- Corp kann bei getaggtem Runner für 1 Klick und 2 Credits eine installierte Resource trashen.
- `applyAction` revalidiert Side, ActionId, StateVersion, Timing, Kosten, Tagstatus und Ziel.
- Visibility, Replay/StateHash, AI und Multiplayer bleiben side-sicher und deterministisch.

## Nicht-Ziele

- Kein Trace, Link oder Bidding.
- Keine Resource mit Hidden-Info-Choice.
- Keine Prevention, Avoid, Interrupt oder Replacement.
- Kein Hosting, keine hosted Cards, keine Viren und keine neuen Counter-Familien.
- Keine offiziellen Karten, offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine automatische Spielbarkeit durch Import, Katalog oder Deckeditor.

## Must Requirements

| ID | Requirement |
|---|---|
| M095-SHARED-001 | `CardType` enthält `resource` additiv, ohne vorhandene Kartentypen oder V0.94-Verträge zu brechen. |
| M095-RIG-001 | Runner-Board/PlayerView kann installierte Resources öffentlich und side-sicher darstellen. |
| M095-INSTALL-001 | Runner kann eine freigegebene lokale Resource aus dem Grip nur über aktuelle `LegalActions` installieren. |
| M095-INSTALL-002 | Resource-Install prüft Timing, Side, Klick, Kosten, Zielkarte und StateVersion erneut in `applyAction`. |
| M095-TRASH-001 | Corp erhält `trash_resource` nur, wenn der Runner mindestens 1 Tag hat. |
| M095-TRASH-002 | `trash_resource` kostet 1 Corp-Klick und 2 Credits und ist nur im Corp-Aktionsfenster legal. |
| M095-TRASH-003 | `trash_resource` bewegt nur eine installierte Runner-Resource deterministisch in den Runner-Heap. |
| M095-TRASH-004 | `trash_resource` lehnt falsche Side, stale StateVersion, fehlende Tags, fehlende Kosten, nicht installierte Ziele und Nicht-Resources ab. |
| M095-VISIBILITY-001 | PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors, AI-Inputs und UI-Diagnostics leaken keine verdeckten Runner- oder Corp-Zonen. |
| M095-EVENT-001 | Resource-Install und Resource-Trash erzeugen public Events mit nur öffentlichen Resource-Daten. |
| M095-UNDO-001 | Resource-Trash ist selbst keine Hidden-Info-Barriere, solange nur öffentliche Boarddaten betroffen sind; bestehende Hidden-Info-Barrieren bleiben wirksam. |
| M095-REPLAY-001 | Install und Trash replayen deterministisch und erhalten identische StateHashes. |
| M095-AI-001 | AI nutzt Resources und `trash_resource` ausschließlich über PlayerView und LegalActions. |
| M095-MP-001 | Multiplayer Submit, Idempotency, Reconnect und Undo-Barrieren unterstützen Resource-Install und Resource-Trash side-sicher. |
| M095-CARD-001 | Mindestens eine lokale/fiktive Resource darf nur mit Manifest, Resolver/Ability, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke spielbar werden. |
| M095-DECK-001 | Deckvalidierung und Matchstart dürfen keine Resource deck-legal machen, deren Mechanik-Coverage, Manifest und Tests nicht freigegeben sind. |
| M095-NOSCOPE-001 | V0.96+-Mechaniken, insbesondere Trace/Link/Bidding, Multiaccess, Identity-Abilities, Hosting, Viren, Counter-Familien und Prevention, bleiben unspielbar. |
| M095-GATE-001 | V0.95 darf erst final abgeschlossen werden, wenn Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build grün sind oder Blocker dokumentiert und akzeptiert wurden. |

## Entscheidungen

- Installierte Resources sind in V0.95 immer faceup, aktiv und öffentlich.
- Resource-Trash ist ein public board event, kein `hidden_info_barrier`.
- Es gibt in V0.95 keine blanke generische Freischaltung importierter Resources. Spielbarkeit bleibt pro Karte gated.
- Eine Resource in Runner-Hand, Stack oder anderen verdeckten Zonen ist für die Corp nicht identifizierbar und nie Ziel von `trash_resource`.

## Gate

`MVP_0.95_requirements_freeze_done: true`

`ready_for_MVP_0.95_implementation: true`
