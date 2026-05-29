---
activityId: act-2026-05-29-proteus-pro019-2-rule-contract-final-hardening
status: done
kind: hardening
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-29
startedAt: 2026-05-29
completedAt: 2026-05-29
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO019-2
proReferences:
  - PRO019
  - PRO019-1
  - PRO019-2
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/game/run/run-rez-window.ts
  - packages/engine/src/game/run/run-flow-hosts.ts
  - packages/engine/src/game/access/breach-state.test.ts
  - packages/engine/src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
  - docs/releases/proteus/proteus-cardimplementation-detailplan-2026-05-26.md
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/breach-state.test.ts src/game/access/access-flow.test.ts src/game/access/access-actions.test.ts src/game/run/run-rez-window.test.ts src/game/choices/pending-choice-resolution.test.ts src/game/view/choice-view.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/run-flow-hosts.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
  - typo scan for malformed PRO019 labels in packages, docs, data and KI-Wissen-NETGRID
---

# Proteus PRO019-2: Rule-Contract Final Hardening

## Ergebnis

PRO019-2 behebt die verbliebenen Review-Findings zur PRO019-1-Härtung ohne neue Kartenpromotion. Der Proteus-Harness bleibt bei 154 Proteus-Karten, 154 implementiert, 0 fehlend und 0 Drift; keine Proteus-Karte wird decklegal, formatlegal oder AI-unterstützt.

## Gehärtete Verträge

- `Pavit Bharat`: Die Rez-LegalAction entsteht nur noch, wenn mindestens eine gemeinsam legal installierbare HQ-Ersatzmenge existiert. Candidate-Filter und Resolve-Revalidierung nutzen dieselbe Kombinationsprüfung inklusive Root-Kapazität, Typregeln und Installationsreihenfolge. Individuell plausible, aber gemeinsam illegale Auswahlen werden ohne Teilmutation und ohne verdeckte Kartendaten im Fehlertext oder Runner-View abgelehnt.
- `Simon Francisco`: Die globale HQ-/R&D-Policy bleibt bewusst: zentrale Root-Upgrades werden vor gespeicherten HQ-/R&D-Kartenzugriffen in die Queue aufgenommen. Simon reduziert danach nur spätere gespeicherte zentrale Zugriffseinträge, nicht die Root-Zugriffe selbst.

## Nachweis

Fokussierte Tests decken fehlende Pavit-LegalActions bei nur einzeln plausiblen Ersatzkarten, eine legale ICE-plus-Upgrade-Mischung, Reject und Redaction für gemeinsam illegale Choices sowie die generische R&D-Root-vor-stored-card-Access-Policy ab. Der finale Verify-Lauf wird im Abschlussbericht dokumentiert.
