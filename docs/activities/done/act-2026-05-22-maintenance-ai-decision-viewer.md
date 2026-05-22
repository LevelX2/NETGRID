---
activityId: act-2026-05-22-maintenance-ai-decision-viewer
status: done
kind: concept
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy:
  - act-2026-05-22-ai-decision-trace-sqlite-api
resultArtifacts:
  - apps/web/app/maintenance.ts
  - apps/web/app/maintenance/page.tsx
  - apps/web/app/maintenance.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/maintenance.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check -- apps/web/app/maintenance.ts apps/web/app/maintenance/page.tsx apps/web/app/maintenance.test.ts docs/activities/done/act-2026-05-22-maintenance-ai-decision-viewer.md
---

# Private Wartungsansicht für KI-Entscheidungen bauen

## Ziel

Eine private Backend-/Wartungsseite zeigt pro ausgewähltem Match die KI-Entscheidungen historisch durchklickbar an: erst Metaebene, dann aufklappbare Details.

## Kontext und Quellen

- Nutzerwunsch: Auf zweitem Bildschirm im Backend ein Match auswählen und "KI-Entscheidungen" anzeigen.
- Bedienmodell:
  - Match auswählen.
  - Timeline nach Zug und Entscheidung durchklicken.
  - Metaebene zuerst sehen.
  - Details nur bei interessanten Entscheidungen aufklappen.
- Bestehende private Wartungsseite `/maintenance` ist ein naheliegender Einstiegspunkt.

## Scope

- Neue private Ansicht oder Unterbereich, z. B. `/maintenance/ai-decisions`.
- Matchauswahl mit nur matchespezifischen sicheren Metadaten.
- Timeline-/Navigator-Struktur nach Zug, Seite und Entscheidung.
- Detailpanel mit Meta-Karte:
  - gewählte Aktion,
  - Kurzgrund,
  - Score und Vertrauen,
  - Top-Alternativen,
  - Warnmarker wie Fallback, Timeout, niedrige Sicherheit.
- Aufklappbare Detailsektionen:
  - Score-Komponenten,
  - warum Alternativen verloren haben,
  - sichtbare Fakten,
  - Unsicherheiten/Hypothesen,
  - Langfristplan,
  - technische IDs.

## Nicht im Scope

- Keine Anzeige im normalen Matchscreen.
- Kein Spielerfeature, keine Public-Freigabe, keine Spectator-Ansicht.
- Keine Bearbeitung oder Löschung von Trace-Daten.
- Kein Styling-Redesign der gesamten Wartungsseite.
- Keine Änderung der KI-Entscheidungslogik.

## Akzeptanzkriterien

- [ ] Die Ansicht ist über private Wartungsnavigation erreichbar.
- [ ] Ein Match mit Trace-Daten kann ausgewählt und historisch durchsucht werden.
- [ ] Jede Entscheidung zeigt eine knappe Metaebene ohne Informationsüberladung.
- [ ] Detailsektionen sind einzeln aufklappbar.
- [ ] Die UI zeigt klar, wenn ein Match kein KI-Tracing aktiviert hatte oder keine KI-Entscheidungen enthält.
- [ ] Browser-/Komponententest oder Smoke deckt Matchauswahl, Timeline und Detail-Aufklappen ab.

## Umsetzungshinweise

- HTML wird ausschließlich im Webclient gerendert; API liefert Anzeige-ViewModels.
- Die UI darf ruhig dicht und werkzeugartig sein, da es eine private Diagnosefläche ist.
- Lange Listen begrenzen und Details aufklappbar halten, damit Live-Beobachtung nicht unlesbar wird.

## Ergebnisnotiz

`/maintenance` enthält jetzt den Bereich `KI-Entscheidungen` mit Trace-Matchauswahl, Timeline/Navigator und Detailpanel. Die Ansicht lädt die privaten Maintenance-Endpunkte für Trace-Matches, Trace-Index und Trace-Detail, zeigt zuerst Meta- und Warnmarker und klappt Alternativen, Score-Komponenten, Detailsektionen und technische IDs separat auf. Matches ohne KI-Tracing zeigen einen leeren Zustand.

Die HTML-Darstellung entsteht ausschließlich im Webclient; die Redaktionsprüfung blockiert weiterhin sensible Marker. Helper-Test und Web-Typecheck sind grün.
