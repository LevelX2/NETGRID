---
activityId: act-2026-08-16-runner-mu-install-trash-chronicle-outcome
status: inbox
kind: fix
area: engine
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# MU-bedingten Programmtrash mit Installation in der Chronik verbinden

## Ziel

Wenn der Runner für eine Programminstallation zuerst belegte MU durch
Programmtrash freimacht, zeigt die Spielchronik den vollständigen öffentlichen
Ausgang als zusammengehörigen Vorgang: welches Programm installiert und
welches bereits installierte Programm dafür getrasht wurde. Ein vorgeschalteter
Choice-Schritt darf nicht als bereits abgeschlossene Installation erscheinen.

## Kontext und Quellen

- Nutzerfund und Screenshot vom 2026-08-16 aus dem aktiven Match
  `match_cf9dbaa7d5d2d3c4`, Runner-Zug 18.
- Der konkrete Vorgang ist in den lokal gespeicherten Events eindeutig:
  - Event 162 öffnet über die Legal Action
    `runner.install_card...runner_program_trash_before_install` die
    MU-Freimachung für **Loony Goon**. Die öffentliche Chronik zeigt diesen
    vorgeschalteten Schritt bereits als „Die Runner-KI hat Loony Goon im Rig
    installiert.“
  - Event 163 löst die Auswahl auf, installiert **Loony Goon**, trasht eine
    von zwei installierten **Invisibility**-Kopien und endet bei MU `4/4`.
    Deshalb bleibt im Screenshot noch eine Invisibility im Rig.
- Die private, engine-seitig validierte Legal Action von Event 163 enthält
  `runnerProgramTrashBeforeInstallResolved: true`,
  `sourceDefinitionId: onr_v1_040_loony-goon`,
  `trashedCardDefinitionIds: onr_v1_035_invisibility`, `installed: true`,
  `memoryUsedAfter: 4` und `memoryLimitAfter: 4`.
- Das persistierte öffentliche Event behält installierte Quelle, Trashziel,
  Trashanzahl und Installationsausgang, verliert aber insbesondere den
  semantischen Vorgangsmarker sowie `memoryUsedAfter` und `memoryLimitAfter`.
  Der Choice-Ausgang fällt dadurch auf die generische Chronikbehandlung zurück
  und wird als nicht aussagekräftige Entscheidung ausgeblendet oder
  dargestellt.
- `apps/web/app/chronicle.ts` besitzt bereits eine gewünschte kombinierte
  Formatierung für `runnerProgramTrashBeforeInstall` beziehungsweise
  `runnerProgramTrashBeforeInstallResolved`.
- `apps/web/app/chronicle.test.ts` prüft diese Formatierung nur mit einem
  synthetisch vollständig bestückten Event. Der reale Pfad durch
  `packages/engine/src/public-context.ts`, Eventbau, Persistenz und öffentliche
  Projektion ist damit nicht abgesichert.
- `packages/engine/src/game/events/build-event.ts` entfernt
  Ausführungsdiscriminatoren bewusst aus dem öffentlichen Vertrag; Chronik,
  Replay und KI sollen stattdessen kanonische öffentliche Ability-/Effect-
  Semantik konsumieren.

## Scope

- Den zweistufigen Pfad „Programminstallation mit vorherigem MU-Trash“ vom
  initialen `install_card` bis zum abschließenden `resolve_choice` verfolgen.
- Die Ursache in der öffentlichen Engine-Ereignisprojektion beheben: Der
  side-sichere Ausgang muss einen kanonischen öffentlichen semantischen Marker
  sowie die für die Chronik benötigten öffentlichen Ergebnisfelder enthalten.
  Die Lösung soll den normalisierten Ability-/Effect-Vertrag verwenden und
  keinen privaten Executor-Discriminator als neuen öffentlichen
  Dauervertrag etablieren.
- Die Chronik an den normalisierten öffentlichen Vertrag binden und nach
  abgeschlossener Auswahl einen klaren Satz ausgeben, sinngemäß:
  „Die Runner-KI hat Loony Goon im Rig installiert und dafür Invisibility
  getrasht, um MU freizumachen.“ Optional darf der öffentliche MU-Endstand
  `4/4` ergänzend erscheinen.
