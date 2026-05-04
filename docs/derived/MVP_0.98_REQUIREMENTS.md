# MVP 0.98 Requirements - Identities, Modifier und Hidden-Zone-Tools

Status: Requirements Freeze
Stand: 2026-05-04

## Scope

V0.98 bündelt M7 und M8, wird aber intern strikt in zwei Subgates umgesetzt:

- V0.98a: Identity-Fähigkeiten, Setup-Effekte, statische Modifier und deterministische Usage-Marker.
- V0.98b: Hidden-Zone-Tools Search, Reveal, Expose, Arrange, Shuffle und Swap als enge lokale Harness-Mechaniken.

Regelreferenz: CR v26.03, Abschnitte 1.6.1-1.6.7, 1.21.2-1.21.7, 8.7, 8.8, 9.4 und 10.2. Die Referenz wird nur für diese Mechaniken genutzt und erweitert nicht automatisch V0.99+ oder M11.

## Ziele

- Mindestens eine Runner- und eine Corp-Identity erhalten sichere, sichtbare und replaybare Fähigkeiten.
- Setup-Identity-Fähigkeiten laufen genau einmal und werden im StateHash nachvollziehbar markiert.
- Statische Modifier werden zentral berechnet und in LegalAction-Bau sowie `applyAction` konsistent revalidiert.
- Search/Arrange nutzen die bestehende `PendingChoice`-Pipeline und zeigen Hidden-Zone-Kandidaten nur der berechtigten Side.
- Reveal/Expose erzeugen bewusste öffentliche Information über PublicEvents, nicht über PlayerView- oder Reconnect-Leaks.
- Shuffle nutzt Seed, RandomCounter und RandomDrawRecords.
- Swap bleibt auf enge, deterministische Zonen-/Karten-Piloten begrenzt und aktiviert keine Ownership-/Control-Wechsel.

## Nicht-Ziele

- Keine Prevention, Avoid, Interrupts oder Replacement.
- Kein Hosting, keine Viren, kein Purge und keine neuen Counter-Familien.
- Keine vollständige Deckbuilding-/Faction-/Influence-Regel.
- Keine Set-Aside-, Remove-from-Game- oder Ownership-/Control-Wechsel.
- Keine automatische Spielbarkeit importierter Identities oder Hidden-Zone-Karten.
- Keine öffentlichen Replay-, Zuschauer- oder Plattformfunktionen.

## Must Requirements

| ID | Requirement |
|---|---|
| M098A-SHARED-001 | Shared Types enthalten additive Identity-/Modifier-/Usage-Verträge, ohne V0.97-Verträge zu brechen. |
| M098A-IDENTITY-001 | Eine Runner-Identity und eine Corp-Identity sind als lokale/fiktive `playable_mvp` Harness-Identities manifestiert. |
| M098A-SETUP-001 | Setup-Identity-Fähigkeiten laufen genau einmal beim Spielstart und werden deterministisch markiert. |
| M098A-MODIFIER-001 | Statische Modifier werden zentral berechnet und wirken identisch in LegalActions und `applyAction`. |
| M098A-LINK-001 | Runner-Link-Berechnung nutzt Identity-/Modifier-Werte deterministisch und side-sicher. |
| M098A-MEMORY-001 | Runner-Memory-Limit kann durch eine Identity oder einen statischen Modifier erhöht werden, ohne Install-Revalidierung zu umgehen. |
| M098A-USAGE-001 | Ability-Usage-Marker sind statehash-sicher und resetten nur an dokumentierten Zeitpunkten. |
| M098A-VISIBILITY-001 | Identity-Fähigkeiten verwenden nur offene oder eigene Information und leaken keine gegnerischen Hidden-Zones. |
| M098B-CHOICE-001 | Hidden-Zone-Tools nutzen `PendingChoice`/`LegalActions`; falsche Side, stale StateVersion und ungültige Choices werden abgelehnt. |
| M098B-SEARCH-001 | Search ist im Startscope auf eigene Hidden-Zonen beschränkt und zeigt Kandidaten nur der suchenden Side. |
| M098B-REVEAL-001 | Reveal zeigt definierte Karteninformationen öffentlich und ändert nicht automatisch Faceup-/Rezzed-Zustände. |
| M098B-EXPOSE-001 | Expose ist auf installierte, unrezzed Corp-Karten beschränkt und erzeugt ein öffentliches Reveal-Event. |
| M098B-ARRANGE-001 | Arrange erlaubt einer berechtigten Side eine private Reihenfolge-Choice für eine kleine Kartenmenge. |
| M098B-SHUFFLE-001 | Shuffle nutzt ausschließlich Seed, RandomCounter und RandomDrawRecords. |
| M098B-SWAP-001 | Swap bewegt nur explizit freigegebene Karten zwischen legalen Zonen und respektiert Owner/Controller/Faceup-Invarianten. |
| M098B-VISIBILITY-001 | PlayerViews, PublicEvents, WebSocket, Reconnect, Undo-Previews, Logs, Errors, AI-Inputs und UI-Diagnostics leaken keine privaten Kandidaten oder Reihenfolgen. |
| M098B-EVENT-001 | Search/Arrange/Shuffle/Swap sind Hidden-Info-Barrieren, wenn private Information angesehen oder bewegt wurde; Reveal/Expose sind public Informationswechsel. |
| M098B-UNDO-001 | Undo vor Hidden-Zone-Information bleibt möglich; nach Hidden-Zone-Barrier bleibt Undo blockiert. |
| M098B-REPLAY-001 | Search/Reveal/Expose/Arrange/Shuffle/Swap replayen deterministisch mit identischem StateHash. |
| M098B-AI-001 | AI nutzt nur PlayerView, LegalActions und side-sichere Choices; keine gegnerischen Hidden-Zone-Kandidaten. |
| M098B-MP-001 | Multiplayer Submit, Idempotency, Reconnect und Undo-Barrieren funktionieren für Identity- und Hidden-Zone-Situationen. |
| M098-CARD-001 | Jede neue spielbare Identity oder Hidden-Zone-Harness-Karte braucht Manifest, Resolver, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke. |
| M098-DECK-001 | Deck-/Matchstart-Gates dürfen keine V0.98-Karte ohne Mechanik-Coverage und Manifest spielbar machen. |
| M098-NOSCOPE-001 | V0.99+, Hosting, Viren, Counter-Familien, Recurring Credits, Bad Publicity, Prevention, Avoid, Interrupt und Replacement bleiben unspielbar. |
| M098-GATE-001 | V0.98 darf erst final abgeschlossen werden, wenn Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build grün sind oder Blocker dokumentiert und akzeptiert wurden. |

## Entscheidungen

- V0.98a muss vor V0.98b grün sein; bei Instabilität wird V0.98b nicht begonnen.
- Identity-Piloten sind lokal/fiktiv und bewusst sichtbar: keine gegnerische Hand-/Deck-/Archives-Triggerbedingung.
- Hidden-Zone-Tools werden als kleine Harness-Karten umgesetzt, nicht als allgemeine vollständige offizielle Such-/Manipulationsmaschine.
- Search/Arrange-Choices dürfen private Optionslabels nur im PlayerView der berechtigten Side enthalten.
- Reveal/Expose dürfen genau die freigegebenen Kartendaten im PublicEvent nennen.
- Swap in V0.98 ist kein Ownership-/Control-Gate und keine Hosting-Mechanik.

## Gate

`MVP_0.98_requirements_freeze_done: true`

`ready_for_MVP_0.98a_implementation: true`
