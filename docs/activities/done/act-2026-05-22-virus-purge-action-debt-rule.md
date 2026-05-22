---
activityId: act-2026-05-22-virus-purge-action-debt-rule
status: done
kind: fix
area: engine
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "installs a virus program and lets the Corp purge only virus counters"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "exposes action ordinal metadata only for entries that spent actions"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Allgemeine Virus-Counter-Entfernungsregel prüfen

## Ziel

Die allgemeine Corp-Regel zum Entfernen aller Virus-Counter soll korrekt implementiert, der Corp nachvollziehbar angeboten und in der Chronik klar protokolliert werden.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: Es gibt eine allgemeine Regel auf Virus-Karten, nach der die Corp alle Virus-Counter entfernen kann, indem sie ihre nächsten drei Aktionen aufgibt.
- Nutzerhinweis: Nach den Kartentexten geht es offenbar um das Aufgeben der nächsten drei Aktionen, nicht um `eine Aktion und zwei Credits`.
- Relevante historische Artefakte:
  - `docs/releases/mvp/mvp-0-99-hosting-virus-counters/virus-purge-spec.md`
  - `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md`
  - `docs/releases/proteus/purge-action-debt-contract.md`
- Dieser Befund ist eine Regelfrage plus möglicher Fix: Die Nutzerannahme muss gegen die im Projekt führende lokale Regelquelle geprüft werden.

## Scope

- Führende lokale Regelquellen zur Virus-Purge-/Action-Debt-Regel prüfen.
- Aktuelle Engine-Implementierung und LegalAction-Erzeugung für Corp-Virus-Counter-Entfernung prüfen.
- Sicherstellen, dass die UI der Corp die legale Entfernungsoption verständlich anbietet, wenn Virus-Counter vorhanden sind.
- Sicherstellen, dass Kosten als Aufgabe der nächsten drei Aktionen oder als bestätigte projektgültige Alternative korrekt modelliert werden.
- Chronikereignis für Entscheidung und Effekt ergänzen oder präzisieren.
- Tests für LegalAction, `applyAction`-Revalidierung, Action-Debt-Folge, Counter-Entfernung, Replay/StateHash und PublicView ergänzen.

## Nicht im Scope

- Keine Skivviss-spezifische Counter-Ort-Korrektur; dafür gibt es `act-2026-05-22-skivviss-counter-ownership-and-draw-log`.
- Keine neue Virus-Mechanik jenseits der allgemeinen Entfernungsregel.
- Keine Änderung an einzelnen Virus-Karten, außer sie sind für einen fokussierten Regressionstest nötig.
- Keine UI-Neugestaltung aller Basic Actions.

## Akzeptanzkriterien

- [x] Die gültige lokale Regelinterpretation ist dokumentiert: `nächste drei Aktionen aufgeben` oder begründet abweichende Projektregel.
- [x] Die Corp erhält die Entfernungsoption nur in legalen Zuständen.
- [x] `applyAction` revalidiert Seite, actionId, stateVersion, Timing, Kosten und Virus-Counter-Zustand.
- [x] Alle entfernten Virus-Counter werden korrekt und side-sicher entfernt.
- [x] Die Chronik benennt Entscheidung, Kostenmodell und Effekt klar.
- [x] Tests decken mindestens einen positiven und einen illegalen/stale Action-Fall ab.
- [x] Replay und StateHash bleiben deterministisch.

## Umsetzungshinweise

- Die Proteus-Planung zum Purge-/Action-Debt-Vertrag darf als Orientierung dienen, aber der aktive Runtime-Stand und die führenden lokalen Quellen entscheiden.
- Falls die bestehende Implementierung absichtlich `eine Aktion und zwei Credits` nutzt, muss das als Regelabweichung sichtbar gemacht und fachlich entschieden werden.

## Ergebnisnotiz

Abgeschlossen am 2026-05-22. Führende Runtime-Regel bleibt der V0.99/V1.9.12-Purge: Corp-only in `corp_action.main`, genau drei Clicks, keine Credits; der Proteus-Action-Debt-Vertrag bleibt planning-only und wurde nicht in die aktuelle Runtime übernommen. Die bestehende Engine-Implementierung erfüllte das Drei-Click-Modell bereits; ergänzt wurde ein Regressionstest, der `1 Aktion + 2 Credits` als legalen Purge-Pfad ausschließt und bestätigt, dass Purge auch bei 0 Credits legal ist. Die Spielchronik beschreibt `purge_virus_counters` jetzt explizit mit Kostenmodell und Anzahl der entfernten Virus-Counter. Fokussierte Engine-/Web-Tests, Engine-/Web-Typecheck und `git diff --check` sind grün.
