---
activityId: act-2026-05-19-shell-traders-missing-prepare-action
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: V1.9.12 follow-up / Shell Traders LegalAction UI
blockedBy: []
resultArtifacts:
  - packages/shared/src/ability-payload.ts
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "Shell Traders"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "Shell Traders"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-18-runner-ai-shell-traders-unused
---

# The Shell Traders: fehlenden Vorbereiten-Aktionsbutton reparieren

## Ziel

`The Shell Traders` soll nach der Installation im Runner-Rig zuverlässig eine nutzbare Aktion anbieten, um ein Programm oder eine Hardware aus der Runner-Hand beiseitezulegen und mit Shell-Countern zu versehen. Der Aktionsbutton muss für menschliche Spieler sichtbar und ausführbar sein, wenn legale Ziele in der Grip vorhanden sind.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19: `The Shell Traders` wurde ausgespielt. Obwohl Programme oder Hardware auf der Hand lagen, erschien kein Aktionsbutton, um Shell Traders zu benutzen.
- Gemeinter Kartentitel im Workspace: `The Shell Traders` (`onr_v1_176_the-shell-traders`).
- Bestehender Kartenvertrag laut `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-review.md`:
  - installierte Shell-Traders-Kopie erzeugt im Runner-Hauptfenster eine `trigger_ability`-LegalAction,
  - Ziel ist eine eigene Programm- oder Hardwarekarte aus der Grip,
  - Ziel wird erst bei Auflösung public face-up nach `set_aside` gelegt,
  - Shell-Counter entsprechen normalen Installationskosten,
  - Counter werden turnweise oder per 1-Credit-Fähigkeit entfernt,
  - bei 0 Countern installiert die Engine die Karte automatisch.
- `apps/web/app/action-board-ui.ts` enthält bereits Label-Helfer für `shellTradersAbility === "set_aside_from_grip"` mit Text `Karte vorbereiten`.
- Der offene KI-Fund `act-2026-05-18-runner-ai-shell-traders-unused` hängt fachlich davon ab: Wenn die LegalAction oder die UI-Aktion fehlt, kann die Runner-KI Shell Traders nicht sinnvoll nutzen.

## Scope

- Reproduzieren, ob bei installierter `The Shell Traders` und mindestens einem legalen Programm-/Hardwareziel in der Grip eine passende Runner-`trigger_ability`-LegalAction erzeugt wird.
- Falls keine LegalAction erzeugt wird: Engine-LegalAction-Generator und `applyAction`-Resolver für `shellTradersAbility: "set_aside_from_grip"` reparieren.
- Falls die LegalAction erzeugt wird, aber kein Button erscheint: Web-Action-Board-/Kontextfilter reparieren, sodass die Aktion an der installierten Resource oder in der passenden Aktionsfläche sichtbar wird.
- Prüfen, dass die Aktion nur im richtigen Runner-Fenster angeboten wird und nur für installierte Shell-Traders-Quellen mit legalen Grip-Zielen.
- Sicherstellen, dass die Korp vor Auflösung keine Handkartenidentität sieht; Zielauswahl bleibt runner-privat, PublicPayload wird erst nach erfolgreicher Auflösung öffentlich.
- Bestehende Folgepfade mit absichern:
  - Set Aside mit Shell-Countern,
  - Start-of-turn-Counter-Removal,
  - bezahltes Shell-Counter-Entfernen,
  - Auto-Install bei 0 Countern,
  - MU-Choice bei Programmen, wenn nötig.

## Nicht im Scope

- Keine Änderung am bestätigten Kartenvertrag, sofern der Review-Vertrag stimmt.
- Keine KI-Priorisierung. Die Runner-KI-Nutzung bleibt im Folgepaket `act-2026-05-18-runner-ai-shell-traders-unused`.
- Keine neue allgemeine Delayed-Install-Engine für andere Karten.
- Keine Preis-/Counter-Regeländerung für Programme oder Hardware.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Logs oder AI-Inputs.
- Keine Änderung an Replay oder StateHash außer notwendiger Regression des bestehenden Shell-Traders-Pfads.

## Akzeptanzkriterien

- [x] Bei installierter `The Shell Traders` und mindestens einem Programm oder einer Hardware in der Runner-Grip existiert eine legale `trigger_ability`-Action mit `shellTradersAbility: "set_aside_from_grip"`.
- [x] Der menschliche Runner sieht dafür einen verständlichen Aktionsbutton, z. B. `Karte vorbereiten`, an der passenden Stelle.
- [x] Ohne legalen Zieltyp in der Grip wird keine falsche Aktion angezeigt.
- [x] Die Aktion ist nur für den Runner und nur in erlaubten Runner-Timingfenstern verfügbar.
- [x] `applyAction` revalidiert Seite, `actionId`, `stateVersion`, installierte Quelle, Timingfenster, Kosten, Zielzone, Zieltyp und aktuelle Zielkarte.
- [x] Vor Auflösung leaken Korp-Views und PublicEvents keine Runner-Handkartenidentität.
- [x] Nach Auflösung liegt die Zielkarte public face-up in `set_aside` und trägt die korrekte Anzahl Shell-Counter.
- [x] Start-of-turn-Removal, bezahltes Removal und Auto-Install funktionieren weiterhin deterministisch.
- [x] Replay und StateHash bleiben für den reparierten Shell-Traders-Pfad stabil.
- [x] Ein fokussierter Engine-Test und ein fokussierter Web-/Action-Board-Test decken den fehlenden Button beziehungsweise die LegalAction-Sichtbarkeit ab.
- [x] Das KI-Folgepaket kann danach prüfen, ob die Runner-KI die nun vorhandene Aktion sinnvoll priorisiert.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil der Befund Kartenvertrag, LegalActions und Hidden-Info-Grenzen berührt.
- Wahrscheinliche Startpunkte:
  - `packages/engine/src/index.ts`: LegalAction-Erzeugung und Resolver für `The Shell Traders`.
  - `packages/engine/src/index.test.ts`: realistischer Zustand mit installierter Shell Traders und Programm-/Hardware in Grip.
  - `apps/web/app/action-board-ui.ts`: Label/Context-Matching für installierte Resource-Aktionen.
  - `apps/web/app/action-board-ui.test.ts`: Buttonlabel und Kontextzuordnung.
- Wenn der Fehler nur aus fehlendem Kontext-Matching kommt, den Engine-Vertrag trotzdem mit einem kleinen Test absichern, damit die frühere Completion-Behauptung belastbar bleibt.

## Ergebnisnotiz

Abgeschlossen. `The Shell Traders` ist nicht mehr fälschlich als Recurring-Credit-Resource modelliert, sondern erzeugt installierte Runner-`trigger_ability`-Aktionen für Grip-Programme und -Hardware. Die Resolver legen Zielkarten public nach `set_aside`, setzen Shell-Counter nach Installationskosten, entfernen Counter per 1-Credit-Fähigkeit oder Runner-Start-of-turn und installieren die Zielkarte deterministisch bei 0 Countern. Fokussierte Engine-Tests prüfen LegalAction-Sichtbarkeit, Revalidierung, Hidden-Info-Grenzen, Replay/StateHash und Removal/Auto-Install; der Web-Test prüft den Buttontext `Karte vorbereiten`.
