---
activityId: act-2026-08-14-corp-hq-hand-wrap-before-chronicle
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-14
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-HQ vor der Spielchronik ohne Überlagerung halten

## Ziel

Das zusammengesetzte Korp-HQ bleibt im Spielbrett vollständig innerhalb des
für das Brett verfügbaren Bereichs und überlagert die geöffnete Spielchronik
nicht. Die Hand bleibt dabei zunächst vor dem HQ-Server; erst wenn die
sichtbare Mindestbreite je Handkarte nicht mehr eingehalten werden kann,
bricht die Hand als zusammenhängender Block in eine zweite Zeile um.

## Kontext und Quellen

- Nutzerfund mit Screenshot vom 2026-08-14: Im Desktop-Spiel mit geöffneter
  Spielchronik ragt das eigene Korp-HQ nach rechts in die Chronik. Sichtbar
  sind Handkarten, anschließend der HQ-Root und ICE; insbesondere die
  rechten Karten liegen über Chronik-Einträgen.
- `apps/web/features/game-board/ActiveServerGrid.tsx` erzeugt für das eigene
  Korp-HQ den zusammengesetzten Bereich aus `HandCardsRow` und
  `ServerCardLanes` (`corpHqComposite`, `corpHqHandPanel` und
  `corpHqServerLanes`).
- `apps/web/features/game-board/ZoneFrame.tsx` berechnet für
  `HandCardsRow` bereits dynamische Überlappungswerte.
- `apps/web/app/globals.css` enthält die zugehörigen Regeln für
  `.corpHqServer`, `.corpHqComposite`, `.corpHqHandPanel`,
  `.fixedZoneCards.corpHqHandCards` und `.corpHqServerLanes`.

## Scope

- Den Breitenbedarf des eigenen Korp-HQ im normalen Spiel mit sichtbarer
  Spielchronik ursachenorientiert prüfen und so begrenzen, dass der
  Brettbereich nicht unter die Chronik läuft.
- Die vorhandene Handkarten-Überlappung im Korp-HQ zuerst adaptiv verdichten,
  ohne Hand und HQ-Server künstlich zu trennen.
- Eine klare Mindestfreibreite je Handkarte aus dem bestehenden
  Karten-/Überlappungs-Layout ableiten und als Grenze erhalten; Karten dürfen
  nicht bis zur Unbedienbarkeit zusammengedrückt werden.
- Sobald diese Grenze in einer Zeile nicht mehr eingehalten werden könnte,
  die Korp-Hand innerhalb ihres Panels als zusammenhängenden zweizeiligen
  Kartenblock umbrechen lassen. Der HQ-Root mit seinen ICE bleibt dabei im
  selben HQ-Kompositbereich und wird nicht als Ersatzlösung von der Hand
  abgetrennt.
- Die Lösung für unterschiedliche Handgrößen und für die vorhandenen
  skalierbaren Kartengrößen prüfen; eine Hand am regulären Limit (z. B. 6 von
  7 Karten) ist mindestens abzudecken.
- Einen fokussierten Layout-Regressionstest ergänzen, soweit der vorhandene
  Web-Testaufbau die Breiten-/Umbruchbedingung prüfbar abbilden kann;
  zusätzlich den realen Desktop-Pfad mit geöffneter Spielchronik visuell
  verifizieren.

## Nicht im Scope

- Redesign oder Verbreiterung/Verkleinerung der Spielchronik.
- Globales Neulayout aller Server, der Runner-Grip oder der übrigen
  Handkartenzeilen.
- Abschneiden, Verbergen oder unzugängliches Stapeln von Handkarten als
  Ersatz für einen passenden Umbruch.
- Änderungen an Rules Engine, `PlayerView`, Legal Actions, Kartendaten,
  Hidden-Info-Schutz oder Spielmechanik.

## Akzeptanzkriterien

- [ ] Bei geöffneter Spielchronik überlagert kein Teil des eigenen Korp-HQ
  die Chronik; insbesondere bleiben Chronik-Einträge sichtbar und bedienbar.
- [ ] Solange die definierte Mindestfreibreite jeder Handkarte noch möglich
  ist, bleibt die Korp-Hand einzeilig und vor dem HQ-Root beziehungsweise den
  ICE angeordnet.
- [ ] Reicht der verfügbare Brettbereich dafür nicht aus, entsteht ein
  zweizeiliger, zusammenhängender Handkartenblock; Hand und HQ-Server werden
  nicht in unabhängige Zonen aufgetrennt.
- [ ] Karten bleiben mit Maus und Tastatur erreichbar; weder Überlappung noch
  Umbruch verdecken Klick-, Fokus-, Tooltip- oder Auswahlflächen.
- [ ] Die vorhandenen kleineren responsiven Layouts und das gegnerische,
  verdeckte Korp-HQ bleiben funktional unverändert, sofern sie nicht dieselbe
  Ursache teilen.
- [ ] Ein fokussierter Check sowie eine visuelle Desktop-Prüfung mit
  geöffneter Chronik und großer Korp-Hand sind dokumentiert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Erst den tatsächlichen Größen- und Überlappungspfad von `HandCardsRow` und
  den CSS-Layoutgrenzen verfolgen. Kein nachgelagertes `overflow: hidden`,
  kein fester Pixelwert nur für den Screenshot und kein Entfernen der
  Spielchronik als Workaround.
- Für die Mindestfreibreite und die Umschaltgrenze bestehende
  Karten-/Responsive-Tokens verwenden oder sie klar am HQ-Kompositbereich
  kapseln, damit andere Handzonen nicht unbeabsichtigt ihr Verhalten ändern.
- Den manuellen Prüffall mindestens in einer Desktop-Breite wie im Fund
  (Spielbrett mit dauerhaft sichtbarer Chronik) und mit einer längeren
  installierten HQ-Reihe nachvollziehen.

## Ergebnisnotiz

Noch offen.
