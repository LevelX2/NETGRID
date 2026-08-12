# Backend 0.5 Release Index

Status: `historical_release_family`
Stand: 2026-08-12

## Zweck

Dieser Ordner dokumentiert die abgeschlossene Backend-/Ops-Familie Backend 0.5 für private Storage-Maintenance. Er besitzt keine Karten-, Mechanik-, KI- oder Webclient-Releaseautorität.

## Enthaltene Artefakte

- `final-review.md`: damaliger Abschluss- und Gate-Stand.
- `implementation-review.md`: damaliger Umsetzungsstand.
- `requirements.md`: eingefrorener damaliger Vertrag.
- `test-matrix.md`: damalige Testabdeckung.
- `plan.md`: historischer Detailplan.

## Kurzstand

- private Wartungsseite `/maintenance`;
- Maintenance-APIs unter `/api/storage/maintenance/*`;
- lokale/private-only Sicherheitsgrenzen;
- Preview-before-Apply und Whole-Match-Cleanup-Verträge.

Die ursprüngliche Migration aus `docs/derived/` und ihre Linkaudit-Artefakte sind historische Strukturarbeit und werden nicht mehr als eigene aktuelle Review-Dokumente konserviert; sie bleiben in Git nachvollziehbar.

## Retention

Backend 0.5 ist abgeschlossen. Die Familie bleibt nur solange im Arbeitsbaum, wie einzelne Inhalte noch aktuellen Betriebs-, Safety- oder Contract-Nutzen besitzen. Bei der späteren Release-Bereinigung ist deshalb zu prüfen, ob die aktuelle `maintenance-control-plane`-Dokumentation und Code-/Testverträge diesen Bestand vollständig ersetzen.
