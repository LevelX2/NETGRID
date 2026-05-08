# V1.2.0 Requirements - Event Modification Foundation

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.2.0 implementiert die Grundlage für `would`, `prevent`, `avoid` und eng begrenzte `interrupt`-Fenster. Der Release muss so klein bleiben, dass Hidden Info, Replay, StateHash, Multiplayer, Reconnect, Undo und KI-Fallback vollständig testbar bleiben.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V120-MUST-001 | Die Engine modelliert eine imminent instruction, bevor das betroffene Ereignis final auf den GameState angewandt wird. |
| V120-MUST-002 | Jede imminent instruction hat ein kanonisches Event-Objekt mit Event-ID, Typ, Quelle, Controller, betroffener Seite, Payload, Sichtbarkeitsklasse und StateVersion-Kontext. |
| V120-MUST-003 | Die Pipeline unterscheidet `would`, `prevent`, `avoid` und `interrupt` semantisch. |
| V120-MUST-004 | Replacement Effects sind in V1.2.0 nicht implementiert, nicht spezifiziert als aktiv und durch No-Scope-Regression geschützt. |
| V120-MUST-005 | Candidate Collection berücksichtigt nur explizit freigegebene Mechaniktypen und Effekte. |
| V120-MUST-006 | Bei keiner oder abgelehnter Modifikation wird das Originalevent unverändert und replaybar aufgelöst. |
| V120-MUST-007 | Bei Prevention wird nur der freigegebene Betrag oder Effektanteil verhindert; Restereignisse bleiben deterministisch. |
| V120-MUST-008 | Bei Avoid wird das freigegebene Event vollständig vermieden oder als vermieden markiert; Folgeevents entstehen nur, wenn sie explizit spezifiziert sind. |
| V120-MUST-009 | Interrupt darf nur als eng spezifizierte Vorauflösungsentscheidung funktionieren und keine Replacement-Semantik tragen. |
| V120-MUST-010 | Jede Event-Modification-Entscheidung wird als LegalAction angeboten. |
| V120-MUST-011 | `applyAction` revalidiert Side, actionId, StateVersion, Timingfenster, Kosten, Ziele, Choices und Event-ID. |
| V120-MUST-012 | Jede modifizierbare Entscheidung bietet eine legale Pass-/No-op-Option, sofern das Fenster optional ist. |
| V120-MUST-013 | Mehrere Kandidaten sind in V1.2.0 nur erlaubt, wenn ihre Reihenfolge deterministisch und konfliktfrei ist; sonst blockiert die Engine sichtbar. |
| V120-MUST-014 | Damage Prevention ist der bevorzugte Pilotfall. |
| V120-MUST-015 | Damage Prevention läuft vor RandomDrawRecords und vor dem tatsächlichen Trash aus Grip/Hand. |
| V120-MUST-016 | Avoid für Tag oder Run ist nur Alternativpilot, wenn Damage Prevention blockiert ist; Tag-Avoid ist gegenüber Run-Avoid zu bevorzugen. |
| V120-MUST-017 | Keine Runtime-Karte wird durch V1.2.0 promoted. |
| V120-MUST-018 | Keine KI-Deckliste wird durch V1.2.0 erweitert. |
| V120-MUST-019 | EventLog enthält Would-, Choice-, Pass-/Apply- und Resolve-/Prevent-/Avoid-/Interrupt-Ergebnis so, dass Replay daraus deterministisch rekonstruierbar ist. |
| V120-MUST-020 | StateHash unterscheidet modifizierte und nicht modifizierte Eventpfade stabil. |
| V120-MUST-021 | PlayerViews zeigen nur berechtigten Seiten private Kandidaten und Choices. |
| V120-MUST-022 | PublicEvents leaken keine verborgenen Karten, nicht sichtbaren Kandidaten, private Kostenoptionen oder gegnerischen Entscheidungsgrundlagen. |
| V120-MUST-023 | WebSocket-Payloads und Reconnect-Payloads werden ausschließlich aus side-sicheren PlayerViews und Eventprojektionen abgeleitet. |
| V120-MUST-024 | Undo ist vor und nach Event-Modification-Fenstern definiert; Hidden-Info-Barrieren blockieren Undo über den Informationsgewinn hinweg. |
| V120-MUST-025 | KI-Inputs enthalten keine gegnerischen privaten Event-Modification-Kandidaten. |
| V120-MUST-026 | KI wählt Event Modification nur aus LegalActions und hat einen legalen Pass-/No-op-Fallback. |
| V120-MUST-027 | `AiDecisionDebug` für neue Fenster enthält Choice-Kind, gewählte Modifikation oder Pass, Confidence, Fallback-Grund, Seed und Redaction-Hinweis. |
| V120-MUST-028 | Multiplayer-Submit, Idempotency, stale StateVersion und Reconnect während PendingChoice-Fenstern sind getestet. |
| V120-MUST-029 | Web UI rendert neue PendingChoices generisch und berechnet keine eigenen Event-Modification-Kandidaten. |
| V120-MUST-030 | No-Scope-Regression bestätigt: keine Replacement Effects, keine Special Zones, keine Control-/Ownership-Arbeit, keine neuen Karten, keine offiziellen Assets, keine öffentlichen Plattformfeatures. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V120-SHOULD-001 | EventLog-Namen sind lesbar genug für Review und Debug, aber redigiert genug für PublicEvents. |
| V120-SHOULD-002 | Die Spezifikation erlaubt spätere Replacement-Anbindung ohne V1.2.0-Pipeline umzuschreiben. |
| V120-SHOULD-003 | Performancebudget für `getLegalActions` mit Event-Modification-Fenster wird im Implementation Review gemessen oder begründet. |
| V120-SHOULD-004 | Der Pilot nutzt möglichst vorhandene Damage-/Tag-/Run-Testhilfen, ohne Kartenstatus zu verändern. |

## Event-Objekt-Sollschema

```ts
type ImminentEvent = {
  eventId: string
  eventType: string
  source: {
    kind: "card" | "basic_action" | "game_rule" | "test_harness"
    instanceId?: string
    definitionId?: string
  }
  controller: "corp" | "runner" | "system"
  affectedSide?: "corp" | "runner"
  payload: Record<string, unknown>
  visibility: "public" | "owner_private" | "side_private" | "hidden_info_barrier" | "replay_only"
  createdAtStateVersion: number
  modificationWindowId?: string
}
```

## Server-/Web-/KI-Verträge

| Bereich | Vertrag |
| --- | --- |
| Engine | Alle Kandidaten und Outcomes entstehen engine-seitig. |
| Server | Submit bleibt normaler `PlayerAction`; keine Sonderroute für Modifikationen. |
| Web | Rendert PendingChoice und sichtbare Eventdaten; keine Regelberechnung. |
| KI | Wählt LegalAction oder Pass; keine FullState- oder privaten Gegnerdaten. |
| Replay | Replays nutzen EventLog und deterministische Choices, nicht Live-Resolver-Zufall. |

## Gate

`ready_for_implementation: true`
