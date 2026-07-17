---
activityId: act-2026-07-11-winning-agenda-access-before-result-modal
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-11
startedAt: 2026-07-17
completedAt: 2026-07-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/match-overlay-presentation.ts
  - apps/web/app/match-overlay-presentation.test.ts
  - apps/web/app/winning-agenda-result-sequence.test.ts
  - apps/web/app/access-presentation.ts
  - apps/web/app/access-presentation.test.ts
  - apps/web/features/actions/access-review-derivation.ts
  - apps/web/app/access-review-derivation.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/version-status.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/match-overlay-presentation.test.ts app/access-presentation.test.ts app/access-review-derivation.test.ts (3 Dateien, 31 Tests bestanden)"
  - "corepack pnpm --filter @netgrid/web test (47 Dateien, 607 Tests bestanden)"
  - "corepack pnpm --filter @netgrid/web typecheck (bestanden)"
  - "git diff --check (bestanden)"
---

# Gewinnende Agenda vor dem Ergebnisfenster bestätigen

## Ziel

Wenn der Runner beim Zugriff eine Agenda stiehlt und dadurch das Spiel gewinnt, soll zuerst das sichtbare Access-Ergebnis mit der erbeuteten Agenda stehen bleiben. Erst nachdem der Spieler dieses Fenster bestätigt hat, darf das Ergebnisfenster mit Gewinner und Spielende erscheinen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-11 aus einem Korp-gegen-Runner-Spiel: Der Runner griff R&D an und stahl eine Agenda, mit der er das Spiel gewann. Das Ergebnisfenster erschien sofort; das Access-Fenster mit der konkret erbeuteten Agenda war dadurch nicht mehr wahrnehmbar.
- Das abgeschlossene Paket P10 im Prozess `docs/architecture/current-game-findings-remediation-process-2026-07-11.md` härtete Auto-End gegen offene Access-, Choice- und Bestätigungsabläufe. Der Final Review `docs/reviews/current-game-findings-remediation-final-review-2026-07-11.md` dokumentiert den Abschluss mit Commit `7640ff018`. Dieser neue Befund ist ein Follow-up zur Präsentationsreihenfolge bei bereits feststehendem Spielende und öffnet P10 nicht nachträglich wieder.
- Aktueller UI-Schnitt in `apps/web/app/page.tsx`:
  - `matchEnded` wird bereits bei `winner` oder `resultSummary` wahr.
  - `showAccessReveal` verlangt derzeit ausdrücklich `!matchEnded`.
  - `showResultModal` wird unabhängig von einem noch nicht bestätigten Access-Ergebnis wahr.
  - `GameOverModal` und `AccessRevealModal` werden anschließend als getrennte Overlays gerendert.
- `retainedAccessRevealEvent` in `apps/web/app/action-board-ui.ts` darf ein Access-Reveal bereits über `steal_agenda` und `end_turn` hinweg behalten. Diese bestehende Retention soll für die Sequenz genutzt oder eng erweitert werden, statt einen zweiten Ergebniszustand zu erfinden.

## Scope

- Den konkreten Startfall regressieren: Runner greift R&D an, stiehlt eine Agenda, erreicht dadurch die Gewinnschwelle und ein `resultSummary` liegt sofort vor.
- Ein noch nicht bestätigtes, sichtbares Access-Ergebnis auch nach fachlich feststehendem Spielende anzeigen, sofern es zum abschließenden Agenda-Steal gehört.
- Im Access-Fenster die konkrete erbeutete Agenda und einen eindeutigen Abschlussstatus wie sinngemäß `Agenda erbeutet` darstellen; sichtbare Informationen bleiben viewer- und eventbasiert.
- Das Ergebnisfenster zurückhalten, solange dieses abschließende Access-Ergebnis noch nicht bestätigt beziehungsweise geschlossen wurde.
- Nach Bestätigung des Access-Fensters unmittelbar das bereits vorhandene Ergebnisfenster anzeigen, ohne weitere Engine-Aktion und ohne Verlust von `resultSummary`, Gewinner, Endgrund oder Serieninformationen.
- Die Lösung generisch für einen gewinnenden Agenda-Steal aus R&D, HQ, Archives oder einem Remote formulieren, mit R&D als verpflichtendem Regressionstest.
- Repräsentative Gegenfälle prüfen: normales Spielende ohne offenes Access-Ergebnis, nicht gewinnender Agenda-Steal sowie bereits bestätigtes Access-Ergebnis.

