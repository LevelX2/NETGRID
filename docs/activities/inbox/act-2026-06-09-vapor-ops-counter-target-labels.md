---
activityId: act-2026-06-09-vapor-ops-counter-target-labels
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-installed-card-action-label-cleanup
  - act-2026-05-19-shell-traders-action-labels-target-card
  - act-2026-05-19-run-window-action-label-compactness
resultArtifacts: []
checks: []
---

# Vapor Ops: Counter-Bewegungsoptionen mit Ziel und Anzahl beschriften

## Ziel

Die zweistufige Aktionsauswahl für `Vapor Ops` soll bei mehreren möglichen Zielen und Counter-Anzahlen eindeutig bleiben. Spätestens die nachgelagerte Auswahlliste muss sagen, wie viele Advancement-Counter auf welche Zielkarte bewegt werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-09 mit Screenshot: Bei installierter und fortgeschrittener `Vapor Ops` erscheint an der Karte der generische Button `Advancement-Counter bewegen`.
- Nutzerpräzisierung vom 2026-06-09: Nach Auswahl des Buttons erscheint offenbar eine Folgeliste mit Optionen wie `1`, `2`, `3` Counter auf das Ziel. Der Nutzer erwartet, dass diese Liste komplett so aufgebaut wird und bei mehreren Zielen nicht mehrdeutig bleibt.
- `Vapor Ops`-Implementierung: `packages/engine/src/card-implementations/onr-v1/corp/assets/vapor-ops.ts` nutzt `move_advancement_counters` mit Label `Vapor Ops: Advancement-Counter bewegen`.
- Generischer Move-Choice-Pfad: `packages/engine/src/game/engine-runtime-internal/turn-corp-runtime.ts` baut `startCardImplementationMoveAdvancementChoice` und die Choice-Optionen für `move_advancement_counters`.
- Verwandte UI-Regel aus `act-2026-05-17-installed-card-action-label-cleanup`: Direkt an einer installierten Karte darf der Quellenname gekürzt werden; zentrale oder listenartige Aktionsflächen müssen genug Kontext behalten.
- Verwandter Zielklarheitsfall aus `act-2026-05-19-shell-traders-action-labels-target-card`: Parallele Kartenaktionen müssen über Zielkartennamen unterscheidbar sein.

## Scope

- `Vapor Ops` mit mehreren Advancement-Countern und mindestens zwei legalen advancebaren Zielkarten reproduzieren.
- Prüfen, welche Texte in der ersten Kartenaktion und in der nachgelagerten Pending-Choice-/Actionliste sichtbar sind.
- Den direkt an `Vapor Ops` hängenden Sammelbutton nur dann generisch lassen, wenn die folgende Auswahl eindeutig ist.
- Die Folgeliste so beschriften, dass jede Option Zielkarte und Counteranzahl enthält, z. B. `1 Advancement-Counter auf <Zielkarte>` und `3 Advancement-Counter auf <Zielkarte>`.
- Bei mehreren Zielkarten müssen alle Optionen allein über den sichtbaren Text unterscheidbar sein.
- Prüfen, ob derselbe generische `move_advancement_counters`-Pfad auch `Falsified Transactions Expert` oder weitere Karten betrifft; wenn ja, dieselbe Labelregel dort anwenden, solange es derselbe kleine Label-Schnitt bleibt.
- Fokussierte Tests für die Labelbildung ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung an den Regeln von `Vapor Ops`, `Falsified Transactions Expert` oder Advancement-Countern.
- Keine Änderung an `actionId`, LegalAction-Erzeugung, Ziellegalität, Kosten, `applyAction`-Revalidierung, Replay oder StateHash.
- Keine neue allgemeine UI-Umgestaltung des Action Boards.
- Keine Anzeige verdeckter Korp-Kartennamen für Runner, Spectator, PublicEvents, Reconnect-Payloads, Logs oder KI-Inputs. Zielnamen verdeckter Korp-Karten dürfen nur in der Korp-eigenen Entscheidungsansicht erscheinen.

## Akzeptanzkriterien

- [ ] Bei `Vapor Ops` mit mehreren Countern und mehreren advancebaren Zielkarten zeigt die nachgelagerte Auswahl pro Option Zielkarte und Counteranzahl.
- [ ] Es gibt keine parallelen Optionen mit identischem sichtbarem Text, wenn sie unterschiedliche Ziele oder Counteranzahlen auslösen.
- [ ] Der direkt an `Vapor Ops` angezeigte Button bleibt knapp, aber nicht irreführend; falls die Folgeliste nicht sicher eindeutig ist, enthält schon der erste Schritt ausreichend Kontext.
- [ ] Vergleichbare `move_advancement_counters`-Optionen aus demselben generischen Pfad sind geprüft und verhalten sich konsistent.
- [ ] Korp-eigene Zielnamen leaken nicht in Runner-/Spectator-/Public-Ansichten, PublicEvents, Logs, Reconnect-Payloads oder KI-Inputs.
- [ ] Fokussierte Engine- oder Webtests decken mindestens den `Vapor Ops`-Mehrziel-/Mehrcounter-Fall ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/engine/src/game/engine-runtime-internal/turn-corp-runtime.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/assets/vapor-ops.ts`
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/action-board-ui.test.ts`
  - bestehende Engine-Smokes unter `packages/engine/src/index-tests/originalset/`
- Wenn die Pending-Choice-Optionen bereits in der Engine ausreichend Zielinformationen enthalten, bevorzugt dort die Labels korrigieren, statt im Web über Kartenzustand zu raten.
- Für Korp-eigene Choice-Labels sind bekannte Zielkartentitel erlaubt; öffentliche oder gegnerische Projektionen müssen bei verdeckten Korp-Karten weiter redigiert bleiben.
- Falls beim Reproduzieren sichtbar wird, dass nur der Screenshot-Sammelbutton betroffen ist und die Folgeliste bereits eindeutig ist, das Paket auf einen kurzen UI-Kontextcheck und Regressionstest reduzieren.

## Ergebnisnotiz

Noch offen.
