# V1.0.x Small Release Rollup Proposal

Status: proposal
Stand: 2026-05-17

## Zweck

Dieses Dokument schlägt einen begrenzten Rollup-Schnitt für kleine V1.0.x-Releasefamilien vor. Es verschiebt keine Dateien, glättet keine alten WIP- oder Blocker-Spuren und ersetzt keinen Implementation- oder Final-Review-Audit-Trail.

Der Vorschlag beschränkt sich auf zwei abgeschlossene Familien:

1. V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz.
2. V1.0.4 Private Match Lifecycle und Session Recovery.

V1.0.1 und V1.0.3 bleiben in diesem Vorschlag bewusst außerhalb des eigentlichen Rollups. Beide sind wichtige Brückenartefakte für Deck-/Matchstart-UX, aber sie liegen nicht als vollständig gleichförmige Plan-Requirements-Testmatrix-Review-Kette vor. Ein gemeinsamer Matchstart-Rollup würde dadurch historische Struktur rekonstruieren statt nur vorhandene Artefakte zu klassifizieren.

## Rollup-Zielbild ohne Datei-Moves

Empfohlener Zielzustand ist ein kleines Rollup-Index- oder Zusammenfassungsartefakt je Familie unter `docs/derived/`, das auf die bestehenden Nachweise verweist. Bestehende Artefakte bleiben an Ort und Stelle.

Implementation Reviews und Final Reviews bleiben primäre Audit-Artefakte. Rollup-Dokumente dürfen sie zusammenfassen, aber nicht ersetzen.

Mögliche spätere Zielartefakte unter `docs/derived/`:

- `V1_0_2_OPPONENT_ACTION_PRESENTATION_ROLLUP.md`
- `V1_0_4_PRIVATE_MATCH_LIFECYCLE_ROLLUP.md`

Diese Zielartefakte sollten nur Index, Status, Artefaktklassifikation, Gate-Ergebnis und Restgrenzen enthalten. Sie sollten keine alten Reviews umschreiben.

## Familie A: V1.0.2 Gegner-Aktionsdarstellung

V1.0.2 ist die sauberste kleine Rollup-Familie, weil die formale Kette vollständig vorhanden ist: Detailplan, Requirements, Spec, Testmatrix, Requirements Review, Implementation Review und Final Review.

| Artefakt | Klassifikation | Rollup-Behandlung |
|---|---|---|
| `docs/derived/V1_0_2_OPPONENT_ACTION_PRESENTATION_PLAN.md` | Detailplan | Verdichtungskandidat. Im Rollup nur Zweck, Scope, Nicht-Ziele, Umsetzungsreihenfolge und Risiken zusammenfassen. |
| `docs/derived/V1_0_2_REQUIREMENTS.md` | erledigte Requirements / Freeze | Archiv- und Referenzkandidat. Requirements bleiben nachvollziehbar, werden aber nach Done nicht als aktuelle Arbeitsliste geführt. |
| `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md` | technische Spezifikation | Referenz behalten. Rollup verlinkt auf Datenmodell, Sichtbarkeit, Queue und KI-Pacing statt Inhalte zu duplizieren. |
| `docs/derived/V1_0_2_TEST_MATRIX.md` | Testmatrix | Archiv- und Gate-Referenz. Rollup nennt nur die abgedeckten Testfamilien und Pflichtchecks. |
| `docs/derived/V1_0_2_REQUIREMENTS_REVIEW.md` | Requirements Review | Audit-Trail behalten. Nicht verdichten, weil die Freigabeentscheidung selbst prüfrelevant ist. |
| `docs/derived/V1_0_2_IMPLEMENTATION_REVIEW.md` | Implementation Review | Audit-Trail behalten. Primärer Umsetzungsnachweis. |
| `docs/derived/V1_0_2_FINAL_REVIEW.md` | Final Review | Audit-Trail behalten. Primäres Done-/Gate-Artefakt. |

Architekturgrenze: Das Rollup muss festhalten, dass V1.0.2 Präsentation und Orchestrierung ergänzt hat, aber keine neue Regelautorität eingeführt hat. Cue-Queue, Board-Highlights, Audio und KI-Pacing bleiben außerhalb von Engine-State, Replay und StateHash.

## Familie B: V1.0.4 Private Match Lifecycle

V1.0.4 ist als zweite Familie geeignet, weil es einen klaren privaten Match-Lifecycle-Schnitt bildet: Cancel, Leave, Forfeit, Recreate, Session-Recovery, Gegnername und Transportweg. Die Dokumentkette ist nicht ganz so symmetrisch wie V1.0.2, aber Implementation Review und Final Review liegen vor.

