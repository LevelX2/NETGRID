# V1.9.22 Local Card Facts Working Basis

Stand: 2026-05-13 20:20 CEST
Status: Arbeitsgrundlage hergestellt, keine Promotion

## Ergebnis

Fuer alle 47 V1.9.22-WIP-Karten liegt jetzt eine versionierte lokale Faktenbasis vor:

- Maschinenlesbar: `data/rules/v1922-local-card-facts.json`
- Abgedeckte Karten: 47/47 aus `ONR_V1_9_22_WIP_CARD_IDS`
- Offene Attributkonflikte: 0
- Runtime-/Catalog-/AI-Promotion: unveraendert false

Damit fehlt fuer die V1.9.22-Karten nicht mehr die Daten-Arbeitsgrundlage. Offen ist die konkrete Implementierung pro Karte oder Kartenfamilie: LegalActions, `applyAction`-Revalidierung, Sichtbarkeit, Replay/StateHash, Manifest/Coverage, AI-Fallbacks, Webclient-Gates und Final Review.

## Nutzerentscheide

- `Political Overthrow`: `Gain 3`
- `Hostile Takeover`: `Gain 5`
- `Private Cybernet Police`: `Trace 5`
- `Data Wall 2.0`: Rez-Kosten 2, Staerke 1

## Erste enge Implementierungskandidaten

| Karte | Grund |
| --- | --- |
| `Corporate War` | Vollstaendig genug fuer engen On-score-Credit-Resolver: 3 Advancement, 3 Punkte, 12-Credit-Schwelle, Gain 12 oder alle Credits verlieren. |
| `Political Overthrow` | Vollstaendig genug fuer engen scored-agenda-action-Resolver: Aktion kostet 1 und gibt nach Nutzerentscheid 3 Credits. |

## Nicht mehr als Blocker zu verwenden

Die Aussage "es fehlen Kartendaten fuer V1.9.22" ist nach diesem Stand zu breit und nicht mehr korrekt.

Korrekt ist:

- Die lokalen Kartenfakten liegen fuer den kompletten 47er-Scope vor.
- Einzelne Karten brauchen vor Promotion noch konkrete Engine-Vertraege und Tests.
- Bei neuen echten Attributwiderspruechen wird nur der betroffene Kartenwert nachgefragt.

## Gate

V1.9.22 bleibt `implementing` und `blocked_open`, weil noch keine neue Karte durch diesen Schritt spielbar promotet wurde.
