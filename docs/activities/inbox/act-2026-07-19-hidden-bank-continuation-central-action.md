---
activityId: act-2026-07-19-hidden-bank-continuation-central-action
status: inbox
kind: fix
area: web
priority: hotfix
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Hidden-Bank-Fortsetzung zentral und gleichrangig anzeigen

## Ziel

In einem freiwilligen Hidden-Bank-Zahlungsfenster müssen die angebotenen
Bankfähigkeiten und die Entscheidung `Ohne weiteren Bank-Support fortfahren`
gemeinsam und unmittelbar in der zentralen Aktionsliste sichtbar sein. Die
Fortsetzung darf nicht hinter der erneuten Auswahl der ursprünglich
kostenpflichtigen Karte oder eines anderen Spielobjekts verborgen werden.

## Kontext und Quellen

- Playtest-Fund mit Screenshot vom 2026-07-19: Der Runner spielte `Running
  Interference` bei 8 Credits und installierter `Swiss Bank Account`. Die
  zentrale Aktionsliste zeigte ausschließlich `Swiss Bank Account: 6 Credits
  nehmen` mit 3-Credit-Kosten. Eine sichtbare Möglichkeit, die bereits
  bezahlbare Eventzahlung ohne Bank-Support fortzusetzen, fehlte; das Fenster
  wirkte dadurch wie eine Pflichtaktivierung der Bankkarte.
- Gleichzeitig zeigte die Aktionsliste den allgemeinen Hinweis, für weitere
  Optionen eine eigene Spielkarte auszuwählen. Das belegt, dass mindestens eine
  kontextuelle Aktion aus der zentralen Liste ausgeblendet war.
- Folgefund zu
  `docs/activities/done/act-2026-07-18-hidden-bank-voluntary-payment-support.md`.
- `packages/engine/src/game/legal-actions.ts` erzeugt die ursprüngliche
  LegalAction mit dem Labelpräfix `Ohne weiteren Bank-Support fortfahren:`.
- `apps/web/app/action-board-ui.ts` behandelt nur
  `activated_card_ability` mit
  `cardImplementationAbilityTiming: runner_cost_penalty_support` ausdrücklich
  als primäre Aktion. Die fortgesetzte Originalaktion bleibt dagegen je nach
  Typ und Quelle eine kontextuelle `play_event`-, `pump_breaker`-,
  `break_subroutine`-, Installations- oder Access-Aktion.
- Bei zwei gleichen `Running Interference`-Karten im Grip ist die versteckte
  Zuordnung zusätzlich uneindeutig und für den Runner nicht als Ablehnen des
  Bank-Supports erkennbar.

## Scope

- Die von der Engine erzeugte Fortsetzungsaktion strukturiert als Entscheidung
  des aktiven Runner-Payment-Support-Fensters kennzeichnen; keine UI-Erkennung
  allein über deutschen Labeltext.
- Hidden-Bank-Aktivierungen und die zugehörige Fortsetzungsaktion im Webclient
  als primäre, gleichrangige Aktionen im selben zentralen Fenster darstellen.
- Den Fall `Running Interference` mit `Swiss Bank Account` konkret absichern.
- Zusätzlich mindestens eine Fortsetzung prüfen, deren Originalaktion sonst
  kartenkontextuell wäre, etwa Icebreaker-Pump oder Break-Subroutine.
- Labels und Kostenchips beibehalten, sodass klar ist, welche Bankfähigkeit
  Credits kostet und dass die andere Aktion ohne weiteren Bank-Support die
  ursprüngliche Zahlung fortsetzt.

## Nicht im Scope

- Keine Änderung daran, wann die Engine das freiwillige Zahlungsfenster öffnet.
- Keine automatische Aktivierung einer Bankkarte und kein automatisches
  Fortsetzen der Originalaktion.
- Kein allgemeiner Umbau der kontextuellen Kartenaktionen außerhalb des
  Runner-Payment-Support-Fensters.
- Kein UI-Redesign des Aktionsboards.
- Keine Abschwächung der LegalAction-, `applyAction`-, StateVersion-, Replay-,
  StateHash- oder Hidden-Info-Grenzen.

## Akzeptanzkriterien

- [ ] Nach `Running Interference` mit nutzbarer `Swiss Bank Account` zeigt die
  zentrale Aktionsliste gleichzeitig `Swiss Bank Account: 6 Credits nehmen`
  und `Ohne weiteren Bank-Support fortfahren: Running Interference auf …`.
- [ ] Der Runner kann die Fortsetzungsaktion ohne erneute Auswahl einer der
  gleichnamigen Karten im Grip ausführen.
- [ ] Eine Engine-seitige strukturierte Payload- oder Vertragsmarkierung bindet
  die Fortsetzungsaktion an das aktive Payment-Support-Fenster; der Webclient
  koppelt die Sichtbarkeit nicht an das deutsche Labelpräfix.
- [ ] Dieselbe zentrale Darstellung funktioniert für eine ansonsten
  kartenkontextuelle Pump- oder Break-Fortsetzung.
- [ ] Gewöhnliche `play_event`-, Pump-, Break-, Installations- und
  Access-Aktionen außerhalb eines Payment-Support-Fensters behalten ihre
  bisherige Kontextzuordnung.
- [ ] Fortsetzen bezahlt und resolvt die ursprüngliche Aktion genau einmal;
  Bankaktivierung und Fortsetzung bleiben zwei getrennte, freiwillige
  Entscheidungen.
- [ ] Web-Unit-Tests decken die Action-Aufteilung für Bankaktivierung plus
  Fortsetzung ab; der bestehende Engine-Regressionstest für die gebundene
  Originalaktion bleibt grün.
- [ ] Web-Typecheck beziehungsweise die projektnahen Checks und
  `git diff --check` sind grün.

## Umsetzungshinweise

- In `packages/engine/src/game/legal-actions.ts` beim Mapping der gebundenen
  Originalaktion eine stabile strukturierte Kennzeichnung wie
  `runnerCostPenaltySupportContinuation` sowie die Window-ID ergänzen. Die
  bestehende `actionId` und der Originalpayload müssen erhalten bleiben.
- In `apps/web/app/action-board-ui.ts` diese Kennzeichnung in
  `isContextualLegalAction` vor der allgemeinen Karten-/Objektklassifikation als
  primäre Entscheidung behandeln.
- `apps/web/app/action-board-ui.test.ts` soll mindestens eine
  `play_event`-Fortsetzung mit Kartenquelle und eine Pump-/Break-Fortsetzung mit
  Breakerquelle als primär erwarten.
- Falls die Kennzeichnung einen Shared-Typ erweitert, den kleinsten bestehenden
  `LegalAction.payload`-Vertrag nutzen; keine zweite UI-only Aktionsart
  einführen.

## Ergebnisnotiz

Noch offen.
