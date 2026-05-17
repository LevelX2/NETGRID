---
activityId: act-2026-05-17-proteus-virus-antibody-contracts
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md
  - docs/activities/inbox/act-2026-05-17-proteus-purge-action-debt-contract.md
checks:
  - rg -n "virus_antibody_counter_family|Viral Breeding Ground|Bel-Digmo Antibody|Doppelganger Antibody|Pattel Antibody|Stereogram Antibody|Armageddon|Crumble|Garbage In|Highlighter|Scaldan|Taxman|Vienna 22|Viral Pipeline" docs data packages
  - rg -n "PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT|P-VAC|Doppelganger|Pattel|Highlighter|Vienna|Purge" docs/derived docs/activities data/rules
  - git diff --check
---

# Proteus Virus-/Antibody-Counter-Verträge schneiden

## Ziel

Proteus-spezifische Virus- und Antibody-Karten sollen in kleine Counter- und Timing-Familien zerlegt werden.

## Kontext und Quellen

- Grundlage: `data/rules/proteus-mechanics-coverage-2026-05-17.json`.
- Relevanter Cluster: `virus_antibody_counter_family`.
- Beispiele: `Viral Breeding Ground`, `Bel-Digmo Antibody`, `Doppelganger Antibody`, `Pattel Antibody`, `Stereogram Antibody`, `Armageddon`, `Crumble`, `Garbage In`, `Highlighter`, `Taxman`, `Vienna 22`, `Viral Pipeline`.

## Scope

- Counter-Arten, Purge-Bezug, Access-/Score-/Run-Fenster und PublicPayloads unterscheiden.
- Karten in kleine erste Slices gruppieren.
- Hidden-Info-Risiken bei Stack/R&D/HQ/Access und installierten Karten benennen.

## Nicht im Scope

- Keine Runtime-Implementierung.
- Keine AI-Hints.
- Keine Kartenpromotion.

## Akzeptanzkriterien

- [x] Virus-/Antibody-Familien sind in kleine Slices getrennt.
- [x] Counter- und Timing-Anforderungen sind pro Slice benannt.
- [x] Tests für Replay/StateHash und Visibility sind skizziert.

## Ergebnisnotiz

Erledigt. `docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md` trennt die 13 Proteus-Clusterkarten in Antibody-Access, Viral-Breeding-Ground, erfolgreiche Run-Counter, Access-Modifikatoren, Start-of-turn-/Random-Penalties und Proteus-Purge/Action-Debt. Das Artefakt grenzt Advancement-, Antibody- und purgefähige Runner-Virus-Counter ab, benennt PublicPayload-/Hidden-Info-Grenzen für R&D/HQ/Archives/Access/installierte Karten und skizziert Replay-/StateHash-/Visibility-Tests. Als Folgepaket wurde `docs/activities/inbox/act-2026-05-17-proteus-purge-action-debt-contract.md` angelegt, weil Proteus-Purge nicht sauber mit dem vorhandenen V0.99-Main-Action-Purge gleichgesetzt werden darf.
