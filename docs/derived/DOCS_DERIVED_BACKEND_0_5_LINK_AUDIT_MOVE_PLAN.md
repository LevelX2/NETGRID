# Docs Derived Backend 0.5 Linkaudit und Move-Plan

Status: decision-no-move
Stand: 2026-05-17
Scope: nur `BACKEND_0_5_*`

## Entscheidung

Die Backend-0.5-Artefakte werden in diesem Paket nicht bewegt und es werden keine Redirect-Stubs angelegt.

Begründung:

- `BACKEND_0_5_FINAL_REVIEW.md` und `BACKEND_0_5_IMPLEMENTATION_REVIEW.md` sind aktive Audit-Trail-Dateien und bleiben am bestehenden Pfad direkt auffindbar.
- Die aktuelle Linkmenge ist klein genug für einen späteren gezielten Move, aber nicht so störend, dass ein Sofort-Move nötig ist.
- Eine neue `docs/releases/backend-ops/backend-0-5/`-Struktur wäre eine übergreifende Konvention. Sie sollte nicht durch eine einzelne Familie implizit eingeführt werden.
- Ohne breite Konventionsentscheidung wäre ein Stub-Move zusätzlicher Wartungsaufwand: alte Pfade müssten als Redirects erhalten bleiben und neue Pfade zusätzlich gepflegt werden.

Konservativer Plan: Die Root-Dateien unter `docs/derived/` bleiben vorerst kanonisch. `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md` und dieses Audit dokumentieren Verdichtung und spätere Move-Voraussetzungen.

## Geprüfter Suchlauf

Ausgeführt:

```powershell
rg -n "BACKEND_0_5_|Backend 0\.5|Private Storage Maintenance" .
```

Der Suchlauf wurde bewusst breit ausgeführt, damit Pfadlinks, Textreferenzen und Runtime-Verwendungen sichtbar werden.

## Linkbruchrisiken

### Harte Pfadlinks

Diese Stellen würden bei einem Move ohne Linkmigration brechen:

| Datei | Referenztyp | Risiko |
| --- | --- | --- |
| `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` | direkte Links auf Plan, Requirements, Testmatrix, Implementation Review und Final Review | Hoch, weil die Wissensbasis als Einstieg und Statusanker dient. |
| `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md` | direkte Links auf Requirements, Testmatrix, Implementation Review und Final Review | Mittel, weil Loghistorie zwar archiviert ist, aber Abschlussnachweise dort bewusst verlinkt sind. |
| `docs/derived/BACKEND_0_5_REQUIREMENTS.md` | direkte Quelle auf `BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` | Mittel, weil die Requirements ihren Ursprung referenzieren. |
| `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` | Handoff nennt `BACKEND_0_5_REQUIREMENTS.md` und `BACKEND_0_5_TEST_MATRIX.md` | Niedrig bis mittel, aber bei einem Move trotzdem zu aktualisieren oder über Stubs abzusichern. |
| `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md` | direkte Links auf alle Backend-0.5-Artefakte | Hoch für das neue Rollup, weil es die führende Gruppierungsseite ist. |
| `docs/activities/done/act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan.md` | direkte Links auf alle Backend-0.5-Artefakte | Niedrig, nach Abschluss nur Activity-Audit. |
| `docs/activities/done/act-2026-05-17-docs-derived-release-rollups.md` | direkte Ergebnisreferenz auf das Rollup und Backend-0.5-Muster | Niedrig, aber bei späterer Retention oder Move sauber zu halten. |

### Textreferenzen ohne Pfadbruch

Diese Stellen enthalten `Backend 0.5`, aber keinen Dateipfad auf die Releaseartefakte:

| Bereich | Beispiele | Move-Risiko |
| --- | --- | --- |
| Runtime-Code | `apps/server/src/storage-sqlite.ts`, `apps/web/app/maintenance.ts` | Kein Pfadbruch; Versions-/Labeltexte bleiben unverändert. |
| Tests | `apps/server/src/multiplayer.test.ts`, `apps/web/app/maintenance.test.ts` | Kein Pfadbruch; Testnamen und Assertions bleiben unverändert. |
| UI | `apps/web/app/maintenance/page.tsx` | Kein Pfadbruch; sichtbare Backend-Ops-Version bleibt fachlicher Text. |
| Status/Planung | `docs/codex/CODEX_STATUS.md`, `docs/derived/V2_7_OBSERVABILITY_REDACTION_BASELINE.md`, abgeschlossene Activities | Kein direkter Pfadbruch, aber bei späterer Move-Kommunikation als Kontext zu beachten. |

