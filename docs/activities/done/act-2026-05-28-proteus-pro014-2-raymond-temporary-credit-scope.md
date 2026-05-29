---
activityId: act-2026-05-28-proteus-pro014-2-raymond-temporary-credit-scope
status: done
kind: hardening
area: cards
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: PRO014-2
proReferences:
  - PRO014
  - PRO014-2
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/game/run/run-flow-hosts.ts
  - packages/engine/src/game/run/run-flow-hosts.test.ts
  - packages/engine/src/index-tests/proteus/corp-asset-upgrade-utility.test.ts
  - packages/engine/src/mechanics/public-payload-schema.ts
  - packages/engine/src/public-context.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/corp-asset-upgrade-utility.test.ts
---

# Proteus PRO014-2: Raymond Temporary Credit Scope

## Ergebnis

PRO014-2 ist als gezielte Härtung für Raymond Ellison erledigt. Es wurden keine neuen Proteus-Karten implementiert, keine Karten zusätzlich freigeschaltet und keine Decklegalitäts-, Formatlegalitäts- oder AI-Flags verändert.

## Semantikentscheidung

Raymond Ellison erzeugt Korp-Bits, die für Korp-Kosten während des aktuellen Runs verwendbar sind. Der Kartentext nennt keine engere Zweckbindung auf Trace, Rez oder einzelne Abilities; am Run-Ende werden nur die ungenutzten, durch Raymond erzeugten Bits an die Bank zurückgegeben.

Diese Semantik ist jetzt explizit modelliert: Der generische globale Korp-`spendCredits`-Pfad verbraucht Raymond-Credits nicht mehr. Verbrauch läuft nur über klar benannte aktuelle-Run-Zahlungskontexte, insbesondere Run-/Trace-/Rez-/CardImplementation-Pfade, die bewusst Korp-Kosten während des laufenden Runs bezahlen.

## Härtung

- Raymond-Credits werden beim Aktivieren während eines Runs als `corpRunTemporaryCredits` erzeugt und öffentlich mit `temporaryRunCredits` sowie `temporaryRunCreditsRemaining` ausgewiesen.
- Erlaubte Korp-Kosten während des aktuellen Runs verbrauchen den Pool deterministisch vor dem Run-Ende.
- Ungenutzte Credits werden beim Run-Ende aus den Korp-Credits zurückgegeben; danach existiert kein Run-Pool mehr.
- Außerhalb eines Runs wird Raymond nicht angeboten.
- Nicht intendierte globale Korp-Payment-Pfade verbrauchen Raymond-Credits nicht mehr nur deshalb, weil `state.run` gesetzt ist.

## Zählung

Der PRO014-2-Harness-Stand bleibt 154 Proteus-Karten total, 129 konkrete CardImplementation-Dateien, 25 fehlende Dateien und 0 Drift.
