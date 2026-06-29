# AI B8AF Deckout Flood Evidence 2026-06-29

## Match

- Match: `match_b8af9ab4ec83fb6c`
- Speicher: `data/runtime/multiplayer/netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Seed: `match-mqzkx57i-1t4aixi`
- Ende: Runner gewinnt durch `corp_deck_empty`
- StateVersion bei Ende: `311`
- Corp-Deck: `KI Rush Score - Static ICE Mix`
- Runner-Deck: `Deep Market Engine`
- AI-Traces: Tabelle `ai_decision_traces` leer; entscheidungsrelevante Debugdaten lagen in Event-Payloads.

## Befunde

### Deckout-Clock wird nicht als Notfall bewertet

Ab etwa `sv220` hatte die Corp mehrere Agendas in HQ und nur noch wenige Karten in R&D. Trotzdem blieben passive Aktionen wie Credits, Setup und später Draw-Operationen konkurrenzfähig. Das führte nicht zu einer konkreten Scoreline, sondern zum Verlust durch leeres R&D.

### Draw-Operation unter niedrigem R&D bleibt zu attraktiv

Bei `sv276` spielte die Corp `Day Shift`, obwohl nur noch vier Karten in R&D lagen und HQ nahezu vollständig aus Agendas bestand. Der sichtbare Wert `corp_operation_burst_economy` war hoch genug, um die Deckout-Gefahr zu überdecken.

### Agenda-Flood in HQ wird nicht aktiv entlastet

In den späten Corp-Entscheidungen lagen mehrfach vier bis sechs HQ-Karten mit hohem Agenda-Anteil vor. Die KI hielt die Agendas in HQ oder warf später `Marine Arcology` in Archives ab, statt eine konkrete, wenn nötig riskante, Scoreline gegen den sicheren Deckout zu bevorzugen.

### Unsichere Scoreline braucht Desperation-Abwägung

Die vorhandene Remote-Safety-Logik darf unsichere Agenda-Installationen in normalen Phasen weiter blocken. Bei niedrigem R&D und Agenda-Flood ist die relevante Vergleichsgröße aber nicht "sicher vs. unsicher", sondern "unsicherer Score-Versuch vs. sehr wahrscheinlicher Deckout/Agenda-Flood-Verlust".

## Bereits abgedeckt durch vorherige Commits

- Zu schwache normalisierte Triage-Mismatch-Werte.
- `new_remote` als falsches Ziel für bestehende Score-Remote.
- Score-now- und Overadvance-Regressionsschutz.
- Marine-Arcology-2-Klick-Economy gegenüber Basis-Credit.

## Umsetzungskriterien

- Bei niedrigem R&D plus sichtbarem Agenda-Flood in HQ entsteht eine eindeutige Corp-Triage-Lage.
- Freiwillige Draw-Aktionen und draw-lastige Operationen verlieren in dieser Lage deutlich.
- Konkrete Scoreline-Aktionen oder Remote-Schutz für eine Scoreline schlagen passive Economy/Setup-Linien, sofern kein sofortiges `score_agenda` existiert.
- Ohne Deckout-/Agenda-Flood-Druck bleiben die bisherigen Safety-Gates für unsichere Scorelines erhalten.
