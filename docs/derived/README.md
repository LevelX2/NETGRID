# Abgeleitete Artefakte

`docs/derived/` enthält bestehende dauerhafte, aus Quellen und Projektarbeit abgeleitete NETGRID-Artefakte. Seit der Strukturentscheidung `docs/derived/DOCS_STRUCTURE_TARGET_DECISION_2026_05_18.md` ist dieser Ordner ein Übergangs- und Bestandsbereich, nicht mehr der pauschale Zielort für neue Dauerartefakte.

## Typische Inhalte

- Release- und Roadmap-Pläne
- Requirements und Requirements Reviews
- Spezifikationen
- Testmatrizen
- Implementation Reviews
- Final Reviews
- größere Analyse-, Audit-, Handoff- und Entscheidungsberichte

## Abgrenzung zur Aktivitäten-Pipeline

Offene, noch nicht formalisierte Arbeitspakete gehören nach `docs/activities/inbox/`. Sobald aus einem Paket ein dauerhafter Plan, eine Spezifikation, ein Review oder ein Abschlussnachweis entsteht, wird das Ergebnis hier abgelegt und aus dem Aktivitätspaket verlinkt.

Neue allgemeine Projektaktivitäten sollen über `docs/activities/` laufen. Abgeschlossene Job- oder Prüfnotizen werden nur dann hier gehalten, wenn noch kein passender Zielbereich eingeführt ist.

## Übergangsregel

Bestehende Pfade unter `docs/derived/` bleiben kanonisch, bis ein kleines Move-Paket mit Linkaudit einen Zielbereich wie `docs/releases/`, `docs/architecture/`, `docs/decisions/`, `docs/runbooks/`, `docs/operations/`, `docs/reviews/` oder `docs/archive/` einführt. Es gibt keine Masselöschung und keine Massenverschiebung ohne Rollup, Linkprüfung und explizite Entscheidung.

Erste Pilot-Moves seit 2026-05-18 sind die abgeschlossene Backend-0.5-Familie unter `docs/releases/backend-ops/backend-0-5/`, die historische MVP-0.x-Kette unter `docs/releases/mvp/`, die S01-Sonderphase unter `docs/releases/special/s01/`, die V1.0- bis V1.9.22-Familien unter `docs/releases/v1/`, die aktiven V2.x-Plattformverträge unter `docs/releases/v2/`, die Originalset-Spotcheck-Evidence unter `docs/reviews/originalset-spotchecks/`, die abgeschlossenen Originalset-Spotcheck-Jobs unter `docs/archive/originalset-spotcheck-jobs/2026-05/` und die Ability-Engine-Architektur unter `docs/architecture/ability-engine/`.
