---
activityId: act-2026-05-17-corp-hq-hand-server-attached-layout
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: board UX / corp HQ layout
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test
  - Playwright visual check mit temporärem Skript: Desktop 1600x900 und Narrow 390x844
  - git diff --check
relatedActivities:
  - act-2026-05-17-board-zone-identity-icons
  - act-2026-05-17-central-root-upgrade-install-targets
  - act-2026-05-17-runner-zones-board-style-collapse
---

# Korp-Sicht: HQ-Hand und HQ-Serverpfad als zusammenhängendes HQ darstellen

## Ziel

Aus Korp-Sicht sollen die eigene HQ-Hand und der HQ-Serverpfad nicht wie zwei unabhängige Board-Objekte wirken. Die HQ-Handkarten und das HQ mit Root/ICE sollen als zusammengehörige Headquarter-Zone lesbar sein, weil das ICE den Zugriff auf diese Handkarten schützt.

## Kontext und Quellen

- Nutzerfeedback vom 2026-05-17 mit Board-Screenshot: In der Korp-Sicht gibt es unten die sichtbaren HQ-Handkarten und darüber/seitlich den separaten HQ-Server mit Root-/ICE-Lanes. Fachlich gehören beide zusammen, wirken visuell aber getrennt.
- Gewünschte Richtung für breite Displays: Die HQ-Handkarten sollen links bzw. im HQ-Körper stehen und der HQ-Serverpfad mit Root und ICE direkt rechts daran andocken. Ein gemeinsamer HQ-Rahmen bzw. ein gemeinsames HQ-Objekt soll den Zusammenhang zeigen.
- Für Runner-Sicht besteht dieses Problem nicht in gleicher Form: Dort ist die Korp-HQ-Hand nur als Count bzw. verdeckte Information sichtbar. Diese Activity betrifft primär die Korp-Eigensicht.
- Responsiver Gedanke: Auf breiten Displays kann die HQ-Hand mit dem Serverpfad horizontal verbunden sein; auf schmalen Displays braucht es einen Fallback mit Umbruch, ohne Karten und ICE zu stark zu quetschen.
- Archives-Leitplanke aus `act-2026-05-17-central-root-upgrade-install-targets`: Archives ist derzeit bewusst kein regulärer installierbarer Root für Upgrades, weil `archives.root` aktuell für die öffentlich projizierten Archivkarten verwendet wird. Diese Activity soll Archives nicht zu einem normalen Root-/Upgrade-Ziel umdeuten.

## Scope

- Nur Korp-Sicht des eigenen HQ-Layouts anpassen.
- HQ-Handkarten und HQ-Serverpfad als gemeinsame visuelle Struktur darstellen:
  - gemeinsames oder klar verbundenes HQ-Label;
  - HQ-Handkarten weiterhin sichtbar als eigene Korp-Hand;
  - HQ-Serverpfad mit Root und ICE direkt angedockt oder im gleichen Container gruppiert;
  - Run-/Kontextbuttons weiterhin erreichbar.
- Responsiven Fallback definieren und umsetzen:
  - breites Display: horizontal zusammenhängendes HQ-Modul mit Handkarten plus Root/ICE-Pfad;
  - mittleres Display: gleiche logische Gruppe, ggf. zweizeilig;
  - schmales Display: Handkarten und Serverpfad dürfen untereinander stehen, bleiben aber über gemeinsamen Rahmen/Label/Connector als ein HQ erkennbar.
- Runner-Sicht unverändert lassen, außer kleine gemeinsame Komponentenänderungen sind unvermeidbar und hidden-info-neutral.
- Vorhandene Board-Zonensprache beibehalten: vertikale Labels, kompakte Counts, Rahmen, Run-Buttons und künftige Icon-Anschlussfläche sollen nicht gegen einen fremden Panel-Stil ersetzt werden.
- Prüfen, ob Archive im aktuellen UI weiterhin als Root-Lane beschriftet wird, obwohl dort Archivkarten liegen. Falls eine kleine reine Label-Klarstellung ohne Konflikt mit `act-2026-05-17-runner-zones-board-style-collapse` möglich ist, dokumentieren oder separat schneiden; keine Regeländerung im HQ-Paket vornehmen.

