---
activityId: act-2026-06-23-ai-shell-traders-full-test-gate
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt: 2026-06-23
completedAt: 2026-06-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/legacy/runner-plans.ts
  - packages/ai/src/index.test.ts
  - docs/reviews/ai/ai-shell-traders-full-test-gate-2026-06-23.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Shell Traders" --maxWorkers=1 --testTimeout=30000
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
---

# AI-Full-Test: Shell-Traders-Gate klären

## Ziel

Der vollständige `@netgrid/ai`-Testlauf soll wieder als belastbares Gate nutzbar werden. Vier Shell-Traders-Tests in `packages/ai/src/index.test.ts` sind aktuell rot; mindestens der erste Fehler war bereits auf `main` reproduzierbar.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-fix-2026-06-23.md`
- `docs/activities/done/act-2026-05-18-runner-ai-shell-traders-unused.md`
- `packages/ai/src/index.test.ts`

## Scope

- Reproduzieren, warum die erwartete `trigger_ability`-/Prepare-LegalAction im Testzustand fehlt.
- Klassifizieren: Test-Fixture veraltet, Engine-/LegalAction-Vertrag gebrochen oder AI-Erwartung falsch.
- Minimalen Fix oder Test-Refresh umsetzen, damit der volle AI-Testlauf als Gate wieder aussagekräftig ist.

## Nicht im Scope

- Keine Änderung am Kartenvertrag von `The Shell Traders`, wenn die Engine-LegalActions korrekt sind.
- Keine pauschale KI-Priorisierung von Shell Traders.
- Keine Engine-Änderung ohne gesonderten Engine-Fund und passende Tests.

## Akzeptanzkriterien

- [ ] Die Ursache der vier Shell-Traders-Fehler ist dokumentiert.
- [ ] Der betroffene Testzustand erzeugt die erwarteten LegalActions oder die Erwartung ist fachlich korrigiert.
- [ ] `corepack pnpm --filter @netgrid/ai test` ist grün oder ein verbleibender Blocker ist separat dokumentiert.
- [ ] Hidden-Info-, LegalAction- und Replay-Verträge bleiben unverändert.

## Umsetzungshinweise

- Primär `test-quality-agent`, weil der Befund das Full-Green-Gate betrifft.
- Erledigte ältere Shell-Traders-Activities nicht umdeuten; dieses Paket ist ein Follow-up.

## Ergebnisnotiz

Abgeschlossen. Die vier roten Shell-Traders-Tests waren durch Payload-Drift verursacht: aktuelle Engine-LegalActions nutzen `delayedInstallAbility`, während AI-Scoring, Legacy-Planbewertung und Tests noch `shellTradersAbility` erwarteten. Die Engine-LegalActions waren vorhanden und korrekt; der Kartenvertrag wurde nicht geändert.

`packages/ai/src/index.ts` und `packages/ai/src/legacy/runner-plans.ts` erkennen jetzt `delayedInstallAbility` mit Fallback auf das alte Feld. Die Shell-Traders-Tests in `packages/ai/src/index.test.ts` prüfen den aktuellen Engine-Vertrag. Bericht: `docs/reviews/ai/ai-shell-traders-full-test-gate-2026-06-23.md`.

Checks grün: fokussierter Shell-Traders-Lauf, `@netgrid/ai typecheck` und vollständiger `@netgrid/ai test` mit 141 Testdateien und 1583 Tests. Hidden-Info-, LegalAction-, Replay-, StateHash- und `applyAction`-Verträge bleiben unverändert.
