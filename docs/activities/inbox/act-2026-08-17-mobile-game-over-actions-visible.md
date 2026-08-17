---
activityId: act-2026-08-17-mobile-game-over-actions-visible
status: inbox
kind: fix
area: ui
priority: high
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

# Endstandsanzeige auf Handybildschirmen vollständig bedienbar halten

## Ziel

Die Endstandsanzeige bleibt auch auf kleinen Handybildschirmen vollständig
bedienbar. Insbesondere dürfen die unteren Aktionsknöpfe nicht unterhalb des
sichtbaren Viewports abgeschnitten oder durch ein nicht scrollbares Panel
unerreichbar werden.

## Kontext und Quellen

- Nutzerfund vom 2026-08-17: Auf einem Handybildschirm ist das
  Endstandsfenster so groß, dass die untersten Knöpfe nicht mehr sichtbar sind.
- `apps/web/features/results/GameOverModal.tsx` zeigt je nach Matchzustand
  Gewinnerkopf, Motivbild, Spielwertung, acht Statistikfelder, optional den
  Serienstand sowie bis zu fünf Aktionen im Footer: Replay, Aufbewahrung,
  Board, nächstes Serienspiel und Match/Serie verlassen.
- In `apps/web/app/globals.css` zentriert `.gameOverOverlay` das Panel im
  festen Vollbild-Overlay. `.gameOverPanel` besitzt derzeit weder eine
  viewportbezogene Maximalhöhe noch einen vertikalen Scrollbereich und setzt
  zugleich `overflow: hidden`.
- Unter `@media (max-width: 720px)` werden Hero, Motiv, Wertungsbereiche und
  Aktionsknöpfe vertikal beziehungsweise mehrzeilig angeordnet. Das Motiv
  behält zusätzlich mindestens 150 Pixel Höhe. Dadurch kann die Gesamthöhe
  insbesondere bei kurzen Portrait-Viewports und Serienergebnissen den
  verfügbaren Bildschirm deutlich überschreiten.
- Es existieren E2E-Pfade, die „Board ansehen“ bedienen, aber kein erkennbarer
  mobiler Viewportvertrag für Sichtbarkeit und Erreichbarkeit sämtlicher
  Endstandsaktionen.

## Scope

- Das `GameOverModal` für kleine Portrait-Viewports responsiv begrenzen, unter
  Berücksichtigung dynamischer Browserleisten und Safe Areas.
- Sicherstellen, dass Inhalt, Footer und alle jeweils angebotenen Aktionen
  ohne Browser-Zoom erreichbar bleiben. Eine robuste Lösung darf das Panel
  intern scrollen, den Footer innerhalb des Panels sichtbar halten und/oder
  dekorative beziehungsweise sekundäre Bereiche auf sehr kurzen Viewports
  kompakter darstellen.
- Die bestehende Informationshierarchie erhalten: Ergebnis und mindestens die
  primären nächsten Schritte müssen unmittelbar verständlich bleiben; Scrollen
  darf nicht unbemerkt außerhalb eines weiterhin `overflow: hidden` gesetzten
  Containers enden.
- Einzelmatch, laufende Serie und abgeschlossene Serie prüfen, weil der
  Serienbereich zusätzliche Höhe und weitere Aktionsknöpfe erzeugt.
- Repräsentative kleine Viewports absichern, mindestens 360 × 640 Pixel und
  390 × 844 Pixel im Portraitmodus. Die Prüfung soll auch eine Konstellation
  mit Gewinner-Motiv, Spielwertung, Serienstand und maximaler Aktionsanzahl
  enthalten.
- Einen fokussierten UI-/E2E-Regressionstest ergänzen, der für den kleinen
  Viewport belegt, dass das Dialogpanel im Viewport bleibt, kein Inhalt
  unzugänglich abgeschnitten wird und jeder gerenderte Aktionsknopf per
  Touch-/Pointer-Interaktion erreichbar ist.

## Nicht im Scope

- Redesign der fachlichen Endstandsinhalte, Änderung der Ergebnisberechnung
  oder Entfernung vorhandener Aktionen.
- Änderung von Matchabschluss, Serienlogik, Replay, Aufbewahrungsschutz oder
  Navigation hinter den Knöpfen.
- Globale Verkleinerung der Spieloberfläche oder browserseitiger Zoom als
  Workaround.
- Desktop-Redesign der Endstandsanzeige; große Viewports sollen ihr bisheriges
  Layout und Motiv beibehalten.
- Ausweitung auf andere Overlays ohne reproduzierten ähnlichen Befund. Wird
  eine gemeinsame fehlerhafte Modal-Grundlage gefunden, sind weitere
  betroffene Flächen als kleine Folge-Activities zu schneiden.

## Akzeptanzkriterien

- [ ] Auf 360 × 640 und 390 × 844 Pixel großen Portrait-Viewports bleibt die
  Endstandsanzeige innerhalb des nutzbaren dynamischen Viewports.
- [ ] Kein gerenderter Endstandsaktionsknopf wird dauerhaft unterhalb eines
  nicht scrollbaren oder abgeschnittenen Bereichs verborgen.
- [ ] Replay, Aufbewahrung, „Board ansehen“, gegebenenfalls „Nächstes
  Serienspiel“ und der Match-/Serienausstieg sind in ihren jeweiligen
  Zuständen per Touch erreichbar.
- [ ] Ein notwendiger interner Scrollbereich ist sichtbar nutzbar, scrollt
  Inhalt und Aktionen zuverlässig und berücksichtigt obere/untere Safe Areas
  sowie mobile Browserleisten.
- [ ] Ergebnisüberschrift und primäre nächste Aktion sind auf kurzen
  Bildschirmen ohne browserseitigen Zoom verständlich erkennbar.
- [ ] Einzelmatch sowie laufende und abgeschlossene Serie sind geprüft; der
  zusätzliche Serieninhalt verursacht keine erneute Footer-Abschneidung.
- [ ] Desktopdarstellung und bestehende Funktionen der Endstandsaktionen
  bleiben unverändert.
- [ ] Ein fokussierter automatisierter Test und eine visuelle Prüfung in
  Firefox bei mindestens einem kleinen mobilen Viewport sichern den Befund ab.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da der Fehler im
  responsiven Layout des bestehenden Ergebnisdialogs liegt und kein Redesign
  benötigt.
- Zuerst `.gameOverOverlay`, `.gameOverPanel`, `.gameOverHero`,
  `.gameOverStats`, `.seriesStrip`, `.gameOverFooter` und `.gameOverActions`
  gemeinsam gegen die tatsächliche Viewporthöhe prüfen. Nur einzelne Knöpfe
  kleiner zu machen behebt den nicht begrenzten Container nicht ursächlich.
- Für die Höhenbegrenzung dynamische Viewport-Einheiten und Safe-Area-Abstände
  berücksichtigen. Eine feste `100vh`-Annahme kann auf Mobilbrowsern mit
  ein- und ausgeblendeter Adressleiste weiterhin abschneiden.
- Bei einem sticky Footer darauf achten, dass Fokusrahmen und letzter
  scrollbarer Inhalt nicht darunter verdeckt werden. Tastaturfokus,
  Screenreader-Dialogsemantik und Touch-Ziele erhalten.
- Die visuelle Prüfung nach lokaler Projektregel in Firefox durchführen.

## Ergebnisnotiz

Noch offen.
