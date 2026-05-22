---
activityId: act-2026-05-22-skivviss-counter-ownership-and-draw-log
status: done
kind: fix
area: cards
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "adds Skivviss counters on successful R&D runs and converts them into Corp start-turn draws"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "names Skivviss as the reason for automatic Corp extra draws"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Skivviss-Counter: Besitzer, Anzeige und Zusatzdraw-Log

## Ziel

`Skivviss` soll regeltechnisch korrekt Counter zuordnen, diese side-sicher und verständlich anzeigen und zusätzliche Corp-Draws in der Spielchronik nachvollziehbar begründen.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Skivviss-/Virus-Counter werden offenbar auf der Runner-Karte oder direkt bei `Skivviss` angezeigt.
- Gemeldeter Kartentext: `Whenever you make a successful run on R&D, give the Corp a Skivviss counter.`
- Nutzererwartung: Die Counter gehören wahrscheinlich zur Corp und sollen als Corp-zugeordnete Skivviss-/Virus-Counter sichtbar sein, optional mit Referenz auf die verursachende Runner-Karte.
- Nutzerfund vom 2026-05-22: Wenn die Corporation wegen Skivviss-Countern zusätzliche Karten zieht, erklärt die Chronik den Grund nicht klar.
- Verwandte erledigte Vorarbeiten:
  - `docs/activities/done/act-2026-05-21-counter-display-public-view-contract.md`
  - `docs/activities/done/act-2026-05-21-web-render-counter-displays.md`
  - `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md`

## Scope

- Regelquelle und lokale Kartendefinition von `Skivviss` prüfen.
- Klären, ob Skivviss-Counter im GameState an Corp, Runner-Karte, Karte plus Besitzer oder anderer Struktur hängen sollen.
- Engine-State, PublicView/PlayerView und Web-Anzeige für den korrekten Counter-Ort prüfen und korrigieren.
- Chronikereignisse für zusätzliche Corp-Draws durch Skivviss-Counter ergänzen oder präzisieren.
- Bei mehreren Countern die konkrete Anzahl im Log nennen.
- Regressionen für Counter-Zuordnung, Anzeige und Draw-Effekt ergänzen.

## Nicht im Scope

- Keine generische Neudefinition aller Virus-Counter.
- Keine Änderung an der allgemeinen Virus-Counter-Entfernungsregel; dafür gibt es `act-2026-05-22-virus-purge-action-debt-rule`.
- Keine Hidden-Info-Offenlegung aus R&D, Stack, Hand oder Reconnect-Payloads.
- Keine Änderung an zufallsbasierten Draw-/Shuffle-Verträgen außer der Skivviss-spezifischen Folge.

## Akzeptanzkriterien

- [x] Die Regelinterpretation von `Skivviss` ist gegen die lokale Quelle geprüft und im Ergebnis benannt.
- [x] Skivviss-Counter werden regeltechnisch am korrekten Ort gespeichert oder projiziert.
- [x] Die UI zeigt die Counter am korrekten Ort verständlich an, ohne eine zweite Regelautorität zu erzeugen.
- [x] Zusätzliche Corp-Draws wegen Skivviss-Countern erzeugen einen klaren Chronikeintrag mit Kartenname und Anzahl.
- [x] PublicEvents, PlayerViews, Reconnect und Logs leaken keine verdeckten Kartendaten.
- [x] Replay und StateHash bleiben stabil.
- [x] Checks: passende Engine- und Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- CounterDisplay-Vertrag nutzen, falls die UI nur eine öffentliche Anzeige braucht.
- Falls die Engine aktuell Kartencounter als einfachsten Speicherort nutzt, klar trennen zwischen Regelzustand und Anzeigeprojektion.

## Ergebnisnotiz

Abgeschlossen am 2026-05-22. Die lokale Kartendefinition bestätigt `Skivviss` als `give the Corp a Skivviss counter`; der interne Counter bleibt für die bestehende Virus-/Purge- und Start-of-turn-Engine auf der verursachenden `Skivviss`-Instanz gespeichert, wird in PlayerViews aber nicht mehr auf der Runner-Karte angezeigt. Stattdessen projiziert die Korp-Identität einen öffentlichen `Skivviss-Counter`-CounterDisplay für beide Seiten. Der automatische Korp-Zusatzdraw bleibt side-sicher und benennt in der Chronik jetzt `Skivviss`, Counteranzahl und Zusatzkarten. Fokussierte Engine-/Web-Tests, Engine-/Web-Typecheck und `git diff --check` sind grün.
