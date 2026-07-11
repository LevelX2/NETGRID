import { readFileSync } from "node:fs";
import {
  JsonFileMaintenanceCredentialStore,
  MaintenanceAuthService,
  maintenanceAuthPathFromEnv,
} from "./maintenance-auth";

type CliIo = {
  write(message: string): void;
  writeError(message: string): void;
};

export async function runMaintenanceAuthCli(
  args: string[],
  stdin: string,
  env: NodeJS.ProcessEnv = process.env,
  io: CliIo = {
    write: (message) => process.stdout.write(message),
    writeError: (message) => process.stderr.write(message),
  },
): Promise<number> {
  const command = args[0];
  const store = new JsonFileMaintenanceCredentialStore(
    maintenanceAuthPathFromEnv(env),
  );
  const service = new MaintenanceAuthService(store);

  if (command === "status") {
    io.write(
      `${JSON.stringify({ initialized: await service.isInitialized() })}\n`,
    );
    return 0;
  }

  if (command !== "bootstrap" && command !== "reset") {
    io.writeError(
      "Verwendung: maintenance:auth <status|bootstrap|reset> [--password-stdin]\n",
    );
    return 2;
  }
  if (!args.includes("--password-stdin")) {
    io.writeError(
      "Das Passwort muss zweimal über Standardeingabe übergeben werden; Kommandozeilen-Passwörter sind nicht zulässig.\n",
    );
    return 2;
  }
  const [password, confirmation] = stdin.replace(/\r/g, "").split("\n");
  if (!password || password !== confirmation) {
    io.writeError(
      "Die beiden Passworteingaben fehlen oder stimmen nicht überein.\n",
    );
    return 2;
  }
  try {
    if (command === "bootstrap") await service.bootstrapPassword(password);
    else await service.resetPassword(password);
    io.write(
      `${JSON.stringify({ ok: true, initialized: true, sessionsRevoked: true })}\n`,
    );
    return 0;
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "maintenance_auth_failed";
    io.writeError(`${JSON.stringify({ ok: false, error: code })}\n`);
    return 1;
  }
}

if (
  process.argv[1]?.endsWith("maintenance-auth-cli.ts") ||
  process.argv[1]?.endsWith("maintenance-auth-cli.js")
) {
  const stdin = process.argv.includes("--password-stdin")
    ? readFileSync(0, "utf8")
    : "";
  process.exitCode = await runMaintenanceAuthCli(process.argv.slice(2), stdin);
}
