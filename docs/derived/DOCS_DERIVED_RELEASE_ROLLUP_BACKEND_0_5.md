# Docs Derived Release Rollup: Backend 0.5 Musterbereich

Status: proposal
Stand: 2026-05-17
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Ziel

Dieses Rollup ist ein kleiner Musterbereich für die Verdichtung releaseweiser Artefakte unter `docs/derived/`. Es behandelt nur die abgeschlossene Backend-/Ops-Familie `BACKEND_0_5_*` und verschiebt oder löscht keine bestehenden Gate-Nachweise.

Der Musterbereich soll zeigen, wie Releasefamilien künftig lesbarer gruppiert werden können, ohne Final Reviews, Implementation Reviews, Requirements, Testmatrizen oder relevante WIP-/Korrekturspuren unauffindbar zu machen.

## Musterfamilie

Backend 0.5 ist geeignet, weil die Familie klein, abgeschlossen und fachlich von der V1.9.x-Karten-/Mechaniklinie getrennt ist.

| Datei | Rolle | Vorschlag | Begründung |
| --- | --- | --- | --- |
| `docs/derived/BACKEND_0_5_FINAL_REVIEW.md` | Final Review, Gate-Ergebnis | `keep-evidence` | Führender Audit-Trail mit Abschlussstatus, Verifikation und offenen Restpunkten. Nicht inhaltlich umschreiben. |
| `docs/derived/BACKEND_0_5_IMPLEMENTATION_REVIEW.md` | Implementation Review | `keep-evidence` | Belegt umgesetzten Scope, Sicherheitsgrenzen, Endpunkte, UI und Checks. Nicht inhaltlich umschreiben. |
| `docs/derived/BACKEND_0_5_REQUIREMENTS.md` | Requirements | `condense-candidate-after-rollup` | Nach Final Review weiterhin nützlich, aber Inhalte können in einem Releaseindex verdichtet referenziert werden. Datei bleibt bis zur Linkmigration erhalten. |
| `docs/derived/BACKEND_0_5_TEST_MATRIX.md` | Testmatrix | `condense-candidate-after-rollup` | Testabdeckung sollte im Rollup zusammengefasst werden; konkrete Matrix bleibt als Nachweis erhalten, bis Folgepaket Linkmigration/Archiventscheidung erledigt. |
| `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` | Detailplan / Vorplanung | `archive-candidate-after-condense` | Historisch wertvoll, aber nach Requirements, Implementation Review und Final Review nicht mehr führend. Geeignet für spätere Archivgruppe, nicht für Löschung im Musterpaket. |

## Vorgeschlagene Zielstruktur

Für abgeschlossene Backend-/Ops-Releases:

```text
docs/derived/
  DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md
  BACKEND_0_5_FINAL_REVIEW.md
  BACKEND_0_5_IMPLEMENTATION_REVIEW.md
  BACKEND_0_5_REQUIREMENTS.md
  BACKEND_0_5_TEST_MATRIX.md
  BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md
```

Später, nach Linkaudit und explizitem Folgepaket, kann eine echte Gruppierung entstehen:

```text
docs/releases/backend-ops/backend-0-5/
  README.md
  final-review.md
  implementation-review.md
  requirements.md
  test-matrix.md
  plan.md
```

Die zweite Struktur ist bewusst kein Teil dieses Pakets. Vor jedem Move müssen alle Referenzen auf die alten Pfade aktualisiert oder durch Redirect-/Indexhinweise abgesichert werden.

## Verdichteter Releaseindex für Backend 0.5

Backend 0.5 ist ein abgeschlossener privater Storage-Maintenance-Schnitt. Führend bleiben:

- Abschluss: `docs/derived/BACKEND_0_5_FINAL_REVIEW.md`
- Umsetzung: `docs/derived/BACKEND_0_5_IMPLEMENTATION_REVIEW.md`
- Vertrag: `docs/derived/BACKEND_0_5_REQUIREMENTS.md`
- Testabdeckung: `docs/derived/BACKEND_0_5_TEST_MATRIX.md`
- Historischer Plan: `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md`

Kurzstand:

