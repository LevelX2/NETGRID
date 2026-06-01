---
activityId: act-2026-06-01-mystery-box-corp-review-gate
status: inbox
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-01
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-22-hidden-zone-search-card-image-choices
  - act-2026-05-24-private-look-readonly-card-display
resultArtifacts: []
checks: []
---

# Mystery Box: Korp sieht Top-5-Reveal vor Programmauswahl

## Ziel

`Mystery Box` soll beim Einsatz während eines Runs die obersten bis zu fünf Stack-Karten für die Korp sichtbar und bestätigbar machen, bevor der Runner oder die Runner-KI ein Programm daraus installiert.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-01: In einem Spiel als Korp gegen Runner-KI lag `Mystery Box` installiert und wurde während eines Runs auf Research and Development genutzt. Der Korp-Spieler bekam die fünf obersten Stack-Karten nicht sichtbar angezeigt oder die Anzeige verschwand zu schnell, bevor die Runner-KI ein Programm auswählte und installierte.
- Erwartung aus lokalem Kartentext in `packages/engine/src/card-implementations/onr-v1/runner/programs/mystery-box.ts`: `[0]: Show the top five cards of your stack to the Corp. If any of those cards are programs, trash Mystery Box and then install one of those programs, at no cost. Shuffle your stack afterwards. Use this ability only during a run and only once each run.`
- Aktueller Engine-Anker: `startLookTopStackShowToCorpThenInstallMatchingActivation(...)` erzeugt bei gefundenen Programmen eine öffentliche Runner-Choice mit `hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching"` und `revealedCardDefinitionIds`/`shownCardDefinitionIds`; bei keinem installierbaren Programm wird ohne Runner-Choice direkt geshuffelt.
- Verwandte erledigte UI-Pakete: `act-2026-05-22-hidden-zone-search-card-image-choices` für lesbare Hidden-Zone-Choices und `act-2026-05-24-private-look-readonly-card-display` für reine Anzeige-/Bestätigungsfenster.

## Scope

- Den aktuellen Mystery-Box-Ablauf in Human-Korp-vs-Runner-KI reproduzieren: Aktivierung während eines Runs auf R&D, Top-5-Reveal, Runner-Programmauswahl, Installation und Stack-Shuffle.
- Sicherstellen, dass die Korp die gezeigten Top-5-Karten in einem lesbaren Review-/Bestätigungsfenster sieht.
- Der Korp muss die Anzeige aktiv schließen oder bestätigen können, bevor der Runner beziehungsweise die Runner-KI die Programmauswahl auflöst.
- Falls die Korp von einer KI gesteuert wird, darf diese Bestätigung deterministisch automatisch erfolgen; ein menschlicher Korp-Spieler darf nicht übersprungen werden.
- Den No-Program-Fall absichern: Die Korp sieht ebenfalls die gezeigten bis zu fünf Karten und einen klaren Hinweis, dass kein Programm installiert wurde; der anschließende Shuffle wird entsprechend aktuellem lokalen Kartentext/Runtime-Vertrag angezeigt.
- Die bestehende LegalAction-/Choice-Revalidierung für Runner-Auswahl, Quelle, Timing, Stack-Spitze und StateVersion beibehalten.

## Nicht im Scope

- Keine Änderung daran, dass `Mystery Box` nur während eines Runs und nur einmal pro Run nutzbar ist.
- Keine Freischaltung zusätzlicher Karten, keine neue Suchmechanik und kein Redesign generischer Choice-UI.
- Keine Offenlegung nicht gezeigter Stack-Karten, anderer Hidden-Zone-Inhalte oder FullState-Daten.
- Keine Änderung an Replay, StateHash oder RandomDrawRecords außer notwendigen, deterministischen Events für ein explizites Korp-Review.
- Keine allgemeine Policy für alle `show_to_corp`-Effekte, sofern der Mystery-Box-Fix keine wiederverwendbare kleine Hilfsfunktion erzwingt.

## Akzeptanzkriterien

- [ ] In Human-Korp-vs-Runner-KI bleibt der Mystery-Box-Top-5-Reveal sichtbar, bis die Korp ihn bestätigt oder schließt.
- [ ] Die Runner-KI installiert kein Programm aus den gezeigten Karten, bevor die menschliche Korp den Reveal gesehen und bestätigt hat.
- [ ] Die Anzeige nennt Quelle (`Mystery Box`), Zone (`Stack`), Anzahl der gezeigten Karten und alle gezeigten Kartennamen/Kartenansichten side-sicher.
- [ ] Bei gefundenem Programm wählt der Runner weiterhin genau ein legal installierbares Programm aus den gezeigten Karten; `applyAction` revalidiert Stack-Spitze, Quelle, Timing und Ziel.
- [ ] Bei keinem installierbaren Programm gibt es eine sichtbare Korp-Review mit No-Program-Hinweis und anschließendem Shuffle-Hinweis.
- [ ] Hidden-Info-Grenzen bleiben gewahrt: nur die durch `Mystery Box` regelgemäß gezeigten Stack-Karten werden öffentlich, keine weiteren Stack-/Grip-/Heap-Informationen.
- [ ] Replay und StateHash bleiben deterministisch; zusätzliche Review-/Ack-Schritte verändern keine verdeckte Zufalls- oder Kartenreihenfolge außerhalb des dokumentierten Shuffles.
- [ ] Fokussierte Engine-/Server-/Web-Regressionen decken Human-Korp-vs-Runner-KI mit Programmfund und No-Program-Fall ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/engine/src/game/hidden-zone/search-choice-activations.ts`
  - `packages/engine/src/game/hidden-zone/search-choice-handlers.ts`
  - `packages/engine/src/public-context.ts`
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/page.tsx`
- Der aktuelle öffentliche Runner-Choice-Vertrag reicht möglicherweise nicht aus, weil die Runner-KI die Choice sofort auflösen kann. Für menschliche Korp braucht es wahrscheinlich ein vorgeschaltetes oder persistentes Korp-Review/Ack-Fenster.
- Bestehende Read-only-Kartenanzeige aus `act-2026-05-24-private-look-readonly-card-display` als UI-Muster prüfen, aber nicht blind auf gegnerische Hidden-Zone-Reveals übertragen.
- Bei einem neuen Ack-Event auf klare Redaction achten: `shownCardDefinitionIds`/`revealedCardDefinitionIds` sind hier regelgemäß öffentlich, aber nicht ausgewählte Stack-Restkarten bleiben weiterhin verborgen.

## Ergebnisnotiz

Noch offen.
