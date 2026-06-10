# AI-SEM-3 TargetProfile Gap Report

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI-SEM-3`
Branch: `codex/ai-source-followup-review-fixes`

## Ziel

TargetProfile-Informationen sollen nach der ActionSemanticCandidate-Erweiterung sichtbar bleiben, ohne dadurch LegalAction-Ziele, produktive Auswahl oder Hidden-Info-Ableitungen zu erzeugen.

## Aktueller Stand

- `ActionTargetContext` enthält `targetProfileMatches` und `targetConstraintResults`.
- `applyTargetContextProjection` erzeugt TargetContext nur aus:
  - `selectedTargetsByActionId`,
  - `availableTargetsByActionId`,
  - side-sicheren `LegalAction.targetRequirements` oder `choiceRequirements`.
- `applyCardSemanticJoin` hängt `TargetProfileMatch` nur an einen bereits vorhandenen `targetContext` an.
- Hidden-Info-Ziele mit `visibility: "engine_only"` blockieren die Projektion über `hidden_info_blocked`.
- Die Action-to-Goal-Schicht bleibt diagnostisch: `buildActionToGoalDiagnosticMappingReport` setzt `productiveUseAllowed: false`, erzeugt keine Rankings und keine `selectedActionId`.

## Geschlossene Lücke in SEM-3

Ein neuer fokussierter Guard in `packages/ai/src/action-semantic-candidate.test.ts` sichert, dass TargetProfile-Matches aus CardSemanticProfiles ohne LegalAction-Target-Evidence keinen `targetContext` materialisieren.

Damit gilt:

- TargetProfile-Matches beschreiben nur bereits legal sichtbare Ziele.
- TargetProfile-Matches ersetzen keine Engine-Zielliste.
- TargetProfile-Matches erzeugen keine verfügbaren Targets.
- TargetProfile-Matches heben `target_context_unavailable` nicht auf.

## Verbleibende fachliche Gaps

Diese Punkte bleiben bewusst nicht produktiv aktiviert:

- Keine eigenständige TargetProfile-Taxonomie mit vollständigen Karten-/Server-/Subroutine-Profilen.
- Keine Constraint-Auswertung für `targetConstraintResults` außerhalb der Diagnoseform.
- Keine automatische Ableitung von Zielwert, Zielpriorität oder Legalität aus TargetProfile-Matches.
- Keine Nutzung von TargetProfile-Matches als Runtime-Scoring-Signal.
- Keine Übernahme von Hidden-Info- oder Engine-only-Zielinformationen in AI-Input, Debug, PublicEvents oder Simulationstraces.

## Gap-Kategorien

| Kategorie | Bedeutung | Aktueller Umgang |
| --- | --- | --- |
| `target_not_needed` | Die LegalAction braucht keinen Zielkontext, z. B. zentrale BasicActions ohne Zielauswahl. | `target_context`-Gate bleibt `not_applicable`; kein TargetContext wird erzeugt. |
| `static_constraint_only` | Semantik beschreibt nur eine Bedingung oder Einschränkung, aber kein konkretes Ziel. | Bleibt in `constraints` oder `targetProfileMatches` diagnostisch; erzeugt keine Zieloption. |
| `required_but_no_profile` | Die LegalAction hat side-safe Zielanforderungen, aber kein TargetProfile. | TargetContext kann aus LegalAction-Zielen entstehen; Profile fehlen nur als Diagnosegaps. |
| `profile_exists_no_legal_options` | CardSemanticProfile nennt TargetProfiles, aber LegalAction liefert kein Ziel. | SEM-3-Guard hält `targetContext` leer und kopiert den Profil-Match nicht in den Candidate. |
| `hidden_info_blocked` | Zielinformationen wären Engine-only oder hidden-info-sensitiv. | Projektion wird blockiert, `hidden_info_blocked` bleibt als Issue sichtbar und ohne Ziel-ID-Leak. |

## Nächster sinnvoller Schritt

Wenn TargetProfile später produktiver werden soll, braucht es vorher ein eigenes Gate:

1. Taxonomie-Datei für side-safe TargetProfiles.
2. Engine-nahe Tests, dass LegalActions weiterhin alleinige Ziel- und Legalitätsquelle bleiben.
3. AI-seitige Tests, dass TargetProfile nur Scores auf bereits legalen Actions beeinflusst.
4. Hidden-Info-Redaction- und deterministic replay checks.

Ohne dieses Gate bleiben TargetProfile-Matches diagnostische Evidence.

## Verification

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-doctrine-goal-diagnostics.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai typecheck`: siehe Paketabschluss.
- `git diff --check`: siehe Paketabschluss.
