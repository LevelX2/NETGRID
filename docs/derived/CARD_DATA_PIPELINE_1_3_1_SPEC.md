# Card Data Pipeline 1.3.1 Spec

Stand: 2026-05-08
Status: eingefroren

## Zweck

Diese Spezifikation definiert den V1.3.1-Vertrag für Source Registry, Card Pipeline Snapshot, Import-Diff, Rollback, Card-Support-Status und AI-Hints v2.

## Grundsatz

Die Pipeline ist Datenpflege, nicht Regelautorität.

```txt
Source -> Normalize -> Review -> Snapshot -> Diff -> Report
```

Nur explizit geprüfte Engine-Resolver, Mechanik-Coverage, Tests und Gate-Reviews dürfen Spielbarkeit oder KI-Support begründen.

## SourceRegistry-v2-Sollschema

```ts
type SourceRegistryV2 = {
  schemaVersion: "card-source-registry-v1.3.1"
  registryId: string
  createdAt: string
  sources: CardSourceEntry[]
}

type CardSourceEntry = {
  sourceId: string
  sourceType: "project_file" | "local_private_file" | "manual_review" | "external_snapshot"
  scope: "versioned_project" | "private_local" | "reference_only"
  pathOrReference: string
  provenance: string
  usageDecision: "allowed_project_data" | "private_display_only" | "reference_only" | "blocked"
  reviewStatus: "unreviewed" | "reviewed" | "blocked"
  notes?: string
}
```

Private lokale Pfade dürfen nicht in PublicEvents, WebSocket-Payloads, Logs, AIInput oder Match-Snapshots gelangen.

## CardPipelineSnapshot-Sollschema

```ts
type CardPipelineSnapshot = {
  schemaVersion: "card-pipeline-snapshot-v1.3.1"
  snapshotId: string
  pipelineVersion: "1.3.1"
  sourceRegistryId: string
  createdAt: string
  normalization: {
    sortOrder: string[]
    textPolicy: "display_only"
    rulesPolicy: "resolver_refs_only"
    assetPolicy: "private_display_separate"
  }
  cards: PipelineCard[]
  hash: string
}

type PipelineCard = {
  catalogCardId: string
  sourceCardId: string
  engineCardId?: string | null
  title: string
  side: "runner" | "corp"
  type: string
  subtypes: string[]
  faction: string
  text: string
  displayOnlyText: boolean
  numeric: Record<string, number | null>
  statuses: Record<string, boolean>
  requiredMechanics: string[]
  resolverRef?: string | null
  abilityRefs: string[]
  aiHintsRef?: string | null
  review: {
    cardData: "unreviewed" | "reviewed" | "blocked"
    mechanics: "unreviewed" | "reviewed" | "blocked"
    resolver: "unreviewed" | "reviewed" | "blocked"
    aiHints: "unreviewed" | "reviewed" | "blocked"
  }
}
```

Das konkrete TypeScript-Modell darf bestehende `CatalogCard`-Strukturen wiederverwenden, muss aber diese Informationen prüfbar abbilden.

## Statusregeln

- `imported` darf ohne Engine-Bezug wahr sein.
- `catalog_ready` bedeutet nur: Anzeige- und Suchdaten sind valide.
- `implemented` verlangt projektinterne Implementierungsreferenz.
- `engine_supported` verlangt Resolver-/Ability-Vertrag.
- `human_playable` verlangt Engine-Support, Mechanik-Coverage und Tests.
- `deck_legal` verlangt `human_playable`.
- `format_legal` verlangt `deck_legal`.
- `ai_supported` verlangt `human_playable`, AI-Hints, KI-Szenario und DecisionDebug-Safety.

## Import-Diff

Der Diff muss mindestens diese Kategorien kennen:

- `added_card`
- `removed_card`
- `text_changed`
- `numeric_changed`
- `status_changed`
- `required_mechanics_changed`
- `resolver_ref_changed`
- `ability_refs_changed`
- `ai_hints_changed`
- `asset_reference_changed`
- `review_status_changed`

Jeder Diff-Eintrag trägt Severity `info`, `review_required` oder `blocking`.

## Rollback

Rollback ist datenbezogen:

- Rückkehr zu einem bekannten Snapshot.
- Keine Änderung laufender Match-Snapshots.
- Keine Migration von Replay, StateHash oder EventLog.
- Kein Löschen privater lokaler Assets.
- Rollback-Report mit altem und neuem Snapshot-Hash.

## AI-Hints-v2-Vertrag

```ts
type AiCardHintsV2 = {
  schemaVersion: "ai-card-hints-v1.3.1"
  hintsId: string
  derivedFromSnapshotId: string
  cards: AiCardHint[]
}

type AiCardHint = {
  cardId: string
  side: "runner" | "corp"
  cardType: string
  roles: string[]
  planRoles: string[]
  requiredMechanics: string[]
  valueHints: Record<string, number>
  riskTags: string[]
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported"
  scenarioRefs: string[]
}
```

`aiSupportStatus: "ai_supported"` darf nur gesetzt werden, wenn Card-Support-Status, Szenarien und KI-Tests das erlauben. Hints allein reichen nicht.

## Visibility- und Safety-Vertrag

Pipeline-Artefakte dürfen nicht enthalten:

- Session-, Join-, Reconnect- oder Storage-Tokens.
- Full GameState oder CardInstance-Dumps.
- gegnerische private Decklisten.
- private lokale Dateipfade in spielnahen Payloads.
- Hidden Cards aus laufenden Matches.

## No-Scope-Prüfung

Ein V1.3.1-Implementation Review muss bestätigen:

- kein Kartentextparser,
- keine neuen Kartenfreigaben,
- keine neue Mechanik,
- keine KI-Planbewertung,
- keine externe Runtime-Datenbank,
- keine offiziellen Assets,
- keine Public-Plattformfunktionen.
