---
activityId: act-2026-05-17-hq-access-root-upgrade-sequence
status: in_progress
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# HQ-Access: installiertes Root-Upgrade zugreifbar machen

## Ziel

Bei erfolgreichem HQ-Zugriff muss der Runner neben einer zufälligen HQ-Handkarte auch alle zugreifbaren installierten Upgrades im HQ-Root sauber erreichen und abhandeln können.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: In HQ lag ein Upgrade wie `Olivia Salazar`; die UI zeigte offenbar `Karte 1 von 2`, aber keine nutzbare zweite Access-Karte.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-central-root-upgrade-install-targets.md` hatte zentrale Root-Upgrade-Installation und Sichtbarkeit behandelt, nicht diesen Access-Sequenz-Bug.

## Scope

- HQ-Access-Queue für Handkarte plus HQ-Root-Upgrades prüfen.
- Navigation zwischen mehreren Access-Objekten bereitstellen oder reparieren.
- Trash-/Nicht-Trash-Entscheidung für zugreifbare Upgrades sicherstellen.
- Chronik für beide Zugriffe ergänzen.

## Nicht im Scope

- Keine generelle Remote-Access-Neugestaltung.
- Keine Änderung an der Legalität zentraler Root-Upgrade-Installation.

## Akzeptanzkriterien

- [ ] HQ-Zugriff mit Handkarte plus HQ-Root-Upgrade bietet beide Access-Objekte erreichbar an.
- [ ] `Karte 1 von 2`, Weiter/Zurück oder äquivalente Navigation funktioniert.
- [ ] Trash-Entscheidungen für Upgrades bleiben möglich, soweit regelrecht.
- [ ] Chronik dokumentiert beide Zugriffsvorgänge side-sicher.
- [ ] Regression deckt mindestens ein HQ-Root-Upgrade ab.

## Umsetzungshinweise

- Prüfen, ob der zweite Access-State erzeugt, aber nicht gerendert wird.
- Hidden-Info: nicht accessierte HQ-Handkarten bleiben verdeckt.

## Ergebnisnotiz

Noch offen.
