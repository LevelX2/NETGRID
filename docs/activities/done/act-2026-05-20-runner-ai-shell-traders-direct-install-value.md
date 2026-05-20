---
activityId: act-2026-05-20-runner-ai-shell-traders-direct-install-value
status: done
kind: improvement
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-20
startedAt: 2026-05-20
completedAt: 2026-05-20
branch:
releaseTarget: Runner AI Shell Traders follow-up
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Shell Traders"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Runner AI|Runner plan|Shell Traders|installed Runner economy|King of the Road|breaker|economy"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - git diff --check -- packages/ai/src/index.ts packages/ai/src/runner-plans.ts packages/ai/src/index.test.ts docs/activities/done/act-2026-05-20-runner-ai-shell-traders-direct-install-value.md
relatedActivities:
  - act-2026-05-20-runner-ai-shell-traders-overprepare
  - act-2026-05-18-runner-ai-shell-traders-unused
---

# Runner-KI: Shell-Traders-Zielwert gegen Direktinstallation abwägen

## Ziel

Die Runner-KI soll `The Shell Traders` nicht nur nach Backlog-Größe bewerten, sondern auch danach, ob das neue Ziel gerade besser direkt installiert werden sollte. Sehr dringende und bezahlbare Ziele sollen nicht unnötig durch Shell-Counter verzögert werden; vorbereitete Shell-Traders-Ziele sollen dagegen nach sichtbarem Zielwert fertiggestellt werden.

## Kontext

Nach dem Backlog-Fix blieb als Folgeschritt offen, die Zielqualität stärker zu gewichten. Der Nutzerhinweis vom 2026-05-20: Nützliche Karten sollten eher fertiggestellt oder direkt gespielt werden; Shell Traders ist vor allem sinnvoll für Vorrat, weniger dringende Setup-Karten oder Züge ohne bessere Alternative.

## Scope

- Shell-Traders-Remove-Aktionen nach Zielwert mitgewichten, damit bereits vorbereitete hochwertige Karten eher fertig werden.
- Prepare-Aktionen dämpfen, wenn dasselbe Ziel aktuell direkt installierbar und sichtbar dringend ist.
- Plan- und Baseline-Bewertung konsistent halten.
- Side-sichere Evidence für Direktinstallierbarkeit und Dringlichkeit ergänzen.
- Regressionstest für bezahlbare dringende Zielkarte ergänzen.

## Nicht im Scope

- Keine Engine-Änderung am Shell-Traders-Vertrag.
- Kein Zugriff auf verdeckte Korp-Daten oder nicht sichtbare Runner-Daten.
- Keine generische Multi-Turn-Optimierung für alle verzögerten Installationspfade.

## Akzeptanzkriterien

- [x] Bei einer bezahlbaren dringenden Zielkarte wählt die Runner-KI die direkte Installation statt `set_aside_from_grip`.
- [x] Prepared-Backlog-Fertigstellung bleibt bevorzugt, wenn Shell-Traders-Ziele bereits draußen sind.
- [x] Prepare bleibt bei leerem oder niedrigem Backlog weiterhin nutzbar.
- [x] Debug/Evidence bleibt side-sicher und enthält keine FullState-/PrivatePayload-Daten.
- [x] Shell-Traders-, Runner-AI- und Typecheck-Regressionen bleiben grün.

## Ergebnisnotiz

Umgesetzt. `evaluateShellTradersActions` bewertet `remove_shell_counter` jetzt mit sichtbarem Zielwert, sodass bereits vorbereitete hochwertige Karten nicht nur nach Counter-Anzahl priorisiert werden. Neue Prepare-Aktionen erkennen, ob das konkrete Ziel gerade auch direkt installierbar ist; bei hoher sichtbarer Dringlichkeit, etwa einem fehlenden bezahlbaren Breaker, bekommt Prepare einen zusätzlichen Malus. Die Baseline-Bewertung in `packages/ai/src/index.ts` nutzt denselben Grundgedanken.

Ein neuer Test deckt den Fall ab, dass ein bezahlbarer `simple_fracter` trotz verfügbarer Shell-Traders-Prepare-Aktion direkt installiert wird. Die bestehende Backlog-Regression und der niedrige Backlog-Prepare-Test bleiben grün.
