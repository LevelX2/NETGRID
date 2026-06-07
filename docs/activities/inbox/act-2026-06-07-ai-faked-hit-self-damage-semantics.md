---
activityId: act-2026-06-07-ai-faked-hit-self-damage-semantics
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

# Faked Hit und Self-Damage-Risikosemantik prüfen

## Ziel

Die KI-Semantik für `Faked Hit` und vergleichbare eigene Drawback-Karten soll positive Wirkung und Selbstschaden getrennt sichtbar machen. Die Folgeumsetzung soll daraus side-sicher berechnen können, ob eine eigene Aktion unmittelbar zur Runner-Flatline führt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Die Runner-KI spielte `Faked Hit` mit nur dieser einen Karte auf der Hand und verursachte dadurch nach dem Ausspielen 2 Core/Brain Damage gegen sich selbst, was zur Flatline führte.
- Eingefügter Analyse-Text vom 2026-06-07: `Faked Hit` gibt der Korp 1 Bad Publicity und verursacht beim Runner 2 nicht verhinderbaren Brain/Core Damage; der Nutzen und der Drawback müssen getrennt bewertet werden.
- Karte: `onr_proteus_108_faked-hit`, `Faked Hit`, Runner Event, Kosten 5.
- Engine-Stand:
  - `packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts`
  - `docs/activities/done/act-2026-05-24-proteus-phase-2c-direct-runner-event-bp-damage.md`
  - `data/scenarios/proteus-phase-2c-direct-runner-event-bp-damage-smoke-2026-05-24.json`
- Aktueller Support-Stand: `data/manifests/proteus-card-support.json` markiert `Faked Hit` als `ai_supported`; Notiz nennt Bad Publicity plus 2 unpreventable Core Damage.
- Aktueller Hint-Befund: `data/ai/ai-card-hints-active.json` führt bei `Faked Hit` im Wesentlichen `corp.bad_publicity_pressure` und nur grob `riskTags: ["damage_window"]`; präzise Risikosignale wie `risk.self_brain_damage` oder `risk.brain_damage_self_inflicted` sind an dieser Karte nicht klar als handlungswirksame Card-Hints sichtbar.
- Architekturleitlinie: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md` fordert getrennte Sichtbarkeit von positiven Effekten und Risiken/Drawbacks, unter anderem `risk.self_brain_damage`, `risk.brain_damage_self_inflicted`, `risk.hand_trash_cost` und `risk.loss_condition`.

## Scope

- Prüfen, welche AI-Hint-, Candidate- und Derived-Facts-Felder `Faked Hit` aktuell für die Runner-KI tatsächlich sichtbar machen:
  - positiver Effekt: Korp erhält 1 Bad Publicity,
  - Self-Damage: Runner nimmt 2 Core/Brain Damage,
  - Prevention: nicht verhinderbar,
  - mögliche Immediate-Win-Bedingung: Korp erreicht 7+ Bad Publicity.
- Entscheiden, ob vorhandene Signale reichen oder ob ein enger Hint-/Semantik-Nachtrag nötig ist:
  - `corp.bad_publicity_pressure`,
  - `risk.self_brain_damage`,
  - `risk.brain_damage_self_inflicted`,
  - `condition.damage_unpreventable` oder gleichwertige strukturierte Evidence,
  - `damageAmount = 2`,
  - `damageType = core` beziehungsweise lokaler Brain/Core-Begriff.
- Prüfen, ob weitere aktive Runner-Karten mit eigenem Self-Damage, Self-Tag, Hand-Trash-Kosten oder ähnlichen Drawbacks denselben Bewertungsweg brauchen.
- Ergebnis als kurzer Review oder Vertragsnachtrag dokumentieren; falls konkrete Daten-/Hint-Anpassungen nötig sind, kleine Folgepakete benennen oder bestehende Folgepakete präzisieren.

## Nicht im Scope

- Keine Runtime-Action-Auswahl.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine neue Strategy-ID für Bad Publicity.
- Keine pauschale Promotion weiterer Proteus-Karten.
- Keine Hidden-Info-Ausweitung: nur eigene Runner-Hand, öffentliche Bad-Publicity-Zähler und side-sichere Candidate-/Hint-Daten.

## Akzeptanzkriterien

- [ ] Für `Faked Hit` ist dokumentiert, welche positiven und negativen AI-Signale aktuell wirklich verfügbar sind.
- [ ] Die Lücke zwischen grobem `damage_window` und handlungswirksamem Self-Damage-Risiko ist bestätigt oder widerlegt.
- [ ] Falls ein Hint-/Semantik-Nachtrag nötig ist, sind genaue Felder, Signal-IDs und betroffene Dateien benannt.
- [ ] Self-Damage, Unpreventable-Status, Damage-Menge und Immediate-Bad-Publicity-Closeout sind als Anforderungen für Folgepakete formuliert.
- [ ] Hidden-Info-, Engine-, LegalAction-, Replay- und StateHash-Grenzen sind eingehalten.

## Umsetzungshinweise

- Wenn `ActionSemanticCandidate` bereits ein strukturiertes `selfDamage`-Feld aus der Engine-Projektion liefert, dieses bevorzugen und keine redundante Hint-Welt bauen.
- Wenn nur `riskTags: ["damage_window"]` verfügbar ist, reicht das nicht für einen Survival-Guard; dann muss mindestens Betrag, Typ, Empfänger und Preventable-Status side-sicher ermittelbar werden.
- Bad Publicity bleibt zunächst Support-/Closeout-Evidence, nicht automatisch eine belastbare Deckstrategie.

## Ergebnisnotiz

Noch offen.
