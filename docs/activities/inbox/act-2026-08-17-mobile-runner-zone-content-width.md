---
activityId: act-2026-08-17-mobile-runner-zone-content-width
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runnerzonen auf Mobilgeräten inhaltsbreit anordnen

## Ziel

Grip, Stack, Rig und Heap des aktiven Runners belegen auf mobilen Bildschirmen
nur die für ihren aktuellen Inhalt notwendige Breite, höchstens jedoch die
verfügbare Viewportbreite. Mehrere schmale Zonen dürfen wie im allgemeinen
Zonenlayout nebeneinander stehen und erst bei Platzmangel umbrechen.

## Kontext und Quellen

- Nutzerfund und Screenshot vom 2026-08-17 auf einem iPhone 14: Grip, Stack
  und leeres Rig füllen jeweils nahezu die gesamte Bildschirmbreite, obwohl
  ihr Inhalt deutlich schmaler ist. Der leere Heap erscheint dagegen wie
  gewünscht nur inhaltsbreit.
- Das Komponentenlayout in
  `apps/web/features/game-board/ActiveRunnerZoneBoard.tsx` rendert alle vier
  Zonen als `SideZoneFrame` innerhalb von `.runnerGripHeapLayout`.
- Der Basisvertrag in `apps/web/app/globals.css` ist bereits inhaltsorientiert:
  `.runnerGripHeapLayout` ist ein umbrechender Flex-Container und die Zonen
  verwenden `width: fit-content`, `flex: 0 0 auto` beziehungsweise für den
  Heap `flex: 0 1 auto` sowie `max-width: 100%`.
- Unter `@media (max-width: 720px)` überschreibt eine spätere Regel
  `.runnerGripHeapLayout .sideZoneFrame`, `.runnerGripZone`,
  `.runnerStackZone`, `.runnerHeapZone` und `.runnerRigZone` pauschal mit
  `width: 100%`. Das erklärt die Vollbreite auf dem iPhone.
- Der Heap bleibt wegen der spezifischeren Basisregel
  `.runnerGripHeapLayout .sideZoneFrame.runnerHeapZone { width: fit-content; }`
  schmal. Das sichtbare unterschiedliche Verhalten ist daher ein
  Selektorspezifitäts-Nebeneffekt und kein beabsichtigter fachlicher
  Unterschied zwischen den Zonen.
- Es besteht keine offene Activity für diesen inhaltsbreiten mobilen
  Runnerzonenvertrag. Das parallele Paket zur Skalierung verdeckter
  Handkartenrückseiten betrifft Kartendimensionen und nicht die Breite der
  Zonenrahmen.

## Scope

- Den mobilen Vollbreiten-Override für die aktiven Runnerzonen durch einen
  konsistenten inhaltsbreiten Responsive-Vertrag ersetzen.
- Grip, Stack, Rig und Heap im aufgeklappten, leeren und befüllten Zustand
  prüfen. Jede Zone soll sich am tatsächlichen Inhalt orientieren und nur bis
  `max-width: 100%` wachsen.
- Das vorhandene Flex-Wrapping nutzen: Zonen stehen nebeneinander, wenn ihre
  summierte Breite in den verfügbaren Bereich passt, und umbrechen ohne
  horizontales Seiten-Overflow, sobald sie nicht mehr passen.
- Große Hände, umfangreiche Rigs und breite Heap-Stapel weiterhin sicher
  begrenzen. Innerhalb einer Zone darf der dafür vorgesehene Kartenbereich
  scrollen, überlappen oder umbrechen, ohne den äußeren Zonenrahmen pauschal
  auf Vollbreite zu zwingen.
- Karten-Skalierungseinstellungen berücksichtigen, mindestens 50 %, 100 %
  und die zulässige Maximalgröße.
- Einen fokussierten Layout-Regressionsvertrag ergänzen und das Ergebnis auf
  einem iPhone-14-Viewport von 390 × 844 Pixel visuell prüfen.

## Nicht im Scope

- Änderung der Karten-, Counter-, MU-, Handlimit- oder Zoneninhalte.
- Redesign der vertikalen Zonenbeschriftungen, Icons, Collapse-Knöpfe oder
  Kartenstapel.
- Änderung der gegnerischen Runnerzonen oder der Korp-Serverzonen, sofern dort
  kein eigener reproduzierter Vollbreitenfehler vorliegt.
- Erzwingen einer einzigen horizontalen Zeile. Umbruch bei echtem Platzmangel
  bleibt notwendig und erwünscht.
- Horizontales Überlaufen des gesamten Boards oder Abschneiden von Karten als
  Ersatz für einen inhaltsbreiten, viewportbegrenzten Rahmen.
- Globales Entfernen aller mobilen `width: 100%`-Regeln; andere Flächen können
  Vollbreite fachlich benötigen.

## Akzeptanzkriterien

- [ ] Auf einem iPhone-14-Viewport sind Stack und ein leeres Rig nur so breit
  wie Beschriftung, Innenabstände und Inhalt es erfordern, nicht pauschal
  viewportbreit.
- [ ] Grip, Stack, Rig und Heap folgen demselben inhaltsbreiten äußeren
  Zonenvertrag; die Heap-Darstellung beruht nicht länger auf einem zufälligen
  Spezifitätsvorrang.
- [ ] Mehrere schmale Runnerzonen stehen nebeneinander, wenn sie gemeinsam in
  den verfügbaren Bereich passen, und umbrechen geordnet bei Platzmangel.
- [ ] Eine breite Grip- oder Rig-Belegung überschreitet den Viewport nicht und
  bleibt mit dem vorgesehenen inneren Kartenlayout vollständig erreichbar.
- [ ] Aufgeklappte, eingeklappte, leere und befüllte Zustände bleiben
  verständlich und bedienbar.
- [ ] 50 %, 100 % und maximale Kartengröße erzeugen weder unnötige Vollbreite
  noch horizontales Seiten-Overflow.
- [ ] Die Desktopdarstellung bleibt unverändert.
- [ ] Ein fokussierter automatisierter Layouttest schützt den mobilen
  `fit-content`-/`max-width`-/Wrap-Vertrag; eine visuelle Prüfung bei
  390 × 844 Pixel dokumentiert den reproduzierten Fall.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da die Ursache eine kleine,
  klar lokalisierte Responsive-CSS-Regel ist.
- Zuerst den Block unter `@media (max-width: 720px)` bei den Selektoren
  `.runnerGripHeapLayout .sideZoneFrame`, `.runnerGripZone`,
  `.runnerStackZone`, `.runnerHeapZone` und `.runnerRigZone` bereinigen. Den
  gewünschten Vertrag ausdrücklich und mit konsistenter Spezifität formulieren
  statt sich auf den aktuellen Heap-Ausnahmeeffekt zu verlassen.
- Die ebenfalls mobile Regel `.fixedZoneCards { width: 100%; ... }` im
  Zusammenspiel mit einer inhaltsbreiten Elternzone prüfen. Prozentbreiten in
  einem `fit-content`-Kontext dürfen die intrinsische Breite nicht erneut
  ungewollt auf die ganze Zeile aufweiten.
- Für Tests nicht nur CSS-Strings prüfen, sondern nach Möglichkeit berechnete
  Breiten mehrerer Zonen gegen ihren Container und ihren Inhalt messen. Der
  Stack mit einer Karte und das leere Rig sind besonders klare
  Regressionseingänge.
- Die visuelle mobile Prüfung auf dem realen Webpfad durchführen; für lokale
  Desktop-Browserprüfungen bleibt Firefox die Projektvorgabe.

## Ergebnisnotiz

Noch offen.
