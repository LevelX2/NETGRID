---
activityId: act-2026-07-31-schematics-search-engine-single-hq-breach-trigger
status: inbox
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt:
completedAt:
branch:
releaseTarget: Current private playtest
blockedBy: []
resultArtifacts: []
checks: []
---

# Schematics Search Engine einmal pro HQ-Breach auslösen

## Ziel

`Schematics Search Engine` soll die verdeckten installierten Korp-Karten bei
einem HQ-Breach genau einmal gemeinsam aufdecken und genau einen
Review-Zyklus öffnen. Expose- und Abschlussmeldung bleiben innerhalb des
zugehörigen `Run auf HQ` gruppiert und werden nicht für jeden einzelnen
Access-Kandidaten wiederholt.

## Kontext und Quellen

- Nutzer-Playtest und Screenshot vom 31.07.2026: Bei einem erfolgreichen Run
  auf HQ wurde zunächst auf das im HQ-Root installierte Upgrade
  `Rio de Janeiro City Grid` und anschließend auf `Tycho Extension` aus HQ
  zugegriffen. `Schematics Search Engine` deckte dieselben vier installierten
  Korp-Karten bei beiden Einzelzugriffen erneut auf und öffnete den
  Review-Zyklus mehrfach.
- Die Abschlussmeldung
  `Du hast das Ansehen der durch Schematics Search Engine aufgedeckten
  installierten Korp-Karten beendet.` erschien außerhalb der Einrückung des
  zugehörigen `Run auf HQ`.
- Gedruckter Kartentext in `docs/source/Classicspoiler.txt`:
  `Whenever you access cards from HQ, expose all of the Corp's installed
  cards.`
- Die historische Formulierung bezeichnet den HQ-Zugriffsvorgang und nicht
  jeden darin nacheinander aufgelösten Karten-Access. Als zusätzliche
  Terminologie-Evidence verwendet `HQ Interface` historisch denselben
  Einstieg `Whenever you access cards from HQ`; sein aktueller offizieller
  Text präzisiert dies zu `Whenever you breach HQ, access 1 additional card.`
- In `docs/source/Netrunner Errata 1.70.md` ist keine abweichende
  kartenspezifische Errata oder Einzelentscheidung für
  `Schematics Search Engine` dokumentiert. Die allgemeinen Access-Rulings
  behandeln mehrere Karten innerhalb eines Zugriffs nacheinander.
- `packages/engine/src/game/access/access-breach-lifecycle.ts` ruft
  `applyHqAccessExposeInstalledCorpCards(...)` derzeit aus
  `accessCurrentCard(...)` für jeden einzelnen Access-Kandidaten auf. Dadurch
  wird der Karteneffekt an Root-Upgrade und HQ-Handkarte separat wiederholt.
- `apps/web/app/chronicleGrouping.ts` erkennt den Schematics-Abschluss-Choice
  derzeit nicht als Run-Kontext. Deshalb fällt die Abschlussmeldung trotz
  laufendem HQ-Zugriff in die allgemeine Runner-Zuggruppe zurück.
- Verwandter erledigter Darstellungs-/Expose-Schnitt:
  `docs/activities/done/act-2026-07-17-ice-and-data-expose-feedback.md`.
  Da der neue Timing- und Gruppierungsfehler nach dessen Abschluss besteht,
  ist dieses Paket ein eigenständiges Follow-up.

## Scope

- Den Effekt von `Schematics Search Engine` an den einmaligen Beginn des
  autoritativen HQ-Breaches beziehungsweise des dazugehörigen
  HQ-Zugriffsvorgangs binden, bevor die einzelnen Access-Kandidaten
  nacheinander aufgelöst werden.
- Pro HQ-Breach mit mindestens einer aktiven `Schematics Search Engine`
  höchstens einen Expose-/Review-Zyklus erzeugen, unabhängig davon, ob zuerst
  ein HQ-Root-Upgrade oder eine zufällige HQ-Handkarte accesset wird.
- Alle zu diesem Zeitpunkt verdeckten installierten Korp-Karten wie bisher
  gemeinsam für den Review sichtbar machen. Bereits gerezzte oder aus einem
  anderen gültigen Grund offene Karten benötigen keine erneute Aufdeckung.
- Nach `Ansehen beenden` den bestehenden autoritativen Breach- und
  Access-Ablauf mit der aktuellen Queue-Position und ausschließlich neu
  bestätigten `LegalActions` fortsetzen.
- Spätere Karten desselben Breaches dürfen weder dieselbe installierte
  Kartenmenge erneut exposen noch einen weiteren Schematics-Review öffnen.
- PublicEvent und Chronik so ausrichten, dass pro HQ-Breach genau eine
  Schematics-Expose-Meldung und genau eine Abschlussmeldung entstehen. Die
  Meldungen dürfen nicht irreführend so formuliert sein, als hätte die gerade
  einzeln accessete Karte den erneuten Expose ausgelöst.
- Expose- und Abschlussmeldung im Webclient innerhalb derselben konkreten
  `Run auf HQ`-Gruppe einrücken. Der Abschluss-Choice muss dafür ausdrücklich
  als Run-Kontext erkannt werden, auch wenn er nach dem letzten
  Access-Kandidaten aufgelöst wird.
- Fokussierte Engine-, PlayerView-, PublicEvent-, Chronik-, Replay- und
  StateHash-Regressionen für Single- und Multiaccess ergänzen.

