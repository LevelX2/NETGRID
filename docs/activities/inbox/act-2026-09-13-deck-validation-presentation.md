---
activityId: act-2026-09-13-deck-validation-presentation
status: inbox
kind: fix
area: shared
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-13
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Deckvalidierung aus strukturierten Issues lokalisieren

## Ziel und belegter Befund

Normale Deckfehler und Warnungen werden in DE/EN/FR vollständig lokalisiert.
`DeckValidationSummary.tsx` zeigt aktuell rohe Validator-Strings; der lokale
Snapshotpfad in `page.tsx` fügt dieselben Texte zu einem Fehler zusammen.
Das I18N-Literal-Gate ist grün, erfasst diese dynamischen Texte jedoch nicht.
Quelle: [Präsentationsgrenzen](../../architecture/localization/engine-presentation-boundaries.md).

## Scope

- Im bestehenden Deckvalidator vollständige strukturierte Issues mit stabilen
  Codes, Schweregrad und exakten side-sicheren Parametern liefern, einschließlich
  Größen-/Agenda-Spannen, Kartenfehlern, Warnungen und Snapshot-Integrität.
- Ein Web-Formatter lokalisiert die Issues in DE/EN/FR. Decksummary und lokale
  Matchstartprüfung konsumieren denselben Vertrag; API-Transport prüfen.
- Fehlende Issue-Verträge scheitern strukturiert. Keine Regexübersetzung,
  kein raw-English-Fallback, kein Legacy-Dual-Read.
- Aktuelle interne Fixtures/Tests bei Bedarf konsistent neu erzeugen.
- Fokussiertes Source-/Consumer-Gate verhindert rohe Deckdiagnose in den
  normalen Nutzersurfaces; bestehende Diagnose-Ausnahmen bleiben erhalten.

## Nicht im Scope

Engine-Regeln, Spielactions, Decklisten, allgemeine Serverfehlermigration,
privilegierte Debugtexte, gedruckte Kartentitel oder historische Replay-Reparatur.

## Akzeptanzkriterien

- [ ] Alle vom Deckvalidator erzeugten Fehler-/Warnfamilien besitzen einen Issue-Vertrag.
- [ ] DE/EN/FR zeigen korrekte Karten-/Zahlparameter und getrennte untere/obere Agenda-Grenzen.
- [ ] Editor und lokale Matchstartdetails zeigen keine rohen Validator-Sätze.
- [ ] JSON/API-Übertragung bewahrt Issues; Hidden-Info-Grenzen bleiben unverändert.
- [ ] Fokussierte Deck-/Webtests, betroffene Typechecks, I18N-Gate und diff-check bestehen.

## Ergebnisnotiz

Noch offen. Umsetzung durch den allgemeinen Activities-Auftrag autorisiert.
