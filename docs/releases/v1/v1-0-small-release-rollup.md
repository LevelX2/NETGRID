# V1.0.x Small Release Rollup Proposal

Status: implemented-v1-0-and-v1-1-move
Stand: 2026-05-18

## Zweck

Dieses Dokument dokumentiert den begrenzten Rollup- und Move-Schnitt für kleine V1.0.x-Releasefamilien. Es glättet keine alten WIP- oder Blocker-Spuren und ersetzt keinen Implementation- oder Final-Review-Audit-Trail.

Der ursprüngliche Vorschlag beschränkte sich auf zwei abgeschlossene Familien:

1. V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz.
2. V1.0.4 Private Match Lifecycle und Session Recovery.

V1.0.1 und V1.0.3 bleiben bewusst außerhalb des eigentlichen Rollups. Beide sind wichtige Brückenartefakte für Deck-/Matchstart-UX, aber sie liegen nicht als vollständig gleichförmige Plan-Requirements-Testmatrix-Review-Kette vor. Ein gemeinsamer Matchstart-Rollup würde dadurch historische Struktur rekonstruieren statt nur vorhandene Artefakte zu klassifizieren.

Diese Scope-Grenze gilt weiterhin für den Rollup selbst. Der spätere Strukturmove hat die asymmetrischen V1.0.1-/V1.0.3-Brückenartefakte, die Karten-Nachrelease-Stränge und die V1.1-Familien trotzdem in eigene Zielordner unter `docs/releases/v1/` verschoben, ohne ihre historische Form zu glätten.

## Umsetzung 2026-05-18

Nach der Zielstrukturentscheidung `docs/decisions/docs-structure-target-decision-2026-05-18.md` wurde der ursprünglich konservative No-Move-Vorschlag als begrenzter Release-Move umgesetzt:

- V1.0.2 liegt unter `docs/releases/v1/v1-0-2-opponent-action-presentation/`.
- V1.0.4 liegt unter `docs/releases/v1/v1-0-4-private-match-lifecycle/`.
- V1.0.5 liegt seit dem Folgeschnitt unter `docs/releases/v1/v1-0-5-action-board-ux/`.
- V1.0.6 bis V1.0.9 liegen seit dem größeren Folgeschnitt unter `docs/releases/v1/`.
- V1.0.1 und V1.0.3 liegen seit dem späteren Strukturmove als eigene historische Brückenfamilien unter `docs/releases/v1/`.
- V1.0.5K, V1.0.6K und V1.1.2K liegen seit dem späteren Strukturmove unter `docs/releases/v1/card-releases/`.
- V1.1.0 bis V1.1.3 liegen seit dem späteren Strukturmove unter `docs/releases/v1/`.
- Die Move-Variante ist vollständige Linkmigration ohne Redirect-Stubs.

Implementation Reviews und Final Reviews bleiben primäre Audit-Artefakte. Die neuen README-Dateien fassen nur Index, Status, Artefaktklassifikation, Gate-Ergebnis und Restgrenzen zusammen.

## Familie A: V1.0.2 Gegner-Aktionsdarstellung

V1.0.2 ist die sauberste kleine Rollup-Familie, weil die formale Kette vollständig vorhanden ist: Detailplan, Requirements, Spec, Testmatrix, Requirements Review, Implementation Review und Final Review.

