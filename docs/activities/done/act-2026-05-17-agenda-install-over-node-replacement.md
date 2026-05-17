---
activityId: act-2026-05-17-agenda-install-over-node-replacement
status: done
kind: fix
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "remote root|agenda over node"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "Corp install destinations"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Agenda über vorhandenen Node im Fort installieren

## Ziel

Die Korp soll prüfen und ggf. korrekt ausführen können, eine Agenda in ein Remote/Fort zu installieren, in dessen Root bereits ein Node liegt. Falls die Regel so gilt, wird der vorhandene Node dabei automatisch getrasht bzw. nach Archives gelegt, statt das Fort als Agenda-Ziel auszublenden.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: In `Fort 1` liegt ein Node. Die Korp kann den Node aktuell nicht gezielt aus dem Fort entfernen und beim Installieren einer Agenda wird `Fort 1` nicht als Ziel angeboten.
- Nutzererinnerung: Ein Fort kann nur eine Hauptkarte im Root haben, also Node oder Agenda. Wenn die Korp eine Agenda in ein Fort mit Node installiert, sollte der vorhandene Node automatisch nach Archives gehen, praktisch wie ein Trash-/Replace-Vorgang.
- Lokale Projekt-Doku modelliert Server mit `root: CardInstanceRef[]` und Remote-Zugriff auf Root-Karten, enthält aber in den bisher geprüften Stellen keine explizit ausformulierte allgemeine Agenda-over-Node-Replacement-Regel.
- Verwandte lokale Stelle: Region-Upgrades ersetzen ältere Regions im selben Fort und legen ältere Regions nach Archives; das beweist nicht die Node/Agenda-Regel, zeigt aber vorhandene Replacement-/Archives-Muster.

## Scope

- Regel-/Quellenlage gezielt prüfen:
  - Darf die Korp einen installierten Node in einem Fort jederzeit freiwillig trashen?
  - Darf eine Agenda in ein Fort installiert werden, in dem bereits ein Node liegt?
  - Wird der Node dabei automatisch getrasht/nach Archives gelegt?
  - Gilt die umgekehrte Richtung ebenfalls: Node über Agenda installieren, oder ist das wegen installierter Agenda/Advancements anders eingeschränkt?
- Falls bestätigt: Agenda-Install-LegalActions so erweitern, dass ein Fort mit vorhandenem Node als Ziel angeboten wird.
- Replace-/Trash-Auflösung implementieren oder korrigieren:
  - vorhandener Node wird deterministisch nach Archives bewegt.
  - gehostete Karten/Counters/State werden korrekt abgewickelt.
  - PublicEvents und PlayerViews bleiben side-sicher.
- UI-Zielauswahl klar formulieren, z. B. dass die Installation den vorhandenen Node ersetzt/trasht.
- Prüfen, ob eine separate Korp-Aktion zum freiwilligen Trashen eigener Nodes im Fort existieren sollte und ob sie aktuell fehlt.

## Nicht im Scope

- Keine Änderung an Upgrade-Koexistenzregeln; Upgrades bleiben getrennt vom Node/Agenda-Hauptslot.
- Keine pauschale Regeländerung für ICE.
- Keine Änderung an Agenda-Score-/Steal-Regeln außer der Installationszielwahl.
- Keine Freischaltung neuer Kartenfähigkeiten ohne eigenes Gate.
- Keine Hidden-Info-Aufweichung bei verdeckten installierten Root-Karten.

## Akzeptanzkriterien

- [ ] Regel-/Quellenentscheidung ist dokumentiert: Agenda über Node erlaubt oder begründet verboten.
- [ ] Wenn erlaubt, bietet die Agenda-Installation ein Fort mit vorhandenem Node als Ziel an.
- [ ] Wenn erlaubt, wird der vorhandene Node beim Installieren der Agenda korrekt nach Archives bewegt.
- [ ] Falls freiwilliges Trashen eigener Nodes generell erlaubt ist, existiert eine passende LegalAction oder ein dokumentierter Folgepunkt.
- [ ] `applyAction` revalidiert Side, StateVersion, Ziel-Fort, Kartentypen, Hidden-Info-Status und Replacement/Trash-Folge.
- [ ] Gehostete Karten und sichtbare Counter werden beim Node-Trash korrekt behandelt.
- [ ] PublicEvents/PlayerViews leaken keine verdeckten Informationen.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Engine-Regression deckt Agenda-Installation über vorhandenen Node ab.
- [ ] Web-/UI-Regression deckt die Zielauswahl und klare Replace-/Trash-Beschriftung ab, oder Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind Corp-Install-Zielableitung und Install-Auflösung in `packages/engine/src/index.ts` sowie die Install-Zielauswahl in `apps/web/app/page.tsx` bzw. `apps/web/app/action-board-ui.ts`.
- Vor Implementierung nicht aus der aktuellen UI ableiten, sondern lokale Regeln/Quellenentscheidung festhalten.
- Wenn die Korp eigene installierte Nodes jederzeit trashen darf, sollte das als getrennte Standardaktion modelliert oder bewusst als separater Folgeauftrag abgelegt werden.
- Die UI sollte bei Replace-Zielen nicht nur `Fort 1` anzeigen, sondern die Konsequenz kenntlich machen, damit die Korp nicht versehentlich einen Node verliert.

## Ergebnisnotiz

Erledigt. Regelentscheidung fuer diesen Schnitt: Agenda ueber vorhandenen Node/Asset in einem Remote ist erlaubt und ersetzt den Node deterministisch nach Archives; Asset/Node ueber Agenda oder ueber Asset bleibt verboten. `applyAction` revalidiert die Ziel- und Kartentypen ueber `canInstallCorpRootCardInServer`; gehostete Corp-Karten und Counter laufen ueber den bestehenden Archives-Trash-Helfer, der Counter jetzt mit aufraeumt. PublicPayload nennt nur die generische Replacement-Art und keinen verdeckten ersetzten Kartennamen. Die UI zeigt das Ziel als `In Fort N (Node ersetzen)`. Eine separate freiwillige Korp-Aktion zum Trashen eigener Nodes wurde nicht eingefuehrt und bleibt bei Bedarf ein eigener Folgeauftrag.
