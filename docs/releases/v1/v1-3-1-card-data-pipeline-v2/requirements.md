# V1.3.1 Requirements - Card Data Pipeline v2

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.3.1 führt eine reproduzierbare Card-Data-Pipeline v2 ein. Sie macht Kartendaten, Provenienz, Statusübergänge und AI-Hints reviewbar, ohne Spielbarkeit, KI-Freigabe, Mechaniken oder Assets automatisch zu aktivieren.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V131-MUST-001 | V1.3.1 startet erst nach grünem V1.3.0-Final-Gate. |
| V131-MUST-002 | Es gibt eine versionierte Source Registry v2 mit Quelle, Provenienz, Scope, Nutzungsentscheidung und Review-Status. |
| V131-MUST-003 | Kartendaten werden in einem deterministischen Pipeline-Snapshot mit stabilem Hash normalisiert. |
| V131-MUST-004 | Der Pipeline-Snapshot ist eine versionierte Datei; das Spiel darf keine externe Kartendatenbank zur Laufzeit brauchen. |
| V131-MUST-005 | Importstatus, Katalogstatus, Engine-Support, `human_playable`, `deck_legal`, `format_legal` und `ai_supported` bleiben getrennte Status. |
| V131-MUST-006 | Import, Text, Bild, ResolverRef oder AI-Hint erzeugen keine automatische Spielbarkeit. |
| V131-MUST-007 | `requiredMechanics` ist für jede freigaberelevante Karte reviewpflichtig. |
| V131-MUST-008 | `resolverRef` und `abilityRefs` sind für Engine- oder Spielbarkeitsstatus reviewpflichtig. |
| V131-MUST-009 | Karten ohne passende Mechanik-Coverage bleiben nicht `human_playable` oder `deck_legal`. |
| V131-MUST-010 | Karten ohne Resolver-/Ability-Vertrag bleiben nicht `engine_supported`. |
| V131-MUST-011 | Karten ohne AI-Hints und KI-Szenarien bleiben nicht `ai_supported`. |
| V131-MUST-012 | AI-Hints v2 sind eigene validierte Daten und setzen `ai_supported` nicht selbst. |
| V131-MUST-013 | AI-Hints prüfen Side, Kartentyp, Rollen, requiredMechanics und Wertebereiche. |
| V131-MUST-014 | Import-Diff zeigt Text-, Numeric-, Status-, Mechanik-, Resolver-, Asset- und Hint-Änderungen. |
| V131-MUST-015 | Rollback auf einen vorherigen Datenstand ist geplant und testbar, ohne laufende Match-Snapshots umzuschreiben. |
| V131-MUST-016 | Statusreports nennen blockierte Karten, fehlende Mechaniken, fehlende Resolver, fehlende Tests und fehlende AI-Hints. |
| V131-MUST-017 | Errata- oder Textänderungen erzeugen keine stille Engine-Regeländerung. |
| V131-MUST-018 | Katalog/API/Reports dürfen keine Tokens, lokalen privaten Pfade, gegnerischen Decklisten oder Hidden-Info-Daten enthalten. |
| V131-MUST-019 | Private lokale Assetpfade bleiben getrennt von Engine, KI, Replay, StateHash und Matchstart. |
| V131-MUST-020 | Bestehende V1.3.0-Deckvalidierung und Matchstart-Revalidierung bleiben grün. |
| V131-MUST-021 | Tests decken deterministische Snapshots, Hash-Stabilität, Diff, Rollback, Statusketten, AI-Hints und Redaction ab. |
| V131-MUST-022 | No-Scope-Regression bestätigt: kein Kartentextparser, keine neuen Kartenfreigaben, keine neue Mechanik, keine öffentliche Plattformfunktion, keine offiziellen Assets. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V131-SHOULD-001 | Pipeline-Reports sollten maschinenlesbar und als Markdown zusammenfassbar sein. |
| V131-SHOULD-002 | AI-Hints sollten Planrollen für V1.4.0/V1.4.1 vorbereiten. |
| V131-SHOULD-003 | Diff-Ausgaben sollten nach Release-Relevanz gruppieren: sicher, reviewpflichtig, blockierend. |
| V131-SHOULD-004 | Alte V0.9-Card-Role-Daten sollten in Hints v2 überführbar bleiben. |

## Gate

`ready_for_implementation_after_V1_3_0: true`

V1.3.1 ist nach erfolgreichem V1.3.0-Gate implementierbar.
