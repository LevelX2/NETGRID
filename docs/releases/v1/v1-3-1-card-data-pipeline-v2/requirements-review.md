# V1.3.1 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/plan.md`
- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/requirements.md`
- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/spec.md`
- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/test-matrix.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/final-review.md`
- bestehende Catalog-, Deck-, Manifest- und AI-Rollen-Strukturen

## Ergebnis

`V1_3_1_requirements_freeze_done: true`

`ready_for_implementation_after_V1_3_0: true`

V1.3.1 ist ausreichend geplant, um nach V1.3.0 umgesetzt zu werden. Der Release ist bewusst als Datenpipeline- und Review-Gate geschnitten. Er führt keine neuen Karten, Mechaniken, KI-Strategien, offiziellen Assets oder Public-Plattformfunktionen ein.

## Geklärte Entscheidungen

- Source Registry v2 und Pipeline Snapshot sind versionierte Projektartefakte.
- Importstatus, Katalogstatus, Spielbarkeit, Decklegalität, Formatlegalität und KI-Support bleiben getrennt.
- AI-Hints v2 bereiten V1.4.x vor, setzen aber nicht selbst `ai_supported`.
- Diffs und Rollbacks betreffen Datenstände, nicht laufende Matches.
- Kartentext bleibt display-only, solange kein expliziter Resolver-/Ability-Vertrag vorliegt.

## Stärken

- Die Planung nimmt die V1.3.0-Statuskette auf und verhindert Freigabe-Drift.
- AI-Hints werden vor der planbasierten KI normalisiert.
- Diff und Rollback machen Datenpflege reviewfähig.
- No-Scope-Grenzen sind testbar.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| AI-Hints werden mit KI-Freigabe verwechselt. | Hoch | Eigenes `aiSupportStatus` und Gate-Tests. |
| Text-/Errata-Änderungen verändern still Regeln. | Sehr hoch | Display-only Text und ResolverRef-Review. |
| Private Pfade oder Assetdaten leaken. | Hoch | Redaction-Tests für Reports/API/Payloads. |
| Pipeline wird zu breit für einen Release. | Mittel | V1.3.1 bleibt auf Daten, Diff, Rollback und Hints beschränkt. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die Umsetzung darf konkrete Datei- und Typnamen an bestehende `packages/catalog`, `packages/decks` und `packages/ai` Strukturen anpassen.
- Die erste Hints-v2-Migration darf nur bestehende unterstützte Karten sauber abdecken und übrige Karten als KI-blockiert reporten.

## Gate

V1.3.1 ist nach V1.3.0 bereit für Umsetzung.
