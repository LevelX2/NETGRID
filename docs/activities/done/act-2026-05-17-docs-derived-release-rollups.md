---
activityId: act-2026-05-17-docs-derived-release-rollups
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
  - docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md
  - docs/activities/inbox/act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan.md
  - docs/activities/inbox/act-2026-05-17-docs-derived-s01-rollup-proposal.md
  - docs/activities/inbox/act-2026-05-17-docs-derived-v1-0-small-release-rollup-proposal.md
checks:
  - rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance" .
  - git diff --check
---

# Release-Artefakte unter docs/derived verdichten

## Ziel

Die vielen releaseweisen Einzelartefakte unter `docs/derived/` sollen in eine lesbare Rollup-Struktur überführt werden, ohne historische Gate-Nachweise zu verlieren.

## Kontext und Quellen

- Strukturreview vom 2026-05-17: `docs/derived/` enthält 712 getrackte Dateien; 669 liegen flach im Root.
- Auffällige Reihen:
  - `docs/derived/MVP_*.md`
  - `docs/derived/V1_0_*.md` bis `docs/derived/V1_9_*.md`
  - `docs/derived/V2_*.md`
  - `docs/derived/S01_*.md`
  - `docs/derived/BACKEND_0_5_*.md`
- Führende Orientierung:
  - `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
  - `docs/codex/CODEX_STATUS.md`
  - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`

## Scope

- Release-Artefakte nach Familien clustern:
  - Requirements,
  - Specs,
  - Testmatrizen,
  - Requirements Reviews,
  - Implementation Reviews,
  - Final Reviews,
  - Detailpläne und Preflights.
- Für ausgewählte Reihen ein Rollup-Konzept erstellen, z. B. `docs/releases/v1/` oder ein verdichteter Index unter `docs/derived/`.
- Pro Releasefamilie markieren, welche Dateien weiterhin `keep-evidence` bleiben und welche nach Rollup `archive` oder `git-remove-after-condense` werden könnten.
- Mit einem kleinen Musterbereich beginnen, nicht alle Releases auf einmal umbauen.

## Nicht im Scope

- Keine Gate-Nachweise löschen.
- Keine alten Final Reviews inhaltlich umschreiben.
- Keine Release-Historie glätten, wenn sie echte WIP-, Blocker- oder Korrekturspuren enthält.
- Keine Änderung an der führenden Roadmap ohne separaten Release-Planning-Auftrag.

## Akzeptanzkriterien

- [x] Es gibt einen konkreten Rollup-Vorschlag für mindestens eine Releasefamilie.
- [x] Final Reviews und Implementation Reviews bleiben als Audit-Trail auffindbar.
- [x] Detailpläne, Preflights und erledigte Requirements-Artefakte sind als Verdichtungs- oder Archivkandidaten klassifiziert.
- [x] Linkbruchrisiken sind vor jedem Move benannt.
- [x] Folgepakete für weitere Releasefamilien sind klein geschnitten.

## Umsetzungshinweise

- V1.9 ist groß und sollte nicht als erstes vollständig bewegt werden.
- Ein guter Einstieg ist eine ältere, abgeschlossene und kleine Reihe, z. B. `MVP_0.3` bis `MVP_0.6` oder `BACKEND_0_5`.

## Ergebnisnotiz

Abgeschlossen. Als kleiner Musterbereich wurde `BACKEND_0_5_*` gewählt; es wurden keine Gate-Nachweise gelöscht, bewegt oder inhaltlich umgeschrieben. `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md` klassifiziert Final Review und Implementation Review als `keep-evidence`, Requirements und Testmatrix als `condense-candidate-after-rollup` und den Detailplan als `archive-candidate-after-condense`. Linkbruchrisiken vor späteren Moves sind konkret benannt, insbesondere Referenzen in KI-Wissen, Projektlog, Codex-Status sowie internen Backend-0.5-Artefakten. Drei kleine Folgepakete wurden in `docs/activities/inbox/` angelegt: Backend-0.5-Linkaudit/Move-Plan, S01-Rollup-Vorschlag und kleiner V1.0.x-Rollup-Vorschlag. `git diff --check` ist grün.
