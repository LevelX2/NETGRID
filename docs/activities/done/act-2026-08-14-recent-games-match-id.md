---
activityId: act-2026-08-14-recent-games-match-id
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-14
startedAt: 2026-08-16
completedAt: 2026-08-16
branch: codex/activities-worktree-20260816-130613
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/features/recent/RecentGamesPanel.tsx
  - apps/web/app/globals.css
  - apps/web/app/recent-games-match-id.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/recent-games-match-id.test.ts app/replay-return-navigation.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Vollständige Match-ID in „Meine Spiele“ anzeigen

## Ziel

Jedes in „Meine Spiele“ aufgeführte Einzelspiel zeigt seine vollständige
Match-ID als dezente, direkt ablesbare Information. Damit lässt sich ein Spiel
bei Bugs oder Rückfragen ohne den Umweg über die Storage-Maintenance eindeutig
zuordnen.

## Kontext und Quellen

- Nutzerfund vom 2026-08-14: „Meine Spiele“ zeigt Ergebnis-, Deck- und
  Replay-Informationen, aber keine direkt nutzbare vollständige Match-ID.
  Für Bug-Informationen muss die passende ID derzeit erst in der Maintenance
  gesucht werden.
- `apps/web/features/recent/RecentGamesPanel.tsx` rendert die Einzelergebnisse
  in `RecentGameResultCard` sowie Einzelspiele innerhalb einer
  `RecentSeriesResultCard`; beide Pfade verfügen bereits über `matchId`.
- Die Maintenance stellt die vollständige Match-ID bewusst als
  Diagnoseinformation bereit und kann sie kopieren. Die Ergebnisübersicht
  benötigt für die Anzeige keine neue Server- oder Maintenance-API.

## Scope

- In „Meine Spiele“ bei jedem Einzelergebnis die vollständige Match-ID klein
  und klar beschriftet darstellen, beispielsweise als `Match-ID: <code>…</code>`.
- Auch die einzelnen Spiele einer Matchserie mit ihrer jeweiligen vollständigen
  Match-ID versehen; eine Serien-ID ersetzt die Match-ID des konkreten Spiels
  nicht.
- Die Anzeige so gestalten, dass lange IDs die Ergebnisübersicht auf schmalen
  Breiten nicht horizontal sprengen oder wichtige Ergebnis- und
  Aktionsinformationen überdecken. Umbruch an zulässigen Zeichen ist erlaubt.
- Wenn sich die Anzeige ohne zusätzlichen UI-Ballast an ein vorhandenes
  Kopier-Pattern anbinden lässt, die vollständige ID direkt kopierbar machen;
  die sichtbare, vollständige ID bleibt jedoch die Mindestanforderung.
- Einen fokussierten Web-Test ergänzen oder erweitern, der die vollständige ID
  in Einzelspiel- und Serien-Einzelspielpfad absichert.

## Nicht im Scope

- Änderungen am Match-ID-Format, der Ergebnis-Persistenz oder den
  Maintenance-/Diagnose-APIs.
- Neue Bug-Meldeformulare, automatischer Maintenance-Zugriff oder größere
  Änderungen an der Ergebnisansicht.
- Anzeige von Sitzungs-Token, Recovery-Links, privaten Karten- oder anderen
  Diagnoseinhalten neben der Match-ID.

## Akzeptanzkriterien

- [x] Ein einzelnes Ergebnis unter „Meine Spiele“ zeigt seine vollständige,
  nicht nur verkürzte Match-ID direkt in der Oberfläche und mit eindeutiger
  Beschriftung.
- [x] Jedes einzelne Spiel einer angezeigten Matchserie zeigt ebenfalls seine
  eigene vollständige Match-ID; die Serien-ID bleibt davon unterscheidbar.
- [x] Die Anzeige ist bewusst klein und sekundär, bleibt aber ohne Hover oder
  Wechsel in die Maintenance vollständig lesbar beziehungsweise kopierbar.
- [x] Lange Match-IDs verursachen weder horizontalen Overflow noch verdecken
  sie Ergebniswerte, Replay-Link oder Protokoll-Download auf schmalen
  Ansichten.
- [x] Die Anzeige gibt ausschließlich die bereits für das Ergebnis bestimmte
  Match-ID aus und offenbart keine Tokens oder weiteren privaten
  Match-/Spielerdaten.
- [x] Ein fokussierter Regressionstest deckt Einzelspiel und Serien-Einzelspiel
  ab.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- `RecentGamesPanel.tsx` als Ausgangspunkt nutzen; die IDs sind in den
  Ergebnisobjekten bereits vorhanden. Keine zusätzliche Abfrage und keinen
  Ersatzwert einführen, falls eine erwartete ID fehlt; diesen Datenfehler
  sichtbar behandeln.
- Für kompakte technische Kennungen vorhandene `<code>`- und responsive
  Umbruchmuster der Anwendung nutzen. Eine reine `title`- oder Tooltip-Lösung
  genügt nicht, weil die ID bei einer Bug-Meldung unmittelbar verfügbar sein
  soll.

## Ergebnisnotiz

Einzelspiele und jedes Spiel einer Serie zeigen nun die vorhandene vollständige
Match-ID mit eindeutiger Beschriftung direkt in „Meine Spiele“. Die kleine
Code-Darstellung darf über zulässige Stellen umbrechen und spannt bei
Serienspielen eine eigene Grid-Zeile auf. Eine leere erwartete Match-ID wird
als unvollständiger Ergebnisdatensatz sichtbar ausgewiesen; es wird keine
Ersatzkennung verwendet.
