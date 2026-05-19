---
activityId: act-2026-05-19-shell-traders-action-labels-target-card
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-19-shell-traders-missing-prepare-action
  - act-2026-05-18-runner-ai-shell-traders-unused
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "Shell Traders"
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "Shell Traders"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# The Shell Traders: Aktions- und Chroniklabels mit Zielkartennamen anzeigen

## Ziel

Die Shell-Traders-Aktionsbuttons und Chronikmeldungen sollen klar sagen, welche konkrete Karte betroffen ist. Statt generischer Texte wie `1 Aktion - Karte vorbereiten`, `1 Credit - Shell-Counter entfernen` oder Chronikmeldungen mit `The Shell Traders` als entferntem Counter-Ziel sollen die Texte den Zielkartennamen enthalten, z. B. `[Kartenname] zur Seite legen` und `Shell-Counter von [Kartenname] entfernen`.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19 mit Screenshots:
  - Beim Beiseitelegen von Programm/Hardware zeigt das Web-Action-Board mehrfach `1 Aktion - Karte vorbereiten`.
  - Beim Herunternehmen der Shell-Counter zeigt das Web-Action-Board mehrfach `1 Credit - Shell-Counter entfernen`.
  - Bei mehreren legalen Shell-Traders-Zielen ist dadurch nicht erkennbar, welche Zielkarte der Button auslöst.
- Nutzerbeobachtung vom 2026-05-19 mit Chronik-Screenshot:
  - Die Chronik meldet `Du hast 1 Counter von The Shell Traders entfernt.`
  - Tatsächlich werden die Shell-Counter von den beiseitegelegten Zielkarten entfernt, nicht von `The Shell Traders` selbst.
- `act-2026-05-19-shell-traders-missing-prepare-action` ist erledigt und hat den fehlenden Aktionspfad repariert. Dieses Paket ist ein UI-Text-Follow-up, kein erneutes LegalAction-Hotfix-Paket.
- `packages/engine/src/index.ts` erzeugt Prepare-LegalActions bereits mit Zielkartentitel im Label: `The Shell Traders: <Zielkarte> vorbereiten`.
- `apps/web/app/action-board-ui.ts` kürzt Shell-Traders-Aktionen aktuell im Kontextlabel generisch:
  - `set_aside_from_grip` -> `Karte vorbereiten`
  - `remove_shell_counter` -> `Shell-Counter entfernen`
- `apps/web/app/chronicle.ts` enthält Shell-Traders-Chronikpfade, die den Zielkartentitel nutzen sollen; der Screenshot zeigt aber mindestens einen Live-Fall, in dem der entfernte Counter fälschlich `The Shell Traders` zugeordnet wird.
- Für Counter-Removal liefert die Engine Zielkarteninformationen im Payload (`targetCardId`, `targetCardDefinitionId`) und die vorbereitete Karte liegt nach dem Set-aside public face-up mit Shell-Countern.

## Scope

- Web-Action-Board-Labels für `shellTradersAbility: "set_aside_from_grip"` so ändern, dass der Zielkartenname sichtbar bleibt.
- Gewünschter Stil für Prepare:
  - primär: `<Kartenname> zur Seite legen`
  - akzeptabel, falls terminologisch im Projekt konsistenter: `<Kartenname> beiseitelegen`
  - nicht mehr: `Karte vorbereiten` als alleiniges sichtbares Label.
- Web-Action-Board-Labels für `shellTradersAbility: "remove_shell_counter"` so ändern, dass der vorbereitete Zielkartenname sichtbar bleibt.
- Gewünschter Stil für Counter-Removal:
  - `Shell-Counter von <Kartenname> entfernen`
  - bei Auto-Install- oder letztem-Counter-Fall optional ergänzt, wenn die bestehende UI dafür schon Kontext hat, aber keine neue Mechaniklogik erzwingen.
- Mehrere parallele Shell-Traders-Aktionen müssen im Buttontext unterscheidbar sein.
- Bestehende Kosten-/Icon-Anzeige bleibt erhalten; nur der semantische Aktionstext wird präzisiert.
- Tooltip/Accessible-Label soll denselben Zielbezug enthalten, wenn diese Labels aus derselben Helper-Funktion kommen oder ohne größeren Schnitt erreichbar sind.
- Chronikmeldungen für bezahltes und automatisches Shell-Counter-Removal so prüfen und korrigieren, dass der Counter von der beiseitegelegten Zielkarte entfernt wird:
  - `Du hast 1 Shell-Counter von <Kartenname> entfernt.`
  - bei Installation: `Du hast 1 Shell-Counter von <Kartenname> entfernt; Karte kostenlos installiert.`
  - nicht: `Du hast 1 Counter von The Shell Traders entfernt.`
