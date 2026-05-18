# V1.2.2 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprueft wurden:

- `docs/releases/v1/v1-2-2-special-zones-ownership-control/plan.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/requirements.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/spec.md`
- `docs/releases/v1/v1-2-2-special-zones-ownership-control/test-matrix.md`
- `docs/releases/v1/v1-2-1-replacement-effects/final-review.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`

## Ergebnis

`V1_2_2_requirements_freeze_done: true`

`ready_for_implementation: true`

V1.2.2 ist ausreichend geplant, um nach V1.2.1 umgesetzt zu werden. Der Scope ist eng genug: Sonderzonen, Owner/Controller und Control-Wechsel werden als Engine-Grundlage geplant, ohne Karten, KI-Decks, Formatregeln oder Public-Funktionen freizugeben.

## Geklaerte Entscheidungen

- `set_aside` und `removed_from_game` sind die einzigen V1.2.2-Spezialzonen.
- Owner und Controller werden getrennt; Ownership bleibt unveraenderlich.
- Control-Wechsel ist eine deterministische Engine-Transition.
- Removed from Game ist im Runtime-Vertrag terminal.
- Rueckkehr aus Set Aside ist hoechstens test-only.
- V1.2.3 darf Kartenkandidaten erst nach gruenem V1.2.2-Gate freigeben.

## Staerken

- Hidden-Info-Gates fuer PlayerViews, Reconnect, PublicEvents und AIInput sind explizit.
- Host-/Trash-Kaskaden werden als Risiko behandelt, nicht nebenbei angenommen.
- Replay/StateHash ist fuer Zone und Controller als Pflicht aufgenommen.
- No-Scope-Grenzen verhindern automatische Karten- und KI-Freigaben.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| ZoneRef-Duplikate durch Move-Fehler. | Sehr hoch | V122-T004 und Invariantentest. |
| Controllerwechsel leakt verdeckte Quelle. | Hoch | V122-T016 bis V122-T023. |
| Ownership wird versehentlich veraenderbar. | Hoch | V122-MUST-006 und V122-T005. |
| Host-Kaskaden brechen bei kontrollierten Karten. | Hoch | V122-T011. |
| V1.2.3 nimmt Karten vor finalem Mechanikgate auf. | Mittel | Handoff-Abhaengigkeit und V122-MUST-032. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die technische Form als ZoneKind oder ZoneState wird im Umsetzungsthread festgelegt.
- Die genaue test-only Harnesskarte oder Harnessfunktion wird im Implementation Review dokumentiert.

## Gate

V1.2.2 ist bereit fuer Umsetzung.
