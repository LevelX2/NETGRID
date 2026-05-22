---
activityId: act-2026-05-22-match-series-overall-winner-result
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/result-modal-ui.ts
  - apps/web/app/result-modal-ui.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/result-modal-ui.test.ts"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
---

# Match-Serie: Gesamtsieger im Siegbildschirm anzeigen

## Ziel

Wenn eine Match-Serie endet, soll der Siegbildschirm groß und eindeutig den Gesamtsieger der Match-Serie mit Teilnehmernamen anzeigen.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Nach Ende einer Match-Serie zeigt der Siegbildschirm offenbar nur den Gewinner des letzten Einzelspiels.
- Erwartung: Der Siegbildschirm soll deutlich den Gesamtsieger der Match-Serie anzeigen, idealerweise mit konkretem Teilnehmernamen, zum Beispiel `Ludwig hat die Match-Serie gewonnen` oder `Korp-KI hat die Match-Serie gewonnen`.
- Nutzerhinweis: Eine reine Seitenangabe wie `Korp hat gewonnen` reicht nicht, insbesondere wenn ein Spieler- oder KI-Name vorhanden ist.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-19-result-modal-winner-visual-replay-save-label.md` verbesserte Ergebnisfenster, Siegergrafik und Serienpfade, deckt den gemeldeten Gesamtsieger-Fall aber offenbar nicht ausreichend ab.
- Relevante Spezifikation: `docs/releases/special/s01/match-series-spec.md`.

## Scope

- Ergebnisdaten und UI-State für abgeschlossene Match-Serien prüfen.
- Ermitteln, ob Gesamtwertung, Teilnehmernamen und letzter Einzelspiel-Sieger im Client bereits getrennt verfügbar sind.
- Siegbildschirm so anpassen, dass bei Serienende der Gesamtsieger primär angezeigt wird.
- Falls vorhanden, Teilnehmernamen statt nur Seiten verwenden.
- Einzelspiel-Gewinner weiterhin als sekundäre Information anzeigen, falls nützlich.
- Draw-/Gleichstand- und Abbruchzustände sauber behandeln.

## Nicht im Scope

- Keine Änderung an der eigentlichen Serienwertung oder Game-End-Engine-Logik, außer eine nachweisliche falsche Datenübergabe wird gefunden.
- Kein neues Matchserien-Format.
- Keine neuen KI-Namen- oder Account-Funktionen.
- Kein Redesign des gesamten Result Modals.

## Akzeptanzkriterien

- [x] Bei abgeschlossener Match-Serie ist der Gesamtsieger die größte und klarste Ergebnisinformation.
- [x] Wenn Teilnehmernamen verfügbar sind, werden diese verwendet.
- [x] Der Gewinner des letzten Einzelspiels wird nicht mit dem Gesamtsieger verwechselt.
- [x] Draw/Gleichstand/Abbruchzustände haben verständliche Texte.
- [x] Result-Modal-Tests decken mindestens Serienende mit Runner-Gesamtsieg, Korp-Gesamtsieg und abweichendem letztem Einzelspiel-Sieger ab.
- [x] Hidden-Info-, Replay- und StateHash-Grenzen bleiben unverändert.
- [x] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind `GameOverModal`, `GameResultSummary`, Serienstatus im Webclient und vorhandene Result-Modal-Tests.
- Wenn die nötigen Teilnehmernamen nicht im UI-State ankommen, kleinsten server-/shared-seitigen DTO-Fix schneiden und keine größere Serienarchitektur ändern.

## Ergebnisnotiz

Bei abgeschlossener Serie zeigt das Result Modal jetzt die Serienentscheidung als große Überschrift. Gewinnt der Viewer die Serie, steht `Du hast die Match-Serie gewonnen.`; verliert er, wird der vorhandene Gegenseitenname verwendet, z. B. `Korp-KI hat die Match-Serie gewonnen.`; bei Gleichstand steht `Die Match-Serie endet unentschieden.`. Das letzte Einzelspiel bleibt als sekundärer Untertext sichtbar (`Letztes Spiel: ...`), sodass Einzelspiel- und Seriengewinner nicht mehr verwechselt werden. Die aktuelle ResultSummary enthält keinen eigenen Teilnehmer-Anzeigenamen des Viewers; deshalb nutzt die UI für den lokalen Spieler weiterhin `Du`. Es wurden nur UI-Texte/Helper angepasst, keine Serienwertung, Replay- oder StateHash-Daten.