## Nicht im Scope

- Keine Änderung an HQ-, R&D- oder Archives-Regeln.
- Keine Änderung an der Legalität von Upgrades/Nodes in Archives.
- Keine Anzeige verdeckter HQ-Informationen in Runner-Sicht.
- Keine Änderung an PlayerView-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Verträgen.
- Keine komplette Neuordnung aller zentralen Server.
- Keine Umsetzung der allgemeinen Zone-Identity-Icons; nur Anschlussfähigkeit berücksichtigen.
- Kein Eingriff in das laufende Runner-Zonen-/Archive-Collapse-Paket, sofern nicht ausdrücklich koordiniert.

## Akzeptanzkriterien

- [x] In der Korp-Sicht wirken HQ-Hand und HQ-Serverpfad als eine zusammengehörige Headquarter-Struktur.
- [x] Auf breiten Displays dockt der HQ-Serverpfad mit Root/ICE nachvollziehbar an die HQ-Handkarten an.
- [x] Auf schmalen Displays gibt es einen stabilen Umbruch/Fallback ohne horizontales Überlaufen, Textüberlappung oder unbrauchbar kleine Karten.
- [x] Runner-Sicht bleibt hidden-info-sicher und zeigt keine zusätzlichen HQ-Handinhalte.
- [x] Run-Button, Kartenaktionen, Rez-/Statusbadges und Active-Run-Markierungen bleiben erreichbar und überlagern die Handkarten nicht störend.
- [x] Archives wird durch die Änderung nicht als regulärer installierbarer Root missverstanden oder engine-seitig verändert.
- [x] Mindestens ein Desktop- und ein schmaler Viewport werden visuell geprüft; wenn passende Web-/Layouttests vorhanden sind, werden sie ergänzt oder aktualisiert.

## Ergebnis

- Die eigene Korp-HQ-Hand wird nicht mehr als separater unterer Zonenblock gerendert, sondern in den HQ-Server integriert.
- Der HQ-Server besitzt in der Korp-Eigensicht eine zusammengesetzte HQ-Struktur mit Handkarten links, Connector und Root-/ICE-Lanes rechts.
- Die Handkarten behalten ihre normale Kartenhöhe; auf engen Breiten wird horizontal im Handbereich geclippt/gescrollt, ohne das Dokument zu überbreiten.
- Runner-Sicht bleibt unverändert und erhält keine zusätzlichen HQ-Handinhalte.
- Archives-Rendering, Root-Installationssemantik, Engine, LegalActions, Replay, StateHash und Hidden-Info-Verträge wurden nicht geändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx`: Board-Rendering rund um `serverGrid`, `serverBoardRows`, `serverLanesForSide`, HQ-Server, `SpecialZonesStrip` bzw. die eigene Korp-HQ-Handdarstellung.
  - `apps/web/app/globals.css`: `.serverGrid`, `.serverRow`, `.server`, `.serverLayout`, `.serverLead`, `.serverBody`, `.pairedServerLanes` und ggf. HQ-spezifische responsive Klassen.
  - `apps/web/app/action-board-ui.ts`: `showInstalledCorpState` und Archive-Helfer nur prüfen, nicht ohne Regelbefund ändern.
- Falls das aktuelle Board die eigene Korp-HQ-Hand außerhalb des `serverGrid` rendert, eher eine kleine HQ-spezifische Zusammensetzung bauen als alle Server generisch umzubauen.
- Für Archives gilt: Wenn die Beschriftung `Root` für Archivkarten irritiert, ist das ein separater kleiner UI-Begriffs-/Lane-Schnitt oder eine Ergänzung zum bereits laufenden Archive-Collapse-Paket, nicht Teil der HQ-Regeländerung.
