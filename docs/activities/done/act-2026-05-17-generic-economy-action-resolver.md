---
activityId: act-2026-05-17-generic-economy-action-resolver
status: done
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-card-effect-generic-resolver-analysis
resultArtifacts:
  - packages/engine/src/mechanics/payment-costs.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "omniscience-source|South African Mining Corp"
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Generischen Economy-Action-Resolver schneiden

## Ziel

Einfache Kartenfähigkeiten, die Aktionen/Klicks gegen Credits oder Credit-Replacements abbilden, sollen über ein kleines typisiertes Profil statt über weitere Einzelroutinen laufen.

## Kontext und Quellen

- Analyse: `docs/derived/CARD_EFFECT_GENERIC_RESOLVER_ANALYSIS_2026_05_17.md`.
- Hotspots: `packages/engine/src/index.ts` bei rezzed Corp Asset/Node LegalActions und `gain_credit`-Resolverzweigen.
- Musterkarten: einfache Corp Economy Assets, `Investment Firm`, `South African Mining Corp`.

## Scope

- Kleines `EconomyActionProfile`-Modell entwerfen und in einem passenden Mechanics-Modul verankern.
- LegalAction-Erzeugung für mindestens zwei einfache Economy-Fähigkeiten über das Profil laufen lassen.
- `applyAction` über denselben Profilvertrag revalidieren.
- Profilfelder bewusst begrenzen: Side, Timing, Quelle, Clickkosten, Creditkosten, Creditgain, optional Source-Trash und optional Basic-Credit-Replacement.
- Bestehende PublicPayload- und Replay-Semantik beibehalten.

## Nicht im Scope

- Keine freie Skriptsprache.
- Keine breite Migration aller Economy-Karten.
- Keine Änderung an komplexen Hidden-Zone-, Trace- oder Replacement-Familien.
- Keine Änderung am WebSocket-/API-Vertrag.

## Akzeptanzkriterien

- [ ] Mindestens zwei bisher getrennte einfache Economy-Fähigkeiten nutzen denselben Profil-/Resolverpfad.
- [ ] `applyAction` revalidiert Quelle, Side, Timing, Kosten und aktuellen Install-/Rez-/Score-Zustand.
- [ ] PublicPayloads bleiben side-safe und enthalten die nötigen Beträge/Quellen.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Fokussierte Engine-Tests decken beide Profilnutzer und einen Ablehnungsfall ab.

## Ergebnisnotiz

Erledigt. `EconomyActionProfile` liegt jetzt im Payment-/Economy-Mechanics-Modul und beschreibt einfache installierte Korp-Economy-Aktionen deklarativ. Die LegalAction-Erzeugung und `gain_credit`-Auflösung nutzen denselben Profilvertrag für die bisherigen 2-Credit-Economy-Assets und South African Mining Corp. Die Revalidation prüft Side, Korp-Aktionsphase, rezzed installierte Quelle, Profil-/Payload-Zuordnung, Creditbetrag und Trash-Parameter. Bestehende PublicPayload-/Replay-Semantik bleibt erhalten; der South-African-Test ergänzt einen Ablehnungsfall für nicht mehr rezzed installierte Quellen.
