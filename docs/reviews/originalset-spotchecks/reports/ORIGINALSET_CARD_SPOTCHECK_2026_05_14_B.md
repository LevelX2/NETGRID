# Originalset-Karten-Nachtest 2026-05-14-B

## Auswahl

Auswahlart: zufällige 10er-Stichprobe aus komplexeren bereits decklegalen Originalset-Karten. Karten aus `docs/reviews/originalset-spotchecks/register.md` Runde 2026-05-14-A wurden ausgeschlossen.

Gezogene Karten:

1. `onr_v1_009_butcher-boy` - Butcher Boy
2. `onr_v1_020_dupre` - Dupré
3. `onr_v1_035_invisibility` - Invisibility
4. `onr_v1_046_pattels-virus` - Pattel's Virus
5. `onr_v1_049_pox` - Pox
6. `onr_v1_078_arasaka-owns-you` - Arasaka Owns You
7. `onr_v1_197_data-fort-reclamation` - Data Fort Reclamation
8. `onr_v1_241_fang-2-0` - Fang 2.0
9. `onr_v1_325_hacker-tracker-central` - Hacker Tracker Central
10. `onr_v1_349_aardvark` - Aardvark

## Kurzfazit

Ausgangsbefund: Keine der zehn Karten war vollständig als "rund" einzustufen, wenn Engine-Korrektheit, Effektvollständigkeit, Testabdeckung und Chronik zusammen bewertet wurden. Nach der Nacharbeit sind die gefundenen funktionalen Lücken geschlossen und die Chronik-Lücken der Stichprobe mit fokussierten Tests abgesichert.

Nacharbeitsstand vom 2026-05-14: Die funktionalen Lücken für Butcher Boy, Dupré, Pattel's Virus, Arasaka Owns You, Fang 2.0 und Hacker Tracker Central wurden umgesetzt und mit fokussierten Engine-Tests abgesichert. Die Chronik wurde für die neuen Trace-/Run-Lock-, Arasaka-Replacement-, V1.8.1-Counter-, Recurring-Credit-, Install-Tax-, Data-Fort-Reclamation- und Aardvark-Payloads erweitert. Die Runde ist damit als nachgearbeitet und regressionsgeschützt einzustufen; nur eine mögliche Detailverfeinerung für automatische Butcher-Boy-Start-of-turn-Credits bleibt optional.

## Einzelergebnisse

