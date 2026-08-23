---
activityId: act-2026-08-23-corp-zone-choice-family-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Choice-Familien, CardSpec-Quote und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Corp-Zone-Choice-Familien modularisieren

## Ziel

Prüfen, ob `corp-zone-choice-handlers.ts` entlang HQ-Reveal,
HQ/R&D-Shuffle und Score-Time-Hidden-Zone-Sequenzen geteilt werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Wirtschaftliche Raten werden inzwischen aus dem gebundenen CardSpec
  revalidiert und nicht mehr aus Source-Strings autorisiert.
- Aktivierungsauslöser: nächste neue Corp-Hidden-Zone-Choice oder Änderung an
  mehreren dieser Familien.

## Scope

- Gemeinsame Validierung und zonenspezifische Resolver abgrenzen.
- Typisierte Continuations und CardSpec-Quote als harte Verträge festhalten.
- Bei positivem Ergebnis Folgepakete pro Choice-Familie anlegen.

## Nicht im Scope

- Änderung von Reveal-, Shuffle-, Credit- oder Score-Regeln.
- Fachparameter wieder in freie Source-Strings verlagern.

## Akzeptanzkriterien

- [ ] Jede Choice-Familie besitzt genau einen Resolver-Owner.
- [ ] Source-Karte, CardSpec-Rate und State-Version bleiben exakt gebunden.
- [ ] Keine verdeckte Karteninformation gelangt in öffentliche Payloads.
- [ ] Replay und RNG-Reihenfolge bleiben deterministisch.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. HQ-Reveal, HQ/R&D-Shuffle und
Score-Time-Sequenzen besitzen getrennte Resolverpfade; sie teilen bewusst den
einzigen Dispatcher sowie Source-/CardSpec-/StateVersion-Revalidierung.
`3e8afe801` berührte zwei Familien, um genau denselben CardSpec-Quotevertrag
fail-closed zu binden, und belegt damit gemeinsame Autorität statt schädlicher
Kopplung. Die Activity wurde danach angelegt; seitdem gab es keine weitere
Änderung. Keine Folge-Activity; beim Trigger nur zonenspezifische Mutation
extrahieren und den gemeinsamen Validierungsowner erhalten.
