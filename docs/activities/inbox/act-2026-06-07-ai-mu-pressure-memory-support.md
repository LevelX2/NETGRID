---
activityId: act-2026-06-07-ai-mu-pressure-memory-support
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-mu-install-action-surface-audit
resultArtifacts: []
checks: []
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

Noch offen.
