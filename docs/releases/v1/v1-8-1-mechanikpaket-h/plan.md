# V1.8.1 Detailed Plan - Mechanikpaket H

Stand: 2026-05-10  
Status: Planungsfreeze (nur Planung, keine Umsetzung)

## Zweck und Zielbild

Dieses Dokument liefert eine umsetzungsreife Detailplanung für V1.8.1 als reines Planungsartefakt.  
Ziel ist ein deterministischer, gate-konformer Kernrelease für Counter-/Virus-/Purge-Mechaniken und rungebundene Folgeflags mit sauberem Deferred-Schnitt.

## Verbindliche Eingaben

- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/release-assignment-preflight.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/requirements.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/spec.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/test-matrix.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/requirements-review.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Scope und No-Scope

### Scope

1. `L2_Counter_System_und_Virus_Purge_Trigger`
2. Run-gebundene Folgeflags für Encounter-/Jack-out-/Penalty-Pfade
3. Servergebundene Installkosten-Taxpfade
4. Scored-Agenda-Counteraktionen (LegalAction-only)

### No-Scope

1. Keine Würfel-/Zufallsresolver aus V1.9.0.
2. Keine Ambush-/Access-Sonderresolver aus V1.9.0.
3. Keine Erweiterung von `ai_supported` ohne separaten Gate-Track.
4. Keine V2.x- oder Public-Plattformfeatures.

## Abhängigkeitsprüfung und Auflösung

| Dep-ID | Abhängigkeit | Typ | Prüfmethode | Ergebnis | Auflösung |
| --- | --- | --- | --- | --- | --- |
| DEP-181-001 | V1.8.0 Final Gate grün | hart | Status-/Final-Review-Abgleich | erfüllt | V1.8.1 darf starten. |
| DEP-181-002 | Counter-/Virus-Basis aus V0.99 vorhanden | hart | Matrix + Engine-Vertrag | erfüllt | V1.8.1 erweitert deterministisch statt Neubau. |
| DEP-181-003 | Run-Lifecycle inkl. Run-Locks stabil (V1.7.1/1.7.2) | hart | Regression-Pflicht aus Testmatrix | erfüllt | Folgeflags werden am bestehenden Run-State geführt. |
| DEP-181-004 | Agenda-Scoring-/Statikbasis aus V1.8.0 stabil | hart | Requirements + Regression | erfüllt | Coup-Counteraktionen als score-area-Aktionen aufsetzen. |
| DEP-181-005 | Catalog-/Manifest-/Runtime-Gate-Modell aktiv | hart | Catalog-Tests + Manifest-Policy | erfüllt | Exakter 12-Karten-Unlock ohne implizite Freigaben. |
| DEP-181-006 | Deterministischer Würfelresolver | blockierend für Teilmenge | Matrix-Schnitt je Karte | nicht erfüllt für 2 Karten | `Cockroach` und `Incubator` auf V1.9.0 deferred. |
| DEP-181-007 | Remainder-of-run-Breaker-Lifecycle für `Grubb` | blockierend für Einzelkarte | Resolverprüfung | offen | `Grubb` in V1.8.1 deferred mit expliziter Begründung. |

## Kartenkorb und Freigabeentscheidung

### Kernkorb (12 Karten, freigabefähig)

1. `onr_v1_012_clown`
2. `onr_v1_046_pattels-virus`
3. `onr_v1_049_pox`
4. `onr_v1_094_inside-job`
5. `onr_v1_173_restrictive-net-zoning`
6. `onr_v1_193_corporate-coup`
7. `onr_v1_209_political-coup`
8. `onr_v1_222_ball-and-chain`
9. `onr_v1_225_canis-major`
10. `onr_v1_226_canis-minor`
11. `onr_v1_242_fatal-attractor`
12. `onr_v1_268_shock-r`

### Deferred (3 Karten)

