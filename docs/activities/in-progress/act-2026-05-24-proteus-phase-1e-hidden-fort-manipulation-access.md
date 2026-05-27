---
activityId: act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 1e
proReferences:
  - PRO019
blockedBy:
  - rule-source-clarification-proteus-phase-1e-hidden-fort-and-central-access
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md
checks:
  - Lokale Quellenprüfung `docs/source/Proteusspoiler.txt` und `data/cards/proteus-cards.json` für `Herman Revista`, `Marcel DeSoleil`, `Pavit Bharat` und `Simon Francisco`
---

# Proteus Phase 1e: Hidden Fort Manipulation and Central Access

## Ziel

Die Phase-1-Karten mit Fort-Reorder, verdeckter R&D/HQ-Bewegung oder zentraler Access-Modifikation als Hidden-Info-sicheren Mechanikschnitt planen.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarten

- `onr_proteus_060_herman-revista` Herman Revista
- `onr_proteus_064_marcel-desoleil` Marcel DeSoleil
- `onr_proteus_069_pavit-bharat` Pavit Bharat
- `onr_proteus_073_simon-francisco` Simon Francisco

## Benötigte Funktionsbausteine

- Hidden-info-barrier Choice-Modell für Fort-ICE-Reorder:
  - `Herman Revista`: Korp kann zu Beginn eines Runs auf diesem Fort die ICE-Reihenfolge ändern.
  - PublicPayload darf nur neue öffentliche Positionen zeigen, keine unrezzed Identitäten.
- R&D-top-trash als verdeckte Kosten:
  - `Marcel DeSoleil`: Kosten `[2]` plus oberste zwei Karten von R&D trashen.
  - Chronik und PublicPayload dürfen keine verdeckten Kartennamen leaken.
- Temporary repeated subroutine:
  - Korp wählt eine Subroutine auf einem ICE dieses Forts.
  - Kopie gilt bis Ende des Runs und erscheint unmittelbar nach der Originalsubroutine.
  - Dynamische Subroutine-ID, Break-/Resolve-Revalidation und Cleanup am Run-Ende sind erforderlich.
- Rez-after-last-ICE window und Hidden HQ/Fort swap:
  - `Pavit Bharat`: nur in subsidiary data fort installierbar.
  - Rez nur, wenn Runner das letzte ICE auf diesem Fort passiert hat.
  - Beim Rez alle Karten im Fort nach HQ deinstallieren und gleich viele Karten aus HQ ins Fort installieren.
  - Korp-Choices sind privat; PublicPayload zeigt nur öffentliche Positions-/Count-Änderungen.
- Central install/access replacement:
  - `Simon Francisco`: Installation nur in HQ oder R&D.
  - Während eines Runs, in dem Simon accessed wird, greift Runner auf eine Karte weniger in diesem Fort zu.
  - Access-Count-Replacement muss mit Multiaccess und laufender Access-Queue kompatibel sein.

## Nicht im Scope

- Keine öffentliche Pass-Tax von `Rasmin Bridger`.
- Kein `Obfuscated Fortress`-Spend-Cap.
- Keine Hidden Runner Resources.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Alle vier Zielkarten haben per-card CardImplementation-Dateien oder bleiben mit begründetem Blocker getrennt.
- [ ] Keine PlayerView, PublicEvent, Reconnect-Payload, Replay-Projektion, Chronik oder Logausgabe leakt verdeckte HQ-/R&D-/unrezzed-ICE-Identitäten.
- [ ] Alle privaten Choices werden in `applyAction` mit StateVersion, Source, Timing und Zielmenge revalidiert.
- [ ] Temporäre Subroutine-Kopien werden am Run-Ende entfernt und replay-/StateHash-stabil rekonstruiert.
- [ ] Multiaccess- und Access-Queue-Regressionen sind abgedeckt.

## Umsetzungshinweise

- Dieser Slice berührt Hidden-Info stark; bei Unsicherheit zuerst ein kleinerer Architektur- oder Testvertrag schneiden.
- `Pavit Bharat` kann bei zu großem Hidden-Choice-Scope als eigenes Folgepaket abgetrennt werden.

## Ergebnisnotiz

Blockiert am 2026-05-24.

Der Slice ist als Gesamtpaket nicht legal-action-stabil vollständig umsetzbar, weil zwei Zielkarten vor Codearbeit weitere Regel-/Scope-Entscheidungen brauchen:

- `Pavit Bharat`: Der lokale Text sagt, beim Rezzen alle Karten in diesem Fort zu deinstallieren und in HQ zu speichern, dann eine gleiche Anzahl Karten aus HQ in diesem Fort zu installieren. Der aktuelle Handoff entscheidet nicht, ob damit ICE, Root-Karten oder beide gemeint sind, ob HQ-Karten nach Typ/Installierbarkeit gefiltert werden, wie viele ICE- und Root-Slots gewählt werden, ob Installkosten/Region-/Agenda-/Asset-Root-Grenzen gelten und wie öffentliche Count-/Positionsänderungen gegen verdeckte HQ-Identitäten redigiert werden. Ohne diesen Vertrag kann `applyAction` die private HQ-Auswahl nicht belastbar revalidieren.
- `Simon Francisco`: Der lokale Text reduziert die Anzahl der Zugriffe auf Karten in HQ oder R&D während eines Runs, in dem Simon accessed wird. Der aktuelle Engine-Breach baut zentrale HQ-/R&D-Zugriffsqueues vor dem Access; der Handoff entscheidet nicht, ob Simon vor oder nach den stored-card-Zugriffen accessed wird und wie eine nachträgliche Access-Count-Reduktion mit Multiaccess, laufender Queue und bereits accessed Karten zu verrechnen ist.

`Herman Revista` und `Marcel DeSoleil` wirken technisch schneidbar, werden aber nicht isoliert promotet, solange diese Activity die vier Karten als gemeinsamen Hidden-Fort-/Central-Access-Slice mit gemeinsamen Akzeptanzkriterien fordert. Entblockung: Pavit-Installationsvertrag und Simon-Central-Access-Reihenfolge/Queue-Vertrag dokumentieren oder die Activity planning-konform in kleinere Folgepakete zerlegen.
