---
activityId: act-2026-06-07-ai-mu-install-action-surface-audit
status: inbox
kind: concept
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# AI-MU-Install-Action-Surface-Audit

## Ziel

Klären, ob die Runner-KI bereits vor der Wahl einer Programminstallation erkennen kann, dass volle MU einen späteren Programmtrash erzwingen, und welche side-sicheren Daten für eine belastbare Installationsbewertung fehlen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Die KI installierte ein Programm und musste wegen voller MU ein anderes Programm trashen. Offen ist, ob Trash-Malus, Opferauswahl und Memory-Ausbau ausreichend in der KI-Bewertung stecken.
- Follow-up zu erledigten Paketen:
  - `docs/activities/done/act-2026-05-21-runner-program-install-free-mu.md`
  - `docs/activities/done/act-2026-05-21-runner-program-install-trash-choice-ui.md`
  - `docs/activities/done/act-2026-05-21-runner-ai-program-install-trash-policy.md`
- Aktueller Engine-/UI-Pfad: `runner_program_trash_before_install` öffnet eine `select_cards`-Choice, wenn Programme vor Installation getrasht werden können oder müssen.
- Mögliche Codeflächen: `packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts`, `packages/ai/src/index.ts`, `packages/ai/src/action-semantic-candidate.ts`, `packages/ai/src/runner-hand-development.ts`, `packages/ai/src/tactical-plans.ts`.

## Scope

- Prüfen, welche Daten in `LegalAction`, `ActionSemanticCandidate`, `pendingChoice` und `PlayerView` für Programminstallationen verfügbar sind:
  - aktueller MU-Verbrauch,
  - MU-Limit,
  - Memory-Kosten des neuen Programms,
  - benötigte freizumachende MU,
  - mögliche installierte Programme als Trash-Kandidaten,
  - ob die Wahl optional oder verpflichtend ist.
- Prüfen, ob die KI beim initialen `install_card`-Score bereits displacement cost einpreisen kann oder erst im Folge-Choice reagiert.
- Prüfen, ob bestehende DecisionDebug-/Evidence-Ausgaben ausreichend zeigen, warum installiert, abgebrochen oder ein Opfer gewählt wurde.
- Fehlende Action-/Targetdaten als kleine Folgemaßnahmen dokumentieren.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine neue Kartensemantik, keine neuen Taktiksignale und keine Strategy-ID.
- Keine Hidden-Info-Ausweitung.
- Keine direkte Änderung am Opferauswahlalgorithmus.
- Keine Änderung an Decklegalität, Formatlegalität oder Kartenfreigaben.

## Akzeptanzkriterien

- [ ] Der Review beschreibt, ob die KI die MU-Verdrängung vor der Installationsentscheidung oder erst in der Folge-Choice sieht.
- [ ] Benötigte, aber fehlende side-sichere Felder sind konkret benannt.
- [ ] Es ist klar, ob `ActionSemanticCandidate`/TacticalPlans für Programminstallationen zusätzliche MU-/Displacement-Evidence bekommen sollen.
- [ ] Offene Punkte sind als Folgepakete verlinkt oder in bestehenden Folgepaketen als Blocker ergänzt.

## Umsetzungshinweise

- Nicht aus FullState ableiten, wenn eine side-sichere PlayerView-/LegalAction-Projektion reicht.
- Wenn die Action-Surface schon ausreichend ist, das ausdrücklich festhalten und die Folgepakete auf reine Bewertungslogik begrenzen.
- Bestehende Choice-Resolution darf weiter Engine-autorisiert bleiben.

## Ergebnisnotiz

Noch offen.
