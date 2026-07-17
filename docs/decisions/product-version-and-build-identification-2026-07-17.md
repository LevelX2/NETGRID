# Produktversion und fortlaufende Build-Kennung

Status: `accepted`
Datum: 2026-07-17
Primärer Agent: `release-implementation-agent`

## Ausgangslage

Die bisher sichtbare Webclient-Version `V1.9.22` war an einen historischen
Releaseabschluss gebunden. Seitdem flossen zahlreiche Current-State-, Karten-,
KI- und Qualitätsänderungen ein, ohne dass die Anzeige weitergeführt wurde.
Dadurch beschrieb die sichtbare Nummer weder den aktuellen Entwicklungsstand
noch den weiterhin gültigen Version-0-Reifegrad zuverlässig.

## Entscheidung

NETGRID trennt ab sofort Produktreife und technischen Quellstand:

- Die sichtbare Produktversion lautet bis zu einer neuen ausdrücklichen
  Produktentscheidung `V0.9`.
- Daneben steht eine automatisch aus `git rev-list --count HEAD` ermittelte
  Buildnummer, zum Beispiel `V0.9 · Build 5527`.
- Ein nicht sauberer Arbeitsbaum ergänzt die sichtbare Buildnummer um `-dev`.
- Die Optionen zeigen zusätzlich Buildnummer, kurzen Commit-Hash,
  Commit-Zeitpunkt und den lokalen Entwicklungsstatus.
- Die Git-Metadaten werden beim Start beziehungsweise Build des Webclients
  ermittelt. Ein bereits laufender Webprozess übernimmt einen neuen Stand erst
  nach seinem Neustart.

## Verhältnis zu Releasebezeichnungen

Historische und zukünftige fachliche Releasebezeichnungen bleiben
Meilenstein-, Scope- und Gatekennungen in Roadmap und Abschlussartefakten. Sie
werden nicht mehr automatisch als sichtbare Produktversion verwendet. Ein
Final Review dokumentiert weiterhin seinen Zielrelease-Stand; die sichtbare
Produktversion ändert sich nur bei einer eigenen Produktreifeentscheidung.

## Technischer Vertrag

- Produktversion: `apps/web/lib/app-build-info.ts`
- Git-Ermittlung und Einbettung: `apps/web/next.config.ts`
- Sichtbare Kurzform: Kopfzeile des Webclients
- Detaillierte Form: Optionsbereich des Webclients
- Fallback ohne Git-Metadaten: `Build lokal` und `nicht verfügbar`

## Akzeptanz

- Kopfzeile zeigt `V0.9 · Build <Nummer>` beziehungsweise bei lokalen
  Änderungen `V0.9 · Build <Nummer>-dev`.
- Die Optionen zeigen Produktversion, Build, Commit und Quellstand.
- Test, Typecheck und Produktionsbuild des Webclients sind grün.
