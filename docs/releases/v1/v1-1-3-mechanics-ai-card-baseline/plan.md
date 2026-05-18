# V1.1.3 Mechanics-AI-Card Baseline Plan

Stand: 2026-05-08
Status: geplant und requirements-gefroren

## Ziel

V1.1.3 ist ein reines Planungs- und Normalisierungsrelease nach V1.1.2K. Es schreibt den aktuellen Mechanik-, Karten- und KI-Stand so fest, dass V1.2.0 und V1.2.1 danach ohne neue Voranalyse umgesetzt werden können.

V1.1.3 implementiert keinen Engine-, Server-, Web-, KI- oder Test-Code und gibt keine neue Karte, kein KI-Deck und keine neue Mechanik frei.

## Quellenbasis

- `docs/codex/CODEX_STATUS.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/post-v1-1-2-roadmap.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/final-review.md`
- `docs/releases/v1/card-releases/v1-1-2k-card-release/implementation-review.md`
- `docs/architecture/card-rules/mechanics-coverage-matrix.md`
- `docs/KI-Player/NETGRID_KI_Releaseplanung_Codex_Briefing.md`
- `data/manifests/card-implementation-manifest-1.0.5k.json`
- `data/manifests/card-implementation-manifest-1.0.6k.json`
- `data/manifests/card-implementation-manifest-1.1.2k.json`
- `data/ai/card-role-manifest-0.9.json`

## Scope

- Mechanik-Coverage nach V1.1.2K normalisieren.
- V1.1.0 bis V1.1.2K als fertige, enge Gates einordnen.
- Das neue Kartenstatusmodell `listed`, `engine_supported`, `human_playable`, `ai_supported` verbindlich definieren.
- Die 52 vorhandenen O:NR-v1-Runtime-Karten auf dieses Modell mappen.
- AI-Level 0 bis 6 gegen den aktuellen Stand auditieren.
- AI-Hints- und `AiDecisionDebug`-Sollvertrag für kommende Releases festlegen.
- Die Reihenfolge V1.2.0 vor V1.2.1 und vor weiteren K-Kartenreleases begründen.

## Nicht-Ziele

- Keine Codeänderung.
- Keine neue Engine-Mechanik.
- Keine neue Runtime-, Decklegal- oder KI-Deck-Freigabe.
- Keine öffentlichen Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turnierfunktionen.
- Keine offiziellen Assets, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine automatische Interpretation von Kartentext.
- Keine Umbenennungsarbeit von NETGRID zu NETGRID außerhalb der vorhandenen Pfade und Begriffe.

## Leitentscheidung

V1.2.x kommt vor weiteren K-Kartenreleases.

Begründung: Die nächsten relevanten Kartenblöcke werden nicht mehr hauptsächlich durch einfache Werte, Economy, Draw, Breaker oder End-the-Run-ICE blockiert, sondern durch Hochrisiko-Familien wie Prevention, Avoid, Interrupts, Replacement, Spezialzonen und Control. Weitere K-Releases ohne diese Mechaniken würden entweder sehr klein, künstlich oder riskant. Deshalb wird erst die Mechanikgrundlage V1.2.0 und V1.2.1 gelegt; danach kann ein neuer Kartenbatch sauber zwischen `human_playable` und `ai_supported` getrennt werden.

## Mechanik-Coverage nach V1.1.2K

