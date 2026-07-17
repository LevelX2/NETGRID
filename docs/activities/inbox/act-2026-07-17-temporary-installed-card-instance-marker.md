---
activityId: act-2026-07-17-temporary-installed-card-instance-marker
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Temporäre Karten markieren und gleichnamige Run-Aktionen zuordnen

## Ziel

Wenn mehrere gleichnamige Karteninstanzen im Run dieselbe Aktion anbieten,
zeigt jede Aktion ihre konkrete Quelle verständlich an. Der Nutzer muss vor
dem Auslösen von `Stärke +1`, `Subroutine brechen` oder vergleichbaren
Aktionen erkennen können, welches Exemplar verwendet wird. Zusätzlich zeigt
die temporär installierte Karte direkt im Rig, durch welchen Effekt sie ins
Spiel kam und welcher spätere Lifecycle-Effekt für sie vorgemerkt ist.

## Kontext und Quellen

- Playtest-Fund vom 17.07.2026: Ein Rent-I-Con war bereits installiert. Ein
  zweites Exemplar wurde mit `Sneak Preview` aus dem Stack installiert und
  damit für die Rückkehr in den Grip am Runner-Zugende vorgemerkt. Bei zwei
  Karten war die Zuordnung im Rig anhand ihrer Position noch verständlich.
  Mehrdeutig waren die doppelten Aktionen im Run-Fenster, zum Beispiel zweimal
  `Rent-I-Con +1 Stärke` oder zweimal `Rent-I-Con: Subroutine brechen`.
- Das ist spielentscheidend: Nur die konkret zum Brechen verwendete
  Rent-I-Con-Instanz wird am Run-Ende getrasht. Das mit `Sneak Preview`
  installierte Exemplar kehrt nur dann am Zugende in den Grip zurück, wenn
  genau diese Instanz noch installiert ist.
- Die Karten- und Aktionsreihenfolge ist zwar deterministisch: Installationen
  werden in `state.runner.rig.programs` angehängt
  (`packages/engine/src/game/install/runner-rig-install-finalization.ts`), die
  PlayerView-Projektion übernimmt diese Reihenfolge
  (`packages/engine/src/game/view/player-view-projection.ts`) und die
  Rig-Gruppierung sortiert die Karten nicht neu
  (`apps/web/app/action-board-ui.ts`). Auch die Engine erzeugt
  Breaker-Aktionen in dieser Reihenfolge. Im beschriebenen Ablauf gehört die
  erste gleichnamige Aktion damit zum linken, früher installierten Exemplar
  und die zweite zum rechten, später installierten Sneak-Preview-Exemplar.
  Diese Zuordnung ist im Run-Fenster jedoch nicht sichtbar.
- Die LegalActions sind bereits korrekt instanzgebunden: Breaker-Actions
  tragen `payload.breakerId`, `action.source` und
  `abilityRef.sourceCardInstanceId`. Der Fehler liegt in der Darstellung,
  nicht in der Engine-Auswahl.
- `runWindowActionButtonLabel` in `apps/web/app/action-board-ui.ts` verdichtet
  Breaker-Aktionen nur auf Kartentitel und Aktion. Zwei gleichnamige Quellen
  erhalten dadurch identische sichtbare Texte.
- `OverflowAwareActionButton` in
  `apps/web/features/actions/ActionControls.tsx` zeigt seinen Tooltip nur bei
  abgeschnittenem Text. Ein Tooltip allein ist daher ohne gezielte Erweiterung
  keine verlässliche Quellenanzeige und wäre auf Touch-Geräten zusätzlich
  schlecht zugänglich.
- Nutzerpräzisierung vom 17.07.2026: Zusätzlich zur eindeutigen Quellenangabe
  in der Run-Aktionsliste soll die konkret per `Sneak Preview` installierte
  Programmkarte im Rig einen kleinen sichtbaren Marker tragen, etwa
  `Sneak Preview · am Zugende zurück in den Grip`.
- Zweite Nutzerpräzisierung vom 17.07.2026: Eine reine Benennung mit
  `links`/`rechts` skaliert nicht auf drei oder mehr gleichnamige Exemplare.
  Karten und Aktionen benötigen deshalb einen gemeinsamen, beliebig
  fortsetzbaren Instanzmarker.

## Scope

