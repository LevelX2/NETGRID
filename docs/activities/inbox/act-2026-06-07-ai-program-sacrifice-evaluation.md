---
activityId: act-2026-06-07-ai-program-sacrifice-evaluation
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

# AI-Program-Sacrifice-Evaluation

## Ziel

Die Runner-KI soll Programme, die wegen voller MU vor einer Installation getrasht werden müssten, bewusst bewerten und nur dann opfern, wenn der Installationsnutzen den Verlust klar übersteigt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Programminstallation bei voller MU darf nicht wie eine normale Installation bewertet werden; das zu trashende Programm könnte ein wichtiger Breaker oder Payoff-Träger sein.
- Follow-up zu `docs/activities/done/act-2026-05-21-runner-ai-program-install-trash-policy.md`: Der vorhandene Basisschutz für redundante Programme und einzige sichtbare Breaker soll zu einer expliziteren Opferbewertung ausgebaut werden.
- Verwandte aktuelle AI-Flächen: `RunnerRunTargetEvaluation`, `RunnerHandDevelopmentEvaluation`, `DeckCapabilityProfile`, TacticalPlans und DecisionDebug.

## Scope

- Eine kleine `ProgramSacrificeEvaluation` oder gleichwertige Bewertungsroutine einführen.
- Für jedes legal auswählbare installierte Programm bewerten:
  - aktuelle Planabhängigkeit,
  - sichtbare Breaker-Coverage und Unique-Coverage,
  - Server-/Access-Payoff,
  - Counter, gespeicherte Credits oder wiederholbare Economy,
  - Search-/Draw-/Defense-/Protection-Rolle,
  - Host-/Daemon-Abhängigkeit,
  - Wiederbeschaffbarkeit,
  - Redundanz,
  - Installations-/Sunk-Cost,
  - `sacrificePenalty` und Evidence.
- Displacement-Penalty auf Programminstallationen anwenden, die Pflicht-Trash auslösen.
- Critical-/High-Opfer stark abwerten; Low-Value- oder redundante Opfer nur erlauben, wenn das neue Programm einen klaren aktuellen Bedarf löst.
- Bei keinem akzeptablen Opfer Installation abbrechen oder stark abwerten.
- Die finale Choice bleibt ausschließlich aus `pendingChoice.options`/`LegalActions`.

## Nicht im Scope

- Keine Engine-Regeländerung und keine eigene Legalitätsberechnung.
- Keine FullState-Simulation und keine verdeckten Korp-Daten.
- Keine neue Kartensemantik, keine neuen Taktiksignale und keine Strategy-ID.
- Keine pauschale Installationssperre bei voller MU.
- Keine Protheus-AI-Freigabe als Nebeneffekt.

## Akzeptanzkriterien

- [ ] Ein einziger wichtiger Breaker oder ein aktiver Planträger wird nicht leichtfertig als MU-Opfer gewählt.
- [ ] Programme mit Countern, gespeicherten Credits, Host-/Daemon-Abhängigkeiten oder klarer Payoff-Rolle erhalten einen höheren Opfer-Malus.
- [ ] Redundante oder aktuell wertarme Programme können geopfert werden, wenn das neue Programm eine erkennbare Lücke schließt.
- [ ] Wenn kein akzeptables Opfer existiert, wird die Installation nicht gewählt oder die Folge-Choice abgebrochen.
- [ ] DecisionDebug nennt side-sicher Opferkandidat, Penalty und Grundkategorien, ohne verdeckte Informationen zu leaken.

## Umsetzungshinweise

- Die erste Version darf mit einer groben Skala `critical`, `high`, `medium`, `low` arbeiten.
- Bestehende Breaker-/Coverage- und TacticalPlan-Informationen wiederverwenden, statt eine zweite Rig-Bewertung aufzubauen.
- CardId-Sonderfälle vermeiden, soweit Funktionsrolle, Kartentyp, Counter und sichtbarer Zustand reichen.

## Ergebnisnotiz

Noch offen.
