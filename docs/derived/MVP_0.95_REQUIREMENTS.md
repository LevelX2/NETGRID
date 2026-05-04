# MVP 0.95 Requirements

Status: eingefroren
Stand: 2026-05-04

## Ziel

V0.95 fuehrt Runner-Resources als Kartentyp und Boardbereich ein und verbindet den bestehenden Tag-Status mit der Corp-Basic-Action zum Resource-Trash. Der Scope bleibt eng: Resources sind installierbar, oeffentlich sichtbar und bei getaggtem Runner trashbar. Trace, Link, Bidding, Prevention, Hosting, Viren und Counterfamilien bleiben ausserhalb dieser Version.

Der Requirements-Freeze basiert auf V0.94, `MVP_0.95_DETAILED_PLAN.md`, `MVP_0.94_0.95_ASSUMPTION_REVIEW.md`, `MECHANICS_COVERAGE_MATRIX.md`, `data/rules/mechanics-coverage-0.94.json` und einem gezielten CR-v26.03-Abgleich. Die Regelreferenz bestaetigt fuer den V0.95-Startscope: Runner-Resources werden faceup und aktiv in die Play Area installiert, es gibt kein Resource-Limit, und waehrend der Runner getaggt ist, kann die Corp als Action 1 Klick und 2 Credits ausgeben, um eine installierte Runner-Resource zu trashen.

## Must Requirements

| ID | Anforderung | Abdeckung |
|---|---|---|
| M095-SHARED-001 | Shared muss `resource` additiv als Runner-Kartentyp und Resource-Boardbereich modellieren, ohne bestehende Karten-/Deckschemas zu brechen. | Shared/Engine Typecheck |
| M095-RIG-001 | `GameState`, Zone-/Rig-Modell und PlayerViews muessen installierte Runner-Resources deterministisch und side-sicher abbilden. | Engine/View Tests |
| M095-INSTALL-001 | Runner darf eine lokale/fiktive Resource aus Grip nur ueber LegalActions installieren, wenn Side, Timing, Klick, Credits und Karte legal sind. | Engine Unit Tests |
| M095-INSTALL-002 | Installierte Resources liegen faceup, aktiv und fuer beide Seiten als oeffentliche Boardkarten sichtbar im Runner-Board. | Visibility Tests |
| M095-TRASH-001 | Corp erhaelt Resource-Trash-LegalActions nur in ihrer Action Phase, nur wenn der Runner mindestens einen Tag hat und nur fuer installierte Runner-Resources. | Engine LegalAction Tests |
| M095-TRASH-002 | Resource-Trash kostet genau 1 Corp-Klick und 2 Corp-Credits und bewegt die Resource deterministisch in den Runner-Heap. | Engine Unit Tests |
| M095-TRASH-003 | `applyAction` muss Side, actionId, stateVersion, Timing, Tags, Klicks, Credits, Ziel und Resource-Zone erneut validieren. | Illegal/Stale Tests |
| M095-TRASH-004 | Resource-Trash ist bei ungetaggtem Runner, falscher Side, zu wenig Klicks/Credits, stale StateVersion, nicht installierter Karte oder falschem Ziel illegal. | Negative Tests |
| M095-VISIBILITY-001 | Resource-Install und Resource-Trash duerfen keine Runner-Grip-, Stack-, Corp-HQ- oder R&D-Daten in PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Fehler, Logs, AI-Input oder UI-Diagnostics leaken. | Visibility Contract |
| M095-EVENT-001 | Resource-Install und Resource-Trash erzeugen oeffentliche, redigierte Events. Resource-Trash ist keine Hidden-Info-Barriere, solange nur oeffentliche installierte Resource-Daten betroffen sind. | Event/Undo Tests |
| M095-UNDO-001 | Undo darf durch Resource-Trash selbst nicht blockiert werden, wenn seit dem Ziel-Snapshot keine andere Hidden-Info-Barriere liegt. Bestehende Hidden-Info-Barrieren bleiben unveraendert blockierend. | Server Undo Tests |
| M095-REPLAY-001 | Replay muss Resource-Install, Resource-Trash, Zone-Moves, Eventpayloads und finalen StateHash deterministisch reproduzieren. | Replay/StateHash |
| M095-AI-001 | AI darf Resource-/Tag-Situationen nur aus PlayerView, LegalActions und side-gefilterten Events bewerten und keine FullState- oder Hidden-Info-Pfade nutzen. | AI Smokes |
| M095-MP-001 | Multiplayer Submit, Idempotency, Stale-State-Ablehnung, Reconnect, EventTail und Undo bleiben fuer Resource-Install/Trash side-sicher. | Server Smokes |
| M095-CARD-001 | Jede lokale/fiktive Resource-Karte darf erst `playable_mvp` werden, wenn Manifest, Resolver/Ability, Unit-Test, Szenario, Visibility-Test, Replay/StateHash-Test, AI-Smoke und Multiplayer-Smoke vorhanden sind. | Manifest/Testmatrix |
| M095-DECK-001 | Import, Katalog, Deckeditor oder lokale Kartenbilder duerfen keine Resource automatisch spielbar, deck-legal, engine-aktiv oder matchstartfaehig machen. | Artifact/Deck Tests |
| M095-NOSCOPE-001 | V0.95 darf keine Trace-, Link-, Bidding-, Prevention-, Avoid-, Interrupt-, Replacement-, Hosting-, Virus-, Purge-, Counter-, Multiaccess-, Identity- oder Mulligan-Mechanik spielbar machen. | No-Scope Regression |

## Should Requirements

| ID | Anforderung | Abdeckung |
|---|---|---|
| M095-SHOULD-001 | Resource-Install sollte den bestehenden `install_card`-Pfad erweitern, statt einen parallelen Resource-Sonderpfad zu bauen. | Implementation Review |
| M095-SHOULD-002 | Resource-Trash sollte als explizite LegalAction mit stabiler `actionId` umgesetzt werden, damit Server-Idempotency und Replay klar bleiben. | Engine/Server Tests |
| M095-SHOULD-003 | Mindestens eine lokale/fiktive Resource sollte eine einfache oeffentliche Economy- oder Setup-Rolle haben, aber keine Hidden-Info-Choice oder komplexe laufende Ability. | Manifest/AI Review |

## Nicht-Ziele

- Kein Trace, Link oder Bidding.
- Keine Prevention, Avoid, Interrupt oder Replacement.
- Keine Hosting-Beziehungen, Hosted Credits oder Recurring Credits.
- Keine Viren, Purge oder neue Counterfamilien.
- Keine Resource mit Hidden-Info-Choice.
- Keine offiziellen Karten, offiziellen Bilder, Card Frames, Card Backs oder externen Kartendatenbank-Abhaengigkeiten.
- Keine automatische Spielbarkeit durch Import, Katalog, Deckeditor oder lokale Kartenbilder.
- Kein Deckbuilding-/Formatregel-Ausbau ausser den engen lokalen V0.95-Artefakten.

## Gate Requirement

| ID | Anforderung |
|---|---|
| M095-GATE-001 | V0.95 darf erst implementiert werden, wenn diese Requirements, `RESOURCE_TAG_INTERACTION_0.95_SPEC.md`, `MVP_0.95_TEST_MATRIX.md` und `MVP_0.95_REQUIREMENTS_REVIEW.md` vorhanden sind und das Requirements Review `ready_for_MVP_0.95_implementation: true` meldet. |
