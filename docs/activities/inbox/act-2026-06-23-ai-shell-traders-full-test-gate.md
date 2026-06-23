---
activityId: act-2026-06-23-ai-shell-traders-full-test-gate
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

Noch offen.
