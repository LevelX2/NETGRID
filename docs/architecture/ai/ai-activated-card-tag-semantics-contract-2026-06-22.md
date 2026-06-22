# AI Activated Card Tag Semantics Contract 2026-06-22

## Zweck

Vertrag für `AI-TAG-SEM-2`: legale Runner-Kartenaktionen mit sicherer Tag-Entfernungswirkung werden in `ActionSemanticCandidate` generisch als Tag-Cleanup projiziert und von der Semantic Runtime wie der bestehende `remove_tag`-Pfad behandelt.

## Autorität

- `LegalActions` bleiben die einzige Aktionsquelle.
- `ActionSemanticCandidate` erzeugt keine Aktion, keine Legalität, kein Target und keinen Engine-Effekt.
- `applyAction` bleibt finaler Guard für Seite, actionId, stateVersion, Timing, Kosten, Ziele und Choices.
- CardImplementation- und LegalAction-Payload-Metadaten werden nur read-only für Semantik und Scoring ausgewertet.

## Zulässige Quellen

Zulässig:

- `LegalAction.type`, `source`, `side`, `costs`, `timingPoint`, `visibility`, `payload`-Schlüssel und `abilityRef`.
- Side-safe Source-Binding: `sourceDefinitionId`, `sourceCardDefinitionId`, `sourceCardId`, `sourceCardInstanceId`, `cardImplementationAbilityId`, `cardImplementationAbilityKey`, `cardImplementationEffectKind`, `cardImplementationPrimitiveKind`.
- Öffentliche CardImplementation-Definitionen, sofern sie über eine side-safe `sourceDefinitionId` erreichbar sind.
- AI-Hints als ergänzende Evidence, nicht als alleinige Autorität.
- Sichtbare Runner-Tag-Anzahl aus `input.playerView.own.tags`.

Nicht zulässig:

- Hidden-Zone-Inhalte, Gegnerhand, vollständiger GameState, private Gegnerpayloads oder Reconnect-/Replay-Rohdaten.
- CardId-Sonderfall als Endzustand für `Danshi's Second ID`.
- Aus Hints oder CardImplementation abgeleitete neue LegalActions.

## Candidate-Vertrag

`ActionSemanticCandidate` darf um eine side-safe Struktur erweitert werden:

```ts
type ActionTagEffectProfile = {
  kind: "remove_tags" | "avoid_tag" | "avoid_next_tag" | "tag_clear_support";
  recipient: "runner";
  mode?: "amount" | "up_to_amount" | "all" | "support_only";
  amount?: number | "all" | "unknown";
  currentTagReduction?: number | "all" | "unknown";
  acuteTagRemoval: boolean;
  source: "legal_action_type" | "legal_action_payload" | "card_implementation" | "ai_hint";
  evidence: string[];
};
```

Regeln:

- BasicAction `remove_tag` erhält `kind: "remove_tags"`, `mode: "amount"`, `amount: 1`, `acuteTagRemoval: true`.
- Runner-CardActions mit sicher gebundenem CardImplementation-Effect `kind: "remove_tags"` und `recipient: "runner"` erhalten `semanticActionType: "tag.remove"` und `acuteTagRemoval: true`.
- `currentTagReduction` ist konservativ:
  - `mode: "amount"`: `min(amount, currentTags)`, wenn `currentTags` im Runtime-Kontext vorliegt; im reinen Candidate ohne BoardContext bleibt `amount`.
  - `mode: "up_to_amount"`: `min(amount, currentTags)`, sonst `amount`.
  - `mode: "all"`: `"all"`.
- Tag-Vermeidung (`avoid_tag`, `avoid_next_tag`) erhält `acuteTagRemoval: false` und darf nicht allein in `tag_removal` geroutet werden.
- Hosted-Credit-Quellen mit `usableFor: ["remove_tags"]` erhalten höchstens `kind: "tag_clear_support"`, `acuteTagRemoval: false`.
- Mehrfachwirkungen werden nicht überschätzt: nur der sichere Tag-Cleanup-Anteil beeinflusst Tag-Scoring.

## Projektion

- Die Projektion läuft nach SourceBinding und CostTiming.
- Wenn die LegalAction-Payload bereits einen sicheren Effect-Kind-Hinweis enthält, darf dieser genutzt werden.
- Wenn die Payload nur `sourceDefinitionId` und optional Ability-Key/Ability-Id enthält, darf ein AI-interner Adapter öffentliche CardImplementation-Definitionen nach `remove_tags` durchsuchen.
- Bei mehreren Abilities ohne sichere Ability-Bindung darf nur dann projiziert werden, wenn genau eine legale oder eindeutig passende `remove_tags`-Ability für den Source-Kontext gefunden wird; sonst bleibt die Aktion `card_ability.unknown`/`play.runner_event` mit `ability_unresolved`.
- Das Entfernen von `ability_unresolved` ist nur erlaubt, wenn der Tag-Cleanup-Effect sicher gebunden ist.

## Runtime-Vertrag

- `semanticRuntimeScopeForAction` routet Candidates mit `tagEffectProfile.acuteTagRemoval === true` oder `semanticActionType === "tag.remove"` in `tag_removal`.
- `semanticRuntimeRunnerScoreComponents` bewertet solche Candidates wie Tag-Entfernung, proportional zu sichtbaren Tags und erwarteter Reduktion.
- Der bestehende `remove_tag`-Pfad bleibt unverändert.
- Ohne aktuelle Tags wird keine blinde Priorisierung gegenüber klar besseren Economy-/Setup-Aktionen erzeugt.
- Kosten bleiben Teil der normalen ScoreBreakdown-/TypePriority-Abwägung; zusätzliche Costs wie Click, Credit, Tap, Trash Source und Self-trash dürfen als Evidence/Komponente einfließen.

## Acceptance

- `Danshi's Second ID` mit sichtbaren Tags wird nicht mehr als `card_ability.unknown` behandelt.
- `Nomad Allies` folgt demselben generischen CardImplementation-Effect-Pfad.
- `Open-Ended Mileage Program` und `Total Genetic Retrofit` können über `play_event`/`remove_tags` klassifiziert werden, ohne Sonderfall.
- `Fall Guy`, `Nasuko Cycle`, `Leland`, `Wilson` und vergleichbare Avoid-Tag-Quellen bleiben support-only.
- Keine Änderung an Engine, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Verträgen.

## Checks

- `git diff --check`
