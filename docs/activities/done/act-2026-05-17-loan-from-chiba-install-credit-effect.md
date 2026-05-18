---
activityId: act-2026-05-17-loan-from-chiba-install-credit-effect
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17T18:34:53+02:00
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.test.ts
  - data/rules/mechanics-coverage-1.9.20.json
  - data/scenarios/v1920-global-modifier-special-state-release-smoke.json
  - data/scenarios/v1920-global-modifier-special-state-wip-smoke.json
  - data/ai/ai-card-hints-active.json
  - data/reports/originalset-card-spotcheck-register.json
  - docs/reviews/originalset-spotchecks/register.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Loan from Chiba|Runner Resource Contacts"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "Loan from Chiba|recurring-credit refreshes"
  - node -e JSON.parse smoke for touched JSON artifacts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Loan from Chiba: Installations-Credits gegen Recurring-State prüfen

## Ziel

`Loan from Chiba` muss nach gesichertem Kartentext den korrekten Credit-Effekt auslösen; der Nutzer meldet `+12 Credits` beim Installieren statt sichtbarer, unbrauchbarer Recurring-/Hosted-Counter.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Runner erhält 0 Credits; stattdessen liegen 2 Credit-/Recurring-Marker auf der Karte.
- Lokaler Stand in Releaseartefakten deutet auf einen V1.9.20-Recurring-State hin; das kann ein Quellenkonflikt oder ein echter Implementierungsfehler sein.
- Lokaler Kartenanker: `onr_v1_168_loan-from-chiba`.

## Scope

- Exakten lokalen Kartentext und Rule-Working-Basis für `Loan from Chiba` prüfen.
- Falls Nutzererwartung korrekt ist: Installations-Credit-Gain `+12` in normalen Credit-Pool implementieren und falsche hosted/recurring Counter entfernen.
- Falls lokale Quelle bewusst Recurring-Credits verlangt: Befund als Regelkonflikt dokumentieren und Folgeentscheidung anlegen.
- Chronik-Eintrag für Credit-Gain oder bestätigten Recurring-Effekt korrigieren.

## Nicht im Scope

- Keine generelle Recurring-Credit-Pipeline ändern, außer der konkrete Fehler liegt dort.
- Keine Balance-/Kartentext-Neuinterpretation ohne Quellenentscheidung.

## Akzeptanzkriterien

- [x] Der gültige Kartentext ist geprüft und der Konflikt ist sichtbar entschieden.
- [x] Bei Installations-Credit-Gain erhält der Runner sofort `+12` normale Credits.
- [x] Es entstehen keine falschen hosted/recurring Counter auf der Karte.
- [x] Chronik nennt Installation und Credit-Effekt korrekt.
- [x] Regression deckt Installation und sichtbare Marker/Credits ab.

## Umsetzungshinweise

- Diese Activity ist trotz Quellenkonflikt `hotfix`, weil eine freigegebene Karte nach Nutzerbefund unspielbar oder massiv falsch wirkt.

## Ergebnisnotiz

Abgeschlossen. `docs/source/Runnerspoiler 1.0.txt` bestätigt für `Loan from Chiba`: `Gain [12] when Loan from Chiba is installed.` Die lokale Errata-Spur ergänzt Start-of-turn-/Leave-play-Regeln, enthält aber keine Recurring-Credit-Quelle. Der frühere V1.9.20-Recurring-State war damit ein Implementierungs-/Artefaktfehler.

Runtime und Katalogtext sind korrigiert: Die Installation gibt dem Runner sofort 12 normale Credits, schreibt einen öffentlichen `gain_credits`-Effekt für die Chronik und legt keine `recurring_credit`-Counter auf die Karte. Die Regressionen prüfen Installationsgewinn, fehlende Marker, Corp-PlayerView, PublicPayload-Leakscan und Replay/StateHash. Die AI-/Coverage-/Scenario-/Spotcheck-Metadaten wurden auf Installations-Credit-Gain statt Recurring-Refresh umgestellt.

Nicht umgesetzt in diesem Hotfix: der spätere Start-of-turn-Creditverlust, Leave-play-Zahlungsfenster und freiwilliges End-of-turn-Trash-Fenster. Diese Restteile sind weiterhin per-card Loan-from-Chiba-Detailverträge und keine generelle Recurring-Pipeline.
