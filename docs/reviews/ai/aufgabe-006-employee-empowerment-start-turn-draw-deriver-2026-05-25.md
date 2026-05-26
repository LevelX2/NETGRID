# Aufgabe 006: Employee-Empowerment Start-of-Turn-Draw Deriver

Aufgabe-ID: Aufgabe 006

## Kurzfazit

Der Employee-Empowerment-Follow-up ist im read-only Generated-Facts-Pfad geschlossen. Der Deriver erzeugt jetzt neben dem aktivierten Draw-two-Fact auch den mechanischen Start-of-turn-Draw aus dem engen, exakten Implementation-Kartentext-Kommentar.

Es wurden keine aktiven Hintdaten, keine Engine-Regeln, keine LegalAction-Logik und keine Runtime-/Planner-/Consumer-Pfade geändert.

## Kartentext

`You may choose to draw an additional card at the start of each of your turns. A: Draw two cards.`

Die Karte enthält zwei mechanisch getrennte Draw-Komponenten:

- optionaler zusätzlicher Draw am Start jedes Corp-Zugs
- aktivierte scored-agenda Action: `A: Draw two cards`

## Implementation-Befund

`packages/engine/src/card-implementations/onr-v1/corp/agendas/employee-empowerment.ts` enthält die aktivierte Fähigkeit strukturiert:

- `kind: "activated"`
- `timing: "corp_main"`
- Kosten: 1 Action
- Effekt: `draw_cards`, `recipient: "corp"`, `amount: 2`

Der Start-of-turn-Draw ist nicht als eigener strukturierter Descriptor modelliert. Er ist aber im Implementation-Kartentext-Kommentar exakt vorhanden. Deshalb wurde keine Engine- oder Descriptor-Änderung vorgenommen; die Ableitung bleibt eng auf `onr_v1_199_employee-empowerment` und den exakten Text begrenzt.

## Aktiver Monolith

Der aktive Hint-Monolith enthält bereits:

- `effect:draw`, `timing=start_of_turn`, `scope=corp`, `resource=cards`, `amount=1`
- `effect:draw`, `timing=scored_activated`, `scope=corp`, `resource=cards`, `amount=2`
- `effect:scored_agenda_action`, `timing=scored_activated`, `scope=score_area`
- `condition:requires_scored_agenda`

`data/ai/ai-card-hints-active.json` wurde nicht geändert.

## Derived-Facts-Befund

Vor Aufgabe 006 erkannte der Generated-Facts-Pfad nur den aktivierten Draw-two-Pfad und die scored-agenda Condition. Der Start-of-turn-Draw erschien in Aufgabe 004/005 als `generated_deriver_gap`.

Nach Aufgabe 006 erzeugt `check:ai-derived-facts` zusätzlich:

```json
{
  "kind": "draw",
  "timing": "start_of_turn",
  "scope": "corp",
  "resource": "cards",
  "amount": 1,
  "source": "implementation.card_text.start_of_turn.draw"
}
```

Die Optionalität aus “may choose” wird in `derivationNotes` dokumentiert. Es wurde kein neues Ontology-Feld eingeführt.

## Entscheidung

Entscheidung: `derived_fact_closed`.

Begründung: Eine strukturierte Descriptor-Ableitung existiert nicht, aber die Text-/Implementation-Erkennung ist eng genug: Sie ist auf die konkrete `cardId` und den exakten Kartentext-Kommentar beschränkt. Damit wird keine breite fragile Regex-Heuristik über beliebige Karten eingeführt.

Der aktivierte Draw bleibt separat:

```json
{
  "kind": "draw",
  "timing": "scored_activated",
  "scope": "corp",
  "resource": "cards",
  "amount": 2,
  "source": "implementation.effect.draw_cards"
}
```

`requires_scored_agenda` bleibt für die scored-activated Action erhalten.

## Report-Auswirkungen

- `ai-derived-basic-facts-gate`: Employee Empowerment enthält jetzt drei Effects/Condition-Gruppen inklusive Start-of-turn-Draw; Hard Errors bleiben 0.
- Aufgabe 003 Dry-Run: bestätigte Generated Facts steigen von 39 auf 40; `monolith_only_mechanical_fact` fällt von 1 auf 0; WarningCount steigt durch zusätzliche Vergleichssignale von 110 auf 111.
- Aufgabe 004 Diff-Review: `monolithOnlyMechanicalFactCount` fällt von 1 auf 0; Employee Empowerment ist kein Deriver-Follow-up mehr.
- Aufgabe 005 Normalization-Dry-Run: `deriverFollowupCandidates` fällt von 1 auf 0; die sieben normalisierten Shape-Differences bleiben unverändert normalisiert.
- Compiled-Index und Priority-Report bleiben read-only Vergleichsartefakte ohne Runtime-Wirkung.

## Bewusst Nicht Geändert

- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Änderung an `aiSupportStatus`
- keine Engine-, LegalAction-, Planner-, Consumer- oder Runtime-Änderung
- keine aktive Hintmigration
- keine Ontology-/Known-List-Erweiterung
- keine Holdout- oder Performanceinterpretation

## Nächster Schritt

Der nächste praktische Schritt ist Aufgabe 007 als Batch-1-Dry-Run-Rollup: prüfen, ob Batch 1 nach Employee Empowerment vollständig conflict-/gap-frei ist und welcher nächste read-only Pilotbatch fachlich sinnvoll ist.
