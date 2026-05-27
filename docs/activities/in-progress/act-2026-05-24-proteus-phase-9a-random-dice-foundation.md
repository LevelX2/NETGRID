---
activityId: act-2026-05-24-proteus-phase-9a-random-dice-foundation
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
releaseTarget: Proteus Phase 9a
proReferences:
  - PRO016
blockedBy:
  - act-2026-05-24-proteus-phase-8f-random-bad-publicity-virus-longtail
  - roadblock_encounter_entry_random_pass_derez_contract
  - corp_random_discard_cost_contract
  - run_temporary_corp_credit_pool_contract
  - lisa_blight_subroutine_copy_target_contract
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-9a-random-dice-foundation.md
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
checks:
  - rg Roadblock/Executive Boot Camp/Lisa Blight/Forward's Legacy in Proteus cards, errata and engine random paths
  - rg CardAbilityCostImplementation/corp_random_discard_from_hq/iceEncounter/random special support in engine
  - git diff --check
---

# Proteus Phase 9a: Random/Dice Foundation

## Ziel

`Roadblock`, `Executive Boot Camp`, `Lisa Blight` und `Forward's Legacy` mit generischen Würfel-/Random-Resolvern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9a Random/Dice Foundation`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/releases/proteus/variable-ice-contract.md` für `Roadblock`.

## Zielkarten

- `onr_proteus_035_roadblock` Roadblock
- `onr_proteus_058_executive-boot-camp` Executive Boot Camp
- `onr_proteus_063_lisa-blight` Lisa Blight
- `onr_proteus_087_forwards-legacy` Forward's Legacy

## Scope

- Generische Würfel-/Random-Bausteine mit Seed, `randomCounter` und `RandomDrawRecords`.
- Öffentliche Ergebnisprojektion ohne Seed-, Kandidaten- oder Hidden-Zone-Leaks.
- Replay-/StateHash-Stabilität für alle Random-Pfade.

## Nicht im Scope

- Keine Action-Economy-Slices 9b.
- Keine Hidden-Zone-Search-Slices 9c.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Random-Ergebnisse werden ausschließlich über Seed, `randomCounter` und `RandomDrawRecords` erzeugt.
- [ ] PublicPayloads enthalten keine Seeds, privaten Kandidatenlisten oder Hidden-Zone-Informationen.
- [ ] LegalAction-Projektion und `applyAction`-Revalidierung decken Seite, Timing, Kosten, Ziele und Choices ab.
- [ ] Wrong-Side-, stale-action-, RandomDrawRecords-, Replay-/StateHash- und Redaction-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Blocker

Der Slice ist als gemeinsamer Implementierungsschnitt blockiert. Die vier Zielkarten teilen zwar `random_die_resolution`, benötigen aber unterschiedliche generische Timing-, Kosten- und Zielmodelle, die der aktuelle Ability-/CardImplementation-Bestand nicht vollständig trägt:

- `Roadblock` braucht einen Encounter-Entry-Random-Effekt auf der ICE selbst: Bei einer 6 wird Roadblock derezzed und der Runner passiert die ICE automatisch; sonst gilt ein nur für diesen Encounter wirkender Strength-Bonus in Höhe des Wurfs. Der vorhandene `iceEncounter`-Hook deckt nur temporäre Trace-Credits ab; der vorhandene `futureEncounterIceStrengthBonus` ist runweit und wäre für Roadblock zu breit.
- `Executive Boot Camp` braucht eine Korp-Run-Ability mit Random-Discard aus HQ als Kosten und einen temporären Korp-Credit-Pool, der nur während dieses Runs ausgegeben werden darf und am Run-Ende zurückgegeben wird. Aktuelle aktivierte CardImplementation-Kosten unterstützen Credits, Actions, Advancement-/Source-Counter und `trash_source`, aber keinen randomisierten HQ-Discard als Kosten und keinen Korp-Run-Credit-Pool.
- `Lisa Blight` braucht ebenfalls Random-Discard aus HQ als Kosten, dazu eine Korp-Run-Ability mit Zielauswahl für eine Subroutine auf ICE in diesem Fort und ein rungebundenes Kopieren direkt hinter der Originalsubroutine. Der vorhandene Riddler-Pfad kann nur eine neue Subroutine auf das aktuell encountered ICE hängen; er kann keine bestehende Subroutine in einem Fort auswählen und kopieren.
- `Forward's Legacy` ist voraussichtlich mit dem bestehenden AI-Boon-artigen Run-Start-Random-Strength-Muster gut umsetzbar. Eine isolierte Promotion wäre aber kein vollständiger 9a-Abschluss und würde die blockierten Corp-/ICE-Teile verschleiern.

Es wurden bewusst keine Teil-CardImplementations promotet. Der sinnvolle nächste Schritt ist ein enger Re-Schnitt oder Vertrag für mindestens drei generische Familien: Encounter-Entry-Random-ICE, Korp-Random-Discard-Kosten mit Hidden-Info-Redaction und rungebundene temporäre Korp-Credits/Subroutine-Copy-Ziele.

## Ergebnisnotiz

Blockiert dokumentiert. Keine Runtime-Änderung, keine Manifest-Promotion und keine Deck-/AI-Freigabe.