1. `onr_v1_013_cockroach` -> deferred bis V1.9.0 (`L3_Deterministischer_Wuerfel_Zufall`)
2. `onr_v1_034_incubator` -> deferred bis V1.9.0 (`L3_Deterministischer_Wuerfel_Zufall`)
3. `onr_v1_030_grubb` -> deferred wegen offenem remainder-of-run-Breaker-Lifecycle außerhalb V1.8.1-Scope

## Zielarchitektur für die Umsetzung

### Block A: Counter-/Virus-/Purge-Vertrag

1. Erfolgreiche-Run-Trigger für `Pattel's Virus` und `Pox` deterministisch nach dem Run-Ende einhängen.
2. Viruszustände als explizite Counterdaten auf Karten bzw. servergebunden (`poxCountersByServer`) führen.
3. `purge_virus_counters` räumt beide Speicherarten vollständig und statehash-stabil.
4. Purge wird ausschließlich über LegalActions angeboten und in `applyAction` revalidiert.

### Block B: Run-Folgeflags

1. `Inside Job`: First-ICE-Bypass als dedizierter Run-Flag.
2. `Ball and Chain`: weiterer Encounter-Tax oder Run-Ende als deterministischer Flagpfad.
3. `Canis Major`/`Canis Minor`: future-encounter strength modifier für verbleibende ICE im selben Run.
4. `Fatal Attractor`/`Shock.r`: next-encounter penalties inklusive Jack-out-Lock.
5. Flags müssen nach Gültigkeitsende zuverlässig zurückgesetzt werden.

### Block C: Servergebundene Installkosten-Tax

1. `Restrictive Net Zoning` bindet bei Install genau einen Server (`selectedServerId`).
2. `Pox` erzeugt servergebundene Taxstufen über Counter.
3. Corp-ICE-Installkosten lesen beide Quellen in einer zentralen Kostenfunktion.
4. Kein Tax für fremde Server; kein Leak über verdeckte Informationen.

### Block D: Scored-Agenda-Counteraktionen

1. `Corporate Coup` erhält beim Scoren 5 Counter, `Political Coup` 6.
2. Aktivierbare Agendaaktion nur als LegalAction: Klick gegen 1 Credit.
3. `applyAction` revalidiert Side, Source, Kosten, Counterverfügbarkeit.
4. Kein Zugriff, wenn Agenda nicht in der Score Area liegt.

### Block E: Visibility, Replay, StateHash

1. Neue Flags/Counter dürfen nur notwendige öffentliche Informationen projizieren.
2. Eventlog bleibt reproduzierbar für Counteränderungen, Purge und Flagtransitionen.
3. Replay-/StateHash-Determinismus bleibt für positive und negative Pfade stabil.
4. Keine Hidden-Info-Leaks in PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors, DecisionDebug.

## Arbeitspakete (nur Plan)

### WP0 - Preflight und Freeze-Schnitt

- Eingaben: Matrix, Roadmap, V1.8.0 Final Gate
- Ergebnis: verbindlicher 12/3-Schnitt mit Begründung je Karte
- Abnahme: Preflight-Artefakt vorhanden und in Requirements referenziert

### WP1 - Datenmodell und Verträge

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- Ziel: Counter-/Run-Flag-/Action-Payload-Verträge vollständig definieren
- Abnahme: Typsystem und Action-Vertrag vollständig, ohne Scope-Ausweitung

### WP2 - Engine-Resolver Block A/B

- `packages/engine/src/index.ts`
- Ziel: Trigger-/Purge-/Run-Flag-Resolver deterministisch integrieren
- Abnahme: Reihenfolge stabil, keine illegalen Übergänge

### WP3 - Engine-Resolver Block C/D

- `packages/engine/src/index.ts`
- Ziel: servergebundene Taxkosten + Coup-Agenda-Aktionen
- Abnahme: LegalAction-only, Revalidierung vollständig

### WP4 - Catalog-/Manifest-/Runtime-Gate

- `packages/catalog/src/index.ts`
- `data/manifests/card-implementation-manifest-1.8.1.json`
- `data/scenarios/v181-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.8.1.json`
- Ziel: nur 12 Karten freigeben, deferred unverändert halten
- Abnahme: manifest- und katalogkonsistent, kein impliziter Unlock

