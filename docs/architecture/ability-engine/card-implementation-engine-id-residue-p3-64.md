# P3.64 CardImplementation Engine-ID-Residue

Stand: 2026-05-22

## Ergebnis

P3.64 hat direkte ONR-v1-Karten-ID-Reste in den generischen Engine-Pipelines geprüft. Sicher redundante Legacy-Fallbacks wurden entfernt, wenn die aktuelle CardImplementation-Registry denselben Pfad über typed `scoredAgenda`, `modifiers`, `successfulRunFollowups`, `fortRunWindows` oder `uniqueDirectLongtail` abdeckt.

Nach Cleanup bleiben direkte ONR-v1-ID-Vorkommen in den geprüften Bereichen:

| Bereich | Anzahl | Einordnung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 77 | Runtime-Regellogik, Kompatibilitäts-Payloads, Legacy-Harness-Pfade |
| `packages/engine/src/mechanics/*` | 127 | kartenspezifische Mechanik-Kataloge und Export-Konstanten |
| `packages/engine/src/ability-engine/*` | 1 | `ActiveModifier`-Kompatibilität für alten RunState |
| `packages/engine/src/public-context.ts` | 0 | keine direkten ONR-v1-ID-Reste |

## Verbleibende Restklassen

| Datei / Gruppe | Grund | Risiko | Empfehlung |
| --- | --- | --- | --- |
| `index.ts` Top-Level-Konstanten für Runner-Programme, Ressourcen, Viren, Recurring Credits und einzelne Actions | Echte Runtime-Pfade speichern oder vergleichen aktuell noch konkrete Quellen, etwa für Run-, Virus-, Counter-, Hidden-Zone- und Payment-Verhalten. | Mittel: weitere Entfernung ohne gezielte Capability kann Kosten, Choices oder Revalidation ändern. | In kleinen Folgepaketen pro Mechanikfamilie durch vorhandene typed Capabilities ersetzen. |
| `index.ts` Payload-/Choice-Kompatibilitätswerte wie `sourceDefinitionId`, `specialZoneReason`, `encounterTaxSource` und P3.58-Choice-Validierung | Öffentliche Chronik-/Payload-Felder und offene Choice-Resolver referenzieren konkrete Quellen. | Mittel: Entfernen kann Replays, alte pending Choices oder Payload-Erwartungen ändern. | Erst nach eigenem PublicPayload-/Replay-Kompatibilitätsgate modernisieren. |
| `index.ts` Legacy-Harness- und Sonderfallpfade mit `!cardImplementationForDefinitionId(...)` | Einige Nicht-ONR- oder ältere Harness-Pfade sind noch an frühere Mechaniklisten gekoppelt. | Niedrig bis mittel: pauschale Entfernung kann Testkarten oder historische Harness-Szenarien brechen. | Separat nach Karte/Familie prüfen; nicht als P3.64-Massenbereinigung. |
| `mechanics/*` Export-Konstanten und Sets | Diese Dateien sind noch kartenspezifische Mechanik-Kataloge, die von `index.ts`, PlayerView-Projektion und Tests genutzt werden. | Mittel: Entfernen braucht meist Ersatz in Capability-/Modifier-Queries. | Pro Mechanikfamilie migrieren; keine allgemeine Registry in P3.64. |
| `ability-engine/active-modifiers.ts` `onr_v1_277_virizz` | `GameState.run.breakSubroutineAdditionalCost` speichert nur den Betrag, nicht die Quelleninstanz. Der öffentliche ActiveModifier-Snapshot braucht den bisherigen Virizz-Source-Identifier. | Niedrig: kompatibler Anzeige-/Debug-Snapshot; kein Gameplay-Math. | Später RunState-Quelle typisieren, dann den Hardcode entfernen. |
| `public-context.ts` | Keine direkten ONR-v1-IDs gefunden. Legacy-Payload-Feldnamen bleiben erhalten, enthalten aber keine Karten-ID-Branch-Logik. | Niedrig. | Frei halten; nur bei PublicPayload-Vertragsarbeit anfassen. |

## Entfernte Fallbacks

Entfernt wurden ONR-v1-Fallbacks, die nach P3.63 durch CardImplementation-Daten redundant sind:

- Corporate Ally Agenda-Punkt-Installkosten und Agenda-Difficulty-Fallback.
- Bioweapons Engineering Meat-Damage-Fallback.
- AI Chief Financial Officer und Corporate Downsizing alte Scored-Agenda-Fallbacks.
- Project Babylon, Corporate Retreat, Corporate War, Data Fort Reclamation, Hostile Takeover, Ice Transmutation, Priority Requisition, Encryption Breakthrough, Security Net Optimization und Security Purge Score-Fallbacks.
- I Got a Rock, Schlaghund, Databroker, Smith's Pawnshop, Bodyweight Data Creche sowie mehrere FortRunWindow-Fallbacks.

## Stabilitätsnotiz

CardImplementation-Coverage und Registry wurden nicht geändert. PublicPayload-, PlayerView- und PublicEvent-Shapes wurden nicht erweitert oder entfernt; die Änderungen ersetzen nur tote oder redundante ID-Branches durch bereits vorhandene typed CardImplementation-Abfragen.
