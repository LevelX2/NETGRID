---
activityId: act-2026-05-17-ai-live-doctrine-input-path-audit
status: done
kind: concept
area: ai
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/live-doctrine-input-path-audit-2026-05-17.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - git diff --check
---

# Live-AI-Eingangspfade ohne Deck Doctrine auditieren

## Ziel

Alle produktiven und testnahen AI-Eingangspfade sollen daraufhin geprüft werden, ob sie Deck Doctrine konsistent übergeben oder bewusst ohne Doctrine laufen. Das Ergebnis soll klären, ob fehlende Doctrine in Web/API-Smokes ein harmloser Testpfad oder ein realer Qualitätsverlust für Live-KI ist.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, offene Frage `Live-Endpunkte ohne Doctrine`.
- Die Analyse stellt fest: Multiplayer speist eigene Decksnapshots ein; einige einfache Web/API-Smoke-Pfade bauen AI-Inputs offenbar ohne eigene Deck Doctrine.
- Betroffene Konzeptbereiche: `buildDeckDoctrineProfile`, AI-Input-Erzeugung, Multiplayer-AI-Runner und Web/API-Smoke-Fixtures.

## Scope

- Callsite-Inventur: Wo wird AI input gebaut, wo wird `deckDoctrine` oder ein vergleichbares Profil mitgegeben, wo nicht?
- Pfade klassifizieren:
  - produktiver Live-Matchpfad,
  - Multiplayer-/Server-Testpfad,
  - Web/API-Smoke,
  - reine Unit-Fixture.
- Für produktiv relevante Lücken kleine Folgepakete vorschlagen, z. B. Doctrine-Builder am Serverpfad, Fixture-Erweiterung oder expliziter Fallback-Test.
- Dokumentieren, welche Pfade bewusst doctrine-los bleiben dürfen und warum.

## Nicht im Scope

- Keine direkte KI-Strategieänderung.
- Keine automatische Decklisten-Offenlegung für die Gegenseite.
- Keine neue Deckbuilding- oder Cloud-Deck-Funktion.
- Keine Massenänderung an Tests ohne vorherige Klassifikation.

## Akzeptanzkriterien

- [x] Es gibt eine vollständige, nachvollziehbare Liste der AI-Eingangspfade und ihrer Doctrine-Quelle.
- [x] Produktive Pfade sind von reinen Test-/Smoke-Pfaden getrennt.
- [x] Jede echte Doctrine-Lücke hat ein kleines Folgepaket oder eine dokumentierte bewusste Ausnahme.
- [x] Die Auditnotiz hält fest, dass Doctrine nur eigene Deck-/Rolleninformationen und erlaubte Hints nutzt.
- [x] Keine Hidden-Info- oder Decklisten-Daten der Gegenseite werden als Doctrine-Eingabe vorgeschlagen.

## Umsetzungshinweise

- Dieses Paket ist bewusst ein Audit vor Codeänderung.
- Nützliche Suchanker sind `buildDeckDoctrineProfile`, `deckDoctrine`, `buildAiDecisionInput` und Server-AI-Advance-Pfade.
- Falls die Analyse zeigt, dass ein Produktpfad betroffen ist, Folgepaket mit `requiresImplementation: true` anlegen.

## Ergebnisnotiz

Abgeschlossen mit `docs/reviews/ai/live-doctrine-input-path-audit-2026-05-17.md`. Der produktive private Multiplayer-`advance_ai`-Pfad nutzt eigene `privateDeckSnapshots` als Doctrine-Quelle; doctrine-lose Treffer sind als Legacy-/Demo-Pfade, Baseline-Controller oder isolierte Testfixtures klassifiziert. Empfohlene Nachläufe: Server-Invariant-Test für private Decksnapshots, Legacy-Demo-Grenzentscheidung und Simulation-Doctrine-Modusvertrag. Keine KI-Strategie, Hints, Deckdaten oder Runtime-Pfade wurden geändert.