| Artefakt | Klassifikation | Rollup-Behandlung |
|---|---|---|
| `docs/releases/v1/v1-0-2-opponent-action-presentation/plan.md` | Detailplan | Verdichtungskandidat. Im Rollup nur Zweck, Scope, Nicht-Ziele, Umsetzungsreihenfolge und Risiken zusammenfassen. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements.md` | erledigte Requirements / Freeze | Archiv- und Referenzkandidat. Requirements bleiben nachvollziehbar, werden aber nach Done nicht als aktuelle Arbeitsliste geführt. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/spec.md` | technische Spezifikation | Referenz behalten. Rollup verlinkt auf Datenmodell, Sichtbarkeit, Queue und KI-Pacing statt Inhalte zu duplizieren. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/test-matrix.md` | Testmatrix | Archiv- und Gate-Referenz. Rollup nennt nur die abgedeckten Testfamilien und Pflichtchecks. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements-review.md` | Requirements Review | Audit-Trail behalten. Nicht verdichten, weil die Freigabeentscheidung selbst prüfrelevant ist. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/implementation-review.md` | Implementation Review | Audit-Trail behalten. Primärer Umsetzungsnachweis. |
| `docs/releases/v1/v1-0-2-opponent-action-presentation/final-review.md` | Final Review | Audit-Trail behalten. Primäres Done-/Gate-Artefakt. |

Architekturgrenze: Das Rollup muss festhalten, dass V1.0.2 Präsentation und Orchestrierung ergänzt hat, aber keine neue Regelautorität eingeführt hat. Cue-Queue, Board-Highlights, Audio und KI-Pacing bleiben außerhalb von Engine-State, Replay und StateHash.

## Familie B: V1.0.4 Private Match Lifecycle

V1.0.4 ist als zweite Familie geeignet, weil es einen klaren privaten Match-Lifecycle-Schnitt bildet: Cancel, Leave, Forfeit, Recreate, Session-Recovery, Gegnername und Transportweg. Die Dokumentkette ist nicht ganz so symmetrisch wie V1.0.2, aber Implementation Review und Final Review liegen vor.

| Artefakt | Klassifikation | Rollup-Behandlung |
|---|---|---|
| `docs/releases/v1/v1-0-4-private-match-lifecycle/next-release-candidates.md` | Herkunfts- und Kandidatendokument | Archivkandidat. Nicht glätten; nur als Ursprung der Zuschnittsentscheidung verlinken. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/plan.md` | kanonischer Detailplan | Verdichtungskandidat. Rollup kann Statusmodell, Scope, Nicht-Ziele, Risiken und Akzeptanzkriterien zusammenfassen. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/requirements.md` | erledigte Requirements / Freeze | Archiv- und Referenzkandidat. Requirements bleiben als Freeze-Nachweis verlinkt. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/two-tab-smoke.md` | wiederholbarer Smoke / Testnachweis | Testreferenz behalten. Da keine eigenständige `V1_0_4_TEST_MATRIX.md` existiert, nicht rückwirkend als Matrix ausgeben. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/implementation-review.md` | Implementation Review | Audit-Trail behalten. Primärer Umsetzungsnachweis. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/final-review.md` | Final Review | Audit-Trail behalten. Primäres Done-/Gate-Artefakt. |

Nicht vorhandene Artefakte sollten im Rollup ausdrücklich als nicht vorhanden markiert werden:

- keine separate `V1_0_4_TEST_MATRIX.md`;
- keine separate `V1_0_4_REQUIREMENTS_REVIEW.md`;
- keine separate `MATCH_LIFECYCLE_1_0_4_SPEC.md`.

Das ist kein Mangel des historischen Stands, sondern eine Grenze des Rollups. Eine spätere Normalisierung darf diese Lücken dokumentieren, aber nicht so tun, als hätten die damaligen Gate-Artefakte bereits existiert.

Architekturgrenze: Das Rollup muss festhalten, dass V1.0.4 Match-Lifecycle und Server-/UI-Orchestrierung betrifft. Forfeit ist kein Engine-Sieg, Cancel/Leave sind keine Engine-Actions, Recreate erzeugt neue Match- und Token-Identität, und Reconnect-Tokens bleiben außerhalb lokaler Recent-Session-Metadaten.

## Familie C: V1.0.5 Action Board UX

V1.0.5 ist als dritter kleiner Move-Schnitt geeignet, weil die UI-/Board-Klarheitsartefakte eine klar abgegrenzte Requirements-Familie bilden: Detailplan, Requirements, zwei Specs, Testmatrix, Requirements Review und Browser-/Playtest-Smoke. Anders als V1.0.2 und V1.0.4 hat diese Familie keine eigenen formalen Implementation- oder Final-Review-Artefakte; diese Lücke wird dokumentiert und nicht künstlich rekonstruiert.

