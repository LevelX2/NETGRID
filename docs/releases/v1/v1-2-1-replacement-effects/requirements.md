# V1.2.1 Requirements - Replacement Effects

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.2.1 implementiert Replacement Effects als getrennte Pipeline nach V1.2.0. Ein Replacement ersetzt ein Originalevent durch ein Replacementevent; es verhindert oder vermeidet das Originalevent nicht nur.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V121-MUST-001 | V1.2.1 startet erst nach grünem V1.2.0-Gate. |
| V121-MUST-002 | Replacement ist als eigener Mechaniktyp getrennt von Prevention, Avoid und Interrupt modelliert. |
| V121-MUST-003 | Jedes Replacement bezieht sich auf ein kanonisches Originalevent. |
| V121-MUST-004 | Ein angewandtes Replacement erzeugt ein kanonisches Replacementevent. |
| V121-MUST-005 | Originalevent und Replacementevent sind im EventLog gemeinsam nachvollziehbar. |
| V121-MUST-006 | Das Originalevent wird nach erfolgreichem Replacement nicht zusätzlich final angewandt. |
| V121-MUST-007 | Einmal-pro-Fenster-Regeln verhindern, dass derselbe Replacement-Kandidat im selben ReplacementWindow mehrfach greift. |
| V121-MUST-008 | Replacement-Kandidaten haben deterministische Reihenfolge. |
| V121-MUST-009 | Mehrdeutige, gleichrangige oder widersprüchliche Replacement-Konflikte blockieren sichtbar statt still entschieden zu werden. |
| V121-MUST-010 | Candidate Collection ist auf explizit freigegebene Replacementtypen beschränkt. |
| V121-MUST-011 | Damage Replacement ist der bevorzugte test-only Pilot, sofern V1.2.0-Damage-Pilot grün ist. |
| V121-MUST-012 | Access-, Trash- und Steal-Replacement werden geprüft, aber nicht automatisch implementiert oder freigegeben. |
| V121-MUST-013 | Replacement-Choice wird als LegalAction angeboten. |
| V121-MUST-014 | `applyAction` revalidiert Side, actionId, StateVersion, Window-ID, Originalevent-ID, Candidate-ID, Kosten, Ziele und Choices. |
| V121-MUST-015 | Pass-/No-op ist für optionale Replacement-Fenster legal. |
| V121-MUST-016 | Replay rekonstruiert Originalevent, Replacement-Entscheidung, Replacementevent und Endzustand deterministisch. |
| V121-MUST-017 | StateHash unterscheidet ersetzte und nicht ersetzte Pfade stabil. |
| V121-MUST-018 | PlayerViews zeigen Replacement-Kandidaten nur berechtigten Seiten und nur nach Sichtbarkeitsvertrag. |
| V121-MUST-019 | PublicEvents leaken keine verborgenen Replacement-Quellen, Kandidaten oder Hidden-Info-Payloads. |
| V121-MUST-020 | WebSocket- und Reconnect-Payloads werden aus side-sicheren PlayerViews abgeleitet. |
| V121-MUST-021 | Undo ist für Replacement-Fenster, Pass, Apply und Hidden-Info-Barrieren definiert. |
| V121-MUST-022 | KI-Inputs enthalten keine privaten gegnerischen Replacement-Kandidaten. |
| V121-MUST-023 | KI darf Replacement nur aus LegalActions wählen. |
| V121-MUST-024 | KI-Strategie für Replacement ist nur erlaubt, wenn die konkrete Replacement-Mechanik und die Karte `ai_supported` sind. |
| V121-MUST-025 | Ohne AI-Hints muss KI ein Replacement-Fenster legal passen oder über Fallback bedienen. |
| V121-MUST-026 | `AiDecisionDebug` nennt Originalevent, Replacementwahl, Scores, Confidence, Fallback und Seed nur side-sicher. |
| V121-MUST-027 | Keine neue Runtime-Karte wird durch V1.2.1 promoted. |
| V121-MUST-028 | Keine KI-Deckliste wird durch V1.2.1 erweitert. |
| V121-MUST-029 | MechanicSupport wird granular vorbereitet, z. B. `replacement.damage`, `replacement.access`, `replacement.trash`, `replacement.steal`. |
| V121-MUST-030 | No-Scope-Regression bestätigt: keine Prevention/Avoid-Ausweitung, keine Special Zones, keine Control-/Ownership-Arbeit, keine neuen Karten, keine offiziellen Assets, keine öffentlichen Plattformfeatures. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V121-SHOULD-001 | EventLog-Einträge sind für Debug und Review lesbar, aber PublicEvents bleiben redigiert. |
| V121-SHOULD-002 | Conflict-Fehler enthalten für berechtigte Entwicklerdiagnose ausreichend Kontext, ohne Hidden Info in Clientfehler zu leaken. |
| V121-SHOULD-003 | Replacement-Pipeline ist später auf Access/Trash/Steal erweiterbar, ohne Damage-Pilot neu zu schreiben. |
| V121-SHOULD-004 | Implementation Review begründet, warum nicht gewählte Pilotfamilien zurückgestellt bleiben. |

## Replacement-Objekt-Sollschema

```ts
type ReplacementWindow = {
  windowId: string
  originalEventId: string
  eventType: string
  candidates: ReplacementCandidate[]
  consumedCandidateIds: string[]
  createdAtStateVersion: number
}

type ReplacementCandidate = {
  candidateId: string
  controller: "corp" | "runner" | "system"
  sourceRef: {
    kind: "card" | "game_rule" | "test_harness"
    instanceId?: string
    definitionId?: string
  }
  replacesEventType: string
  replacementEventType: string
  priority: number
  visibility: "public" | "side_private" | "hidden_info_barrier" | "replay_only"
  optional: boolean
}
```

## Gate

`ready_for_implementation: true`

V1.2.1 ist implementierbar, sobald V1.2.0 umgesetzt und verifiziert ist.
