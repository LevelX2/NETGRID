# V2.8 Public Replay Policy und Projektionsinventar

Stand: 2026-05-17
Status: Architekturvertrag, keine Implementierungsfreigabe
Zielrelease: V2.8 Public Replay

## Findings

### Hoch: Public Replay ist keine dritte Nutzung der privaten Replay-Ansicht

Betroffene Anker:

- `apps/server/src/event-projection.ts` kennt aktuell `runner`, `corp` und `local_analysis`.
- `apps/server/src/multiplayer.ts` exportiert nur Runner-/Korp-Perspektiven und lehnt `local_analysis` ab.
- `ReplayView` enthält heute Lern-/Analysefelder wie `exploitSuggestions`, `randomDrawRecords` und perspektivische Timeline-Daten.

Risiko: Eine öffentliche Replayfreigabe über bestehende private Views könnte Hidden-Info-Timing, side-private Projektionen, lokale Analyse oder KI-/Debugkontext in eine öffentliche Fläche heben.

Empfehlung: Public Replay braucht eine eigene Projektion, z. B. `public_sanitized_timeline_v1`. Sie darf nicht automatisch aus `runner`, `corp` oder `local_analysis` exportiert werden.

### Hoch: Consent, Löschung und Unlisting sind harte Gates

Betroffene Anker:

- V2.0 Datenschutzvertrag: `docs/derived/V2_0_PRIVACY_EXPORT_DELETE_CONTRACT.md`
- V2.6 Moderation/RBAC: `docs/derived/V2_6_MODERATION_EVIDENCE_RBAC_CONTRACT.md`

Risiko: Öffentliche Replays sind account- und moderationsempfindlich, selbst wenn sie keine Hidden Cards zeigen. Match-ID, Anzeige-Namen, Ergebnis, Zeitstempel und Spielstil können personenbezogen wirken.

Empfehlung: Public Replay startet nur mit expliziter Veröffentlichung, Widerruf/Unlisting, Retention-Policy, Abuse-Meldung und Moderationsintegration. Alte private Replays werden nicht automatisch public.

## Bestehende wiederverwendbare Bausteine

| Baustein | Wiederverwendbar | Grenze |
| --- | --- | --- |
| `ServerEventRecord.publicPayload` | ja, als Input für Sanitizing | nicht direkt public veröffentlichen |
| `hiddenInfoBarrier` | ja, als Marker und Testanker | keine Hidden-Daten daraus ableiten |
| `replayStateHashChecks` | ja, Integritätsnachweis | keine FullState-Veröffentlichung |
| `redactPublicEventForSide` | teilweise | side-Perspektive ist nicht Public-Perspektive |
| `exportReplay` | teilweise | `local_analysis` bleibt verboten; Public braucht eigenen Exporttyp |
| Observability-Redaction-Baseline | ja, Testmuster | ersetzt keine Replay-spezifischen Tests |
| Moderation-RBAC-Matrix | ja, Zugriff auf Reports/Evidence | keine Standard-FullState-Ansicht |

## Minimaler erlaubter Projektionstyp

Ein späterer erster Public-Replay-Typ darf höchstens enthalten:

- Public Replay ID, Veröffentlichungszeit, Unlisting-/Visibility-Status.
- Baseline, Formatprofil, Cardpool-Version, Matchmodus, Ergebnis, finaler StateHash.
- optionale Anzeigenamen nur mit Consent oder neutralisierte Player Labels.
- Event-Zeitleiste mit öffentlicher Eventfamilie, Timingpunkt, StateVersion vor/nach, StateHash nach Event, öffentlichem Label und Hidden-Info-Barriere-Marker.
- keine Side-private Perspektive, keine `local_analysis`, keine `exploitSuggestions`, keine `DecisionDebug`, keine `AIInput`.

Nicht enthalten:

- FullState, `privatePayload`, `cardInstances`, verdeckte Kartenidentitäten.
- Decklisten, Deckhashes, private Decksnapshots, Cloud-Deck-IDs.
- Account-IDs, Session-/Join-/Reconnect-/Invite-/Recovery-Tokens, Token-Hashes.
- lokale Dateipfade, Kartenbilder oder offizielle Assets ohne eigenes Gate.
- Chat oder Reportdaten ohne eigenes Moderations-/Chat-Gate.

## Offene Policy-Fragen

| Thema | Entscheidung vor Implementierung |
| --- | --- |
| Consent | beide menschlichen Seiten, Host allein oder Account-Owner pro Seite? |
| Widerruf | Unlisting, Hard Delete oder Retention-Ausnahme bei Reports? |
| Alte Matches | keine automatische Veröffentlichung; explizite Migration nur nach Policy |
| Anzeige-Namen | echte Namen, Pseudonyme oder neutrale Rollenlabels |
| Deck-Metadaten | zunächst keine Deckliste und kein stabiler Deckhash public |
| KI-Matches | KI-Version als technisches Label ja; KI-Debug und AIInput nein |
| Moderation | Report/Abuse-Pfad vor Public-Index |
| Assets | keine Kartenbilder, Frames oder Card Backs ohne Asset-/Rechtsgate |

## Redaction-Testkandidaten

Ein späterer Implementierungsslice braucht Tests für:

1. Public Replay enthält kein `local_analysis`, keine Runner-/Korp-private Projektion und keine gegnerische private Sicht.
2. Payloadscan blockiert `privatePayload`, `cardInstances`, FullState, Hidden Cards, Decklisten, Deckhashes, Tokens, Token-Hashes, `AIInput`, `DecisionDebug` und lokale Pfade.
3. StateHash-Prüfung bleibt erhalten, ohne FullState zu exportieren.
4. Consent-Status entscheidet Veröffentlichung, Unlisting und Exportfähigkeit.
5. Account-Löschung entkoppelt Anzeigenamen oder unlistet Replays nach Policy, ohne historische Engine-Events zu verändern.
6. Moderations-Report nutzt public-safe Replay-Evidence und keinen Break-Glass-Export.

## Folgepakete

Benannte nächste Pakete:

1. `public-replay-redaction-harness`: Tests für Public-Replay-Payloadscan und verbotene Felder.
2. `public-replay-consent-unlisting-contract`: Consent-, Lösch-, Unlisting- und Retention-Policy.
3. `public-sanitized-replay-projection-builder`: eigener Builder für `public_sanitized_timeline_v1`, erst nach Policy-Freeze.

## Entscheidung

V2.8 Public Replay bleibt blockiert, bis Consent, Datenschutz, Moderation, Redaction und Asset-Gates geklärt sind. Der minimal denkbare Pfad ist eine neue public-sanitized Projektion, nicht die Veröffentlichung bestehender privater Replay-Views.
