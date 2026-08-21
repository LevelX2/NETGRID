# Engine-Architektur

Stand: 2026-08-12

Dieser Ordner enthält nur die aktuell relevanten Architektur- und Strukturverträge der NETGRID Rules Engine. Abgeschlossene Extraktions-, Migrations-, Audit- und Remediation-Prozesse werden nicht als zweite Architekturhistorie konserviert; ihre Historie liegt in Git.

## Führende Architektur

1. `../central-card-specification-and-registry-target-state-2026-08-09.md`
   - kanonische CardSpec-Architektur und Trennung von Public-, Engine-, Planning- und Editor-Sichten
2. `card-registry-architecture.md`
   - aktuelle Engine-Registry- und Coverage-Grenze auf Basis der CardSpec-Projektionen
3. `ability-contract-structure.md`
   - deklarative Ability-, Effect-, Modifier- und Domain-Vertragsfamilien
4. `runtime-port-architecture.md`
   - statisch typisierte Engine-Runtime-Komposition und Portgrenzen
5. `turn-runtime-architecture.md`
   - Turn-Zustandsmaschinen und deren Modulgrenzen
6. `run-runtime-architecture.md`
   - Run-, Window-, Successful-Run- und Cleanup-Grenzen
7. `access-runtime-architecture.md`
   - Breach-, Access-, Hidden-Info- und Access-Effect-Grenzen
8. `damage-runtime-architecture.md`
   - Damage-, Replacement- und Prevention-Grenzen
9. `public-event-payload-architecture.md`
   - öffentlicher Event-/Payloadvertrag und `ResolvedGameEffect`
10. `engine-source-structure-guard.md`
   - ausführbar geschützte Source-, Layer- und Kompositionsgrenzen

`packages/engine/AGENTS.md` enthält die übergeordneten Engine-Invarianten. Der Code und die ausführbaren Struktur-/Typ-/Regressionstests bleiben die letzte Wahrheit über den tatsächlich produktiven Stand.

## Verbindliche Grundsätze

- Die Rules Engine ist die einzige Regelautorität.
- `LegalActions` werden bei `applyAction` vollständig revalidiert.
- Hidden-Info-Grenzen gelten für Views, Events, Payloads, Replay und Fehlerpfade.
- Replay, StateHash und Zufall bleiben deterministisch.
- Kartenspezifische Autorenwahrheit liegt in der CardSpec; Engine-Verträge interpretieren deren mechanische Projektion generisch.
- Fehlende oder mehrdeutige Bindungen scheitern fail-closed statt durch Legacy-Fallbacks kaschiert zu werden.

## Pflegeprinzip

Neue Dokumente gehören nur dauerhaft in diesen Ordner, wenn sie einen aktuellen Engine-Architektur- oder Strukturvertrag beschreiben, der nicht sinnvoll in eines der bestehenden Dokumente integriert werden kann.

Abgeschlossene Prozesspläne, Paketfortschritte, Statusaudits, Kartenfixes und Implementierungsreviews werden nach Abschluss und Referenzprüfung gelöscht. Git-Historie ersetzt diese Ausführungschronik.
