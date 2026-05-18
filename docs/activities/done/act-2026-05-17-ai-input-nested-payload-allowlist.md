---
activityId: act-2026-05-17-ai-input-nested-payload-allowlist
status: done
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/input-dto.ts
  - packages/ai/src/index.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# AI-Input-DTO für verschachtelte Payloads per Allowlist härten

## Ziel

Der bestehende positive AI-Input-DTO soll gegen neue oder verschachtelte Hidden-Info-Felder in `LegalAction`-, PublicEvent-, Choice- und Debug-Payloads gehärtet werden. Neue erlaubte Payloadformen sollen bewusst typisiert oder normalisiert werden, statt implizit durchgereicht zu werden.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitt `P0: AI-Input-Redaction-Allowlist`.
- Verwandtes erledigtes Paket: `docs/activities/done/act-2026-05-17-ai-input-positive-dto.md`.
- Die erledigte DTO-Arbeit hat den positiven Builder eingeführt. Dieses Follow-up fokussiert die nächste Schicht: verschachtelte Payloadformen, neue Mechanikfelder und Debug-Anreicherungen, die innerhalb erlaubter Top-Level-Objekte liegen können.

## Scope

- Bestehende `AiDecisionInputDto`-Builder und Tests in `packages/ai/src/input-dto.ts` und `packages/ai/src/index.test.ts` sichten.
- Feldfamilien für erlaubte verschachtelte Payloads definieren, mindestens für:
  - `legalActions.payload`,
  - `publicEvents.publicPayload`,
  - `choiceRequest`,
  - `decisionDebug` als Quelle oder Begleitdaten im AI-Kontext.
- Tests ergänzen, die verbotene verschachtelte Felder injizieren, z. B. gegnerische Handkarten, Decklisten, `privatePayload`, FullState-Fragmente, `cardInstances`, verdeckte Kartennamen und Session-/Tokenwerte.
- Erlaubte bekannte Payloadformen aus aktuellen Mechanikfamilien als Regression erhalten.
- Entscheiden und dokumentieren, ob verbotene Felder hart fehlschlagen oder deterministisch redigiert werden. Die Entscheidung muss für Runner- und Korp-Sicht gleich nachvollziehbar sein.

## Nicht im Scope

- Keine Änderung an KI-Strategie, Scoring, Planbewertung oder Action-Auswahl.
- Keine Erweiterung der AI-Sicht über `PlayerView`, `LegalActions`, side-sichere PublicEvents und eigene private Informationen hinaus.
- Keine Änderung an Engine-Redaction, Replay, StateHash oder `applyAction`.
- Kein vollständiges DecisionDebug-Ausgabeschema; das bleibt ein eigenes Paket.

## Akzeptanzkriterien

- [x] Verschachtelte verbotene Felder in `LegalAction`-, PublicEvent-, Choice- und Debug-nahen Payloads gelangen nicht in den AI-Input.
- [x] Erlaubte aktuelle Payloadformen bleiben erhalten und die bestehende KI-Auswahl ändert sich nicht durch Redaction-Nebeneffekte.
- [x] Tests decken mindestens je einen Runner- und Korp-Fall mit erlaubter Payload und mit injiziertem verbotenen Feld ab.
- [x] Die Allowlist-/Normalisierungsentscheidung ist im Code oder in einem nahen Testkommentar so dokumentiert, dass neue Mechanikpayloads bewusst ergänzt werden müssen.
- [x] `corepack pnpm --filter @netgrid/ai test` und `corepack pnpm --filter @netgrid/ai typecheck` sind grün oder Abweichungen sind im Ergebnis begründet.

## Umsetzungshinweise

- Zuerst eine kleine Payload-Inventur erstellen, statt direkt allgemeine Deep-Copy-Filter einzubauen.
- Den DTO-Builder bevorzugt positiv rekonstruieren lassen; generische "alles außer X"-Filter sind hier nur zusätzliche Guards.
- Bei legitimen neuen Payloadformen konkrete Feldgruppen erlauben, keine pauschalen Objektbäume.
- Hidden-Info-Gate: Keine private Gegenseite, kein FullState, keine verdeckten Kartennamen, keine Debugdaten als neue AI-Wissensquelle.

## Ergebnisnotiz

Abgeschlossen. `buildAiDecisionInputDto` rekonstruiert verschachtelte Payloads jetzt über positive Allowlists: `LegalAction.payload`, `PublicEvent.publicPayload`, Choice-Optionen und `stackSearchResolution` werden nicht mehr generisch tief kopiert. Aktuelle Setup-/Deck-/Baseline-, Ability-, Run-/Trace-/Hidden-Zone- sowie Betrags-/Ziel-Payloadformen bleiben erlaubt; `privatePayload`, `cardInstances`, `fullGameState`, Token, Decklisten und Debug-Fragmente werden deterministisch redigiert. Neue Tests decken Runner und Korp ab und zeigen, dass AI-Entscheidungen durch die Redaction nicht kippen.