- Private Wartungsseite: `/maintenance`
- Maintenance-APIs: `/api/storage/maintenance/*`
- Sicherheitsgrenzen: lokal/private-only, keine Tokens, keine Decklisten, keine FullState-/Snapshot-Inhalte, keine Event-PrivatePayloads, keine Hidden-Zone-Daten.
- Cleanup-Vertrag: Preview vor Apply, Whole-Match-Delete per FK-Cascade, optionale Backups, optionales `VACUUM`, Löschschutz und Auto-Cleanup-Policy.
- Nicht promotet: Karten-, Mechanik-, KI- oder Webclient-Release-Linie.

## Linkbruchrisiken vor Moves

Die konkrete Move-/Stub-Entscheidung liegt in `docs/derived/DOCS_DERIVED_BACKEND_0_5_LINK_AUDIT_MOVE_PLAN.md`: Stand 2026-05-17 bleibt `decision-no-move`; die bestehenden `docs/derived/BACKEND_0_5_*`-Pfade bleiben vorerst kanonisch.

Aktuelle direkte Referenzen auf `BACKEND_0_5_*` liegen mindestens in:

- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/derived/BACKEND_0_5_REQUIREMENTS.md` verweist auf den Plan.
- `docs/derived/BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md` nennt die abgeleiteten Requirements- und Testmatrix-Dateien.

Weitere lose Textreferenzen auf `Backend 0.5` stehen in Runtime-Code, Tests und UI, sind aber keine Pfadlinks und wären durch einen Dateimove nicht direkt gebrochen. Trotzdem sollte ein Folgepaket Suchmuster für `BACKEND_0_5_`, `Backend 0.5` und `Private Storage Maintenance` verwenden, bevor echte Moves erfolgen.

Konsequenz: In diesem Musterpaket werden keine Dateien verschoben. Ein späterer Move braucht mindestens einen Linkaudit, Pfadaktualisierungen in Wissensbasis/Codex-Status/Log und eine kurze Nachprüfung mit `rg "BACKEND_0_5_"`.

## Rollup-Regeln aus dem Muster

- Final Reviews bleiben `keep-evidence`.
- Implementation Reviews bleiben `keep-evidence`.
- Requirements und Testmatrizen bleiben auffindbar, können aber in Releaseindizes verdichtet werden.
- Detailpläne, Vorplanungen und Preflights werden nur dann Archivkandidaten, wenn Requirements, Review und Final Review den führenden Stand vollständig abdecken.
- Keine historische Datei wird gelöscht, solange sie einen Gate-Nachweis, eine echte WIP-/Blocker-Spur, eine Korrekturentscheidung oder offene Removal Conditions enthält.
- Jede echte Umstrukturierung erfolgt familienweise, nicht über `docs/derived/` als Ganzes.

## Folgepakete

Kleine Folgepakete statt breitem Umbau:

1. `act-2026-05-17-docs-derived-backend-0-5-link-audit-move-plan`
   - Prüft alle `BACKEND_0_5_*`-Pfadlinks.
   - Entscheidet, ob echte Zielstruktur `docs/releases/backend-ops/backend-0-5/` angelegt wird.
   - Führt bei Freigabe nur diese eine Familie um.
2. `act-2026-05-17-docs-derived-s01-rollup-proposal`
   - Erstellt analog ein Rollup für `S01_*`, ohne Dateien zu bewegen.
   - Klassifiziert Specs, Requirements, Testmatrix und Reviews.
3. `act-2026-05-17-docs-derived-v1-0-small-release-rollup-proposal`
   - Wählt höchstens zwei kleine V1.0.x-Releases als Muster.
   - Benennt Linkbruchrisiken und Archivkandidaten, ohne breite V1.0-Historie zu bewegen.

## Nicht entschieden

- Ob `docs/releases/` als dauerhafte Zielstruktur eingeführt wird.
- Ob alte `docs/derived/BACKEND_0_5_*`-Dateien nach einem späteren Move als Redirect-Stubs erhalten bleiben.
- Ob `docs/derived/` langfristig nur noch aktive/führende Artefakte oder weiterhin alle historischen Einzeldateien enthält.