| Karte | Engine | Chronik | Teststand | Bewertung |
|---|---|---|---|---|
| Butcher Boy | Nacharbeit umgesetzt: keine Install-/Recurring-Platzhalter mehr; erfolgreiche HQ-Runs legen Virus-Counter auf Butcher Boy, je zwei Counter zahlen beim Runner-Zugstart 1 Credit. | Start-of-turn-Credit läuft als automatischer Start-of-turn-Effekt; kein Hidden-Info-Leak. | Fokussierter V1.9.12-Test deckt HQ-Runs und Start-of-turn-Credit. | Funktional gefixt |
| Dupré | Nacharbeit umgesetzt: `1` bricht Code-Gate-Subroutinen, `2` pumpt +1 Stärke, genutzte Runs legen Strength-Counter, Fortwechsel ignoriert/verliert alte Counter. | Breaker-Aktionen laufen über bestehende Run-Chronik. | Fokussierter V1.9.15-Test deckt Break, Counter und Fortwechsel-Reset. | Funktional gefixt |
| Invisibility | Grundsätzlich plausibel: Stealth-Recurring-Quelle wird installiert, refreshed und bei Run-Kosten als nicht-noisy-geeignete Quelle berücksichtigt. | Installation zeigt die geladenen Recurring Credits in Beschreibung und Chip. | V1.9.16-Test deckt Refresh; vorhandene generische Stealth-Tests decken noisy/non-noisy-Pfad; Chroniktest deckt Recurring-Credit-Install. | Engine ok, Chronik ergänzt |
| Pattel's Virus | Nacharbeit umgesetzt: erfolgreiche Runs mit genau einem vollständig gebrochenen ICE legen den Counter direkt; bei mehreren vollständig gebrochenen ICE öffnet eine öffentliche Runner-Zielwahl. | Counter-Platzierung und Zielwahl werden als Pattel's-Virus-Ereignis erzählt. | V1.8.1-Tests decken Ein-ICE-Fall, Mehr-ICE-Zielwahl und Purge; Chroniktest deckt Countereintrag. | Gefixt und getestet |
| Pox | Engine funktioniert: erfolgreiche Runs erzeugen servergebundene Counter, je zwei Counter erhöhen Installkosten, Purge leert die Struktur. | Counteraufbau und spätere ICE-Install-Zusatzkosten werden in der Chronik sichtbar. | V1.8.1-Tests decken Trigger, Tax und Purge; Chroniktest deckt Pox-Counter und Install-Tax. | Gefixt und getestet |
| Arasaka Owns You | Nacharbeit umgesetzt: Karte öffnet bei drohendem Flatline-Damage ein Replacement, verhindert den Schaden, trasht sich, entfernt Core Damage/Tags, zieht bis Handlimit, gibt 10 Credits und setzt Aktions- und Agenda-Punkt-Schuld. | Chronik beschreibt Flatline-Verhinderung, gezogene Karten, Tags/Core Damage und Agenda-Schuld. | V1.9.19-Test und Chroniktest ergänzt. | Gefixt und getestet |
| Data Fort Reclamation | Engine-Pfad wirkt stark: private HQ-Auswahl, neues Remote, Install-/Rez-Sequenz, temporäre Credits vor Korp-Credits, Hidden-Info-Schutz und Replay/StateHash sind abgedeckt. | Install- und Rez-Sequenz werden mit verdeckter Auswahl, Counts und temporären/normalen Credits beschrieben. | V1.9.22-Test deckt Wrong-Side/Stale, PublicPayload, Hidden-Info und Replay/StateHash; Chroniktest ergänzt. | Gefixt und getestet |
| Fang 2.0 | Nacharbeit umgesetzt: erfolgreicher Trace endet den Run und blockiert weitere Runs, bis der Runner eine Aktion nutzt und 2 Credits zahlt. | Chronik zeigt Trace-Folge, Run-Ende und Entfernen der Sperre. | Fokussierter V1.9.14-Test und Chroniktest ergänzt. | Gefixt und getestet |
| Hacker Tracker Central | Nacharbeit umgesetzt: rezzed Hacker Tracker Central bekommt nach Trace-Versuchen Counter; Corp kann Counter zusätzlich zu Credits in Trace-Bids investieren. | Chronik zeigt ausgegebene und hinzugefügte HTC-Counter im Trace. | Fokussierter V1.9.14-Test und Chroniktest ergänzt. | Gefixt und getestet |
| Aardvark | Engine-Pfad wirkt richtig: Worm-Nutzung öffnet Korp-Choice, Rez trasht den Worm, spätere Worm-LegalActions auf dem Fort sind blockiert, Replay/StateHash ist getestet. | Choice-Auflösung erzählt Rez/Trash-Worm und Decline-Pfad als Aardvark-Ereignis. | V1.9.9-Test deckt Choice, Blockade und Replay/StateHash; AI-Choice-Test vorhanden; Chroniktest ergänzt. | Gefixt und getestet |

## Prüfbasis

- `corepack pnpm --filter @netgrid/engine test` grün: 318 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` grün: 119 Tests.
- `corepack pnpm --filter @netgrid/catalog test` grün: 44 Tests.
- `corepack pnpm typecheck` grün.

## Empfohlene Reihenfolge

1. Optional: Butcher Boy bei Bedarf noch mit explizitem Chronik-Effekt für automatische Start-of-turn-Credits verfeinern.
2. Folgerunden-Auswahl weiter gegen das Register filtern und keine Karten aus 2026-05-14-A/B erneut zufällig ziehen, außer bei gezieltem Regressionsverdacht.
