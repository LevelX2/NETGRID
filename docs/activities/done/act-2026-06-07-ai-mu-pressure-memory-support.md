---
activityId: act-2026-06-07-ai-mu-pressure-memory-support
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch: codex/activities-inbox-ai-run-mu
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-mu-install-action-surface-audit
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-hand-development.test.ts src/runner-run-target-evaluation.test.ts
---

# AI-MU-Pressure und Memory-Support

## Ziel

Volle oder fast volle MU soll die Runner-KI stärker in Richtung Memory-Ausbau, Hosting, Programmschutz oder Credit-Aufbau lenken, bevor sie wertvolle installierte Programme für neue Programminstallationen opfert.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Wenn MU voll ist, sollte das einen Druck verursachen, MU zu erweitern; Karten mit MU-Erweiterung sollen situationsabhängig mehr Wert bekommen.
- Der Taktiksignal-Katalog kennt `setup.memory` bereits als funktionales Signal für Runner-MU.
- Relevante Kartenbeispiele: `Tycho Mem Chip`, `WuTech Mem Chip`, `Zetatech Mem Chip`, Memory-Decks, Program-Hosting und Program-Trash-Protection.
- Bestehende Tests enthalten bereits einzelne Memory-Hardware-Fälle; dieses Paket soll die dynamische Druckbewertung systematisch machen.

## Scope

- Ein enges `RunnerMuPressureAssessment` oder gleichwertiges Modell ergänzen:
  - `memoryUsed`,
  - `memoryLimit`,
  - `memoryAvailable`,
  - `pendingProgramInstallMemory`,
  - `muAfterInstall`,
  - `requiresProgramTrash`,
  - nützliche Programme in Hand,
  - Memory-Support jetzt verfügbar,
  - Memory-Support in Hand,
  - Memory-Support suchbar,
  - Severity `none`, `low`, `medium`, `high`, `critical`.
- Bei hoher MU-Pressure `setup.memory`-Karten und passende Memory-/Hosting-/Protection-Aktionen aufwerten.
- TacticalGoals oder TacticalPlans um eine enge Memory-Linie ergänzen, zum Beispiel:
  - `runner.install_memory_support`,
  - `runner.resolve_missing_mu`.
- Wenn Memory-Hardware in Hand und bezahlbar ist, soll sie vor einer Programminstallation mit kritischem Trash bevorzugt werden.
- Wenn Memory-Hardware wegen Credits blockiert ist, darf `build_credit_base` oder eine äquivalente Economy-Empfehlung steigen.

## Nicht im Scope

- Keine neue Strategy-ID, wenn vorhandene TacticalGoal-/Plan-Strukturen reichen.
- Keine neue Kartensemantik und keine neuen Taktiksignale.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine pauschale Memory-Hardware-Priorisierung ohne aktuelle MU-Pressure.
- Keine Hidden-Info-Ausweitung.

## Akzeptanzkriterien

- [ ] Bei voller MU und nützlichen Programmen in Hand steigt der Wert von Memory-Support nachvollziehbar.
- [ ] Bezahlbare Memory-Hardware wird gegenüber einer Programminstallation bevorzugt, die ein kritisches Programm trashen müsste.
- [ ] Bei fehlenden Credits für Memory-Support steigt ein passender Economy-/Creditbase-Plan.
- [ ] Ohne echten MU-Druck bleiben Memory-Karten normale Setup-Unterstützung und dominieren nicht pauschal.
- [ ] Debug-/Evidence-Ausgaben nennen MU-Druck, Memory-Alternative und Grund der Priorisierung side-sicher.

## Umsetzungshinweise

- `setup.memory` als funktionale bestehende Semantik nutzen, keine Signale wie `setup.memory_chip` neu einführen.
- Memory-Ausbau, Hosting und Program-Trash-Protection getrennt bewerten: Sie können alle MU-/Rig-Druck mindern, sind aber nicht identisch.
- Bestehende `RunnerHandDevelopmentEvaluation` kann ein geeigneter Ort sein, um Memory-Support als aktuell nützliche Handkarte zu markieren.

## Ergebnisnotiz

Erledigt. Die Runner-KI hat jetzt eine enge side-sichere `RunnerMuPressureAssessment`, die sichtbare MU, installierbare Programme, Pflicht-Trash-Pfade, Memory-Support in Hand, bezahlbaren Memory-Support und fehlende Credits bewertet. Semantic Runtime und Legacy-Scoring werten bezahlbaren Memory-Support bei echter MU-Pressure auf, finanzieren sichtbaren aber noch zu teuren Memory-Support per `gain_credit`, und lassen Memory-Hardware ohne aktuellen MU-Druck normal gegen wichtigere Rig-Installationen konkurrieren. DecisionDebug/Evidence nennt Schweregrad, MU-Zahlen, Memory-Alternative, Funding-Bedarf und Grundkategorien ohne verdeckte Kartendaten.
