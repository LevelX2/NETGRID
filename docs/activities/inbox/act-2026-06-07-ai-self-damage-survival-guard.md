---
activityId: act-2026-06-07-ai-self-damage-survival-guard
status: inbox
kind: fix
area: ai
priority: critical
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-faked-hit-self-damage-semantics
resultArtifacts: []
checks: []
---

# Self-Damage-Survival-Guard für Runner-Actions

## Ziel

Die Runner-KI darf keine eigene Aktion wählen, die durch Self-Damage unmittelbar zur Flatline führt, außer dieselbe Aktion gewinnt das Spiel sofort. Der beobachtete `Faked Hit`-Fall soll als konkreter Regressionstreiber dienen, der Guard soll aber als kleines generisches Muster für eigene Self-Damage-Actions umgesetzt werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Runner-KI spielte `Faked Hit` mit nur dieser einen Karte auf der Hand; nach dem Ausspielen war die Hand leer, danach kamen 2 nicht verhinderbare Core/Brain Damage und der Runner flatlinete.
- `Faked Hit`: `onr_proteus_108_faked-hit`, Runner Event, Kosten 5, Effektsequenz: Korp +1 Bad Publicity, Runner nimmt 2 unpreventable Core Damage.
- Engine-Nachweis: `packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts`.
- Vorarbeit: `act-2026-06-07-ai-faked-hit-self-damage-semantics`.
- Game-End-Besonderheit: Bestehende Engine-Tests halten fest, dass `bad_publicity_7` bei gleichzeitigem `Faked Hit`-Flatline primär bleibt und der Runner gewinnen kann, wenn die Korp durch die Aktion 7+ Bad Publicity erreicht.

## Scope

- In der Runner-Action-Bewertung oder einem engen Hilfsmodul eine `SelfDamageSurvivalAssessment` oder gleichwertige Bewertung ergänzen.
- Nur side-sichere Eingaben verwenden:
  - eigene Runner-Handanzahl aus der Runner-PlayerView,
  - ob die Aktion eine eigene Handkarte ausspielt und dadurch die Hand reduziert,
  - Self-Damage aus Candidate-/Hint-/LegalAction-Evidence,
  - Damage-Typ, Damage-Menge und Preventable-Status,
  - öffentliche Bad-Publicity-Zähler,
  - bekannte unmittelbare Game-End-Evidence.
- Mindestberechnung:
  - `handBeforeAction`,
  - `handAfterActionCost`,
  - `selfDamageAmount`,
  - `selfDamageType`,
  - `preventable`,
  - `effectiveSelfDamage`,
  - `survivesSelfDamage`,
  - `immediateWinByAction`.
- Wenn `survivesSelfDamage = false` und `immediateWinByAction = false`, die Aktion hart ausschließen oder so stark abwerten, dass sie gegen jede sichere legale Alternative verliert.
- Wenn `immediateWinByAction = true`, die Aktion darf gewählt werden; Debug/Evidence muss den Sonderfall `lethal_but_winning_closeout` oder gleichwertig erklären.
- `Faked Hit`-Spezialfall abdecken:
  - Korp Bad Publicity 0 bis 5 und Runner hat nach Ausspielen weniger als 2 verfügbare Handkarten -> nicht wählen.
  - Korp Bad Publicity 6 und `Faked Hit` erreicht 7 -> Closeout darf den Self-Damage-Block übersteuern, sofern der Engine-Game-End-Vertrag greift.

## Nicht im Scope

- Keine Änderung der Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Zufallspfade.
- Keine neue Kartensemantik, außer ein vorheriges Paket belegt eine fehlende side-sichere Candidate-/Hint-Projektion.
- Keine vollständige Bewertung aller Drawback-Familien wie Self-Tag, Debt, Hand-Trash-Kosten oder Delayed Damage; falls beim Einbau auffällig, separate Follow-ups anlegen.
- Keine neue Bad-Publicity-Strategy-ID.
- Keine Hidden-Info-Ausweitung.

## Akzeptanzkriterien

- [ ] `Faked Hit` mit nur `Faked Hit` auf der Hand und Korp Bad Publicity < 6 wird nicht gewählt.
- [ ] `Faked Hit` mit genau 1 zusätzlicher Handkarte und Korp Bad Publicity < 6 wird nicht gewählt, weil 2 Damage nicht überlebt werden.
- [ ] `Faked Hit` mit 2+ verfügbaren Handkarten und Korp Bad Publicity < 6 bleibt legal, wird aber nicht durch den Survival-Guard blockiert; weitere Bad-Publicity-Relevanzbewertung entscheidet den Nutzen.
- [ ] `Faked Hit` von Korp Bad Publicity 6 auf 7 darf als Immediate-Win-/Closeout-Aktion gewählt werden, sofern der Game-End-Vertrag bestätigt wird.
- [ ] Andere Self-Damage-Actions, soweit side-sicher erkennbar, werden mit derselben Survival-Bewertung behandelt oder als Folgepakete dokumentiert.
- [ ] Finale Runner-Action stammt aus `input.legalActions`.

## Umsetzungshinweise

- Guard vor finaler Action-Auswahl anwenden, aber nach LegalAction-/Candidate-Projektion; er darf keine Legalität erzeugen.
- Bei preventable Damage nicht still Prevention annehmen. Wenn eine aktive Prevention nicht side-sicher als verfügbar und im selben Timing nutzbar ist, konservativ als nicht überlebt bewerten oder das Risiko stark abwerten.
- Passende Checks nach Umsetzung:
  - `corepack pnpm --filter @netgrid/ai exec tsc --noEmit`
  - fokussierte Vitest-Dateien für Runner-Action-Auswahl, `tactical-plans` und betroffene AI-Debug-/Golden-Tests
  - `git diff --check`

## Ergebnisnotiz

Noch offen.
