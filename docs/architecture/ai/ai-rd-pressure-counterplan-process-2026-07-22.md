# KI: wirkungsbasierter Purge und R&D-Gegenplan

Status: in Bearbeitung

## Quelle und Ziel

Ausgangspunkt ist das vollständig gespeicherte Match
`match_5caedbfa15e0ba79`. Die Corp-KI purgte dort in der Schlussphase
wiederholt je einen wirkungslosen `Highlighter`- und `Garbage In`-Counter,
verlor dadurch jeweils drei Folgeaktionen und ließ den dauerhaft billigen
R&D-Zugang bestehen. Zusätzlich meldet der Deck-Audit für
`Overtime Incentives` das Feld `actionCapacityProfiles` ohne nachgewiesenen
Consumervertrag.

## Gesamtziel

Die Corp-KI soll Purges nach der tatsächlich verhinderten Kartenwirkung und
nicht nach einer bloßen Counter-Summe bewerten. Sichtbarer, wiederholter
R&D-Druck soll einen persistenten Gegenplan auslösen, der wirksames ICE,
Rez-Finanzierung und Verteidigungsbeschaffung vor wirkungslosen Purges
priorisiert. `Overtime Incentives` soll über einen echten Runtime-Consumer
für seine Action-Capacity-Semantik verfügen und den Deck-Audit bestehen.

## Invarianten

- Die KI verwendet ausschließlich `PlayerView`, `PublicEvents` und
  `LegalActions`; keine verdeckten Karten oder Decklisten.
- Die Rules Engine bleibt die einzige Legalitäts- und Regelautorität.
- Countertypen werden anhand ihrer konkreten sichtbaren Wirkung bewertet:
  ein einzelner `Highlighter`-Counter erzeugt noch keinen zusätzlichen
  Zugriff und ein einzelner `Garbage In`-Counter noch keinen Gratis-Trash.
- Ein früherer positiver Fall mit zwei `Highlighter`-Countern und offenem R&D
  muss weiterhin einen dringenden Purge erlauben.
- Der R&D-Gegenplan darf eine unmittelbar sichere Scoreaktion nicht
  verdrängen und muss die sichtbare Breaker- und Creditlage berücksichtigen.
- Ein Consumervertrag darf nur registriert werden, wenn produktiver
  Runtime-Code das Feld tatsächlich konsumiert.

## Paketfolge

### RDC-01 – Reproduzierbare Entscheidungsevidence

- Entscheidungs-Checkpoints aus dem letzten Match für den wirkungslosen
  Purge und die anschließende Purge-Schleife erfassen.
- Den bestehenden positiven `Highlighter`-Purge-Checkpoint als
  Gegenbeispiel festhalten.
- Die erwartete Verhaltensänderung zunächst rot nachweisen.
- Done-Gate: Checkpoints sind deterministisch replaybar; die neue Erwartung
  scheitert vor dem Fix aus dem fachlich erwarteten Grund.
- Commit: `test(ai): capture ineffective purge loop decisions`

### RDC-02 – Wirkungsbasierte Purge-Semantik

- Purge-Nutzen pro Countertyp und Wirkungsschwelle berechnen.
- `Highlighter 1`, `Garbage In 1` und deren Kombination dürfen keinen
  künstlichen Notfallwert erhalten.
- Aktive Schwellen und echte Mehrzugriffs-/Trash-Gefahr bleiben relevant.
- Done-Gate: neue Purge-Regressionen sowie der frühere positive
  Highlighter-Checkpoint sind grün.
- Commit: `fix(ai): value purge by active virus effects`

### RDC-03 – Persistenter R&D-Verteuerungsplan

- Wiederholten sichtbaren R&D-Erfolg und sichtbare R&D-Synergien in einen
  dauerhaften Corp-Gegenplan überführen.
- Wirksames R&D-ICE, notwendige Rez-Credits und Ziehen nach einer
  Verteidigungsoption priorisieren, solange der Zugang wirtschaftlich zu
  günstig bleibt.
- Wirkungslose Purges dürfen diesen Plan nicht unterbrechen; unmittelbare
  Scorefenster bleiben vorrangig.
- Done-Gate: Checkpoints belegen Verteidigungsbeschaffung statt Purge-Schleife
  und vorhandene Scoreline-/Central-Defense-Regressionen bleiben grün.
- Commit: `fix(ai): persist an rd pressure counterplan`

### RDC-04 – Overtime-Incentives-Consumer

- `actionCapacityProfiles` in der produktiven Semantic Runtime konsumieren.
- Den Auditvertrag an diesen konkreten Consumer binden.
- Regressionen für `Overtime Incentives` und den betroffenen Deck-Audit
  ergänzen.
- Done-Gate: kein `hint_field_without_consumer_contract` für
  `Overtime Incentives`; Feldwirkung ist durch einen Runtime-Test belegt.
- Commit: `fix(ai): consume action capacity profiles`

### RDC-05 – Abschluss und Integration

- Fokussierte Tests, AI-Typecheck, relevante AI-Gates und
  `git diff --check` ausführen.
- Wiederverwendbare Erkenntnisse in Review und Projektlog zurückführen.
- Aktuelles `main` defensiv integrieren, final prüfen und lokal nach `main`
  mergen.
- Worktree und Branch anschließend in Git und Dateisystem verifiziert
  entfernen.
- Commit: `docs(ai): review rd pressure counterplan`

## Automatische Fehlerbehandlung

Ein nicht reproduzierbarer Checkpoint oder ein Hidden-Info-/LegalAction-Verstoß
blockiert das jeweilige Paket. Gatefehler werden auf die kleinste Änderung
zurückgeführt. Es werden keine Fallbacks, kartennamenspezifischen
Entscheidungsabkürzungen oder Audit-Allowlisten eingeführt, um Fehler zu
verdecken.

## Worktree und Integration

- Worktree: `C:\Projekte\NETGRID_AI_RD_PRESSURE_COUNTERPLAN`
- Branch: `codex/ai-rd-pressure-counterplan`
- Basis: lokales `main` bei Prozessstart (`2ece51609`)
- Ziel: lokaler Merge nach `main`, kein Push.

## Controller-Prompt-Kern

> /Goal Arbeite RDC-01 bis RDC-05 vollständig und sequenziell im benannten
> Worktree ab. Erzeuge zuerst spielgleiche rote Entscheidungsevidence,
> implementiere danach jedes Fix-Paket getrennt, führe dessen Done-Gates aus
> und committe es. Integriere am Ende defensiv nach `main` und entferne
> Worktree und Branch verifiziert. Keine Fallbacks oder Audit-Ausnahmen.

## Abschlusskriterien

- Inaktive einzelne Virus-Counter lösen keinen Purge mehr aus.
- Aktive `Highlighter`-Mehrzugriffsgefahr kann weiterhin einen Purge auslösen.
- Die Corp verfolgt bei wiederholtem billigem R&D-Zugriff einen sichtbaren,
  persistenten Verteuerungsplan.
- `Overtime Incentives.actionCapacityProfiles` besitzt einen nachgewiesenen
  produktiven Consumer und der Deck-Audit ist grün.
- Alle Paketcommits liegen auf `main`; Worktree und Arbeitsbranch sind
  entfernt.
