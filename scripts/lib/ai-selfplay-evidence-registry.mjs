import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

export const REGISTRY_SCHEMA_VERSION = 1;

const nowIso = () => new Date().toISOString();

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function json(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function resolveDefaultEvidenceDatabasePath(cwd = process.cwd()) {
  const configured = process.env.NETGRID_SELFPLAY_EVIDENCE_DB?.trim();
  if (configured) return resolve(configured);

  const commonGitDir = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd, encoding: "utf8" },
  ).trim();
  const primaryRoot = dirname(resolve(commonGitDir));
  return join(primaryRoot, "data", "local", "ai-selfplay-evidence.sqlite");
}

export function openEvidenceRegistry(databasePath) {
  const resolvedPath = resolve(databasePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  const db = new DatabaseSync(resolvedPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 15000");
  applySchema(db);
  return { db, databasePath: resolvedPath };
}

export async function backupEvidenceRegistry(db, outputPath) {
  const resolvedPath = resolve(outputPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  await backup(db, resolvedPath);
  return resolvedPath;
}

export function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS registry_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      job_id TEXT PRIMARY KEY,
      worktree_path TEXT,
      branch_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      last_heartbeat_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS id_allocations (
      kind TEXT NOT NULL CHECK (kind IN ('pairing', 'case')),
      value INTEGER NOT NULL,
      formatted_id TEXT NOT NULL UNIQUE,
      job_id TEXT,
      allocated_at TEXT NOT NULL,
      consumed_at TEXT,
      PRIMARY KEY (kind, value),
      FOREIGN KEY (job_id) REFERENCES jobs(job_id)
    );

    CREATE TABLE IF NOT EXISTS pairings (
      pairing_id TEXT PRIMARY KEY,
      job_id TEXT,
      status TEXT NOT NULL DEFAULT 'closed',
      title TEXT NOT NULL,
      review_date TEXT,
      status_text TEXT,
      selection_seed TEXT,
      source_commit TEXT,
      rules_profile TEXT,
      ai_mode TEXT,
      runner_deck_name TEXT,
      runner_deck_size INTEGER,
      runner_snapshot_id TEXT,
      runner_snapshot_hash TEXT,
      corp_deck_name TEXT,
      corp_deck_size INTEGER,
      corp_snapshot_id TEXT,
      corp_snapshot_hash TEXT,
      winner_analysis TEXT,
      loser_analysis TEXT,
      meta_analysis TEXT,
      reproduction_json TEXT NOT NULL DEFAULT '{}',
      full_review_markdown TEXT,
      legacy_source_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(job_id)
    );

    CREATE TABLE IF NOT EXISTS games (
      pairing_id TEXT NOT NULL,
      game_key TEXT NOT NULL,
      ordinal INTEGER,
      phase TEXT NOT NULL DEFAULT 'final',
      match_id TEXT,
      seed TEXT,
      state_hash TEXT,
      winner TEXT CHECK (winner IS NULL OR winner IN ('Runner', 'Corp', 'Draw', 'Aborted')),
      runner_match_points INTEGER,
      corp_match_points INTEGER,
      runner_agenda_points INTEGER,
      corp_agenda_points INTEGER,
      terminal_reason TEXT,
      decision_count INTEGER,
      flags_count INTEGER,
      result_text TEXT,
      before_after_text TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (pairing_id, game_key),
      FOREIGN KEY (pairing_id) REFERENCES pairings(pairing_id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS games_match_id_unique
      ON games(match_id) WHERE match_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS evidence_clusters (
      cluster_id TEXT PRIMARY KEY,
      capability TEXT NOT NULL,
      case_count INTEGER NOT NULL DEFAULT 0,
      suspicion_count INTEGER NOT NULL DEFAULT 0,
      confirmed_count INTEGER NOT NULL DEFAULT 0,
      fixed_count INTEGER NOT NULL DEFAULT 0,
      next_proof TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_cases (
      case_id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      side TEXT,
      match_context TEXT,
      symptom TEXT NOT NULL,
      owner_path TEXT,
      details_markdown TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (cluster_id) REFERENCES evidence_clusters(cluster_id)
    );

    CREATE TABLE IF NOT EXISTS case_pairings (
      case_id TEXT NOT NULL,
      pairing_id TEXT NOT NULL,
      PRIMARY KEY (case_id, pairing_id),
      FOREIGN KEY (case_id) REFERENCES evidence_cases(case_id) ON DELETE CASCADE,
      FOREIGN KEY (pairing_id) REFERENCES pairings(pairing_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fixes (
      fix_id TEXT PRIMARY KEY,
      pairing_id TEXT NOT NULL,
      case_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      commit_sha TEXT,
      owner_path TEXT,
      tests_json TEXT NOT NULL DEFAULT '[]',
      before_after_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (pairing_id) REFERENCES pairings(pairing_id) ON DELETE CASCADE,
      FOREIGN KEY (case_id) REFERENCES evidence_cases(case_id)
    );

    CREATE TABLE IF NOT EXISTS reporting_series (
      series_id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      interval INTEGER NOT NULL,
      unreported_pairing_ids_json TEXT NOT NULL DEFAULT '[]',
      last_reported_pairing_id TEXT,
      last_sent_at TEXT,
      pending_report_json TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      report_id TEXT PRIMARY KEY,
      series_id TEXT,
      covered_pairing_ids_json TEXT NOT NULL,
      recipient TEXT,
      subject TEXT,
      status TEXT NOT NULL CHECK (status IN ('generated', 'pending', 'sent', 'failed', 'legacy')),
      html_body TEXT NOT NULL,
      output_path TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (series_id) REFERENCES reporting_series(series_id)
    );

    CREATE TABLE IF NOT EXISTS legacy_sources (
      source_key TEXT PRIMARY KEY,
      source_path TEXT NOT NULL,
      content TEXT NOT NULL,
      imported_at TEXT NOT NULL
    );
  `);

  db.prepare(
    `
    INSERT INTO registry_meta(key, value) VALUES ('schema_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `,
  ).run(String(REGISTRY_SCHEMA_VERSION));
}

export function withImmediateTransaction(db, work) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the original failure.
    }
    throw error;
  }
}

export function registerJob(db, input) {
  if (!input?.jobId) throw new Error("jobId is required");
  const timestamp = input.timestamp ?? nowIso();
  db.prepare(
    `
    INSERT INTO jobs(job_id, worktree_path, branch_name, status, started_at, last_heartbeat_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(job_id) DO UPDATE SET
      worktree_path = excluded.worktree_path,
      branch_name = excluded.branch_name,
      status = excluded.status,
      last_heartbeat_at = excluded.last_heartbeat_at,
      completed_at = excluded.completed_at
  `,
  ).run(
    input.jobId,
    input.worktreePath ?? null,
    input.branchName ?? null,
    input.status ?? "active",
    input.startedAt ?? timestamp,
    timestamp,
    input.completedAt ?? null,
  );
}

export function completeJob(db, input) {
  const jobId = requireText(input?.jobId, "jobId");
  const status = input?.status ?? "completed";
  if (!["completed", "abandoned"].includes(status)) {
    throw new Error("job.status must be completed or abandoned");
  }
  const timestamp = input?.timestamp ?? nowIso();
  const result = db
    .prepare(
      `
      UPDATE jobs
      SET status = ?, last_heartbeat_at = ?, completed_at = ?
      WHERE job_id = ?
    `,
    )
    .run(status, timestamp, timestamp, jobId);
  if (result.changes !== 1) throw new Error(`Unknown job: ${jobId}`);
}

export function recordReport(db, input) {
  const reportId = requireText(input?.reportId, "report.reportId");
  const status = requireText(input?.status, "report.status");
  if (!["generated", "pending", "sent", "failed", "legacy"].includes(status)) {
    throw new Error("report.status is invalid");
  }
  const pairingIds = input.coveredPairingIds ?? [];
  const timestamp = nowIso();
  return withImmediateTransaction(db, () => {
    if (input.series) {
      const series = input.series;
      db.prepare(
        `
        INSERT INTO reporting_series(
          series_id, recipient, interval, unreported_pairing_ids_json,
          last_reported_pairing_id, last_sent_at, pending_report_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(series_id) DO UPDATE SET
          recipient = excluded.recipient,
          interval = excluded.interval,
          unreported_pairing_ids_json = excluded.unreported_pairing_ids_json,
          last_reported_pairing_id = excluded.last_reported_pairing_id,
          last_sent_at = excluded.last_sent_at,
          pending_report_json = excluded.pending_report_json,
          updated_at = excluded.updated_at
      `,
      ).run(
        requireText(series.id, "report.series.id"),
        requireText(series.recipient, "report.series.recipient"),
        Number(series.interval),
        json(series.unreportedPairingIds ?? []),
        series.lastReportedPairingId ?? null,
        series.lastSentAt ?? null,
        series.pendingReport ? json(series.pendingReport) : null,
        timestamp,
      );
    }
    db.prepare(
      `
      INSERT INTO reports(
        report_id, series_id, covered_pairing_ids_json, recipient, subject,
        status, html_body, output_path, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(report_id) DO UPDATE SET
        series_id = excluded.series_id,
        covered_pairing_ids_json = excluded.covered_pairing_ids_json,
        recipient = excluded.recipient,
        subject = excluded.subject,
        status = excluded.status,
        html_body = excluded.html_body,
        output_path = excluded.output_path,
        sent_at = excluded.sent_at
    `,
    ).run(
      reportId,
      input.series?.id ?? input.seriesId ?? null,
      json(pairingIds),
      input.recipient ?? input.series?.recipient ?? null,
      input.subject ?? null,
      status,
      requireText(input.htmlBody, "report.htmlBody"),
      input.outputPath ?? null,
      input.sentAt ?? null,
      input.createdAt ?? timestamp,
    );
    return reportId;
  });
}

export function allocateRegistryId(db, kind, jobId) {
  if (kind !== "pairing" && kind !== "case") {
    throw new Error("kind must be pairing or case");
  }
  return withImmediateTransaction(db, () => {
    const row = db
      .prepare(
        `
      SELECT MAX(value) AS max_value FROM id_allocations WHERE kind = ?
    `,
      )
      .get(kind);
    const tableMax =
      kind === "pairing"
        ? db
            .prepare(
              `SELECT MAX(CAST(pairing_id AS INTEGER)) AS max_value FROM pairings WHERE pairing_id GLOB '[0-9][0-9][0-9]'`,
            )
            .get()
        : db
            .prepare(
              `SELECT MAX(CAST(SUBSTR(case_id, 4) AS INTEGER)) AS max_value FROM evidence_cases WHERE case_id GLOB 'SP-[0-9][0-9][0-9]'`,
            )
            .get();
    const next =
      Math.max(Number(row?.max_value ?? 0), Number(tableMax?.max_value ?? 0)) +
      1;
    const formatted =
      kind === "pairing"
        ? String(next).padStart(3, "0")
        : `SP-${String(next).padStart(3, "0")}`;
    db.prepare(
      `
      INSERT INTO id_allocations(kind, value, formatted_id, job_id, allocated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(kind, next, formatted, jobId ?? null, nowIso());
    return formatted;
  });
}

function requireText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function importPairingBundle(db, bundle) {
  if (bundle?.schemaVersion !== 1)
    throw new Error("Unsupported pairing bundle schemaVersion");
  const pairing = bundle.pairing ?? {};
  const pairingId = requireText(pairing.id, "pairing.id");
  const title = requireText(pairing.title, "pairing.title");
  const timestamp = nowIso();

  return withImmediateTransaction(db, () => {
    if (pairing.jobId)
      registerJob(db, {
        jobId: pairing.jobId,
        worktreePath: pairing.worktreePath,
        branchName: pairing.branchName,
        status: pairing.jobStatus ?? "active",
        timestamp,
      });

    db.prepare(
      `
      INSERT INTO pairings(
        pairing_id, job_id, status, title, review_date, status_text,
        selection_seed, source_commit, rules_profile, ai_mode,
        runner_deck_name, runner_deck_size, runner_snapshot_id, runner_snapshot_hash,
        corp_deck_name, corp_deck_size, corp_snapshot_id, corp_snapshot_hash,
        winner_analysis, loser_analysis, meta_analysis, reproduction_json,
        full_review_markdown, legacy_source_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(pairing_id) DO UPDATE SET
        job_id = excluded.job_id,
        status = excluded.status,
        title = excluded.title,
        review_date = excluded.review_date,
        status_text = excluded.status_text,
        selection_seed = excluded.selection_seed,
        source_commit = excluded.source_commit,
        rules_profile = excluded.rules_profile,
        ai_mode = excluded.ai_mode,
        runner_deck_name = excluded.runner_deck_name,
        runner_deck_size = excluded.runner_deck_size,
        runner_snapshot_id = excluded.runner_snapshot_id,
        runner_snapshot_hash = excluded.runner_snapshot_hash,
        corp_deck_name = excluded.corp_deck_name,
        corp_deck_size = excluded.corp_deck_size,
        corp_snapshot_id = excluded.corp_snapshot_id,
        corp_snapshot_hash = excluded.corp_snapshot_hash,
        winner_analysis = excluded.winner_analysis,
        loser_analysis = excluded.loser_analysis,
        meta_analysis = excluded.meta_analysis,
        reproduction_json = excluded.reproduction_json,
        full_review_markdown = excluded.full_review_markdown,
        legacy_source_path = excluded.legacy_source_path,
        updated_at = excluded.updated_at
    `,
    ).run(
      pairingId,
      pairing.jobId ?? null,
      pairing.status ?? "closed",
      title,
      pairing.reviewDate ?? null,
      pairing.statusText ?? null,
      pairing.selectionSeed ?? null,
      pairing.sourceCommit ?? null,
      pairing.rulesProfile ?? null,
      pairing.aiMode ?? null,
      pairing.runner?.name ?? null,
      pairing.runner?.size ?? null,
      pairing.runner?.snapshotId ?? null,
      pairing.runner?.snapshotHash ?? null,
      pairing.corp?.name ?? null,
      pairing.corp?.size ?? null,
      pairing.corp?.snapshotId ?? null,
      pairing.corp?.snapshotHash ?? null,
      pairing.winnerAnalysis ?? null,
      pairing.loserAnalysis ?? null,
      pairing.metaAnalysis ?? null,
      json(pairing.reproduction ?? {}),
      pairing.fullReviewMarkdown ?? null,
      pairing.legacySourcePath ?? null,
      timestamp,
      timestamp,
    );

    db.prepare(`DELETE FROM games WHERE pairing_id = ?`).run(pairingId);
    const insertGame = db.prepare(`
      INSERT INTO games(
        pairing_id, game_key, ordinal, phase, match_id, seed, state_hash, winner,
        runner_match_points, corp_match_points, runner_agenda_points, corp_agenda_points,
        terminal_reason, decision_count, flags_count, result_text, before_after_text,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [index, game] of (bundle.games ?? []).entries()) {
      insertGame.run(
        pairingId,
        game.key ?? `game-${index + 1}`,
        game.ordinal ?? index + 1,
        game.phase ?? "final",
        game.matchId ?? null,
        game.seed ?? null,
        game.stateHash ?? null,
        game.winner ?? null,
        game.runnerMatchPoints ?? null,
        game.corpMatchPoints ?? null,
        game.runnerAgendaPoints ?? null,
        game.corpAgendaPoints ?? null,
        game.terminalReason ?? null,
        game.decisionCount ?? null,
        game.flagsCount ?? null,
        game.resultText ?? null,
        game.beforeAfterText ?? null,
        json(game.metadata ?? {}),
      );
    }

    for (const cluster of bundle.clusters ?? [])
      upsertCluster(db, cluster, timestamp);
    for (const evidenceCase of bundle.cases ?? [])
      upsertCase(db, evidenceCase, timestamp);
    for (const fix of bundle.fixes ?? [])
      upsertFix(db, pairingId, fix, timestamp);

    db.prepare(
      `
      UPDATE id_allocations SET consumed_at = COALESCE(consumed_at, ?)
      WHERE kind = 'pairing' AND formatted_id = ?
    `,
    ).run(timestamp, pairingId);

    return pairingId;
  });
}

function upsertCluster(db, cluster, timestamp = nowIso()) {
  db.prepare(
    `
    INSERT INTO evidence_clusters(
      cluster_id, capability, case_count, suspicion_count, confirmed_count,
      fixed_count, next_proof, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(cluster_id) DO UPDATE SET
      capability = excluded.capability,
      case_count = excluded.case_count,
      suspicion_count = excluded.suspicion_count,
      confirmed_count = excluded.confirmed_count,
      fixed_count = excluded.fixed_count,
      next_proof = excluded.next_proof,
      updated_at = excluded.updated_at
  `,
  ).run(
    requireText(cluster.id, "cluster.id"),
    requireText(cluster.capability, "cluster.capability"),
    cluster.caseCount ?? 0,
    cluster.suspicionCount ?? 0,
    cluster.confirmedCount ?? 0,
    cluster.fixedCount ?? 0,
    cluster.nextProof ?? null,
    timestamp,
  );
}

function upsertCase(db, evidenceCase, timestamp = nowIso()) {
  const caseId = requireText(evidenceCase.id, "case.id");
  const clusterId = requireText(evidenceCase.clusterId, "case.clusterId");
  const existing = db
    .prepare(`SELECT cluster_id, side FROM evidence_cases WHERE case_id = ?`)
    .get(caseId);
  if (existing && existing.cluster_id !== clusterId) {
    throw new Error(
      `Case ${caseId} already belongs to cluster ${existing.cluster_id}; refusing reassignment to ${clusterId}`,
    );
  }
  if (
    existing?.side &&
    evidenceCase.side &&
    existing.side !== evidenceCase.side
  ) {
    throw new Error(
      `Case ${caseId} already belongs to side ${existing.side}; refusing reassignment to ${evidenceCase.side}`,
    );
  }
  db.prepare(
    `
    INSERT INTO evidence_cases(
      case_id, cluster_id, grade, side, match_context, symptom, owner_path,
      details_markdown, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(case_id) DO UPDATE SET
      cluster_id = excluded.cluster_id,
      grade = excluded.grade,
      side = COALESCE(excluded.side, evidence_cases.side),
      match_context = excluded.match_context,
      symptom = excluded.symptom,
      owner_path = excluded.owner_path,
      details_markdown = excluded.details_markdown,
      updated_at = excluded.updated_at
  `,
  ).run(
    caseId,
    clusterId,
    requireText(evidenceCase.grade, "case.grade"),
    evidenceCase.side ?? null,
    evidenceCase.matchContext ?? null,
    requireText(evidenceCase.symptom, "case.symptom"),
    evidenceCase.ownerPath ?? null,
    evidenceCase.detailsMarkdown ?? null,
    timestamp,
  );
  const insert = db.prepare(
    `INSERT OR IGNORE INTO case_pairings(case_id, pairing_id) VALUES (?, ?)`,
  );
  const pairingIds = new Set(evidenceCase.pairingIds ?? []);
  const matchReferences =
    `${evidenceCase.matchContext ?? ""}\n${evidenceCase.detailsMarkdown ?? ""}`.match(
      /match_[a-zA-Z0-9]+/g,
    ) ?? [];
  const pairingForMatch = db.prepare(
    `SELECT pairing_id FROM games WHERE match_id = ?`,
  );
  for (const matchId of matchReferences) {
    const row = pairingForMatch.get(matchId);
    if (row?.pairing_id) pairingIds.add(row.pairing_id);
  }
  for (const pairingId of pairingIds) {
    if (
      db.prepare(`SELECT 1 FROM pairings WHERE pairing_id = ?`).get(pairingId)
    ) {
      insert.run(caseId, pairingId);
    }
  }
  db.prepare(
    `
    UPDATE id_allocations SET consumed_at = COALESCE(consumed_at, ?)
    WHERE kind = 'case' AND formatted_id = ?
  `,
  ).run(timestamp, caseId);
}

function upsertFix(db, pairingId, fix, timestamp = nowIso()) {
  db.prepare(
    `
    INSERT INTO fixes(
      fix_id, pairing_id, case_id, title, description, commit_sha, owner_path,
      tests_json, before_after_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(fix_id) DO UPDATE SET
      pairing_id = excluded.pairing_id,
      case_id = excluded.case_id,
      title = excluded.title,
      description = excluded.description,
      commit_sha = excluded.commit_sha,
      owner_path = excluded.owner_path,
      tests_json = excluded.tests_json,
      before_after_json = excluded.before_after_json
  `,
  ).run(
    requireText(fix.id, "fix.id"),
    pairingId,
    fix.caseId ?? null,
    requireText(fix.title, "fix.title"),
    fix.description ?? null,
    fix.commitSha ?? null,
    fix.ownerPath ?? null,
    json(fix.tests ?? []),
    json(fix.beforeAfter ?? {}),
    timestamp,
  );
}

function section(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)?.[0].length ?? 2;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

function allMarkdownTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (
      !lines[index].trim().startsWith("|") ||
      !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[index + 1])
    )
      continue;
    const headers = splitTableRow(lines[index]);
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      const values = splitTableRow(lines[index]);
      const row = {};
      headers.forEach((header, headerIndex) => {
        row[cleanMarkdown(header)] = cleanMarkdown(values[headerIndex] ?? "");
      });
      rows.push(row);
      index += 1;
    }
    tables.push({ headers: headers.map(cleanMarkdown), rows });
  }
  return tables;
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseListValue(block, label) {
  const lines = block.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    new RegExp(`^- ${label}:`, "i").test(line.trim()),
  );
  if (start < 0) return null;
  const values = [
    lines[start].replace(new RegExp(`^- ${label}:\\s*`, "i"), ""),
  ];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^- [A-ZÄÖÜa-zäöü]/.test(lines[index])) break;
    if (lines[index].trim().length === 0) break;
    values.push(lines[index].trim());
  }
  return values.join(" ").trim();
}

