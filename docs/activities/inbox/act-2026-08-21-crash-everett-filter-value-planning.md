---
activityId: act-2026-08-21-crash-everett-filter-value-planning
status: inbox
kind: concept
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Crash Everetts zusätzliche Kartensichtung planbezogen bewerten

## Ziel

Prüfen und gegebenenfalls umsetzen, wie die bestehende Runner-Planung den
zusätzlichen Filter- und Auswahlwert von Crash Everett bewertet, ohne den
Netto-Handzuwachs, Draw Taxes oder die Engine-Regelautorität erneut abzubilden.

## Kontext und Quellen

- Regel-Engine-Review Batch 2 vom 2026-08-21, Finding F-07.
- Der private LegalAction-Vertrag liefert bereits getrennte Werte für
  Brutto-Draws, Disposition, Netto-Handzuwachs und sichtbare Draw-Tax-Quellen.
- Economy- und Draw-Tax-Projektion konsumieren diese Fakten bereits korrekt.
- Offen ist nur der strategische Wert, zwei Karten zu sehen und eine davon
  auszuwählen beziehungsweise zurückzulegen oder zu trashen.

## Scope

- Vor dem ersten Codepatch den verbindlichen KI-Architektur-Preflight lesen
  und den bestehenden fachlichen Plan-Owner der Draw-vs.-Alternativen bestimmen.
- Baselinefälle definieren, in denen zusätzliche Kartensichtung relevant oder
  bewusst irrelevant ist.
- Eine planbezogene, generische Bewertung aus strukturierten Draw-Fakten
  ergänzen, falls die Evidence einen stabilen Nutzen zeigt.
- Ergebnis-, Ownership- und direkt angrenzende Regressionstests ergänzen und
  den Effekt mit der AI Behavior Baseline oder gezieltem Selfplay vergleichen.

## Nicht im Scope

- Änderung von Draw-Ausführung, Crash-Choice, Draw Taxes oder LegalAction-ID.
- Neuer Choice-Resolver, paralleler Draw-Plan oder kartennamebasierte
  Sonderheuristik.
- Annahmen über verdeckte Stack-Karten oder unbekannte Corp-Tax-Quellen.
- Pauschaler Draw-Bonus, der Run-, Installations- oder Economy-Pläne überstimmt.

## Akzeptanzkriterien

- [ ] Der bestehende Plan/Step/Route-Owner ist vor der Umsetzung benannt.
- [ ] Die Bewertung nutzt ausschließlich die side-sichere strukturierte
      Runner-Draw-Projektion.
- [ ] Netto-Handzuwachs und Brutto-Kartensichtung bleiben getrennte Signale.
- [ ] ActionId, Executor, PlanExecutionOrigin und Choice-Ownership bleiben
      unverändert; es entsteht keine zweite Entscheidungsautorität.
- [ ] Fokussierte Tests sichern sowohl nützliche als auch bewusst neutrale
      Situationen.
- [ ] Vorher-/Nachher-Evidence zeigt keine allgemeine Draw-Überbewertung oder
      Verschlechterung unter sichtbaren Draw Taxes.

## Umsetzungshinweise

- Primärer Folgeagent ist `card-enablement-ai-knowledge-agent`; für eine
  tatsächliche KI-Änderung gelten zusätzlich `packages/ai/AGENTS.md` und der
  AI-Änderungskompass.
- Eine card-spezifische Konstante ist nur zulässig, wenn sie bestehende
  strukturierte Mechaniksemantik parametrisiert und keine Parallelstrategie
  erzeugt.

## Ergebnisnotiz

Noch offen.
