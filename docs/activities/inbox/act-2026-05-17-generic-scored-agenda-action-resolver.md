---
activityId: act-2026-05-17-generic-scored-agenda-action-resolver
status: inbox
kind: architecture
area: engine
priority: normal
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

# Generischen Resolver für scored Agenda-Aktionen schneiden

## Ziel

Scored Agenda-Aktionen mit einfachen Kosten und Effekten sollen als begrenzte Profilfamilie modelliert werden, statt in der Score-Area-LegalAction-Erzeugung und im Resolver weiter einzeln zu wachsen.

## Kontext und Quellen

- Analyse: `docs/derived/CARD_EFFECT_GENERIC_RESOLVER_ANALYSIS_2026_05_17.md`.
- Vorhandener Ansatz: `resolveAgendaCounterOperation` und Agenda-ID-Sets in `packages/engine/src/mechanics/agenda-scoring.ts`.
- Betroffene Muster: Creditgain, Trace starten, Counter entfernen/ausgeben, einfache scored Agenda-Fähigkeiten.

## Scope

- Profilmodell für scored Agenda-Aktionen mit Side, Kosten, Timing und kleinem Effektkatalog entwerfen.
- Mindestens zwei scored Agenda-Aktionen über den gemeinsamen Resolver abbilden.
- Score-Area-LegalAction-Erzeugung auf das Profil stützen.
- Existing Tests fokussiert anpassen oder ergänzen.

## Nicht im Scope

- Keine Migration komplexer Agenda-Sonderfälle mit mehrstufigen Choices.
- Keine Änderung an Agenda-Scoring-, Steal- oder Punkte-Regeln.
- Keine Runtime-Schema-Sprache.

## Akzeptanzkriterien

- [ ] Mindestens zwei scored Agenda-Aktionen nutzen denselben Profil-/Resolverpfad.
- [ ] Kosten, Quelle, Side, Score-Area-Zustand und Timing werden in `applyAction` revalidiert.
- [ ] PublicPayload und Action-Labels bleiben verständlich.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Tests decken erfolgreiche Nutzung und mindestens einen illegalen Zustand ab.

## Ergebnisnotiz

Noch offen.
