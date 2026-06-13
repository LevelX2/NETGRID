# AI Proteus Hidden Resource/Ambush/Virus Readiness

Status: diagnostic_readiness_only

## Ziel

Proteus-Karten mit Hidden-Resource-, Ambush- und Virus/Antibody-Bezug diagnostisch klassifizieren. Keine KI-Freigabe, keine Runtime-Wirkung.

## Klassifikation

| Karte | Klasse | Hinweis |
| --- | --- | --- |
| Airport Locker | hidden_resource_constraints | Hidden Resource bleibt side-safe zu modellieren. |
| HQ Mole | hidden_resource_constraints | HQ-Wissen darf nicht in Runner-/Corp-Inputs leaken. |
| R&D Mole | hidden_resource_constraints | R&D-Wissen braucht separate Memory-Grenze. |
| Simulacrum | target_choice_gaps | Zielwahl und Hidden-State müssen getrennt bleiben. |
| Death from Above | access_ambush_precision | Ambush-Damage nur mit sichtbarem Access-Kontext. |
| Mercenary Subcontract | target_choice_gaps | Zielauswahl braucht side-safe Optionen. |
| Doppelganger Antibody | virus_counter_risk | Virus/Antibody-Modell fehlt. |
| Pattel Antibody | virus_counter_risk | Counter-Risiko diagnostisch. |
| Stereogram Antibody | virus_counter_risk | Counter-Interaktion nicht runtimefähig. |
| Bel-Digmo Antibody | virus_counter_risk | Counter-Interaktion nicht runtimefähig. |

## Gates

```text
productiveUseAllowed: false
semanticExecutionAllowed: false
runtimeConsumerStatus: none
noRuntimeEffect: true
proteus_ai_supported: false
```

## Schluss

Proteus bleibt ohne Runtime-Effekt. Hidden-Resource-Constraints, TargetChoice-Gaps, Access-Ambush-Präzision und Virus-Counter-Risiken werden erst nach Originalset-Stabilisierung weiter geöffnet.
