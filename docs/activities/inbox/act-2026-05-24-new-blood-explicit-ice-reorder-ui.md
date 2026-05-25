---
activityId: act-2026-05-24-new-blood-explicit-ice-reorder-ui
status: inbox
kind: fix
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# New Blood ICE-Neuordnung explizit steuerbar machen

## Ziel

`New Blood` soll der Korp im Webclient eine klare, kontrollierte ICE-Neuordnung geben. Die Korp darf nicht nur alle ICE anklicken und danach eine scheinbar zufällige Verteilung erhalten, sondern muss erkennen und bestimmen können, welches ICE an welche Position beziehungsweise vor welchen Server kommt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-24: Beim Ausspielen von `New Blood` waren drei ICE installiert: ein gerezztes ICE vor Remote 1, ein unrezztes ICE vor HQ und ein unrezztes ICE vor R&D. Die UI verlangte, alle drei ICE anzuklicken; erst danach konnte bestätigt werden. Anschließend waren die ICE scheinbar automatisch beziehungsweise zufällig verteilt. Der Rez-/Unrez-Status blieb erhalten.
- Regelverdacht des Nutzers: `Rearrange your installed ice by swapping pairs of ice while Runner looks away` wird nicht als Zufallsverteilung verstanden. Erwartet ist eine bewusste Wahl der Korp, welche ICE-Paare getauscht beziehungsweise welche neue Reihenfolge gelten soll.
- Aktiver Kartentext in `data/cards/originalset-v1-cards.json`: `Conceal all revealed but unrezzed ice; then rearrange your installed ice by swapping pairs of ice while Runner looks away.`
- Engine-Resolver: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts` erzeugt für `p3_58.new_blood_reorder:*` aktuell eine `select_cards`-Choice mit `minSelections == maxSelections == Anzahl installierter ICE`. Die Auflösung interpretiert die Reihenfolge der ausgewählten Optionen als neue globale Reihenfolge über alle installierten ICE-Slots.
- Webclient-Pfad: `apps/web/app/action-board-ui.ts` erkennt `p3_58.new_blood_reorder` als geordnete Auswahl, aber die Oberfläche macht Zielslots/Serverpositionen nicht ausreichend explizit. Dadurch ist das Ergebnis für Nutzer nicht vorhersagbar.

## Scope

- Den aktuellen `New Blood`-Ablauf im Webclient reproduzieren, ideal mit drei ICE auf verschiedenen Servern und gemischtem Rez-Status.
- Klären und festhalten, ob der Engine-Vertrag als vollständige Neuordnung aller installierten ICE bestehen bleiben soll oder ob die Karte paarweise Swap-Schritte braucht.
- Eine verständliche UI für `p3_58.new_blood_reorder:*` bauen:
  - entweder explizite Zielslot-Reihenfolge mit Server-/Positionslabels,
  - oder paarweise Swap-Auswahl mit wiederholbarem Tauschen und abschließender Bestätigung.
- Sicherstellen, dass Rez-/Unrez-Status, Faceup-/Facedown-Status und Serverzuordnung deterministisch und sichtbar nachvollziehbar erhalten beziehungsweise korrekt aktualisiert werden.
- Den Runner weiterhin von verdeckten Informationen ausschließen; der Runner darf nur den öffentlichen Hidden-Zone-/Reorder-Hinweis sehen.
- Fokussierte Tests oder einen Browser-Smoke für den Drei-ICE-Fall ergänzen.

## Nicht im Scope

- Keine Änderung am korrekten ersten Effekt von `New Blood`: aufgedeckte, aber unrezzte ICE werden wieder verdeckt.
- Keine Offenlegung verdeckter ICE-Identitäten an Runner, PublicEvents, Reconnect-Payloads, KI-Inputs oder Logs.
- Keine Zufallskomponente für `New Blood`.
- Keine generische Umgestaltung aller `select_cards`-Choices, außer kleine wiederverwendbare UI-Helfer sind für diesen Fall nötig.
- Keine Änderung an anderen Reorder-Karten wie `Fortress Respecification`, außer der gleiche UI-Helfer kann ohne Verhaltensänderung wiederverwendet werden.

## Akzeptanzkriterien

- [ ] Bei drei installierten ICE auf unterschiedlichen Servern kann die Korp ausdrücklich bestimmen, welches ICE nach der Auflösung vor welchem Server und an welcher ICE-Position liegt.
- [ ] Die UI zeigt Auswahlreihenfolge, Zielslots oder Swap-Paare so klar, dass das Ergebnis vor dem Bestätigen vorhersagbar ist.
- [ ] Die Korp muss nicht blind alle ICE anklicken, ohne zu wissen, welche Slot-Zuordnung daraus entsteht.
- [ ] Rezzed/Unrezzed und verdeckt/offen bleiben nach der Neuordnung korrekt erhalten; zusätzlich werden vorher aufgedeckte unrezzte ICE verdeckt.
- [ ] Der Runner erhält keine verdeckten ICE-Identitäten und keine Zielreihenfolge, die Hidden Info leakt.
- [ ] Replay/StateHash bleiben deterministisch.
- [ ] Tests oder Browser-Smoke decken mindestens den Nutzerfall mit drei ICE, einem gerezzten ICE und zwei unrezzten ICE ab.
- [ ] Checks: passende Web-/Engine-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Startpunkte: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts`, `apps/web/app/action-board-ui.ts`, `apps/web/app/page.tsx`.
- Die aktuelle Engine nutzt `installedIceSlots(host)` als flache Slotliste über `corp.servers` und deren ICE-Indizes. Wenn eine vollständige Neuordnung beibehalten wird, muss die UI diese Zielslots explizit machen.
- Wenn die Regel als wiederholtes Paar-Tauschen umgesetzt wird, braucht die Engine vermutlich einen anderen Choice-Vertrag als `minSelections == maxSelections == alle ICE`.
- Der bestehende Test `packages/engine/src/index.test.ts` zu `conceals revealed unrezzed ICE and reorders installed ICE with New Blood` ist ein guter technischer Startpunkt, deckt aber die fehlende Bedienbarkeit nicht ab.

## Ergebnisnotiz

Noch offen.
