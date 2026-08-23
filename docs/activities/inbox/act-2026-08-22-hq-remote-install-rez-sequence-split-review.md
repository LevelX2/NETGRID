---
activityId: act-2026-08-22-hq-remote-install-rez-sequence-split-review
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
checks:
  - Zustandsfelder, Revalidierung und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# HQ-zu-Remote-Install-/Rez-Sequenz modularisieren

## Ziel

Prüfen, ob Validierung/Parsing, Installationsfortschritt und optionale
Rez-Fortsetzung aus `hq-to-new-remote-install-rez-sequence.ts` getrennt werden
sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Der aktuelle Zustandsautomat wurde als fachlich korrekt und umfassend
  revalidierend bestätigt.
- Aktivierungsauslöser: nächste Erweiterung dieser Sequenz.

## Scope

- Persistente Zustandsfelder und Owner-Grenzen dokumentieren.
- Kleine Modulgrenzen ohne Änderung des Sequenzformats bewerten.
- Bei positivem Ergebnis migrationsfähige Folgepakete anlegen.

## Nicht im Scope

- Änderung von Serverbindung, Creditbudget oder Rez-Legalität.
- Legacy-Adapter oder paralleler Sequenzzustand.

## Akzeptanzkriterien

- [ ] Source-Agenda, Sequenzindex, Creditbudget und Serverbindung bleiben gemeinsam revalidiert.
- [ ] Keine zweite Install-/Rez-Fortsetzungsautorität entsteht.
- [ ] Replay und StateHash bleiben deterministisch.

## Umsetzungshinweise

- Erst aufteilen, wenn der Änderungsdruck den zusätzlichen Modulvertrag rechtfertigt.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Source-Agenda, Sequenzindex,
Creditbudget, Remote-Bindung und optionale Rez-Fortsetzung werden in derselben
persistenten Zustandsmaschine gemeinsam und fail-closed revalidiert. Seit dem
letzten fachlichen Fix vor Anlage der Activity wurde die Sequenz nicht
erweitert. Ein Split würde aktuell zusätzliche Übergabeverträge für denselben
Sequenzzustand schaffen, ohne Fehler- oder Testkopplung zu reduzieren. Keine
Folge-Activity; erst bei der nächsten Erweiterung kleine Grenzen prüfen, ohne
Sequenzformat oder Continue-Owner zu duplizieren.
