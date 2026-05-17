---
activityId: act-2026-05-17-junkyard-bbs-installed-resource-action
status: in_progress
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Junkyard BBS: installierte Ressourcenaktion anbieten

## Ziel

`Junkyard BBS` muss nach Installation eine nutzbare Aktion anbieten, um die oberste passende Karte aus Heap/Trash zurückzuholen, sofern die Voraussetzungen erfüllt sind.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Installierte Karte funktioniert offenbar nicht; keine nutzbare Aktion erscheint.
- Lokaler Kartenanker: `onr_v1_165_junkyard-bbs`.

## Scope

- Aktivierte Fähigkeit beim Installieren und in der LegalAction-Erzeugung prüfen.
- Zone-Begriffe (`heap`, `trash`, `archives`, `discardPile`) gegen die Regel- und Engine-Bezeichnungen abgleichen.
- UI-Aktionsliste und kartennahe Aktionen für installierte Runner-Ressourcen prüfen.
- Chronik-Eintrag für Ausführung ergänzen oder korrigieren.

## Nicht im Scope

- Keine generelle Resource-UI-Neugestaltung.
- Keine Änderung an anderen BBS-Karten außer bei klar gemeinsamem Resolverfehler.

## Akzeptanzkriterien

- [ ] Bei erfüllten Voraussetzungen erscheint die Junkyard-BBS-Aktion in der LegalAction-/UI-Liste.
- [ ] Die oberste korrekte Ablagestapelkarte wird erkannt und regelgerecht bewegt.
- [ ] Kosten, Timing und Zielzone werden in `applyAction` erneut validiert.
- [ ] Chronik dokumentiert Quelle, Zielkarte oder generisches Hidden-Info-Label und Zielzone.
- [ ] Regression deckt installierte Junkyard BBS mit passender Ablagestapelkarte ab.

## Umsetzungshinweise

- Erst klären, ob der Effekt fehlt oder nur nicht in der UI angeboten wird.

## Ergebnisnotiz

Noch offen.
