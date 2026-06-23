# AI Player Semantic Controller Preflight 2026-06-23

## Status

`green`

Branch: `codex/ai-player-semantic-controller`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAYER_SEMANTIC_CONTROLLER`

Preflight-Commit: `d2cd18972edf122429597572b1846d1833461822`

## Ergebnis

Der Ausgangsstand ist grün. Es gibt keinen technischen Ausgangsblocker für den Prozess `AI Player Semantic Controller`.

## Checks

```text
corepack pnpm install
  erfolgreich; Lockfile unverändert, Worktree-Abhängigkeiten installiert

corepack pnpm --filter @netgrid/ai test
  132 Testdateien, 1533 Tests bestanden

corepack pnpm --filter @netgrid/ai typecheck
  bestanden

git diff --check
  bestanden
```

Der erste Testversuch vor `pnpm install` scheiterte nur, weil der neue Worktree noch keine `node_modules` hatte. Nach Installation war der AI-Testlauf grün.

## Strukturinventar

Gemessene zentrale Dateien:

```text
35169 packages\ai\src\index.ts
3942  packages\ai\src\tactical-plans.ts
8477  packages\ai\src\legacy\runner-plans.ts
9305  packages\ai\src\legacy\corp-plans.ts
273   packages\ai\src\deck-doctrine.ts
904   packages\ai\src\deck-capabilities.ts
```

Der Stand bestätigt die Nutzeranalyse:

- `index.ts` ist weiterhin die sehr große Public-Fassade, darf aber nicht weiter fachlich anwachsen.
- `legacy/runner-plans.ts` und `legacy/corp-plans.ts` bleiben große produktive Fallback-/Regressionsflächen.
- `tactical-plans.ts` enthält weiterhin Planbau, Mapping, Debug-/Evidence-Logik und labelbasierte Übergangspfade.
- `deck-doctrine.ts` ist klein, aber historisch kritisch, weil alte Archetype-/PlanWeight-Semantik nicht als neue Wahrheit missverstanden werden darf.
- `deck-capabilities.ts` ist überschaubar, enthält aber weiter Übergangs-Fallbacks aus Text/Label/Regex.

## Relevante vorhandene Stärken

- Action-Semantik, TargetContext, Cost-/Timing-Projektion und HardGates sind bereits in eigenen Modulen unter `packages/ai/src/actions/` vorhanden.
- Decision-Spine, TacticalGoalUtility, ActionGoalFit, HardGates, SemanticShadowDecision, TargetChoiceShadow und Corp/Runner-Zielmodule existieren unter `packages/ai/src/decision/`.
- Access Intelligence, TargetChoice, LegalAction Witness und Evaluation-Korpora sind bereits stark ausgebaut.
- Vollständige AI-Tests sind grün; dieser Prozess kann Änderungen mit fokussierten Tests und finalem Komplettlauf absichern.

## Ausgangsrisiken für die Folgepakete

- Weitere Arbeit darf nicht in `index.ts` als neuer Sammelpunkt landen.
- Legacy-Pfade müssen kompatibel bleiben, aber klare Kommentare und Re-Export-Grenzen brauchen, damit neue Semantik dort nicht weiterwächst.
- Ankerlose Decks und Supportsignale müssen neutral bleiben; alte Archetype-Fallbacks dürfen keine neue semantische Strategie erzeugen.
- Corp-Ziele sind vorhanden, müssen aber als eigene side-safe Zielbildung mit Evidence und TargetServer-Bezug nachvollziehbarer bleiben.
- HardGates, TargetContext und Reachability müssen im Ranking echte Blocker beziehungsweise starke Dämpfer bleiben; Strategiewert darf sie nicht überstimmen.
- Text-/Label-Fallbacks bleiben unvermeidbare Übergangsdiagnose, müssen aber auffindbar und strukturierten Quellen nachgeordnet sein.

## Nächster Schritt

`SEMCTRL-1` markiert Legacy- und Public-Grenzen und ergänzt passende Boundary-Tests, ohne das Spielverhalten absichtlich zu ändern.
