"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileUp,
  Images,
  LoaderCircle,
  Package,
  Play,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  MaintenanceAuthBoundary,
  MaintenanceReauthenticationDialog,
  MaintenanceSecurityControls,
  useMaintenanceAuth,
} from "../../maintenance-auth-ui";
import { resolveMaintenanceServerHttp } from "../../maintenance";
import {
  cardImageJobIsTerminal,
  cardImageJobProgressPercent,
  importReportFromJob,
  mappingInboxEntries,
  packInboxEntries,
  type CardImageCollectionInventory,
  type CardImageConflictMode,
  type CardImageInboxInventory,
  type CardImageMaintenanceJob,
  type CardImageProfileId,
} from "../../card-image-maintenance";

const CONFIGURED_SERVER_HTTP =
  process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

type PendingSensitiveAction = {
  label: string;
  path: string;
  body: Record<string, unknown>;
};

export default function CardImageMaintenancePage() {
  const [serverHttp] = useState(() =>
    resolveMaintenanceServerHttp(
      CONFIGURED_SERVER_HTTP,
      typeof window === "undefined" ? undefined : window.location.hostname,
    ),
  );
  const auth = useMaintenanceAuth(serverHttp);
  const [inventory, setInventory] =
    useState<CardImageCollectionInventory | null>(null);
  const [inbox, setInbox] = useState<CardImageInboxInventory | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMapping, setUploadingMapping] = useState(false);
  const [packUploadProgress, setPackUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [job, setJob] = useState<CardImageMaintenanceJob | null>(null);
  const [mapping, setMapping] = useState("");
  const [sourceMode, setSourceMode] = useState<"local" | "https">("local");
  const [conflictMode, setConflictMode] =
    useState<CardImageConflictMode>("fail");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [pack, setPack] = useState("");
  const [packConflictMode, setPackConflictMode] =
    useState<CardImageConflictMode>("fail");
  const [buildProfile, setBuildProfile] =
    useState<CardImageProfileId>("originalset");
  const [replaceBuild, setReplaceBuild] = useState(false);
  const [sensitiveAction, setSensitiveAction] =
    useState<PendingSensitiveAction | null>(null);

  const mappings = useMemo(() => mappingInboxEntries(inbox), [inbox]);
  const packs = useMemo(() => packInboxEntries(inbox), [inbox]);
  const activeJob = Boolean(job && !cardImageJobIsTerminal(job));
  const importReport = importReportFromJob(job);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [inventoryResponse, inboxResponse] = await Promise.all([
        auth.request("/api/storage/maintenance/card-images/inventory", {
          cache: "no-store",
        }),
        auth.request("/api/storage/maintenance/card-images/inbox", {
          cache: "no-store",
        }),
      ]);
      const inventoryPayload =
        await responsePayload<CardImageCollectionInventory>(
          inventoryResponse,
          "Bildbestand konnte nicht geladen werden.",
        );
      const inboxPayload = await responsePayload<CardImageInboxInventory>(
        inboxResponse,
        "Bild-Inbox konnte nicht geladen werden.",
      );
      setInventory(inventoryPayload);
      setInbox(inboxPayload);
      setMapping((current) =>
        current &&
        inboxPayload.entries.some(
          (entry) =>
            entry.relativePath === current && entry.usage === "mapping",
        )
          ? current
          : (mappingInboxEntries(inboxPayload)[0]?.relativePath ?? ""),
      );
      setPack((current) =>
        current &&
        inboxPayload.entries.some(
          (entry) => entry.relativePath === current && entry.usage === "pack",
        )
          ? current
          : (packInboxEntries(inboxPayload)[0]?.relativePath ?? ""),
      );
    } catch (loadError) {
      setError(
        errorMessage(
          loadError,
          "Kartenbildverwaltung konnte nicht geladen werden.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.status === "authenticated") void refresh();
  }, [auth.status]);

  useEffect(() => {
    if (!job || cardImageJobIsTerminal(job)) return;
    let closed = false;
    const timer = window.setInterval(() => {
      void auth
        .request(
          `/api/storage/maintenance/card-images/jobs/${encodeURIComponent(job.jobId)}`,
          { cache: "no-store" },
        )
        .then((response) =>
          responsePayload<{ job: CardImageMaintenanceJob }>(
            response,
            "Jobstatus konnte nicht geladen werden.",
          ),
        )
        .then(({ job: nextJob }) => {
          if (closed) return;
          setJob(nextJob);
          if (nextJob.status === "succeeded") {
            setNotice("Kartenbildjob erfolgreich abgeschlossen.");
            void refresh();
          }
          if (nextJob.status === "failed")
            setError(nextJob.error?.message ?? "Kartenbildjob fehlgeschlagen.");
        })
        .catch((pollError) => {
          if (!closed)
            setError(
              errorMessage(pollError, "Jobstatus konnte nicht geladen werden."),
            );
        });
    }, 750);
    return () => {
      closed = true;
      window.clearInterval(timer);
    };
  }, [job?.jobId, job?.status]);

  const startJob = async (path: string, body: Record<string, unknown>) => {
    setError("");
    setNotice("");
    const response = await auth.request(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await responsePayload<{ job: CardImageMaintenanceJob }>(
      response,
      "Kartenbildjob konnte nicht gestartet werden.",
    );
    setJob(payload.job);
  };

  const mappingBody = () => ({
    sourceMode,
    mapping,
    onExisting: conflictMode,
    rightsConfirmed,
  });

  const downloadTemplate = async (profile: CardImageProfileId | "all") => {
    setError("");
    try {
      const response = await auth.request(
        `/api/storage/maintenance/card-images/template?profile=${profile}`,
      );
      if (!response.ok)
        throw new Error(
          await responseError(response, "Vorlage konnte nicht geladen werden."),
        );
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `netgrid-card-images-${profile}.csv`;
      link.click();
      URL.revokeObjectURL(href);
    } catch (downloadError) {
      setError(
        errorMessage(downloadError, "Vorlage konnte nicht geladen werden."),
      );
    }
  };

  const uploadMapping = async (file: File) => {
    setUploadingMapping(true);
    setError("");
    setNotice("");
    try {
      const response = await auth.request(
        "/api/storage/maintenance/card-images/inbox/mappings",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            content: await file.text(),
          }),
        },
      );
      const uploaded = await responsePayload<{ relativePath: string }>(
        response,
        "Zuordnungsdatei konnte nicht bereitgestellt werden.",
      );
      await refresh();
      setMapping(uploaded.relativePath);
      setNotice(
        `${uploaded.relativePath} wurde in der Import-Inbox bereitgestellt.`,
      );
    } catch (uploadError) {
      setError(
        errorMessage(
          uploadError,
          "Zuordnungsdatei konnte nicht bereitgestellt werden.",
        ),
      );
    } finally {
      setUploadingMapping(false);
    }
  };

  const uploadPackDirectory = async (selectedFiles: FileList) => {
    const files = [...selectedFiles];
    setError("");
    setNotice("");
    try {
      if (!files.length)
        throw new Error("Der ausgewählte Paketordner ist leer.");
      const paths = files.map((file) => file.webkitRelativePath);
      const rootName = paths[0]?.split("/")[0];
      if (
        !rootName ||
        paths.some(
          (relativePath) =>
            !relativePath.startsWith(`${rootName}/`) ||
            relativePath.split("/").length < 2,
        )
      )
        throw new Error(
          "Der Browser hat keinen vollständigen Paketordner bereitgestellt.",
        );
      const packageFiles = files.map((file, index) => ({
        file,
        relativePath: paths[index]!.slice(rootName.length + 1),
      }));
      const invalidFile = packageFiles.find(
        ({ relativePath }) => !isUploadablePackFile(relativePath),
      );
      if (invalidFile)
        throw new Error(
          `Der Paketordner enthält die unzulässige Datei ${invalidFile.relativePath}.`,
        );
      if (
        !packageFiles.some(
          ({ relativePath }) => relativePath === "netgrid-card-image-pack.json",
        ) ||
        !packageFiles.some(({ relativePath }) => relativePath === "mapping.csv")
      )
        throw new Error(
          "Der gewählte Ordner enthält kein vollständiges IMG07-Paket.",
        );
      const safeRootName =
        rootName
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .replace(/^-+|-+$/g, "") || "bildpaket";
      const uploadName = `upload-${Date.now()}-${safeRootName}`.slice(0, 128);
      packageFiles.sort((left, right) =>
        left.relativePath === "netgrid-card-image-pack.json"
          ? 1
          : right.relativePath === "netgrid-card-image-pack.json"
            ? -1
            : left.relativePath.localeCompare(right.relativePath),
      );
      setPackUploadProgress({ completed: 0, total: packageFiles.length });
      let uploadedPackage = "";
      for (const [index, { file, relativePath }] of packageFiles.entries()) {
        const response = await auth.request(
          `/api/storage/maintenance/card-images/inbox/package-files?package=${encodeURIComponent(uploadName)}&path=${encodeURIComponent(relativePath)}`,
          {
            method: "POST",
            headers: { "content-type": "application/octet-stream" },
            body: file,
          },
        );
        const uploaded = await responsePayload<{
          package: string;
          file: string;
        }>(
          response,
          `Paketdatei ${relativePath} konnte nicht bereitgestellt werden.`,
        );
        uploadedPackage = uploaded.package;
        setPackUploadProgress({
          completed: index + 1,
          total: packageFiles.length,
        });
      }
      await refresh();
      setPack(uploadedPackage);
      setNotice(`${uploadedPackage} wurde in der Import-Inbox bereitgestellt.`);
    } catch (uploadError) {
      setError(
        errorMessage(
          uploadError,
          "Bildpaket konnte nicht bereitgestellt werden.",
        ),
      );
    } finally {
      setPackUploadProgress(null);
    }
  };

  if (auth.status !== "authenticated")
    return (
      <MaintenanceAuthBoundary auth={auth} title="Kartenbilder verwalten" />
    );

  return (
    <main style={pageShell}>
      <div style={page}>
        <header style={header}>
          <div style={headerTitle}>
            <Images size={26} aria-hidden="true" />
            <div>
              <h1 style={h1}>Kartenbilder verwalten</h1>
              <p style={subtle}>
                Lokale Vorbereitung · Spielruntime bleibt netzwerkfrei
              </p>
            </div>
          </div>
          <MaintenanceSecurityControls auth={auth}>
            <a href="/maintenance" style={linkButton}>
              <ArrowLeft size={16} aria-hidden="true" /> Maintenance
            </a>
            <button
              type="button"
              style={button}
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? <LoaderCircle size={16} /> : <RefreshCcw size={16} />}
              {loading ? "Lädt" : "Aktualisieren"}
            </button>
          </MaintenanceSecurityControls>
        </header>

        {sensitiveAction ? (
          <MaintenanceReauthenticationDialog
            label={sensitiveAction.label}
            onCancel={() => setSensitiveAction(null)}
            onConfirm={async (password) => {
              await auth.reauthenticate(password);
              const action = sensitiveAction;
              setSensitiveAction(null);
              await startJob(action.path, action.body);
            }}
          />
        ) : null}

        <p style={infoBox}>
          Lege Zuordnungstabellen, Bilder und übertragene Paketverzeichnisse
          unter <code>data/local-assets/card-image-import/inbox</code> ab. Die
          Oberfläche arbeitet ausschließlich mit relativen Einträgen aus dieser
          Inbox.
        </p>
        {error ? <p style={errorBox}>{error}</p> : null}
        {notice ? <p style={successBox}>{notice}</p> : null}

        <section style={metricGrid} aria-label="Kartenbildbestand">
          {(inventory?.sets ?? []).map((set) => (
            <article key={set.profileId} style={metric}>
              <span style={metricLabel}>{profileLabel(set.profileId)}</span>
              <strong style={metricValue}>
                {set.bound} / {set.total}
              </strong>
              <span style={subtle}>{set.missing} fehlen</span>
            </article>
          ))}
          {!inventory && loading ? (
            <article style={metric}>Bestand wird geladen …</article>
          ) : null}
        </section>

        <section style={panel}>
          <div style={panelHeader}>
            <div>
              <h2 style={h2}>Zuordnung importieren</h2>
              <p style={subtle}>
                Lokale Dateien oder ausdrücklich aktivierte HTTPS-Quellen.
              </p>
            </div>
            <div style={buttonRow}>
              <label style={button}>
                <FileUp size={15} />
                {uploadingMapping ? "CSV wird geladen" : "CSV auswählen …"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  disabled={uploadingMapping || activeJob}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadMapping(file);
                  }}
                />
              </label>
              {(["all", "originalset", "proteus", "classic"] as const).map(
                (profile) => (
                  <button
                    key={profile}
                    type="button"
                    style={button}
                    onClick={() => void downloadTemplate(profile)}
                  >
                    <Download size={15} />
                    {profile === "all"
                      ? "Gesamtvorlage"
                      : profileLabel(profile)}
                  </button>
                ),
              )}
            </div>
          </div>
          <div style={formGrid}>
            <Field label="Zuordnungstabelle">
              <select
                style={input}
                value={mapping}
                onChange={(event) => setMapping(event.target.value)}
              >
                <option value="">Keine CSV in der Inbox</option>
                {mappings.map((entry) => (
                  <option key={entry.relativePath} value={entry.relativePath}>
                    {entry.relativePath}
                  </option>
                ))}
              </select>
              {!mappings.length ? (
                <span style={subtle}>
                  Wähle eine CSV-Datei aus oder kopiere sie in die Import-Inbox.
                </span>
              ) : null}
            </Field>
            <Field label="Quellmodus">
              <select
                style={input}
                value={sourceMode}
                onChange={(event) =>
                  setSourceMode(
                    event.target.value === "https" ? "https" : "local",
                  )
                }
              >
                <option value="local">Nur lokale Quellen</option>
                <option value="https">Expliziter HTTPS-Import</option>
              </select>
            </Field>
            <ConflictField value={conflictMode} onChange={setConflictMode} />
          </div>
          {sourceMode === "https" ? (
            <label style={checkField}>
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(event) => setRightsConfirmed(event.target.checked)}
              />
              Ich darf die in der Zuordnung enthaltenen HTTPS-Quellen verwenden.
            </label>
          ) : null}
          <div style={buttonRow}>
            <button
              type="button"
              style={button}
              disabled={
                !mapping ||
                activeJob ||
                (sourceMode === "https" && !rightsConfirmed)
              }
              onClick={() =>
                void startJob(
                  "/api/storage/maintenance/card-images/imports/preview",
                  mappingBody(),
                ).catch((jobError) =>
                  setError(errorMessage(jobError, "Prüflauf fehlgeschlagen.")),
                )
              }
            >
              <Play size={16} /> Prüflauf
            </button>
            <button
              type="button"
              style={primaryButton}
              disabled={
                !mapping ||
                activeJob ||
                (sourceMode === "https" && !rightsConfirmed)
              }
              onClick={() =>
                setSensitiveAction({
                  label:
                    "Der Import schreibt geprüfte Bildvarianten und ändert die persönliche Bildbindung.",
                  path: "/api/storage/maintenance/card-images/imports/apply",
                  body: mappingBody(),
                })
              }
            >
              <ShieldCheck size={16} /> Import ausführen
            </button>
          </div>
        </section>

        <section style={twoColumns}>
          <article style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={h2}>Bildpaket prüfen und importieren</h2>
                <p style={subtle}>
                  Erkannte IMG07-Verzeichnispakete aus der Inbox. Die optionale
                  vollständige Prüfung verarbeitet alle Bilder, speichert aber
                  nichts.
                </p>
              </div>
              <label style={button}>
                <FileUp size={15} />
                {packUploadProgress
                  ? `Paket ${packUploadProgress.completed}/${packUploadProgress.total}`
                  : "Paketordner auswählen …"}
                <input
                  type="file"
                  multiple
                  hidden
                  disabled={Boolean(packUploadProgress) || activeJob}
                  {...({ webkitdirectory: "", directory: "" } as Record<
                    string,
                    string
                  >)}
                  onChange={(event) => {
                    const files = event.target.files;
                    event.target.value = "";
                    if (files) void uploadPackDirectory(files);
                  }}
                />
              </label>
            </div>
            <Field label="Bildpaket">
              <select
                style={input}
                value={pack}
                onChange={(event) => setPack(event.target.value)}
              >
                <option value="">Kein Paket erkannt</option>
                {packs.map((entry) => (
                  <option key={entry.relativePath} value={entry.relativePath}>
                    {entry.relativePath}
                  </option>
                ))}
              </select>
              {!packs.length ? (
                <span style={subtle}>
                  Kopiere den vollständigen Paketordner einschließlich Manifest,
                  mapping.csv und images-Verzeichnis in die Import-Inbox und
                  aktualisiere anschließend die Ansicht.
                </span>
              ) : null}
            </Field>
            <ConflictField
              value={packConflictMode}
              onChange={setPackConflictMode}
            />
            <div style={buttonRow}>
              <button
                type="button"
                style={button}
                disabled={!pack || activeJob}
                title={
                  !pack
                    ? "Zuerst ein erkanntes Bildpaket auswählen."
                    : undefined
                }
                onClick={() =>
                  void startJob(
                    "/api/storage/maintenance/card-images/packs/preview",
                    { pack, onExisting: packConflictMode },
                  ).catch((jobError) =>
                    setError(
                      errorMessage(jobError, "Paketprüfung fehlgeschlagen."),
                    ),
                  )
                }
              >
                <Package size={16} /> Vollständig prüfen
              </button>
              <button
                type="button"
                style={primaryButton}
                disabled={!pack || activeJob}
                title={
                  !pack
                    ? "Zuerst ein erkanntes Bildpaket auswählen."
                    : undefined
                }
                onClick={() =>
                  setSensitiveAction({
                    label:
                      "Der Paketimport prüft Manifest und Hashes erneut und ändert anschließend lokale Bildbindungen.",
                    path: "/api/storage/maintenance/card-images/packs/import",
                    body: { pack, onExisting: packConflictMode },
                  })
                }
              >
                <ShieldCheck size={16} /> Paket importieren
              </button>
            </div>
          </article>

          <article style={panel}>
            <div>
              <h2 style={h2}>Privates Bildpaket bauen</h2>
              <p style={subtle}>
                Ausgabe bleibt lokal unter{" "}
                <code>data/local-assets/card-image-packs/build</code>.
              </p>
            </div>
            <Field label="Profil">
              <select
                style={input}
                value={buildProfile}
                onChange={(event) =>
                  setBuildProfile(event.target.value as CardImageProfileId)
                }
              >
                <option value="originalset">Originalset</option>
                <option value="proteus">Proteus</option>
                <option value="classic">Classic</option>
              </select>
            </Field>
            <Field label="Vollständige Zuordnung">
              <select
                style={input}
                value={mapping}
                onChange={(event) => setMapping(event.target.value)}
              >
                <option value="">Keine CSV in der Inbox</option>
                {mappings.map((entry) => (
                  <option key={entry.relativePath} value={entry.relativePath}>
                    {entry.relativePath}
                  </option>
                ))}
              </select>
            </Field>
            <label style={checkField}>
              <input
                type="checkbox"
                checked={replaceBuild}
                onChange={(event) => setReplaceBuild(event.target.checked)}
              />
              Vorhandene lokale Paketausgabe ersetzen
            </label>
            <button
              type="button"
              style={primaryButton}
              disabled={!mapping || activeJob}
              onClick={() =>
                setSensitiveAction({
                  label:
                    "Der Paketbuild liest alle Profilbilder aus der Inbox und ersetzt die lokale Ausgabe nur bei gesetzter Option.",
                  path: "/api/storage/maintenance/card-images/packs/build",
                  body: {
                    mapping,
                    profileId: buildProfile,
                    replace: replaceBuild,
                  },
                })
              }
            >
              <Package size={16} /> Paket bauen
            </button>
          </article>
        </section>

        {job ? <JobPanel job={job} /> : null}
        {importReport ? <ImportReportPanel report={importReport} /> : null}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={field}>
      {label}
      {children}
    </label>
  );
}

