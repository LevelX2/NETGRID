---
activityId: act-2026-07-31-mouse-expose-chronicle-summary-and-wording
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Mouse-Expose in der Chronik zusammenfassen und zeitlich eindeutig benennen

## Ziel

Die Chronik stellt die Aktivierung von `Mouse` und das unmittelbar zugehörige
Expose-Ergebnis als eine verständliche Meldung dar. Der deutsche Text macht
deutlich, dass die Korp-Karte nur vorübergehend gezeigt wird und dadurch weder
gerezzed noch dauerhaft aufgedeckt bleibt.

## Kontext und Quellen

- Nutzer-Playtest und Screenshot vom 31.07.2026: Für die dritte Runner-Aktion
  erscheinen direkt nacheinander die Meldungen „Der Runner hat Mouse genutzt.“
  und „Der Runner hat mit Mouse Bioweapons Engineering in Remote 1 · Root 1
  aufgedeckt.“
- Der Kartentext von `Mouse` in
  `data/cards/originalset-v1-cards.json` lautet: „Expose a card installed
  inside a data fort.“
- Die lokale Regelreferenz
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
  unterscheidet die Begriffe ausdrücklich:
  - Regel 1.21.3: `reveal` zeigt die Vorderseite allen Spielern und versetzt
    die Karte anschließend in ihren vorherigen Zustand zurück.
  - Regel 1.21.4: `expose` ist ein Reveal, das nur installierte, ungerezzte
    Karten betreffen kann.
- „angesehen“ oder „eingesehen“ wäre deshalb als allgemeine Übersetzung
  ebenfalls missverständlich, weil es einen nur für den Runner privaten Blick
  nahelegt. Als bevorzugter Textkandidat soll „vorübergehend offengelegt“
  geprüft werden, zum Beispiel: „Der Runner hat mit Mouse Bioweapons
  Engineering in Remote 1 · Root 1 vorübergehend offengelegt.“
- Betroffene Projektion und Regressionen liegen voraussichtlich in
  `apps/web/app/chronicle.ts`, `apps/web/features/chronicle/` und
  `apps/web/app/chronicle.test.ts`. Die PublicEvents dürfen für Replay und
  Audit weiterhin getrennt bestehen bleiben.

## Scope

- Die generische Mouse-Aktivierung und ihr direkt zugehöriges
  Einzelkarten-Expose in der sichtbaren Chronik zu genau einem Eintrag
  zusammenführen oder die redundante Aktivierungsmeldung gezielt
  unterdrücken.
- Die Zusammengehörigkeit über belastbare Aktions-/Payload-Metadaten
  bestimmen; nicht lediglich zwei zufällig benachbarte Meldungen anhand ihrer
  Texte zusammenziehen.
- Aktionsnummer beziehungsweise Aktionsverbrauch am kombinierten Eintrag
  erhalten.
- Quelle (`Mouse`), Zielkarte (`Bioweapons Engineering`) und exakte öffentliche
  Position (`Remote 1 · Root 1`) weiterhin als Karten-/Ortsreferenzen und
  Chronik-Chips verfügbar halten.
- Für temporäre Einzelkarten-Expose-Meldungen eine deutsche Formulierung
  festlegen, die die Rückkehr in den vorherigen Sichtbarkeitszustand klarer als
  das bisherige bloße „aufgedeckt“ vermittelt. Vergleichbare
  quellengebundene Einzelkarten-Expose-Pfade wie `SeeYa` auf konsistente
  Verwendung prüfen.
- Fokussierte Chronikregressionen für menschlichen Runner, Runner-KI und die
  gegnerische Perspektive ergänzen.

## Nicht im Scope

- Keine Änderung an Mouse-Kosten, LegalActions, Zielauswahl, Expose-Regeln,
  Rez-Status oder tatsächlicher Sichtbarkeitsdauer.
- Keine Zusammenlegung oder Löschung autoritativer Engine-/PublicEvents; die
  Verdichtung betrifft nur die Chronikprojektion.
- Keine pauschale Umbenennung aller Reveal-, Access- oder dauerhaften
  Sichtbarkeitseffekte. Insbesondere Batch-Expose durch `Schematics Search
  Engine`, Access-Reveals, Archives-Aufdeckung und anhaltende Sichtbarkeit
  durch `I Spy` behalten ihre jeweils eigenen Verträge.
- Kein Gruppieren unabhängiger Kartenaktionen, nur weil sie direkt
  hintereinander protokolliert wurden.

## Akzeptanzkriterien

- [ ] Eine erfolgreich aufgelöste Mouse-Aktion erzeugt in der sichtbaren
      Chronik genau eine inhaltlich vollständige Meldung statt der bisherigen
      Aktivierungs- und Ergebnismeldung als zwei Einträge.
- [ ] Der Eintrag nennt Runner, Mouse, Zielkarte und öffentliche Position und
      trägt die richtige Aktionsnummer beziehungsweise den richtigen
      Aktionsverbrauch.
- [ ] Die gewählte deutsche Expose-Formulierung macht den temporären Charakter
      deutlich und behauptet weder Rez noch dauerhaftes Faceup; die
      Terminologieentscheidung ist im Regressionstest oder einem passenden
      UI-Terminologie-Helper verankert.
- [ ] „angesehen/eingesehen“ wird nicht als allgemeiner Ersatz verwendet,
      solange Expose regelgemäß allen Spielern zeigt; ein nur privater
      Look-Effekt bleibt terminologisch unterscheidbar.
- [ ] Vergleichbare quellengebundene Einzelkarten-Expose-Meldungen verwenden
      dieselbe Terminologie oder eine ausdrücklich begründete Abweichung.
- [ ] Fehlgeschlagene, abgebrochene oder noch nicht aufgelöste
      Aktivierungsversuche werden nicht fälschlich als erfolgreiches Expose
      zusammengefasst.
- [ ] Unabhängige benachbarte Aktionen sowie Batch-, Access- und anhaltende
      Sichtbarkeitseffekte bleiben getrennt und korrekt formuliert.
- [ ] PublicEvents, Hidden-Info-Redaction, Reconnect, Replay und StateHash
      bleiben unverändert und side-sicher.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Bevorzugt die redundante generische Aktivierungsprojektion anhand der
  vorhandenen Source-, Action- und Expose-Metadaten mit dem spezifischeren
  Ergebnis verheiraten beziehungsweise unterdrücken. Keine textbasierte
  Nachbarschaftsheuristik einführen.
- Als kompakte Zielformulierung zuerst
  „Der Runner hat mit Mouse Bioweapons Engineering in Remote 1 · Root 1
  vorübergehend offengelegt.“ prüfen. Falls eine andere deutsche Übersetzung
  gewählt wird, muss sie die Regeln 1.21.3 und 1.21.4 ebenso eindeutig
  transportieren.
- Bestehende `SeeYa`-Chroniktests sind geeignete Gegenfälle für konsistente
  Expose-Terminologie; Schematics- und Access-Tests begrenzen den generischen
  Umbau.

## Ergebnisnotiz

Noch offen.
