# V1.1.3 Mechanics-AI-Card Baseline Requirements

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.1.3 normalisiert Projektstand, Mechanik-Coverage, Kartenstatus und KI-Verträge nach V1.1.2K. Der Release ist abgeschlossen, wenn die Planungsgrundlage vorhanden, konsistent und gegen Scope Creep gesichert ist.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V113-MUST-001 | V1.1.3 dokumentiert ausdrücklich, dass keine Engine-, Server-, Web-, KI- oder Test-Codeänderung Teil des Releases ist. |
| V113-MUST-002 | V1.1.2 und V1.1.2K bleiben abgeschlossen; V1.1.3 verändert keine dortige Gate-Entscheidung. |
| V113-MUST-003 | Die Mechanik-Coverage nach V1.1.2K ist in einem aktuellen Dokument mit Setup, Mulligan, Discard, Handlimit, Core Damage und Full Archives Access normalisiert. |
| V113-MUST-004 | Prevention, Avoid und Interrupts werden als V1.2.0-Scope markiert. |
| V113-MUST-005 | Replacement Effects werden als V1.2.1-Scope markiert und nicht mit V1.2.0 vermischt. |
| V113-MUST-006 | Special Zones, Remove from Game, Set Aside, Ownership und Control bleiben außerhalb der nächsten drei Releases. |
| V113-MUST-007 | Das Kartenstatusmodell `listed`, `engine_supported`, `human_playable`, `ai_supported` ist verbindlich definiert. |
| V113-MUST-008 | `deck_legal` setzt künftig `human_playable` voraus. |
| V113-MUST-009 | `ai_supported` setzt `human_playable`, AI-Hints, KI-Szenario und sichere DecisionDebug-Abdeckung voraus. |
| V113-MUST-010 | Die 52 vorhandenen O:NR-v1-Runtime-Karten sind auf das Statusmodell gemappt. |
| V113-MUST-011 | V1.1.3 gibt keine weitere Karte als `engine_supported`, `human_playable`, `deck_legal` oder `ai_supported` frei. |
| V113-MUST-012 | Vorhandene KI-Smokes werden als LegalAction-/PlayerView-Sicherheitsbeleg eingeordnet, nicht als strategische `ai_supported`-Freigabe. |
| V113-MUST-013 | AI-Level 0 bis 6 sind gegen den aktuellen Stand auditiert. |
| V113-MUST-014 | AI-Level 0 und 1 bleiben als enge Sicherheits-/Basis-KI eingeordnet; sie dürfen nicht als starke KI beworben werden. |
| V113-MUST-015 | AI-Level 2 wird nur als teilweise erfüllt für bestehende Demo-/V0.9-Baselines dokumentiert. |
| V113-MUST-016 | AI-Level 3 bis 6 bleiben offen und werden auf spätere V1.4.x+-Gates verschoben. |
| V113-MUST-017 | Ein AI-Hints-Sollvertrag ist mit Rollen, Mechaniken, Fenstern, Risiken, Fallback und Szenarioreferenzen beschrieben. |
| V113-MUST-018 | Ein `AiDecisionDebug`-Sollvertrag ist mit AI-Level, Baselines, Scores, Confidence, Risk Summary, Fallback, Zeitbudget, Seed und Redaction beschrieben. |
| V113-MUST-019 | V1.2.x wird vor weiteren K-Kartenreleases priorisiert. |
| V113-MUST-020 | Hidden-Info-, Replay-, StateHash-, LegalActions/applyAction-, PlayerView-, WebSocket-, Reconnect-, Undo- und KI-Input-Gates bleiben für V1.2.0 und V1.2.1 harte Gates. |
| V113-MUST-021 | Öffentliche Plattformfunktionen, Accounts, Matchmaking, Rankings, Turniere, offizielle Assets und externe Kartendatenbank-Abhängigkeiten bleiben ausgeschlossen. |
| V113-MUST-022 | `CODEX_STATUS.md` und die Wissensbasis benennen den neuen Planungsstand kompakt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V113-SHOULD-001 | Der Plan trennt `ai_smoke_covered` als technische Sicherheitsnotiz von `ai_supported` als Produkt-/Deckstatus. |
| V113-SHOULD-002 | Mechanik-IDs werden für V1.2.0 und V1.2.1 feiner als bisher aufgespalten. |
| V113-SHOULD-003 | Der Umsetzungshandoff enthält einen kopierbaren Folgeprompt. |
| V113-SHOULD-004 | Bekannte historische Lücken wie fehlende V1.0.5-Finalartefakte werden nicht zum Blocker für V1.2.x gemacht. |

## Sollverträge

### Card-Support-Record

Ein künftiger Card-Support-Record soll mindestens enthalten:

```ts
type CardSupportRecord = {
  cardCode: string
  title: string
  sourceRelease: string
  listed: boolean
  engineSupported: boolean
  humanPlayable: boolean
  deckLegalProfiles: string[]
  aiSupported: boolean
  aiSmokeCovered: boolean
  requiredMechanics: string[]
  resolverRef?: string
  aiHintsRef?: string
  scenarioRefs: string[]
  blockedReason?: string
}
```

### Mechanic-Support-Record

Ein künftiger Mechanic-Support-Record soll mindestens enthalten:

```ts
type MechanicSupportRecord = {
  mechanicId: string
  status: "implemented" | "implemented_limited" | "specified_not_implemented" | "open" | "blocked" | "out_of_scope"
  supportedWindows: string[]
  humanPlayableSince?: string
  aiSupportedSince?: string
  hiddenInfoRisk: "none" | "low" | "medium" | "high" | "very_high"
  replayStateHashGate: boolean
  notes: string
}
```

## No-Scope-Vertrag

V1.1.3 darf nicht versehentlich:

- zusätzliche O:NR-v1-Karten freigeben,
- KI-Deckpools erweitern,
- Replacement als V1.2.0-Bestandteil planen,
- Spezialzonen in V1.2.0 oder V1.2.1 ziehen,
- öffentliche Plattformfeatures vorbereiten,
- Assets oder externe Kartendatenquellen an Runtime, Engine, Replay, StateHash oder KI koppeln.

## Gate

V1.1.3 ist ein Planungsabschluss.

`ready_for_implementation: false`

V1.2.0 und V1.2.1 haben eigene Reviews mit `ready_for_implementation`.
