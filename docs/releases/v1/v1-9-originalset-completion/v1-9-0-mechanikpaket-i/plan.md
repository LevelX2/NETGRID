# V1.9.0 Detailed Plan - Mechanikpaket I

Stand: 2026-05-10  
Status: Planungsfreeze (nur Planung, keine Umsetzung)

## Zweck und Zielbild

Dieses Dokument liefert eine umsetzungsreife Detailplanung für V1.9.0 als reines Planungsartefakt.  
V1.9.0 ist der letzte Mechanik-/Karten-Schritt vor V2.x und schließt deterministischen Würfelzufall plus verbleibende Sonderresolverpfade mit einem klaren 5-Karten-Kern.

## Verbindliche Eingaben

- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/release-assignment-preflight.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements-review.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Scope und No-Scope

### Scope

1. `L3_Deterministischer_Wuerfel_Zufall`
2. `L4_Konkreter_Sonderresolver_noch_offen` (Banpei-konkretisiert)
3. `L2_Ambush_auf_Access_Resolver` als Foundation
4. Exakter 5-Karten-Unlock für V1.9.0

### No-Scope

1. Keine V2.x-Produktfunktionen.
2. Kein zusätzlicher Kartenunlock über den 5er-Kern hinaus.
3. Kein automatischer `ai_supported`-Upgrade.
4. Keine implizite Übernahme des V1.8.1-Deferred-Überhangs.

## Abhängigkeitsprüfung und Auflösung

| Dep-ID | Abhängigkeit | Typ | Ergebnis | Auflösung |
| --- | --- | --- | --- | --- |
| DEP-190-001 | V1.8.1 Final Gate grün | hart | erfüllt | V1.9.0 darf starten (`ready_for_V1_9_0: true`). |
| DEP-190-002 | Deterministische RNG-Basis (`seed`, `randomCounter`, `randomDrawRecords`) vorhanden | hart | erfüllt | wird um zentralen Würfelhelper erweitert. |
| DEP-190-003 | Run-/Encounter-Lifecycle stabil (V1.7.1+ / V1.8.1) | hart | erfüllt | wird für Bartmoss/Blink/Vacuum-Link wiederverwendet. |
| DEP-190-004 | Turn-Flag-Basis für Last-Turn-Checks vorhanden (Runner) | teilhart | teilweise erfüllt | für `Terrorist Reprisal` wird Corp-Last-Turn-Flag ergänzt. |
| DEP-190-005 | `trash_installed_program`-Subroutine existiert | teilhart | erfüllt | Banpei-L4 wird als konkreter Resolververtrag darauf aufgesetzt. |
| DEP-190-006 | Ambush-Karten ohne zusätzliche Familien sofort freigabefähig | blockierend für Kartenunlock | nicht erfüllt | Ambush wird als Foundation mit Testnachweis umgesetzt, ohne Zusatz-Unlock. |
| DEP-190-007 | V1.8.1-Deferred (`Cockroach`, `Incubator`, `Grubb`) automatisch mitziehbar | blockierend für Scope | nicht erfüllt | bleiben im V1.9.0-Kern deferred und werden explizit dokumentiert. |

## Kartenkorb und Freigabeentscheidung

### Kernkorb (5 Karten, freigabefähig)

1. `onr_v1_005_bartmoss-memorial-icebreaker`
2. `onr_v1_007_blink`
3. `onr_v1_115_terrorist-reprisal`
4. `onr_v1_223_banpei`
5. `onr_v1_275_vacuum-link`

### Deferred aus Vorrelease (bleibt deferred im V1.9.0-Kern)

1. `onr_v1_013_cockroach`
2. `onr_v1_034_incubator`
3. `onr_v1_030_grubb`

## Umsetzungsarchitektur (für nachfolgende Implementierung)

### Block A: Deterministischer Würfelkernel

1. Zentraler `rollDeterministicDie`-Pfad (1..6) auf Basis `nextRandom`.
2. Einheitliche purpose-Namensräume (`v190.die.<card>.<context>`).
3. Reproduzierbarkeit in Replay/StateHash.

### Block B: Encounter-gebundene Zufallseffekte

1. Bartmoss: post-encounter trigger bei tatsächlicher Break-Nutzung.
2. Blink: subroutine-spezifische einmalige Würfelaktivierung je Encounter.
3. Vacuum Link: subroutine-Würfelwurf plus Run-Rewind auf rezzte ICE.

### Block C: Last-Turn-Condition und Random-HQ-Discard

1. Corp-Last-Turn-Subtype-Tracking (`black_ops_scored_last_turn`).
2. LegalAction-Gating für Terrorist Reprisal.
3. Deterministischer Random-Discard aus HQ (bis zu 5 Karten, ohne Duplikate).

### Block D: Sonderresolver Banpei

1. Konkreter Resolververtrag für `trash program`.
2. Deterministischer Zielpfad mit stabilem Fallback.
3. Subroutinenreihenfolge bleibt unverändert (`trash`, dann `end the run`).

### Block E: Ambush-Foundation

1. Dedizierter Resolver-Einstieg im Access-Pfad.
2. Test-/Harness-Nachweis für deterministische und side-sichere Ausführung.
3. Kein zusätzlicher Kartenunlock im V1.9.0-Kern.

### Block F: Release-Gates und Artefakte

1. Runtime-Allowlist erweitert exakt um 5 Karten.
2. Neues Manifest `card-implementation-manifest-1.9.0.json`.
3. Neues Coverage-Artefakt `mechanics-coverage-1.9.0.json`.
4. Neues Smoke-Szenario `v190-card-release-smoke.json`.

