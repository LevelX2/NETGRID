import { pathToFileURL } from "node:url";
import { createConfiguredAccountAuth } from "./http-server";

export async function runAccountAuthCli(
  args = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const [command, loginName, ...displayParts] = normalizedArgs;
  const auth = createConfiguredAccountAuth(env);
  try {
    if (command === "bootstrap") {
      const password = env.NETGRID_ACCOUNT_BOOTSTRAP_PASSWORD;
      if (!loginName || displayParts.length === 0 || !password) {
        throw new Error(
          "usage: account:auth -- bootstrap <loginName> <displayName>; Passwort über NETGRID_ACCOUNT_BOOTSTRAP_PASSWORD setzen",
        );
      }
      const created = await auth.bootstrapAdmin({
        loginName,
        displayName: displayParts.join(" "),
        password,
        deviceLabel: "local-bootstrap",
      });
      console.log(
        JSON.stringify({ ok: true, account: created.account }, null, 2),
      );
      return 0;
    }
    if (command === "invite") {
      if (!loginName || displayParts.length === 0)
        throw new Error(
          "usage: account:auth -- invite <loginName> <displayName>",
        );
      const created = await auth.createInvite({
        loginName,
        displayName: displayParts.join(" "),
      });
      console.log(JSON.stringify({ ok: true, ...created }, null, 2));
      return 0;
    }
    if (command === "reset") {
      if (!loginName)
        throw new Error("usage: account:auth -- reset <loginName>");
      const created = await auth.createResetToken({ loginName });
      if (!created) throw new Error("account_not_found");
      console.log(JSON.stringify({ ok: true, ...created }, null, 2));
      return 0;
    }
    throw new Error("usage: account:auth -- <bootstrap|invite|reset> ...");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "account_auth_cli_failed",
    );
    return 1;
  } finally {
    auth.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = await runAccountAuthCli();
}
