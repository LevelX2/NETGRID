---
activityId: act-2026-09-11-ai-des01-resource-lifecycle-owner
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-11
startedAt: 2026-09-11
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
branch: codex/ai-des01-economy-owners
---

# DES-01: Runner-Ressourcenlebenszyklus als vertikaler Owner

Zweites und letztes der zwei beauftragten Owner-Pakete. Signale, Zustand,
Planmodul, Retain-Dispositionen und konkrete Finanzierungsanforderungen von
`runner.resource_lifecycle` in einem Ownerverzeichnis bündeln. Geteilte
Finanzierungsverträge und ihre bestehende Validierung aus der Core-Registry
lösen; exakte Finanzierungssuche als expliziten gemeinsamen Dienst anbinden.

Phasen, Prioritäten, Bewertungen sowie LegalAction-, Quellen-, Versions- und
Elternplanbindungen unverändert erhalten. Kein neuer Karten-Support, keine
neue Verhaltensstrategie, kein Framework und keine Legacy-Adapter.

Abnahme: gezielte Regressionen und Owner-Grenztests, thematischer Plan-Testlauf,
AI-Typecheck und Strukturgates, Vergleich der verschobenen Logik, aktuelle
Codekarte und Ownervertrag. Danach Paketcommit, lokale Main-Integration beider
Pakete und geprüfter Worktree-Cleanup; kein Push.