## Nicht im Scope

- Keine Änderung an Agenda-Punkten, Steal-Legalität, Gewinnschwelle, Gewinnerermittlung oder `checkWinConditions`.
- Keine Verzögerung des fachlichen Engine-Spielendes; nur die Reihenfolge der lokalen sichtbaren Overlays wird geändert.
- Keine neue Engine-`LegalAction` zum Bestätigen eines bereits aufgelösten Steals. Die Bestätigung ist in diesem Endzustand reine Präsentationsbestätigung.
- Kein Redesign von `GameOverModal`, `AccessRevealModal` oder der allgemeinen Run-/Access-UI.
- Keine Änderung an Auto-End für gewöhnliche Züge und keine Wiederöffnung des abgeschlossenen P10-Pakets.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder StateHash-Verträgen.

## Akzeptanzkriterien

- [x] Beim verpflichtenden R&D-Startfall bleibt nach dem gewinnenden Agenda-Steal zuerst das Access-Fenster sichtbar und zeigt die erbeutete Agenda mit eindeutigem Ergebnisstatus.
- [x] Das Gewinner-/Spielende-Fenster ist nicht gleichzeitig davor, darüber oder anderweitig interaktiv sichtbar.
- [x] Erst die ausdrückliche Bestätigung beziehungsweise das Schließen des Access-Ergebnisses gibt das Ergebnisfenster frei.
- [x] Nach dieser Bestätigung erscheint das Ergebnisfenster genau einmal mit unverändertem Gewinner, Endgrund, Endstand und gegebenenfalls Serieninformationen.
- [x] Der bereits beendete Matchzustand verlangt keine weitere Engine-Aktion; Access-Aktionsbuttons sind nicht fälschlich aktiv, die lokale Ergebnisbestätigung bleibt aber bedienbar.
- [x] Gewinnende Agenda-Steals aus HQ, Archives und Remotes folgen derselben Sequenz oder sind durch eine nachweislich gemeinsame generische Ableitung abgedeckt.
- [x] Normales Spielende ohne offenes Access-Ergebnis zeigt das Ergebnisfenster weiterhin sofort; ein nicht gewinnender Agenda-Steal behält den normalen Access-Ablauf.
- [x] Beide Seiten sehen nur die für sie zulässigen öffentlichen Informationen; es entstehen keine Hidden-Info-Leaks in UI, PlayerView, PublicEvents, WebSocket-Payloads oder Logs.
- [x] Fokussierte Webtests decken Overlay-Priorität, Bestätigung und Ergebnisfreigabe ab; Web-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Bevorzugt eine kleine, testbare Präsentationsableitung für `showAccessReveal` und `showResultModal` verwenden, statt die Reihenfolge nur über CSS-`z-index` zu kaschieren.
- `matchEnded` bleibt die fachliche Sperre für neue Spielaktionen. Für das retained Access-Ergebnis braucht es davon getrennt einen read-only-fähigen Präsentationspfad bis zur lokalen Bestätigung.
- Prüfen, ob `accessRevealFromLatestEvent` nach `steal_agenda` bereits ein passendes `outcomeStatus` und `dismissLabel` liefert. Falls nicht, das Ergebnis generisch aus öffentlichen Steal-/Access-Events ableiten.
- Wahrscheinliche Testorte sind `apps/web/app/action-board-ui.test.ts`, ein kleiner Page-/Presentation-Helper-Test und ein repräsentativer Chromium-E2E-Fall.

## Ergebnisnotiz

Die Match-Overlay-Priorität wird nun über einen kleinen reinen Helper abgeleitet. Bei einem Runner-Sieg durch Agendapunkte hält ein öffentliches, noch unbestätigtes `stolen`-Access-Ergebnis das Ergebnisfenster zurück. Das Access-Fenster zeigt die konkrete Agenda mit `Agenda … erbeutet` und `Agenda bestätigen`, bleibt am beendeten Match read-only und gibt nach lokaler Bestätigung unmittelbar das unveränderte Ergebnisfenster frei. R&D ist als Integrationsfall abgedeckt; HQ, Archive und Remote nutzen dieselbe öffentliche Ableitung.
