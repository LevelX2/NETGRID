# Reviews

`docs/reviews/` enthält Querschnittsreviews, Audits, Inventare und strukturierte Nachprüfungen, die nicht klar zu einer einzelnen Releasefamilie gehören.

## Enthaltene Bereiche

- `originalset-spotchecks/`: Register, Rollup und Detailberichte der Originalset-Karten-Spotchecks. Abgeschlossene Arbeitsjobfiles dazu liegen unter `docs/archive/originalset-spotcheck-jobs/2026-05/`.
- `ai/`: KI-Audits, Benchmarks, Gap-Reports, Regression-Reviews und historische Runner-KI-Beobachtungen.
- `docs-cleanup/`: Inventare, Linkaudits und Review-Artefakte zur Docs-Struktur.
- `onr-v1/`: Quellen-, Spoiler-, Karten- und Supportdatenreviews zur lokalen O:NR-v1-Basis.

## Regel

Review-Artefakte bleiben nur dann dauerhaft versioniert, wenn sie aktuell als Audit-, Gate-, Test-, Entscheidungs-, Architektur- oder Removal-Condition-Nachweis dienen. Historische Update-, Prozess-, Benchmark-, Trace- und Zwischenstandsartefakte sind nach dem Current-State-Prinzip nicht automatisch aufzubewahren.

Führende Retention-Regel: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.

Verdichtung oder Entfernung erfolgt weiter nur über ein eigenes Cleanup-Paket mit Inventar und Linkprüfung.
