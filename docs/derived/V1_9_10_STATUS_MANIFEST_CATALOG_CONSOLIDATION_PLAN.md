# V1.9.10 Status-, Manifest- und Katalog-Konsolidierungsplan

Status: umgesetzt und final reviewt
Stand: 2026-05-12
Primärer Agent: release-implementation-agent

## Scope

V1.9.10 ist ein Konsolidierungsgate ohne neue Spielbarkeit. Es repariert die nach V1.9.9 erkannte Statusdrift:

- Fetch 4.0.1, Hunter und Trojan Horse sind bereits Runtime-, Test- und KI-abgedeckt, fehlten aber in der card-implementation-Manifestspur.
- Der private lokale Legacy-Katalogindex `data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json` ist in diesem Automations-Worktree nicht versioniert vorhanden; falls er lokal existiert, darf er keine Patchmarker enthalten und muss JSON-valid sein.
- Die führende Runtime-Zählung bleibt 143 human_playable/deck_legal O:NR-v1-Karten, 143 ai_supported O:NR-v1-Karten und 231 offene Karten.

## Must-Anforderungen

| ID | Anforderung | Nachweis |
| --- | --- | --- |
| V1910-MUST-001 | Keine neue Karte wird durch V1.9.10 als human_playable, deck_legal oder ai_supported promotet. | `data/reports/onr-v1-runtime-status-1.9.10.json`, Katalogtest |
| V1910-MUST-002 | Fetch 4.0.1, Hunter und Trojan Horse haben eine eindeutige Implementation-Manifest-Referenz. | `data/manifests/card-implementation-manifest-1.2.3.json`, `data/manifests/card-implementation-manifest-1.9.10.json` |
| V1910-MUST-003 | Die Runtime-Zählung 143/143/231 ist maschinenlesbar dokumentiert. | `data/reports/onr-v1-runtime-status-1.9.10.json` |
| V1910-MUST-004 | Der Legacy-Katalogindex ist bei Vorhandensein JSON-valid und patchmarkerfrei; bei Abwesenheit ist der versionierte Runtime-Statusreport führend. | `packages/catalog/src/index.test.ts` |
| V1910-MUST-005 | V1.9.11+ bleibt gesperrt; keine spätere Releasekarte wird vorgezogen. | `data/scenarios/v1910-status-manifest-catalog-smoke.json` |

## Testmatrix

| Test | Zweck | Status |
| --- | --- | --- |
| JSON-Parse aller `data/**/*.json` | Artefaktvalidität | pass |
| `v1-9-install-and-check.ps1 -Task catalog` | Manifest-/Status-/No-Promotion-Gate | pass |
| `v1-9-install-and-check.ps1 -Task engine` | Regression, unveränderte Engine-Fläche | pass |
| `v1-9-install-and-check.ps1 -Task ai` | AI-No-Promotion und bestehende Hints | pass |
| `v1-9-install-and-check.ps1 -Task typecheck` | Workspace-Typprüfung | pass |

## Go/No-Go

V1.9.10 ist abgeschlossen. Die früher blockierten pnpm/Vitest-Checks sind ausführbar und grün; der Cursor darf auf V1.9.11 gesetzt werden.
