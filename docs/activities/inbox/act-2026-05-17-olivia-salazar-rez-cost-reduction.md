---
activityId: act-2026-05-17-olivia-salazar-rez-cost-reduction
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Olivia Salazar: Rez-Kostenreduktion prüfen und anbieten

## Ziel

Wenn `Olivia Salazar` regelrecht ICE-Rez-Kosten reduziert, muss die reduzierte Rez-Option in LegalActions und UI angeboten werden, auch wenn die Korp die normalen Rez-Kosten nicht bezahlen kann.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Während eines Runs wurde nur `nicht rezzen` angeboten, obwohl die Korp mit Olivia-Kostenreduktion genug Credits gehabt hätte.
- Lokale V1.9.19-Artefakte beschreiben Olivia derzeit als Agenda-Steal-Kostenpfad; daher ist zuerst eine Regel-/Kartentextprüfung nötig.
- Lokaler Kartenanker: `onr_v1_363_olivia-salazar`.

## Scope

- Gültigen Kartentext und lokale Implementierungsbasis für Olivia Salazar prüfen.
- Falls Rez-Kostenreduktion korrekt ist: Affordability-Prüfung und optionale Cost-Reduction-Pipeline für Rez-Aktionen anpassen.
- Reduzierte Rez-Option mit Quelle und tatsächlichen Kosten anzeigen.
- Nutzungskosten/-Erschöpfung/-Drehung gemäß Kartentext abhandeln.
- Chronik-Eintrag für reduziertes Rezzen ergänzen.

## Nicht im Scope

- Keine generelle Cost-Reduction-Architektur über Rez-Aktionen hinaus, falls nicht nötig.
- Keine Änderung am Agenda-Steal-Pfad, außer eine Quellenprüfung zeigt, dass er falsch ist.

## Akzeptanzkriterien

- [ ] Der gültige Olivia-Salazar-Effekt ist geprüft und dokumentiert.
- [ ] Bei korrekter Rez-Reduktion wird die reduzierte Rez-Aktion angeboten, auch wenn normale Kosten unbezahlbar sind.
- [ ] Der Button nennt Quelle und tatsächliche Kosten.
- [ ] `applyAction` revalidiert reduzierte Kosten, Timing, Serverbezug und Quelle.
- [ ] Chronik dokumentiert Quelle, ICE und gezahlte Kosten.

## Umsetzungshinweise

- Bei Quellenkonflikt nicht beide Effekte still kombinieren; zuerst Entscheidung sichtbar machen.

## Ergebnisnotiz

Noch offen.