function isUploadablePackFile(relativePath: string): boolean {
  return (
    relativePath === "netgrid-card-image-pack.json" ||
    relativePath === "mapping.csv" ||
    /^images\/[a-z0-9][a-z0-9_-]{0,191}\.(?:png|jpe?g|webp)$/i.test(
      relativePath,
    )
  );
}

function ConflictField({
  value,
  onChange,
}: {
  value: CardImageConflictMode;
  onChange: (value: CardImageConflictMode) => void;
}) {
  return (
    <Field label="Vorhandene Bindungen">
      <select
        style={input}
        value={value}
        onChange={(event) =>
          onChange(event.target.value as CardImageConflictMode)
        }
      >
        <option value="fail">Bei Konflikt abbrechen</option>
        <option value="skip">Vorhandene überspringen</option>
        <option value="replace">Vorhandene ersetzen</option>
      </select>
    </Field>
  );
}

function JobPanel({ job }: { job: CardImageMaintenanceJob }) {
  const percent = cardImageJobProgressPercent(job);
  const terminal = cardImageJobIsTerminal(job);
  return (
    <section style={panel} aria-live="polite">
      <div style={panelHeader}>
        <div style={headerTitle}>
          {job.status === "failed" ? (
            <XCircle size={20} color="#9b1c1c" />
          ) : job.status === "succeeded" ? (
            <CheckCircle2 size={20} color="#24704c" />
          ) : (
            <LoaderCircle size={20} />
          )}
          <div>
            <h2 style={h2}>Aktueller Kartenbildjob</h2>
            <p style={subtle}>
              {jobLabel(job.kind)} · {statusLabel(job.status)}
            </p>
          </div>
        </div>
        <code>{job.jobId}</code>
      </div>
      <div style={progressTrack}>
        <div style={{ ...progressFill, width: `${percent}%` }} />
      </div>
      <p style={subtle}>
        {phaseLabel(job.progress.phase)} · {job.progress.completed} /{" "}
        {job.progress.total || "?"}
        {job.progress.printingId ? ` · ${job.progress.printingId}` : ""}
      </p>
      {job.error ? <p style={errorBox}>{job.error.message}</p> : null}
      {terminal &&
      job.report?.schemaVersion ===
        "netgrid-card-image-pack-maintenance-report-v1" ? (
        <p style={successBox}>
          Paket {job.report.packId}: {job.report.operation} für{" "}
          {job.report.cardCount} Bilder abgeschlossen.
        </p>
      ) : null}
    </section>
  );
}

