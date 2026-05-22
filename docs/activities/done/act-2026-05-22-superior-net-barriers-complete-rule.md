---
activityId: act-2026-05-22-superior-net-barriers-complete-rule
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - data/cards/originalset-v1-cards.json
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/engine/src/public-context.ts
  - packages/catalog/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t 'Superior Net Barriers|Encryption Breakthrough'
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t 'Superior Net Barriers|Priority Requisition'
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog typecheck
  - git diff --check -- data/cards/originalset-v1-cards.json packages/shared/src/index.ts packages/engine/src/index.ts packages/engine/src/index.test.ts packages/engine/src/public-context.ts packages/catalog/src/index.test.ts apps/web/app/chronicle.ts apps/web/app/chronicle.test.ts docs/activities/in-progress/act-2026-05-22-superior-net-barriers-complete-rule.md
---

# Superior Net Barriers vollständig umsetzen

## Ziel

`Superior Net Barriers` muss als gescorte Agenda dauerhaft alle Walls um +1 Stärke erhöhen und beim Scoren beliebig viele Walls revealen lassen, danach 1 Credit/Bit für jede revealed oder rezzed Wall geben.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Regel ist offenbar unvollständig hinterlegt oder umgesetzt.
- Solltext laut Nutzer: `All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain [1] for each revealed or rezzed wall.`
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/agendas/superior-net-barriers.ts` enthält einen scored modifier für Wall-Stärke und einen scoredAgenda-Resolver `reveal_installed_ice_subtype_for_credits`.
- Nutzererwartung: Stärkeänderung muss visuell am ICE erkennbar sein.

## Scope

- Prüfen, ob alle Regelteile umgesetzt sind: permanenter Wall-Modifier, optionale Mehrfach-Reveal-Auswahl, Credit-Gewinn für revealed und bereits rezzed Walls.
- Choice-UI und Engine so absichern, dass die Korp beliebig viele passende Walls wählen und auch null wählen kann.
- Creditzählung nach Abschluss der Reveal-Auswahl berechnen und bereits rezzed Walls mitzählen.
- Visuelle Stärkeanzeige bzw. Modifier-Hinweis für Walls prüfen und bei Bedarf ergänzen.
- Chronikmeldungen für Reveal, Credit-Gewinn und aktiven Stärkeeffekt verständlich halten.

## Nicht im Scope

- Keine generische Neugestaltung aller ICE-Modifier-Badges.
- Keine Änderung an Nicht-Wall-ICE.
- Keine Runner-Information über unrevealed/unrezzed Nicht-Wall-Karten.
- Keine KI-Strategieänderung jenseits der Fähigkeit, legale Choice-Optionen zu bewerten.

## Akzeptanzkriterien

- [x] Gescortes `Superior Net Barriers` erhöht die effektive Stärke aller Corp-Walls um 1.
- [x] Die Stärkeänderung ist in der ICE-Anzeige nachvollziehbar.
- [x] Beim Scoren kann die Korp null, eine oder mehrere unrezzed Walls revealen.
- [x] Credit-Gewinn zählt alle durch den Trigger revealed Walls plus alle bereits rezzed Walls.
- [x] PublicEvents/PlayerViews leaken keine verdeckten Nicht-Ziele oder nicht gewählten verdeckten Karten.
- [x] Tests decken Modifier, null/mehrere Reveals, bereits rezzed Walls, Creditbetrag, Chronik und StateHash ab.

## Umsetzungshinweise

- Prüfen, ob `revealed` in diesem Codepfad ein dauerhafter öffentlicher Kartenzustand, ein temporäres Reveal-Event oder eine bestehende `faceup`/`rezzed`-Nähe meint. Falls unklar, zuerst eng dokumentieren und den kleinsten regelkonformen Pfad wählen.
- Nicht anhand sichtbarer UI-Gruppierung auf Kartentypen schließen; Choice-Optionen müssen side-sicher bleiben.

## Ergebnisnotiz

Erledigt. Der gemeinsame Scored-Agenda-Reveal-Resolver öffnet für passende verdeckte ICE jetzt eine Korp-private Mehrfachauswahl mit `minSelections: 0`; `Superior Net Barriers` kann dadurch null, eine oder mehrere Walls aufdecken. Der Credit-Gewinn zählt die gewählten Reveals plus bereits faceup/rezzed passende ICE. Die permanente Wall-Stärke bleibt aktiv und wird in der ICE-Anzeige geprüft. Öffentliche Events enthalten nur resolved Reveal-/Rezzed-Zählungen und keine Kandidatenanzahl verdeckter nicht gewählter Karten.
