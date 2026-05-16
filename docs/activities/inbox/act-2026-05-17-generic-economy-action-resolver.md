---
activityId: act-2026-05-17-generic-economy-action-resolver
status: inbox
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-17-card-effect-generic-resolver-analysis
resultArtifacts: []
checks: []
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

Noch offen.