### WP5 - Testabdeckung und Regression

- `packages/engine/src/index.test.ts`
- `packages/catalog/src/index.test.ts`
- `packages/ai/src/index.test.ts` (nur Regression, kein neuer KI-Support)
- Ziel: Must-/Should-Gates vollständig testbar
- Abnahme: V181-T001 bis V181-T011 grün

### WP6 - Review und Finalisierung

- `docs/releases/v1/v1-8-1-mechanikpaket-h/implementation-review.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/final-review.md`
- `docs/codex/CODEX_STATUS.md`
- Ziel: Gateabschluss dokumentieren, No-Scope explizit bestätigen
- Abnahme: `V1_8_1_done: true` und `ready_for_V1_9_0: true`

## Test- und Gateplan für die Umsetzung

1. Unit-Gates: Counter-Inkrement, Purge, Run-Flags, Coup-Aktionen.
2. Negative Gates: illegale Purge-/Agenda-/Install-Action-Pfade.
3. Visibility-Gates: keine Leaks durch servergebundene Tax- und Flagzustände.
4. Replay-/StateHash-Gates: deterministische Reihenfolge bei Multi-Triggern.
5. Catalog-/Manifest-Gates: exakt 12 Karten neu, 3 deferred.
6. Pflichtchecks:
   - `corepack pnpm lint`
   - `corepack pnpm typecheck`
   - `corepack pnpm test`
   - `corepack pnpm build`
   - `corepack pnpm --filter @netgrid/engine test -- index.test.ts`
   - `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
   - `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Risiko- und Gegenmaßnahmenregister

| Risiko-ID | Risiko | Gegenmaßnahme | Stop-Kriterium |
| --- | --- | --- | --- |
| R-181-001 | Triggerreihenfolge driftet zwischen Runtime, Replay, Tests | feste Resolver-Priorität + deterministische Event-Reihenfolge | unterschiedliche StateHashes für gleiche Seed-Pfade |
| R-181-002 | Run-Folgeflags laufen über Encounter-Grenzen hinaus | expliziter Lifecycle je Flag inkl. Clear-Punkt | Flag bleibt nach Run-Ende gesetzt |
| R-181-003 | Taxpfade kollidieren mit Installkostenberechnung | zentrale Kostenaggregation, keine ad-hoc-Additionen | Abweichung zwischen LegalAction-Kosten und Apply-Kosten |
| R-181-004 | Action-ID-Kollision bei servergebundener Install-Choice | `selectedServerId` als Teil der Action-ID führen | zwei verschiedene LegalActions teilen eine Action-ID |
| R-181-005 | Deferred-Karten werden versehentlich freigegeben | explizite Runtime-Allowlist + Manifest-Prioritätstests | `cockroach`, `incubator` oder `grubb` werden `human_playable/deck_legal` |

## Ready-for-Implementation-Checkliste

- [ ] V1.8.0 Final Gate dokumentiert grün.
- [ ] 15er-Korb in `12 freigabefähig / 3 deferred` fixiert.
- [ ] Deferred-Begründungen für `Cockroach`, `Incubator`, `Grubb` unverändert explizit.
- [ ] Must-Anforderungen V181-MUST-001 bis V181-MUST-014 testbar aufgelöst.
- [ ] No-Scope-Grenzen für V1.9.0-/V2.x-Elemente aktiv abgesichert.
- [ ] Testmatrix V181-T001 bis V181-T011 vor Code vollständig abgedeckt.
- [ ] Final-Review-Gate inklusive Statusaktualisierung vorbereitet.

## Ergebnis dieses Planungsdokuments

V1.8.1 ist als nachfolgende Umsetzungsvorlage vollständig eingegrenzt.  
Abhängigkeiten sind geprüft, blockierende Teilabhängigkeiten sind über Deferred-Schnitt aufgelöst, und der Umsetzungspfad ist in deterministische Arbeitspakete mit klaren Gates zerlegt.
