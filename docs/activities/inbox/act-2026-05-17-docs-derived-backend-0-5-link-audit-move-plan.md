---
activityId: act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan
status: inbox
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Backend 0.5 Rollup-Linkaudit und Move-Plan

## Ziel

Für die Musterfamilie `BACKEND_0_5_*` soll entschieden werden, ob eine echte Zielstruktur unter `docs/releases/backend-ops/backend-0-5/` angelegt wird.

## Kontext und Quellen

- `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md`
- `docs/derived/BACKEND_0_5_FINAL_REVIEW.md`
- `docs/derived/BACKEND_0_5_IMPLEMENTATION_REVIEW.md`
- `docs/derived/BACKEND_0_5_REQUIREMENTS.md`
- `docs/derived/BACKEND_0_5_TEST_MATRIX.md`
- `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md`

## Scope

- Alle Pfadreferenzen auf `BACKEND_0_5_*` mit `rg` prüfen.
- Zielstruktur, Redirect-/Stub-Strategie und Linkmigration für genau diese Familie festlegen.
- Falls freigegeben, nur diese Familie bewegen oder Stubs anlegen.

## Nicht im Scope

- Keine V1.0-, V1.9-, S01- oder V2-Umstrukturierung.
- Keine inhaltliche Umschreibung alter Reviews.
- Keine Löschung von Gate-Nachweisen.

## Akzeptanzkriterien

- [ ] Linkbruchrisiken sind vollständig benannt.
- [ ] Move-/Stub-Entscheidung ist dokumentiert.
- [ ] Falls Dateien bewegt werden: alle betroffenen Links sind aktualisiert oder abgesichert.
- [ ] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Vor jedem Move mindestens `rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance"` ausführen.

## Ergebnisnotiz

Noch offen.
