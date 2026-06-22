# AI Remote No-Payoff Repeat Run Fix - Abschlussreport

Datum: 2026-06-22

## Anlass

Ein Playtest-Befund zeigte einen Runner-KI-Loop: Remote 1 war offen und ungeict, der Runner griff zu, der Access endete ohne Trash, Steal oder sonstigen Fortschritt, und die nächste Entscheidung wählte direkt wieder `start_run remote_1`. Die nachgereichte AI-Preview zeigte, dass `runner.contest_remote:remote_1` durch Planfortschreibung und Plan-Mapping über R&D/HQ gehalten wurde.

## Umsetzung

- `deriveObservedRemoteNoProgressAccessMemory` rekonstruiert aus side-sicheren PublicEvents einen No-Progress-Outcome für denselben Remote-Server.
- `evaluateRunnerRunTargets` nutzt diesen Outcome pro Zielserver als AccessOutcomeMemory-Fallback und bewertet den unveränderten Remote mit `declined_trash_memory_active`.
- Eine zusätzliche Score-Penalty verhindert, dass eine nominell trashbare, aber gerade ohne Fortschritt geaccesste Root-Karte direkt wieder Top-Pick bleibt.
- TacticalPlan-Evidence übernimmt `known_remote_no_current_payoff` und `repeated_remote_no_progress_suppressed`; ein Regressionstest deckt den nachgereichten Planfortschreibungsfall ab.
- Randfälle bleiben offen: bekannte Remote-Agenda, sichtbar geändertes Remote und aktuell unbekannte Root werden nicht durch den Guard blockiert.

## Safety-Grenzen

- Keine Engine-, `LegalAction`-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Nutzung verdeckter gegnerischer Daten; Grundlage sind PlayerView, LegalActions und PublicEvents.
- Keine allgemeine Remote-Run-Sperre; der Guard gilt nur für denselben unveränderten Remote-No-Progress-Fall.
- Debug-/Evidence-Marker bleiben side-sicher und enthalten keine privaten Payloads, CardInstances oder Decklisten.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/runner-run-target-evaluation.test.ts src/memory/remote-access-outcome.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Ergebnis

Der konkrete Repeat-Run-Fall ist abgedeckt: Ein beobachteter, unveränderter Remote-Access ohne Fortschritt erzeugt side-sicheren Outcome-Memory, senkt denselben Remote-Run ab und verhindert, dass Planfortschreibung Remote 1 über bessere Alternativen trägt. Sinnvolle Remote-Runs bleiben möglich, sobald Agenda-Payoff, unbekannte Root oder eine sichtbare Remote-Änderung vorliegt.
