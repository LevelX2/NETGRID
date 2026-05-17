---
activityId: act-2026-05-17-restrictive-net-zoning-server-choice-labels
status: in_progress
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Restrictive Net Zoning: Serverauswahl und Zielbindung sichtbar machen

## Ziel

`Restrictive Net Zoning` soll beim Ausspielen menschenlesbare Serveroptionen zeigen und den gewählten Server danach dauerhaft sichtbar halten.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Die Auswahl zeigt offenbar mehrfach nur Kostenwerte statt Servernamen.
- Nutzeranforderung vom 2026-05-17: Nach der Auswahl muss erkennbar bleiben, auf welchen Server sich die Karte bezieht.
- Lokaler Kartenanker: `onr_v1_173_restrictive-net-zoning`.

## Scope

- Choice-Erzeugung und Choice-Rendering für serverbezogene Optionen prüfen.
- Optionen mit klaren Labels wie `HQ`, `R&D`, `Archives`, `Remote Server 1` versehen.
- Gewählte Serverbindung persistent speichern und in Karte, Tooltip oder Statuschip anzeigen.
- Chronik-Eintrag für die gewählte Zielbindung ergänzen.
- Reload, Reconnect und Multiplayer-Sync berücksichtigen.

## Nicht im Scope

- Kein Redesign aller Choice-Dialoge.
- Keine Änderung an den eigentlichen Installkosten der Karte außer bei nachgewiesenem Bug.

## Akzeptanzkriterien

- [ ] Jede auswählbare Serveroption hat ein menschenlesbares Label; Kosten sind höchstens Zusatzinformation.
- [ ] Nach Ausspielen zeigt die Karte oder ihr Tooltip den Zielserver dauerhaft an.
- [ ] Die Chronik nennt den gewählten Server ohne Hidden-Info-Leak.
- [ ] Reload/Reconnect/Multiplayer erhalten die Zielbindung korrekt.
- [ ] Regressionen decken mindestens zentrale Server und einen Remote Server ab.

## Umsetzungshinweise

- Prüfen, ob ein generisches Pflichtfeld `displayLabel` für Choice-Optionen sinnvoll ist.
- Hidden-Info-Grenze: Servernamen und öffentliche Serverstruktur sind erlaubt; verdeckte installierte Karten dürfen nicht namentlich leaken.

## Ergebnisnotiz

Noch offen.
