# Faked Hit Self-Damage Semantics Review

Datum: 2026-06-08

## Ergebnis

`Faked Hit` hat im aktuellen AI-Hint- und Candidate-Stand keine ausreichend handlungswirksame Self-Damage-Semantik für einen generischen Survival-Guard. Die Engine- und Support-Evidence sind eindeutig, aber die Live-Hints und die aktuelle Action-Semantic-Candidate-Projektion transportieren Schadenstyp, Self-Damage-Ziel, Unpreventable-Status und Bad-Publicity-Closeout nicht vollständig bis zur Runner-Action-Bewertung.

Der Folgeguard darf deshalb nicht allein aus `riskTags: ["damage_window"]` entscheiden. Er braucht eine enge, side-sichere Self-Damage-Evidence für die Aktion.

## Geprüfte Evidence

- Engine: `packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts`
  - `add_bad_publicity`, `amount: 1`, `visibility: "public"`
  - danach `damage`, `recipient: "runner"`, `damageType: "core"`, `amount: 2`, `preventable: false`, `visibility: "public"`
- Supportmanifest: `data/manifests/proteus-card-support.json`
  - `onr_proteus_108_faked-hit` ist `ai_supported`.
  - Coverage nennt `bad_publicity_loss_gate` und `unpreventable_damage`.
  - Notiz bestätigt: 1 Bad Publicity, danach 2 unpreventable Core Damage, `bad_publicity_7` bleibt vor simultaner Flatline priorisiert.
- Aktiver Hint-Monolith: `data/ai/ai-card-hints-active.json`
  - positiver Effekt: `effects: [{ kind: "run_tax", timing: "action", scope: "corp", target: "bad_publicity_pressure" }]`
  - Risiko: nur `riskTags: ["damage_window"]`
  - keine Menge, kein Typ, kein Self-Damage-Ziel, kein `preventable: false`.
- Kompilierter Hint: `data/ai/ai-card-hints-compiled.json`
  - ergänzt für `Faked Hit` einen generischen `damage`-Effekt mit `amount: 2`, `kind: "damage"`, `scope: "runner"`, `resource: "damage"`, `timing: "action"`.
  - Der Eintrag bleibt für Survival zu grob: `resource` ist nicht `core` oder `brain`, `target` fehlt, `preventable` fehlt.
- Candidate-Typ: `packages/ai/src/action-semantic-candidate.ts`
  - `ActionCostProfile.selfDamage?: DamageAmount[]` existiert.
  - `costProfileForAction` befüllt `selfDamage` aktuell nicht aus LegalAction-Payload, CardImplementation oder Hints.
  - `applyCardSemanticJoin` hängt Card-Signale, Risiken und zusätzliche Kosten an, befüllt aber kein strukturiertes `costProfile.selfDamage`.

## Vertragsnachtrag für Folgepakete

Für `Faked Hit` soll die Folgeumsetzung eine enge Self-Damage-Evidence verwenden. Zulässige Mindestfelder:

- `sourceCardId: "onr_proteus_108_faked-hit"`
- `selfDamage: [{ type: "core", amount: 2 }]` oder gleichwertig `type: "brain"` mit lokal dokumentierter Brain/Core-Normalisierung
- `recipient: "runner"` beziehungsweise `target: "self"`
- `preventable: false`
- `timing: "action"`
- positiver Effekt: `addsBadPublicity: 1`
- Closeout-Regel: `immediateWinByAction = corpBadPublicityBefore + 1 >= 7`

Die Felder dürfen ausschließlich aus LegalActions, side-sicherer Candidate-/Hint-Evidence, eigener Runner-PlayerView und öffentlichen Bad-Publicity-Zählern abgeleitet werden. Kein FullState, keine gegnerischen verdeckten Karten, keine Engine-Legalitätserzeugung.

## Empfohlene Umsetzung

Für den nächsten engen Survival-Guard ist ein kleiner, cardId-basierter Adapter akzeptabel, solange er nur bekannte, side-sichere Self-Damage-Karten beschreibt und keine Legalität erzeugt:

- `onr_proteus_108_faked-hit`: action-timing Self-Damage, 2 Core/Brain, nicht verhinderbar, plus 1 Bad Publicity.

Die vorhandenen Hints sollten später nachgezogen werden, damit der Adapter nicht dauerhaft die einzige Quelle bleibt. Der präzise Hint-Nachtrag wäre:

```json
{
  "kind": "damage",
  "timing": "action",
  "scope": "runner",
  "resource": "core_damage",
  "amount": 2,
  "target": "self_inflicted_brain_damage",
  "preventable": false
}
```

Zusätzlich sollte `risk.self_brain_damage` oder `risk.brain_damage_self_inflicted` als handlungswirksames Signal für `Faked Hit` ableitbar sein. `corp.bad_publicity_pressure` bleibt positives Supportsignal, nicht automatisch eine Strategy-ID.

## Weitere Runner-Drawback-Karten

Strukturiert sichtbare Runner-Damage-Effekte im aktiven oder kompilierten Hint-Stand:

- `onr_v1_098_lucidrine-booster-drug`: aktiver/kompilierter Event-Hint mit `target: "self_brain_damage"`, aber ohne Betrag.
- `onr_proteus_126_test-spin`: aktiver/kompilierter Event-Hint mit `target: "meat_damage_shortfall"`, aber keine unmittelbare Self-Damage-Aktionskostenform.
- `onr_proteus_144_lucidrinetm-drip-feed`: aktiver/kompilierter Hardware-Hint mit `resource: "brain_damage"`, `amount: 1`, `target: "self_inflicted_brain_damage"`, Timing `start_of_turn`.

Für das aktuelle Critical-Folgepaket bleibt `Faked Hit` der einzige sichere Immediate-Action-Self-Damage-Treiber. Weitere Drawback-Familien sollten nicht still mitgemeint werden, solange Betrag, Timing, Empfänger und Preventable-Status nicht side-sicher strukturiert sind.

## Grenzen

Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Zufalls- oder Hidden-Info-Änderung. Dieser Review gibt nur die Evidence für die folgende Runner-Survival-Bewertung frei.