| Mechanic ID | Status nach V1.1.2K | Einordnung für V1.2.x |
| --- | --- | --- |
| `mechanic.core.determinism` | `implemented` | Dauer-Gate für Replay, StateHash, Seed, RandomCounter und RandomDrawRecords. |
| `mechanic.actions.legal_action_pipeline` | `implemented` | Dauer-Gate; alle neuen Fenster müssen LegalActions/PlayerActions/applyAction nutzen. |
| `mechanic.visibility.hidden_info_contract` | `implemented` | Dauer-Gate für PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs und KI-Inputs. |
| `mechanic.setup.game_end` | `implemented_limited` | V1.1.0 setzt Setup, 7-Punkte-Ziel, Agenda-Sieg, Korp-Deckout und Flatline-Vertrag eng um. |
| `mechanic.setup.mulligan` | `implemented_limited` | V1.1.0 setzt private Mulligan-Choices über LegalActions um. |
| `mechanic.turns.discard_handlimit` | `implemented_limited` | V1.1.1 setzt Korp-/Runner-Discard, dynamische Handlimits und private Discard-Choices um. |
| `mechanic.damage.flatline` | `implemented_limited` | Net-/Meat-/Core-Damage und Flatline sind eng umgesetzt; Prevention bleibt offen. |
| `mechanic.runs.full_archives_access` | `implemented_limited` | V1.1.2 setzt vollständigen Runner-Access auf gemischte Korp-Archives um. |
| `mechanic.runs.jackout_multiaccess_breach` | `implemented_limited` | Grund-Breach, Jack-out und enge Multiaccess-Fälle bleiben nutzbar. |
| `mechanic.resources` | `implemented_limited` | Runner-Resources und getaggtes Resource-Trash sind eng umgesetzt. |
| `mechanic.trace.link_bidding` | `implemented_limited` | Trace/Bid/Link mit engem Tag-Erfolg ist umgesetzt. |
| `mechanic.identities.abilities` | `implemented_limited` | Setup-/Static-Identity-Piloten sind umgesetzt; generische paid/triggered Fenster offen. |
| `mechanic.hidden_zone_tools` | `implemented_limited` | Search, Reveal, Expose, Arrange, Shuffle und Swap nur in engen Harnesses. |
| `mechanic.hosting.viruses.counters` | `implemented_limited` | Hosting, Viren, Purge, Counter, Recurring Credits und Bad Publicity nur in engen Gates. |
| `mechanic.event_modification.prevent_avoid_interrupt` | `open` | Priorität V1.2.0. |
| `mechanic.event_modification.replacement` | `open` | Priorität V1.2.1, getrennt von Prevention/Avoid. |
| `mechanic.special_zones.ownership_control` | `open` | Nach V1.2.1; nicht Teil der nächsten drei Releases. |
| `mechanic.deckbuilding.formats` | `implemented_limited` | Lokale Deckvalidierung existiert; offizielle Formatregeln bleiben später. |

## Kartenstatusmodell

| Status | Bedeutung | Mindestkriterien |
| --- | --- | --- |
| `listed` | Karte ist bekannt und darf in Katalog-/Planungsdaten auftauchen. | Quelle/Provenienz vorhanden; erzeugt keine Spielbarkeit. |
| `engine_supported` | Exakte freigegebene Kartenfunktion hat Resolver oder Engine-Vertrag. | Resolver/Ability, Mechanikabdeckung, Unit- oder Integrationstest, Replay/StateHash-Erwartung. |
| `human_playable` | Karte darf in menschlichen privaten Matches verwendet werden. | `engine_supported`, Deckvalidierung, Visibility, Multiplayer, Reconnect, Undo und Szenario-Smoke grün. |
| `ai_supported` | Karte darf in KI-Decks oder strategischer KI-Bewertung verwendet werden. | `human_playable`, AI-Hints, AI-Szenario, sichere `AiDecisionDebug`-Ausgabe und KI-Smoke/Soak. |

Regeln:

- `deck_legal` setzt künftig `human_playable` voraus.
- `ai_supported` setzt `human_playable` voraus.
- Vorhandene `roleTags` oder KI-Smokes reichen allein nicht für `ai_supported`.
- Eine Karte kann `human_playable` sein, ohne in KI-Decks erlaubt zu sein.
- Nicht freigegebene lokale O:NR-v1-Karten bleiben höchstens `listed`.

## Mapping der 52 Runtime-Karten

Die 52 vorhandenen O:NR-v1-Runtime-Karten bleiben im privaten Runtime-Pool `listed`, `engine_supported`, `human_playable` und `deck_legal`. Keine davon wird in V1.1.3 automatisch `ai_supported`; die bestehenden AI-Smokes belegen nur LegalAction-/PlayerView-Sicherheit und Hängerfreiheit.

| Karte | Release | Aktuelle Einordnung nach V1.1.3 |
| --- | --- | --- |
| Codeslinger | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Raffles | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Raptor | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Tinweasel | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Tycho Mem Chip | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Zetatech Mem Chip | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Hostile Takeover | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Cortical Scanner | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Crystal Wall | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Data Wall | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Data Wall 2.0 | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Endless Corridor | V1.0.5K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Bodyweight™ Synthetic Blood | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Jack 'n' Joe | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Livewire's Contacts | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Score! | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Wild Card | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| WuTech Mem Chip | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Tycho Extension | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Accounts Receivable | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Annual Reviews | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Closed Accounts | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Datapool® by Zetatech | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Day Shift | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Efficiency Experts | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Punitive Counterstrike | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Scorched Earth | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Urban Renewal | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Filter | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Fire Wall | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Keeper | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Mazer | V1.0.6K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Black Dahlia | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Codecracker | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Cyfermaster™ | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Loony Goon | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Shaka | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Wizard's Book | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Laser Wire | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Nerve Labyrinth | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| π in the 'Face | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Quandary | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Razor Wire | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Reinforced Wall | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Rock Is Strong | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Scramble | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Shotgun Wire | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Sleeper | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Wall of Ice | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Wall of Static | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Netwatch Credit Voucher | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |
| Night Shift | V1.1.2K | `listed`, `engine_supported`, `human_playable`, nicht `ai_supported` |

