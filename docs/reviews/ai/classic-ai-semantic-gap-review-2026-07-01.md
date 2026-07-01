# Classic AI Semantic Gap Review

Stand: 2026-07-01

## Kurzbefund

Classic ist formal als KI-spielbar freigegeben, aber semantisch nur schwach angebunden. Die 52 Classic-Karten sind in Supportmanifest, Active Hints und Compiled Hints vorhanden und `ai_supported`; sie tragen jedoch keine Taktiksignale, keine `lineSupport`-Strategieanker und keine geprüfte Hint-Qualität. Für Deckstrategie und Action-Semantik wirken die Classic-AI-Decks dadurch weitgehend ankerlos.

## Geprüfte Quellen

- `data/cards/classic-cards.json`
- `data/manifests/classic-card-support.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `data/ai/tactic-signals-v1.json`
- `data/ai/strategy-goals-v1.json`
- `data/decks/deck-snapshots-0.8.json`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/actions/action-card-semantic-profiles.ts`
- `docs/releases/classic/classic-full-card-implementation-process-2026-06-30.md`
- `docs/releases/classic/final-review.md`

## Messbefund

| Bereich | Ergebnis |
| --- | --- |
| Classic-Karten im Set | 52 |
| `classic-card-support.json` AI-supported | 52/52 |
| Active-Hints vorhanden | 52/52 |
| Compiled-Hints vorhanden | 52/52 |
| Active-Hints mit `tacticSignals` | 0/52 |
| Compiled-Hints mit `tacticSignals` | 0/52 |
| Hints mit `lineSupport` | 0/52 |
| Hints mit Strategieanker | 0/52 |
| `quality.hintReviewed` | 0/52 |
| `quality.strategyCovered` | 0/52 |
| `quality.needsHumanReview` | 52/52 |
| Confidence | 52/52 `low` |
| Classic-Zeilen im committed Inspector-Index | 0/52 |
| Classic-Zeilen im neu generierten Inspector-Index | 52/52, aber weiter ohne Funktionssignale oder Anker |

Der formale Abschluss vom 2026-06-30 ist damit nicht falsch, aber enger zu lesen: Classic erfüllt das alte AI-Support-Gate aus Hints, SzenarioRefs, AI-Snapshots und Smokes. Es erfüllt nicht den späteren semantischen Anspruch aus Taktiksignalen, Strategieankern, Inspector-Abdeckung, DeckStrategyProfile und TacticalPlan-Anbindung.

## Auswirkungen

- `check:ai-compiled-hints` ist grün, obwohl alle Classic-Hints semantisch leer bleiben: `AI_COMPILED_HINTS OK cards=616 generated=391 overlays=6 fallback=136 errors=0 warnings=2077`.
- `check:ai-hint-inspector-index` ist rot, weil der committed Inspector-Index veraltet ist. Ein Neubau würde 616 statt 564 Karten enthalten und die 52 Classic-Karten aufnehmen.
- Die neu generierten Classic-Inspector-Zeilen bleiben `legacyFallbackOnly`, haben 0 `derivedFunctionSignals`, 0 `derivedStrategyAnchors`, 0 `cardLevelStrategyAnchors` und Warnungen wie `deferred_requires_human_review`.
- `check:ai-action-semantic-signal-catalog` ist ebenfalls rot, weil der Action-Semantic-Signal-Report stale ist.
- Der Classic-Runner-AI-Snapshot erzeugt im DeckStrategyProfile keine Primary/Secondary Strategies, 0 Function-Signal-Counts und `doctrineStatus: anchorless`.
- Der Classic-Korp-AI-Snapshot erzeugt ebenfalls keine Primary/Secondary Strategies, 0 Function-Signal-Counts und `doctrineStatus: anchorless`.
- Beide Classic-AI-Snapshots haben zwar Legacy-Rollen, aber keine produktiven Anker: Runner 64 Legacy-Signalkategorien, Korp 77 Legacy-Signalkategorien.

## Ursache

