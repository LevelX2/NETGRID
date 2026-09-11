---
activityId: act-2026-09-11-ai-des01-installed-agenda-owner
status: in_progress
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-11
startedAt: 2026-09-11
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
branch: codex/ai-des01-score-information-owners
---

# DES-01: Installierte Runner-Agendas als vertikaler Owner

Erstes von drei beauftragten Paketen. Signalbildung, Signal-/Zustandstypen,
Discovery, Bewertung und exakte Quellen-/Actionbindung von
`runner.score_installed_agenda` zusammenführen. Gemeinsame sichtbare Kartenfakten
explizit anbinden. Verhalten, Prioritäten, Fehlerdiagnosen und Regelautorität
unverändert erhalten; keine neuen Fähigkeiten und keine allgemeine API-Neuordnung.

Abnahme: vorhandene Regressionen vor/nach Extraktion, gezielte Owner-Grenztests,
Typecheck und Strukturgates, Vergleich der verschobenen Logik, aktuelle
Ownerkarte und Fachvertrag. Eigener Paketcommit. Danach folgen getrennt
reservierte Pakete für `runner.secure_terminal_win` und `runner.expose_information`;
abschließend lokale Main-Integration und Worktree-Cleanup, kein Push.
