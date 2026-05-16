---
jobId: spotcheck-2026-05-16-trace-link-post-bid-resolvers
status: done
createdAt: 2026-05-16T12:30:00+02:00
startedAt: 2026-05-16T17:22:15+02:00
completedAt: 2026-05-16T17:58:00+02:00
requiresImplementation: true
priority: high
sourceBlockedJobs:
  - spotcheck-2026-05-15-trace-cache-ambush
cards:
  - cardId: onr_v1_063_signpost
    title: Signpost
  - cardId: onr_v1_181_the-springboard
    title: The Springboard
---

# Originalset-Spotcheck Follow-up Job spotcheck-2026-05-16-trace-link-post-bid-resolvers

## Herkunft

Dieser Folgejob zieht die post-bid Trace-Link-Removal-Condition aus `blocked/spotcheck-2026-05-15-trace-cache-ambush.md` in einen kleineren Inbox-Scope.

## Aktueller Befund

### onr_v1_063_signpost - Signpost

Status: umgesetzt.

Aktueller Runtime-Stand: installierbares Trace-/Link-Programm mit generischem Hidden-Zone-/Reveal-Support, aber ohne kartenkonkretes post-bid +2-Link-Fenster.

Umsetzung:

- Lokalen Vertrag finalisiert: echte nach Bid-Reveal nutzbare +2-Link-Ability.
- Trace-Subfenster nach offengelegten Corp-/Runner-Bids modelliert.
- Kosten, installierte Quelle, Trace-ID, Nutzungslimit pro Trace, Side und StateVersion werden in `applyAction` erneut validiert.
- AI-Hint und Trace-Bid-Policy wurden an den finalen Vertrag angepasst.

Akzeptanz:

- Signpost wirkt nur im finalen Trace-Zeitfenster.
- Einmal-pro-Trace-Grenze und Kosten sind replay-/StateHash-stabil.
- PublicPayload nennt Quelle, Link-Delta und Endwert ohne private Hand-/Stackdaten.

### onr_v1_181_the-springboard - The Springboard

Status: umgesetzt.

Aktueller Runtime-Stand: installierte Resource mit statischem `baseLink: 1`. Der lokale Vertrag beschreibt eine nach Bid-Reveal nutzbare +1-Link-Fähigkeit, nicht einfach dauerhaftes Base-Link.

Umsetzung:

- Finaler Vertrag gegen lokale Faktenbasis entschieden: kein statischer Base-Link, sondern post-bid +1-Link-Ability.
- Trace-Subfenster mit Source-Auswahl, Kosten und Nutzungslimit modelliert.
- Nicht installierte Quelle, wrong-side und stale StateVersion abgesichert.
- AI-Hint auf Timing und Linkwert aktualisiert.

Akzeptanz:

- The Springboard wirkt exakt im finalen Trace-Vertrag.
- Entfernte oder getrashte Resource kann keine stale Link-Ability auslösen.
- Replay-StateHash ist für Nutzung und Nichtnutzung stabil.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm typecheck`

## Abschluss

Umgesetzt in `packages/engine/src/index.ts`, `packages/shared/src/index.ts`, `packages/ai/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/ai/src/index.test.ts`, `data/ai/ai-card-hints-active.json`, `data/manifests/card-implementation-manifest-1.9.14.json` und `data/scenarios/v1914-trace-tag-resource-smoke.json`.

Checks:

- `corepack pnpm --filter @netgrid/engine test -- --runInBand` - grün, 471 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 2 Dateien / 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` - grün, 1 Datei / 120 Tests.
- `corepack pnpm typecheck` - grün.
