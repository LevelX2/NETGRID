# Docs Derived Backend 0.5 Linkaudit und Move-Plan

Status: implemented-move
Stand: 2026-05-18
Scope: nur `BACKEND_0_5_*`

## Entscheidung

Die Backend-0.5-Artefakte wurden nach der Zielstrukturentscheidung vom 2026-05-18 ohne Redirect-Stubs nach `docs/releases/backend-ops/backend-0-5/` bewegt. Diese Datei bleibt als Linkaudit- und Move-Nachweis erhalten.

Begründung:

- `docs/releases/` ist durch `docs/derived/DOCS_STRUCTURE_TARGET_DECISION_2026_05_18.md` als Zielbereich akzeptiert.
- Backend 0.5 ist klein, abgeschlossen und fachlich von Karten-/Mechanikreleases getrennt.
- Die harten Pfadlinks sind überschaubar und wurden auf die neuen Zielpfade migriert.
- Variante A aus der Stub-Strategie wurde gewählt: vollständige Linkmigration ohne Redirect-Stubs.

Kanonischer Einstieg ist jetzt `docs/releases/backend-ops/backend-0-5/README.md`.

## Geprüfter Suchlauf

Ausgeführt:

```powershell
rg -n "BACKEND_0_5_|Backend 0\.5|Private Storage Maintenance" .
```

Der Suchlauf wurde bewusst breit ausgeführt, damit Pfadlinks, Textreferenzen und Runtime-Verwendungen sichtbar werden.

## Linkbruchrisiken

### Harte Pfadlinks

Diese Stellen waren vor dem Move als Linkbruchrisiken relevant und wurden in der Linkmigration berücksichtigt:

| Datei | Referenztyp | Risiko |
| --- | --- | --- |
| `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` | direkte Links auf Plan, Requirements, Testmatrix, Implementation Review und Final Review | Hoch, weil die Wissensbasis als Einstieg und Statusanker dient. |
| `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md` | direkte Links auf Requirements, Testmatrix, Implementation Review und Final Review | Mittel, weil Loghistorie zwar archiviert ist, aber Abschlussnachweise dort bewusst verlinkt sind. |
| `docs/releases/backend-ops/backend-0-5/requirements.md` | direkte Quelle auf `plan.md` | Mittel, weil die Requirements ihren Ursprung referenzieren. |
| `docs/releases/backend-ops/backend-0-5/plan.md` | Handoff nennt `requirements.md` und `test-matrix.md` | Niedrig bis mittel, aber bei einem Move trotzdem zu aktualisieren oder über Stubs abzusichern. |
| `docs/releases/backend-ops/backend-0-5/README.md` | direkte Links auf alle Backend-0.5-Artefakte | Hoch für das neue Rollup, weil es die führende Gruppierungsseite ist. |
| `docs/activities/done/act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan.md` | direkte Links auf alle Backend-0.5-Artefakte | Niedrig, nach Abschluss nur Activity-Audit. |
| `docs/activities/done/act-2026-05-17-docs-derived-release-rollups.md` | direkte Ergebnisreferenz auf das Rollup und Backend-0.5-Muster | Niedrig, aber bei späterer Retention oder Move sauber zu halten. |

### Textreferenzen ohne Pfadbruch

Diese Stellen enthalten `Backend 0.5`, aber keinen Dateipfad auf die Releaseartefakte:

| Bereich | Beispiele | Move-Risiko |
| --- | --- | --- |
| Runtime-Code | `apps/server/src/storage-sqlite.ts`, `apps/web/app/maintenance.ts` | Kein Pfadbruch; Versions-/Labeltexte bleiben unverändert. |
| Tests | `apps/server/src/multiplayer.test.ts`, `apps/web/app/maintenance.test.ts` | Kein Pfadbruch; Testnamen und Assertions bleiben unverändert. |
| UI | `apps/web/app/maintenance/page.tsx` | Kein Pfadbruch; sichtbare Backend-Ops-Version bleibt fachlicher Text. |
| Status/Planung | `docs/codex/CODEX_STATUS.md`, `docs/releases/v2/v2-7-observability/observability-redaction-baseline.md`, abgeschlossene Activities | Kein direkter Pfadbruch, aber bei späterer Move-Kommunikation als Kontext zu beachten. |

## Zielstruktur

```text
docs/releases/backend-ops/backend-0-5/
  README.md
  final-review.md
  implementation-review.md
  requirements.md
  test-matrix.md
  plan.md
```

Mapping:

| Alter Pfad | Neuer Zielpfad |
| --- | --- |
| `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md` | `docs/releases/backend-ops/backend-0-5/README.md` |
| `docs/derived/BACKEND_0_5_FINAL_REVIEW.md` | `docs/releases/backend-ops/backend-0-5/final-review.md` |
| `docs/derived/BACKEND_0_5_IMPLEMENTATION_REVIEW.md` | `docs/releases/backend-ops/backend-0-5/implementation-review.md` |
| `docs/derived/BACKEND_0_5_REQUIREMENTS.md` | `docs/releases/backend-ops/backend-0-5/requirements.md` |
| `docs/derived/BACKEND_0_5_TEST_MATRIX.md` | `docs/releases/backend-ops/backend-0-5/test-matrix.md` |
| `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` | `docs/releases/backend-ops/backend-0-5/plan.md` |

## Stub-Entscheidung

Gewählt wurde Variante A: keine Stubs, vollständige Linkmigration.

- Alle harten Pfadlinks wurden auf Zielpfade aktualisiert.
- `rg -n "BACKEND_0_5_" .` darf danach nur noch historische Activity-/Log-/Audit-Nennungen oder bewusst erhaltene technische Marker zeigen.
- Vorteil: keine doppelten Dokumente.
- Nachteil: ältere externe Notizen auf alte Pfade würden ins Leere laufen.

## Ergebnis

Die Move-Kriterien sind erfüllt:

- Linkbruchrisiken sind nach harten Pfadlinks und unkritischen Textreferenzen getrennt.
- Move-/Stub-Entscheidung ist dokumentiert: vollständige Linkmigration ohne Stubs.
- Final Review, Implementation Review, Requirements, Testmatrix und Plan bleiben erhalten.
- Kein V1.0-, V1.9-, S01- oder V2-Artefakt wurde in diesem Paket bewegt.
- Backend 0.5 ist der erste echte Pilot für `docs/releases/`.