- Web-Tests für Prepare-, Remove-Counter-Buttonlabels und Chronikmeldungen ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung am Kartenvertrag von `The Shell Traders`.
- Keine Änderung an LegalAction-Erzeugung, `applyAction`, Counter-Regeln, Auto-Install, MU-Choice, Replay oder StateHash, sofern die Zielinformationen bereits im PlayerView/LegalAction-Payload vorhanden sind.
- Keine erneute KI-Priorisierung; die Runner-KI-Nutzung ist separat erledigt.
- Keine neue allgemeine Benennungsstrategie für alle Kartenfähigkeiten außerhalb der direkt betroffenen Shell-Traders-Buttons.
- Keine allgemeine Chronik-Neufassung außerhalb der direkt betroffenen Shell-Traders-Set-aside-/Counter-Removal-Meldungen.
- Kein Leak verdeckter Runner-Handkarten an Korp, PublicEvents, Logs, Reconnect-Payloads oder AI-Inputs. Zielnamen aus der Grip dürfen nur in der Runner-eigenen LegalAction-/UI-Entscheidung sichtbar sein; öffentliche Sichtbarkeit entsteht erst nach erfolgreichem Set-aside.

## Akzeptanzkriterien

- [ ] Prepare-Buttons zeigen bei Shell Traders den konkreten Zielkartennamen, z. B. `Simple Fracter zur Seite legen`, nicht nur `Karte vorbereiten`.
- [ ] Wenn mehrere Programme/Hardwarekarten legal sind, sind die Buttons über ihre Zielkartennamen unterscheidbar.
- [ ] Remove-Counter-Buttons zeigen den konkreten vorbereiteten Zielkartennamen, z. B. `Shell-Counter von Simple Fracter entfernen`, nicht nur `Shell-Counter entfernen`.
- [ ] Chronikmeldungen für Shell-Counter-Removal nennen die vorbereitete Zielkarte, nicht `The Shell Traders` als Counter-Ziel.
- [ ] Die Chronik unterscheidet bezahltes Counter-Removal und Start-of-turn-Removal korrekt und nutzt in beiden Fällen den Zielkartennamen.
- [ ] Die Kostenanzeige bleibt korrekt: Prepare kostet 1 Aktion, bezahltes Counter-Removal kostet 1 Credit.
- [ ] Web-/Action-Board-Tests decken Prepare und Remove-Counter mit Zielkartennamen ab; Chroniktests decken den Screenshot-Fall ab.
- [ ] Hidden-Info-Grenzen bleiben gewahrt: Korp und öffentliche Payloads erhalten keine Runner-Grip-Zielnamen vor der Auflösung.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/action-board-ui.test.ts`
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
- Für Prepare kann eventuell das vorhandene Engine-Label genutzt werden, statt es auf `Karte vorbereiten` zu reduzieren. Dabei `The Shell Traders:` als Quellenpräfix entfernen und die Zielaktion in echtes Deutsch normalisieren.
- Falls das Web aus `targetCardDefinitionId` den Titel nachschlagen muss, nur bereits im Runner-Action-Kontext rechtmäßig vorhandene Zielinformationen verwenden.
- Für Remove-Counter prüfen, ob das LegalAction-Label oder die Payload schon genug Zielinformationen enthält. Falls nicht, den kleinsten Folge-Hotfix schneiden, statt im Web über unzuverlässige Quellen zu raten.
- Für die Chronik besonders prüfen, ob `cardTitle` aus der Quelle (`The Shell Traders`) statt aus `targetCardDefinitionId`/Zielkarte abgeleitet wird. Die Meldung muss fachlich vom Ziel der Counter-Änderung ausgehen.

## Ergebnisnotiz

Umgesetzt: Shell-Traders-Prepare- und Counter-Removal-Aktionslabels behalten den Zielkartennamen und bleiben bei parallelen Zielen unterscheidbar. Chronikmeldungen für bezahltes und Start-of-turn-Shell-Counter-Removal bevorzugen die Zielkarte aus `targetCardDefinitionId` statt die Quelle `The Shell Traders`.
