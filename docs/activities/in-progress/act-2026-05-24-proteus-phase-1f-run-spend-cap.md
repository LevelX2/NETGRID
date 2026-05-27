---
activityId: act-2026-05-24-proteus-phase-1f-run-spend-cap
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
releaseTarget: Proteus Phase 1f
proReferences:
  - PRO019
blockedBy:
  - payment-source-contract-obfuscated-fortress-run-spend-cap
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md
checks:
  - Lokale Quellenprüfung `data/cards/proteus-cards.json` für `Obfuscated Fortress`
  - Codepfadprüfung `packages/engine/src/game/run/run-duration-payment.ts` und `packages/shared/src/index.ts` für bestehende Run-Zahlungsquellen
---

# Proteus Phase 1f: Run Spend Cap

## Ziel

`Obfuscated Fortress` als eigenen Run-weiten Credit-Ausgabenvertrag schneiden, weil die Karte globale Zahlungsvalidierung während eines Runs beeinflusst.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarte

- `onr_proteus_066_obfuscated-fortress` Obfuscated Fortress

## Benötigte Funktionsbausteine

- Start-of-run rez window:
  - Korp darf `Obfuscated Fortress` zu Beginn eines Runs auf diesem Fort rezzen.
  - Timing und Source-Fort werden in LegalAction und `applyAction` revalidiert.
- Runner credit-spend declaration:
  - Runner muss die geplante Credit-Ausgabe für den Run ansagen.
  - Wert ist public und StateHash-relevant.
- Run payment cap:
  - Alle Runner-Credit-Zahlungen während dieses Runs werden gegen die Ansage gedeckelt.
  - Zahlungsquellen und Spezialcredits müssen entweder eingeschlossen oder explizit ausgenommen werden; diese Entscheidung ist vor Umsetzung zu dokumentieren.
- Spend ledger:
  - Engine zählt Runner-Credits, die während des Runs tatsächlich ausgegeben werden.
  - Reconnect und Replay müssen dieselbe Summe projizieren.
- End-of-run shortfall loss:
  - Wenn Runner weniger ausgibt als angesagt, verliert Runner die Differenz nach Run-Abschluss.

## Nicht im Scope

- Keine Action-Spending-Caps.
- Keine Wilson-Weeflerunner-Logik oder andere V1-Longtail-Wiederverwendung ohne expliziten Vertrag.
- Keine Hidden-Info-Choices.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] `Obfuscated Fortress` hat eine per-card CardImplementation-Datei.
- [ ] Runner-Zahlungen werden während des Runs korrekt begrenzt und vor Zahlung revalidiert.
- [ ] End-of-run-Abrechnung ist deterministisch und replay-/StateHash-stabil.
- [ ] PublicPayload zeigt Ansage, ausgegebene Summe und Endabrechnung ohne verdeckte Kartendaten.
- [ ] Stale Zahlungsaktionen oberhalb des Caps werden abgelehnt.

## Umsetzungshinweise

- Dieser Slice ist bewusst getrennt, weil er zentrale Payment-Revalidation berührt.
- Vor Codearbeit entscheiden, ob Hosted Credits, Stealth Bits oder andere zweckgebundene Credits in die Ansage zählen.

## Ergebnisnotiz

Blockiert am 2026-05-24.

`Obfuscated Fortress` kann nicht legal-action-stabil vollständig umgesetzt werden, solange der Run-weite Zahlungsquellenvertrag offen ist. Der lokale Text verlangt, dass Runner die Anzahl der Bits ansagt, die während des Runs ausgegeben werden, danach nicht mehr ausgeben darf und am Run-Ende die nicht ausgegebene Differenz verliert. Der aktuelle Engine-Pfad zählt und validiert Runner-Run-Zahlungen aber über mehrere Quellen: normale Runner-Credits, Bad-Publicity-Run-Credits, temporäre Run-Credits, Hosted-/Recurring-Credits und Stealth-/zweckgebundene Bits. Die Activity verlangt ausdrücklich, diese Quellen vor Codearbeit einzuschließen oder auszunehmen.

Ohne verbindliche Entscheidung würde ein Resolver entweder zu eng sein und legale Spezialcredits fälschlich blockieren, oder zu weit sein und die Ansage durch nicht gezählte Quellen umgehen. Zusätzlich braucht der Start-of-run-Rezpfad einen engen Vertrag, weil der vorhandene Root-Rez-Laufzeitpfad Root-Karten primär in Run-Fenstern behandelt und `Obfuscated Fortress` nur am Start eines Runs auf diesem Fort rezzen darf.

Entblockung:

- Dokumentieren, ob normale Credits, Bad-Publicity-Credits, temporäre Run-Credits, Hosted-/Recurring-Credits und Stealth-Bits in die Ansage und den Spend-Ledger zählen.
- Danach einen generischen all-run payment cap in `spendRunnerRunCredits`/RunState mit Start-of-run-Rezfenster, Runner-Declaration, Ledger, End-of-run-Shortfall und Replay-/StateHash-Test umsetzen.
