# Match A36A9664: Abschlussreview der Corp-Plan-Korrekturen

Stand: 2026-07-30

Ausgangsmatch: `match_a36a9664458303fc`

Status: vollständig umgesetzt und verifiziert

## Ausgangslage

Der vollständige Audit bewertete alle 124 Corp-KI-Entscheidungen gegen
historische LegalActions, Corp-PlayerView, Plan-first-Trace und
Folgeereignisse. Sechs Zustände reproduzierten auf unverändertem aktuellem
Code als echte Verhaltensregression. Ein siebter historischer Rush-Fehler war
bereits behoben und blieb als grüne Gegenprobe erhalten.

Die Fehler lagen nicht in Kartendaten oder Regeln, sondern in der
Zusammensetzung zuständiger Pläne:

- Eine Counter Bank sollte durch ihre eigene Agenda-Installation ersetzt
  werden.
- Agenda-Schutz und tatsächliche Rez-Finanzierung waren nicht über den
  Planungshorizont gebunden.
- Terminale R&D-Gefahr fiel bei unvollständiger Bewertung auf „Defense
  vertagen“ zurück.
- Normale Aktionen konnten nach erreichtem Liquiditätsziel ersatzlos
  verfallen.
- Action-Capacity-Operationen konnten als bloße Handüberlauf-Konversion
  gespielt werden.

## Umgesetzte Korrekturen

### 1. Counter Bank und Agenda bleiben getrennte konkrete Objekte

- Der Counter-Bank-Plan konsumiert `rootReplacement` und verwirft jede
  Agenda-Installation, die die gebundene Bank ersetzen würde.
- Bank, Agenda, Quellserver und Zielserver sind als konkrete Instanz- und
  Server-IDs gebunden.
- Der positive Pfad installiert die Agenda in einem anderen oder neuen
  Remote und erhält die geladene Bank für den anschließenden Handoff.
- Same-Root-Replacement ist eine negative Gegenprobe; Cross-Remote-Handoff
  eine positive.

### 2. Neue Remotes behalten ihren Score-/Defense-Zusammenhang

- Ein Defense-Schritt auf `new_remote` darf nach der Engine-Erzeugung des
  echten Remotes genau dann zum Score-Parent zurückkehren, wenn die konkrete
  installierte ICE-Instanz eindeutig genau einem neuen Remote zugeordnet
  werden kann.
- Die Fortsetzung ist damit an den tatsächlichen Ausführungsbeleg gebunden
  und keine globale Erlaubnis, irgendeine Agenda hinter irgendein ICE zu
  legen.

### 3. Agenda-Rush und Schutz werden nach sichtbarem Risiko begrenzt

- Ein bereits installierter, bezahlbarer ICE-Schritt kann ein begrenztes
  Rush-Fenster eröffnen.
- Ist das ICE durch sichtbare Runner-Werkzeuge beantwortbar, bleibt dieses
  Fenster nur für eine Ein-Punkt-Agenda offen und nur dann, wenn deren
  Diebstahl dem Runner keinen Matchpoint geben würde.
- Mehrpunkt- und Matchpoint-Exposition benötigen den normalen finanzierten
  Schutzvertrag. Dadurch bleibt ein vertretbarer früher Rush möglich, ohne
  den historischen D24-Fehler wieder zu öffnen.

### 4. Bezahlte zweite Agenda-Schicht wird als produktiv erkannt

- Im exakten Rez-Fenster zählt eine bezahlbare Aktivierung des aktuell
  erreichten ICE als produktiv, wenn die bekannte Vorher-/Nachher-Bewertung
  eine positive Runner-Pfadsteuer ausweist.
- Der Fallback ist auf ein sichtbares Agenda-Remote und die konkrete
  angegangene ICE-Instanz begrenzt. Leere Remotes, andere Positionen und
  unvollständige Gratis-Resource-Quotes werden nicht freigegeben.
- Die zentrale HQ-Route erhielt dadurch keine pauschale zusätzliche
  Rez-Freigabe.

### 5. Terminale R&D-Defense bleibt im Defense-Plan handlungsfähig

- Kann die zentrale Allokation nicht vollständig bestimmt werden, darf der
  Defense-Plan bei terminalem R&D-Agendapunktrisiko genau eine zweite
  zentrale Schicht vorbereiten.
- Der Fallback stapelt nicht beliebig weiter und wurde bewusst auf R&D
  begrenzt.
- Exakte Alternativen, kohärente Score-Pläne, bereits gebundene
  Score-Protection und ausführbare geschützte Score-Projekte behalten
  Vorrang.

### 6. Normale Aktionen und Action Capacity werden getrennt behandelt

- Der Liquiditätsplan bindet ein endliches Ziel aus aktuellem Bestand und
  verbleibenden normalen Aktionen. Er bleibt bis zur produktiven Nutzung
  dieser Kapazität stabil, ohne stärkere Score- oder Defense-Pläne zu
  verdrängen.
