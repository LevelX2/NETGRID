---
activityId: act-2026-05-22-remote-root-hidden-card-order-leak
status: inbox
kind: fix
area: web
priority: hotfix
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Remote-Root-Darstellung ohne verdeckte Typ-Leaks

## Ziel

Verdeckte/unrezzed Root-Karten in Remote/Data Forts dürfen durch Position, Gruppierung oder Orientierung keinen Rückschluss auf Node/Agenda/Upgrade erlauben.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: In einem Remote lag erst ein unrezzed Upgrade, dann ein rezzed Node, dann ein weiteres unrezzed Upgrade; sichtbar war `Upgrade - Node - Upgrade`.
- Nutzerannahme: Installationsreihenfolge darf offen nachvollziehbar sein, aber der Typ verdeckter Karten darf nicht allein aus UI-Gruppierung ableitbar sein.
- Frühere relevante Activities:
  - `docs/activities/done/act-2026-05-17-central-root-upgrade-install-targets.md`
  - `docs/activities/done/act-2026-05-17-upgrade-rez-action-placement.md`

## Scope

- Internes Root-Kartenmodell und Web-Sortierung für Remote/Data Forts prüfen.
- Klären, ob die sichtbare Reihenfolge Installationsreihenfolge oder Typ-Sortierung darstellt.
- UI so anpassen, dass unrezzed Root-Karten neutral und einheitlich dargestellt werden.
- Rezzed Karten dürfen offen erkennbar bleiben, dürfen aber unrezzed Nachbarn nicht durch separate verdeckte Upgrade-/Node-Gruppen klassifizieren.
- Access-Zugänglichkeit aller Root-Karten unabhängig von visueller Reihenfolge absichern.

## Nicht im Scope

- Keine Änderung an den Regeln, welche Karten in einem Remote/Data Fort installiert werden dürfen.
- Keine Änderung an Access-Regeln außer Tests gegen beschädigte Reihenfolge/Zugänglichkeit.
- Kein vollständiges Board-Redesign.
- Keine Offenlegung verdeckter Definitionen, Typen, Subtypen oder Installationsabsichten.

## Akzeptanzkriterien

- [ ] Unrezzed Root-Karten in Remote/Data Forts erscheinen mit gleicher verdeckter Darstellung und ohne typbasierte Gruppierung.
- [ ] Installationsreihenfolge bleibt, falls sie offen sein soll, konsistent nachvollziehbar.
- [ ] Rezzed Root-Karten bleiben als offene Karten erkennbar, ohne unrezzed Karten daneben zu klassifizieren.
- [ ] Runner-PlayerView, Reconnect-Payload, PublicEvents und UI leaken keine verdeckten Root-Kartentypen.
- [ ] Zugriff/Access auf alle Root-Karten bleibt korrekt.
- [ ] Test oder Browser-Smoke deckt die Sequenz unrezzed Upgrade, rezzed Node, unrezzed Upgrade ab.

## Umsetzungshinweise

- Primärer Agent ist bewusst `architecture-review-agent`, weil zuerst die Schichtgrenze zwischen Engine-Projection, PlayerView-Redaction und Web-Sortierung geklärt werden muss.
- Falls die Analyse zeigt, dass nur CSS/Rendering betroffen ist, kann die Umsetzung danach an `small-adjustments-agent` übergeben werden.

## Ergebnisnotiz

Noch offen.
