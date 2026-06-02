---
activityId: act-2026-06-02-ai022-1-tactic-signal-taxonomy-cleanup
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-02
completedAt: 2026-06-02
branch: codex/ai022-1-tactic-signal-cleanup
releaseTarget:
blockedBy: []
resultArtifacts:
  - data/ai/tactic-signals-v1.json
  - data/ai/function-signal-derivation-v1.json
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
  - docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-2026-06-02.md
  - docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-report-2026-06-02.json
  - scripts/check-ai022-1-tactic-signal-taxonomy-cleanup.mjs
checks:
  - corepack pnpm build:ai-compiled-hints
  - corepack pnpm build:ai-hint-inspector-index
  - corepack pnpm check:ai022-1-tactic-signal-taxonomy
  - corepack pnpm check:ai-strategy-taxonomy
  - corepack pnpm check:ai-hint-quality
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-inspector-index
  - corepack pnpm check:ai-manual-overlays
  - corepack pnpm check:ai-approval-consistency
  - corepack pnpm check:ai-deck-doctrine-strategy
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# AI022-1: Tactic-Signal-Taxonomie bereinigen

## Ziel

Bestehende Taktik-/Function-Signale systematisch bereinigen, missverständliche Taxonomiepunkte dokumentieren und risikoarme Karten-/Signalfehler korrigieren, ohne neue Planner-, Engine-, LegalAction-, Targeting-, Profil- oder UI-Wirkung zu erzeugen.

## Kontext und Quellen

- Angefügter Nutzerprompt `AI022-1: Bestehende Taktiksignale systematisch bereinigen und optimieren`.
- `docs/reviews/ai/tactic-signal-used-catalog-2026-06-02.md` oder aktueller AI-Hint-Inspector-Report.
- `docs/ai/netgrid_taktiksignal_strategieanker_guide_v2.md`, falls vorhanden.
- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- relevante Build-/Inspector-/Check-Skripte.

## Scope

- Report- und Spaltenklarheit zu Karten-Strategieankern gegenüber Signal-Ankerfähigkeit.
- Präfixkonvention, Oberklassensignale, Trait-/Visibility-/Subtype-Abgrenzung und Gruppen-/Batchnamen prüfen und dokumentieren.
- Risikoarme Kartenkorrekturen für bekannte Fälle wie Anonymous Tip, Core Command: Jettison Ice, Senatorial Field Trip, Identity Donor, Kilroy Was Here und Romp through HQ.
- `economy.action` und `economy.trash_credit` auf missverständliche Economy-Nutzung prüfen und korrigieren oder dokumentieren.
- JSON- und Markdown-Review-Artefakte für AI022-1 erzeugen.
- Checks um die geforderten Invarianten erweitern oder einen fokussierten neuen Check ergänzen.

## Nicht im Scope

- Keine neue Strategy ID.
- Keine neue Planner-, ActionScore-, PlanWeight-, DeckDoctrine-, Engine-, Legalitäts-, Targeting-, Profil- oder UI-Wirkung.
- Keine vollständige Neuvergabe aller Kartensemantiken.
- Keine großflächige Umbenennung ohne Consumer- und Kompatibilitätsprüfung.
- Keine Entfernung von Legacy-Signalen, wenn bestehende Gates oder Consumer sie benötigen.

## Akzeptanzkriterien

- [ ] Ein Markdown-Review `docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-2026-06-02.md` ist erstellt.
- [ ] Ein maschinenlesbarer JSON-Report `docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-report-2026-06-02.json` ist erstellt.
- [ ] Bekannte Kartenkorrekturen sind geprüft, umgesetzt oder als Deferred Item begründet.
- [ ] Support-only-, Oberklassen-, Trait-/Visibility- und Prefix-Konventionen sind im Katalog/Review eindeutig dokumentiert.
- [ ] Checks prüfen die geforderten AI022-1-Invarianten soweit lokal sinnvoll.
- [ ] Relevante AI-Checks und `git diff --check` sind ausgeführt oder begründet ausgelassen.

## Umsetzungshinweise

- Nicht mechanisch umbenennen.
- Vor jeder Signaländerung Consumer, Legacy-Abhängigkeiten und Side-Safety prüfen.
- Wenn eine fachlich richtige Änderung technisch riskant ist, als Deferred Item dokumentieren statt halb umzubauen.

## Ergebnisnotiz

AI022-1 ist umgesetzt. Der Cleanup korrigiert `Anonymous Tip`, `Core Command: Jettison Ice`, `Senatorial Field Trip`, `Identity Donor`, `Kilroy Was Here`, `Romp through HQ`, `Lucidrine™ Drip Feed` und `Record Reconstructor` im bestehenden Taktiksignalvertrag, ohne neue Planner-, Engine-, LegalAction-, Targeting-, Profil- oder UI-Wirkung zu erzeugen. Broad-/Legacy-Signale, `corp.*`-Prefix und Support-only-Strategy-Anker-Grenzen sind im Katalog und Review dokumentiert. Der neue Check `corepack pnpm check:ai022-1-tactic-signal-taxonomy` validiert die Paket-Invarianten und erzeugt den JSON-Report.

Alle aufgeführten Checks sind grün. Bekannte bestehende Warnklassen bleiben: Strategy-Taxonomy-Warnungen zu Effekt-Scope und Legacy-/Descriptor-Werten, AI-Hint-Quality-Warnungen zu Singleton-/Synonymrollen, compiled-Hints-Warnings und Manual-Overlay-Warnings.

Offene Folgepunkte: keine riskante `corp.*`-Rename-Welle; Trait-/Hidden-Resource-Signale bleiben als späterer Descriptor-/PublicContext-Migrationsschnitt deferred; `run.event_tempo` braucht einen späteren Scoring-/Decklinien-Review.
