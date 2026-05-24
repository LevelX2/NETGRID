---
activityId: act-2026-05-24-proteus-phase-1f-run-spend-cap
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 1f
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts: []
checks: []
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

Noch offen.
