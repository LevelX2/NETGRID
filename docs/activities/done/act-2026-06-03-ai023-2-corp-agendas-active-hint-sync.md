---
activityId: act-2026-06-03-ai023-2-corp-agendas-active-hint-sync
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-03
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
  - docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-2026-06-03.md
  - docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-report-2026-06-03.json
  - docs/reviews/ai/README.md
  - docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json
  - docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
  - scripts/build-ai-hint-inspector-index.mjs
  - scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs
checks:
  - corepack pnpm build:ai-compiled-hints
  - corepack pnpm build:ai-hint-inspector-index
  - node scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs
  - node scripts/check-ai023-corp-agendas-semantics.mjs
  - node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs
  - node scripts/check-ai028-netgrid-semantic-audit-pack.mjs
  - corepack pnpm check:ai-strategy-taxonomy
  - corepack pnpm check:ai-hint-quality
  - corepack pnpm check:ai-hint-compiled-index
  - corepack pnpm check:ai-approval-consistency
  - corepack pnpm check:ai-deck-doctrine-strategy
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-inspector-index
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# AI023-2: Corp Agendas gegen Guide V3 synchronisieren

## Ziel

Alle aktiven und compiled Corp-Agendas werden gegen Guide V3 geprüft und die Semantik zwischen Active Hints, Compiled Hints und Inspector synchronisiert. Insbesondere müssen `Project Venice` und `Project Zurich` im Inspector wieder passende Overadvance-/Recurring-Taktiksignale tragen.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-03: `AI023-2: Corp Agendas vollständig gegen Guide V3 prüfen und Semantik synchronisieren`.
- Angehängte Paketbeschreibung: `C:\Users\Lui\.codex\attachments\5cbd715a-608c-45e0-b69c-0ada8c4e9d10\pasted-text.txt`.
- Führende Quellen: Carddaten unter `data/cards/`, aktive und compiled AI-Hints unter `data/ai/`, Inspector-Index, AI023-/AI027-/AI028-Reports und `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`.

## Scope

- Vollständige Inventur der aktiven/compiled Corp-Agendas aus Originalset und Proteus.
- Test-/V08-Agendas getrennt prüfen, falls aktiv vorhanden.
- Inaktive Classic-Agendas inventarisieren, aber nicht aktivieren.
- Fehlende oder zu grobe Agenda-Taktiksignale in Active Hints korrigieren und Compiled Hints sowie Inspector synchronisieren.
- StrategySupportPairs nach Guide V3 prüfen und nur bei echten Strategieankern dokumentieren.
- TargetProfile-/Constraint-/Hidden-Info-Entscheidungen reporten.
- Review, JSON-Report und fokussiertes Check-Skript für AI023-2 erstellen.

## Nicht im Scope

- Keine neuen Strategy IDs.
- Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Runtime-, Profil-/Default- oder UI-Änderung.
- Keine Hidden-Info-Projektion für verdeckte Agendas.
- Keine Corp ICE, Operations, Nodes, Assets, Upgrades oder Runner-Karten fachlich migrieren.
- Keine Chronicle-Dateien oder Chronicle-Skripte anfassen.

## Akzeptanzkriterien

- [x] Alle aktiven/compiled Corp-Agendas sind in Active Hints, Compiled Hints und Inspector vertreten.
- [x] `Project Venice` trägt Guide-V3-konforme Overadvance-/Recurring-Extra-Action-Signale.
- [x] `Project Zurich` trägt Guide-V3-konforme Overadvance-/Recurring-Economy-Signale.
- [x] Pflichtkarten wie `Project Babylon`, `Fetal AI`, `Marked Accounts`, `Viral Breeding Ground`, `Bioweapons Engineering` und `Corporate Headhunters` sind geprüft und korrekt semantisiert.
- [x] Overadvance wird nicht automatisch mit `corp.fast_advance` gleichgesetzt.
- [x] TargetProfiles existieren nur bei echter Wahl; statische Scope-Effekte sind Constraints oder bewusst ohne TargetProfile dokumentiert.
- [x] Hidden-Info-Grenzen für verdeckte Agendas sind dokumentiert und unverändert.
- [x] Review-Dokument, JSON-Report und Check-Skript sind erstellt.
- [x] Passende Checks sind ausgeführt oder begründet ausgelassen.

## Umsetzungshinweise

- Repo-Wahrheit geht vor Spoiler-Erwartung.
- Vorhandene präzise Taktiksignale wiederverwenden; neue Signale nur wenn wiederverwendbar, Guide-V3-konform und rein read-only.
- `score.*` ist im Agenda-/Score-Kontext zulässig, aber nicht automatisch Strategie.
- Economy, Draw, Hand Size, Tag, Trace, Damage und Access-Ambush getrennt halten.

## Ergebnisnotiz

AI023-2 ist abgeschlossen. Alle 43 produktiven Corp-Agendas aus Originalset und Proteus sind zwischen Active Hints, Compiled Hints und Inspector synchronisiert; 3 aktive Test-/V08-Agendas bleiben getrennt reportet und 4 Classic-Agendas bleiben inaktiv. `Project Venice` und `Project Zurich` tragen ihre Overadvance-/Recurring-Signale im Inspector. `Project Babylon` verliert den alten abgeleiteten `corp.fast_advance`-Possible-Anchor und bleibt Overadvance-/Bonuspunkte-Support ohne Fast-Advance-StrategySupportPair.

Der Inspector-Builder projiziert für Corp-Agendas die geprüften compiled `tacticSignals` in die Inspector-Function-Signals, ohne Strategieanker aus Support-only-Signalen zu erzwingen. Keine neue Strategy-ID, keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung. Die fokussierten und breiten AI-Gates, AI-/Web-Typechecks, AI-Tests und `git diff --check` sind bestanden; Warnungen in Taxonomy/Hint-Quality/Compiled-Hints bleiben warn-only.
