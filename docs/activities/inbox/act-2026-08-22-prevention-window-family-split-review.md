---
activityId: act-2026-08-22-prevention-window-family-split-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Prevention-Window-Effektfamilien schneiden

## Ziel

Bewerten, ob Choice-Erzeugung, Stage-Fortsetzung und die Auflösung von Damage,
Tags und installiertem Trash aus `prevention-window.ts` getrennt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Der korrigierte Passvertrag muss niedrigere Prioritätsstufen für alle
  Eventtypen erhalten.
- Aktivierungsauslöser: nächste Event-Modification-Familie oder erneute
  Änderung in mehreren eventtypspezifischen Zweigen.

## Scope

- Gemeinsame Stage-Maschine und eventtypspezifische Resolver abgrenzen.
- Eine kleine Zielstruktur ohne zweiten Candidate-Collector bewerten.
- Bei positivem Ergebnis je Effektfamilie ein Folgepaket anlegen.

## Nicht im Scope

- Änderung von Candidate-Prioritäten, Kosten oder Prevention-Regeln.
- Duplizierte Choice- oder Continuation-Autorität.

## Akzeptanzkriterien

- [ ] Pass, partielle Vermeidung und vollständige Vermeidung bleiben je Eventtyp abgedeckt.
- [ ] Stage-Reihenfolge und persistierte Fensterfolge bleiben deterministisch.
- [ ] Ein Split erhält Replay-, Hidden-Info- und StateVersion-Verträge.

## Umsetzungshinweise

- Die neuen Tag-Prioritätsregressionen gehören zur Pflicht-Evidence.

## Ergebnisnotiz

Noch offen.