## AI-Level-Audit

| Level | Ziel | Stand nach V1.1.2K | Entscheidung |
| --- | --- | --- | --- |
| AI-Level 0 | Safe Legal Bot | Erfüllt als Sicherheitsbaseline: PlayerView, LegalActions, deterministischer Fallback, Side-Safety und Replay-Smokes vorhanden. | Dauer-Gate; V1.2.0 muss neue Choice-Fenster ohne Hänger abdecken. |
| AI-Level 1 | Regelbasierte Basis-KI | Erfüllt für Runner und Korp in engen unterstützten Baselines. | Bleibt gültig, aber nicht als starke KI beschreiben. |
| AI-Level 2 | Bewertungsbasierte KI | Teilweise erfüllt: Rollenmanifest, Difficulty-Profile, Scoring, Reason-Codes und Evidence existieren für V0.9-/Demo-Baselines. | Für O:NR-v1-Karten nicht vollständig; braucht AI-Hints. |
| AI-Level 3 | Planbasierte KI | Offen. | Erst V1.4.x nach Mechanik-/Karten-/Hints-Gates. |
| AI-Level 4 | Belief State | Offen, ObservedFacts sind nur Vorarbeit. | Erst nach side-sicherer Eventhistorie und Memory-Vertrag. |
| AI-Level 5 | Faire Simulation | Offen. | Erst nach stabiler Kopie-/Replay-/Belief-Basis. |
| AI-Level 6 | Selfplay/Tuning | Offen, Soak-Helfer existieren nur als Grundlage. | Späteres Benchmark-/Exploit-Gate. |

## AI-Hints-Sollvertrag

Künftige `ai_supported` Karten brauchen mindestens:

- `cardCode`
- `side`
- `roles`
- `requiredMechanics`
- `mechanicSupportLevel`
- `preferredWindows`
- `targetingHints`
- `riskTags`
- `deckArchetypeTags`
- `fallbackPolicy`
- `scenarioRefs`

AI-Hints sind manuell reviewpflichtig. Sie dürfen keine Spielbarkeit erzeugen und keine verborgenen gegnerischen Informationen enthalten.

## AiDecisionDebug-Sollvertrag

Künftige Entscheidungen müssen für V1.2.x mindestens diese Felder planen:

- `schemaVersion`
- `aiLevel`
- `rulesBaseline`
- `mechanicsBaseline`
- `cardPoolBaseline`
- `decisionId`
- `side`
- `difficulty`
- `selectedActionId`
- `selectedActionType`
- `selectedChoiceKind`
- `consideredActionIds`
- `confidence`
- `actionScores`
- `riskSummary`
- `usedFallback`
- `fallbackReason`
- `timeBudgetMs`
- `elapsedMs`
- `seed`
- `visibilitySource: "playerViewOnly"`
- `redactionPolicy`

Debugdaten dürfen nicht in normale PublicEvents, gegnerische PlayerViews, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews oder Logs mit Hidden-Info-Risiko geraten.

## Abhängigkeiten und Reihenfolge

1. V1.1.3 friert Statusmodell, Coverage und KI-Verträge ein.
2. V1.2.0 implementiert nur Prevention/Avoid/Interrupt-Grundlage.
3. V1.2.1 implementiert Replacement getrennt von Prevention/Avoid.
4. Erst danach folgt ein neuer Karten-Unlock oder Special-Zone-/Control-Gate.

## Risiken und Behandlung

| Risiko | Behandlung |
| --- | --- |
| `ai_supported` wird mit vorhandenem KI-Smoke verwechselt. | V1.1.3 trennt Sicherheits-Smoke und strategische KI-Freigabe. |
| Weitere Karten werden aus dem Katalog implizit spielbar. | Statusmodell blockiert Auto-Promotion. |
| V1.2.0 zieht Replacement mit. | V1.2.0-No-Scope und V1.2.1-Spezifikation trennen die Pipelines. |
| Hidden-Info-Gates werden durch Eventfenster komplexer. | V1.2.0/V1.2.1 müssen PlayerView, PublicEvent, WebSocket, Reconnect, Undo und AIInput getrennt testen. |

## Gate

`V1_1_3_requirements_freeze_done: true`

`ready_for_implementation: false`

V1.1.3 selbst hat keinen Implementierungsschritt. Die Folge-Releases V1.2.0 und V1.2.1 sind separat requirements-gefroren.