- Gleichnamige, gleichzeitig angebotene Breaker-Aktionen im Run-Fenster mit
  einer sichtbaren, kompakten Quellenangabe unterscheiden.
- Für mehrfach vorhandene gleichnamige Karten einen gemeinsamen sichtbaren
  Instanzmarker vergeben, zum Beispiel `#1`, `#2`, `#3`. Derselbe Marker muss auf
  der konkreten Karte im Rig und auf jeder von ihr stammenden Run-Aktion
  erscheinen, etwa `Rent-I-Con #2 +1 Stärke` und
  `Rent-I-Con #2: Subroutine brechen`.
- Die Markerzuordnung an der tatsächlichen `breakerId` beziehungsweise
  `card.instanceId` und der sichtbaren Rig-Reihenfolge ausrichten. Sie darf
  weder auf der bloßen Reihenfolge der Aktionsbuttons beruhen noch rohe
  Instanz-IDs anzeigen.
- Den Zusatz nur einblenden, wenn der Kartentitel im sichtbaren Rig mehrfach
  vorkommt; ein einzelner Icebreaker behält das bisherige kompakte Label.
- Die Lösung für drei und mehr Exemplare sowie für responsive Layouts
  funktionsfähig halten; Richtungswörter wie `links` und `rechts` sind kein
  primärer Identifikator.
- Pump- und Break-Aktionen konsistent behandeln, einschließlich nummerierter
  Subroutinen und mehrerer Break-Optionen desselben Exemplars.
- Den vollständigen, eindeutig zugeordneten Text auch als zugänglichen Namen
  und verlässlichen Tooltip beziehungsweise Detailhinweis anbieten. Die
  Information darf nicht ausschließlich von Hover oder Textüberlauf
  abhängen.
- Sicherstellen, dass jede dargestellte Aktion weiterhin genau die bereits in
  der LegalAction gebundene Karteninstanz auslöst.
- Auf der konkret per `Sneak Preview` installierten Programmkarte einen
  kompakten Lifecycle-Marker anzeigen, der sowohl die Quelle als auch die
  Folge verständlich benennt, zum Beispiel `Sneak Preview` mit dem Detailtext
  `Am Runner-Zugende zurück in den Grip, falls noch installiert`.
- Den Kartenmarker aus einer expliziten, side-sicheren PlayerView-Information
  für genau die in `temporaryProgramInstallReturns` verfolgte Instanz
  ableiten. Keine Ableitung aus Kartentitel, Rig-Position oder einer
  Webclient-Regelheuristik.
- Den Marker im bestehenden Badge-/Marker-System von `CardView` darstellen
  und denselben Lifecycle-Hinweis bei der zugehörigen Run-Aktion bevorzugt als
  zusätzlichen Quellenhinweis nutzen. Im Beispiel trägt die temporäre Karte
  etwa den Instanzmarker `#2` plus den Lifecycle-Marker `Sneak Preview`; ihre
  Aktion verwendet ebenfalls `Rent-I-Con #2` und kann im Detailtext die
  Sneak-Preview-Rückgabe nennen.
- Nach Rückgabe, Trash oder anderem Verlassen des Spiels darf der Marker nicht
  auf einem gleichnamigen anderen Exemplar verbleiben oder dorthin wandern.
- Eine Web-Regression für drei gleichzeitig installierte Rent-I-Con mit
  unterschiedlichen Instanz-IDs und jeweils gleichen Pump-/Break-Aktionen
  sowie eine PlayerView-/Web-Regression für den Lifecycle-Marker aufnehmen.

## Nicht im Scope

- Keine Änderung an der Regelwirkung von `Sneak Preview` oder `Rent-I-Con`.
- Keine Sortierung der Karten oder Aktionen nach rohen Instanz-IDs.
- Keine Anzeige technischer `CardInstanceId`-Werte im normalen UI.
- Kein allgemeines Redesign von Rig, Kartenansicht oder Run-Fenster.
- Kein allgemeines Lifecycle-Marker-System für alle denkbaren Kartenregeln;
  nur der kleinste generische Vertrag für bereits engine-seitig verfolgte
  temporäre Installations-/Rückgabeinformationen.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder
  StateHash-Verträgen.

## Akzeptanzkriterien

