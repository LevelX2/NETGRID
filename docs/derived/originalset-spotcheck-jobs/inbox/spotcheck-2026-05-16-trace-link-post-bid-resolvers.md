---
jobId: spotcheck-2026-05-16-trace-link-post-bid-resolvers
status: inbox
createdAt: 2026-05-16T12:30:00+02:00
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

Status: offen.

Aktueller Runtime-Stand: installierbares Trace-/Link-Programm mit generischem Hidden-Zone-/Reveal-Support, aber ohne kartenkonkretes post-bid +2-Link-Fenster.

Umsetzung:

- Lokalen Vertrag finalisieren: echte nach Bid-Reveal nutzbare +2-Link-Ability oder bewusst reduzierter Vertrag.
- Falls Ability gilt: Trace-Subfenster nach offengelegten Corp-/Runner-Bids modellieren.
- Kosten, installierte Quelle, Trace-ID, Nutzungslimit pro Trace, Side und StateVersion in `applyAction` erneut validieren.
- AI-Hint und Trace-Bid-Policy an den finalen Vertrag anpassen.

Akzeptanz:

- Signpost wirkt nur im finalen Trace-Zeitfenster.
- Einmal-pro-Trace-Grenze und Kosten sind replay-/StateHash-stabil.
- PublicPayload nennt Quelle, Link-Delta und Endwert ohne private Hand-/Stackdaten.

### onr_v1_181_the-springboard - The Springboard

Status: offen.

Aktueller Runtime-Stand: installierte Resource mit statischem `baseLink: 1`. Der lokale Vertrag beschreibt eine nach Bid-Reveal nutzbare +1-Link-Fähigkeit, nicht einfach dauerhaftes Base-Link.

Umsetzung:

- Finalen Vertrag gegen lokale Faktenbasis entscheiden und nicht gleichzeitig statischen Base-Link plus post-bid Ability führen.
- Falls post-bid Ability gilt: Trace-Subfenster mit Source-Auswahl, Kosten und Nutzungslimit modellieren.
- Resource-Trash-/Tag-Drift, nicht installierte Quelle, wrong-side und stale StateVersion absichern.
- AI-Hint auf Timing und Linkwert aktualisieren.

Akzeptanz:

- The Springboard wirkt exakt im finalen Trace-Vertrag.
- Entfernte oder getrashte Resource kann keine stale Link-Ability auslösen.
- Replay-StateHash ist für Nutzung und Nichtnutzung stabil.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm typecheck`

