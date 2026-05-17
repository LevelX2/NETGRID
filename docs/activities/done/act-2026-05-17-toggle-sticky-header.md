---
activityId: act-2026-05-17-toggle-sticky-header
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web test
  - git diff --check
  - Playwright-Smoke schmal 390x844 und Desktop 1280x720 fuer Kopfzeile-fixieren-Toggle, Reload-Persistenz und Sticky/Relative-CSS
---

# Fixierte Kopfzeile optional machen

## Ziel

Die fixierte Kopfzeile soll auf kleinen Bildschirmen nicht dauerhaft Platz blockieren müssen. Nutzer sollen je nach Device- und Spielsituation wählen können, ob die Kopfzeile fixiert bleibt oder mitscrollt.

## Kontext und Quellen

- Nutzerfund vom 2026-05-17: Die inzwischen fixierte Kopfzeile ist auf kleinen Devices, insbesondere Mobiltelefonen und Tablets, nicht immer ideal.
- Erwartete Richtung: Entweder responsiv auf kleinen Viewports nicht fixieren oder bevorzugt eine Option anbieten, mit der die Fixierung lokal ein- und ausgeschaltet werden kann.
- Projektkontext: kleine UI-/Interaktionskorrektur ohne Regel-, Engine-, Hidden-Info- oder WebSocket-Vertragsänderung.

## Scope

- Bestehende Kopfzeilen-Fixierung in der aktiven Spieloberfläche identifizieren.
- Eine lokale Einstellung für `Kopfzeile fixieren` oder eine gleichwertige deutschsprachige Bezeichnung ergänzen.
- Die Einstellung in der vorhandenen Options-/Einstellungsoberfläche unterbringen, sofern dort bereits vergleichbare UI-Optionen liegen.
- Einstellung lokal persistieren, ohne Matchzustand, Serverzustand oder Replay-Daten zu verändern.
- Mobile- und Tablet-Viewports prüfen: ausgeschaltete Fixierung muss zusätzlichen vertikalen Platz freigeben, eingeschaltete Fixierung muss weiterhin erwartungsgemäß funktionieren.
- Falls die Codebasis bereits einen klaren Breakpoint für mobile Layouts nutzt, darf die Implementierung zusätzlich einen sinnvollen Default für kleine Viewports wählen, solange die Nutzeroption Vorrang hat.

## Nicht im Scope

- Kein Redesign der gesamten Kopfzeile.
- Keine Änderungen an Regelengine, `LegalActions`, `PlayerActions`, Replay, StateHash oder Hidden-Info-Redaction.
- Keine neue serverseitige oder accountweite Einstellung.
- Keine Umstrukturierung des Optionspanels über das notwendige UI-Element hinaus.
- Keine Optimierung aller mobilen Layoutprobleme der Spieloberfläche.

## Akzeptanzkriterien

- [x] Es gibt eine sichtbare lokale Option, mit der die Kopfzeilen-Fixierung ein- und ausgeschaltet werden kann.
- [x] Die gewählte Einstellung bleibt nach Reload/Reconnect im Browser erhalten, soweit lokale UI-Einstellungen im Projekt bereits persistiert werden.
- [x] Bei ausgeschalteter Fixierung nimmt die Kopfzeile im Mobile-/Tablet-Viewport keinen dauerhaft fixierten Screenbereich mehr ein.
- [x] Bei eingeschalteter Fixierung bleibt das bisherige Verhalten auf Desktop und breiteren Viewports erhalten.
- [x] Die Umsetzung verändert keine Engine-, Action-, Replay-, StateHash- oder Hidden-Info-Verträge.
- [x] Ein fokussierter UI-Check oder Browser-Smoke deckt mindestens einen schmalen Mobile-Viewport und einen breiteren Desktop-Viewport ab.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Vor Umsetzung prüfen, ob vorhandene lokale Einstellungen bereits für Audio, automatische Effekte oder andere UI-Optionen genutzt werden; die neue Option sollte diesem Muster folgen.
- Sichtbarer UI-Text soll echtes Deutsch mit Umlauten verwenden.
- Bei knapper Optionsfläche auf kleinen Viewports eher eine kompakte Checkbox-/Toggle-Zeile verwenden als erklärenden Hilfetext.

## Ergebnisnotiz

Abgeschlossen: Die aktive Spieloberfläche hat in den lokalen Spielablauf-Optionen den Toggle `Kopfzeile fixieren`. Die Einstellung wird im bestehenden lokalen Gameplay-Settings-Key gespeichert, standardmäßig bleibt die Kopfzeile fixiert. Bei deaktivierter Option erhält die aktive Match-App `topbarStickyDisabled`, wodurch die Topbar wieder normal mitscrollt. Engine, Server, Actions, Replay, StateHash und Hidden-Info-Verträge bleiben unverändert.
