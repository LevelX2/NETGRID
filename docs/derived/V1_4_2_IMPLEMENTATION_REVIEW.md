# V1.4.2 Implementation Review - Belief State und Gegner-Modell

Stand: 2026-05-08
Status: implemented

## Scope

V1.4.2 wurde nach gruenem V1.4.1-Final-Gate umgesetzt. Der Release fuehrt einen fairen, side-sicheren Belief State fuer KI-Entscheidungen ein und erweitert Runner-/Corp-Planung um Gegner-Modelle ohne Hidden-State-Zugriff.

## Umgesetzt

- Neues Belief-State-Modul `packages/ai/src/belief-state.ts` mit:
  - Wissenstypen `public_fact`, `own_private_fact`, `revealed_opponent_fact`, `hypothesis`, `unknown`.
  - deterministischer Rekonstruktion aus `PlayerView`, `LegalActions`, side-gefilterten Events und Replay-Historie.
  - Eventklassifikation fuer Install, Rez, Advance, Score, Steal, Access, Trash, Draw, Discard, Shuffle, Arrange, Swap, Move, Reveal und Expose.
  - Hypothesen-Invalidierungslogik.
  - Runner- und Corp-Gegner-Modelle.
  - `rndTopFreshness` inkl. Invalidation.
- Integration in die KI:
  - `packages/ai/src/index.ts`: Baseline-DecisionDebug enthaelt jetzt Memory-/Fakten-/Hypothesen-/Unsicherheitskontext.
  - `packages/ai/src/runner-plans.ts`: Runner-Planung nutzt Belief-State-Kontext, inkl. `R&D access freshness`-Penalty bei `stale_known_same_top`.
  - `packages/ai/src/corp-plans.ts`: Corp-Planung nutzt Runner-Pressure-/Contest-Signale aus dem Gegner-Modell.
- Exportierte Belief-APIs fuer Tests/Weiterverwendung:
  - `reconstructBeliefState`
  - `beliefStateInvariantSignature`
  - `beliefDebugSummary`
- Testabdeckung in `packages/ai/src/index.test.ts` erweitert:
  - Wissenstyp-Klassifikation.
  - Hidden-State-Invariance des Belief State.
  - `rndTopFreshness` inkl. Invalidation nach Corp-Draw.
  - Undo-/Reconnect-aehnliche Rekonstruktion ohne stale Memory.
  - DecisionDebug-Redaction.
  - StateHash-Isolation.

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V142-MUST-001 | pass: V1.4.1-Final-Gate war gruen vor Start. |
| V142-MUST-002,003 | pass: Belief-Rekonstruktion nutzt nur side-sichere Projektionen, keinen FullState. |
| V142-MUST-004 | pass: Wissenstypen sind explizit modelliert. |
| V142-MUST-005 | pass: deterministische Rekonstruktion/Signaturtests vorhanden. |
| V142-MUST-006 | pass: Rekonstruktion erfolgt pro Input neu; Undo-/Reconnect-aehnlicher Rekonstruktionsfall ist getestet. |
| V142-MUST-007 | pass: DecisionDebug zeigt Fakten/Hypothesen/Unsicherheit side-sicher. |
| V142-MUST-008 | pass: Corp-Gegner-Modell enthaelt Threat/Aggression/Breaker/Contest/HQ-/R&D-Druck. |
| V142-MUST-009 | pass: Runner-Gegner-Modell enthaelt PlanEstimate/RemoteBelief/ICE-Risk/HQ-/R&D-Werte/Credit-Interpretation. |
| V142-MUST-010 | pass: RemoteCardBelief modelliert unbekannte Remotes als Hypothesen. |
| V142-MUST-011 | pass: Unrezzed-ICE-Risk bleibt titelblind. |
| V142-MUST-012,013 | pass: Reveal/Expose/Move/Shuffle/Arrange/Swap werden klassifiziert und invalidieren Hypothesen deterministisch. |
| V142-MUST-014,015 | pass: `rnd_access_freshness` mit klaren Invalidationsregeln implementiert. |
| V142-MUST-016 | pass: Hidden-State-Invariance-Test vorhanden. |
| V142-MUST-017 | pass: Belief State aendert keinen echten GameState/Replay-/StateHash-Pfad. |
| V142-MUST-018 | pass: keine Karten-/Mechanik-/Simulation-/Replay-UI-/Tutorial-/Public-Scope-Erweiterung. |

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts`: pass (67 Tests).
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass (nur bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Web-Katalogpfad).

Die formalen Pflichtchecks sind im Final Review zusammengefasst.

## No-Scope-Bestaetigung

Keine neuen Kartenfreigaben, keine neuen Mechaniken ausserhalb der Spezifikation, kein Kartentextparser, keine FullState-/Hidden-State-Simulation, keine Replay-UI, keine Tutorial-UI, keine Public-Plattformfunktionen und kein LLM-Regelakteur.