- [ ] Zwei gleichnamige Rent-I-Con erzeugen im Run-Fenster keine visuell
  identischen Pump- oder Break-Aktionsbuttons mehr.
- [ ] Bei zwei, drei oder mehr gleichnamigen Exemplaren trägt jede Karte einen
  eindeutigen kompakten Instanzmarker und jede ihrer Aktionen exakt denselben
  Marker.
- [ ] Die Zuordnung bleibt ohne Richtungsbegriffe wie `links` oder `rechts`
  verständlich und funktioniert auch in einem umgebrochenen oder mobilen
  Layout.
- [ ] Der Nutzer kann vor dem Auslösen erkennen, ob er das dauerhaft oder das
  per Sneak Preview installierte Rent-I-Con verwendet.
- [ ] Die per Sneak Preview installierte konkrete Programmkarte trägt im Rig
  einen kleinen sichtbaren Marker, der Quelle und Rückkehr am Runner-Zugende
  verständlich erklärt.
- [ ] Nur die tatsächlich in `temporaryProgramInstallReturns` gebundene
  Karteninstanz erhält den Marker; gleichnamige andere Exemplare bleiben
  unmarkiert.
- [ ] Verlässt die temporäre Instanz vorzeitig das Rig oder kehrt sie am
  Zugende in den Grip zurück, verschwindet der Marker mit genau dieser
  Instanz.
- [ ] Sichtbarer Text, zugänglicher Name und Tooltip/Detailhinweis benennen
  dieselbe Quelleninstanz; die Zuordnung funktioniert auch ohne Hover.
- [ ] Bei nur einem Exemplar bleiben die bisherigen kurzen Run-Labels
  unverändert.
- [ ] Die dargestellte Zuordnung wird aus `breakerId` und PlayerView/Rig
  abgeleitet; rohe Instanz-IDs werden nicht angezeigt.
- [ ] Die Rules Engine bleibt die einzige Autorität für LegalAction,
  Rent-I-Con-Run-End-Trash und Sneak-Preview-Rückgabe.
- [ ] PlayerView-, PublicEvent-, Reconnect-, Replay- und WebSocket-Grenzen
  leaken keine verdeckten Karteninformationen.
- [ ] Web-Tests decken gleiche Pump- und Break-Aktionen von drei Exemplaren,
  ein einzelnes Exemplar sowie Tastatur-/Tooltip-Texte ab.

## Umsetzungshinweise

- Bevorzugter Folgeagent: `small-adjustments-agent`.
- Vorhandene Instanzbindung nutzen: Breaker-Actions tragen bereits
  `payload.breakerId` und `abilityRef.sourceCardInstanceId`; der Webclient
  bindet kartennahe Aktionen über `card.instanceId`.
- Der kleinste bevorzugte Schnitt liegt in der generischen Darstellung von
  Breaker-Aktionen über `runWindowActionButtonLabel` beziehungsweise einen
  listenbewussten Disambiguierungshelfer im `RunTimelineOverlay`.
- `runnerRigForView(view)` stellt bereits die sichtbaren Rig-Karten in
  Reihenfolge bereit. Daraus kann für jede Gruppe gleicher Kartentitel eine
  gemeinsame Anzeigezuordnung `instanceId -> #1/#2/#3/...` gebildet und sowohl
  von `CardView` als auch vom Run-Aktionslabel verwendet werden. Nur der
  zusätzliche Lifecycle-Marker benötigt voraussichtlich eine kleine
  side-sichere PlayerView-Projektion.
- Die Lösung generisch für mehrfach vorhandene gleichnamige Aktionsquellen
  bauen; keine Sonderlogik nur für den Titel `Rent-I-Con` oder die Karte
  `Sneak Preview` einführen.
- Für die Kartenmarkierung bevorzugt einen kleinen semantischen
  Lifecycle-Hinweis an `VisibleCard` projizieren und im vorhandenen
  Badge-/Marker-System von `CardView` rendern. Die Rules Engine bleibt die
  Autorität dafür, welche Instanz temporär zurückkehren soll.
- Falls ein Tooltip verwendet wird, `OverflowAwareActionButton` gezielt um
  einen expliziten Detailtext erweitern oder den eindeutigen Text immer als
  `aria-label` setzen; nicht vom bestehenden Overflow-Automatismus abhängig
  machen.

## Ergebnisnotiz

Noch offen.
