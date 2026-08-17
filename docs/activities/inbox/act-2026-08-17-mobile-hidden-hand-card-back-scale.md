---
activityId: act-2026-08-17-mobile-hidden-hand-card-back-scale
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

# Verdeckte Handkarten bei kleiner Kartengröße proportional skalieren

## Ziel

Die Rückseiten gegnerischer Handkarten werden auf mobilen Bildschirmen auch
bei der minimalen Kartengröße von 50 % proportional und als erkennbare Karten
dargestellt. Breite, Höhe, Überlappung und Kartenrückseitenmotiv müssen
demselben Skalierungswert folgen.

## Kontext und Quellen

- Nutzerfund und Screenshot vom 2026-08-17 auf einem iPhone 14, alle
  Kartengrößen in den Einstellungen auf 50 %.
- Sichtbarer Fall: Der Runner betrachtet das gegnerische Korp-HQ mit fünf
  verdeckten Handkarten. Die Kartenbreiten und Überlappung sind verkleinert,
  die Rückseiten bleiben jedoch überproportional hoch und erscheinen als
  schmale, verzerrte Stapelung.
- `apps/web/features/game-board/ActiveServerGrid.tsx` rendert die gegnerische
  Korp-Hand über `.corpOpponentHqPreview` mit `zoneCardsStyle`. Die verdeckte
  gegnerische Runner-Hand verwendet in `RunnerBoardStrips.tsx` den parallelen
  Pfad `.runnerOpponentGripPreview`.
- Beide Vorschauen berechnen Breite und Höhe aus
  `--zone-card-scale`: bei 50 % etwa 54 × 75,5 Pixel.
- `apps/web/app/globals.css` setzt für jede `.card.hiddenBack` unabhängig vom
  gewählten Skalierungswert eine feste `min-height: 106px`. Diese Mindesthöhe
  überstimmt bei 50 % die skalierte Vorschauhöhe, während die Breite klein
  bleibt. Das erklärt die im Screenshot sichtbare falsche Proportion.
- Das ältere erledigte Paket
  `docs/activities/done/act-2026-08-14-corp-hq-hand-wrap-before-chronicle.md`
  betrifft die adaptive Breite der eigenen offenen Korp-Hand im
  Desktoplayout. Der aktuelle Befund ist ein separater Follow-up für
  verdeckte gegnerische Handkarten und mobile Minimalskalierung.

## Scope

- Den Höhenkonflikt zwischen der allgemeinen Hidden-Back-Mindesthöhe und den
  skalierten gegnerischen Handvorschauen ursachenorientiert beheben.
- Korp-HQ-Rückseiten und Runner-Grip-Rückseiten in beiden Dimensionen mit dem
  jeweils zuständigen Karten-Skalierungswert darstellen.
- Das vorgesehene Seitenverhältnis und das korrekte seitenabhängige
  Rückseitenmotiv erhalten; die Karten dürfen weder gestaucht noch gestreckt
  oder innerhalb des Slots abgeschnitten werden.
- Überlappung, sichtbare Anzahlsschritte und Overflow-Badge bei großen Händen
  an die skalierte Kartenbreite gekoppelt lassen.
- Mindestens 50 %, 100 % und die zulässige Maximalgröße prüfen, damit die
  Korrektur nicht nur einen neuen festen Sonderwert für 50 % einführt.
- Einen fokussierten CSS-/UI-Regressionstest für beide gegnerischen
  Handvorschauen ergänzen. Zusätzlich den reproduzierten iPhone-14-Viewport
  von 390 × 844 Pixel mit fünf Korp-HQ-Karten und 50 % Skalierung visuell
  prüfen.

## Nicht im Scope

- Änderung der Handkartenzahl, des Handlimits, der Kartenverteilung oder der
  Engine-/PlayerView-Projektion.
- Offenlegung verdeckter Kartentitel, Definitionen, Instanzkennungen oder
  anderer Hidden-Info-Daten.
- Redesign der Server-, HQ- oder Runner-Zonen sowie Änderung der allgemeinen
  Kartenformat-Einstellungen.
- Änderung von Kartenrückseiten in installierten Zonen, Aktionshinweisen,
  Replays oder Tooltips, sofern sie den Skalierungsfehler nicht teilen. Werden
  dort weitere konkrete Konflikte gefunden, sind sie separat zu prüfen oder
  als kleine Folge-Activity festzuhalten.
- Entfernen der allgemeinen Hidden-Back-Mindesthöhe ohne Prüfung ihrer übrigen
  Nutzungspfade; die Lösung muss kontextgerecht skalieren statt andere
  Rückseiten unbeabsichtigt zu verkleinern.

## Akzeptanzkriterien

- [ ] Auf einem iPhone-14-Viewport mit 50 % Kartengröße erscheinen fünf
  verdeckte Korp-HQ-Karten proportional und ohne überhöhte Rückseiten.
- [ ] Die parallele verdeckte Runner-Grip-Vorschau verhält sich bei 50 %
  ebenso korrekt.
- [ ] Verwendete Kartenbreite und -höhe entsprechen in beiden Vorschauen
  demselben Skalierungsfaktor und dem vorgesehenen Kartenformat.
- [ ] Korp- und Runner-Rückseitenmotiv bleiben korrekt zugeordnet; es werden
  keinerlei verdeckte Kartendaten sichtbar.
- [ ] Überlappung und Overflow-Badge bleiben bei kleinen und größeren Händen
  lesbar und ragen nicht unkontrolliert aus ihrer Zone.
- [ ] Die Darstellungen bei 100 % und maximaler zulässiger Kartengröße zeigen
  keine Regression; andere Hidden-Back-Nutzungen behalten ihre notwendige
  Mindestgröße.
- [ ] Ein fokussierter automatisierter Test schützt den CSS-Skalierungsvertrag
  beider Handvorschauen; eine visuelle mobile Prüfung dokumentiert den
  reproduzierten 50-%-Fall.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da Ursache und Wirkung in
  den vorhandenen UI-Komponenten und CSS-Skalierungsregeln liegen.
- Zuerst die berechneten Größen von `.corpOpponentHqPreview .card` und
  `.runnerOpponentGripPreview .card` gegen `.card.hiddenBack` prüfen. Die feste
  Mindesthöhe darf die explizite, skalierte Höhe in diesen Vorschauen nicht
  überstimmen.
- Eine kontextspezifische skalierte `min-height`, eine gemeinsame
  Kartenhöhenvariable oder eine andere saubere Größenbindung ist einem
  globalen ungeprüften Entfernen der Mindesthöhe vorzuziehen.
- Den Test nicht nur auf vorhandene CSS-Strings beschränken, wenn sich die
  tatsächlich berechnete Höhe in einer Browserprüfung zuverlässig messen
  lässt. Erwartet wird ein proportionaler Slot bei 50 %, nicht lediglich das
  Vorhandensein einer weiteren Override-Regel.
- Die visuelle Prüfung auf dem mobilen Webpfad durchführen; für lokale
  Desktop-Browserprüfungen bleibt Firefox die Projektvorgabe.

## Ergebnisnotiz

Noch offen.