## Arbeitspakete (nur Plan)

### WP0 - Scope- und Preflight-Freeze

- Eingaben: Matrix, Roadmap, V1.8.1 Final Gate
- Ergebnis: finaler 5er-Kernkorb + deferred Überhangbericht
- Abnahme: `V1_9_0_RELEASE_ASSIGNMENT_PREFLIGHT.md`

### WP1 - Datenmodell und Turn-Flags

- Ziel-Dateien:
  - `packages/shared/src/index.ts`
  - `packages/engine/src/index.ts`
- Ergebnis: Würfel-/Tracking-/Last-Turn-Verträge ergänzt
- Abnahme: Typmodell vollständig, keine Scope-Ausweitung

### WP2 - Engine-Resolver Zufallskarten

- Ziel-Datei: `packages/engine/src/index.ts`
- Ergebnis: Bartmoss, Blink, Terrorist Reprisal, Vacuum Link
- Abnahme: deterministische Würfel- und Random-Discard-Pfade

### WP3 - Engine-Resolver Banpei + Ambush-Foundation

- Ziel-Datei: `packages/engine/src/index.ts`
- Ergebnis: Banpei-L4 und Ambush-Foundation-Einstieg
- Abnahme: deterministischer Sonderresolver, eigener Foundation-Nachweis

### WP4 - Card-/Catalog-Freigabe

- Ziel-Dateien:
  - `packages/shared/src/index.ts`
  - `packages/catalog/src/index.ts`
  - `packages/catalog/src/index.test.ts`
- Ergebnis: 5 Karten sauber definiert und freigegeben
- Abnahme: keine impliziten Freigaben außerhalb des Kernkorbs

### WP5 - Tests und Regression

- Ziel-Dateien:
  - `packages/engine/src/index.test.ts`
  - `packages/ai/src/index.test.ts` (nur Regression)
  - `apps/web/app/chronicle.test.ts` (falls Eventprojektion betroffen)
- Ergebnis: V190-T001 bis V190-T012 abgedeckt
- Abnahme: Pflichtchecks grün

### WP6 - Datenartefakte und Reviews

- Ziel-Dateien:
  - `data/manifests/card-implementation-manifest-1.9.0.json`
  - `data/scenarios/v190-card-release-smoke.json`
  - `data/rules/mechanics-coverage-1.9.0.json`
  - `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/implementation-review.md`
  - `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/final-review.md`
  - `docs/codex/CODEX_STATUS.md`
- Ergebnis: vollständiger Gate-Nachweis
- Abnahme: `V1_9_0_done: true` und V2.x-Freigabepfad dokumentiert

## Test- und Gateplan für die Umsetzung

1. Unit-Gates: Würfelkernel, Banpei-Resolver, Rewind-Algorithmen, Random-HQ-Discard.
2. Szenario-Gates: mehrstufige Run-/Encounter-Sequenzen mit Zufallszweigen.
3. Visibility-Gates: keine Hidden-Info-Leaks bei Discard, Ambush-Foundation, Rewind.
4. Replay-/StateHash-Gates: identische Seeds erzeugen identische Zufallspfade.
5. Artifact-Gates: Manifest/Coverage/Scenario konsistent zum 5er-Kern.
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
| R-190-001 | Zufallspfad driftet zwischen Runtime und Replay | zentraler Würfelhelper + purpose-konsequente Records | unterschiedliche StateHashes bei gleichem Seed |
| R-190-002 | Blink erzeugt Mehrfachbreaks derselben Subroutine | per-Encounter/Subroutine-Usage-Tracking | gleiche Subroutine mehrfach durch Blink in einem Encounter |
| R-190-003 | Vacuum-Link-Rewind verletzt Run-Lifecycle | klare Rewind-Regeln auf rezzte ICE + Movement-Phase-Integration | Run bleibt in inkonsistentem Positionszustand |
| R-190-004 | Terrorist-Reprisal-Bedingung wird falsch evaluiert | explizite Corp-Last-Turn-Flags + negative Tests | Event legal ohne Black-Ops-Score im letzten Corp-Zug |
| R-190-005 | Banpei-L4 bleibt implizit/uneinheitlich | dedizierter Resolververtrag + Szenariotests | unterschiedliche Programmauswahl bei identischem Zustand |
| R-190-006 | Ambush-Mechanik bleibt formal offen | Foundationscope mit eigenem Testnachweis | kein nachweisbarer Access-Ambush-Einstiegspunkt |

## Ready-for-Implementation-Checkliste

- [ ] V1.8.1 Final Gate dokumentiert grün.
- [ ] V1.9.0-Kernkorb exakt auf 5 Karten fixiert.
- [ ] Deferred-Überhang (`Cockroach`, `Incubator`, `Grubb`) explizit und unverändert dokumentiert.
- [ ] Must-Anforderungen V190-MUST-001 bis V190-MUST-014 testbar aufgelöst.
- [ ] Ambush-Foundation und Würfelkernel als separate Gateblöcke abgesichert.
- [ ] Testmatrix V190-T001 bis V190-T012 vollständig vor Code abgedeckt.
- [ ] Final-Review- und Statusupdate-Template vorbereitet.

## Ergebnis dieses Planungsdokuments

V1.9.0 ist als nachfolgende Umsetzungsvorlage vollständig eingegrenzt.  
Abhängigkeiten sind geprüft, notwendige Blocker sind durch konkrete Scope-Entscheidungen aufgelöst, und der Umsetzungspfad ist in deterministische Arbeitspakete mit klaren Gates zerlegt.
