# ACT-2026-07-17 – Verdeckte Runner-Resources aus der Korp-Ansicht trashen

## Status

`in_progress`  
Primärer Agent: `release-implementation-agent`  
Branch: `codex/hidden-resource-trash-ui`  
Worktree: `C:\Projekte\NETGRID-worktrees\hidden-resource-trash-ui`

## Quelle und Vorgabe

Nutzerbefund vom 17. Juli 2026: Ist der Runner getaggt, fehlt auf verdeckten
Runner-Resources in der Korp-Ansicht der Trash-Button. Der Nutzer hat die
direkte Reparatur über den Paketprozess-Worktree-Goal-Workflow beauftragt.

## Zielprüfung

Der Endzustand ist eindeutig: Eine getaggte Runner-Seite lässt der Korp die
bereits vorhandene Legal Action zum Trashen jedes verdeckten Resource-Slots
direkt an diesem Slot ausführen. Die Engine, die Kosten und die
Hidden-Info-Grenze bestehen bereits. Betroffen sind nur die Korp-Ansicht des
Runner-Rigs und die zugehörige UI-Testabdeckung.

## Gesamtziel

Die Korp kann bei einem getaggten Runner eine verdeckte installierte Resource
für 1 Aktion und 2 Credits über den redigierten Slot trashen. Bis zum
erfolgreichen Trash bleibt deren Identität verborgen; der erfolgreiche Trash
revealt die Karte nur nach dem bestehenden Engine-Vertrag im Runner-Heap.

## Annahmen und Nicht-Ziele

- Die Engine-Action `trash_resource` mit `hiddenResourceSlotId` ist führend
  und wird nicht verändert.
- Sichtbare Resources, Runner-Ansichten, andere verdeckte Kartentypen sowie
  Kartenfähigkeiten bleiben unverändert.
- Es gibt keine Änderung an Kosten, Timing, KI, Server-Payloads oder
  PlayerView-Redaction.

## Controller-Invarianten

- Die UI bleibt reine Darstellung von PlayerView und LegalActions.
- Für die Korp darf weder Titel, DefinitionId noch die echte Instanz-ID einer
  verdeckten Resource sichtbar werden.
- Die Aktion wird nur für den redigierten Slot gebunden und weiterhin allein
  durch die Engine legalisiert sowie revalidiert.

## Sicherheitsblocker

Stoppen und den Befund dokumentieren, falls die UI-Bindung nur durch Nutzung
einer privaten Kartenidentität möglich wäre oder ein Test einen Leak von Titel,
DefinitionId oder echter Instanz-ID nachweist.

## State Machine

`preflight` → `P1 dokumentiert` → `P2 implementiert und getestet` →
`nach main integriert` → `Worktree und Branch entfernt` → `complete`

## Paketfolge

### P1 – Prozess und UI-Vertrag absichern

- Ziel: Befund, Scope, Invarianten und Prüfgates festhalten.
- Arbeit: Dieses Prozessartefakt im Worktree anlegen.
- Checks: `git diff --check`.
- Done-Gate: Artefakt ist vollständig, nur paketbezogen geändert und
  committed.
- Commit: `docs(activity): document hidden resource trash UI fix`

### P2 – Redigierte Slot-Aktion im Runner-Rig anzeigen

- Ziel: Die vorhandene `trash_resource`-LegalAction eines verdeckten
  Runner-Resource-Slots am Slot rendern und ausführbar machen.
- Arbeit: Den pauschalen Ausschluss unbekannter Karten nur für die sichere
  `trash_resource`-Slot-Action aufheben; Unit-/Komponententest ergänzen.
- Checks: gezielter Web-Test, `corepack pnpm --filter @netgrid/web typecheck`,
  `git diff --check`.
- Done-Gate: Test beweist den Button für den redigierten Slot, keine
  Kartenidentität wird verwendet oder angezeigt, alle Checks bestehen.
- Commit: `fix(web): allow trashing hidden runner resources`

## Verifikationsregeln

- Der Test muss eine unbekannte gegnerische Runner-Resource darstellen und
  genau die Action `trash_resource` mit ihrer Slot-ID binden.
- Der Test darf keine Kartendaten als Voraussetzung enthalten.
- Vor jedem Paketabschluss: relevanter Check, `git diff --check`, gezieltes
  Staging und Commit.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im oben genannten Worktree arbeiten.
- Nach P2 aktuelles `main` integrieren, falls es weitergelaufen ist, und die
  relevanten Checks wiederholen.
- Anschließend lokal nach `main` mergen; kein Push und kein Pull Request.
- Erst nach erfolgreichem Main-Check den Worktree und den gemergten Branch
  entfernen und beide Entfernungen verifizieren.

## Controller-Prompt-Kern

```text
/Goal Arbeite ACT-2026-07-17 vollständig und sequenziell von P1 bis P2 ab und
merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID-worktrees\hidden-resource-trash-ui auf Branch
codex/hidden-resource-trash-ui. Nutze den Hauptworkspace nur für den finalen
Merge. Stelle keine Zwischenfragen, solange der Prozess konservativ
fortgesetzt werden kann. Arbeite immer nur am aktuellen Paket, führe seine
Checks aus und committe es. Bei einem Hidden-Info-Sicherheitsblocker stoppe
mit einem Blocker-Report. Nach Abschluss verifizieren, lokal nach main mergen,
den Worktree und Branch prüfen und entfernen; erst dann den Goal-Abschluss
melden.
```

## Abschlusskriterien

- P1 und P2 sind einzeln verifiziert und committed.
- Die Korp sieht für jeden legal trashbaren Hidden-Resource-Slot einen
  ausführbaren Trash-Button ohne Identitätsleak.
- Die Änderung ist lokal in `main` integriert.
- Arbeits-Worktree und Arbeitsbranch sind nachweislich entfernt.