function parseDeck(value) {
  if (!value) return {};
  const backticks = [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  const boldName = value.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
  const hash = backticks.find((item) => /^(?:fnv1a|sha256):/i.test(item));
  const snapshotId = backticks.find(
    (item) => item !== hash && !/^[0-9a-f]{7,40}$/i.test(item),
  );
  let name = boldName;
  if (!name && hash) {
    const afterHash = value.slice(
      value.indexOf(`\`${hash}\``) + hash.length + 2,
    );
    name = cleanMarkdown(afterHash.replace(/^\s*,\s*/, ""));
  }
  return {
    name: name || cleanMarkdown(value.split(",")[0]),
    size: Number(value.match(/(\d+)\s+Karten/i)?.[1]) || null,
    snapshotId: snapshotId ?? null,
    snapshotHash: hash ?? null,
    sourceText: value,
  };
}

function parseResult(resultText, agendaText) {
  const result = cleanMarkdown(resultText);
  const orderMatch = result.match(
    /\b(Runner|Corp)\s+(\d+)\s*[–-]\s*(\d+)\s+(Runner|Corp)\b/i,
  );
  const winnerOnly = result.match(/^\s*(Runner|Corp)\b/i)?.[1];
  const parsed = {
    winner: winnerOnly
      ? `${winnerOnly[0].toUpperCase()}${winnerOnly.slice(1).toLowerCase()}`
      : null,
    runnerMatchPoints: null,
    corpMatchPoints: null,
    runnerAgendaPoints: null,
    corpAgendaPoints: null,
  };
  if (orderMatch) {
    const firstSide = orderMatch[1].toLowerCase();
    const first = Number(orderMatch[2]);
    const second = Number(orderMatch[3]);
    parsed.runnerMatchPoints = firstSide === "runner" ? first : second;
    parsed.corpMatchPoints = firstSide === "corp" ? first : second;
    const agenda = cleanMarkdown(agendaText).match(/(\d+)\s*:\s*(\d+)/);
    if (agenda) {
      parsed.runnerAgendaPoints =
        firstSide === "runner" ? Number(agenda[1]) : Number(agenda[2]);
      parsed.corpAgendaPoints =
        firstSide === "corp" ? Number(agenda[1]) : Number(agenda[2]);
    }
  }
  if (/Abbruch|nicht terminal/i.test(result)) parsed.winner = "Aborted";
  return parsed;
}

function parseReviewGames(markdown, seeds) {
  const tables = allMarkdownTables(markdown);
  const resultTable = tables.find(
    (table) =>
      table.headers.includes("Endergebnis") && table.headers.includes("Partie"),
  );
  const matchPairs = [
    ...markdown.matchAll(/`(match_[a-zA-Z0-9]+)`\s*\/\s*`([^`]+)`/g),
  ].map((match) => ({ matchId: match[1], stateHash: match[2] }));
  if (resultTable) {
    return resultTable.rows.map((row, index) => {
      const result = parseResult(row.Endergebnis, row.Agendapunkte);
      const inlineMatch = row.Partie?.match(/match_[a-zA-Z0-9]+/)?.[0];
      return {
        key: `seed-${index + 1}`,
        ordinal: index + 1,
        phase: "final",
        matchId: inlineMatch ?? matchPairs[index]?.matchId ?? null,
        seed: seeds[index] ?? null,
        stateHash: matchPairs[index]?.stateHash ?? null,
        ...result,
        terminalReason: row.Ende || null,
        decisionCount: Number(row.Entscheidungen) || null,
        flagsCount: /FLAGS=0/i.test(markdown) ? 0 : null,
        resultText: row.Endergebnis,
        metadata: row,
      };
    });
  }

  const legacyTable = tables.find(
    (table) =>
      table.headers.includes("Match") && table.headers.includes("Ergebnis"),
  );
  if (!legacyTable) return [];
  return legacyTable.rows.map((row, index) => {
    const parsed = parseResult(row.Ergebnis, row.Agendapunkte);
    const matchId = row.Match?.match(/match_[a-zA-Z0-9]+/)?.[0] ?? null;
    return {
      key: `legacy-${index + 1}`,
      ordinal: index + 1,
      phase: /final/i.test(row.Stand ?? "") ? "final" : "intermediate",
      matchId,
      seed: seeds[index] ?? seeds[0] ?? null,
      stateHash: row["finaler StateHash"] || null,
      ...parsed,
      terminalReason: row.Ergebnis || null,
      decisionCount: Number(row.Aktionen) || null,
      resultText: row.Ergebnis,
      metadata: row,
    };
  });
}

function parsePairingReferences(text) {
  const values = new Set();
  for (const match of text.matchAll(
    /(?:Zyklus|Zyklen|Paarung(?:en)?)\s+([0-9]{3}(?:\s*[,–-]\s*[0-9]{3}|\s+und\s+[0-9]{3})*)/gi,
  )) {
    for (const number of match[1].matchAll(/\d{3}/g)) values.add(number[0]);
  }
  return [...values].sort();
}

export function parseLegacyReview(reviewPath, markdown) {
  const pairingId = reviewPath.match(/cycle-(\d{3})-review\.md$/i)?.[1];
  if (!pairingId)
    throw new Error(`Cannot derive pairing id from ${reviewPath}`);
  const title = cleanMarkdown(
    markdown.match(/^#\s+(.+)$/m)?.[1] ?? `KI-Selbstspielzyklus ${pairingId}`,
  );
  const reviewDate = markdown.match(/^Stand:\s*(.+)$/m)?.[1]?.trim() ?? null;
  const statusText =
    markdown
      .match(/^Status:\s*([^\n]+(?:\n(?!\n|##)[^\n]+)*)/m)?.[1]
      ?.replace(/\n/g, " ")
      .trim() ?? null;
  const reproduction = section(markdown, /^## Reproduktionsvertrag\s*$/i) ?? "";
  const selectionSeed =
    cleanMarkdown(
      parseListValue(reproduction, "Auswahlseed") ??
        parseListValue(reproduction, "Seed") ??
        "",
    ) || null;
  const sourceCommit =
    cleanMarkdown(parseListValue(reproduction, "Ausgangsstand") ?? "").match(
      /[0-9a-f]{7,40}/i,
    )?.[0] ?? null;
  const rulesProfile =
    cleanMarkdown(parseListValue(reproduction, "Regelprofil") ?? "") || null;
  const runner = parseDeck(parseListValue(reproduction, "Runner"));
  const corp = parseDeck(parseListValue(reproduction, "Corp"));
  const seedsBlock = parseListValue(reproduction, "Spielseeds") ?? "";
  const seeds = [...seedsBlock.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  if (seeds.length === 0 && selectionSeed) seeds.push(selectionSeed);
  const winnerAnalysis = section(
    markdown,
    /^## (?:Analyse des (?:finalen )?Gewinners|Gewinneranalyse.*)$/i,
  );
  const loserAnalysis = section(
    markdown,
    /^## (?:Warum .* verlor|Verliereranalyse.*)$/i,
  );
  const metaAnalysis =
    section(markdown, /^## Gewinner-, Verlierer- und Metaanalyse\s*$/i) ??
    section(markdown, /^## Zyklusübergreifende Einordnung\s*$/i);

  return {
    schemaVersion: 1,
    pairing: {
      id: pairingId,
      status: "closed",
      title,
      reviewDate,
      statusText,
      selectionSeed,
      sourceCommit,
      rulesProfile,
      aiMode: /harte KI/i.test(rulesProfile ?? "")
        ? "hard"
        : /normale KI/i.test(rulesProfile ?? "")
          ? "normal"
          : null,
      runner,
      corp,
      winnerAnalysis,
      loserAnalysis,
      metaAnalysis,
      reproduction: { seeds, sourceText: reproduction },
      fullReviewMarkdown: markdown,
      legacySourcePath: reviewPath,
    },
    games: parseReviewGames(markdown, seeds),
  };
}

export function parseLegacyMatrix(markdown) {
  const tables = allMarkdownTables(markdown);
  const clusterTable = tables.find(
    (table) =>
      table.headers.includes("Cluster") && table.headers.includes("Fähigkeit"),
  );
  const caseTable = tables.find(
    (table) =>
      table.headers.includes("Fall") && table.headers.includes("Evidenzgrad"),
  );
  const clusterRows = clusterTable?.rows ?? [];
  const caseRows = caseTable?.rows ?? [];
  const clusters = clusterRows.map((row) => ({
    id: row.Cluster,
    capability: row.Fähigkeit,
    caseCount: Number(row.Fälle) || 0,
    suspicionCount: Number(row.Verdacht) || 0,
    confirmedCount: Number(row.Bestätigt) || 0,
    fixedCount: Number(row["Behoben/verifiziert"]) || 0,
    nextProof: row["Nächste Verdichtung"] || null,
  }));
  const cases = caseRows.map((row) => {
    const caseId = row.Fall;
    const details = section(
      markdown,
      new RegExp(`^## ${caseId.replace("-", "\\-")}\\s+`, "i"),
    );
    const context = row["Match und Entscheidungen"] ?? "";
    return {
      id: caseId,
      clusterId: row.Cluster,
      grade: row.Evidenzgrad,
      side: row.Seite || null,
      matchContext: context || null,
      symptom: row.Symptom,
      ownerPath: row["Zuständiger Pfad"] || null,
      detailsMarkdown: details,
      pairingIds: parsePairingReferences(`${context}\n${details ?? ""}`),
    };
  });
  return { clusters, cases };
}

