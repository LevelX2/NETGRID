---
activityId: act-2026-05-22-chronicle-card-link-doubleclick
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/chronicleInteraction.ts
  - apps/web/app/chronicleInteraction.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/chronicleInteraction.test.ts"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
  - "Browser: Start ueber scripts/start-netgrid.ps1 und App unter http://127.0.0.1:3100 geoeffnet; laufende Sitzung hatte keinen sichtbaren Chronicle-Kartenlink fuer eine vollstaendige Doppelklick-End-to-End-Pruefung."
---

# Spielchronik: Kartenlinks per Doppelklick öffnen

## Ziel

Kartenlinks in der Spielchronik sollen per Doppelklick dieselbe große Karteninformation öffnen wie Hover/Mouseover, damit der Zugriff auch auf Tablet- und Touch-Geräten nutzbar ist.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Kartenlinks in der Spielchronik reagieren aktuell nicht auf Doppelklick.
- Erwartung: Doppelklick auf einen Kartenlink öffnet die große Karteninformation wie Mouseover/Hover.
- Hintergrund: Tablet-Nutzung hat kein echtes Mouseover; Tap/Double-Tap soll sauber unterstützt werden.
- Verwandte Architektur: `docs/architecture/card-images/card-image-performance-stage-1-implementation-review.md` erwähnt Chronik und Bild-Tooltips.

## Scope

- Chronicle-Kartenlink-Komponente oder Formatter lokalisieren.
- Doppelklick für sichtbare Kartenlinks unterstützen.
- Touch-/Tap-Verhalten prüfen und bei geringem Zusatzumfang eine saubere Tap- oder Double-Tap-Unterstützung ergänzen.
- Dasselbe große Karteninfo-Panel oder denselben Preview-State verwenden wie Hover, statt eine zweite Anzeige zu bauen.
- Tastatur- und Screenreader-Verhalten nicht verschlechtern.

## Nicht im Scope

- Keine Änderung an Chronikereignissen oder PublicEvent-Payloads.
- Keine Offenlegung verdeckter Kartendaten durch neue Link-Interaktion.
- Kein Redesign der Spielchronik.
- Keine Änderung am allgemeinen Tooltip-Text-Mapping; dafür gibt es `act-2026-05-22-extended-tooltip-card-text-source`.

## Akzeptanzkriterien

- [x] Doppelklick auf einen sichtbaren Kartenlink in der Chronik öffnet die große Karteninformation.
- [x] Hover/Mouseover funktioniert weiterhin.
- [x] Touch- oder Tablet-Bedienung ist geprüft und entweder unterstützt oder als bewusstes Folgepaket dokumentiert.
- [x] Nur öffentlich bekannte beziehungsweise für den Viewer erlaubte Karten erhalten öffnende Links.
- [x] Fokussierte Web-Tests oder eine dokumentierte Browser-Prüfung decken die Interaktion ab.
- [x] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Wenn die Chronik Links als formatierte Textspans rendert, die Interaktion möglichst in der zentralen Link-Komponente ergänzen.
- Mobile Safari/Chromium-Touch-Verhalten bei Double-Tap kann abweichen; daher nicht ausschließlich auf native `dblclick` verlassen, wenn der bestehende UI-Helfer bereits Tap-Preview unterstützt.

## Ergebnisnotiz

`ChronicleCardTrigger` nutzt jetzt denselben Preview-Callback für einfachen Klick, expliziten Doppelklick und Touch-Double-Tap. Der bestehende `disabled={!previewCard}`-Schutz bleibt der Gatekeeper, sodass verdeckte oder nicht erlaubte Karten keine öffnenden Links bekommen. Hover/Focus-Tooltip-Logik bleibt erhalten; Touch setzt beim Antippen zusätzlich den Tooltip-Fokus und aktiviert bei bewusstem Double-Tap erneut die große Karteninformation. Die App wurde im Browser gestartet, aber die vorhandene Sitzung enthielt keinen sichtbaren Chronicle-Kartenlink für einen vollständigen End-to-End-Doppelklick; der Touch-Double-Tap-Entscheider ist fokussiert getestet.
