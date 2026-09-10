# AI-Hints: Quelle und Runtime-Vertrag

Status: **aktueller generierter CardSpec-Vertrag**  
Stand: 2026-09-10

## Autorenquelle und Datenpfad

Die kartenspezifische Autorenwahrheit liegt in CardSpec. Maßgeblich ist die
[zentrale CardSpec-Architektur](../central-card-specification-and-registry-target-state-2026-08-09.md).
Hints projizieren daraus wiederverwendbare Funktionen und Planungsmetadaten;
sie sind weder zweite manuelle Kartenwahrheit noch Regel- oder Action-Autorität.

| Schritt                          | Aktuelle Quelle                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CardSpec zu Hint transformieren  | `deriveCardSpecAiHint` in [card-spec-ai-hint-compiler.ts](../../../packages/ai/src/card-spec-ai-hint-compiler.ts)                                                                                    |
| Artefakt bauen und serialisieren | [card-spec-ai-hint-artifact-builder.ts](../../../scripts/lib/card-spec-ai-hint-artifact-builder.ts)                                                                                                  |
| Generieren / auf Drift prüfen    | [generate-card-spec-ai-hints.mts](../../../scripts/generate-card-spec-ai-hints.mts)                                                                                                                  |
| Generiertes Bündel               | [card-spec-ai-hints-generated.json](../../../data/ai/card-spec-ai-hints-generated.json)                                                                                                              |
| Runtime-Datenpaket               | [@netgrid/runtime-data](../../../packages/runtime-data/package.json), Export `./card-spec-ai-hints`                                                                                                  |
| Validieren und konsumieren       | [catalog-ai-hint-authority.ts](../../../packages/ai/src/catalog-ai-hint-authority.ts), [generated-ai-hint-artifact-validation.ts](../../../packages/ai/src/generated-ai-hint-artifact-validation.ts) |
| AI-Fassade                       | [ai-hints.ts](../../../packages/ai/src/ai-hints.ts): `AI_HINTS_BY_CARD`, `createAiHintsByCard`                                                                                                       |

## Pflege und Grenzen

Mechanische oder annotierte Fakten werden an ihrer Autorenquelle geändert,
anschließend wird das Bündel erzeugt. Generierte Hintdatensätze werden nicht
von Hand korrigiert. Schema-/Compilerstand und Quellenfingerprints werden
beim Laden validiert; ein fehlerhaftes Artefakt verlangt einen Ursachenfix.

Aktuelle Befehle aus [package.json](../../../package.json):

- `corepack pnpm generate:card-spec-ai-hints`: Artefakt schreiben.
- `corepack pnpm check:card-spec-ai-hints`: Reproduzierbarkeit / Drift prüfen.
- `corepack pnpm check:ai-hint-metadata-contracts`: Metadatenvertrag prüfen.

Runtime-Quellen werden nach fachlichem Zweck organisiert, nicht nach
historischen Release-, Batch-, Draft- oder Approval-Schnitten. Alte Snapshots
begründen keine Aufbewahrungspflicht. Es gibt keine zusätzliche normative
Runtime-Quelle `ai-card-hints-active.json` und keine Pflicht zur Erhaltung des
entfernten Snapshots `ai-card-hints-1.3.1.json`.

Hint- und Doctrine-Daten unterstützen den zuständigen Planowner. Die aktuelle
Ability-, Kosten-, Ziel- und LegalAction-Bindung bleibt Aufgabe der Semantik
und der Engine; ein Hint allein zertifiziert keinen ausführbaren Step.
