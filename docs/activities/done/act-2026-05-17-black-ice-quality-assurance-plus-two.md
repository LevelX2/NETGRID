---
activityId: act-2026-05-17-black-ice-quality-assurance-plus-two
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - apps/web/app/score-area-ui.ts
  - apps/web/app/score-area-ui.test.ts
checks:
  - corepack pnpm install --frozen-lockfile
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Black Ice Quality Assurance"
  - corepack pnpm --filter @netgrid/web exec vitest run app/score-area-ui.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Black Ice Quality Assurance: Black-ICE-Bonus +2 prüfen

## Ziel

Die gescorte Agenda `Black Ice Quality Assurance` soll nach Nutzerangabe allem Black ICE `+2 Stärke` geben; Berechnung und UI-Chip müssen damit konsistent sein.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: `Cinderella` liegt als geresstes Black ICE aus, zeigt aber nur `+1 Stärke`; erwartet ist `+2`.
- Lokale Kartenanker: `onr_v1_191_black-ice-quality-assurance`, `onr_v1_228_cinderella`.

## Scope

- Lokalen Kartentext/Regelstand gegen Nutzererwartung prüfen.
- Agenda-Modifier-Wert, Black-ICE-Erkennung und Layering prüfen.
- UI-Chip und berechnete Stärke gemeinsam korrigieren.
- Recalculation nach Scoring und bei bereits ausliegendem ICE testen.

## Nicht im Scope

- Keine generelle Modifier-Pipeline neu bauen, sofern ein fokussierter Fix reicht.
- Keine Änderung an Cinderella selbst außer Subtype-/Tag-Erkennung, falls diese Ursache ist.

## Akzeptanzkriterien

- [x] Gesicherter Regelstand für `Black Ice Quality Assurance` ist geprüft.
- [x] Falls Nutzererwartung korrekt ist: Black ICE erhält rechnerisch und sichtbar `+2 Stärke`.
- [x] Bereits ausliegendes geresstes ICE wird nach Scoring neu berechnet.
- [x] UI-Chip, Kartenstärke und Chronik/Eventdaten widersprechen sich nicht.
- [x] Regression deckt Cinderella als Black ICE ab.

## Umsetzungshinweise

- Falls lokale Daten absichtlich `+1` modellieren, Regelkonflikt sichtbar dokumentieren und Folgeentscheidung statt stiller Änderung anlegen.

## Ergebnisnotiz

Abgeschlossen. `docs/source/Corpspoiler 1.0.txt` bestätigt `All black ice has +2 strength.`; die Engine addiert für gescorte `Black Ice Quality Assurance` jetzt `+2` auf `black_ice`-ICE. Der bestehende scored-only-Test nutzt nun bereits gerezzte `Cinderella` und prüft 6 -> 8 nach Scoring sowie Rückfall auf 6, wenn die Agenda nicht mehr in der Korp-ScoreArea liegt. Der sichtbare Score-Area-Effektchip zeigt `Black ICE hat +2 Stärke`, und der lokale Kartentext nennt den `+2`-Vertrag. Fokussierte Engine-/Web-Tests, Typechecks und `git diff --check` sind grün; keine offenen Folgepunkte im Paketscope.
