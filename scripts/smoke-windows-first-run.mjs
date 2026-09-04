import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const releaseRoot = requiredPath("--release");
const firstRunSource = requiredPath("--first-run");
const nodeSource = requiredPath("--node");
const scratch = mkdtempSync(path.join(tmpdir(), "ng-first-run-"));

try {
  const programRoot = path.join(scratch, "program");
  const dataRoot = path.join(scratch, "data");
  const nodePath = path.join(programRoot, "runtime", "node", "node.exe");
  const cliPath = path.join(programRoot, "app", "maintenance-auth.mjs");
  const firstRunPath = path.join(programRoot, "NETGRID.FirstRun.exe");
  const environmentPath = path.join(dataRoot, "config", "runtime.env");
  for (const directory of [
    path.dirname(nodePath),
    path.dirname(cliPath),
    path.dirname(environmentPath),
  ])
    mkdirSync(directory, { recursive: true });
  copyFileSync(nodeSource, nodePath);
  copyFileSync(path.join(releaseRoot, "app", "maintenance-auth.mjs"), cliPath);
  copyFileSync(firstRunSource, firstRunPath);
  writeFileSync(
    environmentPath,
    [
      "NODE_ENV=production",
      `NETGRID_DATA_ROOT="${dataRoot}"`,
      "NETGRID_TOKEN_SALT=first-run-smoke-token-salt",
      "NETGRID_ACCOUNT_ACCESS_MODE=protected",
      "",
    ].join("\r\n"),
    "utf8",
  );

  const common = [
    "--program-root",
    programRoot,
    "--environment",
    environmentPath,
  ];
  expectExit(firstRunPath, ["--status", ...common], 1);
  const password = "sicheres First-Run Passwort 2026";
  expectExit(firstRunPath, ["--bootstrap-stdin", ...common], 0, {
    input: `${password}\n${password}\n`,
  });
  const authPath = path.join(dataRoot, "runtime", "maintenance", "auth.json");
  if (!existsSync(authPath) || !statSync(authPath).isFile())
    throw new Error("first_run_auth_missing");
  const firstRecord = readFileSync(authPath, "utf8");
  if (
    firstRecord.includes(password) ||
    !firstRecord.includes('"algorithm": "scrypt"')
  )
    throw new Error("first_run_auth_not_hashed");
  expectExit(firstRunPath, ["--status", ...common], 0);

  const replacement = "anderes Passwort darf nicht ersetzen";
  expectExit(firstRunPath, ["--bootstrap-stdin", ...common], 2, {
    input: `${replacement}\n${replacement}\n`,
  });
  if (readFileSync(authPath, "utf8") !== firstRecord)
    throw new Error("first_run_existing_auth_overwritten");
  process.stdout.write(
    "WINDOWS_FIRST_RUN_SMOKE_OK existingCredentialPreserved=true\n",
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

function expectExit(command, args, expected, options = {}) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    windowsHide: true,
    timeout: 70_000,
  });
  if (result.error) throw result.error;
  if (result.status !== expected)
    throw new Error(
      `first_run_command_failed:${result.status}:${result.stderr?.trim() ?? ""}`,
    );
}

function requiredPath(name) {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`first_run_argument_missing:${name}`);
  return path.resolve(value);
}
