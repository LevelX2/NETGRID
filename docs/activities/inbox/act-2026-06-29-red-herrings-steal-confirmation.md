---
activityId: act-2026-06-29-red-herrings-steal-confirmation
status: inbox
kind: fix
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-29
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Red Herrings Steal-Zahlung explizit bestätigen und chronisieren

## Ziel

Wenn der Runner eine Agenda aus einem Fort mit gerezztem `Red Herrings` accesset und genug Credits für die Zusatzkosten hat, soll die Zahlung von 5 Credits nicht nur implizit über die Agenda-Stehlen-Aktion passieren. Die Runner-Entscheidung muss ausdrücklich sichtbar machen, dass 5 Credits bezahlt werden, um die Agenda zu stehlen. Die Spielchronik muss danach lesbar festhalten, dass die Agenda gestohlen wurde und 5 Credits wegen Red Herrings bezahlt wurden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-29: Bei `Red Herrings` soll beim Stehlen einer Agenda mit genug Runner-Credits explizit gefragt werden, ob 5 Credits bezahlt werden sollen; die Zahlung soll in der Spielchronik auftauchen.
- Kartentext in `packages/engine/src/card-implementations/onr-v1/corp/upgrades/red-herrings.ts`: Runner muss 5 zusätzlich bezahlen, um Agendas aus diesem Fort zu stehlen.
- Aktueller Engine-Pfad in `packages/engine/src/game/access/access-actions.ts`: `steal_agenda` erhält bei Steal-Cost einen Credit-Cost und Payload-Felder wie `stealCost`, `stealAdditionalCost`, `stealCostSourceDefinitionIds` und `stealCostSourceTitles`; die sichtbare Action-Label-Form ist aber weiterhin nur `<Agenda> stehlen`.
- Bestehende Tests in `packages/engine/src/index-tests/mechanics/assets-nodes-upgrades.test.ts` prüfen Red-Herrings-Steal-Cost, Revalidierung und PublicPayload, aber nicht die explizite Runner-Frage oder den lesbaren Chroniktext.

## Scope

- Runner-facing Darstellung für Agenda-Steal-Aktionen mit `stealCost > 0` prüfen und so anpassen, dass die Kosten und die Quelle explizit sind, zum Beispiel sinngemäß `5 Credits wegen Red Herrings bezahlen und <Agenda> stehlen`.
- Prüfen, ob bei ausreichenden Credits eine echte Ablehnen-/Nicht-stehlen-Option regelkonform angeboten werden muss. Falls ja, muss diese Option als LegalAction aus der Engine kommen; falls nein, muss zumindest die UI vor Ausführung der kostenpflichtigen Aktion eindeutig bestätigen lassen.
- Chronik-/PublicEvent-Darstellung für `steal_agenda` mit `stealCost` und `stealCostSourceTitles` so erweitern, dass die gestohlene Agenda und die Red-Herrings-Zahlung in einem lesbaren Eintrag erscheinen.
- Red-Herrings-Fall über die vorhandenen öffentlichen Payload-Felder abbilden; keine neue private Information aus Corp-Zonen ableiten.
- Regression für den Fall mit gerezztem Red Herrings, ausreichend Runner-Credits und Agenda-Access ergänzen.

## Nicht im Scope

- Keine Änderung daran, dass die Rules Engine die einzige Regelautorität bleibt.
- Keine Umgehung von `LegalActions`; UI darf keine eigenen Regelentscheidungen oder Zahlungen erfinden.
- Keine Hidden-Info-Ausweitung in PublicEvents, PlayerViews, Reconnect-Payloads, Undo-Previews oder Logs.
- Keine generelle Neugestaltung der Run-/Access-UI.
- Keine Änderung am Red-Herrings-Scope für same-fort, rezzed/unrezzed, Persistenz nach Trash im selben Run oder StateHash/Replays, außer sie ist direkt nötig und durch Tests abgesichert.

## Akzeptanzkriterien

- [ ] Beim Zugriff auf eine Agenda aus einem Fort mit gerezztem `Red Herrings` und mindestens 5 Runner-Credits wird vor dem Bezahlen/Stehlen ausdrücklich sichtbar, dass 5 Credits wegen Red Herrings bezahlt werden.
- [ ] Falls das Regelmodell Nicht-Bezahlen trotz ausreichender Credits erlaubt, gibt es eine LegalAction zum Nicht-Stehlen ohne Creditzahlung; falls nicht, ist die kostenpflichtige Steal-Aktion trotzdem eindeutig bestätigungspflichtig dargestellt.
- [ ] Nach erfolgreichem Steal zeigt die Spielchronik sinngemäß: Agenda wurde gestohlen und 5 Credits wurden wegen Red Herrings bezahlt.
- [ ] Bei weniger als 5 Runner-Credits bleibt Stehlen blockiert beziehungsweise nur die bestehende Nicht-Stehlen-/Weiter-Aktion legal; keine Zahlung wird angezeigt oder gebucht.
- [ ] Event-/Chroniktext nutzt nur öffentliche Payload-Felder wie `stealCost` und `stealCostSourceTitles` und leakt keine verdeckten Kartendaten.
- [ ] Bestehende Red-Herrings-Engine-Regressionen für Kosten, Revalidierung, Replay und StateHash bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil Karten-/Regelmechanik, LegalAction-Semantik und Chronikdarstellung gemeinsam betroffen sind.
- Wahrscheinliche Einstiegspunkte: `packages/engine/src/game/access/access-actions.ts`, `packages/engine/src/game/access/access-flow.ts`, PublicEvent-/Chronik-Renderer im Client und die Red-Herrings-Tests unter `packages/engine/src/index-tests/mechanics/assets-nodes-upgrades.test.ts`.
- Vor einer Engine-Änderung klären, ob das gewünschte "willst du bezahlen?" als echte Regelwahl oder als UI-Bestätigung für eine verpflichtende kostenpflichtige Aktion modelliert werden soll.
- Für andere Steal-Cost-Quellen sollte die Lösung generisch über `stealCost`/`stealCostSourceTitles` funktionieren, Red Herrings ist der konkrete Startfall.

## Ergebnisnotiz

Noch offen.
