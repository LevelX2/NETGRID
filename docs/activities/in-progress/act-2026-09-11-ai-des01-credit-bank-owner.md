---
activityId: act-2026-09-11-ai-des01-credit-bank-owner
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-11
startedAt: 2026-09-11
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
branch: codex/ai-des01-credit-bank-owner
---

# DES-01: Vertikaler Owner-Pilot für runner.credit_bank

## Ziel und Scope

Die bereits vorhandene Banklogik in einem fachlichen Owner-Verzeichnis bündeln:
Signale, Zustand, Assessment, Materialisierung, Dispositionen und bestehende
Fortsetzung. Gemeinsame Facts und Ausführung bleiben explizite Dienste.
Anschließend Umsetzbarkeit, Aufwand und Wartungsgewinn beurteilen.

## Nicht-Scope

Keine Verhaltens- oder Gewichtungsänderungen, keine Migration anderer Owner,
keine allgemeine Plugin-/Owner-Framework-Einführung und keine DES-04–07-Arbeit.

## Abnahme

- Bankentscheidungen sind lokal verständlich; Runtime verdrahtet den Owner.
- Keine Rückimporte aus dem Owner in den zentralen Live-Runtime-Monolithen.
- Action-, Quellen-, Bedarf- und Continuation-Bindungen bleiben erhalten.
- Fokussierte Bank-/Economy- und Ownership-Regressionen, AI-Typecheck und
  Strukturgates belegen den Schnitt; unabhängige Baselinefehler getrennt bewerten.
- Aktuelle Architektur beschreibt Dateien, Dienste, Grenzen und Übertragbarkeit.
- Ein Paketcommit, lokale Main-Integration, geprüfter Worktree-Cleanup; kein Push.
