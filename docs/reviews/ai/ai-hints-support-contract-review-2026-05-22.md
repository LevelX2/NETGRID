# AI-Hints-/Support-Contract-Review 2026-05-22

## Kurzbefund

- Aktive AI-Hints: 410.
- Aktive AI-Hints mit `aiSupportStatus: "ai_supported"`: 410.
- Runtime-Katalogkarten: 411.
- Aktives AI-Support-/Approval-Set: 410 Karten.
- Runtime-Karte ohne aktiven AI-Hint: `onr_proteus_041_toughoniumtm-wall`.

Der alte 377/33-Stand aus `ai-hints-role-gap-report-2026-05-17.md` ist historisch. Der aktuelle Contract ist 410 AI-supported Karten, 410 aktive AI-Hints und eine bewusst nicht AI-supported Proteus-Baseline im Runtime-Katalog.

## Toughonium Wall

`onr_proteus_041_toughoniumtm-wall` ist nach den aktuellen Proteus-Supportdaten kein fehlender AI-Hint-Fall. Die Karte ist runtime-sichtbar und human-playable, aber nicht deck-legal, nicht format-legal und nicht AI-supported.

Entscheidung: keine AI-Promotion und kein AI-Hint. Der Contract hält die Karte als einzige erlaubte Runtime-ohne-AI-Hint-Ausnahme fest, solange Proteus nicht in den aktiven AI-Support aufgenommen wird.

## Neuer Contract

Der Catalog-Test sichert jetzt:

- Das aktive AI-Support-Set aus den Supportdaten entspricht exakt dem aktiven Approval-Szenario `card-support-ai-supported-current#active_card_support_ai_supported`.
- Die aktiven AI-Hints sind eindeutig und entsprechen exakt dem aktiven AI-Support-Set.
- Jede AI-supported Karte hat eine Runtime-Karte und einen aktiven AI-Hint mit `aiSupportStatus: "ai_supported"`.
- Jeder aktive AI-Hint verweist auf eine Runtime-Karte und widerspricht dem Support-Set nicht.
- Runtime-Karten ohne AI-Hint sind sichtbar: aktuell ausschließlich `onr_proteus_041_toughoniumtm-wall`.

## Direkt verbesserte Hints

- `onr_v1_047_pile-driver`: von generischem Program/Breaker-Hint zu Wall-Breaker mit Noisy-/Stealth-Loss-Risiko, Rig-Coverage und Run-Pressure.
- `onr_v1_224_bolter-cluster`: als AP-/Sentry-/Damage-ICE mit Run-Lock-Folgeeffekt und höherem Threat-Wert beschrieben.
- `onr_v1_258_neural-blade`: analog als AP-/Sentry-/Damage-ICE mit Run-Lock-Folgeeffekt beschrieben, aber niedriger als Bolter Cluster gewichtet.
- `onr_v1_370_tesseract-fort-construction`: von generischem Upgrade zu Remote-Tax/Run-Defense durch Fort-ICE-Subroutinen-Modifikator geschärft.

Diese Änderungen bleiben AI-Doctrine-Hints. Sie ändern keine Engine-Regeln, keine LegalActions, keine Kartensupport-Status und keine Spielbarkeit.

## Fokussierte Qualitätsrunde

Folgende Hints wurden zusätzlich handlungsrelevanter gemacht:

- `onr_v1_016_cyfermaster`: klar als Code-Gate-/Decoder-Breaker mit Pump-/Break-Rolle, Credit-Reserve und höherer Rig-Coverage.
- `onr_v1_052_raffles`: Code-Gate-Breaker mit hohem Installationspreis, effizienter Break-Rolle und Credit-Reserve-Risiko.
- `onr_v1_054_raptor`: günstiger Killer-/Sentry-Breaker mit niedriger Basisstärke, Pump-/Break-Kosten und Tempo-Nutzen.
- `onr_v1_060_shaka`: effizienterer Sentry-Breaker mit stärkerer Rig-Coverage und Credit-Reserve-Hinweis.
- `onr_v1_165_junkyard-bbs`: Trash-Recovery/Ressourcen-Engine statt Economy-Platzhalter; Abhängigkeit vom obersten Trash-Card-Ziel markiert.
- `onr_v1_178_short-term-contract`: endlicher Bit-Depot-/Click-Economy-Plan statt generischem Economy-Hint.
- `onr_v1_212_priority-requisition`: 3-Punkte-Agenda mit Free-Rez-Tempo, Scoring-Fenster und teurer ICE-Synergie.
- `onr_v1_219_superior-net-barriers`: Wall-Synergie, globale Wall-Stärke, Scoring-Economy und Reveal-Choice getrennt.
- `onr_v1_339_schlaghund`: Tag-Punishment/Meat-Damage-Drohung, Würfelabhängigkeit, Tag-Abhängigkeit und Self-Trash-Risiko.
- `onr_v1_359_jenny-jett`: Successful-Run-Punish durch HQ-ICE-Install/Encounter statt generischem Upgrade.
- `onr_v1_361_namatoki-plaza`: Remote-Kapazität für Agenda-/Node-Slot und Subsidiary-/Overcapacity-Risiko.
- `onr_v1_366_red-herrings`: Agenda-Steal-Tax und Remote-Scoring-Schutz statt breiter Access-Tax.
- `simple_agenda`: als Testset-Baseline ohne Zusatzfähigkeit markiert, damit der Hint nicht wie eine echte Scoring-Spezialkarte wirkt.

Nicht geändert wurden die genannten Slugs `onr_v1_098_short-term-contract`, `onr_v1_115_underworld-mole`, `onr_v1_130_junkyard-bbs`, `onr_v1_243_feed-the-machine`, `onr_v1_266_schlaghund` und `onr_v1_272_snowbank`, weil sie im aktiven AI-Hint-Set nicht unter diesen IDs existieren. Die aktiven Originalset-Slugs für die sicheren Fälle sind `onr_v1_178_short-term-contract`, `onr_v1_165_junkyard-bbs` und `onr_v1_339_schlaghund`; `Underworld Mole` und `Snowbank` liegen aktuell im Proteus-Bereich und sind nicht Teil des aktiven AI-Support-Sets.

## Restliche oder unsichere Kandidaten

### ICE

- `onr_v1_243_feed-the-machine`: unter diesem Slug nicht im aktiven AI-Hint-Set gefunden; erst Katalog-/Slug-Lage klären.
- `onr_v1_272_snowbank`: unter diesem Slug nicht im aktiven AI-Hint-Set gefunden; `Snowbank` liegt aktuell als Proteus-Karte außerhalb des aktiven AI-Support-Sets.

### Icebreaker und Runner-Rig

- Die vier priorisierten Breaker `onr_v1_016_cyfermaster`, `onr_v1_052_raffles`, `onr_v1_054_raptor` und `onr_v1_060_shaka` sind in der Qualitätsrunde geschärft.

### Agenda und Scoring

- `simple_agenda`, `onr_v1_212_priority-requisition` und `onr_v1_219_superior-net-barriers` sind in der Qualitätsrunde geschärft.

### Remote-Upgrades und Assets

- `onr_v1_359_jenny-jett`, `onr_v1_361_namatoki-plaza` und `onr_v1_366_red-herrings` sind in der Qualitätsrunde geschärft.

### Economy und Run-Events

- `simple_economy_operation`: nur Testset-generisch; als Economy-Smoke ausreichend, aber nicht doctrine-stark.
- `onr_v1_115_underworld-mole`: unter diesem Slug nicht im aktiven AI-Hint-Set gefunden; `Underworld Mole` liegt aktuell als Proteus-Karte außerhalb des aktiven AI-Support-Sets.