## Nicht im Scope

- Keine Änderung des gedruckten Kartentexts, der Menge der aufzudeckenden
  installierten Korp-Karten oder der Bedeutung von `expose`.
- Kein allgemeiner Umbau aller Breach-, Access-, Review- oder
  Hidden-Zone-Choices.
- Keine Änderung an Anzahl, Auswahl oder Reihenfolge der HQ- und
  HQ-Root-Access-Kandidaten, an Trash-/Steal-Entscheidungen oder am normalen
  Run-Ende.
- Keine neue clientseitige Regelautorität und keine automatische
  Action-Einreichung ohne aktuelle `actionId` und `stateVersion`.
- Keine kartennamenspezifische Sonderbehandlung der Chronik außerhalb des
  eng gebundenen Schematics-Eventvertrags.
- Keine Offenlegung von HQ-Inhalt, noch nicht accesseten HQ-Handkarten oder
  anderen verdeckten Zonen in PlayerViews, PublicEvents, WebSocket-/Reconnect-
  Payloads, Replays, Logs oder Client-Fehlern.
- Keine Neubewertung mehrerer gleichzeitig installierter Kopien von
  `Schematics Search Engine`, sofern der bestehende Kartenvertrag für den
  gemeldeten Ein-Kopien-Fall dadurch nicht berührt wird. Ein dabei entdeckter
  eigenständiger Stapelungsfehler erhält ein separates Folgepaket.

## Akzeptanzkriterien

- [ ] Ein HQ-Breach mit `Schematics Search Engine`, einem installierten
      HQ-Root-Upgrade und mindestens einer HQ-Handkarte erzeugt genau einen
      Schematics-Expose-Event und genau einen Review-Choice.
- [ ] Root-zuerst und HQ-Handkarte-zuerst führen zum selben einmaligen
      Ergebnis; die Reihenfolge der Access-Kandidaten ändert die
      Triggeranzahl nicht.
- [ ] Nach `Ansehen beenden` wird der nächste autoritative Access-Kandidat
      normal fortgesetzt, ohne dass Schematics erneut auslöst.
- [ ] Auch bei mehreren HQ-Handkarten beziehungsweise zusätzlichem
      Multiaccess bleibt es bei einem Schematics-Review pro Breach.
- [ ] Ein Nicht-HQ-Breach und ein HQ-Breach ohne aktive
      `Schematics Search Engine` erzeugen keinen Schematics-Expose- oder
      Review-Event.
- [ ] Die Runner-PlayerView zeigt während des einen Review-Zyklus genau die
      regelgerecht exposed installierten Korp-Karten; nach dem Abschluss gilt
      wieder der bestehende Sichtbarkeitsvertrag.
- [ ] Chronik und UI zeigen pro HQ-Breach genau eine Expose-Meldung und eine
      Abschlussmeldung, beide eingerückt unter derselben konkreten
      `Run auf HQ`-Gruppe. Es entsteht kein doppelter oder außerhalb des Runs
      stehender Abschluss-Eintrag.
- [ ] Der öffentliche Eventkontext enthält nur die bereits durch den Effekt
      öffentlich exposed Karten und erforderliche Run-/Breach-Metadaten. HQ,
      private Payloads und noch nicht accessete Karten bleiben ausgeschlossen.
- [ ] Falsche Side, stale `actionId`/`stateVersion` und eine nicht zur
      aktuellen PendingChoice oder Breach-Queue gehörende Action werden
      weiterhin von `applyAction` abgelehnt.
- [ ] Replay und StateHash bleiben für den einmaligen Trigger, den Review-
      Abschluss und die anschließende Multiaccess-Fortsetzung deterministisch.
- [ ] Fokussierte Engine- und Webtests, die betroffenen Package-Typechecks,
      `corepack pnpm format:changed` und `git diff --check` sind erfolgreich.

## Umsetzungshinweise

- Primärer Folgeagent ist `card-enablement-ai-knowledge-agent`, weil der
  Schnitt Kartenregel, Engine-Timing, Hidden-Info-Projektion und Chronik
  gemeinsam absichern muss.
- Ausgangspunkte sind
  `packages/engine/src/game/access/access-breach-lifecycle.ts`, der
  Breach-Start-/Queue-Vertrag, die Schematics-Choice-Auflösung in
  `packages/engine/src/game/engine-runtime-internal/corp-zone-runtime-hosts.ts`,
  `apps/web/app/chronicleGrouping.ts` und `apps/web/app/chronicle.ts`.
- Nicht lediglich einen Boolean um den zweiten UI-Eintrag legen. Die Engine
  muss den Effekt genau einmal am fachlich richtigen HQ-Breach-Timing
  autoritativ auslösen; Chronik und UI konsumieren anschließend diesen
  Eventvertrag.
- Der Review darf den Breach nicht unbemerkt abschließen oder eine zweite
  Timingautorität erzeugen. Nach seiner Auflösung wird nur die durch den
  aktuellen Engine-State angebotene Fortsetzung verwendet.
- Bestehende Instanz-IDs für den kurzzeitigen Board-Cue dürfen ausschließlich
  aus der bereits exposed Kartenmenge stammen und nicht zur allgemeinen
  Hidden-Info-Projektion ausgeweitet werden.

## Ergebnisnotiz

Noch offen.