function ImportReportPanel({
  report,
}: {
  report: NonNullable<ReturnType<typeof importReportFromJob>>;
}) {
  return (
    <section style={panel}>
      <div>
        <h2 style={h2}>{report.dryRun ? "Prüfbericht" : "Importbericht"}</h2>
        <p style={subtle}>
          {report.selectedRows} ausgewählt · {report.summary.bound} neu ·{" "}
          {report.summary.replaced} ersetzt · {report.summary.skipped}{" "}
          übersprungen · {report.summary.unchanged} unverändert
        </p>
      </div>
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>printingId</th>
              <th style={th}>Datei</th>
              <th style={th}>Status</th>
              <th style={th}>Aufbereitung</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((result) => (
              <tr key={result.printingId}>
                <td style={td}>
                  <code>{result.printingId}</code>
                </td>
                <td style={td}>{result.sourceFileName}</td>
                <td style={td}>{result.status}</td>
                <td style={td}>
                  {imageFormatLabel(result.sourceMediaType)}{" "}
                  {result.sourceWidth}
                  {" × "}
                  {result.sourceHeight} → {imageFormatLabel(result.mediaType)}{" "}
                  {result.width}
                  {" × "}
                  {result.height}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function imageFormatLabel(
  mediaType: "image/png" | "image/jpeg" | "image/webp",
): string {
  if (mediaType === "image/png") return "PNG";
  if (mediaType === "image/jpeg") return "JPEG";
  return "WebP";
}

async function responsePayload<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message ?? fallback);
  return payload;
}

async function responseError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function profileLabel(profile: CardImageProfileId): string {
  if (profile === "originalset") return "Originalset";
  if (profile === "proteus") return "Proteus";
  return "Classic";
}

function jobLabel(kind: CardImageMaintenanceJob["kind"]): string {
  return {
    mapping_preview: "Zuordnung prüfen",
    mapping_import: "Zuordnung importieren",
    pack_preview: "Paket vollständig prüfen",
    pack_import: "Paket importieren",
    pack_build: "Paket bauen",
  }[kind];
}

function statusLabel(status: CardImageMaintenanceJob["status"]): string {
  return {
    queued: "wartet",
    running: "läuft",
    succeeded: "erfolgreich",
    failed: "fehlgeschlagen",
  }[status];
}

function phaseLabel(
  phase: CardImageMaintenanceJob["progress"]["phase"],
): string {
  return {
    preparing: "Bilder werden geprüft",
    storing: "Varianten werden gespeichert",
    validating: "Paketdateien werden geprüft",
    building: "Paket wird gebaut",
    importing: "Paket wird importiert",
  }[phase];
}

const pageShell: CSSProperties = {
  minHeight: "100vh",
  background: "#eef3f8",
  color: "#102033",
};
const page: CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "1.25rem",
  display: "grid",
  gap: "1rem",
};
const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "center",
  flexWrap: "wrap",
};
const headerTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};
const h1: CSSProperties = { margin: 0, fontSize: "1.55rem" };
const h2: CSSProperties = { margin: 0, fontSize: "1rem", color: "#0f2538" };
const subtle: CSSProperties = {
  margin: 0,
  color: "#42576b",
  fontSize: "0.9rem",
};
const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  border: "1px solid #9db0c3",
  background: "#fff",
  color: "#102033",
  borderRadius: 6,
  padding: "0.5rem 0.7rem",
  cursor: "pointer",
};
const primaryButton: CSSProperties = {
  ...button,
  borderColor: "#25679f",
  background: "#2f74b5",
  color: "#fff",
};
const linkButton: CSSProperties = { ...button, textDecoration: "none" };
const buttonRow: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};
const panel: CSSProperties = {
  border: "1px solid #c7d4e2",
  borderRadius: 8,
  padding: "0.9rem",
  background: "#fff",
  display: "grid",
  gap: "0.8rem",
};
const panelHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  alignItems: "center",
  flexWrap: "wrap",
};
const metricGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "0.75rem",
};
const metric: CSSProperties = {
  ...panel,
  gap: "0.25rem",
  minWidth: 0,
};
const metricLabel: CSSProperties = { color: "#42576b", fontSize: "0.82rem" };
const metricValue: CSSProperties = { fontSize: "1.35rem", color: "#0f2538" };
const formGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "0.65rem",
};
const twoColumns: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "0.75rem",
};
const field: CSSProperties = {
  display: "grid",
  gap: "0.3rem",
  color: "#42576b",
  fontSize: "0.83rem",
};
const checkField: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.88rem",
};
const input: CSSProperties = {
  minHeight: 36,
  border: "1px solid #9db0c3",
  borderRadius: 6,
  padding: "0.35rem 0.45rem",
  background: "#fff",
  color: "#102033",
};
const infoBox: CSSProperties = {
  margin: 0,
  border: "1px solid #9db0c3",
  background: "#f6fbff",
  color: "#153654",
  borderRadius: 8,
  padding: "0.75rem",
};
const errorBox: CSSProperties = {
  margin: 0,
  border: "1px solid #f3b5b5",
  background: "#fff5f5",
  color: "#9b1c1c",
  borderRadius: 8,
  padding: "0.75rem",
};
const successBox: CSSProperties = {
  margin: 0,
  border: "1px solid #9bc9b4",
  background: "#f3fbf7",
  color: "#155c3c",
  borderRadius: 8,
  padding: "0.75rem",
};
const progressTrack: CSSProperties = {
  height: 9,
  borderRadius: 999,
  overflow: "hidden",
  background: "#d8e4ef",
};
const progressFill: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#2f74b5",
  transition: "width 180ms ease",
};
const tableWrap: CSSProperties = { overflow: "auto", maxHeight: 460 };
const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 720,
};
const th: CSSProperties = {
  textAlign: "left",
  fontSize: "0.8rem",
  color: "#37506a",
  borderBottom: "1px solid #cbd5e1",
  padding: "0.45rem 0.5rem",
  position: "sticky",
  top: 0,
  background: "#fff",
};
const td: CSSProperties = {
  borderBottom: "1px solid #edf1f5",
  padding: "0.45rem 0.5rem",
  fontSize: "0.86rem",
};
