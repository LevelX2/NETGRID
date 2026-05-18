---
activityId: act-2026-05-17-ai-hints-role-gap-report
status: done
kind: concept
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/ai-hints-role-gap-report-2026-05-17.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - git diff --check
---

# AI-Hints- und Rollenlücken priorisiert berichten

## Ziel

Die aktiven AI-Hints, Rollen und Szenarioreferenzen sollen so ausgewertet werden, dass kleine Datenlücken sichtbar werden, bevor neue KI-Codeheuristiken unnötig komplex werden. Ergebnis soll eine priorisierte Liste kleiner Hint-/Szenario-Folgepakete sein.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitte `P1: AI-Hints Role Gap Report`, `Deck-/Karten-/Hint-Analyse` und `Offene Fragen / nicht belegte Annahmen`.
- Genannte Datenquellen: `data/ai/ai-card-hints-active.json`, `data/ai/card-role-manifest-0.9.json`, Catalog-Gate-Daten und aktuelle Runtime-/AI-Freigaben.
- Offene Zahlendifferenz aus der Analyse: aktive Hint-Zahlen und Release-Zielkarten müssen in künftigen Berichten sauber getrennt werden.

## Scope

- Karten ohne Rollen, `hinted_only`-Karten, fehlende SzenarioRefs und schwache Rollenabdeckung auswerten.
- Besonders priorisieren:
  - Breaker/ICE-Rollen für sichtbare Runanalyse,
  - Economy-/Draw-/Search-Rollen für Runner-Aufbau,
  - Remote-/Agenda-/Rezreserve-Rollen für Korp-Scoring,
  - Karten mit `ai_supported`, deren Hints strategisch zu flach sind.
- Einen Report unter `docs/derived/` oder einen vorhandenen AI-Reportpfad erzeugen.
- Für die wichtigsten Lücken konkrete, kleine Folgeactivities vorschlagen, aber nicht direkt alle Hints ändern.

## Nicht im Scope

- Keine Massenvergabe von Rollen ohne Szenario- oder Regelgrundlage.
- Keine automatische Promotion auf `ai_supported`.
- Keine Änderung an Runtime-Karten, Engine-Resolvern oder Decklegalität.
- Keine versteckten Gegnerinformationen in Hints.

## Akzeptanzkriterien

- [x] Der Report trennt aktive `ai_supported`-Karten, `hinted_only`, Runtime-/Release-Fakten und historische Zielkarten sauber.
- [x] Die wichtigsten Rollenlücken sind nach KI-Nutzen und Umsetzungsgröße priorisiert.
- [x] Mindestens drei konkrete kleinste Folgepakete sind benannt, z. B. Breaker/ICE, Economy oder Remote-Scoring.
- [x] Der Report nennt ausdrücklich, wo Datenlücken durch Quellenlage, Szenariomangel oder bewusstes Gate entstehen.
- [x] Keine AI-Hint-Änderung wird ohne eigenes Umsetzungs- und Smoke-Paket vorgenommen.

## Umsetzungshinweise

- Dieses Paket ist ein Analyse-/Planungsschnitt. Es soll schlechte breite Hint-Edits verhindern.
- Wenn maschinenlesbare Auswertung leicht möglich ist, ein kleines Script oder Testhelper-Ergebnis nutzen; andernfalls reicht ein nachvollziehbarer Markdown-Report.
- No-Cheat-Gate: Hints beschreiben erlaubte Kartennutzung und Rollen, nie gegnerische Hidden-Zonen.

## Ergebnisnotiz

Abgeschlossen mit `docs/reviews/ai/ai-hints-role-gap-report-2026-05-17.md`. Der Report trennt aktive Hint-Einträge, `ai_supported`, `hinted_only`, Runtime-Karten, Catalog-AI-Approvals und V1.9.22-Zielkarten. Benannte Folgepakete: Breaker/ICE-Rollen, Runner-Economy-/Draw-Smokes, Korp-Remote-Scoring-Rollen, `hinted_only`-Harness-Entscheidung und Zahlen-/Gate-Kontrakt. Keine Hints, Runtime-Karten, Freigaben oder Decklegalität wurden geändert.
