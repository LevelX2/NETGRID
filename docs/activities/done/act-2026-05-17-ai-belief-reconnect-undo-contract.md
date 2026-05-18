---
activityId: act-2026-05-17-ai-belief-reconnect-undo-contract
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.test.ts
  - apps/server/src/multiplayer.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts
  - corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
---

# Belief-State-Vertrag für Reconnect und Undo belegen

## Ziel

Der KI-Belief-State soll für Reconnect und Undo einen klaren, getesteten Vertrag haben: rechtmäßig gesehene Informationen bleiben bei gleicher side-sicherer Projektion stabil, spätere zurückgenommene Informationen erzeugen keine Phantom-Erinnerungen, und gekürzte Historie wird ausdrücklich dokumentiert.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P0: Belief Reconnect/Undo Contract` und `Offene Fragen / nicht belegte Annahmen`.
- Betroffene Bereiche laut Analyse: `packages/ai/src/belief-state.ts`, `packages/ai/src/index.test.ts` und Server-Reconnect-Testpfade.
- Die Analyse bewertet den Belief State als fair, aber flach; das Sicherheitsziel ist zuerst Vertragssicherheit, nicht stärkere Strategie.

## Scope

- Fixtures für rechtmäßig sichtbare Informationen aus R&D-, HQ- und Archives-Zugriffen anlegen oder erweitern.
- Prüfen, welche Event-/PlayerView-Historie der AI nach Reconnect tatsächlich vorliegt.
- Eine Belief-Signature oder äquivalente Testassertion definieren, die gleiche sichtbare Projektionen vergleichbar macht.
- Undo-Fälle abdecken, in denen nach einem später zurückgenommenen Zugriff keine Erinnerung im Belief State verbleibt.
- Falls lange Reconnect-Historien gekürzt werden, das konkrete Verhalten dokumentieren und Folgepakete nur bei echtem Produktbedarf anlegen.

## Nicht im Scope

- Kein Persistieren echter gegnerischer Hidden-Info außerhalb rechtmäßig gesehener Ereignisse.
- Keine FullState-Rekonstruktion und keine Nutzung von Storage-internen Engine-Daten als AI-Wissen.
- Keine neue probabilistische Weltmodellierung.
- Keine Änderung an Undo-Regeln, Replay-Quelle oder StateHash.

## Akzeptanzkriterien

- [x] Gleiche side-sichere Reconnect-Projektionen erzeugen gleiche Belief-Signaturen für Runner und Korp.
- [x] Rechtmäßig gesehene R&D-/HQ-/Archives-Informationen sind nach Reconnect entweder stabil erhalten oder ihr Verlust ist als bewusstes Truncation-Verhalten dokumentiert.
- [x] Undo entfernt spätere Belief-Fakten aus mindestens einem R&D- oder HQ-Zugriffsszenario.
- [x] Tests belegen, dass der Belief State keine verdeckten Karten aus Engine-State, Storage oder Replay-PrivatePayload ableitet.
- [x] Relevante Checks für AI und betroffene Server-Reconnect-Pfade sind grün oder mit konkretem Blocker dokumentiert.

## Umsetzungshinweise

- Dieses Paket darf zuerst reine Test- und Vertragsarbeit sein. Strategische Verbesserungen aus dem Ergebnis gehören in Folgepakete.
- Die Tests sollten absichtlich Hidden-State-Varianten mit identischer sichtbarer Projektion vergleichen.
- Reconnect und Undo getrennt prüfen; nicht beide Fehlerfamilien in einem schwer lesbaren Monsterfixture bündeln.
- No-Cheat-Gate: Nur side-sichere Eventprojektionen, PlayerViews und LegalActions dürfen den Belief State speisen.

## Ergebnisnotiz

Abgeschlossen. Der Belief-Vertrag ist durch fokussierte AI-Regressionen und einen echten Server-Reconnect-Test belegt: gleiche side-sichere Projektionen bleiben signaturstabil, R&D-/HQ-/Archives-Zugriffe werden nur aus side-sicheren Eventhistorien rekonstruiert, zurückgerollte HQ-Fakten verschwinden wieder, und Storage-/Replay-PrivatePayload-Decoys fließen nicht in AIInput oder Belief ein. Keine Truncation-Folgeaktivität nötig, weil der betroffene Serverpfad den aktuellen `eventTail`-Ausschnitt samt `playerView.publicEvents` stabil rekonstruiert.
