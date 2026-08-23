---
activityId: act-2026-08-22-corp-rez-cost-seams-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Projektions-, Quote-, Validierungs- und Änderungshistorie geprüft
  - corepack pnpm check:engine-source-structure
---

# Corp-Rez-Cost-Verantwortlichkeiten schneiden

## Ziel

Bewerten, ob `corp-rez-cost.ts` in Quellen-/Modifier-Ermittlung, sichtbare
Rez-Quote und Install-/Rez-Sequenzprojektion getrennt werden sollte.

## Kontext und Quellen

- Regel-Engine-Review Batch 5 vom 2026-08-22.
- Aktivierungsauslöser: nächste neue Rez-Kostenquelle oder Sequenzprojektion.

## Scope

- Bestehende Quote-, Modifier- und Sequenzverantwortlichkeiten erfassen.
- Einen Schnitt mit gemeinsamem, autoritativem Rez-Kostenvertrag entwerfen.
- Bei bestätigtem Nutzen kleine Folgepakete je Verantwortlichkeit anlegen.

## Nicht im Scope

- Änderung von Rez-Legalität, Kostenpriorität oder Sichtbarkeitsregeln.
- Parallelberechnung derselben Kosten in mehreren Modulen.

## Akzeptanzkriterien

- [ ] Genau eine Rez-Kostenautorität bleibt erhalten.
- [ ] Quote und Zahlung können nicht auseinanderlaufen.
- [ ] Hidden-Info-, LegalAction- und StateVersion-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Vor einem Split vorhandene Rez-Quote- und Sequenztests als Vertragsmatrix festhalten.

## Ergebnisnotiz

Review vom 2026-08-23: **derzeit ohne ausreichenden Nutzen oder
Aktivierungsauslöser zurückgestellt**. Die Datei bündelt zwar Quellenmatching,
Install-/Rez-Projektionen, Quotes und Quote-Validierung, hält dadurch aber
aktuell genau einen autoritativen numerischen Vertrag. Der jüngste Fix
`a91bf06c9` ersetzte lediglich einen mehrdeutigen Definition-Matcher durch den
korrekten zentralen Helper und belegt kein Auseinanderlaufen von Quote und
Zahlung. Seit Anlage des Pakets kam keine Rez-Kostenquelle oder neue
Sequenzprojektion hinzu. Größe allein rechtfertigt den risikoreichen Schnitt
nicht. Keine Folge-Activity; beim Trigger zuerst die bestehende Testmatrix für
Rez-Quote und HQ-Install-/Rez-Sequenz als gemeinsame Vertragsgrenze festhalten.