Die Classic-Freigabe hat die Karten schnell durch das alte Mindestgate gebracht: Rollen, Planrollen, RequiredMechanics, ValueHints, RiskTags, SzenarioRefs und AI-Snapshots. Die neuere Semantic-AI-Schicht verwendet aber primär strukturierte `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `targetProfiles`, `tacticSignals`, `lineSupport` und den Inspector-Index. Diese Felder fehlen Classic fast vollständig.

Ältere Semantik-Skripte wie AI021 bis AI026 hatten Classic noch als bekannte inaktive Zusatzkarten inventarisiert. Nach der späteren Classic-Vollfreigabe wurde diese semantische Review-Linie nicht nachgezogen.

## Empfohlene Strategie

### Phase 1: Gate-Begriff klären

Das Classic-`ai_supported`-Flag sollte fachlich als "LegalActions-only AI-smoke-spielbar" dokumentiert werden, bis die semantische Schicht nachgezogen ist. Für künftige Kartenfreigaben braucht es zusätzlich ein separates Semantic-AI-Gate:

- Active und Compiled Hints vorhanden.
- `quality.hintReviewed: true`.
- `quality.needsHumanReview: false`.
- Mindestens geprüfte `effects` oder bewusst begründeter `support-only`-Status.
- Taktiksignale im Inspector sichtbar.
- Strategieanker nur bei echten Decklinien, nicht bei generischer Economy oder Vanilla-ETR.

### Phase 2: Classic in Semantik-Batches schneiden

Die Ergänzung sollte nicht als ein 52-Karten-Massenedit erfolgen. Geeignete Batches:

1. Corp Agendas: Data Fort Remapping, Superserum, Unlisted Research Lab, Theorem Proof.
2. Corp ICE: Baskerville bis Vortex.
3. Corp Operations: Badtimes, Corporate Shuffle, Reclamation Project.
4. Corp Assets/Upgrades: Indiscriminate Response Team bis Street Enforcer.
5. Runner Breaker/Programme: Early Worm bis Superglue.
6. Runner Events: Boostergang Connections bis Running Interference.
7. Runner Resources/Hardware: Crash Space bis Zetatech Portastation.

Jeder Batch sollte vorhandene AI021- bis AI030-Muster wiederverwenden und keine neuen Strategy IDs einführen, solange die V1-Taxonomie reicht.

### Phase 3: Strukturierte Hint-Felder ergänzen

Pro Karte sollten zuerst die mechanischen Fakten ergänzt werden:

- `effects`: konkrete Funktion wie Economy, Draw, Breaker, Trace, Tag, Damage, Access Punish, Remote Protection, Search oder Recurring Economy.
- `conditions`: Timing- und Zustandsvoraussetzungen wie tagged Runner, successful run, access, trace window, scored agenda oder installed program.
- `costProfile`: Klick-, Credit-, Counter-, Agenda-Point- und Reserve-Risiken.
- `breakerProfile`: Coverage, Pump, Break-Kosten, Nebenwirkungen und Einschränkungen.
- `remoteRole`: nur bei Assets/Upgrades/ICE mit Remote- oder Fort-Rolle.
- `targetProfiles`: nur bei echten Auswahlproblemen; Hidden-Info-Policy immer explizit.

`tacticSignals` sollten bevorzugt aus diesen Feldern und dem Inspector entstehen. Direkte `tacticSignals` in den Hints sind nur für geprüfte Sonderfälle sinnvoll.

### Phase 4: Strategieanker sparsam setzen

`lineSupport` sollte nur gesetzt werden, wenn eine Karte eine echte Decklinie ankert oder materiell stützt:

- Runner: `runner.search.breaker`, `runner.rnd_pressure`, `runner.hq_pressure`, `runner.remote_contest`, `runner.survival_defense`, `runner.run_event_tempo`.
- Korp: `corp.remote_scoring`, `corp.ice_tax_glacier`, `corp.central_stabilize`, `corp.asset_economy`, `corp.tag_trace_punish`, `corp.damage_kill`, `corp.ambush_bluff`, `corp.economy_rez_reserve`.

Support-only bleiben reine Economy, reine Draws, einfache ETR-ICE ohne Zusatzdruck, generische Tag-Entfernung und reine Setup-Hilfen ohne Payoff.

### Phase 5: Reports und Gates aktualisieren

Nach jedem Batch:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-action-semantic-signal-catalog`
- `corepack pnpm --filter @netgrid/ai typecheck`
- gezielte `@netgrid/ai`-Tests für DeckStrategyProfile, ActionCardSemanticProfiles und Classic AI Snapshots

Die bestehenden `check:ai-*`-Gates sollten zusätzlich eine Regel bekommen: `ai_supported` Karten dürfen nicht dauerhaft `quality.needsHumanReview: true` und zugleich 0 semantische Signale haben, außer sie sind explizit als `support-only` begründet.

### Phase 6: KI-Spielstärke prüfen

Nach Semantikdaten allein ist Classic noch nicht automatisch stark spielbar. Es braucht anschließende AI-Smokes und Szenariofälle:

- Runner installiert passende Classic-Breaker statt blind zu laufen.
- Runner erkennt Classic-HQ/R&D-Pressure-Tools und nutzt sie nur bei erreichbarem Pfad.
- Korp hält Rez-Reserve für Classic-ICE und wertet Deflector-/Ambush-/Tag-Punish-Fenster nicht als generische Economy.
- Classic-Decks verlieren `anchorless` im DeckDoctrineV2-Diagnostic.
- Keine Hidden-Info aus Executive File Clerk, Sandbox Dig, Theorem Proof, Corporate Shuffle, Reclamation Project oder Access-Ambushes landet im AIInput.

## Handoff

Primärer Folgeagent für Umsetzung: `release-implementation-agent`.

Umsetzung sollte als eigener, enger Prozess laufen: erst Review-/Gate-Regeln und ein Pilot-Batch, dann die restlichen Kartengruppen. Der erste sinnvolle Pilot ist "Classic Runner Programme", weil Breaker-Coverage, Nebenwirkungen und Run-Taktik unmittelbar auf sichtbare AI-Fehlentscheidungen wirken und gut testbar sind.