function importLegacySource(db, sourceKey, sourcePath, content) {
  db.prepare(
    `
    INSERT INTO legacy_sources(source_key, source_path, content, imported_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(source_key) DO UPDATE SET
      source_path = excluded.source_path,
      content = excluded.content,
      imported_at = excluded.imported_at
  `,
  ).run(sourceKey, sourcePath, content, nowIso());
}

export function importLegacyArtifacts(db, input) {
  const reviewFiles = readdirSync(input.reviewsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /^ai-selfplay-cycle-\d{3}-review\.md$/i.test(entry.name),
    )
    .map((entry) => join(input.reviewsDir, entry.name))
    .sort();
  const reviewMatchPairings = new Map();
  const reviewCasePairings = new Map();

  for (const reviewPath of reviewFiles) {
    const markdown = readFileSync(reviewPath, "utf8");
    const bundle = parseLegacyReview(reviewPath, markdown);
    importPairingBundle(db, bundle);
    for (const matchId of markdown.match(/match_[a-zA-Z0-9]+/g) ?? []) {
      reviewMatchPairings.set(matchId, bundle.pairing.id);
    }
    for (const caseId of markdown.match(/SP-\d{3}/g) ?? []) {
      const pairings = reviewCasePairings.get(caseId) ?? new Set();
      pairings.add(bundle.pairing.id);
      reviewCasePairings.set(caseId, pairings);
    }
    importLegacySource(
      db,
      `review:${reviewPath.split(/[\\/]/).at(-1)}`,
      reviewPath,
      markdown,
    );
  }

  const matrixMarkdown = readFileSync(input.matrixPath, "utf8");
  const matrix = parseLegacyMatrix(matrixMarkdown);
  withImmediateTransaction(db, () => {
    const timestamp = nowIso();
    for (const cluster of matrix.clusters)
      upsertCluster(db, cluster, timestamp);
    for (const evidenceCase of matrix.cases)
      upsertCase(db, evidenceCase, timestamp);
    const link = db.prepare(
      `INSERT OR IGNORE INTO case_pairings(case_id, pairing_id) VALUES (?, ?)`,
    );
    for (const evidenceCase of matrix.cases) {
      const linkedPairings = new Set(
        reviewCasePairings.get(evidenceCase.id) ?? [],
      );
      const matchText = `${evidenceCase.matchContext ?? ""}\n${evidenceCase.detailsMarkdown ?? ""}`;
      for (const matchId of matchText.match(/match_[a-zA-Z0-9]+/g) ?? []) {
        const pairingId = reviewMatchPairings.get(matchId);
        if (pairingId) linkedPairings.add(pairingId);
      }
      for (const pairingId of linkedPairings)
        link.run(evidenceCase.id, pairingId);
    }
    const upsertLegacyFix = db.prepare(`
      INSERT INTO fixes(
        fix_id, pairing_id, case_id, title, description, commit_sha, owner_path,
        tests_json, before_after_json, created_at
      )
      SELECT
        'legacy:' || c.case_id,
        (SELECT MAX(cp.pairing_id) FROM case_pairings cp WHERE cp.case_id = c.case_id),
        c.case_id,
        c.symptom,
        c.symptom,
        NULL,
        c.owner_path,
        '[]',
        '{}',
        c.updated_at
      FROM evidence_cases c
      WHERE c.case_id = ?
        AND LOWER(c.grade) = 'behoben/verifiziert'
        AND EXISTS (SELECT 1 FROM case_pairings cp WHERE cp.case_id = c.case_id)
      ON CONFLICT(fix_id) DO UPDATE SET
        pairing_id = excluded.pairing_id,
        case_id = excluded.case_id,
        title = excluded.title,
        description = excluded.description,
        owner_path = excluded.owner_path
    `);
    for (const evidenceCase of matrix.cases) {
      upsertLegacyFix.run(evidenceCase.id);
    }
    importLegacySource(db, "matrix", input.matrixPath, matrixMarkdown);
  });

  if (input.reportingStatePath) {
    const raw = readFileSync(input.reportingStatePath, "utf8");
    const state = JSON.parse(raw);
    db.prepare(
      `
      INSERT INTO reporting_series(
        series_id, recipient, interval, unreported_pairing_ids_json,
        last_reported_pairing_id, last_sent_at, pending_report_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(series_id) DO UPDATE SET
        recipient = excluded.recipient,
        interval = excluded.interval,
        unreported_pairing_ids_json = excluded.unreported_pairing_ids_json,
        last_reported_pairing_id = excluded.last_reported_pairing_id,
        last_sent_at = excluded.last_sent_at,
        pending_report_json = excluded.pending_report_json,
        updated_at = excluded.updated_at
    `,
    ).run(
      state.seriesId,
      state.recipient,
      state.interval,
      json(state.unreportedCycleIds ?? []),
      state.lastReportedCycleId ?? null,
      state.lastSentAt ?? null,
      state.pendingReport ? json(state.pendingReport) : null,
      nowIso(),
    );
    importLegacySource(db, "reporting-state", input.reportingStatePath, raw);
  }

  let reportCount = 0;
  if (input.reportsDir) {
    const reportFiles = readdirSync(input.reportsDir, {
      withFileTypes: true,
    }).filter(
      (entry) =>
        entry.isFile() &&
        /^ai-selfplay-(?:block-\d{3}-\d{3}|cycle-\d{3})-report\.html$/i.test(
          entry.name,
        ),
    );
    const insert = db.prepare(`
      INSERT INTO reports(
        report_id, series_id, covered_pairing_ids_json, recipient, subject,
        status, html_body, output_path, sent_at, created_at
      ) VALUES (?, NULL, ?, NULL, NULL, 'legacy', ?, ?, NULL, ?)
      ON CONFLICT(report_id) DO UPDATE SET
        covered_pairing_ids_json = excluded.covered_pairing_ids_json,
        html_body = excluded.html_body,
        output_path = excluded.output_path
    `);
    for (const entry of reportFiles) {
      const path = join(input.reportsDir, entry.name);
      const range = entry.name.match(/block-(\d{3})-(\d{3})/i);
      const single = entry.name.match(/cycle-(\d{3})/i);
      const ids = range
        ? Array.from(
            { length: Number(range[2]) - Number(range[1]) + 1 },
            (_, index) => String(Number(range[1]) + index).padStart(3, "0"),
          )
        : single
          ? [single[1]]
          : [];
      insert.run(
        entry.name.replace(/\.html$/i, ""),
        json(ids),
        readFileSync(path, "utf8"),
        path,
        nowIso(),
      );
      reportCount += 1;
    }
  }

  return {
    pairings: reviewFiles.length,
    clusters: matrix.clusters.length,
    cases: matrix.cases.length,
    reports: reportCount,
  };
}

