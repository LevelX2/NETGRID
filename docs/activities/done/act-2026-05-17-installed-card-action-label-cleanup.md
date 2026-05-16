---
activityId: act-2026-05-17-installed-card-action-label-cleanup
status: done
kind: cleanup
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
---

# Installierte Kartenaktionen ohne redundanten Kartennamen

## Ziel

Aktionsbeschriftungen direkt unter installierten Karten sollen den Kartennamen nicht wiederholen. Wenn die Aktion räumlich und funktional am Node, Asset, Upgrade, Programm, Resource oder einer anderen installierten Karte hängt, beschreibt der Button nur die eigentliche Aktion.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Bei `BBS Whispering Campaign` steht der Aktionsbutton direkt unter dem installierten Node, wiederholt aber im Aktionstext erneut den Kartennamen. Da der Kontext bereits über die Karte gegeben ist, ist diese Wiederholung unnötig und schlechter lesbar.
- Betroffen sind grundsätzlich UI-Flächen, in denen LegalActions als Button/Action-Chip direkt an einer installierten Karte oder einem installierten Update angezeigt werden.
- Nicht betroffen sind zentrale oder listenartige Aktionsflächen, in denen der Kartenkontext nicht unmittelbar sichtbar ist; dort kann der Kartenname zur Unterscheidung nötig bleiben.

## Scope

- Systematisch prüfen, welche installierten Karten, Nodes, Assets, Upgrades, Programme, Resources oder vergleichbare Updates eigene Aktionen am Karten-/Node-Ort anzeigen.
- Fälle finden, in denen der Buttontext den Kartennamen redundant wiederholt, obwohl der Button direkt an dieser Karte hängt.
- Redundante Kartennamen aus solchen Buttontexten entfernen und stattdessen die konkrete Aktion benennen, z. B. Kosten, Effekt oder Wahlhandlung.
- `BBS Whispering Campaign` als konkreten Startfall prüfen und bereinigen.
- Sicherstellen, dass zentrale Aktionslisten, Tooltips, Chronik, Reconnect-Ansichten und Accessibility-Texte weiterhin genug Kontext behalten, wenn sie nicht direkt an der Karte hängen.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine Änderung an LegalAction-Validierung, `actionId`, Replay, StateHash oder KI-Entscheidungen.
- Keine Umbenennung von Kartennamen, Definition-IDs oder Resolver-IDs.
- Kein Redesign des Action Boards oder der Kartenlayout-Flächen.
- Keine Entfernung von Kartennamen aus Kontexten, in denen der Button nicht eindeutig unter der Karte steht.

## Akzeptanzkriterien

- [x] `BBS Whispering Campaign` wiederholt den Kartennamen nicht mehr im direkt unter der Karte angezeigten Aktionsbutton.
- [x] Vergleichbare installierte Kartenaktionen wurden systematisch gesucht und auffällige redundante Buttontexte bereinigt.
- [x] In zentralen Aktionsflächen bleibt der Kartenkontext erhalten oder wird begründet beibehalten.
- [x] Hidden-Info-Grenzen bleiben unverändert; es werden keine verdeckten Kartendaten in Labels, Tooltips oder Tests geleakt.
- [x] Fokussierte Web-/Rendering- oder Snapshot-Tests decken mindestens einen bereinigten Kartenaktionsfall ab, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Startpunkte sind wahrscheinlich die Web-Darstellung von `LegalActions` an installierten Karten sowie die Label-Ableitung aus card-/ability-Metadaten.
- Die Bereinigung sollte möglichst an der UI-Label-Schicht erfolgen, nicht durch Änderung stabiler Engine-IDs oder Resolver-Verträge.
- Für direkt angehängte Kartenaktionen gilt als Leitregel: Der sichtbare Kartencontainer liefert das Subjekt, der Button liefert Verb, Kosten und Effekt.
- Für globale Aktionslisten gilt die umgekehrte Leitregel: Wenn der Kartencontainer nicht sichtbar ist, darf oder muss der Kartenname zur Orientierung erhalten bleiben.

## Ergebnisnotiz

Erledigt am 2026-05-17. `contextualCardActionLabel` kürzt direkt an installierten V1.9.17-Asset-/Node-Karten hängende Economy-/Trace-/Utility-Aktionslabels, ohne die zentralen `actionButtonLabel`-Texte zu verändern. `BBS Whispering Campaign: 2 Credits` wird im Kartenkontext zu `2 Credits`; zentrale Aktionsflächen behalten den vollen Kartenkontext. Der fokussierte Test deckt BBS Whispering Campaign und einen vergleichbaren Trace-Asset-Fall ab. Checks: `corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts`, `corepack pnpm --filter @netgrid/web typecheck`.
