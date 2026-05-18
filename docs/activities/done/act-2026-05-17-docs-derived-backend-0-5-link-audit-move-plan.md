---
activityId: act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/derived/DOCS_DERIVED_BACKEND_0_5_LINK_AUDIT_MOVE_PLAN.md
  - docs/releases/backend-ops/backend-0-5/README.md
checks:
  - rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance" .
  - git diff --check
---

# Backend 0.5 Rollup-Linkaudit und Move-Plan

## Ziel

Für die Musterfamilie `BACKEND_0_5_*` soll entschieden werden, ob eine echte Zielstruktur unter `docs/releases/backend-ops/backend-0-5/` angelegt wird.

## Kontext und Quellen

- `docs/releases/backend-ops/backend-0-5/README.md`
- `docs/releases/backend-ops/backend-0-5/final-review.md`
- `docs/releases/backend-ops/backend-0-5/implementation-review.md`
- `docs/releases/backend-ops/backend-0-5/requirements.md`
- `docs/releases/backend-ops/backend-0-5/test-matrix.md`
- `docs/releases/backend-ops/backend-0-5/plan.md`

## Scope

- Alle Pfadreferenzen auf `BACKEND_0_5_*` mit `rg` prüfen.
- Zielstruktur, Redirect-/Stub-Strategie und Linkmigration für genau diese Familie festlegen.
- Falls freigegeben, nur diese Familie bewegen oder Stubs anlegen.

## Nicht im Scope

- Keine V1.0-, V1.9-, S01- oder V2-Umstrukturierung.
- Keine inhaltliche Umschreibung alter Reviews.
- Keine Löschung von Gate-Nachweisen.

## Akzeptanzkriterien

- [x] Linkbruchrisiken sind vollständig benannt.
- [x] Move-/Stub-Entscheidung ist dokumentiert.
- [x] Falls Dateien bewegt werden: alle betroffenen Links sind aktualisiert oder abgesichert.
- [x] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Vor jedem Move mindestens `rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance"` ausführen.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/DOCS_DERIVED_BACKEND_0_5_LINK_AUDIT_MOVE_PLAN.md` dokumentiert den vollständigen Backend-0.5-Linkaudit, trennt harte Pfadlinks von unkritischen Textreferenzen und entscheidet konservativ `decision-no-move`: Die bestehenden `docs/derived/BACKEND_0_5_*`-Pfade bleiben vorerst kanonisch, es werden keine Redirect-Stubs angelegt und keine Gate-Nachweise bewegt. Das Rollup `docs/releases/backend-ops/backend-0-5/README.md` verweist auf diese Entscheidung. Da keine Dateien bewegt wurden, war keine Linkmigration nötig; spätere Move-Voraussetzungen und Stub-Optionen sind dokumentiert. Pflichtchecks `rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance" .` und `git diff --check` sind ausgeführt, `git diff --check` ist grün.

Nachtrag 2026-05-18: Die damalige Zwischenentscheidung wurde nach der Zielstrukturentscheidung `docs/derived/DOCS_STRUCTURE_TARGET_DECISION_2026_05_18.md` umgesetzt fortgeschrieben. Backend 0.5 liegt jetzt ohne Redirect-Stubs unter `docs/releases/backend-ops/backend-0-5/`; der Linkaudit steht auf `implemented-move`.
