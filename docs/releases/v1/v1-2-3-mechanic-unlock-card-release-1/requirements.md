# V1.2.3 Requirements - Mechanic Unlock Card Release 1

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.2.3 gibt einen kontrollierten Kartenbatch frei. Jede Karte muss durch Mechanik-Coverage, Resolver, Manifest, Tests, Visibility, Replay/StateHash, Multiplayer-Smoke und bei Bedarf AI-Hints abgesichert sein.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V123-MUST-001 | V1.2.3 startet erst nach gruenem V1.2.2-Final-Gate. |
| V123-MUST-002 | Vor Code wird eine finale Kartenliste mit maximal 20 Karten dokumentiert. |
| V123-MUST-003 | Jede Kandidatenkarte hat eine dokumentierte Quelle/Provenienz im lokalen Projektkontext. |
| V123-MUST-004 | Jede Kandidatenkarte hat `requiredMechanics`. |
| V123-MUST-005 | Jede `human_playable` Karte hat einen expliziten Resolver-/Ability-Verweis. |
| V123-MUST-006 | Keine Karte wird durch Katalog-, Import-, Bild- oder Textstatus automatisch spielbar. |
| V123-MUST-007 | Nicht vollstaendig abgedeckte Mechaniken blockieren die Karte. |
| V123-MUST-008 | Karten mit neuen, nicht freigegebenen Mechanikfamilien werden zurueckgestellt. |
| V123-MUST-009 | `data/manifests/card-implementation-manifest-1.2.3.json` dokumentiert freigegebene und zurueckgestellte Karten. |
| V123-MUST-010 | Runtime-Gate promoted genau die freigegebenen V1.2.3-Karten und keine anderen. |
| V123-MUST-011 | `deck_legal` setzt `human_playable` voraus. |
| V123-MUST-012 | Server validiert Decks beim Matchstart erneut gegen den V1.2.3-Runtime-Status. |
| V123-MUST-013 | Deckeditor und Katalog zeigen Status getrennt: listed, engine_supported, human_playable, ai_supported, deck_legal. |
| V123-MUST-014 | Pro freigegebener Karte existiert mindestens ein Unit- oder Integrationstest. |
| V123-MUST-015 | Mindestens ein Batch-Szenario mit finalem StateHash existiert. |
| V123-MUST-016 | Neue Kartenbewegungen oder Hidden-Info-Effekte haben Visibility-Tests. |
| V123-MUST-017 | Neue Effekte haben Replay-/StateHash-Tests. |
| V123-MUST-018 | Multiplayer-Smoke prueft Matchstart und mindestens einen relevanten Effektpfad mit V1.2.3-Deck. |
| V123-MUST-019 | Reconnect waehrend eines relevanten neuen Effektpfads bleibt side-sicher. |
| V123-MUST-020 | Undo ist fuer neue Effektpfade definiert und getestet. |
| V123-MUST-021 | E2E-Smoke deckt mindestens ein V1.2.3-Deck im Browser ab. |
| V123-MUST-022 | DOM-/Storage-/Payload-Leak-Scan enthaelt neue Karten und Effekte. |
| V123-MUST-023 | Karten ohne AI-Hints duerfen nicht `ai_supported` werden. |
| V123-MUST-024 | Jede `ai_supported` Karte hat AI-Hints mit Rollen, requiredMechanics, FallbackPolicy und SzenarioRefs. |
| V123-MUST-025 | KI-Deckpool wird nur um `ai_supported` Karten erweitert. |
| V123-MUST-026 | KI darf `human_playable`-only Karten im KI-Deckbau ignorieren oder ablehnen. |
| V123-MUST-027 | KI-Smoke prueft, dass neue LegalActions keine Hänger oder illegalen Actions erzeugen. |
| V123-MUST-028 | `AiDecisionDebug` nennt neue Kartenrollen und Entscheidungen nur side-sicher. |
| V123-MUST-029 | Final Review listet freigegebene, human-only, ai-supported und zurueckgestellte Karten getrennt. |
| V123-MUST-030 | No-Scope-Regression bestaetigt: keine Format-/Public-/Asset-/Kartentextparser-Ausweitung. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V123-SHOULD-001 | Batchgroesse sollte 8 bis 20 Karten betragen; kleiner ist bei Mechanikrisiko erlaubt. |
| V123-SHOULD-002 | Mindestens ein Runner- und ein Korp-Kandidat sollten aufgenommen werden, wenn beide Seiten sichere Kandidaten haben. |
| V123-SHOULD-003 | AI-supported Karten sollten nach Rollen Economy, ICE, Breaker, Damage, Prevention, Bait oder Utility gruppiert werden. |
| V123-SHOULD-004 | Zurueckstellungen sollten maschinenlesbar genug sein, um spaetere V1.3.x/V1.4.x-Planung zu speisen. |

## Statusregeln

| Status | V1.2.3-Regel |
| --- | --- |
| `listed` | Karte ist bekannt, aber nicht spielbar. |
| `engine_supported` | Resolver/Ability und Mechanikabdeckung existieren, aber noch keine vollstaendige Matchfreigabe. |
| `human_playable` | Karte ist fuer private menschliche Matches freigegeben und `deck_legal` moeglich. |
| `ai_supported` | Karte ist human_playable plus AI-Hints, Szenario und KI-Smoke/Soak. |

## Gate

`ready_for_implementation_after_V1_2_2: true`

V1.2.3 ist nach erfolgreicher V1.2.2-Umsetzung implementierbar.
