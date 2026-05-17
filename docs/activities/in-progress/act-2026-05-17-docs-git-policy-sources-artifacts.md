---
activityId: act-2026-05-17-docs-git-policy-sources-artifacts
status: in_progress
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Git-Policy für docs-Quellen und Artefakte dokumentieren

## Ziel

Für `docs/` soll eine klare Git-Policy entstehen: welche Quellen, PDFs, Bilder, Screenshots, Smoke-Artefakte, ZIPs und lokalen Daten versioniert werden dürfen und welche bewusst lokal oder ignoriert bleiben.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/source/PrivateScans/` ist ignoriert und enthält lokal 70 PDFs plus 1 ZIP mit ca. 1,7 GiB.
  - `docs/derived/artifacts/` enthält kleine Smoke-JSON/PNG-Evidence-Dateien.
  - `docs/ui-designsets/` enthält PNG-/SVG-Designartefakte mit ca. 38 MiB.
- `.gitignore` enthält bereits Regeln für `docs/source/PrivateScans/`, Playwright-Reports und lokale Card-Image-Artefakte.
- Projektregel: private Secrets, lokale Datenbanken und lokale Runtime-Konfigurationen gehören nicht in versionierte Dateien.

## Scope

- Bestehende Ignore-Regeln und aktuelle docs-Binärartefakte inventarisieren.
- Versionierungsregeln formulieren für:
  - Rohquellen als Text,
  - kleine referenzierte PDFs,
  - private Scans und ZIPs,
  - Screenshots und Playwright-Traces,
  - Smoke-Evidence unter `docs/derived/artifacts/`,
  - UI-/Branding-Designassets,
  - lokale Runtime-Daten, Logs, Caches und Secrets.
- Ergebnis als kurzes Policy-Artefakt oder README-Ergänzung vorschlagen.

## Nicht im Scope

- Keine Änderung an der untracked Activity-Inbox-Regel.
- Keine Aufnahme privater Scans in Git.
- Keine rechtliche Bewertung als endgültige Lizenzfreigabe.
- Keine Löschung bestehender Binärdateien ohne separates Cleanup-Paket.

## Akzeptanzkriterien

- [ ] Die Policy unterscheidet `keep-source`, `keep-evidence`, `do-not-version` und `needs-decision`.
- [ ] `docs/source/PrivateScans/` bleibt klar `do-not-version`.
- [ ] Smoke-Artefakte haben eine Größen- und Evidenzregel.
- [ ] UI-/Designassets haben eine Kuratierungsregel.
- [ ] Rechtlich heikle Assets werden nicht versehentlich als public-distribution-fähig beschrieben.

## Umsetzungshinweise

- Policy soll pragmatisch und kurz bleiben.
- Bei juristischer Unsicherheit `needs-decision` statt Freigabe setzen.

## Ergebnisnotiz

Noch offen.
