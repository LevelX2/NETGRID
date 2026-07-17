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

# Gleichnamige Run-Aktionen ihrer Karteninstanz zuordnen

## Ziel

Wenn mehrere gleichnamige Karteninstanzen im Run dieselbe Aktion anbieten,
zeigt jede Aktion ihre konkrete Quelle verständlich an. Der Nutzer muss vor
dem Auslösen von `Stärke +1`, `Subroutine brechen` oder vergleichbaren
Aktionen erkennen können, welches Exemplar verwendet wird.

## Kontext und Quellen

- Playtest-Fund vom 17.07.2026: Ein Rent-I-Con war bereits installiert. Ein
  zweites Exemplar wurde mit `Sneak Preview` aus dem Stack installiert und
  damit für die Rückkehr in den Grip am Runner-Zugende vorgemerkt. Im Rig war
  die Zuordnung anhand der Installationsreihenfolge von links nach rechts
  bereits verständlich. Mehrdeutig waren die doppelten Aktionen im
  Run-Fenster, zum Beispiel zweimal `Rent-I-Con +1 Stärke` oder zweimal
  `Rent-I-Con: Subroutine brechen`.
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

## Scope

- Gleichnamige, gleichzeitig angebotene Breaker-Aktionen im Run-Fenster mit
  einer sichtbaren, kompakten Quellenangabe unterscheiden.
- Die Quellenangabe an der tatsächlichen `breakerId` der LegalAction und der
  sichtbaren Rig-Reihenfolge ausrichten. Geeignete Texte sind zum Beispiel
  `Rent-I-Con (links) +1 Stärke` und `Rent-I-Con (rechts) +1 Stärke` oder bei
  mehr als zwei Exemplaren `Rent-I-Con (1. von links)` und
  `Rent-I-Con (2. von links)`.
- Den Zusatz nur einblenden, wenn der Kartentitel im sichtbaren Rig mehrfach
  vorkommt; ein einzelner Icebreaker behält das bisherige kompakte Label.
- Pump- und Break-Aktionen konsistent behandeln, einschließlich nummerierter
  Subroutinen und mehrerer Break-Optionen desselben Exemplars.
- Den vollständigen, eindeutig zugeordneten Text auch als zugänglichen Namen
  und verlässlichen Tooltip beziehungsweise Detailhinweis anbieten. Die
  Information darf nicht ausschließlich von Hover oder Textüberlauf
  abhängen.
- Sicherstellen, dass jede dargestellte Aktion weiterhin genau die bereits in
  der LegalAction gebundene Karteninstanz auslöst.
- Eine Web-Regression für zwei gleichzeitig installierte Rent-I-Con mit
  unterschiedlichen Instanz-IDs und jeweils gleichen Pump-/Break-Aktionen
  aufnehmen.

## Nicht im Scope

- Keine Änderung an der Regelwirkung von `Sneak Preview` oder `Rent-I-Con`.
- Keine zusätzliche Markierung der Karten im Rig; dort ist die bestehende
  Links-nach-rechts-Reihenfolge für diesen Befund ausreichend.
- Keine Sortierung der Karten oder Aktionen nach rohen Instanz-IDs.
- Keine Anzeige technischer `CardInstanceId`-Werte im normalen UI.
- Kein allgemeines Redesign von Rig, Kartenansicht oder Run-Fenster.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder
  StateHash-Verträgen.

## Akzeptanzkriterien

- [ ] Zwei gleichnamige Rent-I-Con erzeugen im Run-Fenster keine visuell
  identischen Pump- oder Break-Aktionsbuttons mehr.
- [ ] Jede doppelte Aktion zeigt verständlich, ob sie zum linken, rechten oder
  entsprechend nummerierten Exemplar im sichtbaren Rig gehört.
- [ ] Der Nutzer kann vor dem Auslösen erkennen, ob er das dauerhaft oder das
  per Sneak Preview installierte Rent-I-Con verwendet.
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
- [ ] Web-Tests decken doppelte Pump- und Break-Aktionen, ein einzelnes
  Exemplar sowie Tastatur-/Tooltip-Texte ab.

## Umsetzungshinweise

- Bevorzugter Folgeagent: `small-adjustments-agent`.
- Vorhandene Instanzbindung nutzen: Breaker-Actions tragen bereits
  `payload.breakerId` und `abilityRef.sourceCardInstanceId`; der Webclient
  bindet kartennahe Aktionen über `card.instanceId`.
- Der kleinste bevorzugte Schnitt liegt in der generischen Darstellung von
  Breaker-Aktionen über `runWindowActionButtonLabel` beziehungsweise einen
  listenbewussten Disambiguierungshelfer im `RunTimelineOverlay`.
- `runnerRigForView(view)` stellt bereits die sichtbaren Rig-Karten in
  Reihenfolge bereit. Die Position der konkreten `breakerId` kann daraus ohne
  Engine- oder PlayerView-Vertragsänderung bestimmt werden.
- Die Lösung generisch für mehrfach vorhandene gleichnamige Aktionsquellen
  bauen; keine Sonderlogik nur für den Titel `Rent-I-Con` oder die Karte
  `Sneak Preview` einführen.
- Falls ein Tooltip verwendet wird, `OverflowAwareActionButton` gezielt um
  einen expliziten Detailtext erweitern oder den eindeutigen Text immer als
  `aria-label` setzen; nicht vom bestehenden Overflow-Automatismus abhängig
  machen.

## Ergebnisnotiz

Noch offen.