- Den vorgeschalteten Event korrekt behandeln: Solange die MU-Auswahl noch
  offen ist, darf die Chronik nicht behaupten, die Installation sei bereits
  abgeschlossen. Entweder wird der Zwischenstand passend als ausstehende
  MU-Freimachung beschrieben oder zugunsten des späteren Ergebniseintrags
  nicht als eigene abgeschlossene Installation gezeigt.
- Fokussierte Regressionen für die reale öffentliche Projektion und die
  Chronikformatierung ergänzen. Die Tests sollen eine Legal Action durch den
  produktiven Eventbau beziehungsweise eine daraus stammende öffentliche
  Payload führen und dürfen nicht ausschließlich ein bereits ideales
  Web-Testobjekt von Hand konstruieren.
- Live-Chronik, Reconnect und Replay über denselben öffentlichen Eventvertrag
  konsistent halten.

## Nicht im Scope

- Änderung der Runner-KI-Entscheidung, welches Programm installiert oder
  getrasht wird.
- Änderung von MU-Regeln, Installationskosten, Legal Actions, Choice-
  Ownership, `applyAction`, Replay-Determinismus oder StateHash.
- Offenlegung der Grip-, Stack- oder vollständigen Choice-Kandidaten. Nur das
  öffentlich installierte Programm, tatsächlich getrashte bereits installierte
  Programme und side-sichere Ergebniswerte dürfen projiziert werden.
- Parsing von `actionId`, Choice-ID, Labels oder Freitext als fachlicher
  Ersatz für fehlende strukturierte Semantik.
- Allgemeines Redesign oder Neu-Gruppieren der Spielchronik.

## Akzeptanzkriterien

- [ ] Der reproduzierte Loony-Goon-/Invisibility-Pfad erzeugt nach der
  Choice-Auflösung einen sichtbaren Chronikeintrag, der beide Kartennamen und
  den MU-bedingten Zusammenhang nennt.
- [ ] Vor Auflösung der MU-Auswahl behauptet kein Chronikeintrag, Loony Goon
  sei bereits abschließend installiert worden.
- [ ] Der abschließende Eintrag wird aus einem real projizierten öffentlichen
  Event erzeugt; die benötigte Semantik ist in Live-Ansicht, Reconnect und
  Replay identisch verfügbar.
- [ ] Das öffentliche Event enthält weder private Choice-Kandidaten noch
  verdeckte Grip-/Stack-Informationen. Der tatsächlich getrashte installierte
  Programmname bleibt als öffentliches Spielergebnis sichtbar.
- [ ] Die Chronik konsumiert kanonische strukturierte Ability-/Effect-
  Semantik und leitet den Vorgang nicht aus `actionId`, Choice-ID, Label oder
  privatem Ausführungsdiscriminator ab.
- [ ] Ein Engine-/Public-Event-Regressionstest belegt die Projektion des
  side-sicheren Ausgangs; ein Web-Test belegt die kombinierte deutsche
  Chronikmeldung und schützt gegen den generischen Choice-Fallback.
- [ ] Bestehende normale Programminstallationen und andere MU-Choices bleiben
  in Chronik und Regeln unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da es sich um eine kleine,
  fokussierte Zustandsdarstellung handelt. Die tatsächliche Ursache liegt
  jedoch vor dem Web-Formatter in der öffentlichen Engine-Projektion und muss
  dort behoben werden.
- Zuerst `packages/engine/src/public-context.ts`,
  `packages/engine/src/game/events/build-event.ts` und
  `packages/engine/src/mechanics/public-payload-schema.ts` gegen die vorhandene
  private Legal-Action-Payload vergleichen. Die bereits vorhandene
  Chronikformatierung ist kein Ersatz für den fehlenden öffentlichen Vertrag.
- Die zwei gespeicherten Ereignisse 162/163 aus
  `match_cf9dbaa7d5d2d3c4` sind eine konkrete Regressionsevidence. Lokale
  Runtime-/SQLite-Daten bleiben unverändert und werden nicht versioniert.
- Hidden-Info fail-closed halten: Namen ausgewählter installierter Runner-
  Programme sind öffentlich; nicht gewählte Optionen und verdeckte Zonen
  bleiben redigiert.

## Ergebnisnotiz

Noch offen.
