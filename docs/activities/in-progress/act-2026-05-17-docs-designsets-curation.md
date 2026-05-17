---
activityId: act-2026-05-17-docs-designsets-curation
status: in_progress
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# UI-Designsets kuratieren und archivieren

## Ziel

`docs/ui-designsets/` soll zwischen kuratierten Designquellen, vorläufigen Branding-Entscheidungen und alten Entwurfsartefakten unterscheiden, damit spätere UI-Arbeit nicht durch veraltete Draft-Bilder oder unklare Asset-Grenzen irritiert wird.

## Kontext und Quellen

- `docs/ui-designsets/README.md` beschreibt die Mockups als explorative UI-Richtungen, nicht als verbindliche Implementierungsvorgabe.
- `docs/ui-designsets/REALISM_REVIEW.md` empfiehlt Design C als Hauptbasis und Design D als Run-/Encounter-Fokus.
- `docs/ui-designsets/05-logo-exploration/BRANDING_DECISION.md` hält die vorläufige Branding-Entscheidung `NETGRID`.
- Strukturreview vom 2026-05-17: `docs/ui-designsets/` enthält 35 getrackte Dateien mit ca. 38 MiB.

## Scope

- Designsets in Kategorien einordnen:
  - kuratierte Referenz,
  - historische Exploration,
  - ersetzter Draft,
  - vorläufiges Branding,
  - needs-decision wegen Asset-/Rechtsfrage.
- Empfehlen, welche Dateien im aktiven Designbereich bleiben und welche in ein Archiv oder Rollup wandern sollten.
- Prüfen, ob `docs/design/` als Zielstruktur sinnvoller ist als `docs/ui-designsets/`.
- Rechtliche Grenzen zu offiziellen Logos, Card Frames, Card Backs und externen Artworks sichtbar halten.

## Nicht im Scope

- Keine neuen Designs erstellen.
- Keine UI-Implementierung.
- Keine Löschung oder Komprimierung von Bildern ohne separaten Schritt.
- Keine endgültige Markenfreigabe.

## Akzeptanzkriterien

- [ ] Kuratierte Designreferenzen sind klar von alten Drafts getrennt.
- [ ] Branding-Entscheidung bleibt auffindbar.
- [ ] Rechtliche Asset-Grenzen sind im Zielzustand sichtbar.
- [ ] Es gibt eine Empfehlung, welche Bilddateien aktiv bleiben, archiviert werden oder nur Git-Historie benötigen könnten.

## Umsetzungshinweise

- Keine pauschale Bildlöschung: erst README/Rollup, dann Archiventscheidung.
- Design C und die ausgewählten NETGRID-Icons sind besonders vorsichtig zu behandeln.

## Ergebnisnotiz

Noch offen.
