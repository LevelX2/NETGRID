# V1.3.1 Card Data Pipeline v2 - Detailed Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.3.1 macht die Kartenpflege skalierbarer und reviewbar, ohne Kartentextparser, automatische Spielbarkeit oder externe Laufzeitabhängigkeiten einzuführen. Der Release verbindet Source Registry, normalisierte Kartensnapshots, Import-Diffs, Rollback, Card-Support-Status, AI-Hints und Statusreports zu einer reproduzierbaren Datenpipeline.

V1.3.1 ist kein Kartenfreigabe-, Mechanik-, KI-Strategie- oder Public-Asset-Release. Eine Karte wird durch Import, Text, Bild, Hint oder Katalogstatus nicht spielbar.

## Quellenbasis

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/final-review.md`
- `docs/releases/v1/v1-3-0-format-deckbuilding-foundation/spec.md`
- `docs/derived/CARD_RULE_TEXT_FORMATTING_SPEC.md`
- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/MVP_0.91_REQUIREMENTS.md`
- `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md`
- bestehende Catalog-, Deck-, Manifest-, AI-Rollen- und Runtime-Gate-Daten

## Scope

- Source Registry v2 mit Provenienz, Nutzungsentscheidung, Review-Status und lokaler/privater Quellklassifikation.
- Normalisierte Card Pipeline Snapshots mit deterministischer Sortierung, Hashing und Version.
- Import-Diff zwischen altem und neuem Snapshot inklusive Text-, Status-, Mechanik-, Resolver- und AI-Hint-Änderungen.
- Rollback-Vertrag für fehlerhafte Datenstände.
- Trennung von Importstatus, Katalogstatus, Engine-Support, menschlicher Spielbarkeit, Decklegalität, Formatlegalität und KI-Support.
- Reviewpflichtige Felder `requiredMechanics`, `resolverRef`, `abilityRefs`, `aiHints` und `statusTransitions`.
- Statusreport für blockierte Karten, fehlende Mechaniken, fehlende Resolver, fehlende Tests und fehlende AI-Hints.
- AI-Hints-v2-Grundlage für V1.4.0 und V1.4.1.
- Tests für deterministische Pipeline, Statusübergänge, Diff, Rollback, Hidden-Info-/Asset-Grenzen und No-Scope.

## Nicht-Ziele

- Kein Kartentextparser.
- Keine automatische Spielbarkeit aus Kartentext, Bildern, Importstatus oder Hints.
- Keine neuen `human_playable`, `deck_legal`, `format_legal` oder `ai_supported` Freigaben.
- Keine Engine-Resolver-Implementierung.
- Keine neue Mechanik-Coverage.
- Keine KI-Planbewertung; V1.4.x nutzt die Daten später.
- Keine Laufzeitabhängigkeit auf externe Kartendatenbanken.
- Keine öffentlichen Assets, Card Frames, Logos oder Card Backs.
- Keine Public-Decklisten, Accounts, Matchmaking, Rankings oder Turnierfunktionen.

## Leitentscheidung

V1.3.1 ist eine Datenintegritäts- und Reviewschicht. Sie darf Inkonsistenzen sichtbar machen und blockieren, aber keine Spielbarkeit erzeugen.

Kernregeln:

```txt
imported != implemented
implemented != engine_supported
engine_supported != human_playable
human_playable != ai_supported
aiHints != ai_supported
```

## Umsetzungspakete

1. **Source Registry v2**
   - Quell-ID, Quelltyp, Scope, Lizenz-/Nutzungsnotiz, Review-Status und Snapshot-Input definieren.
   - Private lokale Quellen von versionierten Projektquellen trennen.
   - Externe Quellen dürfen nur Importmaterial sein, keine Runtime-Abhängigkeit.

2. **Pipeline Snapshot**
   - Normalisierte Kartendaten deterministisch erzeugen.
   - Snapshot-ID, Pipeline-Version, Source-Registry-Version, CreatedAt, Hash und Normalisierungsregeln speichern.
   - Display-only Kartentext von Engine-Vertrag trennen.

3. **Status- und Supportmodell**
   - Statusübergänge als reviewpflichtig modellieren.
   - `requiredMechanics`, `resolverRef`, `abilityRefs`, `unitTests`, `scenarioTests`, `visibilityTests`, `replayTests` und `aiHintsRef` prüfen.
   - Fehlende Pflichtfelder blockieren nur betroffene Karten oder Hints.

4. **Import-Diff und Rollback**
   - Diff-Kategorien für Text, Numeric Fields, Status, Mechaniken, Resolver, Hints und Assets erzeugen.
   - Rollback kehrt zu einem bekannten Snapshot zurück, ohne Match-Snapshots oder laufende Matches umzuschreiben.
   - Diffs dürfen keine lokalen Pfade, Tokens, Decklisten oder Hidden-Info-Daten enthalten.

5. **AI-Hints v2**
   - AI-Hints als eigene validierte Datenstruktur führen.
   - Rollen, Planrollen, Wertebereiche, Side, Typ, requiredMechanics, Deckrollenprofil-Beiträge und RiskTags normalisieren.
   - Hints können KI-Freigabe vorbereiten, aber nicht selbst `ai_supported` setzen.

6. **Reports und UI/API**
   - Statusreport für blockierte Karten und KI-Blocker erzeugen.
   - Katalog/API darf Pipeline-Version, Status und Blockgründe anzeigen.
   - Anzeige bleibt side-sicher und ohne private lokale Pfade.

## Erwartete Umsetzungsartefakte

Die konkrete Umsetzung soll mindestens diese Artefaktklassen erzeugen oder aktualisieren:

- `data/card-import/source-registry-1.3.1.json`
- `data/card-import/card-pipeline-snapshot-1.3.1.json`
- `data/card-import/card-pipeline-snapshot-1.3.1.hash`
- `data/manifests/card-support-manifest-1.3.1.json`
- `data/ai/ai-card-hints-1.3.1.json`
- `data/ai/ai-card-hints-report-1.3.1.json`
- `data/reports/card-pipeline-report-1.3.1.json` oder gleichwertig

Die Dateinamen dürfen an bestehende Paketstrukturen angepasst werden, müssen aber Version, Zweck und Gate klar tragen.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Pipeline wird als automatische Kartenfreigabe missverstanden. | Sehr hoch | Statusketten-Tests und No-Scope-Doku. |
| Kartentextänderungen verändern still Engine-Verhalten. | Sehr hoch | Display-only Text, ResolverRef reviewpflichtig. |
| AI-Hints werden als `ai_supported` interpretiert. | Hoch | Hints bereiten nur vor; KI-Gate separat. |
| Externe Datenbank wird Runtime-Abhängigkeit. | Hoch | Snapshot-only, keine Live-Abfragen im Spiel. |
| Lokale Assetpfade oder private Quellen leaken. | Hoch | Redaction- und Payload-Tests. |

## Offene Fragen

Keine blockierenden offenen Fragen.

Nicht blockierend:

- Die konkrete technische Aufteilung zwischen `packages/catalog`, `data/card-import` und `data/manifests` darf im Umsetzungsthread an bestehende Module angepasst werden.
- Die erste AI-Hints-v2-Version darf vorhandene V0.9-Rollen migrieren und V1.2.3-human-only Karten bewusst als nicht AI-supported reporten.

## Gate

`V1_3_1_requirements_freeze_done: true`

`ready_for_implementation_after_V1_3_0: true`
