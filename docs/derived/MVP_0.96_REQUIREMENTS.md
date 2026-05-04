# MVP 0.96 Requirements - Trace, Link und Bidding

Status: Requirements Freeze
Stand: 2026-05-04

## Scope

V0.96 führt Trace, Runner-Link und offenes Bidding als enges M5-Mechanikgate ein. Der Slice baut auf den abgeschlossenen Gates V0.94 Damage/Flatline und V0.95 Resources/Tag-Interaktion auf und nutzt die in V0.93 vorbereiteten `PendingChoice`-/`resolve_choice`-Verträge erstmals für eine echte wechselseitige Spielentscheidung.

Regelreferenz: CR v26.03, Abschnitte 2.9, 10.7 und 10.8. Die Referenz wird nur für Trace/Link/Bidding genutzt und erweitert nicht automatisch spätere Mechaniken.

## Ziele

- Trace wird als deterministische Engine-Sequenz modelliert: Initiierung, Corp-Bid, Runner-Bid, Vergleich und begrenzter Erfolgseffekt.
- Corp handelt beim Trace zuerst und darf offen Credits ausgeben, um die Trace-Strength zu erhöhen.
- Runner handelt danach und darf offen Credits ausgeben; Runner-Strength ist Link-Wert plus Runner-Bid.
- Ein Trace ist erfolgreich, wenn Trace-Strength größer als Runner-Strength ist. Gleichstand oder höherer Runner-Wert bedeutet Fehlschlag.
- Link ist als berechneter sichtbarer Runner-Wert vorbereitet; in V0.96 startet der freigegebene Demo-Runner mit Base Link 0.
- Der einzige freigegebene Trace-Erfolgseffekt ist `add_tag`.
- `applyAction` revalidiert Side, actionId, stateVersion, Timing, offene Choice, Kosten, Bid-Grenzen und Trace-Status erneut.
- Visibility, Replay/StateHash, AI und Multiplayer bleiben side-sicher und deterministisch.

## Nicht-Ziele

- Kein Damage über Trace und keine Kombination aus Trace und Damage in einer Karte.
- Keine Resource-spezifischen Trace-Effekte.
- Kein Jack-out, Breach, Multiaccess oder Run-Ausbau über das für den Harness notwendige Minimum hinaus.
- Keine Identity-Abilities außer einem passiven Base-Link-Wert von 0.
- Kein Search, Reveal, Expose, Arrange, Shuffle oder Hidden-Zone-Manipulation.
- Kein Hosting, keine Viren, keine neuen Counter-Familien, keine Bad-Publicity-/Recurring-Credit-Nutzung.
- Keine Prevention, Avoid, Interrupt oder Replacement.
- Keine offiziellen Karten, offiziellen Artworks, Card Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine automatische Spielbarkeit durch Import, Katalog oder Deckeditor.

## Must Requirements