## Zielstruktur bei späterem Move

Falls eine spätere Konventionsentscheidung `docs/releases/` freigibt, wäre die kleinste Backend-0.5-Zielstruktur:

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

| Heute | Späterer Zielpfad |
| --- | --- |
| `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md` | `docs/releases/backend-ops/backend-0-5/README.md` |
| `docs/derived/BACKEND_0_5_FINAL_REVIEW.md` | `docs/releases/backend-ops/backend-0-5/final-review.md` |
| `docs/derived/BACKEND_0_5_IMPLEMENTATION_REVIEW.md` | `docs/releases/backend-ops/backend-0-5/implementation-review.md` |
| `docs/derived/BACKEND_0_5_REQUIREMENTS.md` | `docs/releases/backend-ops/backend-0-5/requirements.md` |
| `docs/derived/BACKEND_0_5_TEST_MATRIX.md` | `docs/releases/backend-ops/backend-0-5/test-matrix.md` |
| `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` | `docs/releases/backend-ops/backend-0-5/plan.md` |

## Stub-Strategie

Wenn die Dateien später wirklich bewegt werden, gibt es zwei sichere Varianten.

Empfohlene Variante A: keine Stubs, vollständige Linkmigration

- Alle harten Pfadlinks werden auf Zielpfade aktualisiert.
- `rg -n "BACKEND_0_5_" .` muss danach nur noch historische Activity-/Log-Nennungen oder bewusst erhaltene technische Marker zeigen.
- Vorteil: keine doppelten Dokumente.
- Nachteil: ältere externe Notizen auf alte Pfade würden ins Leere laufen.

Alternative Variante B: alte Pfade als Redirect-Stubs

- Die alten `docs/derived/BACKEND_0_5_*.md`-Pfade bleiben als kurze Stubs erhalten.
- Jeder Stub verweist auf den neuen Zielpfad und enthält keine neue fachliche Wahrheit.
- Vorteil: alte Pfade bleiben lesbar.
- Nachteil: `docs/derived/` bleibt weiterhin mit Stub-Dateien belastet; `rg`-Treffer steigen.

Für Backend 0.5 ist Variante A vorzuziehen, sobald das Projekt `docs/releases/` als dauerhafte Struktur akzeptiert. Bis dahin gilt: kein Move.

## Move-Voraussetzungen

Ein späterer Move darf erst erfolgen, wenn diese Bedingungen erfüllt sind:

- `docs/releases/` ist als dauerhafte Zielstruktur projektweit akzeptiert.
- Alle harten Pfadlinks aus dem Linkaudit sind aktualisiert oder durch Stubs abgesichert.
- Final Review und Implementation Review bleiben als Audit-Trail eindeutig auffindbar.
- Requirements, Testmatrix und Plan bleiben nachvollziehbar, auch wenn sie archiviert oder umbenannt werden.
- Kein V1.0-, V1.9-, S01- oder V2-Artefakt wird im selben Paket bewegt.
- Abschlusscheck: `rg -n "BACKEND_0_5_|Backend 0\\.5|Private Storage Maintenance" .`
- Abschlusscheck: `git diff --check`

## Ergebnis für dieses Paket

Die Akzeptanzkriterien sind ohne tatsächliche Datei-Moves erfüllt:

- Linkbruchrisiken sind nach harten Pfadlinks und unkritischen Textreferenzen getrennt.
- Move-/Stub-Entscheidung ist dokumentiert: `decision-no-move`.
- Da keine Dateien bewegt wurden, ist keine Linkmigration nötig; alle bestehenden Pfade bleiben gültig.
- Ein späterer Move ist klein geschnitten und auf Backend 0.5 begrenzt.
