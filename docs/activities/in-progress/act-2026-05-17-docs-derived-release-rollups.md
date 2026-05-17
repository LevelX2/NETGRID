---
activityId: act-2026-05-17-docs-derived-release-rollups
status: in_progress
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Es gibt einen konkreten Rollup-Vorschlag für mindestens eine Releasefamilie.
- [ ] Final Reviews und Implementation Reviews bleiben als Audit-Trail auffindbar.
- [ ] Detailpläne, Preflights und erledigte Requirements-Artefakte sind als Verdichtungs- oder Archivkandidaten klassifiziert.
- [ ] Linkbruchrisiken sind vor jedem Move benannt.
- [ ] Folgepakete für weitere Releasefamilien sind klein geschnitten.

## Umsetzungshinweise

- V1.9 ist groß und sollte nicht als erstes vollständig bewegt werden.
- Ein guter Einstieg ist eine ältere, abgeschlossene und kleine Reihe, z. B. `MVP_0.3` bis `MVP_0.6` oder `BACKEND_0_5`.

## Ergebnisnotiz

Noch offen.
