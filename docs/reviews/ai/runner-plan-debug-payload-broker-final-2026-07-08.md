# Runner-Plan Debug/Payload/Broker Final 2026-07-08

Status: umgesetzt im Worktree `C:\Projekte\NETGRID_RUNNER_PLAN_DEBUG_PAYLOAD_BROKER` auf Branch `codex/runner-plan-debug-payload-broker`.

## Ergebnis

- Die Live-Debug-Anzeige zeigt die neue Runner-Planebene verständlicher: Tag-Clear-/Survival-Planlabels, Required-Subroutine-Indizes, Break-Sequenz, Steal-/Trash-Reserve und Zweckcredits sind sichtbar.
- TacticalPlans erkennen Run-Payload- und Post-success-Fenster besser. Legale Follow-up-Aktionen nach erfolgreichem Run erhalten mit `runner.convert_success_window` eine eigene Planlinie und können normale Economy-/Setup-Aktionen übersteuern.
- Broker-/Credit-Bank-Planung verwendet jetzt ein explizites Aufbau-/Cashout-Modell: weiter aufbauen bis 12 gespeicherte Credits, bei niedrigem Creditpool erst ab 6 gespeicherten Credits auszahlen, bei konkretem Plan-FundingNeed sofort auszahlen.
- RunnerRunPlans führen Run-only-, recurring Breaker-/Killer-/Link-, Stealth- und Non-noisy-Breaker-Credits getrennt im Budget und geben sie als Debug-Evidence aus.

## Grenzen

- Es wurde keine Engine-Regel geändert und keine neue LegalAction erzeugt.
- Spezialcredits werden nur aus LegalAction-Payloads, ActionSemanticCandidates und sichtbaren Runner-Rig-Counter-Displays abgeleitet.
- Es gibt weiterhin keine vollständige mehrzügige Suchplanung für alle Run-Events; die Änderung stärkt die aktuelle Plan- und Mapping-Schicht konservativ.

## Verifikation

- `corepack pnpm exec vitest run packages/ai/src/tactical-plans.test.ts packages/ai/src/runtime/runner-bank-investment-context.test.ts packages/ai/src/runtime/runner-run-plan-memory.test.ts packages/ai/src/diagnostics/semantic-runtime-decision-debug.test.ts apps/web/app/maintenance.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

Alle genannten Checks waren im Arbeitsbranch grün.
