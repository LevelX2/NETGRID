---
jobId: spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers
status: done
startedAt: 2026-05-16T13:45:00Z
completedAt: 2026-05-16T14:00:00Z
createdAt: 2026-05-16T12:30:00+02:00
requiresImplementation: true
priority: high
sourceBlockedJobs:
  - spotcheck-2026-05-15-trace-cache-ambush
cards:
  - cardId: onr_v1_082_deal-with-militech
    title: Deal with Militech
  - cardId: onr_v1_091_hunt-club-bbs
    title: Hunt Club BBS
  - cardId: onr_v1_110_sneak-preview
    title: Sneak Preview
---

# Originalset-Spotcheck Follow-up Job spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers

## Herkunft

Dieser Folgejob zieht die Hidden-Zone-, Counter-Choice- und Temporary-Install-Removal-Conditions aus `blocked/spotcheck-2026-05-15-trace-cache-ambush.md` in einen kleineren Inbox-Scope.

## Aktueller Befund

### onr_v1_082_deal-with-militech - Deal with Militech

Status: offen.

Aktueller Runtime-Stand: Stack-Programmsuche und Reveal/Shuffle-Pfad. Der lokale Vertrag verlangt Research-Agenda-Turn-History und Counter auf installierten Icebreakern.

Umsetzung:

- Führenden Vertrag finalisieren und generische Stack-Suche entfernen, falls sie nicht mehr gilt.
- Turn-History für befreite Research-Agenda in diesem Zug source-bound prüfen.
- Counterverteilung auf installierte Icebreaker als LegalAction/Choice modellieren.
- Zieltyp, installierten Zustand, Auswahlmenge, Side und StateVersion in `applyAction` revalidieren.

Akzeptanz:

- Deal with Militech ist nur nach der finalen Research-Bedingung legal.
- Counter gehen exakt und nur auf legale installierte Icebreaker.
- Kein Stack-/Programmsuchpfad bleibt aktiv, falls der lokale Countervertrag gilt.

### onr_v1_091_hunt-club-bbs - Hunt Club BBS

Status: offen.

Aktueller Runtime-Stand: Top-of-stack-Reveal. Der lokale Vertrag verlangt Expose von bis zu drei installierten Corp-Karten.

Umsetzung:

- Expose-Vertrag mit `minSelections: 0`, `maxSelections: 3` und ausschließlich legalen installierten verdeckten Corp-Karten modellieren.
- Zielidentitäten dürfen vor der Runner-Choice nicht in falsche Views, KI-Inputs oder PublicPayloads leaken.
- Jedes Ziel, Zielanzahl, Side, StateVersion und aktuelle Installations-/Rez-Situation in `applyAction` erneut prüfen.

Akzeptanz:

- Hunt Club BBS offenbart ausschließlich gewählte legale Zielkarten.
- Mehr als drei Ziele, falsche Zone oder stale Ziele werden abgelehnt.
- PublicPayload listet nur erlaubte Expose-Ergebnisse.

### onr_v1_110_sneak-preview - Sneak Preview

Status: offen nach aktuellem Codebefund.

Aktueller Runtime-Stand im Code: einfacher Stack-Top-Reveal. Einige Szenarioartefakte beschreiben bereits den vollständigen Temporary-Install-Vertrag; der tatsächliche Resolver muss deshalb synchronisiert werden.

Umsetzung:

- Heap-oder-Stack-Programminstall als private Runner-Choice modellieren.
- Stack-Suche mit Shuffle und deterministischer Replay-Spur koppeln; Heap-Pfad ohne unnötigen Shuffle.
- Temporäres Install-Merkmal speichern und End-of-turn-Return in die Grip auslösen, falls dieselbe Instanz noch installiert ist.
- Memory-/Hosting-Revalidation, vorzeitigen Trash, wrong-side/stale und PublicPayload-Leakscan ergänzen.

Akzeptanz:

- Sneak Preview installiert genau ein legales Programm aus Heap oder Stack ohne Kosten.
- Stack-/Heap-Optionen bleiben runner-privat.
- Das temporäre Programm kehrt am Runner-Zugende korrekt zurück oder wird bei Zonenwechsel nicht doppelt bewegt.

## Empfohlene Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

## Umsetzung 2026-05-16

Status: umgesetzt und bereit für lokalen Commit.

### Deal with Militech

- Der alte Stack-Search-/Reveal-/Shuffle-Resolver wurde durch den lokalen Vertrag ersetzt.
- `stealAgenda` setzt ein Runner-Turn-Flag für in diesem Zug befreite Research-Agendas.
- `Deal with Militech` ist nur mit diesem Research-Flag legal und legt einen `militech`-Counter auf jeden installierten Runner-Icebreaker.
- Icebreaker-Stärke berücksichtigt Militech-Counter zusätzlich zu temporären Strength-Modifikatoren und bestehenden Run-Boni.
- PublicPayload enthält Countertyp, Zielanzahl und Definitionen, aber keine privaten Zoneninformationen.

### Hunt Club BBS

- Der alte Stack-Top-Reveal wurde durch eine private Runner-Choice ersetzt.
- Legale Ziele sind ausschließlich installierte, unrezzed Korp-Karten; `minSelections: 0`, `maxSelections: 3`.
- Vor der Runner-Auswahl sieht die Korp keine Choice und die Runner-Choice zeigt Positionslabels statt Zielidentitäten.
- Bei Resolution werden alle Ziele erneut gegen aktuellen Installations-/Rez-Zustand revalidiert; PublicPayload enthält nur die tatsächlich exponierten Definitionen und öffentliche Serverlabels.

### Sneak Preview

- Der alte einfache Stack-Top-Reveal wurde durch den zweistufigen Heap-/Stack-Programminstall ersetzt.
- Die Quelle wird zuerst runner-privat gewählt; Stack-Programmwahl erhält `stackSearchResolution` mit `install_program`, öffentlichem Reveal und Shuffle.
- Heap-Installationen shufflen nicht und bleiben runner-privat bis zum Install-Ergebnis.
- Das gewählte Programm wird kostenlos, aber mit Unique- und Memory-Revalidation installiert und als temporär getrackt.
- Am Runner-Zugende kehrt dieselbe Instanz in die Grip zurück, falls sie noch installiert ist; bei vorzeitigem Zonenwechsel wird nichts doppelt bewegt.

### Begleitdaten

- Shared-Kartentexte/Mechanics, Catalog-Text-Gates, AI-Hints und V1.9.12-Manifest wurden auf die finalen Resolververträge synchronisiert.
- PublicPayload-Schema und Chronik-Kontext erlauben die neuen Ziel-/Return-/Temporary-Felder ohne Hidden-Info-Leak.

## Checks 2026-05-16

- `corepack pnpm --filter @netgrid/engine test` - grün, 462 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Testdateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 2 Testdateien / 48 Tests.
- `corepack pnpm typecheck` - grün.
