---
activityId: act-2026-05-19-board-zones-chronicle-side-tint-experiment
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-board-zone-identity-icons
  - act-2026-05-17-corp-runner-zones-compact-rig-row
  - act-2026-05-17-runner-zones-board-style-collapse
resultArtifacts:
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
  - Browser-Screenshot Desktop: C:\Users\Lui\AppData\Local\Temp\netgrid\activity-board-zone-tint-final-desktop.png
  - Browser-Screenshot aktiver Run: C:\Users\Lui\AppData\Local\Temp\netgrid\activity-board-zone-tint-final-active-run.png
  - Browser-Screenshot Narrow: C:\Users\Lui\AppData\Local\Temp\netgrid\activity-board-zone-tint-final-mobile.png
---

# Board-Zonen: Chronik-Seitenfarben als Hintergrundtönung testen

## Ziel

Testweise soll geprüft werden, wie das Board wirkt, wenn Korp-Installationsbereiche und Runner-Elemente im Hintergrund stärker mit den jeweiligen Seitenfarben aus der Chronik eingefärbt werden. Die Änderung soll als enges visuelles Experiment umgesetzt werden und nach Browser-/Screenshot-Prüfung entweder übernommen, abgeschwächt oder verworfen werden können.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-19:
  - Corp-Installationen bzw. Corp-Zonen (`HQ`, `R&D`, `Archive`, externe Forts) sollen testweise im Hintergrund mit der Corp-Chronikfarbe eingefärbt werden.
  - Runner-Elemente sollen entsprechend mit der Runner-/Run-Chronikfarbe eingefärbt werden.
  - Ziel ist ein visueller Test, ob die Seitenzuordnung im Board dadurch klarer wirkt.
- Aktuelle Web-CSS-Sichtung:
  - `apps/web/app/globals.css` definiert u. a. `--runner-zone-accent`, `--corp-zone-accent`, `--chronicle-run`, `--chronicle-turn` und chroniknahe Gruppenfarben.
  - Board-Zonen nutzen bereits Seitenakzente für Icons, Rahmen, Labels und einzelne Hintergründe.
  - Chronikgruppen nutzen für Korp derzeit `--corp-status-accent` und für Runner/Run `--runner-zone-accent`.
- Relevante bestehende UI-Arbeiten:
  - `act-2026-05-17-board-zone-identity-icons`
  - `act-2026-05-17-corp-runner-zones-compact-rig-row`
  - `act-2026-05-17-runner-zones-board-style-collapse`

## Scope

- Einen kleinen CSS-/UI-Schnitt anlegen, der Board-Zonen im Hintergrund stärker seitenbezogen tönt:
  - Korp-Zonen: HQ, R&D/F&E, Archive, externe Forts, installierte Korp-Root-/ICE-Bereiche.
  - Runner-Zonen: Runner-Rig, Programme, Hardware, Ressourcen, Grip/Stack/Heap-Zonen und vergleichbare Runner-Boardelemente.
- Die Tönung soll sich an den Chronik-Seitenfarben orientieren, nicht eine komplett neue Palette einführen.
- Tönung nur auf Hintergrund-/Panel-Ebene testen; Kartenbilder, versteckte Karten, Counter, Badges, Buttonzustände und Interaktionsmarker müssen weiterhin klar lesbar bleiben.
- Das Experiment soll abgestuft sein:
  - eher subtile `color-mix`-Tönung auf Panel-/Zone-Hintergründen,
  - nicht flächig grell,
  - Rahmen/Lead-Akzente dürfen bestehen bleiben.
- Desktop und schmale Viewports prüfen:
  - Korp-Sicht mit HQ/R&D/Archive/Forts,
  - Runner-Sicht mit Rig/Grip/Stack/Heap,
  - aktive Run-Situation, damit Run-Fenster und Boardfarben nicht konkurrieren.
- Vorher/nachher oder dokumentierte Browser-Screenshots erfassen, damit entschieden werden kann, ob der Look übernommen wird.

## Nicht im Scope

- Kein komplettes Board-Redesign.
- Keine Änderung an Engine, LegalActions, PlayerViews, Hidden-Info, Replay oder StateHash.
- Keine Änderung an Chronikfarben selbst, außer eine minimale Variable-Nutzung ist nötig und gut begründet.
- Keine neue Theme-/Einstellung im ersten Test. Falls ein Toggle gewünscht wird, dafür ein separates Paket schneiden.
- Keine Änderung an Kartenbildern, Card Frames, Card Backs oder offiziellen Asset-Gates.

## Akzeptanzkriterien

- [ ] Corp-Zonen sind testweise mit einer klar erkennbaren, aber zurückhaltenden Corp-Farbtönung hinterlegt.
- [ ] Runner-Zonen sind testweise mit einer klar erkennbaren, aber zurückhaltenden Runner-/Run-Farbtönung hinterlegt.
- [ ] Die Farben orientieren sich an den bestehenden Chronik-/Seitenfarben und wirken nicht wie ein neues Farbsystem.
- [ ] Karten, verdeckte Karten, Counter, Aktionsbuttons, Statusbadges und Zonennamen bleiben lesbar.
- [ ] Desktop- und Mobile-/Narrow-Screenshots oder Browserprüfungen sind dokumentiert.
- [ ] Falls die Tönung zu stark oder unruhig wirkt, wird sie im selben Paket abgeschwächt oder mit Ergebnisnotiz verworfen.
- [ ] Keine Tests oder DOM-Leak-Checks zeigen unerwünschte Nebenwirkungen.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/globals.css`
  - ggf. `apps/web/app/page.tsx`, falls einzelne Zonen noch keine unterscheidbaren Klassen tragen.
- Geeignete CSS-Anker aus erster Sichtung:
  - `--runner-zone-accent`
  - `--corp-zone-accent`
  - `--chronicle-run`
  - `.zoneBoardSection`
  - `.sideZoneFrame`
  - `.rigSection`
  - zonenspezifische Runner-/Corp-Klassen.
- Vor der Änderung prüfen, ob Chronik und Board bereits dieselben Seitenvariablen nutzen. Wenn ja, besser die vorhandenen Variablen stärker anwenden als neue Farben definieren.
- Browserprüfung vorzugsweise mit realem Boardzustand statt isolierter CSS-Sichtung.

## Ergebnisnotiz

Erledigt am 2026-05-19. Die Board-Zonen nutzen jetzt eine zurückhaltende Hintergrundtönung aus bestehenden Chronik-/Seitenfarben: Korp-Server und Korp-Lanes über `--corp-status-accent`, Runner-Rig sowie Grip/Heap/Stack-Zonen über `--chronicle-run`. Desktop-, Narrow- und aktive-Run-Screenshots wurden geprüft; Karten, verdeckte Karten, Counter, Aktionsbuttons, Statusbadges und Zonennamen blieben lesbar. Die Tönung wurde nach Sichtprüfung beibehalten.