- Der Scheduler unterscheidet erschöpfte freiwillige Kapazität von
  tatsächlich eingeschränkter Kapazität.
- Action-Capacity-Karten sind aus der generischen HQ-Overflow-Konversion
  ausgeschlossen. Sie bleiben nur über ein zuständiges Planmodul mit
  konkreter ausführbarer Restzuglinie zulässig.

## Routenbudget und Notfallwertung

Die Cross-Remote-Counter-Bank-Route vermeidet die zuvor verwendete teure
Ersatzroute. Kandidatenreserven enthalten die Kosten der konkret gewählten
Aktionen, verbleibende Advancement-Kosten und den bedingten
Post-Score-Floor. Eine terminale Notfallwertung bleibt erlaubt: Eine Agenda
darf trotz ökonomischem Nachteil gescored werden, wenn dies einen
unmittelbaren Spielverlust verhindert.

## Architektururteil

Die Korrekturen bleiben innerhalb der vorgesehenen Planarchitektur:

- ICE-Installation und Rezzen bleiben beim Defense-Plan.
- Agenda-Installation, Handoff und Scoring bleiben beim Score-/
  Counter-Bank-Plan.
- Liquiditätsziel und Action-Capacity-Überlauf bleiben bei Economy-,
  Scheduler- und Turn-Completion-Verträgen.
- Die Runtime komponiert strukturierte Planfakten und enthält keine
  Kartenname-Sonderregel für Vapor Ops, Corporate War oder Overtime
  Incentives.
- Jede ausgeführte Aktion stammt weiterhin aus Engine-erzeugten
  `LegalActions`.

## Verifikation

- Historische Zielcheckpoints und enge Nachbarproben: grün.
- Direkt betroffene Plan-, Runtime- und Shadow-Gruppen nach Formatierung:
  5 Dateien, 194 Tests grün.
- Vollständige AI-Suite seriell: 540 Dateien, 4.405 Tests grün in 473,3
  Sekunden.
- Vollständige AI-Suite über den neuen normalen Parallelpfad: dieselben 540
  Dateien und 4.405 Tests grün in 187,3 Sekunden.
- AI-Replay-/Simulation-Gegenprobe: 3 Dateien, 9 Tests grün.
- Engine-Replay-Vertrag: 1 Datei, 6 Tests grün.
- AI-Typecheck mit 6-GB-Node-Heap grün. Der Standardheap von 4 GB reichte
  lokal nicht aus; es lag kein TypeScript-Fehler vor.
- `check:ai`, `check:ai-action-capacity`,
  `check:card-function-abstraction`, Package Boundaries und Engine Source
  Structure grün.
- `format:changed` und `git diff --check` grün.

## Dauerhafter Teststandard

`corepack pnpm test:ai:shards` startet nun die drei vorhandenen festen
AI-Shards parallel und hält jeden Shard intern auf einem Vitest-Worker. Der
gemessene vollständige Lauf wurde dadurch um 60,4 Prozent verkürzt und um
den Faktor 2,53 beschleunigt.

Der serielle Fallback `corepack pnpm test:ai:shards:serial` bleibt für
nachgewiesenen Speicherdruck oder Instabilität erhalten. Mehr Shards oder
Worker werden erst nach dokumentierter Laufzeit-, RAM-, Determinismus- und
Stabilitätsmessung zum Standard.

## Bewusst offene qualitative Fragen

1. Die Änderungen beweisen die sechs beseitigten Ursachen, nicht allgemein
   optimale Spielstärke oder ein ideales Rush-Verhältnis.
2. Ob drei parallele Shards auf dem 14-Kern-System weiter erhöht werden
   sollten, ist eine reine Testinfrastrukturfrage und benötigt eine
   Ressourcenmessung. Sie verändert das Spielverhalten nicht.
3. D124 bleibt ein isolierter Cleanup-Prüffall. Im Match war dieser Abwurf
   nicht kausal für den unmittelbar folgenden Spielverlust und rechtfertigt
   keine globale Abwurfregel.
4. Mehrschichtige Defense wird weiterhin nach jedem Informations- und
   Aktionsgrenzpunkt neu geplant. Eine probabilistische Simulation aller
   zukünftigen Runner-Routen wäre ein eigenes, deutlich komplexeres Vorhaben.

## Führende Evidence

- Ausgangsaudit:
  `docs/reviews/ai/match-a36a9664-full-corp-ai-decision-audit-2026-07-30.md`
- Red Evidence:
  `docs/reviews/ai/match-a36a9664-corp-plan-red-evidence-2026-07-30.md`
- Paketprozess:
  `docs/architecture/ai/match-a36a9664-corp-plan-remediation-process-2026-07-30.md`
- Historische Checkpoints:
  `packages/ai/src/evaluation/decision-checkpoints/match-a36a9664-corp-plan-decision-checkpoints.test.ts`