| Artefakt | Klassifikation | Rollup-Behandlung |
|---|---|---|
| `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md` | Herkunfts- und Kandidatendokument | Archivkandidat. Nicht glätten; nur als Ursprung der Zuschnittsentscheidung verlinken. |
| `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md` | kanonischer Detailplan | Verdichtungskandidat. Rollup kann Statusmodell, Scope, Nicht-Ziele, Risiken und Akzeptanzkriterien zusammenfassen. |
| `docs/derived/V1_0_4_REQUIREMENTS.md` | erledigte Requirements / Freeze | Archiv- und Referenzkandidat. Requirements bleiben als Freeze-Nachweis verlinkt. |
| `docs/derived/V1_0_4_TWO_TAB_SMOKE.md` | wiederholbarer Smoke / Testnachweis | Testreferenz behalten. Da keine eigenständige `V1_0_4_TEST_MATRIX.md` existiert, nicht rückwirkend als Matrix ausgeben. |
| `docs/derived/V1_0_4_IMPLEMENTATION_REVIEW.md` | Implementation Review | Audit-Trail behalten. Primärer Umsetzungsnachweis. |
| `docs/derived/V1_0_4_FINAL_REVIEW.md` | Final Review | Audit-Trail behalten. Primäres Done-/Gate-Artefakt. |

Nicht vorhandene Artefakte sollten im Rollup ausdrücklich als nicht vorhanden markiert werden:

- keine separate `V1_0_4_TEST_MATRIX.md`;
- keine separate `V1_0_4_REQUIREMENTS_REVIEW.md`;
- keine separate `MATCH_LIFECYCLE_1_0_4_SPEC.md`.

Das ist kein Mangel des historischen Stands, sondern eine Grenze des Rollups. Eine spätere Normalisierung darf diese Lücken dokumentieren, aber nicht so tun, als hätten die damaligen Gate-Artefakte bereits existiert.

Architekturgrenze: Das Rollup muss festhalten, dass V1.0.4 Match-Lifecycle und Server-/UI-Orchestrierung betrifft. Forfeit ist kein Engine-Sieg, Cancel/Leave sind keine Engine-Actions, Recreate erzeugt neue Match- und Token-Identität, und Reconnect-Tokens bleiben außerhalb lokaler Recent-Session-Metadaten.

## Nicht ausgewählte V1.0.x-Artefakte

| Artefakt | Begründung |
|---|---|
| `docs/derived/V1_0_1_JOIN_DECK_HANDSHAKE_PLAN.md` | Enthält Plan, Produktentscheidung, Technikziel und Umsetzungsergebnis in einem Dokument. Für ein Rollup wäre zuerst eine historische Aufteilung nötig. |
| `docs/derived/V1_0_3_MATCHSTART_UX_PLAN.md` | Sehr umfangreicher Plan mit Umsetzungsvorgaben, Risiken und geklärten Entscheidungen; keine eigenständige Requirements/Testmatrix/Implementation-Review-Kette. |
| `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md` | Als Final Review wichtig, aber ohne symmetrische Artefaktkette kein eigenständiger kleiner Rollup-Schnitt in diesem Paket. |
| `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md` | Gehört nur als Herkunftsdokument zu V1.0.4, nicht als aktive Release-Spezifikation. |

## Linkbruchrisiken

Da dieser Vorschlag keine Datei bewegt, entstehen unmittelbar keine Linkbrüche.

Risiken bei späteren Moves oder Umbenennungen:

- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` verlinkt und erwähnt V1.0.x-Artefakte direkt.
- `docs/derived/RELEASE_PLANNING_2026-05-05.md` und andere spätere Planungsartefakte können historische V1.0.4-/V1.0.5-Bezüge enthalten.
- Activity-Dateien und Final Reviews können alte Dateinamen als Auditnachweis verwenden.
- Externe Thread- oder Commit-Historie verweist nur auf die bestehenden Pfade.

Empfehlung: Keine Moves für erledigte Audit-Artefakte. Falls später doch eine Zielstruktur eingeführt wird, nur additive Rollup-Dateien anlegen und die alten Dateien als führende Nachweise behalten.

## Empfohlene Zielstruktur

Ohne Moves:

```text
docs/derived/
  V1_0_SMALL_RELEASE_ROLLUP_PROPOSAL.md
  V1_0_2_OPPONENT_ACTION_PRESENTATION_ROLLUP.md      # optional später
  V1_0_4_PRIVATE_MATCH_LIFECYCLE_ROLLUP.md           # optional später
```

Nicht empfohlen:

```text
docs/derived/v1-0-archive/
docs/derived/v1-0-rollups/
```

Neue Unterordner würden für den aktuellen Nutzen zu viele historische Links, Wiki-Index-Einträge und Audit-Pfade berühren.

## Entscheidungsvorschlag

Für den nächsten kleinen Dokumentationsschnitt genügt ein additives Rollup je Familie:

- V1.0.2 als Muster-Rollup mit vollständiger Artefaktkette.
- V1.0.4 als Lifecycle-Rollup mit expliziter Lückennotiz zu fehlender separater Testmatrix und Requirements Review.

V1.0.1 und V1.0.3 sollten erst in einem separaten Matchstart-/Deck-UX-Rollup betrachtet werden, wenn ausdrücklich gewünscht ist, asymmetrische historische Artefakte zusammenzufassen.