| ID | Requirement |
|---|---|
| M096-SHARED-001 | Shared Types enthalten additive Trace-/Link-Verträge, ohne vorhandene V0.95-Verträge zu brechen. |
| M096-LINK-001 | Runner-Link wird deterministisch aus öffentlicher Base-Link-Quelle und späteren öffentlichen Link-Modifikatoren berechnet; in V0.96 ist Base Link 0 freigegeben. |
| M096-TRACE-001 | Ein Trace kann nur von einer manifestierten lokalen/fiktiven, spielbaren Quelle gestartet werden. |
| M096-TRACE-002 | Trace-Start erzeugt eine Corp-`PendingChoice` vom Typ `bid_amount` mit legalen offenen Bid-Optionen von 0 bis zu den aktuellen Corp-Credits. |
| M096-TRACE-003 | Corp-Bid revalidiert Side, ChoiceId, StateVersion, Trace-Status, Auswahlanzahl, Option, Nicht-Negativität und bezahlbare Kosten. |
| M096-TRACE-004 | Nach Corp-Bid erzeugt die Engine eine Runner-`PendingChoice` vom Typ `bid_amount`; der Runner sieht Trace-Strength, eigenen Link-Wert und legale Bid-Optionen. |
| M096-TRACE-005 | Runner-Bid revalidiert Side, ChoiceId, StateVersion, Trace-Status, Auswahlanzahl, Option, Nicht-Negativität und bezahlbare Kosten. |
| M096-TRACE-006 | Corp- und Runner-Bids zahlen exakt die gewählten Credits aus den jeweiligen Credit-Pools. |
| M096-TRACE-007 | Trace-Ergebnis ist erfolgreich, wenn `baseTraceStrength + corpBid > runnerLink + runnerBid`; Gleichstand oder höherer Runner-Wert ist Fehlschlag. |
| M096-TRACE-008 | Der erste freigegebene Erfolgseffekt ist ausschließlich `add_tag`; Fehlschlag hat in V0.96 keinen weiteren Effekt. |
| M096-TRACE-009 | Nach Trace-Abschluss wird der Trace-State deterministisch geschlossen und der Run-/Timingzustand side-sicher fortgesetzt. |
| M096-VISIBILITY-001 | PlayerViews, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors, AI-Inputs und UI-Diagnostics leaken keine verdeckten Runner- oder Corp-Zonen. |
| M096-EVENT-001 | Trace-Start, Corp-Bid, Runner-Bid und Trace-Ergebnis sind öffentliche Events mit nur öffentlichen Trace-/Credit-/Tag-Daten. |
| M096-UNDO-001 | Trace-Bids sind keine Hidden-Info-Barriere; bestehende Hidden-Info-Barrieren durch andere Aktionen, z. B. Rez oder Damage, bleiben wirksam. |
| M096-REPLAY-001 | Trace-Sequenzen replayen deterministisch und erhalten identische StateHashes; V0.96 führt keine neue Randomness ein. |
| M096-AI-001 | AI nutzt Trace-Choices ausschließlich aus PlayerView und LegalActions und wählt Bid-Optionen side-sicher. |
| M096-MP-001 | Multiplayer Submit, Idempotency, Reconnect und Undo-Barrieren unterstützen Corp- und Runner-Bid-Choices side-sicher. |
| M096-CARD-001 | Mindestens eine lokale/fiktive Trace-Harness-Karte darf nur mit Manifest, Resolver/Ability, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke spielbar werden. |
| M096-DECK-001 | Deckvalidierung und Matchstart dürfen keine Trace-Karte deck-legal machen, deren Mechanik-Coverage, Manifest und Tests nicht freigegeben sind. |
| M096-NOSCOPE-001 | V0.97+-Mechaniken, insbesondere Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention bleiben unspielbar. |
| M096-GATE-001 | V0.96 darf erst final abgeschlossen werden, wenn Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build grün sind oder Blocker dokumentiert und akzeptiert wurden. |

## Entscheidungen

- V0.96 verwendet eine lokale/fiktive ICE-Harness-Karte mit Trace-Subroutine und Erfolgseffekt `add_tag`.
- Trace-Bids werden als `PendingChoice.kind = "bid_amount"` mit expliziten Option-IDs modelliert, damit LegalActions und `applyAction` die auswählbaren Beträge erneut validieren können.
- Bid-Informationen sind nach Antwort öffentlich. Verdeckte Hand-, Deck-, HQ-, R&D- oder Archives-Daten bleiben unberührt.
- V0.96 aktiviert keinen generischen Effektparser, keine offiziellen Trace-Karten und keine Trace-Effekte außerhalb `add_tag`.
- V0.96 nutzt keine neue Randomness. RandomCounter und RandomDrawRecords bleiben unverändert, außer bereits vorhandene Aktionen lösen unabhängig davon Randomness aus.

## Gate

`MVP_0.96_requirements_freeze_done: true`

`ready_for_MVP_0.96_implementation: true`
