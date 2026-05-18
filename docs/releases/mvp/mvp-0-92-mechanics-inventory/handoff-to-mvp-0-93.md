# MVP 0.92 + 0.93 Handoff

Status: Übergabeplanung; in diesem Thread erfüllt
Stand: 2026-05-03

Hinweis: V0.92 ist abgeschlossen und V0.93 wurde umgesetzt. Der frühere Übergabe-Prompt bleibt als Herkunfts- und Scope-Dokument erhalten.

## 1. Empfohlene Reihenfolge

1. V0.92 als Dokumentations- und Requirements-Gate abschließen.
2. V0.92 final reviewen und V0.93 freigeben.
3. V0.93 M1 technisch implementieren.
4. In V0.93 nur M2-Requirements erstellen, keine M2-Mechanik implementieren.
5. Danach getrennt entscheiden, ob V0.94 Damage/Flatline startet.

## 2. Übergabe-Prompt für den nächsten Thread

```text
Setze zu Beginn ein Goal:

Goal:
V0.92 und V0.93 für das private NETGRID-Projekt sauber umsetzen: zuerst V0.92 als Mechanik-Inventar-, Requirements- und Spezifikationsgate abschließen, danach V0.93 als M1-Engine-Fundament für Effects, Abilities, Timing, Choices und Eventklassifikation implementieren. M2 nur als Requirements planen, keine M2-Mechanik implementieren.

Wichtige Projektentscheidung:
Der Benutzer erlaubt für dieses private lokale Projekt die Nutzung eigener privater Kartenscans und lokaler Kartenbilder. Das gilt nur für den Privatgebrauch und nicht für öffentliche Distribution, offizielle Logos, offizielle Card Frames, Card Backs oder externe Kartendatenbank-Abhängigkeiten. Bitte V0.91 entsprechend als private lokale Asset-Entscheidung einordnen und sauber dokumentieren.

Bitte setze V0.92 + V0.93 für das NETGRID-Projekt gemäß den bestehenden Projektregeln um.

Arbeitsbasis zuerst lesen:
- KI-Wissen-NETGRID/00 Projektstart.md
- KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
- KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md
- KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md
- docs/codex/CODEX_STATUS.md
- docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md
- docs/releases/mvp/roadmaps/mechanics-completion-plan.md
- docs/releases/mvp/mvp-0-92-mechanics-inventory/plan.md
- docs/releases/mvp/mvp-0-93-m1-engine-foundation/plan.md
- docs/releases/mvp/mvp-0-92-mechanics-inventory/handoff-to-mvp-0-93.md

Defaults:
- V0.91-Assetstatus separat behandeln, aber als private lokale Scan-/Asset-Entscheidung dokumentieren.
- Mechanikarbeit nicht durch V0.91 blockieren.
- V0.92-Coverage-Matrix zusätzlich als `data/rules`-Artefakt anlegen.
- `pendingChoice` in V0.93 additiv in Shared/GameState/PlayerView vorbereiten, ohne Mulligan/Trace spielbar zu machen.
- Breaker-Aktionen intern als Ability-Pilot migrieren.
- Öffentliche Action Types kompatibel halten.
- StateHash-Rebaselines nur bei dokumentierter State-/Eventschema-Änderung erlauben.

Ziel:
1. V0.92 abschließen: Mechanik-Coverage-Matrix, M1-Requirements, M1-Effect/Timing-Spezifikation, M1-Testmatrix, Requirements Review und Final Review erstellen.
2. Danach V0.93 umsetzen: M1-Shared-/Engine-Grundlage für Effects, Abilities, Timing, Choices und Eventklassifikation implementieren.
3. In V0.93 zusätzlich M2-Requirements für Setup/Game-End erstellen.

Grenzen:
- Keine V0.94+-Mechanik implementieren.
- Keine Damage-, Trace-, Resource-, Mulligan-, Multiaccess-, Identity-Ability- oder Prevention-Mechanik freischalten.
- Keine neue spielbare Karte hinzufügen.
- Bestehende Actions und UI-Payloads kompatibel halten.
- Fremde lokale Änderungen nicht zurücksetzen und nicht versehentlich mitcommitten.
- Private lokale Assets nur projektintern behandeln, keine öffentlichen Asset-/Artwork-/Logo-/Card-Frame-Abhängigkeiten einführen.

Priorität:
- Engine-Korrektheit und Hidden-Info-Sicherheit vor Komfort.
- LegalActions bleiben die einzige Quelle für PlayerActions.
- applyAction revalidiert Side, actionId, stateVersion, Timing, Kosten, Ziele und Choices.
- Replay, StateHash, Visibility, Undo, WebSocket, Reconnect und KI-Input müssen side-sicher bleiben.
```

## 3. Entscheidungen vor oder während der Umsetzung

| Entscheidung | Empfohlene Vorgabe für den Umsetzungsthread |
|---|---|
| V0.91-Status | Als private lokale Scan-/Asset-Entscheidung dokumentieren; Mechanikarbeit dadurch nicht blockieren. |
| Maschinenlesbare Mechanik-Matrix | Ja, zusätzlich zur Markdown-Matrix anlegen, sofern die vorhandenen Datenartefakt-Konventionen passen. |
| Public Action API | Bestehende Action Types sichtbar behalten. Generische Ability-Struktur intern einführen. |
| `trigger_ability` | Nur vorbereiten oder einsetzen, wenn wirklich nötig. Keine UI-Migration erzwingen. |
| `pendingChoice` | In V0.93 additiv einführen und side-sicher testen. Keine neue sichtbare Choice-Mechanik freischalten. |
| Resolver-Umbau | Adapterstrategie nutzen. Erst Pilotpfade, dann weitere direkte Resolver migrieren. |
| StateHash-Rebaselines | Nur nach dokumentierter, absichtlicher State-/Eventschema-Änderung. |
| M2 | Nur Requirements. Mulligan und Game-End-Normalisierung nicht implementieren. |

## 4. Dateien, die der neue Thread voraussichtlich erzeugt

V0.92:

- `docs/releases/mvp/mvp-0-92-mechanics-inventory/requirements.md`
- `docs/architecture/card-rules/mechanics-coverage-matrix.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/releases/mvp/mvp-0-92-mechanics-inventory/mechanic-m1-effect-timing-spec.md`
- `docs/releases/mvp/mvp-0-92-mechanics-inventory/mechanic-m1-test-matrix.md`
- `docs/releases/mvp/mvp-0-92-mechanics-inventory/requirements-review.md`
- `docs/releases/mvp/mvp-0-92-mechanics-inventory/final-review.md`

V0.93:

- Shared-/Engine-Änderungen nach V0.93-Plan
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/setup-game-end-spec.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/requirements.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/test-matrix.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/requirements-review.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/implementation-review.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/final-review.md`

## 5. Nur bei Blockade erneut klären

Die Defaults aus diesem Handoff gelten als Startentscheidung. Der Umsetzungsthread soll nur stoppen oder nachfragen, wenn eine harte technische Blockade oder ein Sicherheitsrisiko auftaucht:

1. Wenn `data/rules/mechanics-coverage-0.92.json` nicht zu den vorhandenen Artefakt-Konventionen passt.
2. Wenn `pendingChoice` trotz additiver Einführung bestehende Serialization, PlayerViews oder Multiplayer-Verträge brechen würde.
3. Wenn die Breaker-Ability-Migration öffentliche Action Types oder UI-Payloads verändern müsste.
4. Wenn StateHash-Änderungen auftreten, die nicht klar durch eine dokumentierte State- oder Eventschema-Änderung erklärbar sind.
