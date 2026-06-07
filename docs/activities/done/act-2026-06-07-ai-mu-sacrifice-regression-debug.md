---
activityId: act-2026-06-07-ai-mu-sacrifice-regression-debug
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch: codex/activities-inbox-ai-run-mu
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-program-sacrifice-evaluation
  - act-2026-06-07-ai-mu-pressure-memory-support
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "program install MU trash|countered|memory support|memory hardware dominate" --reporter=verbose
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-hand-development.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts
---

# AI-MU-Sacrifice-Regression und Debug

## Ziel

Die MU-/Program-Sacrifice-Logik mit fokussierten Tests und redigierter Debug-Evidence absichern, damit die KI keine wichtigen Programme zufällig oder positionsbasiert für MU opfert.

## Kontext und Quellen

- Vorarbeiten:
  - `act-2026-06-07-ai-mu-install-action-surface-audit`
  - `act-2026-06-07-ai-program-sacrifice-evaluation`
  - `act-2026-06-07-ai-mu-pressure-memory-support`
- Bestehende Regressionen aus `docs/activities/done/act-2026-05-21-runner-ai-program-install-trash-policy.md` decken Basispfade ab; dieses Paket erweitert sie um Planrollen, Memory-Alternativen, Counter-/Credit-Wert und Debug-Nachvollziehbarkeit.

## Scope

- Fokussierte Tests für folgende Szenarien ergänzen:
  - MU voll, neue Programminstallation würde einzigen passenden Breaker trashen: Installation nicht wählen, solange kein akuter höherer Grund besteht.
  - MU voll, Memory-Hardware in Hand und bezahlbar: Memory installieren statt kritisches Programm trashen.
  - MU voll, neues Programm löst akuten Remote-Score-Threat oder Coverage-Notfall, Opfer ist Low-Value: Installation erlaubt.
  - MU voll, Opferauswahl zwischen kritischem Breaker und Low-Value-Utility: Low-Value-Utility wird gewählt.
  - MU fast voll, gute Programme in Hand: Memory-Support bekommt Bonus.
  - Programm mit Countern, gespeicherten Credits oder Host-/Daemon-Abhängigkeit wird nicht leichtfertig getrasht.
  - Finale Auswahl kommt weiterhin ausschließlich aus `input.legalActions` beziehungsweise `pendingChoice.options`.
- DecisionDebug-/Evidence-Erwartungen ergänzen:
  - `memoryUsed`/`memoryLimit`/`memoryAvailable`,
  - `requiresProgramTrash`,
  - bester Opferkandidat,
  - `sacrificePenalty`,
  - ausgewähltes Opfer,
  - warum Memory-Support gewählt oder nicht gewählt wurde.

## Nicht im Scope

- Keine neue Bewertungslogik ohne Bezug zu den vorgelagerten Paketen.
- Keine Browser-/UI-E2E-Pflicht.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine verdeckten Korp-Informationen in Debug oder Tests.

## Akzeptanzkriterien

- [ ] Die neuen Tests schützen kritische Breaker, aktive Payoff-Programme und Programme mit Counter-/Credit-Wert.
- [ ] Die Tests beweisen, dass Memory-Support bei MU-Druck eine echte Alternative zur Program-Opferung ist.
- [ ] Mindestens ein Test beweist, dass ein Low-Value-Opfer bei hohem Installationsnutzen weiterhin erlaubt bleibt.
- [ ] Debug-/Evidence-Daten sind redigiert und enthalten keine verdeckten Karten oder FullState-Dumps.
- [ ] Die fokussierten AI-Tests und `git diff --check` laufen erfolgreich.

## Umsetzungshinweise

- Empfohlene Checks:
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/runner-hand-development.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts`
  - `git diff --check`
- Wenn die finale Implementierung neue fokussierte Testdateien anlegt, diese statt des breiten `index.test.ts`-Laufs bevorzugen.

## Ergebnisnotiz

Erledigt: Die MU-Sacrifice-Regressionen decken jetzt Counter-/Stored-Value-Programme, Low-Value-Opferauswahl und Memory-Support unter mittlerem MU-Druck ab. Die Debug-Evidence bleibt side-safe und benennt Kandidatenanzahl, ausgewählte Kategorie und MU-Druckgründe ohne private Zustandsdaten.