export function registryStatus(db) {
  const count = (table) =>
    Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
  const openCases = Number(
    db
      .prepare(
        `
    SELECT COUNT(*) AS count FROM evidence_cases
    WHERE LOWER(grade) IN ('verdacht', 'bestätigt')
  `,
      )
      .get().count,
  );
  const lastPairing = db
    .prepare(`SELECT MAX(CAST(pairing_id AS INTEGER)) AS value FROM pairings`)
    .get().value;
  return {
    schemaVersion: Number(
      db
        .prepare(`SELECT value FROM registry_meta WHERE key = 'schema_version'`)
        .get().value,
    ),
    pairings: count("pairings"),
    games: count("games"),
    clusters: count("evidence_clusters"),
    cases: count("evidence_cases"),
    openCases,
    fixes: count("fixes"),
    reports: count("reports"),
    jobs: count("jobs"),
    lastPairingId:
      lastPairing == null ? null : String(lastPairing).padStart(3, "0"),
  };
}

export function registryCheck(db, options = {}) {
  const integrity = db
    .prepare(`PRAGMA integrity_check`)
    .all()
    .map((row) => row.integrity_check);
  const foreignKeyIssues = db.prepare(`PRAGMA foreign_key_check`).all();
  const activeJobs = db
    .prepare(
      `SELECT job_id, last_heartbeat_at, worktree_path, branch_name FROM jobs WHERE status = 'active' ORDER BY last_heartbeat_at`,
    )
    .all();
  const pendingReports = db
    .prepare(
      `SELECT report_id, series_id, created_at FROM reports WHERE status = 'pending' ORDER BY created_at`,
    )
    .all();
  const openReportingSeries = db
    .prepare(
      `
      SELECT series_id, unreported_pairing_ids_json, pending_report_json, updated_at
      FROM reporting_series
      WHERE unreported_pairing_ids_json <> '[]' OR pending_report_json IS NOT NULL
      ORDER BY updated_at
    `,
    )
    .all();
  const legacySources = options.verifyLegacySources
    ? db
        .prepare(
          `SELECT source_key, source_path, content FROM legacy_sources ORDER BY source_key`,
        )
        .all()
        .map((source) => {
          const exists = existsSync(source.source_path);
          return {
            sourceKey: source.source_key,
            sourcePath: source.source_path,
            exists,
            matches:
              exists &&
              readFileSync(source.source_path, "utf8") === source.content,
          };
        })
    : [];
  const legacySourceIssues = legacySources.filter(
    (source) => !source.exists || !source.matches,
  );
  return {
    ok:
      integrity.length === 1 &&
      integrity[0] === "ok" &&
      foreignKeyIssues.length === 0 &&
      activeJobs.length === 0 &&
      pendingReports.length === 0 &&
      openReportingSeries.length === 0 &&
      legacySourceIssues.length === 0,
    integrity,
    foreignKeyIssues,
    activeJobs,
    pendingReports,
    openReportingSeries,
    legacySourcesChecked: legacySources.length,
    legacySourceIssues,
  };
}

