# V1.9.22 Test Matrix

Stand: 2026-05-13
Status: planned

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 47 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.22-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Resolver | Jede Karte hat Adapter oder Blocker | Runtime-Definitionen fuer 9 Runner-Hardware-Zielkarten, noch ohne LegalAction-Smoke |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Choices revalidiert | Arasaka Portable Prototype Install-LegalAction gruen |
| Visibility | Keine Hidden-Info-Leaks ueber PlayerViews/PublicEvents/Reconnect/Undo | Arasaka Portable Prototype Install-PublicPayload und PlayerViews gruen |
| Replay/StateHash | Neue Effekte sind deterministisch replaybar | Arasaka Portable Prototype Install-Replay/StateHash gruen |
| AI | Hints, Smokes und side-sichere Fallbacks fuer alle `ai_supported` Karten | Folgearbeit |
| Server/Web | Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Gruen fuer Runtime-WIP: JSON 302, engine 273, catalog 36, typecheck |

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
