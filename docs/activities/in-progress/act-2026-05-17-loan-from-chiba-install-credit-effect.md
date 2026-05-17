---
activityId: act-2026-05-17-loan-from-chiba-install-credit-effect
status: in_progress
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Der gültige Kartentext ist geprüft und der Konflikt ist sichtbar entschieden.
- [ ] Bei Installations-Credit-Gain erhält der Runner sofort `+12` normale Credits.
- [ ] Es entstehen keine falschen hosted/recurring Counter auf der Karte.
- [ ] Chronik nennt Installation und Credit-Effekt korrekt.
- [ ] Regression deckt Installation und sichtbare Marker/Credits ab.

## Umsetzungshinweise

- Diese Activity ist trotz Quellenkonflikt `hotfix`, weil eine freigegebene Karte nach Nutzerbefund unspielbar oder massiv falsch wirkt.

## Ergebnisnotiz

Noch offen.
