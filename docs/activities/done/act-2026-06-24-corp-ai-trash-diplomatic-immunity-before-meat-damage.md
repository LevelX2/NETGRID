---
activityId: act-2026-06-24-corp-ai-trash-diplomatic-immunity-before-meat-damage
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-24
startedAt: 2026-06-24
completedAt: 2026-06-24
branch: codex/activity-diplomatic-immunity-ai
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - docs/architecture/ai/corp-ai-diplomatic-immunity-trash-activity-process-2026-06-24.md
checks:
  - corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "prioritizes trashing Diplomatic Immunity"
  - corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "keeps V0.95 Resource trash decisions"
  - corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "prioritizes trashing Diplomatic Immunity|keeps V0.95 Resource trash decisions"
  - corepack pnpm --filter @netgrid/ai typecheck (scheitert nur an bestehendem data_raven-CounterType-Fehler in packages/ai/src/known-ice-run-risk.test.ts)
---

# Korp-KI trash Diplomatic Immunity vor Meat-Damage-Plan

## Ziel

Die Korp-KI priorisiert bei getaggtem Runner legale Resource-Trash-Aktionen gegen sichtbare globale Meat-Damage-Prävention, bevor sie generische Economy-Aktionen wie `Credit nehmen` wählt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-24 mit Screenshot aus einer Human-vs-KI-Partie.
- Sichtbarer Boardzustand im Screenshot: Runner hat `Diplomatic Immunity` installiert; der Kartentext verhindert allen Meat Damage, sofern die Korp nicht 1 Agenda-Punkt zahlt. Die Korp zeigt `0/7` Agenda-Punkte und kann diesen Cancel-Pfad damit nicht nutzen.
- Die Korp hat mehrere Handkarten mit möglichem Damage-Payoff beziehungsweise killnaher Handentwicklung, trashte zuvor eine Resource (`Inventive Fixer`), nahm danach aber mehrfach einzelne Credits statt weitere relevante Resources zu trashen.
- Nutzererwartung: Solange der Runner getaggt ist und die Korp einen Damage-Plan verfolgen kann, sollte `Diplomatic Immunity` ein sehr hohes Trash-Ziel sein. Einzelne Damage-Preventions oder bezahlbare Präventionskarten sind nachrangiger als globale Meat-Damage-Verhinderung.

## Scope

- Prüfen, wie Korp-`resource_trash`-LegalActions aktuell in der Semantic-/Runtime-KI bewertet werden, wenn der Runner getaggt ist.
- Sichtbare Runner-Resources mit globaler oder nahezu globaler Damage-Prävention erkennen und gegenüber einfacher Economy deutlich aufwerten.
- Für `Diplomatic Immunity` sicherstellen, dass der Score besonders hoch ist, wenn:
  - der Runner aktuell getaggt ist,
  - die Korp keine Agenda-Punkte zum Canceln der Prävention hat,
  - die Korp sichtbare oder eigene side-sichere Damage-Payoffs hat, besonders Meat Damage.
- Prüfen, ob nach dem Trash einer Resource weitere Resource-Trash-Aktionen weiterhin korrekt gegen `Credit nehmen`, `Karte ziehen` und generische Install-Aktionen bewertet werden.
- Einen fokussierten AI-Regressionstest oder ein Szenario ergänzen, das den Screenshot-Fall sinngemäß abdeckt.

## Nicht im Scope

- Keine Änderung der Kartentexte oder Engine-Regeln von `Diplomatic Immunity`.
- Keine neue LegalAction-Erzeugung: Die KI darf weiterhin nur aus Engine-`LegalActions` wählen.
- Keine Hidden-Info-Ausweitung in PlayerViews, AI-Inputs, Logs, Traces oder Reconnect-Payloads.
- Keine generelle Neugewichtung aller Damage-, Tag- oder Resource-Strategien außerhalb dieses konkreten Trash-Priorisierungsfalls.
- Keine Änderung an Agenda-Punkt-Zahlung, Damage-Prevention-Resolvern, Replay oder StateHash.

## Akzeptanzkriterien

- [x] Ein getaggter-Runner-Szenario mit installiertem `Diplomatic Immunity`, Korp ohne Agenda-Punkt-Cancel und legaler Korp-Resource-Trash-Aktion wählt den Trash von `Diplomatic Immunity` vor einfacher Economy.
- [x] Die Bewertung ist generisch genug formuliert, dass globale Damage-Prävention höher gewichtet wird als einzelne, nur begrenzt wirksame Damage-Prevention-Resources.
- [x] Die Korp-KI darf eine Resource-Trash-Serie fortsetzen, wenn weitere sichtbare Resources ihren aktuellen side-sicheren Plan blockieren oder stark verschlechtern und die LegalActions dies erlauben.
- [x] Wenn der Runner nicht getaggt ist oder der Resource-Trash nicht legal ist, wird keine Aktion erfunden und keine bestehende LegalAction-Grenze umgangen.
- [x] Hidden-Info-, Replay- und StateHash-Grenzen bleiben unverändert; Tests oder Reviewnotiz benennen diese Nichtänderung ausdrücklich.

## Umsetzungshinweise

- Wahrscheinlicher Folgeagent: `card-enablement-ai-knowledge-agent`.
- Relevante Suchbegriffe im Code und in AI-Dokumentation: `resourceTrashRisk`, `resource.trash`, `tagged_meat_damage_payoff`, `damage_prevention`, `Diplomatic Immunity`, `chooseCorpAction`, `ActionSemanticCandidate`.
- Die Bewertung sollte nicht hart nur auf Kartennamen beruhen, wenn bereits Funktionssignale für Damage-Prävention oder Resource-Trash-Payoff existieren. Falls diese Signale fehlen, zunächst den kleinsten tragfähigen Signal-/Hint-Schnitt ergänzen.
- Der Screenshot ist eine Nutzerbeobachtung, kein vollständig reproduzierbarer Save-State. Der Test darf den Zustand minimal nachbauen, solange er die entscheidenden Bedingungen abbildet.

## Ergebnisnotiz

Umgesetzt. Die Semantic-Runtime-Korp-Bewertung erkennt jetzt side-sicher eine legale `trash_resource`-Action gegen eine sichtbare Runner-Resource mit globaler Meat-Damage-Prävention. Für `Diplomatic Immunity` wird der Trash stark aufgewertet, wenn der Runner getaggt ist, die Korp keinen Agenda-Punkt zum Canceln hat und eigene sichtbare Meat-Damage-Payoffs plausibel sind. Die Änderung erzeugt keine neuen LegalActions und ändert keine Engine-, Replay-, StateHash- oder Hidden-Info-Verträge.

Fokussierte Regression ergänzt: Bei getaggtem Runner, sichtbarem `Diplomatic Immunity`, Korp mit `0` Agenda-Punkten, niedrigem Creditstand und sichtbarem `Scorched Earth`-Payoff wählt `chooseCorpAction` den legalen Resource-Trash vor `gain_credit`. Der bestehende V0.95-Resource-Trash-Test bleibt grün.

Checks:

- `corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "prioritizes trashing Diplomatic Immunity"`: bestanden.
- `corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "keeps V0.95 Resource trash decisions"`: bestanden.
- `corepack pnpm exec vitest run packages/ai/src/index.test.ts -t "prioritizes trashing Diplomatic Immunity|keeps V0.95 Resource trash decisions"`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: scheitert an bestehendem `data_raven`-CounterType-Fehler in `packages/ai/src/known-ice-run-risk.test.ts`; keine neuen Typecheck-Fehler aus diesem Paket.
