# Disgruntled-Runfenster: Red Evidence

Datum: 2026-08-02
Status: reproduziert, P1 abgeschlossen

## Befund

Die unveränderten Hard-Selfplays von Rent-I-Con gegen Neon Escrow
reproduzieren in den Seeds `neon-escrow-counterbank-rent-02` und
`neon-escrow-counterbank-rent-04` denselben Fehler:

- Failure Code: `missing_plan_module_coverage`;
- Ownerdiagnose: `plan_registry`;
- Seite und Timing: Runner, `run.jack_out_window`;
- LegalAction-Typen: `continue_run`, `jack_out`, `trigger_ability`;
- Coverage: 66,67 Prozent;
- fehlende produktive Route: Disgruntled Ice Technician
  `derez_fully_broken_passed_ice_and_end_run`.

Seed 02 endet bei StateVersion 277 mit StateHash `fnv1a:f9f74d58`, Seed 04
bei StateVersion 50 mit StateHash `fnv1a:5493b6c6`. Beide Replays bleiben
deterministisch und grün. Damit ist der Fehler eine KI-Coverage-Lücke, keine
Engine-IllegalAction und keine Replay-Abweichung.

## Spielgleicher Checkpoint

Der versionierte Checkpoint
`cp-disgruntled-01-post-pass-derez-d277.json` erfasst Seed 02 unmittelbar vor
der Entscheidung. Die Engine erzeugt dort exakt:

```text
actionId: runner.trigger_ability.runner_onr_proteus_106_disgruntled-ice-technician_1.runner_onr_proteus_106_disgruntled-ice-technician_1
source instance: runner_onr_proteus_106_disgruntled-ice-technician_1
target ICE: corp_onr_v1_237_data-wall_1
target definition: onr_v1_237_data-wall
timing: run.jack_out_window
utility: derez_fully_broken_passed_ice_and_end_run
```

Der neue Checkpointtest fordert dieselbe Action unter dem vorhandenen Owner
`runner.convert_run_window` und ist vor P2 mit
`missing_plan_module_coverage` rot.

## Binding-Differenz und Ursache

Die echte LegalAction trägt `cardId`, Ziel-ICE, Zieldefinition, Utility und
Zahlbetrag, aber keine autoritative Quellenkartendefinition und keine
generische `abilityId`. Der zunächst direkt aus der Engine-Action gebildete
`ActionSemanticCandidate` bindet zwar die Quelleninstanz als
`sourceKind: card`, bleibt jedoch bei `abilityBindingMethod: unresolved`,
`confidence: low` und `projectionIssues: [ability_unresolved]`.

Zusätzlich filtert die positive AI-Input-Allowlist die bisherigen
Sonderfelder `runnerUtilityAbility`, `targetIceId`,
`targetIceDefinitionId` und `paymentAmount`. Im tatsächlich produktiven
AI-Input fehlen dem Runfensterplan daher sowohl die funktionsbasierte
Fähigkeitskennung als auch die exakte Zielbindung. Das erklärt, warum eine
isolierte Ergänzung der rohen Engine-LegalAction die Coverage-Lücke nicht
vollständig schließt.

Der bereits grüne synthetische Runtime-Test enthält dagegen zusätzlich
`sourceDefinitionId: onr_proteus_106_disgruntled-ice-technician`. Er belegt
damit den richtigen fachlichen Owner und die bereits vorhandene
funktionsbasierte Planbewertung, verdeckt aber die reale Engine-/Semantik-
Bindungslücke.

## Fixgrenze für P2

Die Engine kennt Definition, Quelleninstanz, Funktionsfamilie und Ziel beim
Erzeugen der LegalAction bereits. P2 darf diese bestehenden, side-sicheren
Tatsachen als generische `abilityId` sowie Quellen-/Zielmetadaten
transportieren und durch die positive AI-Input-Allowlist reichen. Danach soll
die vorhandene Funktionssemantik den Trigger ohne Karten-ID-Chooser dem
bestehenden `runner.convert_run_window` zuordnen.
Kartentext, Timing, Kosten, Ziellegalität, Action-ID und Wirkung bleiben
unverändert.