| Artefakt | Klassifikation | Rollup-Behandlung |
|---|---|---|
| `docs/releases/v1/v1-0-5-action-board-ux/plan.md` | kanonischer Detailplan | Referenz behalten; Scope, Nicht-Ziele und UI-Grenzen bleiben prüfrelevant. |
| `docs/releases/v1/v1-0-5-action-board-ux/requirements.md` | Requirements Freeze | Referenz behalten; enthält das projektinterne UI-Glossar und die Scope-Grenzen. |
| `docs/releases/v1/v1-0-5-action-board-ux/action-board-ux-spec.md` | UI-Spezifikation | Referenz behalten; betrifft aktive Spieloberfläche, Cues, Action Panel, Audio und KI-Takt. |
| `docs/releases/v1/v1-0-5-action-board-ux/board-run-ui-spec.md` | Board-/Run-Spezifikation | Referenz behalten; betrifft RunTimeline, Runner-Rig, zentrale Server und ICE-/Rez-Darstellung. |
| `docs/releases/v1/v1-0-5-action-board-ux/test-matrix.md` | Testmatrix | Gate- und Regression-Referenz behalten. |
| `docs/releases/v1/v1-0-5-action-board-ux/requirements-review.md` | Requirements Review | Audit-Trail behalten; primärer Freigabenachweis. |
| `docs/releases/v1/v1-0-5-action-board-ux/browser-playtest-smoke.md` | wiederholbarer Smoke | Testreferenz behalten. |

Nicht vorhandene Artefakte:

- keine separate `V1_0_5_IMPLEMENTATION_REVIEW.md`;
- keine separate `V1_0_5_FINAL_REVIEW.md`.

Architekturgrenze: V1.0.5 bleibt ein UI-/Präsentationsrelease. Die Darstellung nutzt nur `PlayerView`, `LegalActions`, side-gefilterte Events, side-sichere Match-Payloads und lokale UI-Einstellungen. Engine-Regelautorität, Kartenpool, Replay, RandomDrawRecords und StateHash werden nicht erweitert.

## Familien D bis G: V1.0.6 bis V1.0.9

Der größere Folgeschnitt migriert die restlichen nicht-kartenbezogenen V1.0.x-Familien, weil sie vollständige Releaseketten mit Plan, Requirements, Specs, Testmatrix, Requirements Review, Implementation Review und Final Review bilden.

| Familie | Zielordner | Kurzscope |
|---|---|---|
| V1.0.6 | `docs/releases/v1/v1-0-6-ui-resource-clarity/` | Aktionen, Credits, Kostenchips und Card-Display-Steuerung. |
| V1.0.7 | `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/` | Browser-E2E-/Visual-QA-Gate mit Viewports, Screenshots und Leak-Scans. |
| V1.0.8 | `docs/releases/v1/v1-0-8-storage-backup-hardening/` | SQLite-Storage, Legacy-Import, Backup, Restore, Recovery und E2E-Isolation. |
| V1.0.9 | `docs/releases/v1/v1-0-9-private-internet-hardening/` | Privater Internetbetrieb mit Transport-, Origin-, Rate-Limit-, Secret-, Health- und Ops-Härtung. |

Architekturgrenze: Diese Familien bleiben UI-, Testinfra-, Storage-/Ops- oder Rand-Härtungsreleases. Sie machen keine neuen Karten, Mechaniken, öffentlichen Plattformfunktionen oder Engine-Regelautoritätsänderungen.

## Nicht Teil dieses V1.0.x-Rollups

| Artefakt | Begründung |
|---|---|
| `docs/releases/v1/v1-0-1-join-deck-handshake/plan.md` | Enthält Plan, Produktentscheidung, Technikziel und Umsetzungsergebnis in einem Dokument. Für ein Rollup wäre zuerst eine historische Aufteilung nötig. |
| `docs/releases/v1/v1-0-3-matchstart-ux/plan.md` | Sehr umfangreicher Plan mit Umsetzungsvorgaben, Risiken und geklärten Entscheidungen; keine eigenständige Requirements/Testmatrix/Implementation-Review-Kette. |
| `docs/releases/v1/v1-0-3-matchstart-ux/final-review.md` | Als Final Review wichtig, aber ohne symmetrische Artefaktkette kein eigenständiger kleiner Rollup-Schnitt in diesem Paket. |
| `docs/releases/v1/v1-0-4-private-match-lifecycle/next-release-candidates.md` | Gehört nur als Herkunftsdokument zu V1.0.4, nicht als aktive Release-Spezifikation. |
| `docs/releases/v1/card-releases/v1-0-5k-card-release/requirements.md` und `docs/releases/v1/card-releases/v1-0-5k-card-release/implementation-review.md` | Separater Karten-Nachrelease, nicht Teil des UI-/Board-Klarheitsrelease V1.0.5. |
| `docs/releases/v1/card-releases/v1-0-6k-card-release/requirements.md` und `docs/releases/v1/card-releases/v1-0-6k-card-release/implementation-review.md` | Separater Karten-Nachrelease, nicht Teil des UI-/Ops-/Hardening-Strangs V1.0.6 bis V1.0.9. |