export function getStoredReport(db, reportId) {
  const row =
    reportId === "latest"
      ? db
          .prepare(
            `
            SELECT * FROM reports
            WHERE status = 'sent'
            ORDER BY COALESCE(sent_at, created_at) DESC, created_at DESC
            LIMIT 1
          `,
          )
          .get()
      : db.prepare(`SELECT * FROM reports WHERE report_id = ?`).get(reportId);
  if (!row) throw new Error(`Unknown report: ${reportId}`);
  return {
    ...row,
    covered_pairing_ids_json: parseJson(row.covered_pairing_ids_json, []),
  };
}

export function exportEvidenceSnapshot(db, pairingIds = []) {
  const ids = pairingIds.map(String);
  const clause =
    ids.length > 0
      ? `WHERE pairing_id IN (${ids.map(() => "?").join(",")})`
      : "";
  const pairings = db
    .prepare(
      `SELECT * FROM pairings ${clause} ORDER BY CAST(pairing_id AS INTEGER)`,
    )
    .all(...ids);
  const games =
    ids.length > 0
      ? db
          .prepare(
            `SELECT * FROM games WHERE pairing_id IN (${ids.map(() => "?").join(",")}) ORDER BY CAST(pairing_id AS INTEGER), ordinal`,
          )
          .all(...ids)
      : db
          .prepare(
            `SELECT * FROM games ORDER BY CAST(pairing_id AS INTEGER), ordinal`,
          )
          .all();
  const clusters = db
    .prepare(`SELECT * FROM evidence_clusters ORDER BY cluster_id`)
    .all();
  const cases = db
    .prepare(
      `
    SELECT c.*, GROUP_CONCAT(cp.pairing_id) AS pairing_ids
    FROM evidence_cases c
    LEFT JOIN case_pairings cp ON cp.case_id = c.case_id
    GROUP BY c.case_id
    ORDER BY c.case_id
  `,
    )
    .all();
  const fixes =
    ids.length > 0
      ? db
          .prepare(
            `SELECT * FROM fixes WHERE pairing_id IN (${ids.map(() => "?").join(",")}) ORDER BY fix_id`,
          )
          .all(...ids)
      : db.prepare(`SELECT * FROM fixes ORDER BY fix_id`).all();
  return {
    schemaVersion: REGISTRY_SCHEMA_VERSION,
    generatedAt: nowIso(),
    pairings: pairings.map((row) => ({
      ...row,
      reproduction_json: parseJson(row.reproduction_json, {}),
    })),
    games: games.map((row) => ({
      ...row,
      metadata_json: parseJson(row.metadata_json, {}),
    })),
    clusters,
    cases: cases.map((row) => ({
      ...row,
      pairing_ids: row.pairing_ids?.split(",") ?? [],
    })),
    fixes: fixes.map((row) => ({
      ...row,
      tests_json: parseJson(row.tests_json, []),
      before_after_json: parseJson(row.before_after_json, {}),
    })),
  };
}