## Linkbruchrisiken

Der ursprüngliche Vorschlag bewegte keine Dateien. Der umgesetzte Move vom 2026-05-18 hat die harten Pfadlinks auf V1.0.2, V1.0.4, V1.0.5, V1.0.6 bis V1.0.9 und im späteren Strukturmove auch V1.0.1, V1.0.3, V1.0.5K, V1.0.6K sowie V1.1.x mechanisch migriert.

Risiken bei späteren Moves oder Umbenennungen:

- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` verlinkt und erwähnt V1.0.x-Artefakte direkt.
- `docs/releases/roadmaps/release-planning-2026-05-05.md` und andere spätere Planungsartefakte können historische V1.0.4-/V1.0.5-Bezüge enthalten.
- Activity-Dateien und Final Reviews können alte Dateinamen als Auditnachweis verwenden.
- Externe Thread- oder Commit-Historie verweist nur auf die bestehenden Pfade.

Für spätere V1.x-Moves gilt weiterhin: nur kleine Familien, vorher Linkaudit, Final Reviews und Implementation Reviews behalten.

## Umgesetzte Zielstruktur

```text
docs/releases/v1/
  README.md
  v1-0-2-opponent-action-presentation/
    README.md
    final-review.md
    implementation-review.md
    requirements-review.md
    requirements.md
    spec.md
    test-matrix.md
    plan.md
  v1-0-4-private-match-lifecycle/
    README.md
    final-review.md
    implementation-review.md
    requirements.md
    two-tab-smoke.md
    plan.md
    next-release-candidates.md
  v1-0-5-action-board-ux/
    README.md
    plan.md
    requirements.md
    action-board-ux-spec.md
    board-run-ui-spec.md
    test-matrix.md
    requirements-review.md
    browser-playtest-smoke.md
  v1-0-6-ui-resource-clarity/
    README.md
    plan.md
    requirements.md
    resource-card-display-spec.md
    test-matrix.md
    requirements-review.md
    browser-playtest-smoke.md
    implementation-review.md
    final-review.md
  v1-0-7-browser-e2e-visual-qa/
    README.md
    plan.md
    requirements.md
    browser-e2e-visual-qa-spec.md
    test-matrix.md
    requirements-review.md
    implementation-review.md
    final-review.md
  v1-0-8-storage-backup-hardening/
    README.md
    plan.md
    requirements.md
    storage-sqlite-spec.md
    backup-recovery-spec.md
    test-matrix.md
    requirements-review.md
    implementation-review.md
    final-review.md
  v1-0-9-private-internet-hardening/
    README.md
    plan.md
    requirements.md
    private-internet-security-spec.md
    private-deployment-ops-spec.md
    test-matrix.md
    requirements-review.md
    implementation-review.md
    final-review.md
```

Nicht umgesetzt wurden Sammelordner unter `docs/derived/` und kein breiter V1.0.x-Archivordner. Weitere migrierte V1.0-/V1.1-Familien sind im übergeordneten Index `docs/releases/v1/README.md` aufgeführt.

## Entscheidung

Der umgesetzte Schnitt umfasst jetzt die nicht-kartenbezogenen Familien V1.0.2 bis V1.0.9:

- V1.0.2 als Musterfamilie mit vollständiger Artefaktkette.
- V1.0.4 als Lifecycle-Familie mit expliziter Lückennotiz zu fehlender separater Testmatrix und Requirements Review.
- V1.0.5 als UI-/Board-Klarheitsfamilie mit expliziter Lückennotiz zu fehlendem Implementation und Final Review.
- V1.0.6 bis V1.0.9 als vollständige UI-, Testinfra-, Storage- und Private-Internet-Hardening-Familien.

V1.0.1 und V1.0.3 sind strukturell migriert, aber weiterhin keine nachträglich normalisierten Releaseketten. V1.0.5K, V1.0.6K, V1.1.2K und die V1.1-Familien sind strukturell migriert; ihre fachliche Verdichtung bleibt eine separate spätere Entscheidung.
